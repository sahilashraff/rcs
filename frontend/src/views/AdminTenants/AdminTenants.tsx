import { useEffect, useState, useMemo, useCallback } from 'react'
import Container from '@/components/shared/Container'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Button from '@/components/ui/Button'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import TenantListTableTools from './components/TenantListTableTools'
import TenantListTable from './components/TenantListTable'
import CreateTenantDialog from './components/CreateTenantDialog'
import EditStorageDialog from './components/EditStorageDialog'
import { apiGetTenants, apiSendTenantResetLink, apiUpdateTenantStorage } from '@/services/TenantService'
import type { Tenant } from '@/services/TenantService'

const AdminTenants = () => {
    const [tenants, setTenants] = useState<Tenant[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [createOpen, setCreateOpen] = useState(false)
    const [editingStorageTenant, setEditingStorageTenant] = useState<Tenant | null>(null)

    const loadTenants = useCallback(() => {
        apiGetTenants()
            .then((resp) => setTenants(resp.data || []))
            .catch((error: any) => {
                toast.push(
                    <Notification type="danger" title="Error Loading Tenants">
                        {error?.response?.data?.message || 'Failed to fetch tenants.'}
                    </Notification>,
                    { placement: 'top-center' },
                )
            })
            .finally(() => setIsLoading(false))
    }, [])

    useEffect(() => {
        loadTenants()
    }, [loadTenants])

    const handleSendResetLink = async (tenant: Tenant) => {
        try {
            await apiSendTenantResetLink(tenant.id)
            toast.push(
                <Notification type="success" title="Reset Link Sent">
                    A password reset link was sent to {tenant.name}&apos;s owner.
                </Notification>,
                { placement: 'top-center' },
            )
        } catch (error: any) {
            toast.push(
                <Notification type="danger" title="Failed to Send">
                    {error?.response?.data?.message || 'Could not send the reset link.'}
                </Notification>,
                { placement: 'top-center' },
            )
        }
    }

    const handleUpdateStorage = async (maxStorageMb: number) => {
        if (!editingStorageTenant) return
        await apiUpdateTenantStorage(editingStorageTenant.id, maxStorageMb)
        toast.push(
            <Notification type="success" title="Storage Limit Updated">
                {editingStorageTenant.name} is now limited to {maxStorageMb} MB.
            </Notification>,
            { placement: 'top-center' },
        )
        loadTenants()
    }

    const filteredTenants = useMemo(() => {
        const query = searchQuery.toLowerCase().trim()
        if (!query) return tenants
        return tenants.filter(
            (t) =>
                t.name.toLowerCase().includes(query) ||
                String(t.id).includes(query),
        )
    }, [tenants, searchQuery])

    return (
        <Container>
            <AdaptiveCard>
                <div className="flex flex-col gap-4">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
                        <div>
                            <h3 className="heading-text">Tenants</h3>
                            <p className="text-gray-500 text-sm mt-0.5">
                                Manage and monitor registered business tenants across the platform.
                            </p>
                        </div>
                        <Button variant="solid" onClick={() => setCreateOpen(true)}>
                            Create Account
                        </Button>
                    </div>

                    {/* Table Tools (Debounced Search) */}
                    <TenantListTableTools onSearchChange={setSearchQuery} />

                    {/* Standard TanStack DataTable */}
                    <TenantListTable
                        tenants={filteredTenants}
                        isLoading={isLoading}
                        onSendResetLink={handleSendResetLink}
                        onEditStorage={setEditingStorageTenant}
                    />
                </div>
            </AdaptiveCard>

            <CreateTenantDialog
                isOpen={createOpen}
                onClose={() => setCreateOpen(false)}
                onCreated={loadTenants}
            />
            <EditStorageDialog
                tenant={editingStorageTenant}
                onClose={() => setEditingStorageTenant(null)}
                onSubmit={handleUpdateStorage}
            />
        </Container>
    )
}

export default AdminTenants
