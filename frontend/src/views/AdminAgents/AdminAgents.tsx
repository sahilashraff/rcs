import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router'
import Container from '@/components/shared/Container'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Tag from '@/components/ui/Tag'
import Select from '@/components/ui/Select'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import CreateAgentDialog from './components/CreateAgentDialog'
import { apiGetAgents, apiCreateAgent } from '@/services/AgentService'
import type { AgentSummary } from '@/services/AgentService'
import { apiGetTenants } from '@/services/TenantService'
import type { Tenant } from '@/services/TenantService'

type StatusOption = { label: string; value: string }

const statusOptions: StatusOption[] = [
    { label: 'All statuses', value: 'all' },
    { label: 'Draft', value: 'draft' },
    { label: 'Pending', value: 'pending' },
    { label: 'Partially Live', value: 'partially_live' },
    { label: 'Live', value: 'live' },
    { label: 'Suspended', value: 'suspended' },
    { label: 'Terminated', value: 'terminated' },
]

const AdminAgents = () => {
    const navigate = useNavigate()
    const [agents, setAgents] = useState<AgentSummary[]>([])
    const [tenants, setTenants] = useState<Tenant[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [statusFilter, setStatusFilter] = useState('all')

    const loadData = useCallback(async () => {
        try {
            setIsLoading(true)
            const [agentsResp, tenantsResp] = await Promise.all([apiGetAgents(), apiGetTenants()])
            setAgents(agentsResp.data || [])
            setTenants(tenantsResp.data || [])
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

    const handleCreate = async (data: {
        tenant_id: number
        name: string
        brand_name: string
        description?: string
    }) => {
        await apiCreateAgent(data)
        toast.push(
            <Notification type="success" title="Agent Created">
                <strong>{data.name}</strong> is ready for carrier registrations.
            </Notification>,
            { placement: 'top-center' },
        )
        await loadData()
    }

    const filteredAgents = useMemo(() => {
        if (statusFilter === 'all') return agents
        return agents.filter((a) => a.status === statusFilter)
    }, [agents, statusFilter])

    return (
        <Container className="py-2">
            <div className="flex items-center justify-between mb-4">
                <h3>Agents</h3>
                <Button variant="solid" onClick={() => setIsCreateOpen(true)}>
                    Create Agent
                </Button>
            </div>

            <div className="mb-4 w-full sm:w-60">
                <Select<StatusOption>
                    size="sm"
                    options={statusOptions}
                    value={statusOptions.find((opt) => opt.value === statusFilter)}
                    onChange={(option) => setStatusFilter(option?.value || 'all')}
                />
            </div>

            <Card bodyClass="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700/80 bg-gray-50/75 dark:bg-gray-800/40 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <th className="py-3 px-6">Tenant</th>
                                <th className="py-3 px-6">Name</th>
                                <th className="py-3 px-6">Brand</th>
                                <th className="py-3 px-6">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700/80">
                            {!isLoading && filteredAgents.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="py-8 px-6 text-center text-gray-500">
                                        No agents match this filter.
                                    </td>
                                </tr>
                            )}
                            {filteredAgents.map((agent) => (
                                <tr
                                    key={agent.id}
                                    className="cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/30"
                                    onClick={() => navigate(`/admin/agents/${agent.id}`)}
                                >
                                    <td className="py-3 px-6">{agent.tenant_name}</td>
                                    <td className="py-3 px-6 font-semibold heading-text">
                                        {agent.name}
                                    </td>
                                    <td className="py-3 px-6">{agent.brand_name}</td>
                                    <td className="py-3 px-6">
                                        <Tag>{agent.status}</Tag>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <CreateAgentDialog
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                tenants={tenants}
                onSubmit={handleCreate}
            />
        </Container>
    )
}

export default AdminAgents
