<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppSetting;
use App\Models\FileUpload;
use App\Support\FileUploadService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class FileController extends Controller
{
    /**
     * List all file_manager files belonging to the authenticated tenant.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $query = FileUpload::with('user')
            ->where('purpose', 'file_manager');

        if ($user->tenant_id) {
            $query->where('tenant_id', $user->tenant_id);
        } else {
            $query->where('user_id', $user->id);
        }

        $files = $query->orderBy('created_at', 'desc')->get();

        $formatted = $files->map(fn (FileUpload $file) => $this->formatFile($file));

        return response()->json([
            'data' => $formatted,
        ]);
    }

    /**
     * Upload one or multiple files through the centralized FileUploadService.
     * Enforces allowed extensions and tenant-wide storage quotas.
     */
    public function store(Request $request, FileUploadService $fileUploadService)
    {
        $request->validate([
            'files' => ['required', 'array', 'min:1'],
            'files.*' => ['required', 'file'],
        ]);

        $user = $request->user();
        $tenant = $user->tenant;

        // 1. Allowed extensions validation from settings
        $allowedExtensionsStr = AppSetting::get('file_manager_allowed_extensions', 'jpg,jpeg,png,pdf,docx,xls,xlsx,csv,txt,zip');
        $allowedExtensions = array_map('strtolower', array_filter(array_map('trim', explode(',', $allowedExtensionsStr))));

        $uploadedFiles = $request->file('files');
        foreach ($uploadedFiles as $uploadedFile) {
            $ext = strtolower($uploadedFile->getClientOriginalExtension());
            if (! empty($allowedExtensions) && ! in_array($ext, $allowedExtensions, true)) {
                throw ValidationException::withMessages([
                    'files' => ["The file type '.{$ext}' is not allowed. Allowed types: " . implode(', ', $allowedExtensions)],
                ]);
            }
        }

        // 2. Reject an exact duplicate of a file this tenant already has
        // in File Manager — every upload here is its own free-standing
        // entry (no folders to distinguish "the same file in two
        // places"), so re-uploading identical content is always a
        // duplicate, not a legitimate second copy.
        foreach ($uploadedFiles as $uploadedFile) {
            $duplicate = $fileUploadService->findDuplicate($uploadedFile, 'file_manager', $user->tenant_id);
            if ($duplicate) {
                throw ValidationException::withMessages([
                    'files' => ["'{$uploadedFile->getClientOriginalName()}' is already uploaded as '{$duplicate->original_name}'."],
                ]);
            }
        }

        // 3. Storage quota validation across all tenant file_uploads
        $maxStorageMb = (int) ($tenant?->max_storage_mb ?? AppSetting::get('file_manager_max_storage_mb', 1024));
        $maxStorageBytes = $maxStorageMb * 1024 * 1024;

        $currentUsageBytes = (int) FileUpload::where('tenant_id', $user->tenant_id)->sum('size');
        $incomingBytes = collect($uploadedFiles)->sum(fn ($f) => $f->getSize());

        if (($currentUsageBytes + $incomingBytes) > $maxStorageBytes) {
            $usedMb = round($currentUsageBytes / (1024 * 1024), 2);
            throw ValidationException::withMessages([
                'files' => ["Storage quota exceeded. Used: {$usedMb} MB / {$maxStorageMb} MB limit."],
            ]);
        }

        // 4. Store files via FileUploadService
        $storedRecords = [];
        foreach ($uploadedFiles as $uploadedFile) {
            $stored = $fileUploadService->store(
                $uploadedFile,
                'file_manager',
                null,
                'public',
                $user->id,
                $user->tenant_id,
            );
            $stored->load('user');
            $storedRecords[] = $this->formatFile($stored);
        }

        return response()->json([
            'data' => $storedRecords,
            'message' => count($storedRecords) . ' file(s) uploaded successfully.',
        ], 201);
    }

    /**
     * Rename a file (original_name).
     */
    public function update(Request $request, FileUpload $fileUpload)
    {
        $this->authorizeFileAccess($request, $fileUpload);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $fileUpload->original_name = $data['name'];
        $fileUpload->save();
        $fileUpload->load('user');

        return response()->json([
            'data' => $this->formatFile($fileUpload),
            'message' => 'File renamed successfully.',
        ]);
    }

    /**
     * Delete file from database and physical disk storage via FileUploadService.
     */
    public function destroy(Request $request, FileUpload $fileUpload, FileUploadService $fileUploadService)
    {
        $this->authorizeFileAccess($request, $fileUpload);

        $fileUploadService->delete($fileUpload);

        return response()->json([
            'status' => 'ok',
            'message' => 'File deleted successfully.',
        ]);
    }

    /**
     * Retrieve tenant storage quota and current usage metrics.
     */
    public function storageUsage(Request $request)
    {
        $user = $request->user();
        $tenant = $user->tenant;

        $maxStorageMb = (int) ($tenant?->max_storage_mb ?? AppSetting::get('file_manager_max_storage_mb', 1024));
        $maxStorageBytes = $maxStorageMb * 1024 * 1024;

        $totalUsedBytes = (int) FileUpload::where('tenant_id', $user->tenant_id)->sum('size');
        $fileCount = (int) FileUpload::where('tenant_id', $user->tenant_id)->where('purpose', 'file_manager')->count();

        $percentage = $maxStorageBytes > 0 ? min(100, round(($totalUsedBytes / $maxStorageBytes) * 100, 1)) : 0;

        return response()->json([
            'data' => [
                'used_bytes' => $totalUsedBytes,
                'max_storage_mb' => $maxStorageMb,
                'max_storage_bytes' => $maxStorageBytes,
                'used_percentage' => $percentage,
                'file_count' => $fileCount,
            ],
        ]);
    }

    private function authorizeFileAccess(Request $request, FileUpload $fileUpload): void
    {
        $user = $request->user();
        $canAccess = $user->is_admin || ($fileUpload->tenant_id && $fileUpload->tenant_id === $user->tenant_id);

        abort_unless($canAccess, 403, 'Unauthorized access to this file.');
    }

    private function formatFile(FileUpload $file): array
    {
        $extension = strtolower(pathinfo($file->original_name, PATHINFO_EXTENSION) ?: 'file');

        return [
            'id' => (string) $file->id,
            'name' => $file->original_name,
            'fileType' => $extension,
            'srcUrl' => $file->url ?? '',
            'size' => (int) $file->size,
            'author' => [
                'name' => $file->user?->name ?? 'Team Member',
                'email' => $file->user?->email ?? '',
                'img' => '',
            ],
            'uploadDate' => $file->created_at?->timestamp ?? time(),
        ];
    }
}
