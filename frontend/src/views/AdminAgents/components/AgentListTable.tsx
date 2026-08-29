import { useMemo } from 'react'
import Tag from '@/components/ui/Tag'
import DataTable from '@/components/shared/DataTable'
import AgentActionsCell from './AgentActionsCell'
import { getAgentStatusTagClass } from '@/utils/agentStatusTagClass'
import type { ColumnDef } from '@/components/shared/DataTable'
import type { AgentSummary } from '@/services/AgentService'

type AgentListTableProps = {
    agents: AgentSummary[]
    isLoading: boolean
    onTransition: (
        agentId: number,
        action: string,
        rejectionReason?: string,
    ) => Promise<void>
    pagingData: { total: number; pageIndex: number; pageSize: number }
    onPaginationChange: (page: number) => void
    onSelectChange: (size: number) => void
}

const AgentListTable = ({
    agents,
    isLoading,
    onTransition,
    pagingData,
    onPaginationChange,
    onSelectChange,
}: AgentListTableProps) => {
    const columns: ColumnDef<AgentSummary>[] = useMemo(
        () => [
            {
                header: 'Tenant',
                accessorKey: 'tenant_name',
                cell: (props) => {
                    const row = props.row.original
                    return (
                        <div>
                            <div className="font-bold heading-text">{row.tenant_name}</div>
                            {row.brand_name && (
                                <div className="text-xs text-gray-500">{row.brand_name}</div>
                            )}
                        </div>
                    )
                },
            },
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
            {
                header: '',
                id: 'actions',
                cell: (props) => (
                    <AgentActionsCell
                        agent={props.row.original}
                        onTransition={onTransition}
                    />
                ),
            },
        ],
        [onTransition],
    )

    return (
        <DataTable
            columns={columns}
            data={agents}
            loading={isLoading}
            noData={agents.length === 0}
            pagingData={pagingData}
            onPaginationChange={onPaginationChange}
            onSelectChange={onSelectChange}
        />
    )
}

export default AgentListTable
