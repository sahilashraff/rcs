import { useMemo } from 'react'
import Tag from '@/components/ui/Tag'
import Switcher from '@/components/ui/Switcher'
import DataTable from '@/components/shared/DataTable'
import type { ColumnDef } from '@/components/shared/DataTable'
import type { Carrier } from '@/services/CarrierService'

type CarrierListTableProps = {
    carriers: Carrier[]
    isLoading: boolean
    togglingId: number | null
    onToggleActive: (carrier: Carrier) => void
}

const CarrierListTable = ({
    carriers,
    isLoading,
    togglingId,
    onToggleActive,
}: CarrierListTableProps) => {
    const columns: ColumnDef<Carrier>[] = useMemo(
        () => [
            {
                header: 'Carrier Code',
                accessorKey: 'code',
                cell: (props) => {
                    const row = props.row.original
                    return (
                        <Tag className="font-mono text-xs uppercase font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                            {row.code}
                        </Tag>
                    )
                },
            },
            {
                header: 'Carrier Name',
                accessorKey: 'name',
                cell: (props) => {
                    const row = props.row.original
                    return (
                        <span className="font-bold heading-text">
                            {row.name}
                        </span>
                    )
                },
            },
            {
                header: 'Country',
                accessorKey: 'country',
                cell: (props) => {
                    const row = props.row.original
                    return (
                        <Tag className="text-xs font-semibold bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                            {row.country}
                        </Tag>
                    )
                },
            },
            {
                header: 'Active Status',
                accessorKey: 'is_active',
                cell: (props) => {
                    const row = props.row.original
                    return (
                        <div className="flex items-center gap-2">
                            <Switcher
                                checked={row.is_active}
                                isLoading={togglingId === row.id}
                                onChange={() => onToggleActive(row)}
                            />
                            <span className="text-xs text-gray-500 font-medium">
                                {row.is_active ? 'Active' : 'Disabled'}
                            </span>
                        </div>
                    )
                },
            },
        ],
        [togglingId, onToggleActive],
    )

    return (
        <DataTable
            columns={columns}
            data={carriers}
            loading={isLoading}
            noData={carriers.length === 0}
        />
    )
}

export default CarrierListTable
