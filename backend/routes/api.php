<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\FeatureController;
use App\Http\Controllers\Api\PingController;
use App\Http\Controllers\Api\SubAccountController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/sign-in', [AuthController::class, 'signIn']);
Route::middleware('auth:sanctum')->post('/sign-out', [AuthController::class, 'signOut']);

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/features', [FeatureController::class, 'index']);

    Route::middleware('can:access-feature,"permissions"')->get('/permissions/ping', [PingController::class, 'permissions']);

    Route::middleware('is-owner')->group(function () {
        Route::get('/sub-accounts', [SubAccountController::class, 'index']);
        Route::post('/sub-accounts', [SubAccountController::class, 'store']);
        Route::put('/sub-accounts/{user}/permissions', [SubAccountController::class, 'updatePermissions']);
    });
});
