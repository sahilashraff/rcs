import DebouceInput from '@/components/shared/DebouceInput'
import { TbSearch } from 'react-icons/tb'
import type { ChangeEvent } from 'react'

type TenantListTableToolsProps = {
    onSearchChange: (value: string) => void
}

const TenantListTableTools = ({ onSearchChange }: TenantListTableToolsProps) => {
    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        onSearchChange(event.target.value)
    }

    return (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <DebouceInput
                placeholder="Search tenants by name or ID..."
                suffix={<TbSearch className="text-lg" />}
                onChange={handleInputChange}
            />
        </div>
    )
}

export default TenantListTableTools
