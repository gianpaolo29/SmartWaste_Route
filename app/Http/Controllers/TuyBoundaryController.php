<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class TuyBoundaryController extends Controller
{
    public function __invoke()
    {
        $data = Cache::rememberForever('tuy_boundary_geojson', function () {
            $res = Http::withHeaders([
                'User-Agent' => 'SmartWasteRoute/1.0 (admin tool)',
            ])->get('https://nominatim.openstreetmap.org/search', [
                'q' => 'Tuy, Batangas, Philippines',
                'format' => 'json',
                'polygon_geojson' => 1,
                'limit' => 1,
            ]);

            if (! $res->successful()) {
                return self::fallbackBoundary();
            }

            $hit = collect($res->json())->first(function ($r) {
                return ($r['class'] ?? null) === 'boundary'
                    || str_contains(strtolower($r['display_name'] ?? ''), 'tuy');
            });

            if (! $hit || empty($hit['geojson'])) {
                return self::fallbackBoundary();
            }

            $geo = $hit['geojson'];
            $paths = [];

            // Normalize Polygon / MultiPolygon to an array of ring paths
            if ($geo['type'] === 'Polygon') {
                foreach ($geo['coordinates'] as $ring) {
                    $paths[] = array_map(fn ($c) => ['lat' => $c[1], 'lng' => $c[0]], $ring);
                }
            } elseif ($geo['type'] === 'MultiPolygon') {
                foreach ($geo['coordinates'] as $polygon) {
                    foreach ($polygon as $ring) {
                        $paths[] = array_map(fn ($c) => ['lat' => $c[1], 'lng' => $c[0]], $ring);
                    }
                }
            }

            // boundingbox from Nominatim: [south, north, west, east]
            $bb = $hit['boundingbox'] ?? null;
            $bounds = $bb ? [
                'south' => (float) $bb[0],
                'north' => (float) $bb[1],
                'west' => (float) $bb[2],
                'east' => (float) $bb[3],
            ] : null;

            return ['paths' => $paths, 'bounds' => $bounds];
        });

        return response()->json($data);
    }

    /**
     * Approximate boundary of Tuy, Batangas if Nominatim is unavailable.
     */
    private static function fallbackBoundary(): array
    {
        // Approximate polygon for Tuy, Batangas derived from OpenStreetMap
        $path = [
            ['lat' => 14.050, 'lng' => 120.680],
            ['lat' => 14.055, 'lng' => 120.710],
            ['lat' => 14.048, 'lng' => 120.745],
            ['lat' => 14.040, 'lng' => 120.755],
            ['lat' => 14.020, 'lng' => 120.760],
            ['lat' => 14.000, 'lng' => 120.755],
            ['lat' => 13.985, 'lng' => 120.750],
            ['lat' => 13.970, 'lng' => 120.740],
            ['lat' => 13.958, 'lng' => 120.730],
            ['lat' => 13.952, 'lng' => 120.715],
            ['lat' => 13.955, 'lng' => 120.700],
            ['lat' => 13.960, 'lng' => 120.688],
            ['lat' => 13.970, 'lng' => 120.680],
            ['lat' => 13.985, 'lng' => 120.678],
            ['lat' => 14.000, 'lng' => 120.680],
            ['lat' => 14.020, 'lng' => 120.678],
            ['lat' => 14.035, 'lng' => 120.675],
            ['lat' => 14.050, 'lng' => 120.680],
        ];

        return [
            'paths' => [$path],
            'bounds' => [
                'south' => 13.952,
                'north' => 14.055,
                'west' => 120.675,
                'east' => 120.760,
            ],
        ];
    }
}
