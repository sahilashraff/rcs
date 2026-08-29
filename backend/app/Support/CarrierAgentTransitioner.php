<?php

namespace App\Support;

use App\Models\CarrierAgent;
use InvalidArgumentException;

class CarrierAgentTransitioner
{
    /**
     * action => [allowed "from" statuses, resulting status]. The single
     * source of truth for the state-transition table in the design spec —
     * both the transition endpoint and any future real carrier-webhook
     * handler must call through here, so the two ways a status can change
     * never drift apart or duplicate this validation.
     */
    private const TRANSITIONS = [
        'submit' => [['draft'], 'submitted'],
        'approve' => [['submitted'], 'live'], // Approved -> Live is automatic per spec; no intermediate state is ever persisted.
        'reject' => [['submitted'], 'rejected'],
        'resubmit' => [['rejected'], 'draft'],
        'suspend' => [['live'], 'suspended'],
        'reinstate' => [['suspended'], 'live'],
        'terminate' => [['live', 'suspended'], 'terminated'],
    ];

    /**
     * @throws InvalidArgumentException if the action is illegal from the
     *         CarrierAgent's current status
     */
    public function transition(CarrierAgent $carrierAgent, string $action, ?string $rejectionReason = null): CarrierAgent
    {
        if (! isset(self::TRANSITIONS[$action])) {
            throw new InvalidArgumentException("Unknown action: {$action}");
        }

        [$allowedFrom, $to] = self::TRANSITIONS[$action];

        if (! in_array($carrierAgent->status, $allowedFrom, true)) {
            throw new InvalidArgumentException(
                "Cannot {$action} a CarrierAgent with status {$carrierAgent->status}.",
            );
        }

        if ($action === 'reinstate' && $carrierAgent->suspended_by !== 'admin') {
            throw new InvalidArgumentException(
                'Only an admin-suspended CarrierAgent can be reinstated by an admin action.',
            );
        }

        if ($action === 'reject' && ! $rejectionReason) {
            throw new InvalidArgumentException('A rejection_reason is required to reject a CarrierAgent.');
        }

        $carrierAgent->status = $to;

        if ($action === 'reject') {
            $carrierAgent->rejection_reason = $rejectionReason;
        }

        if ($action === 'suspend') {
            $carrierAgent->suspended_by = 'admin';
        }

        if ($action === 'reinstate') {
            $carrierAgent->suspended_by = null;
        }

        $carrierAgent->save();

        return $carrierAgent;
    }
}
