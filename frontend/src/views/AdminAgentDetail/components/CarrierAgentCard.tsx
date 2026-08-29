import { useState } from 'react'
import Card from '@/components/ui/Card'
import Tag from '@/components/ui/Tag'
import Button from '@/components/ui/Button'
import type { CarrierAgentDetail } from '@/services/AgentService'

type CarrierAgentCardProps = {
    carrierAgent: CarrierAgentDetail
    onTransition: (action: string, rejectionReason?: string) => Promise<void>
}

const STATIC_ACTIONS_BY_STATUS: Record<string, { action: string; label: string }[]> = {
    draft: [{ action: 'submit', label: 'Submit' }],
    submitted: [
        { action: 'approve', label: 'Approve' },
        { action: 'reject', label: 'Reject' },
    ],
    rejected: [{ action: 'resubmit', label: 'Back to Draft' }],
    live: [
        { action: 'suspend', label: 'Suspend' },
        { action: 'terminate', label: 'Terminate' },
    ],
    suspended: [{ action: 'terminate', label: 'Terminate' }],
    terminated: [],
}

const CarrierAgentCard = ({ carrierAgent, onTransition }: CarrierAgentCardProps) => {
    const [pendingAction, setPendingAction] = useState<string | null>(null)

    // Reinstate is legal only when suspended_by === 'admin' (see
    // CarrierAgentTransitioner) — computed separately rather than baked
    // into the static table since it depends on more than just status.
    const actions = [...(STATIC_ACTIONS_BY_STATUS[carrierAgent.status] ?? [])]
    if (carrierAgent.status === 'suspended' && carrierAgent.suspended_by === 'admin') {
        actions.unshift({ action: 'reinstate', label: 'Reinstate' })
    }

    const handleClick = async (action: string) => {
        if (action === 'reject') {
            const reason = window.prompt('Rejection reason:')
            if (!reason) return
            setPendingAction(action)
            try {
                await onTransition(action, reason)
            } finally {
                setPendingAction(null)
            }
            return
        }

        setPendingAction(action)
        try {
            await onTransition(action)
        } finally {
            setPendingAction(null)
        }
    }

    return (
        <Card className="border border-gray-200 dark:border-gray-700/80">
            <div className="flex items-center justify-between">
                <div>
                    <div className="font-bold heading-text">
                        {carrierAgent.carrier_name} ({carrierAgent.os === 'ios' ? 'iOS' : 'Android'})
                    </div>
                    {carrierAgent.carrier_external_id && (
                        <div className="text-xs text-gray-500 mt-0.5">
                            External ID: {carrierAgent.carrier_external_id}
                        </div>
                    )}
                    {carrierAgent.rejection_reason && (
                        <div className="text-xs text-red-500 mt-0.5">
                            Rejected: {carrierAgent.rejection_reason}
                        </div>
                    )}
                </div>
                <Tag>{carrierAgent.status}</Tag>
            </div>
            {actions.length > 0 && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                    {actions.map(({ action, label }) => (
                        <Button
                            key={action}
                            size="sm"
                            variant="default"
                            loading={pendingAction === action}
                            onClick={() => handleClick(action)}
                        >
                            {label}
                        </Button>
                    ))}
                </div>
            )}
        </Card>
    )
}

export default CarrierAgentCard
