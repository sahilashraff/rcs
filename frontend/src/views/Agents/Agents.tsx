import { useEffect, useState } from 'react'
import Container from '@/components/shared/Container'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Tag from '@/components/ui/Tag'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import TenantAgentsTable from './components/TenantAgentsTable'
import { getAgentStatusTagClass } from '@/utils/agentStatusTagClass'
import { apiGetTenantAgents } from '@/services/TenantAgentService'
import type { TenantAgents } from '@/services/TenantAgentService'

const Agents = () => {
    const [data, setData] = useState<TenantAgents | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        apiGetTenantAgents()
            .then((resp) => setData(resp.data))
            .catch((error: any) => {
                toast.push(
                    <Notification type="danger" title="Error Loading Agents">
                        {error?.response?.data?.message || 'Failed to fetch agents.'}
                    </Notification>,
                    { placement: 'top-center' },
                )
            })
            .finally(() => setIsLoading(false))
    }, [])

    const agents = data?.agents ?? []

    return (
        <Container>
            <AdaptiveCard>
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
                        <div>
                            <h3 className="heading-text">Agents</h3>
                            <p className="text-gray-500 text-xs mt-0.5">
                                Your carrier registrations and their current status.
                            </p>
                        </div>
                        {data && (
                            <Tag
                                className={`text-xs font-semibold capitalize border ${getAgentStatusTagClass(data.status)}`}
                            >
                                {data.status.replace('_', ' ')}
                            </Tag>
                        )}
                    </div>

                    <TenantAgentsTable agents={agents} isLoading={isLoading} />
                </div>
            </AdaptiveCard>
        </Container>
    )
}

export default Agents
