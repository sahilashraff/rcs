import { useState } from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { FormItem } from '@/components/ui/Form'
import Alert from '@/components/ui/Alert'

type RejectDialogProps = {
    isOpen: boolean
    onClose: () => void
    onSubmit: (reason: string) => Promise<void>
}

const RejectDialog = ({ isOpen, onClose, onSubmit }: RejectDialogProps) => {
    const [reason, setReason] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const handleClose = () => {
        if (!isSubmitting) {
            setReason('')
            setErrorMessage(null)
            onClose()
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!reason.trim()) {
            setErrorMessage('A rejection reason is required.')
            return
        }
        try {
            setIsSubmitting(true)
            await onSubmit(reason.trim())
            handleClose()
        } catch (err: any) {
            setErrorMessage(err?.response?.data?.message || 'Failed to reject request.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog isOpen={isOpen} onClose={handleClose} onRequestClose={handleClose} width={480}>
            <h4 className="font-bold text-lg heading-text mb-4">Reject Onboarding Request</h4>
            {errorMessage && (
                <Alert type="danger" showIcon className="mb-4 text-xs">
                    {errorMessage}
                </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
                <FormItem label="Rejection Reason" asterisk className="mb-0">
                    <Input
                        textArea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        disabled={isSubmitting}
                    />
                </FormItem>
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <Button type="button" variant="plain" onClick={handleClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="solid" loading={isSubmitting}>
                        Reject
                    </Button>
                </div>
            </form>
        </Dialog>
    )
}

export default RejectDialog
