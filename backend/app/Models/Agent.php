<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Validation\Rule;

class Agent extends Model
{
    use HasFactory;

    public const TYPES = ['otp', 'transactional', 'promotional', 'multi_use'];

    /**
     * Validation rules for a single carrier/os/type registration, shared by
     * both the onboarding-approve flow (nested under "agents.*.") and the
     * standalone add-agent endpoint (top-level) so the two creation paths
     * never validate a pair differently.
     */
    public static function pairValidationRules(string $prefix = ''): array
    {
        return [
            "{$prefix}carrier_id" => ['required', 'integer', 'exists:carriers,id'],
            "{$prefix}os" => ['required', Rule::in(['android', 'ios'])],
            "{$prefix}type" => ['required', Rule::in(self::TYPES)],
        ];
    }

    protected $fillable = [
        'tenant_id',
        'carrier_id',
        'os',
        'type',
        'carrier_external_id',
        'status',
        'rejection_reason',
        'suspended_by',
        'last_submitted_payload',
        'last_carrier_response',
    ];

    protected function casts(): array
    {
        return [
            'last_submitted_payload' => 'array',
            'last_carrier_response' => 'array',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function carrier(): BelongsTo
    {
        return $this->belongsTo(Carrier::class);
    }
}
