import { useState } from 'react'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Upload from '@/components/ui/Upload'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import UploadMedia from '@/assets/svg/UploadMedia'
import { apiUploadFiles } from '@/services/FileService'
import { useFileManagerStore } from '../store/useFileManagerStore'
import { TbPlus, TbCloudUpload } from 'react-icons/tb'

type UploadFileProps = {
    onUploadSuccess?: () => void
}

const UploadFile = ({ onUploadSuccess }: UploadFileProps) => {
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
    const appendFiles = useFileManagerStore((state) => state.appendFiles)

    const handleUploadDialogClose = () => {
        setUploadDialogOpen(false)
        setUploadedFiles([])
    }

    const handleUpload = async () => {
        if (uploadedFiles.length === 0) return

        setIsUploading(true)
        try {
            const resp = await apiUploadFiles(uploadedFiles)
            if (resp.data) {
                appendFiles(resp.data)
            }
            handleUploadDialogClose()
            toast.push(
                <Notification title="Upload Successful" type="success">
                    {resp.message || `${uploadedFiles.length} file(s) uploaded successfully.`}
                </Notification>,
                { placement: 'top-center' },
            )
            onUploadSuccess?.()
        } catch (err: any) {
            const errorMessage =
                err?.response?.data?.errors?.files?.[0] ||
                err?.response?.data?.message ||
                'Failed to upload file(s). Check storage limit or file format.'

            toast.push(
                <Notification title="Upload Failed" type="danger">
                    {errorMessage}
                </Notification>,
                { placement: 'top-center' },
            )
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <>
            <Button
                variant="solid"
                icon={<TbPlus />}
                onClick={() => setUploadDialogOpen(true)}
            >
                Upload File
            </Button>
            <Dialog
                isOpen={uploadDialogOpen}
                onClose={handleUploadDialogClose}
                onRequestClose={handleUploadDialogClose}
            >
                <h4 className="font-bold">Upload Files</h4>
                <p className="text-sm text-gray-500 mt-1">
                    Upload images, documents, and media assets to your file library.
                </p>
                <Upload
                    draggable
                    className="mt-5 bg-gray-50 dark:bg-gray-800/60 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl"
                    onChange={setUploadedFiles}
                    onFileRemove={setUploadedFiles}
                >
                    <div className="my-6 text-center">
                        <div className="text-6xl mb-4 flex justify-center">
                            <UploadMedia height={130} width={180} />
                        </div>
                        <p className="font-semibold text-sm">
                            <span className="text-gray-800 dark:text-white">
                                Drop files here, or{' '}
                            </span>
                            <span className="text-primary hover:underline">browse</span>
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                            Upload images (PNG, JPG, WebP), PDFs, Excel, CSV, Word, or text files.
                        </p>
                    </div>
                </Upload>
                <div className="mt-6 flex justify-end gap-2">
                    <Button
                        size="sm"
                        disabled={isUploading}
                        onClick={handleUploadDialogClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        loading={isUploading}
                        variant="solid"
                        disabled={uploadedFiles.length === 0}
                        icon={<TbCloudUpload />}
                        onClick={handleUpload}
                    >
                        Upload {uploadedFiles.length > 0 ? `(${uploadedFiles.length})` : ''}
                    </Button>
                </div>
            </Dialog>
        </>
    )
}

export default UploadFile
