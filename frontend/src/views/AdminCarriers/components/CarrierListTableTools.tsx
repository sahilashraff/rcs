import DebouceInput from '@/components/shared/DebouceInput'
import Select from '@/components/ui/Select'
import { TbSearch } from 'react-icons/tb'
import type { ChangeEvent } from 'react'

type StatusOption = { label: string; value: string }

const statusOptions: StatusOption[] = [
    { label: 'All Statuses', value: 'all' },
    { label: 'Active Only', value: 'active' },
    { label: 'Inactive Only', value: 'inactive' },
]

type CarrierListTableToolsProps = {
    onSearchChange: (value: string) => void
    statusFilter: string
    onStatusFilterChange: (status: string) => void
}

const CarrierListTableTools = ({
    onSearchChange,
    statusFilter,
    onStatusFilterChange,
}: CarrierListTableToolsProps) => {
    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        onSearchChange(event.target.value)
    }

    return (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <DebouceInput
                placeholder="Search carriers..."
                suffix={<TbSearch className="text-lg" />}
                onChange={handleInputChange}
            />
            <div className="flex items-center gap-2">
                <Select<StatusOption>
                    className="w-44"
                    options={statusOptions}
                    value={statusOptions.find((opt) => opt.value === statusFilter)}
                    onChange={(option) => onStatusFilterChange(option?.value || 'all')}
                />
            </div>
        </div>
    )
}

export default CarrierListTableTools
