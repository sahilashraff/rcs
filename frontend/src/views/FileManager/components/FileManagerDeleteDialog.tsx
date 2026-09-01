import { useState } from 'react'
import { useFileManagerStore } from '../store/useFileManagerStore'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { apiDeleteFile } from '@/services/FileService'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'

type DeleteDialogProps = {
    onDeleted?: () => void
}

const FileManagerDeleteDialog = ({ onDeleted }: DeleteDialogProps) => {
    const { deleteDialog, setDeleteDialog, deleteFile } = useFileManagerStore()
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDeleteDialogClose = () => {
        setDeleteDialog({ id: '', name: '', open: false })
    }

    const handleDeleteConfirm = async () => {
        if (!deleteDialog.id) return

        setIsDeleting(true)
        try {
            await apiDeleteFile(deleteDialog.id)
            deleteFile(deleteDialog.id)
            handleDeleteDialogClose()
            toast.push(
                <Notification title="File Deleted" type="success">
                    File has been deleted permanently.
                </Notification>,
                { placement: 'top-center' },
            )
            onDeleted?.()
        } catch (err: any) {
            toast.push(
                <Notification title="Error" type="danger">
                    {err?.response?.data?.message || 'Failed to delete file.'}
                </Notification>,
                { placement: 'top-center' },
            )
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <ConfirmDialog
            isOpen={deleteDialog.open}
            type="danger"
            title="Delete File"
            confirmButtonProps={{ loading: isDeleting }}
            onClose={handleDeleteDialogClose}
            onRequestClose={handleDeleteDialogClose}
            onCancel={handleDeleteDialogClose}
            onConfirm={handleDeleteConfirm}
        >
            <p>
                Are you sure you want to delete{' '}
                <span className="font-semibold text-gray-900 dark:text-white">
                    {deleteDialog.name || 'this file'}
                </span>
                ? This action cannot be undone and will permanently remove the file from storage.
            </p>
        </ConfirmDialog>
    )
}

export default FileManagerDeleteDialog
