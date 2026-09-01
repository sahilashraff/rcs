<?php

use App\Http\Controllers\Api\AdminOnboardingRequestController;
use App\Http\Controllers\Api\AdminSettingController;
use App\Http\Controllers\Api\AgentController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BrandingController;
use App\Http\Controllers\Api\CarrierAgentController;
use App\Http\Controllers\Api\CarrierController;
use App\Http\Controllers\Api\FeatureController;
use App\Http\Controllers\Api\FileDownloadController;
use App\Http\Controllers\Api\OnboardingController;
use App\Http\Controllers\Api\PingController;
use App\Http\Controllers\Api\SubAccountController;
use App\Http\Controllers\Api\TenantAgentController;
use App\Http\Controllers\Api\TenantController;
use Illuminate\Support\Facades\Route;

Route::get('/branding', [BrandingController::class, 'index']);

Route::post('/sign-in', [AuthController::class, 'signIn']);
Route::post('/sign-up', [AuthController::class, 'signUp']);
Route::post('/otp/verify', [AuthController::class, 'verifyOtp']);
Route::post('/otp/resend', [AuthController::class, 'resendOtp']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);
Route::middleware('auth:sanctum')->post('/sign-out', [AuthController::class, 'signOut']);
Route::middleware('auth:sanctum')->get('/user', [AuthController::class, 'me']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/features', [FeatureController::class, 'index']);

    Route::middleware('can:access-feature,"permissions"')->get('/permissions/ping', [PingController::class, 'permissions']);
    Route::middleware('can:access-feature,"agents"')->get('/agents', [TenantAgentController::class, 'index']);

    Route::post('/onboarding', [OnboardingController::class, 'store']);
    Route::get('/onboarding/mine', [OnboardingController::class, 'mine']);

    Route::get('/files/{fileUpload}/download', FileDownloadController::class);

    Route::middleware('is-owner')->group(function () {
        Route::get('/sub-accounts', [SubAccountController::class, 'index']);
        Route::post('/sub-accounts', [SubAccountController::class, 'store']);
        Route::put('/sub-accounts/{user}/permissions', [SubAccountController::class, 'updatePermissions']);
    });

    Route::middleware('is-admin')->group(function () {
        Route::get('/admin/ping', [PingController::class, 'admin']);
        Route::get('/admin/tenants', [TenantController::class, 'index']);
        Route::post('/admin/tenants', [TenantController::class, 'store']);
        Route::post('/admin/tenants/{tenant}/send-reset-link', [TenantController::class, 'sendResetLink']);
        Route::patch('/admin/tenants/{tenant}/storage', [TenantController::class, 'updateStorage']);
        Route::get('/admin/carriers', [CarrierController::class, 'index']);
        Route::post('/admin/carriers', [CarrierController::class, 'store']);
        Route::put('/admin/carriers/{carrier}', [CarrierController::class, 'update']);
        Route::get('/admin/agents', [AgentController::class, 'index']);
        Route::post('/admin/tenants/{tenant}/agents', [AgentController::class, 'store']);
        Route::patch('/admin/agents/{agent}', [AgentController::class, 'update']);
        Route::delete('/admin/agents/{agent}', [AgentController::class, 'destroy']);
        Route::post('/admin/agents/{agent}/transition', [CarrierAgentController::class, 'transition']);
        Route::get('/admin/onboarding-requests', [AdminOnboardingRequestController::class, 'index']);
        Route::get('/admin/onboarding-requests/{onboardingRequest}', [AdminOnboardingRequestController::class, 'show']);
        Route::post('/admin/onboarding-requests/{onboardingRequest}/approve', [AdminOnboardingRequestController::class, 'approve']);
        Route::post('/admin/onboarding-requests/{onboardingRequest}/reject', [AdminOnboardingRequestController::class, 'reject']);
        Route::get('/admin/settings', [AdminSettingController::class, 'index']);
        Route::put('/admin/settings', [AdminSettingController::class, 'update']);
        Route::get('/admin/settings/timezones', [AdminSettingController::class, 'timezones']);
        Route::post('/admin/settings/general', [AdminSettingController::class, 'updateGeneral']);
        Route::put('/admin/settings/localisation', [AdminSettingController::class, 'updateLocalisation']);
        Route::put('/admin/settings/file-manager', [AdminSettingController::class, 'updateFileManager']);
        Route::post('/admin/settings/notification-sound', [AdminSettingController::class, 'updateNotificationSound']);
    });
});
