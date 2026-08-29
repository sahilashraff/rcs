import { useEffect, useState, useCallback, useMemo } from 'react'
import Container from '@/components/shared/Container'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import AgentListTableTools from './components/AgentListTableTools'
import AgentListTable from './components/AgentListTable'
import { apiGetAgents, apiTransitionAgent } from '@/services/AgentService'
import type { AgentSummary } from '@/services/AgentService'

const AdminAgents = () => {
    const [agents, setAgents] = useState<AgentSummary[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [pageIndex, setPageIndex] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    const loadData = useCallback(async () => {
        try {
            setIsLoading(true)
            const resp = await apiGetAgents()
            setAgents(resp.data || [])
        } catch (error: any) {
            toast.push(
                <Notification type="danger" title="Error Loading Agents">
                    {error?.response?.data?.message || 'Failed to fetch agents.'}
                </Notification>,
                { placement: 'top-center' },
            )
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        loadData()
    }, [loadData])

    const handleTransition = async (
        agentId: number,
        action: string,
        rejectionReason?: string,
    ) => {
        try {
            await apiTransitionAgent(agentId, action, rejectionReason)
            toast.push(
                <Notification type="success" title="Status Updated">
                    Agent transitioned via <strong>{action}</strong>.
                </Notification>,
                { placement: 'top-center' },
            )
            await loadData()
        } catch (error: any) {
            toast.push(
                <Notification type="danger" title="Transition Failed">
                    {error?.response?.data?.message || 'Could not update status.'}
                </Notification>,
                { placement: 'top-center' },
            )
        }
    }

    const filteredAgents = useMemo(() => {
        return agents.filter((agent) => {
            const query = searchQuery.toLowerCase().trim()
            const matchesQuery =
                !query ||
                agent.tenant_name.toLowerCase().includes(query) ||
                (agent.brand_name?.toLowerCase().includes(query) ?? false) ||
                agent.carrier_name.toLowerCase().includes(query)

            if (!matchesQuery) return false

            if (statusFilter !== 'all' && agent.status !== statusFilter) {
                return false
            }

            return true
        })
    }, [agents, searchQuery, statusFilter])

    useEffect(() => {
        setPageIndex(1)
    }, [searchQuery, statusFilter])

    const pageAgents = useMemo(() => {
        const start = (pageIndex - 1) * pageSize
        return filteredAgents.slice(start, start + pageSize)
    }, [filteredAgents, pageIndex, pageSize])

    const handleSelectChange = (size: number) => {
        setPageSize(size)
        setPageIndex(1)
    }

    return (
        <Container>
            <AdaptiveCard>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <h3>Agents</h3>
                    </div>

                    <AgentListTableTools
                        onSearchChange={setSearchQuery}
                        statusFilter={statusFilter}
                        onStatusFilterChange={setStatusFilter}
                    />

                    <AgentListTable
                        agents={pageAgents}
                        isLoading={isLoading}
                        onTransition={handleTransition}
                        pagingData={{
                            total: filteredAgents.length,
                            pageIndex,
                            pageSize,
                        }}
                        onPaginationChange={setPageIndex}
                        onSelectChange={handleSelectChange}
                    />
                </div>
            </AdaptiveCard>
        </Container>
    )
}

export default AdminAgents
