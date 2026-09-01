<?php

namespace App\Support;

use App\Models\FileUpload;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * The single place every feature (onboarding, admin branding, and
 * anything uploaded going forward — templates, avatars, etc.) stores a
 * file and registers it, so there is exactly one storage/registry
 * pattern in the codebase instead of one per feature.
 */
class FileUploadService
{
    public function store(
        UploadedFile $file,
        string $purpose,
        ?string $field,
        string $visibility,
        ?int $userId,
        ?int $tenantId,
    ): FileUpload {
        $disk = $visibility === 'public' ? 'public' : 'local';

        $directory = $tenantId ? "{$purpose}/{$tenantId}" : $purpose;
        $filename = (string) Str::uuid() . '.' . $file->extension();
        $path = $file->storeAs($directory, $filename, $disk);

        return FileUpload::create([
            'disk' => $disk,
            'path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
            'purpose' => $purpose,
            'field' => $field,
            'user_id' => $userId,
            'tenant_id' => $tenantId,
        ]);
    }

    public function delete(FileUpload $file): void
    {
        Storage::disk($file->disk)->delete($file->path);
        $file->delete();
    }

    /**
     * Replaces whatever currently occupies a slot (a favicon, an
     * onboarding document, ...) with a newly uploaded file. Stores the
     * new file BEFORE deleting the old one — if storing fails partway,
     * the slot still has its previous file rather than nothing at all.
     *
     * ONLY call this for a file exclusively owned by one slot — nothing
     * else could possibly reference it. That holds for a favicon or an
     * onboarding document, but NOT for a reusable/shared asset (e.g. a
     * template image that other templates might also point at): picking
     * a different file for one template must never delete a file
     * something else still uses. For that kind of shared-asset feature,
     * store() the new file and update just that one reference — leave
     * the old file alone. Deleting a file at all should be its own
     * explicit action (the future file manager), never an automatic
     * side effect of something else pointing elsewhere.
     *
     * Concurrency note: if the same exclusive slot can legitimately be
     * edited by more than one user at once (not true for onboarding or
     * today's admin-only settings), the caller must wrap its own
     * read-old -> replace -> save-new-reference sequence in a DB
     * transaction with lockForUpdate() on the row that owns the
     * reference. Without that, two near-simultaneous replacements can
     * leave one upload orphaned (harmless — an unreferenced row/file,
     * not data loss or a broken reference — but only cleaned up later
     * via the file manager).
     */
    public function replace(
        ?FileUpload $old,
        UploadedFile $new,
        string $purpose,
        ?string $field,
        string $visibility,
        ?int $userId,
        ?int $tenantId,
    ): FileUpload {
        $stored = $this->store($new, $purpose, $field, $visibility, $userId, $tenantId);

        if ($old) {
            $this->delete($old);
        }

        return $stored;
    }
}
