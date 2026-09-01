import Button from '@/components/ui/Button'
import DebouceInput from '@/components/shared/DebouceInput'
import Select from '@/components/ui/Select'
import {
    TbSearch,
    TbPlus,
    TbRefresh,
} from 'react-icons/tb'
import type { ChangeEvent } from 'react'

type FilterOption = {
    label: string
    value: string
}

const filterOptions: FilterOption[] = [
    { label: 'All Staff Accounts', value: 'all' },
    { label: 'With Active Permissions', value: 'has_permissions' },
    { label: 'No Permissions (Default Deny)', value: 'no_permissions' },
]

type PermissionsActionHeaderProps = {
    searchQuery: string
    onSearchChange: (value: string) => void
    filterValue: string
    onFilterChange: (value: string) => void
    onOpenCreateDialog: () => void
    onRefresh: () => void
    isLoading: boolean
}

const PermissionsActionHeader = ({
    searchQuery,
    onSearchChange,
    filterValue,
    onFilterChange,
    onOpenCreateDialog,
    onRefresh,
    isLoading,
}: PermissionsActionHeaderProps) => {
    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        onSearchChange(e.target.value)
    }

    return (
        <div className="flex flex-col gap-4 mb-4">
            {/* Header Title & Top-Right Primary Action */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                    <h3>Team</h3>
                    <p className="text-gray-500 text-xs mt-0.5">
                        Manage tenant staff logins, configure granular module permissions, and control sidebar visibility.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="default"
                        icon={<TbRefresh className={isLoading ? 'animate-spin text-base' : 'text-base'} />}
                        onClick={onRefresh}
                        disabled={isLoading}
                    >
                        Refresh
                    </Button>
                    <Button
                        variant="solid"
                        icon={<TbPlus className="text-lg" />}
                        onClick={onOpenCreateDialog}
                    >
                        Add Team Member
                    </Button>
                </div>
            </div>

            {/* Filter & Search Bar matching OrderListTableTools */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <DebouceInput
                    placeholder="Search by name or email..."
                    suffix={<TbSearch className="text-lg" />}
                    onChange={handleInputChange}
                />
                <div className="flex items-center gap-2">
                    <Select<FilterOption>
                        className="w-56"
                        options={filterOptions}
                        value={filterOptions.find((opt) => opt.value === filterValue)}
                        onChange={(option) => onFilterChange(option?.value || 'all')}
                        placeholder="Filter by access..."
                    />
                </div>
            </div>
        </div>
    )
}

export default PermissionsActionHeader
