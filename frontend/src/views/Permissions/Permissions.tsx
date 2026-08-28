import { useEffect, useState, useMemo, useCallback } from 'react'
import Container from '@/components/shared/Container'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import PermissionsStats from './components/PermissionsStats'
import PermissionsActionHeader from './components/PermissionsActionHeader'
import SubAccountTable from './components/SubAccountTable'
import CreateSubAccountDialog from './components/CreateSubAccountDialog'
import ManagePermissionsDialog from './components/ManagePermissionsDialog'
import {
    apiGetFeatures,
    apiGetSubAccounts,
    apiCreateSubAccount,
    apiUpdateSubAccountPermissions,
} from '@/services/SubAccountService'
import type { Feature, SubAccount } from './types'

const Permissions = () => {
    const [features, setFeatures] = useState<Feature[]>([])
    const [subAccounts, setSubAccounts] = useState<SubAccount[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterValue, setFilterValue] = useState('all')

    // Dialog states
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [selectedSubAccount, setSelectedSubAccount] = useState<SubAccount | null>(null)
    const [togglingUserId, setTogglingUserId] = useState<number | null>(null)

    const loadData = useCallback(async () => {
        try {
            setIsLoading(true)
            const [featuresResp, subAccountsResp] = await Promise.all([
                apiGetFeatures(),
                apiGetSubAccounts(),
            ])
            setFeatures(featuresResp.data || [])
            setSubAccounts(subAccountsResp.data || [])
        } catch (error: any) {
            toast.push(
                <Notification type="danger" title="Error Loading Data">
                    {error?.response?.data?.message || 'Failed to fetch sub-accounts and permissions.'}
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

    // Create Sub-Account Handler
    const handleCreateSubAccount = async (data: {
        name: string
        email: string
        password: string
        permissions: string[]
    }) => {
        const createResp = await apiCreateSubAccount({
            name: data.name,
            email: data.email,
            password: data.password,
        })

        const createdAccount = createResp.data

        // If initial permissions were selected, update them immediately
        if (createdAccount?.id && data.permissions.length > 0) {
            await apiUpdateSubAccountPermissions(createdAccount.id, data.permissions)
        }

        toast.push(
            <Notification type="success" title="Sub-Account Created">
                Staff member <strong>{data.name}</strong> created with {data.permissions.length} module permissions.
            </Notification>,
            { placement: 'top-center' },
        )

        await loadData()
    }

    // Direct Toggle Permission Handler (Optimistic Update)
    const handleTogglePermission = async (subAccount: SubAccount, key: string) => {
        const hasKey = subAccount.permissions.includes(key)
        const nextPermissions = hasKey
            ? subAccount.permissions.filter((k) => k !== key)
            : [...subAccount.permissions, key]

        // Optimistic UI update
        setSubAccounts((prev) =>
            prev.map((sa) =>
                sa.id === subAccount.id ? { ...sa, permissions: nextPermissions } : sa,
            ),
        )
        setTogglingUserId(subAccount.id)

        try {
            await apiUpdateSubAccountPermissions(subAccount.id, nextPermissions)
            const actionText = hasKey ? 'revoked from' : 'granted to'
            toast.push(
                <Notification type="info" duration={2500}>
                    Permission <strong>{key}</strong> {actionText} {subAccount.name}.
                </Notification>,
                { placement: 'top-center' },
            )
        } catch (error: any) {
            // Revert on error
            setSubAccounts((prev) =>
                prev.map((sa) =>
                    sa.id === subAccount.id ? { ...sa, permissions: subAccount.permissions } : sa,
                ),
            )
            toast.push(
                <Notification type="danger" title="Permission Update Failed">
                    {error?.response?.data?.message || 'Could not update permissions.'}
                </Notification>,
                { placement: 'top-center' },
            )
        } finally {
            setTogglingUserId(null)
        }
    }

    // Modal Save Permissions Handler
    const handleSavePermissions = async (userId: number, nextPermissions: string[]) => {
        await apiUpdateSubAccountPermissions(userId, nextPermissions)
        toast.push(
            <Notification type="success" title="Permissions Updated">
                Access permissions successfully saved.
            </Notification>,
            { placement: 'top-center' },
        )
        await loadData()
    }

    // Copy Email Helper
    const handleCopyEmail = (email: string) => {
        navigator.clipboard.writeText(email)
        toast.push(
            <Notification type="info" duration={2000}>
                Email copied to clipboard.
            </Notification>,
            { placement: 'top-center' },
        )
    }

    // Filter & Search Logic
    const filteredSubAccounts = useMemo(() => {
        return subAccounts.filter((account) => {
            // Search query match
            const query = searchQuery.toLowerCase().trim()
            const matchesQuery =
                !query ||
                account.name.toLowerCase().includes(query) ||
                account.email.toLowerCase().includes(query)

            if (!matchesQuery) return false

            // Filter select match
            if (filterValue === 'has_permissions') {
                return account.permissions && account.permissions.length > 0
            }
            if (filterValue === 'no_permissions') {
                return !account.permissions || account.permissions.length === 0
            }

            return true
        })
    }, [subAccounts, searchQuery, filterValue])

    // Total active permissions count
    const totalGrantedCount = useMemo(() => {
        return subAccounts.reduce(
            (acc, curr) => acc + (curr.permissions ? curr.permissions.length : 0),
            0,
        )
    }, [subAccounts])

    return (
        <Container className="py-2">
            {/* Top Stat Summary Cards */}
            <PermissionsStats
                subAccountsCount={subAccounts.length}
                featuresCount={features.length}
                grantedCount={totalGrantedCount}
                isLoading={isLoading}
            />

            {/* Action Bar with Search & Filters */}
            <PermissionsActionHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                filterValue={filterValue}
                onFilterChange={setFilterValue}
                onOpenCreateDialog={() => setIsCreateOpen(true)}
                onRefresh={loadData}
                isLoading={isLoading}
            />

            {/* Sub-Accounts Table */}
            <SubAccountTable
                subAccounts={filteredSubAccounts}
                features={features}
                isLoading={isLoading}
                togglingUserId={togglingUserId}
                onTogglePermission={handleTogglePermission}
                onManageAccess={(account) => setSelectedSubAccount(account)}
                onOpenCreateDialog={() => setIsCreateOpen(true)}
                onCopyEmail={handleCopyEmail}
            />

            {/* Create Sub-Account Modal */}
            <CreateSubAccountDialog
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                features={features}
                onSubmit={handleCreateSubAccount}
            />

            {/* Manage Permissions Modal */}
            <ManagePermissionsDialog
                isOpen={!!selectedSubAccount}
                onClose={() => setSelectedSubAccount(null)}
                subAccount={selectedSubAccount}
                features={features}
                onSavePermissions={handleSavePermissions}
            />
        </Container>
    )
}

export default Permissions
