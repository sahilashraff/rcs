import { useMemo } from 'react'
import Tag from '@/components/ui/Tag'
import DataTable from '@/components/shared/DataTable'
import type { ColumnDef } from '@/components/shared/DataTable'
import type { TenantAgentEntry } from '@/services/TenantAgentService'

type TenantAgentsTableProps = {
    agents: TenantAgentEntry[]
    isLoading: boolean
}

const statusTagClasses: Record<string, string> = {
    live: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    submitted: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700',
    rejected: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800',
    suspended: 'bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400 border-orange-200 dark:border-orange-800',
    terminated: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400 border-red-200 dark:border-red-800',
}

const TenantAgentsTable = ({ agents, isLoading }: TenantAgentsTableProps) => {
    const columns: ColumnDef<TenantAgentEntry>[] = useMemo(
        () => [
            {
                header: 'Carrier',
                accessorKey: 'carrier_name',
            },
            {
                header: 'OS',
                accessorKey: 'os',
                cell: (props) => (
                    <span className="capitalize">{props.row.original.os}</span>
                ),
            },
            {
                header: 'Status',
                accessorKey: 'status',
                cell: (props) => {
                    const row = props.row.original
                    const tagClass = statusTagClasses[row.status] || statusTagClasses.draft
                    return (
                        <Tag className={`text-xs font-semibold capitalize border ${tagClass}`}>
                            {row.status}
                        </Tag>
                    )
                },
            },
        ],
        [],
    )

    return (
        <DataTable
            columns={columns}
            data={agents}
            loading={isLoading}
            noData={agents.length === 0}
        />
    )
}

export default TenantAgentsTable
