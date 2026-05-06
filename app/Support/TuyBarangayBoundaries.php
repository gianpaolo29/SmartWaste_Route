<?php

namespace App\Support;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TuyBarangayBoundaries
{
    /**
     * Approximate centroids for barangays covered by SmartWaste Route.
     * Tuy, Batangas (23 barangays) + Bucana, Nasugbu.
     */
    public const CENTROIDS = [
        // Tuy, Batangas
        'Acle'            => [13.9740, 120.7000],
        'Bayudbud'        => [13.9920, 120.6960],
        'Bolbok'          => [14.0150, 120.7180],
        'Burol'           => [14.0080, 120.7080],
        'Dao'             => [13.9870, 120.7060],
        'Dalima'          => [14.0030, 120.6970],
        'Guinhawa'        => [13.9820, 120.6920],
        'Luna'            => [14.0090, 120.7370],
        'Luntal'          => [13.9900, 120.7280],
        'Magahis'         => [14.0420, 120.7470],
        'Malibu'          => [13.9700, 120.7160],
        'Mataas Na Bayan' => [13.9990, 120.7330],
        'Palincaro'       => [14.0050, 120.7250],
        'Patugo'          => [13.9760, 120.7090],
        'Poblacion'       => [13.9989, 120.7297],
        'Putol'           => [14.0180, 120.7380],
        'Putingkahoy'     => [14.0240, 120.7320],
        'Sabang'          => [13.9920, 120.7400],
        'San Jose'        => [14.0030, 120.7150],
        'San Pedro'       => [13.9850, 120.7350],
        'Talon'           => [14.0110, 120.7250],
        'Toong'           => [13.9650, 120.7250],
        'Tuyon-Tuyon'     => [13.9580, 120.7090],
        // Nasugbu, Batangas
        'Bucana'          => [14.0694, 120.6278],
    ];

    /**
     * Get boundary for a barangay — tries cached real boundary first, then Nominatim, then falls back to hexagon.
     */
    public static function forName(string $name): ?array
    {
        // Find centroid — try exact match first, then contains match
        $centroid = null;
        $matchedKey = null;
        $nameLower = strtolower(trim($name));

        // Exact match (case-insensitive)
        foreach (self::CENTROIDS as $key => $coords) {
            if (strtolower($key) === $nameLower) {
                $centroid = $coords;
                $matchedKey = $key;
                break;
            }
        }

        // Fuzzy match: DB name contains centroid key or vice versa
        if (!$centroid) {
            foreach (self::CENTROIDS as $key => $coords) {
                $keyLower = strtolower($key);
                if (str_contains($nameLower, $keyLower) || str_contains($keyLower, $nameLower)) {
                    $centroid = $coords;
                    $matchedKey = $key;
                    break;
                }
            }
        }

        if (! $centroid) {
            return null;
        }

        [$lat, $lng] = $centroid;

        // Try loading cached real boundary
        $cacheFile = storage_path('app/barangay_boundaries/'.md5(strtolower($matchedKey)).'.json');

        if (file_exists($cacheFile)) {
            $cached = json_decode(file_get_contents($cacheFile), true);
            if ($cached && ! empty($cached['paths'])) {
                return $cached;
            }
        }

        // Try fetching from Nominatim (OSM)
        $boundary = self::fetchFromNominatim($matchedKey, $lat, $lng);

        if ($boundary) {
            // Cache for future use
            $dir = dirname($cacheFile);
            if (! is_dir($dir)) {
                mkdir($dir, 0755, true);
            }
            file_put_contents($cacheFile, json_encode($boundary));

            return $boundary;
        }

        // Fallback: hexagon
        return [
            'paths' => [self::hexagon($lat, $lng)],
            'center' => ['lat' => $lat, 'lng' => $lng],
            'radius_m' => 500,
        ];
    }

    /** Map barangay name to its municipality */
    private static function municipalityFor(string $name): string
    {
        $nasugbu = ['Bucana'];
        return in_array($name, $nasugbu, true) ? 'Nasugbu, Batangas' : 'Tuy, Batangas';
    }

    /**
     * Fetch real boundary polygon from Nominatim (OpenStreetMap).
     */
    private static function fetchFromNominatim(string $name, float $lat, float $lng): ?array
    {
        try {
            $response = Http::timeout(10)
                ->withHeaders(['User-Agent' => 'SmartWasteRoute/1.0'])
                ->get('https://nominatim.openstreetmap.org/search', [
                    'q' => "Barangay {$name}, " . self::municipalityFor($name) . ", Philippines",
                    'format' => 'json',
                    'polygon_geojson' => 1,
                    'limit' => 1,
                    'addressdetails' => 1,
                ]);

            if (! $response->successful()) {
                return null;
            }

            $results = $response->json();

            if (empty($results)) {
                return null;
            }

            $result = $results[0];
            $geojson = $result['geojson'] ?? null;

            if (! $geojson) {
                return null;
            }

            $paths = self::geojsonToPaths($geojson);

            if (empty($paths)) {
                return null;
            }

            // Calculate center from the polygon
            $center = self::polygonCenter($paths[0]);

            return [
                'paths' => $paths,
                'center' => $center ?? ['lat' => $lat, 'lng' => $lng],
            ];
        } catch (\Exception $e) {
            Log::warning("Failed to fetch boundary for {$name}: ".$e->getMessage());

            return null;
        }
    }

    /**
     * Convert GeoJSON geometry to array of paths (lat/lng arrays).
     */
    private static function geojsonToPaths(array $geojson): array
    {
        $type = $geojson['type'] ?? '';
        $coords = $geojson['coordinates'] ?? [];

        if ($type === 'Polygon' && ! empty($coords)) {
            // Polygon: coordinates is [ [ring1], [ring2], ... ]
            return [self::coordsToLatLng($coords[0])];
        }

        if ($type === 'MultiPolygon' && ! empty($coords)) {
            // MultiPolygon: coordinates is [ [ [ring1], ... ], [ [ring1], ... ], ... ]
            // Use the largest polygon
            $largest = null;
            $maxLen = 0;
            foreach ($coords as $polygon) {
                if (! empty($polygon[0]) && count($polygon[0]) > $maxLen) {
                    $maxLen = count($polygon[0]);
                    $largest = $polygon[0];
                }
            }

            return $largest ? [self::coordsToLatLng($largest)] : [];
        }

        if ($type === 'LineString' && ! empty($coords)) {
            return [self::coordsToLatLng($coords)];
        }

        return [];
    }

    /**
     * Convert GeoJSON coordinate pairs [lng, lat] to [{lat, lng}].
     */
    private static function coordsToLatLng(array $coords): array
    {
        return array_map(fn ($c) => [
            'lat' => $c[1],
            'lng' => $c[0],
        ], $coords);
    }

    /**
     * Calculate the centroid of a polygon.
     */
    private static function polygonCenter(array $path): ?array
    {
        if (empty($path)) {
            return null;
        }

        $latSum = 0;
        $lngSum = 0;
        $count = count($path);

        foreach ($path as $point) {
            $latSum += $point['lat'];
            $lngSum += $point['lng'];
        }

        return [
            'lat' => $latSum / $count,
            'lng' => $lngSum / $count,
        ];
    }

    /**
     * Fallback: hexagonal polygon around a centroid.
     */
    public static function hexagon(float $lat, float $lng, float $radius = 0.0045): array
    {
        $points = [];
        for ($i = 0; $i < 6; $i++) {
            $angle = deg2rad(60 * $i + 30);
            $points[] = [
                'lat' => $lat + $radius * sin($angle),
                'lng' => $lng + $radius * cos($angle) / cos(deg2rad($lat)),
            ];
        }
        $points[] = $points[0];

        return $points;
    }
}
