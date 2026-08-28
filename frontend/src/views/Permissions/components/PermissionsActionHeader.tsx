import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import {
    TbSearch,
    TbUserPlus,
    TbRefresh,
    TbShield,
} from 'react-icons/tb'

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
    return (
        <div className="mb-6">
            {/* Header Title & Top-Right Primary Action */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary-subtle text-primary rounded-lg">
                            <TbShield className="text-xl" />
                        </div>
                        <h3 className="font-bold text-xl heading-text">
                            Team
                        </h3>
                    </div>
                    <p className="text-gray-500 text-sm mt-1">
                        Manage tenant staff logins, configure granular module permissions, and control sidebar visibility.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        size="md"
                        variant="default"
                        icon={<TbRefresh className={isLoading ? 'animate-spin' : ''} />}
                        onClick={onRefresh}
                        disabled={isLoading}
                    >
                        Refresh
                    </Button>
                    <Button
                        size="md"
                        variant="solid"
                        icon={<TbUserPlus className="text-lg" />}
                        onClick={onOpenCreateDialog}
                    >
                        Add Team Member
                    </Button>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50 dark:bg-gray-800/60 p-3.5 rounded-xl border border-gray-200 dark:border-gray-700/80">
                <div className="w-full sm:w-80">
                    <Input
                        size="sm"
                        placeholder="Search by name or email..."
                        prefix={<TbSearch className="text-gray-400 text-base" />}
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="w-full sm:w-60">
                        <Select<FilterOption>
                            size="sm"
                            options={filterOptions}
                            value={filterOptions.find((opt) => opt.value === filterValue)}
                            onChange={(option) => onFilterChange(option?.value || 'all')}
                            placeholder="Filter by access..."
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PermissionsActionHeader
