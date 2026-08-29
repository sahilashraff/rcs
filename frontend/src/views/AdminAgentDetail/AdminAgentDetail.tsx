import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router'
import Container from '@/components/shared/Container'
import Button from '@/components/ui/Button'
import Tag from '@/components/ui/Tag'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import CarrierAgentCard from './components/CarrierAgentCard'
import AddCarrierAgentDialog from './components/AddCarrierAgentDialog'
import {
    apiGetAgent,
    apiAddCarrierAgent,
    apiTransitionCarrierAgent,
} from '@/services/AgentService'
import type { AgentDetail } from '@/services/AgentService'
import { apiGetCarriers } from '@/services/CarrierService'
import type { Carrier } from '@/services/CarrierService'

const AdminAgentDetail = () => {
    const { id } = useParams<{ id: string }>()
    const agentId = Number(id)
    const [agent, setAgent] = useState<AgentDetail | null>(null)
    const [carriers, setCarriers] = useState<Carrier[]>([])
    const [isAddOpen, setIsAddOpen] = useState(false)

    const loadData = useCallback(async () => {
        try {
            const [agentResp, carriersResp] = await Promise.all([
                apiGetAgent(agentId),
                apiGetCarriers(),
            ])
            setAgent(agentResp.data)
            setCarriers(carriersResp.data || [])
        } catch (error: any) {
            toast.push(
                <Notification type="danger" title="Error Loading Agent">
                    {error?.response?.data?.message || 'Failed to fetch agent.'}
                </Notification>,
                { placement: 'top-center' },
            )
        }
    }, [agentId])

    useEffect(() => {
        loadData()
    }, [loadData])

    const handleAddCarrierAgent = async (data: { carrier_id: number; os: 'android' | 'ios' }) => {
        await apiAddCarrierAgent(agentId, data)
        toast.push(
            <Notification type="success" title="Carrier Registration Added" />,
            { placement: 'top-center' },
        )
        await loadData()
    }

    const handleTransition = async (
        carrierAgentId: number,
        action: string,
        rejectionReason?: string,
    ) => {
        try {
            await apiTransitionCarrierAgent(carrierAgentId, action, rejectionReason)
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

    if (!agent) {
        return <Container className="py-2" />
    }

    return (
        <Container className="py-2">
            <div className="flex items-center justify-between mb-1">
                <h3>{agent.name}</h3>
                <Tag>{agent.status}</Tag>
            </div>
            <p className="text-gray-500 text-sm mb-1">
                {agent.tenant_name} &middot; {agent.brand_name}
            </p>
            {agent.description && (
                <p className="text-gray-500 text-sm mb-4">{agent.description}</p>
            )}

            <div className="flex items-center justify-between mt-6 mb-3">
                <h4>Carrier Registrations</h4>
                <Button variant="solid" size="sm" onClick={() => setIsAddOpen(true)}>
                    Add Carrier Registration
                </Button>
            </div>

            <div className="space-y-3">
                {agent.carrier_agents.length === 0 && (
                    <p className="text-gray-500 text-sm">No carrier registrations yet.</p>
                )}
                {agent.carrier_agents.map((ca) => (
                    <CarrierAgentCard
                        key={ca.id}
                        carrierAgent={ca}
                        onTransition={(action, reason) => handleTransition(ca.id, action, reason)}
                    />
                ))}
            </div>

            <AddCarrierAgentDialog
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                carriers={carriers}
                onSubmit={handleAddCarrierAgent}
            />
        </Container>
    )
}

export default AdminAgentDetail
