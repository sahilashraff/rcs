import { useEffect, useState } from 'react'
import Container from '@/components/shared/Container'
import Card from '@/components/ui/Card'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import { apiGetTenants } from '@/services/TenantService'
import type { Tenant } from '@/services/TenantService'

const AdminTenants = () => {
    const [tenants, setTenants] = useState<Tenant[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
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

    return (
        <Container className="py-2">
            <h3 className="mb-4">Tenants</h3>
            <Card bodyClass="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700/80 bg-gray-50/75 dark:bg-gray-800/40 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <th className="py-3 px-6">ID</th>
                                <th className="py-3 px-6">Name</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700/80">
                            {!isLoading && tenants.length === 0 && (
                                <tr>
                                    <td colSpan={2} className="py-8 px-6 text-center text-gray-500">
                                        No tenants yet.
                                    </td>
                                </tr>
                            )}
                            {tenants.map((tenant) => (
                                <tr key={tenant.id}>
                                    <td className="py-3 px-6">{tenant.id}</td>
                                    <td className="py-3 px-6 font-semibold heading-text">
                                        {tenant.name}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </Container>
    )
}

export default AdminTenants
