import FileItemDropdown from './FileItemDropdown'
import fileSizeUnit from '@/utils/fileSizeUnit'
import MediaSkeleton from '@/components/shared/loaders/MediaSkeleton'
import FileIcon from '@/components/view/FileIcon'
import type { BaseFileItemProps } from '../types'

type FileSegmentProps = BaseFileItemProps

const isImage = (type: string = '') => {
    return ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(type.toLowerCase())
}

const FileSegment = (props: FileSegmentProps) => {
    const { fileType, size, name, srcUrl, onClick, loading, ...rest } = props

    return (
        <div
            className="bg-white rounded-2xl dark:bg-gray-800 border border-gray-200 dark:border-gray-700 py-3.5 px-4 flex items-center justify-between gap-3 transition-all hover:shadow-md hover:border-primary-200 dark:hover:border-gray-600 cursor-pointer group"
            role="button"
            onClick={onClick}
        >
            {loading ? (
                <MediaSkeleton
                    avatarProps={{
                        width: 36,
                        height: 36,
                    }}
                />
            ) : (
                <>
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="text-3xl flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-900/50 overflow-hidden">
                            {isImage(fileType) && srcUrl ? (
                                <img
                                    src={srcUrl}
                                    alt={name}
                                    className="w-full h-full object-cover rounded-lg"
                                    loading="lazy"
                                />
                            ) : (
                                <FileIcon type={fileType || ''} size={32} />
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="font-semibold heading-text truncate group-hover:text-primary transition-colors text-sm">
                                {name}
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {fileSizeUnit(size || 0)}
                            </span>
                        </div>
                    </div>
                    <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <FileItemDropdown {...rest} />
                    </div>
                </>
            )}
        </div>
    )
}

export default FileSegment
