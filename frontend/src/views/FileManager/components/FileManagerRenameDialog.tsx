import { useState, useEffect } from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useFileManagerStore } from '../store/useFileManagerStore'
import { apiRenameFile } from '@/services/FileService'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'

type RenameDialogProps = {
    onRenamed?: () => void
}

const FileManagerRenameDialog = ({ onRenamed }: RenameDialogProps) => {
    const { renameDialog, setRenameDialog, renameFile } = useFileManagerStore()
    const [newName, setNewName] = useState('')
    const [isRenaming, setIsRenaming] = useState(false)

    useEffect(() => {
        if (renameDialog.open && renameDialog.name) {
            setNewName(renameDialog.name)
        }
    }, [renameDialog.open, renameDialog.name])

    const handleDialogClose = () => {
        setRenameDialog({ id: '', name: '', open: false })
        setNewName('')
    }

    const handleSubmit = async () => {
        if (!renameDialog.id || !newName.trim()) return

        setIsRenaming(true)
        try {
            await apiRenameFile(renameDialog.id, newName.trim())
            renameFile({ id: renameDialog.id, fileName: newName.trim() })
            handleDialogClose()
            toast.push(
                <Notification title="File Renamed" type="success">
                    File was successfully renamed.
                </Notification>,
                { placement: 'top-center' },
            )
            onRenamed?.()
        } catch (err: any) {
            toast.push(
                <Notification title="Error" type="danger">
                    {err?.response?.data?.message || 'Failed to rename file.'}
                </Notification>,
                { placement: 'top-center' },
            )
        } finally {
            setIsRenaming(false)
        }
    }

    return (
        <Dialog
            isOpen={renameDialog.open}
            onClose={handleDialogClose}
            onRequestClose={handleDialogClose}
        >
            <h4 className="font-bold">Rename File</h4>
            <div className="mt-5">
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">File Name</label>
                <Input
                    placeholder="Enter new file name"
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && newName.trim()) {
                            handleSubmit()
                        }
                    }}
                />
            </div>
            <div className="mt-6 flex justify-end items-center gap-2">
                <Button size="sm" onClick={handleDialogClose}>
                    Cancel
                </Button>
                <Button
                    variant="solid"
                    size="sm"
                    loading={isRenaming}
                    disabled={newName.trim().length === 0}
                    onClick={handleSubmit}
                >
                    Save
                </Button>
            </div>
        </Dialog>
    )
}

export default FileManagerRenameDialog
