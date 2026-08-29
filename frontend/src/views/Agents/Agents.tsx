import { useEffect, useState } from 'react'
import Container from '@/components/shared/Container'
import Card from '@/components/ui/Card'
import Tag from '@/components/ui/Tag'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import { apiGetTenantAgents } from '@/services/TenantAgentService'
import type { TenantAgent } from '@/services/TenantAgentService'

const Agents = () => {
    const [agents, setAgents] = useState<TenantAgent[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        apiGetTenantAgents()
            .then((resp) => setAgents(resp.data || []))
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

    return (
        <Container className="py-2">
            <h3 className="mb-4">Agents</h3>
            {!isLoading && agents.length === 0 && (
                <Card>
                    <p className="text-gray-500 text-sm">
                        No agents have been set up for your account yet. Contact your platform
                        admin to get started.
                    </p>
                </Card>
            )}
            <div className="space-y-3">
                {agents.map((agent) => (
                    <Card key={agent.id} className="border border-gray-200 dark:border-gray-700/80">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-bold heading-text">{agent.name}</div>
                                <div className="text-xs text-gray-500">{agent.brand_name}</div>
                            </div>
                            <Tag>{agent.status}</Tag>
                        </div>
                        {agent.carrier_agents.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                                {agent.carrier_agents.map((ca, idx) => (
                                    <span
                                        key={idx}
                                        className="text-xs px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-800 font-medium"
                                    >
                                        {ca.carrier_name} ({ca.os === 'ios' ? 'iOS' : 'Android'}):{' '}
                                        {ca.status}
                                    </span>
                                ))}
                            </div>
                        )}
                    </Card>
                ))}
            </div>
        </Container>
    )
}

export default Agents
