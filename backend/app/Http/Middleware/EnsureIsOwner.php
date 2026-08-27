<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureIsOwner
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()?->is_owner) {
            abort(403, 'Owner access required.');
        }

        return $next($request);
    }
}
