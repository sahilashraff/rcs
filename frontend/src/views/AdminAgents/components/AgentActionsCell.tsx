import { useState } from 'react'
import Button from '@/components/ui/Button'
import type { AgentSummary } from '@/services/AgentService'

type AgentActionsCellProps = {
    agent: AgentSummary
    onTransition: (
        agentId: number,
        action: string,
        rejectionReason?: string,
    ) => Promise<void>
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

const AgentActionsCell = ({ agent, onTransition }: AgentActionsCellProps) => {
    const [pendingAction, setPendingAction] = useState<string | null>(null)

    // Reinstate is legal only when suspended_by === 'admin' — computed
    // separately since it depends on more than just status.
    const actions = [...(STATIC_ACTIONS_BY_STATUS[agent.status] ?? [])]
    if (agent.status === 'suspended' && agent.suspended_by === 'admin') {
        actions.unshift({ action: 'reinstate', label: 'Reinstate' })
    }

    const handleClick = async (action: string) => {
        if (action === 'reject') {
            const reason = window.prompt('Rejection reason:')?.trim()
            if (!reason) return
            setPendingAction(action)
            try {
                await onTransition(agent.id, action, reason)
            } finally {
                setPendingAction(null)
            }
            return
        }

        setPendingAction(action)
        try {
            await onTransition(agent.id, action)
        } finally {
            setPendingAction(null)
        }
    }

    if (actions.length === 0) {
        return <span className="text-xs text-gray-400">No actions</span>
    }

    return (
        <div className="flex items-center justify-end gap-2">
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
    )
}

export default AgentActionsCell
