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
                return ['paths' => [], 'bounds' => null];
            }

            $hit = collect($res->json())->first(function ($r) {
                return ($r['class'] ?? null) === 'boundary'
                    || str_contains(strtolower($r['display_name'] ?? ''), 'tuy');
            });

            if (! $hit || empty($hit['geojson'])) {
                return ['paths' => [], 'bounds' => null];
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
}
