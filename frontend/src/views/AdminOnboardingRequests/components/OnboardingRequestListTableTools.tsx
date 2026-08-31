import DebouceInput from '@/components/shared/DebouceInput'
import Select from '@/components/ui/Select'
import { TbSearch } from 'react-icons/tb'
import type { ChangeEvent } from 'react'

type StatusOption = { label: string; value: string }

const statusOptions: StatusOption[] = [
    { label: 'All Statuses', value: 'all' },
    { label: 'Submitted', value: 'submitted' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
]

type OnboardingRequestListTableToolsProps = {
    onSearchChange: (value: string) => void
    statusFilter: string
    onStatusFilterChange: (status: string) => void
}

const OnboardingRequestListTableTools = ({
    onSearchChange,
    statusFilter,
    onStatusFilterChange,
}: OnboardingRequestListTableToolsProps) => {
    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        onSearchChange(event.target.value)
    }

    return (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <DebouceInput
                placeholder="Search tenants..."
                suffix={<TbSearch className="text-lg" />}
                onChange={handleInputChange}
            />
            <div className="flex items-center gap-2">
                <Select<StatusOption>
                    className="w-48"
                    options={statusOptions}
                    value={statusOptions.find((opt) => opt.value === statusFilter)}
                    onChange={(option) => onStatusFilterChange(option?.value || 'all')}
                />
            </div>
        </div>
    )
}

export default OnboardingRequestListTableTools
