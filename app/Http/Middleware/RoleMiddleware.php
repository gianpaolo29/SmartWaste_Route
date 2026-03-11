<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Usage: ->middleware('role:ADMIN') or ->middleware('role:ADMIN,COLLECTOR')
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            abort(401, 'Unauthenticated.');
        }

        if (!in_array($user->role, $roles, true)) {
            abort(403, 'Forbidden. Insufficient role.');
        }

        return $next($request);
    }
}
