<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Agent extends Model
{
    use HasFactory;

    protected $fillable = ['tenant_id', 'name', 'brand_name', 'description'];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function carrierAgents(): HasMany
    {
        return $this->hasMany(CarrierAgent::class);
    }

    /**
     * Derived from the set of this Agent's CarrierAgent statuses — see
     * the design spec's "Derived Agent.status" table. Not a stored
     * column: agent counts are low-cardinality per tenant, so computing
     * this on read avoids a sync-trigger/materialized-column mismatch.
     */
    public function derivedStatus(): string
    {
        $statuses = $this->carrierAgents->pluck('status');

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

        // 'rejected'-only has no explicit rule in the spec's derived-status
        // table — treated as draft-equivalent since the lifecycle always
        // re-enters Draft from Rejected (not a resting end state).
        return 'draft';
    }
}
