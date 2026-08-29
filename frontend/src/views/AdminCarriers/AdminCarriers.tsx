import { useEffect, useState, useCallback } from 'react'
import Container from '@/components/shared/Container'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Switcher from '@/components/ui/Switcher'
import Tag from '@/components/ui/Tag'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import CreateCarrierDialog from './components/CreateCarrierDialog'
import { apiGetCarriers, apiCreateCarrier, apiUpdateCarrier } from '@/services/CarrierService'
import type { Carrier } from '@/services/CarrierService'

const AdminCarriers = () => {
    const [carriers, setCarriers] = useState<Carrier[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [togglingId, setTogglingId] = useState<number | null>(null)

    const loadData = useCallback(async () => {
        try {
            setIsLoading(true)
            const resp = await apiGetCarriers()
            setCarriers(resp.data || [])
        } catch (error: any) {
            toast.push(
                <Notification type="danger" title="Error Loading Carriers">
                    {error?.response?.data?.message || 'Failed to fetch carriers.'}
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

    const handleCreate = async (data: { code: string; name: string; country: string }) => {
        await apiCreateCarrier(data)
        toast.push(
            <Notification type="success" title="Carrier Added">
                <strong>{data.name}</strong> is ready for agent registrations.
            </Notification>,
            { placement: 'top-center' },
        )
        await loadData()
    }

    const handleToggleActive = async (carrier: Carrier) => {
        setTogglingId(carrier.id)
        try {
            await apiUpdateCarrier(carrier.id, { is_active: !carrier.is_active })
            await loadData()
        } catch (error: any) {
            toast.push(
                <Notification type="danger" title="Update Failed">
                    {error?.response?.data?.message || 'Could not update carrier.'}
                </Notification>,
                { placement: 'top-center' },
            )
        } finally {
            setTogglingId(null)
        }
    }

    return (
        <Container className="py-2">
            <div className="flex items-center justify-between mb-4">
                <h3>Carriers</h3>
                <Button variant="solid" onClick={() => setIsCreateOpen(true)}>
                    Add Carrier
                </Button>
            </div>
            <Card bodyClass="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700/80 bg-gray-50/75 dark:bg-gray-800/40 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <th className="py-3 px-6">Code</th>
                                <th className="py-3 px-6">Name</th>
                                <th className="py-3 px-6">Country</th>
                                <th className="py-3 px-6">Active</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700/80">
                            {!isLoading && carriers.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="py-8 px-6 text-center text-gray-500">
                                        No carriers yet.
                                    </td>
                                </tr>
                            )}
                            {carriers.map((carrier) => (
                                <tr key={carrier.id}>
                                    <td className="py-3 px-6">
                                        <Tag>{carrier.code}</Tag>
                                    </td>
                                    <td className="py-3 px-6 font-semibold heading-text">
                                        {carrier.name}
                                    </td>
                                    <td className="py-3 px-6">{carrier.country}</td>
                                    <td className="py-3 px-6">
                                        <Switcher
                                            checked={carrier.is_active}
                                            isLoading={togglingId === carrier.id}
                                            onChange={() => handleToggleActive(carrier)}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <CreateCarrierDialog
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onSubmit={handleCreate}
            />
        </Container>
    )
}

export default AdminCarriers
