import { useEffect, useState } from 'react'
import Container from '@/components/shared/Container'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Tag from '@/components/ui/Tag'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import TenantAgentsTable from './components/TenantAgentsTable'
import { apiGetTenantAgents } from '@/services/TenantAgentService'
import type { TenantAgents } from '@/services/TenantAgentService'

const statusTagClasses: Record<string, string> = {
    live: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    partially_live: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    pending: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700',
    suspended: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800',
    terminated: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400 border-red-200 dark:border-red-800',
}

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
    const tagClass = data
        ? statusTagClasses[data.status] || statusTagClasses.draft
        : statusTagClasses.draft

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
                            <Tag className={`text-xs font-semibold capitalize border ${tagClass}`}>
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
