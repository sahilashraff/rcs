import Segment from '@/components/ui/Segment'
import UploadFile from './UploadFile'
import { useFileManagerStore } from '../store/useFileManagerStore'
import { TbLayoutGrid, TbList, TbDatabase } from 'react-icons/tb'
import fileSizeUnit from '@/utils/fileSizeUnit'
import type { Layout } from '../types'

type FileManagerHeaderProps = {
    onUploadSuccess?: () => void
}

const FileManagerHeader = ({ onUploadSuccess }: FileManagerHeaderProps) => {
    const { layout, setLayout, storageUsage, fileList } = useFileManagerStore()

    const usedBytes = storageUsage?.used_bytes ?? 0
    const maxStorageMb = storageUsage?.max_storage_mb ?? 1024
    const maxStorageBytes = maxStorageMb * 1024 * 1024
    const usedPercentage = storageUsage?.used_percentage ?? (maxStorageBytes > 0 ? Math.min(100, Math.round((usedBytes / maxStorageBytes) * 100)) : 0)

    return (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div>
                <h3 className="font-bold text-2xl">File Manager</h3>
                <p className="text-gray-500 text-sm mt-1">
                    Manage and organize rich card media, template images, and campaign documents.
                </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                {storageUsage && (
                    <div className="flex items-center gap-2 px-3 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs">
                        <TbDatabase className="text-base text-primary" />
                        <div className="flex flex-col">
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                {fileSizeUnit(usedBytes)} / {maxStorageMb} MB ({usedPercentage}%)
                            </span>
                            <div className="w-28 bg-gray-200 dark:bg-gray-700 rounded-full h-1 mt-0.5 overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${usedPercentage > 90
                                        ? 'bg-red-500'
                                        : usedPercentage > 70
                                            ? 'bg-amber-500'
                                            : 'bg-primary'
                                        }`}
                                    style={{ width: `${Math.max(3, Math.min(100, usedPercentage))}%` }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                <Segment
                    value={layout}
                    onChange={(val) => setLayout(val as Layout)}
                >
                    <Segment.Item value="grid" className="text-lg px-2.5 py-1">
                        <TbLayoutGrid />
                    </Segment.Item>
                    <Segment.Item value="list" className="text-lg px-2.5 py-1">
                        <TbList />
                    </Segment.Item>
                </Segment>

                <UploadFile onUploadSuccess={onUploadSuccess} />
            </div>
        </div>
    )
}

export default FileManagerHeader
