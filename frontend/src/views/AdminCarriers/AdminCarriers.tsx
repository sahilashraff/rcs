import { useEffect, useState, useCallback, useMemo } from 'react'
import Container from '@/components/shared/Container'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import CarrierListActionTools from './components/CarrierListActionTools'
import CarrierListTableTools from './components/CarrierListTableTools'
import CarrierListTable from './components/CarrierListTable'
import CreateCarrierDialog from './components/CreateCarrierDialog'
import { apiGetCarriers, apiCreateCarrier, apiUpdateCarrier } from '@/services/CarrierService'
import type { Carrier } from '@/services/CarrierService'

const AdminCarriers = () => {
    const [carriers, setCarriers] = useState<Carrier[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [togglingId, setTogglingId] = useState<number | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

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

    const filteredCarriers = useMemo(() => {
        return carriers.filter((carrier) => {
            const query = searchQuery.toLowerCase().trim()
            const matchesQuery =
                !query ||
                carrier.name.toLowerCase().includes(query) ||
                carrier.code.toLowerCase().includes(query) ||
                carrier.country.toLowerCase().includes(query)

            if (!matchesQuery) return false

            if (statusFilter === 'active') return carrier.is_active
            if (statusFilter === 'inactive') return !carrier.is_active

            return true
        })
    }, [carriers, searchQuery, statusFilter])

    return (
        <Container>
            <AdaptiveCard>
                <div className="flex flex-col gap-4">
                    {/* Header & Primary Action Tools */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
                        <div>
                            <h3 className="heading-text">Carriers</h3>
                            <p className="text-gray-500 text-sm mt-0.5">
                                Configure telecom carriers and network endpoints for RCS agent onboarding.
                            </p>
                        </div>
                        <CarrierListActionTools
                            onAddCarrier={() => setIsCreateOpen(true)}
                        />
                    </div>

                    {/* Table Tools (Debounced Search + Filter) */}
                    <CarrierListTableTools
                        onSearchChange={setSearchQuery}
                        statusFilter={statusFilter}
                        onStatusFilterChange={setStatusFilter}
                    />

                    {/* Standard TanStack DataTable */}
                    <CarrierListTable
                        carriers={filteredCarriers}
                        isLoading={isLoading}
                        togglingId={togglingId}
                        onToggleActive={handleToggleActive}
                    />
                </div>
            </AdaptiveCard>

            <CreateCarrierDialog
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onSubmit={handleCreate}
            />
        </Container>
    )
}

export default AdminCarriers
