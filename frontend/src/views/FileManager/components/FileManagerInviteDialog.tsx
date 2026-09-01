import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import { useFileManagerStore } from '../store/useFileManagerStore'
import { TbCopy, TbCheck } from 'react-icons/tb'
import { useState } from 'react'

const FileManagerInviteDialog = () => {
    const { inviteDialog, setInviteDialog } = useFileManagerStore()
    const [copied, setCopied] = useState(false)

    const handleDialogClose = () => {
        setInviteDialog({ id: '', open: false, url: '' })
        setCopied(false)
    }

    const shareUrl = inviteDialog.url || window.location.href

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl)
            setCopied(true)
            toast.push(
                <Notification type="success" title="Link Copied!">
                    File public URL copied to clipboard.
                </Notification>,
                { placement: 'top-center' },
            )
            setTimeout(() => setCopied(false), 2500)
        } catch {
            // fallback
        }
    }

    return (
        <Dialog
            isOpen={inviteDialog.open}
            onClose={handleDialogClose}
            onRequestClose={handleDialogClose}
        >
            <h4 className="font-bold">Share File Link</h4>
            <p className="text-sm text-gray-500 mt-1">
                Anyone with this public URL can view or download this asset for rich cards, bots, and campaigns.
            </p>
            <div className="mt-5">
                <Input
                    readOnly
                    value={shareUrl}
                    suffix={
                        <Button
                            type="button"
                            variant="solid"
                            size="sm"
                            icon={copied ? <TbCheck /> : <TbCopy />}
                            onClick={handleCopy}
                        >
                            {copied ? 'Copied' : 'Copy'}
                        </Button>
                    }
                />
            </div>
            <div className="mt-6 flex justify-end">
                <Button variant="plain" size="sm" onClick={handleDialogClose}>
                    Done
                </Button>
            </div>
        </Dialog>
    )
}

export default FileManagerInviteDialog
