import { useEffect, useState, useCallback, useMemo } from 'react'
import Container from '@/components/shared/Container'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import AgentListTableTools from './components/AgentListTableTools'
import AgentListTable from './components/AgentListTable'
import EditAgentDialog from './components/EditAgentDialog'
import { apiGetAgents, apiTransitionAgent, apiUpdateAgent, apiDeleteAgent } from '@/services/AgentService'
import type { AgentSummary, AgentType } from '@/services/AgentService'

const AdminAgents = () => {
    const [agents, setAgents] = useState<AgentSummary[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [pageIndex, setPageIndex] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [editingAgent, setEditingAgent] = useState<AgentSummary | null>(null)
    const [deletingAgent, setDeletingAgent] = useState<AgentSummary | null>(null)

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

    const handleEditAgent = async (data: {
        carrier_id: number
        os: 'android' | 'ios'
        type: AgentType
        carrier_external_id: string | null
    }) => {
        if (!editingAgent) return
        await apiUpdateAgent(editingAgent.id, data)
        toast.push(<Notification type="success" title="Agent Updated">Agent updated.</Notification>, { placement: 'top-center' })
        await loadData()
    }

    const handleDeleteAgent = async () => {
        if (!deletingAgent) return
        try {
            await apiDeleteAgent(deletingAgent.id)
            toast.push(<Notification type="success" title="Agent Deleted">Agent removed.</Notification>, { placement: 'top-center' })
            await loadData()
        } catch (error: any) {
            toast.push(
                <Notification type="danger" title="Delete Failed">
                    {error?.response?.data?.message || 'Could not delete agent.'}
                </Notification>,
                { placement: 'top-center' },
            )
        } finally {
            setDeletingAgent(null)
        }
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
                        onEdit={setEditingAgent}
                        onDelete={setDeletingAgent}
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

            <EditAgentDialog agent={editingAgent} onClose={() => setEditingAgent(null)} onSubmit={handleEditAgent} />
            <ConfirmDialog
                isOpen={Boolean(deletingAgent)}
                type="danger"
                title="Delete Agent"
                confirmText="Delete"
                onClose={() => setDeletingAgent(null)}
                onRequestClose={() => setDeletingAgent(null)}
                onCancel={() => setDeletingAgent(null)}
                onConfirm={handleDeleteAgent}
            >
                <p>
                    Delete the {deletingAgent?.carrier_name} · {deletingAgent?.os} draft registration? This cannot be
                    undone.
                </p>
            </ConfirmDialog>
        </Container>
    )
}

export default AdminAgents
