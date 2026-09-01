import { useMemo } from 'react'
import Tag from '@/components/ui/Tag'
import Button from '@/components/ui/Button'
import DataTable from '@/components/shared/DataTable'
import type { ColumnDef } from '@/components/shared/DataTable'
import type { Tenant } from '@/services/TenantService'

type TenantListTableProps = {
    tenants: Tenant[]
    isLoading: boolean
    onSendResetLink: (tenant: Tenant) => void
}

const TenantListTable = ({ tenants, isLoading, onSendResetLink }: TenantListTableProps) => {
    const columns: ColumnDef<Tenant>[] = useMemo(
        () => [
            {
                header: 'Tenant ID',
                accessorKey: 'id',
                cell: (props) => {
                    const row = props.row.original
                    return (
                        <Tag className="font-mono text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                            #{row.id}
                        </Tag>
                    )
                },
            },
            {
                header: 'Tenant Name',
                accessorKey: 'name',
                cell: (props) => {
                    const row = props.row.original
                    return (
                        <span className="font-bold heading-text text-sm">
                            {row.name}
                        </span>
                    )
                },
            },
            {
                header: 'Account Type',
                id: 'type',
                cell: () => {
                    return (
                        <Tag className="text-xs font-semibold bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                            Direct Tenant
                        </Tag>
                    )
                },
            },
            {
                header: '',
                id: 'actions',
                cell: (props) => (
                    <div className="flex justify-end">
                        <Button size="sm" variant="default" onClick={() => onSendResetLink(props.row.original)}>
                            Send Reset Link
                        </Button>
                    </div>
                ),
            },
        ],
        [onSendResetLink],
    )

    return (
        <DataTable
            columns={columns}
            data={tenants}
            loading={isLoading}
            noData={tenants.length === 0}
        />
    )
}

export default TenantListTable
