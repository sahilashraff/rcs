import { useEffect, useState } from 'react'
import Alert from '@/components/ui/Alert'
import Tag from '@/components/ui/Tag'
import { apiGetTenantAgents } from '@/services/TenantAgentService'
import type { OnboardingRequestRecord } from '@/services/OnboardingService'
import type { TenantAgentEntry } from '@/services/TenantAgentService'

type OnboardingApprovedPanelProps = {
    request: OnboardingRequestRecord
}

// Reuses the existing tenant-side GET /agents endpoint (B1) for the badge
// list, rather than re-deriving Agent state inside the onboarding flow —
// there is exactly one place that endpoint's response shape is defined.
const OnboardingApprovedPanel = ({ request }: OnboardingApprovedPanelProps) => {
    const [agents, setAgents] = useState<TenantAgentEntry[]>([])

    useEffect(() => {
        apiGetTenantAgents()
            .then((resp) => setAgents(resp.data.agents))
            .catch(() => {})
    }, [])

    return (
        <div className="flex flex-col gap-4">
            <h3>Approved — Operator Provisioning in Progress</h3>
            <Alert type="success" showIcon>
                Your request for <strong>{request.rcs_display_name}</strong> has been approved.
                You&apos;ll gain full access as soon as at least one registration below reaches
                Live.
            </Alert>
            <div className="flex flex-wrap gap-2">
                {agents.map((agent) => (
                    <Tag key={agent.id} className="text-xs font-semibold capitalize border">
                        {agent.carrier_name} · {agent.os} · {agent.status}
                    </Tag>
                ))}
            </div>
        </div>
    )
}

export default OnboardingApprovedPanel
