import { useMemo } from 'react'
import Tag from '@/components/ui/Tag'
import DataTable from '@/components/shared/DataTable'
import { getAgentStatusTagClass } from '@/utils/agentStatusTagClass'
import type { ColumnDef } from '@/components/shared/DataTable'
import type { TenantAgentEntry } from '@/services/TenantAgentService'

type TenantAgentsTableProps = {
    agents: TenantAgentEntry[]
    isLoading: boolean
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
                    return (
                        <div>
                            <Tag
                                className={`text-xs font-semibold capitalize border ${getAgentStatusTagClass(row.status)}`}
                            >
                                {row.status}
                            </Tag>
                            {row.status === 'rejected' && row.rejection_reason && (
                                <div className="text-xs text-gray-500 mt-1">
                                    {row.rejection_reason}
                                </div>
                            )}
                        </div>
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
