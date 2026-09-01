import Table from '@/components/ui/Table'
import FileType from './FileType'
import FileItemDropdown from './FileItemDropdown'
import fileSizeUnit from '@/utils/fileSizeUnit'
import FileIcon from '@/components/view/FileIcon'
import dayjs from 'dayjs'
import type { BaseFileItemProps } from '../types'

type FileRowProps = BaseFileItemProps

const { Tr, Td } = Table

const isImage = (type: string = '') => {
    return ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(type.toLowerCase())
}

const FileRow = (props: FileRowProps) => {
    const { fileType, size, name, srcUrl, uploadDate, onClick, ...rest } = props

    return (
        <Tr className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
            <Td width="55%">
                <div
                    className="inline-flex items-center gap-3 cursor-pointer group max-w-full"
                    role="button"
                    onClick={onClick}
                >
                    <div className="text-2xl flex-shrink-0 w-8 h-8 flex items-center justify-center rounded bg-gray-50 dark:bg-gray-900/50 overflow-hidden">
                        {isImage(fileType) && srcUrl ? (
                            <img
                                src={srcUrl}
                                alt={name}
                                className="w-full h-full object-cover rounded"
                                loading="lazy"
                            />
                        ) : (
                            <FileIcon type={fileType || ''} size={24} />
                        )}
                    </div>
                    <div className="font-semibold heading-text group-hover:text-primary transition-colors truncate text-sm">
                        {name}
                    </div>
                </div>
            </Td>
            <Td className="text-sm">{fileSizeUnit(size || 0)}</Td>
            <Td className="text-sm">
                <FileType type={fileType || ''} />
            </Td>
            <Td className="text-sm text-gray-500">
                {uploadDate ? dayjs.unix(uploadDate).format('MMM DD, YYYY') : '-'}
            </Td>
            <Td>
                <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                    <FileItemDropdown {...rest} />
                </div>
            </Td>
        </Tr>
    )
}

export default FileRow
