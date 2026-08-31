import { useMemo } from 'react'
import Tag from '@/components/ui/Tag'
import Button from '@/components/ui/Button'
import DataTable from '@/components/shared/DataTable'
import { getAgentStatusTagClass } from '@/utils/agentStatusTagClass'
import type { ColumnDef } from '@/components/shared/DataTable'
import type { OnboardingRequestSummary } from '@/services/AdminOnboardingService'

type OnboardingRequestListTableProps = {
    requests: OnboardingRequestSummary[]
    isLoading: boolean
    onView: (id: number) => void
    pagingData: { total: number; pageIndex: number; pageSize: number }
    onPaginationChange: (page: number) => void
    onSelectChange: (size: number) => void
}

const OnboardingRequestListTable = ({
    requests,
    isLoading,
    onView,
    pagingData,
    onPaginationChange,
    onSelectChange,
}: OnboardingRequestListTableProps) => {
    const columns: ColumnDef<OnboardingRequestSummary>[] = useMemo(
        () => [
            { header: 'Tenant', accessorKey: 'tenant_name' },
            {
                header: 'Status',
                accessorKey: 'status',
                cell: (props) => (
                    <Tag
                        className={`text-xs font-semibold capitalize border ${getAgentStatusTagClass(props.row.original.status)}`}
                    >
                        {props.row.original.status}
                    </Tag>
                ),
            },
            {
                header: 'Submitted',
                accessorKey: 'submitted_at',
                cell: (props) => new Date(props.row.original.submitted_at).toLocaleString(),
            },
            {
                header: '',
                id: 'actions',
                cell: (props) => (
                    <div className="flex justify-end">
                        <Button size="sm" onClick={() => onView(props.row.original.id)}>
                            View
                        </Button>
                    </div>
                ),
            },
        ],
        [onView],
    )

    return (
        <DataTable
            columns={columns}
            data={requests}
            loading={isLoading}
            noData={requests.length === 0}
            pagingData={pagingData}
            onPaginationChange={onPaginationChange}
            onSelectChange={onSelectChange}
        />
    )
}

export default OnboardingRequestListTable
