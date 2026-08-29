import { useState } from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { FormItem } from '@/components/ui/Form'
import Alert from '@/components/ui/Alert'

type CreateCarrierDialogProps = {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: { code: string; name: string; country: string }) => Promise<void>
}

const CreateCarrierDialog = ({ isOpen, onClose, onSubmit }: CreateCarrierDialogProps) => {
    const [code, setCode] = useState('')
    const [name, setName] = useState('')
    const [country, setCountry] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const resetForm = () => {
        setCode('')
        setName('')
        setCountry('')
        setErrorMessage(null)
    }

    const handleClose = () => {
        if (!isSubmitting) {
            resetForm()
            onClose()
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrorMessage(null)

        if (!code.trim() || !name.trim() || !country.trim()) {
            setErrorMessage('Code, name, and country are all required.')
            return
        }

        try {
            setIsSubmitting(true)
            await onSubmit({ code: code.trim(), name: name.trim(), country: country.trim().toUpperCase() })
            resetForm()
            onClose()
        } catch (err: any) {
            setErrorMessage(
                err?.response?.data?.message || err?.message || 'Failed to create carrier.',
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog isOpen={isOpen} onClose={handleClose} onRequestClose={handleClose} width={480}>
            <h4 className="font-bold text-lg heading-text mb-4">Add Carrier</h4>

            {errorMessage && (
                <Alert type="danger" showIcon className="mb-4 text-xs">
                    {errorMessage}
                </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <FormItem label="Code" asterisk className="mb-0">
                    <Input
                        placeholder="e.g. tmobile"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        disabled={isSubmitting}
                    />
                </FormItem>
                <FormItem label="Name" asterisk className="mb-0">
                    <Input
                        placeholder="e.g. T-Mobile"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isSubmitting}
                    />
                </FormItem>
                <FormItem label="Country (ISO 2-letter)" asterisk className="mb-0">
                    <Input
                        placeholder="e.g. US"
                        maxLength={2}
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        disabled={isSubmitting}
                    />
                </FormItem>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <Button type="button" variant="plain" onClick={handleClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="solid" loading={isSubmitting}>
                        Add Carrier
                    </Button>
                </div>
            </form>
        </Dialog>
    )
}

export default CreateCarrierDialog
