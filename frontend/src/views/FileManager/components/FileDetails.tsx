import { useMemo } from 'react'
import Drawer from '@/components/ui/Drawer'
import Button from '@/components/ui/Button'
import CloseButton from '@/components/ui/CloseButton'
import FileIcon from '@/components/view/FileIcon'
import FileType from './FileType'
import fileSizeUnit from '@/utils/fileSizeUnit'
import { useFileManagerStore } from '../store/useFileManagerStore'
import dayjs from 'dayjs'
import { TbDownload, TbShare, TbTrash, TbPencil } from 'react-icons/tb'
import type { ReactNode } from 'react'

type FileDetailsProps = {
    onDownload: (id: string, name: string, srcUrl?: string) => void
    onShare: (id: string, srcUrl?: string) => void
    onRename: (id: string, name: string) => void
    onDelete: (id: string, name: string) => void
}

const InfoRow = ({
    label,
    value,
}: {
    label: string
    value: string | ReactNode
}) => {
    return (
        <div className="flex items-center justify-between text-sm py-1.5 border-b border-gray-100 dark:border-gray-800">
            <span className="text-gray-500 dark:text-gray-400">{label}</span>
            <span className="heading-text font-medium text-right max-w-[200px] truncate">{value}</span>
        </div>
    )
}

const isImage = (type: string = '') => {
    return ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(type.toLowerCase())
}

const FileDetails = ({ onDownload, onShare, onRename, onDelete }: FileDetailsProps) => {
    const { selectedFile, setSelectedFile, fileList } = useFileManagerStore()

    const file = useMemo(() => {
        return fileList.find((file) => selectedFile === file.id)
    }, [fileList, selectedFile])

    const handleDrawerClose = () => {
        setSelectedFile('')
    }

    return (
        <Drawer
            title={null}
            closable={false}
            isOpen={Boolean(selectedFile)}
            showBackdrop={true}
            width={380}
            onClose={handleDrawerClose}
            onRequestClose={handleDrawerClose}
        >
            {file && (
                <div className="flex flex-col h-full justify-between">
                    <div>
                        <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-gray-700">
                            <h5 className="font-bold">File Details</h5>
                            <CloseButton onClick={handleDrawerClose} />
                        </div>

                        <div className="mt-6 flex justify-center p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                            {isImage(file.fileType) && file.srcUrl ? (
                                <img
                                    src={file.srcUrl}
                                    className="max-h-[190px] rounded-xl object-contain shadow-sm"
                                    alt={file.name}
                                />
                            ) : (
                                <FileIcon type={file.fileType} size={100} />
                            )}
                        </div>

                        <div className="mt-4 text-center">
                            <h5 className="font-bold break-all">{file.name}</h5>
                            <span className="text-xs text-gray-500">
                                Uploaded by {file.author.name || 'Team Member'}
                            </span>
                        </div>

                        <div className="mt-6">
                            <h6 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Properties</h6>
                            <div className="flex flex-col">
                                <InfoRow
                                    label="File Size"
                                    value={fileSizeUnit(file.size)}
                                />
                                <InfoRow
                                    label="Extension / Format"
                                    value={<FileType type={file.fileType} />}
                                />
                                <InfoRow
                                    label="Upload Date"
                                    value={dayjs
                                        .unix(file.uploadDate)
                                        .format('MMM DD, YYYY · hh:mm A')}
                                />
                                {file.author.email && (
                                    <InfoRow
                                        label="Uploader Email"
                                        value={file.author.email}
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-200 dark:border-gray-700 flex flex-col gap-2">
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                size="sm"
                                icon={<TbDownload />}
                                onClick={() => onDownload(file.id, file.name, file.srcUrl)}
                            >
                                Download
                            </Button>
                            <Button
                                size="sm"
                                icon={<TbShare />}
                                onClick={() => onShare(file.id, file.srcUrl)}
                            >
                                Share Link
                            </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                size="sm"
                                icon={<TbPencil />}
                                onClick={() => onRename(file.id, file.name)}
                            >
                                Rename
                            </Button>
                            <Button
                                size="sm"
                                variant="default"
                                customColorClass={() => 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-800'}
                                icon={<TbTrash />}
                                onClick={() => onDelete(file.id, file.name)}
                            >
                                Delete
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </Drawer>
    )
}

export default FileDetails
