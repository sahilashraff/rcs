<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Tenant extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'brand_name', 'description'];

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

    public function owner(): HasOne
    {
        return $this->hasOne(User::class)->where('is_owner', true);
    }

    /**
     * Creates a Tenant and its owning User together — the one place this
     * pairing happens, shared by public self-signup and admin-created
     * accounts, so the two paths can't drift on what "owning a tenant"
     * means (tenant_id, is_owner, is_admin).
     */
    public static function createWithOwner(string $tenantName, array $ownerAttributes): User
    {
        $phoneVerifiedAt = $ownerAttributes['phone_verified_at'] ?? null;
        unset($ownerAttributes['phone_verified_at']);

        $tenant = self::create(['name' => $tenantName]);

        $user = new User($ownerAttributes);
        $user->tenant_id = $tenant->id;
        $user->is_owner = true;
        $user->is_admin = false;
        $user->phone_verified_at = $phoneVerifiedAt;
        $user->save();

        return $user;
    }

    public function agents(): HasMany
    {
        return $this->hasMany(Agent::class);
    }

    public function onboardingRequest(): HasOne
    {
        return $this->hasOne(OnboardingRequest::class);
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

    /**
     * Derived from the set of this Tenant's Agent statuses — moved here
     * from the (now-deleted) parent Agent record's derivedStatus(), per
     * the Bot/Agent data-model correction design spec. Not a stored
     * column: agent counts are low-cardinality per tenant, so computing
     * this on read avoids a sync-trigger/materialized-column mismatch.
     * The single source of truth for this aggregation — nothing else
     * re-implements it.
     */
    public function derivedStatus(): string
    {
        $statuses = $this->agents->pluck('status');

        if ($statuses->isEmpty() || $statuses->every(fn ($s) => $s === 'draft')) {
            return 'draft';
        }

        $nonTerminated = $statuses->filter(fn ($s) => $s !== 'terminated');

        if ($nonTerminated->isEmpty()) {
            return 'terminated';
        }

        if ($nonTerminated->contains('live')) {
            return $nonTerminated->every(fn ($s) => $s === 'live') ? 'live' : 'partially_live';
        }

        if ($nonTerminated->contains('suspended')) {
            return 'suspended';
        }

        if ($nonTerminated->contains('submitted')) {
            return 'pending';
        }

        return 'draft';
    }
}
