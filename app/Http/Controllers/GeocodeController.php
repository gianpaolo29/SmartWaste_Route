<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class GeocodeController extends Controller
{
    public function reverse(Request $request)
    {
        $data = $request->validate([
            'lat' => ['required', 'numeric', 'between:-90,90'],
            'lng' => ['required', 'numeric', 'between:-180,180'],
        ]);

        $lat = $data['lat'];
        $lng = $data['lng'];

        // Cache to reduce Nominatim calls (important)
        $cacheKey = 'revgeo:'.round($lat, 5).':'.round($lng, 5);

        return Cache::remember($cacheKey, now()->addDays(7), function () use ($lat, $lng) {
            $res = Http::withHeaders([
                // Nominatim policy requires a valid User-Agent with contact
                'User-Agent' => 'SmartWasteRoute/1.0 (admin@yourdomain.com)',
            ])
                ->timeout(10)
                ->get('https://nominatim.openstreetmap.org/reverse', [
                    'format' => 'jsonv2',
                    'lat' => $lat,
                    'lon' => $lng,
                    'zoom' => 18,
                    'addressdetails' => 1,
                ])
                ->throw()
                ->json();

            $addr = $res['address'] ?? [];

            return response()->json([
                'display_name' => $res['display_name'] ?? null,
                'road' => $addr['road'] ?? null,
                'suburb' => $addr['suburb'] ?? null,
                'village' => $addr['village'] ?? null,
                'city' => $addr['city'] ?? ($addr['town'] ?? ($addr['municipality'] ?? null)),
                'province' => $addr['state'] ?? null,
                'raw' => $addr,
            ]);
        });
    }
}
