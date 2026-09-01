<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class FileUpload extends Model
{
    protected $appends = ['url'];

    protected $fillable = [
        'disk',
        'path',
        'original_name',
        'mime_type',
        'size',
        'purpose',
        'field',
        'user_id',
        'tenant_id',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Only meaningful for public-disk files — private ones have no
     * directly browsable URL and must go through the authenticated
     * download route instead (see FileDownloadController).
     */
    protected function url(): Attribute
    {
        return Attribute::get(fn () => $this->disk === 'public'
            ? Storage::disk('public')->url($this->path)
            : null);
    }
}
