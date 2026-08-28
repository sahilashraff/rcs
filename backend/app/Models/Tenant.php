<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Tenant extends Model
{
    use HasFactory;

    protected $fillable = ['name'];

    protected function casts(): array
    {
        return [
            'is_white_label' => 'boolean',
        ];
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * The reseller tenant this tenant was onboarded under, if any.
     * Null means this tenant is top-level (either a direct platform
     * customer, or an approved white-label reseller itself).
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'parent_tenant_id');
    }

    /**
     * Sub-tenants onboarded under this tenant's white-labeled domain.
     * Only ever non-empty when is_white_label is true — the hierarchy
     * is capped at one level (see spec).
     */
    public function children(): HasMany
    {
        return $this->hasMany(Tenant::class, 'parent_tenant_id');
    }
}
