<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CarrierAgent extends Model
{
    use HasFactory;

    protected $fillable = [
        'agent_id',
        'carrier_id',
        'os',
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

    public function agent(): BelongsTo
    {
        return $this->belongsTo(Agent::class);
    }

    public function carrier(): BelongsTo
    {
        return $this->belongsTo(Carrier::class);
    }
}
