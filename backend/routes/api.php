<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/sign-in', [AuthController::class, 'signIn']);
Route::middleware('auth:sanctum')->post('/sign-out', [AuthController::class, 'signOut']);

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
