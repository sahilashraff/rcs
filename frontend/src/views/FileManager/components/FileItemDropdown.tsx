import { useRef } from 'react'
import Dropdown from '@/components/ui/Dropdown'
import EllipsisButton from '@/components/shared/EllipsisButton'
import {
    TbCloudDownload,
    TbPencil,
    TbShare,
    TbTrash,
} from 'react-icons/tb'
import type { DropdownItemCallbackProps } from '../types'
import type { DropdownRef } from '@/components/ui/Dropdown'
import type { MouseEvent, SyntheticEvent } from 'react'

type FileItemDropdownProps = DropdownItemCallbackProps

const FileItemDropdown = (props: FileItemDropdownProps) => {
    const { onDelete, onShare, onRename, onDownload } = props

    const dropdownRef = useRef<DropdownRef>(null)

    const handleDropdownClick = (e: MouseEvent) => {
        e.stopPropagation()
        dropdownRef.current?.handleDropdownOpen()
    }

    const handleDropdownItemClick = (
        e: SyntheticEvent,
        callback?: () => void,
    ) => {
        e.stopPropagation()
        callback?.()
    }

    return (
        <Dropdown
            ref={dropdownRef}
            renderTitle={<EllipsisButton onClick={handleDropdownClick} />}
            placement="bottom-end"
        >
            {onDownload && (
                <Dropdown.Item
                    eventKey="download"
                    onClick={(e) => handleDropdownItemClick(e, onDownload)}
                >
                    <TbCloudDownload className="text-xl" />
                    <span>Download</span>
                </Dropdown.Item>
            )}
            {onRename && (
                <Dropdown.Item
                    eventKey="rename"
                    onClick={(e) => handleDropdownItemClick(e, onRename)}
                >
                    <TbPencil className="text-xl" />
                    <span>Rename</span>
                </Dropdown.Item>
            )}
            {onShare && (
                <Dropdown.Item
                    eventKey="share"
                    onClick={(e) => handleDropdownItemClick(e, onShare)}
                >
                    <TbShare className="text-xl" />
                    <span>Share link</span>
                </Dropdown.Item>
            )}
            {onDelete && (
                <Dropdown.Item
                    eventKey="delete"
                    onClick={(e) => handleDropdownItemClick(e, onDelete)}
                >
                    <span className="flex items-center gap-2 text-error">
                        <TbTrash className="text-xl" />
                        <span>Delete</span>
                    </span>
                </Dropdown.Item>
            )}
        </Dropdown>
    )
}

export default FileItemDropdown
