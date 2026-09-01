<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FileUpload;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class FileDownloadController extends Controller
{
    /**
     * The one download route for every private FileUpload, replacing
     * what used to be a bespoke per-feature download endpoint
     * (onboarding's documents/{field} route). Public-disk files never
     * hit this — they're served directly via their url attribute.
     */
    public function __invoke(Request $request, FileUpload $fileUpload)
    {
        $user = $request->user();
        $canAccess = $user->is_admin || ($fileUpload->tenant_id && $fileUpload->tenant_id === $user->tenant_id);

        abort_unless($canAccess, 403);
        abort_if($fileUpload->disk === 'public', 404);

        return Storage::disk($fileUpload->disk)->download($fileUpload->path, $fileUpload->original_name);
    }
}
