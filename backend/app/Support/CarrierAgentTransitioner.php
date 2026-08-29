<?php

namespace App\Support;

use App\Models\Agent;
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
     *         Agent's current status
     */
    public function transition(Agent $agent, string $action, ?string $rejectionReason = null): Agent
    {
        if (! isset(self::TRANSITIONS[$action])) {
            throw new InvalidArgumentException("Unknown action: {$action}");
        }

        [$allowedFrom, $to] = self::TRANSITIONS[$action];

        if (! in_array($agent->status, $allowedFrom, true)) {
            throw new InvalidArgumentException(
                "Cannot {$action} an Agent with status {$agent->status}.",
            );
        }

        if ($action === 'reinstate' && $agent->suspended_by !== 'admin') {
            throw new InvalidArgumentException(
                'Only an admin-suspended Agent can be reinstated by an admin action.',
            );
        }

        if ($action === 'reject' && ! trim((string) $rejectionReason)) {
            throw new InvalidArgumentException('A rejection_reason is required to reject an Agent.');
        }

        $agent->status = $to;

        if ($action === 'reject') {
            $agent->rejection_reason = trim($rejectionReason);
        }

        if ($action === 'suspend') {
            $agent->suspended_by = 'admin';
        }

        if ($action === 'reinstate') {
            $agent->suspended_by = null;
        }

        $agent->save();

        return $agent;
    }
}
