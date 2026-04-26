<?php

namespace App\Support;

class TuyBarangayBoundaries
{
    /**
     * Approximate centroids for the 23 barangays of Tuy, Batangas.
     * Names should match exactly what's stored in the `barangays.name` column.
     * Adjust coordinates here to fine-tune positions.
     */
    public const CENTROIDS = [
        'Acle'           => [13.9740, 120.7000],
        'Bayudbud'       => [13.9920, 120.6960],
        'Bolbok'         => [14.0150, 120.7180],
        'Burol'          => [14.0080, 120.7080],
        'Dao'            => [13.9870, 120.7060],
        'Dalima'         => [14.0030, 120.6970],
        'Guinhawa'       => [13.9820, 120.6920],
        'Luna'           => [14.0090, 120.7370],
        'Luntal'         => [13.9900, 120.7280],
        'Magahis'        => [14.0420, 120.7470],
        'Malibu'         => [13.9700, 120.7160],
        'Mataas Na Bayan'=> [13.9990, 120.7330],
        'Palincaro'      => [14.0050, 120.7250],
        'Patugo'         => [13.9760, 120.7090],
        'Poblacion'      => [13.9989, 120.7297],
        'Putol'          => [14.0180, 120.7380],
        'Putingkahoy'    => [14.0240, 120.7320],
        'Sabang'         => [13.9920, 120.7400],
        'San Jose'       => [14.0030, 120.7150],
        'San Pedro'      => [13.9850, 120.7350],
        'Talon'          => [14.0110, 120.7250],
        'Toong'          => [13.9650, 120.7250],
        'Tuyon-Tuyon'    => [13.9580, 120.7090],
    ];

    /**
     * Build a small hexagonal polygon around a centroid, in lat/lng pairs.
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
        // Close the ring
        $points[] = $points[0];
        return $points;
    }

    public static function forName(string $name): ?array
    {
        // Case-insensitive match
        foreach (self::CENTROIDS as $key => $coords) {
            if (strcasecmp($key, $name) === 0) {
                [$lat, $lng] = $coords;
                return [
                    'paths' => [self::hexagon($lat, $lng)],
                    'center' => ['lat' => $lat, 'lng' => $lng],
                    'radius_m' => 500, // ~500 meter radius circle
                ];
            }
        }
        return null;
    }
}
