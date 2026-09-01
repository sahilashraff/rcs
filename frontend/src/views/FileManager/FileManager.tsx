import { useEffect, useState, useCallback } from 'react'
import Table from '@/components/ui/Table'
import TableRowSkeleton from '@/components/shared/loaders/TableRowSkeleton'
import FileManagerHeader from './components/FileManagerHeader'
import FileSegment from './components/FileSegment'
import FileList from './components/FileList'
import FileDetails from './components/FileDetails'
import FileManagerDeleteDialog from './components/FileManagerDeleteDialog'
import FileManagerInviteDialog from './components/FileManagerInviteDialog'
import FileManagerRenameDialog from './components/FileManagerRenameDialog'
import { useFileManagerStore } from './store/useFileManagerStore'
import { apiGetFiles, apiGetStorageUsage } from '@/services/FileService'

const { THead, Th, Tr } = Table

const FileManager = () => {
    const {
        layout,
        fileList,
        setFileList,
        setStorageUsage,
        setDeleteDialog,
        setInviteDialog,
        setRenameDialog,
        setSelectedFile,
    } = useFileManagerStore()

    const [isLoading, setIsLoading] = useState(true)

    const fetchFilesAndUsage = useCallback(async () => {
        try {
            const [filesResp, usageResp] = await Promise.all([
                apiGetFiles(),
                apiGetStorageUsage().catch(() => null),
            ])

            if (filesResp.data) {
                setFileList(filesResp.data)
            }
            if (usageResp?.data) {
                setStorageUsage(usageResp.data)
            }
        } catch {
            // handled gracefully
        } finally {
            setIsLoading(false)
        }
    }, [setFileList, setStorageUsage])

    useEffect(() => {
        fetchFilesAndUsage()
    }, [fetchFilesAndUsage])

    const handleShare = (id: string, srcUrl?: string) => {
        const file = fileList.find((f) => f.id === id)
        const url = srcUrl || file?.srcUrl || `${window.location.origin}/api/files/${id}/download`
        setInviteDialog({ id, open: true, url })
    }

    const handleDelete = (id: string, name?: string) => {
        const file = fileList.find((f) => f.id === id)
        setDeleteDialog({ id, name: name || file?.name, open: true })
    }

    const handleRename = (id: string, name?: string) => {
        const file = fileList.find((f) => f.id === id)
        setRenameDialog({ id, name: name || file?.name, open: true })
    }

    const handleDownload = (id: string, name: string, srcUrl?: string) => {
        // File Manager uploads are always on the public disk (real,
        // unauthenticated URLs) — download straight from srcUrl rather
        // than /api/files/{id}/download, which is the PRIVATE-file route
        // and 404s on purpose for anything on the public disk.
        const file = fileList.find((f) => f.id === id)
        const url = srcUrl || file?.srcUrl
        if (!url) return

        const link = document.createElement('a')
        link.href = url
        link.download = name
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const handleClick = (fileId: string) => {
        setSelectedFile(fileId)
    }

    return (
        <>
            <div className="space-y-6">
                <FileManagerHeader onUploadSuccess={fetchFilesAndUsage} />

                <div>
                    {isLoading ? (
                        layout === 'grid' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                                {[...Array(8).keys()].map((item) => (
                                    <FileSegment
                                        key={item}
                                        loading={true}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                <Table>
                                    <THead>
                                        <Tr className="bg-gray-50/75 dark:bg-gray-800/75">
                                            <Th>File Name</Th>
                                            <Th>Size</Th>
                                            <Th>Type</Th>
                                            <Th>Uploaded</Th>
                                            <Th className="text-right"></Th>
                                        </Tr>
                                    </THead>
                                    <TableRowSkeleton
                                        avatarInColumns={[0]}
                                        columns={5}
                                        rows={6}
                                        avatarProps={{
                                            width: 32,
                                            height: 32,
                                        }}
                                    />
                                </Table>
                            </div>
                        )
                    ) : (
                        <FileList
                            fileList={fileList}
                            layout={layout}
                            onDownload={handleDownload}
                            onShare={handleShare}
                            onDelete={handleDelete}
                            onRename={handleRename}
                            onClick={handleClick}
                        />
                    )}
                </div>
            </div>

            <FileDetails
                onDownload={handleDownload}
                onShare={handleShare}
                onRename={handleRename}
                onDelete={handleDelete}
            />
            <FileManagerDeleteDialog onDeleted={fetchFilesAndUsage} />
            <FileManagerInviteDialog />
            <FileManagerRenameDialog onRenamed={fetchFilesAndUsage} />
        </>
    )
}

export default FileManager
