import Table from '@/components/ui/Table'
import FileSegment from './FileSegment'
import FileRow from './FileRow'
import { TbFiles } from 'react-icons/tb'
import type { Files, Layout } from '../types'

type FileListProps = {
    fileList: Files
    layout: Layout
    onRename: (id: string, name: string) => void
    onDownload: (id: string, name: string, srcUrl?: string) => void
    onShare: (id: string, srcUrl?: string) => void
    onDelete: (id: string, name: string) => void
    onClick: (id: string) => void
}

const { TBody, THead, Th, Tr } = Table

const FileList = (props: FileListProps) => {
    const {
        layout,
        fileList,
        onDelete,
        onDownload,
        onShare,
        onRename,
        onClick,
    } = props

    if (fileList.length === 0) {
        return (
            <div className="py-16 text-center">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/40 text-blue-500 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 border border-blue-200 dark:border-blue-800">
                    <TbFiles />
                </div>
                <h4 className="font-bold mb-1">No files uploaded yet</h4>
                <p className="text-gray-500 max-w-sm mx-auto text-sm">
                    Upload rich card media, marketing assets, documents, and template images to use across your campaigns.
                </p>
            </div>
        )
    }

    if (layout === 'grid') {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {fileList.map((file) => (
                    <FileSegment
                        key={file.id}
                        id={file.id}
                        fileType={file.fileType}
                        size={file.size}
                        name={file.name}
                        srcUrl={file.srcUrl}
                        uploadDate={file.uploadDate}
                        author={file.author}
                        onClick={() => onClick(file.id)}
                        onDownload={() => onDownload(file.id, file.name, file.srcUrl)}
                        onShare={() => onShare(file.id, file.srcUrl)}
                        onDelete={() => onDelete(file.id, file.name)}
                        onRename={() => onRename(file.id, file.name)}
                    />
                ))}
            </div>
        )
    }

    return (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <Table>
                <THead>
                    <Tr className="bg-gray-50/75 dark:bg-gray-800/75">
                        <Th>File Name</Th>
                        <Th>Size</Th>
                        <Th>Type</Th>
                        <Th>Uploaded</Th>
                        <Th className="text-right">Actions</Th>
                    </Tr>
                </THead>
                <TBody>
                    {fileList.map((file) => (
                        <FileRow
                            key={file.id}
                            id={file.id}
                            fileType={file.fileType}
                            size={file.size}
                            name={file.name}
                            srcUrl={file.srcUrl}
                            uploadDate={file.uploadDate}
                            author={file.author}
                            onClick={() => onClick(file.id)}
                            onDownload={() => onDownload(file.id, file.name, file.srcUrl)}
                            onShare={() => onShare(file.id, file.srcUrl)}
                            onDelete={() => onDelete(file.id, file.name)}
                            onRename={() => onRename(file.id, file.name)}
                        />
                    ))}
                </TBody>
            </Table>
        </div>
    )
}

export default FileList
