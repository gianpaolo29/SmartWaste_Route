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

        $cacheKey = 'revgeo:'.round($lat, 5).':'.round($lng, 5);

        $cached = Cache::get($cacheKey);
        if ($cached) {
            return $cached;
        }

        // Retry up to 3 times with increasing delay for rate limits
        $lastError = null;
        for ($attempt = 1; $attempt <= 3; $attempt++) {
            try {
                $res = Http::withHeaders([
                    'User-Agent' => 'SmartWasteRoute/1.0 (smartwaste@tuy.gov.ph)',
                ])
                    ->timeout(10)
                    ->get('https://nominatim.openstreetmap.org/reverse', [
                        'format' => 'jsonv2',
                        'lat' => $lat,
                        'lon' => $lng,
                        'zoom' => 18,
                        'addressdetails' => 1,
                    ]);

                if ($res->status() === 429) {
                    $lastError = 'Rate limited';
                    sleep($attempt); // Wait 1s, 2s, 3s
                    continue;
                }

                if ($res->failed()) {
                    $lastError = 'API error: '.$res->status();
                    continue;
                }

                $body = $res->json();
                $addr = $body['address'] ?? [];

                $result = response()->json([
                    'display_name' => $body['display_name'] ?? null,
                    'road' => $addr['road'] ?? null,
                    'suburb' => $addr['suburb'] ?? null,
                    'village' => $addr['village'] ?? null,
                    'city' => $addr['city'] ?? ($addr['town'] ?? ($addr['municipality'] ?? null)),
                    'province' => $addr['state'] ?? null,
                    'raw' => $addr,
                ]);

                Cache::put($cacheKey, $result, now()->addDays(7));

                return $result;
            } catch (\Exception $e) {
                $lastError = $e->getMessage();
                if ($attempt < 3) {
                    sleep($attempt);
                }
            }
        }

        // All retries failed — return a graceful fallback
        return response()->json([
            'display_name' => 'Tuy, Batangas, Philippines',
            'road' => null,
            'suburb' => null,
            'village' => null,
            'city' => 'Tuy',
            'province' => 'Batangas',
            'raw' => [],
            'error' => 'Geocoding temporarily unavailable. Please enter your address manually.',
        ]);
    }
}
