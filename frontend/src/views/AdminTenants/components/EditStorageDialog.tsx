import { useEffect, useState } from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Alert from '@/components/ui/Alert'
import { FormItem } from '@/components/ui/Form'
import type { Tenant } from '@/services/TenantService'

type EditStorageDialogProps = {
    tenant: Tenant | null
    onClose: () => void
    onSubmit: (maxStorageMb: number) => Promise<void>
}

const EditStorageDialog = ({ tenant, onClose, onSubmit }: EditStorageDialogProps) => {
    const [maxStorageMb, setMaxStorageMb] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    useEffect(() => {
        if (tenant) {
            setMaxStorageMb(String(tenant.max_storage_mb))
            setErrorMessage(null)
        }
    }, [tenant])

    const handleClose = () => {
        if (!isSaving) onClose()
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const value = Number(maxStorageMb)
        if (!value || value < 1) {
            setErrorMessage('Enter a valid storage limit (in MB).')
            return
        }
        try {
            setIsSaving(true)
            await onSubmit(value)
            handleClose()
        } catch (err: any) {
            setErrorMessage(err?.response?.data?.message || 'Failed to update storage limit.')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog isOpen={Boolean(tenant)} onClose={handleClose} onRequestClose={handleClose} width={380}>
            <h4 className="font-bold text-lg heading-text mb-4">
                Storage Limit{tenant ? ` — ${tenant.name}` : ''}
            </h4>
            {errorMessage && (
                <Alert type="danger" showIcon className="mb-4 text-xs">
                    {errorMessage}
                </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
                <FormItem label="Max Storage (MB)" className="mb-0">
                    <Input
                        type="number"
                        min={1}
                        value={maxStorageMb}
                        onChange={(e) => setMaxStorageMb(e.target.value)}
                        disabled={isSaving}
                    />
                </FormItem>
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <Button type="button" variant="plain" onClick={handleClose} disabled={isSaving}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="solid" loading={isSaving}>
                        Save
                    </Button>
                </div>
            </form>
        </Dialog>
    )
}

export default EditStorageDialog
