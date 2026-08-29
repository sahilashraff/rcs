import { useState } from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { FormItem } from '@/components/ui/Form'
import Alert from '@/components/ui/Alert'
import type { Tenant } from '@/services/TenantService'

type TenantOption = { label: string; value: number }

type CreateAgentDialogProps = {
    isOpen: boolean
    onClose: () => void
    tenants: Tenant[]
    onSubmit: (data: {
        tenant_id: number
        name: string
        brand_name: string
        description?: string
    }) => Promise<void>
}

const CreateAgentDialog = ({ isOpen, onClose, tenants, onSubmit }: CreateAgentDialogProps) => {
    const [tenantId, setTenantId] = useState<number | null>(null)
    const [name, setName] = useState('')
    const [brandName, setBrandName] = useState('')
    const [description, setDescription] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const tenantOptions: TenantOption[] = tenants.map((t) => ({ label: t.name, value: t.id }))

    const resetForm = () => {
        setTenantId(null)
        setName('')
        setBrandName('')
        setDescription('')
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

        if (!tenantId) {
            setErrorMessage('Select a tenant.')
            return
        }
        if (!name.trim() || !brandName.trim()) {
            setErrorMessage('Name and brand name are required.')
            return
        }

        try {
            setIsSubmitting(true)
            await onSubmit({
                tenant_id: tenantId,
                name: name.trim(),
                brand_name: brandName.trim(),
                description: description.trim() || undefined,
            })
            resetForm()
            onClose()
        } catch (err: any) {
            setErrorMessage(
                err?.response?.data?.message || err?.message || 'Failed to create agent.',
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog isOpen={isOpen} onClose={handleClose} onRequestClose={handleClose} width={560}>
            <h4 className="font-bold text-lg heading-text mb-4">Create Agent</h4>

            {errorMessage && (
                <Alert type="danger" showIcon className="mb-4 text-xs">
                    {errorMessage}
                </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <FormItem label="Tenant" asterisk className="mb-0">
                    <Select<TenantOption>
                        options={tenantOptions}
                        value={tenantOptions.find((opt) => opt.value === tenantId)}
                        onChange={(option) => setTenantId(option?.value ?? null)}
                        placeholder="Select a tenant..."
                        isDisabled={isSubmitting}
                    />
                </FormItem>
                <FormItem label="Name" asterisk className="mb-0">
                    <Input
                        placeholder="e.g. Support Bot"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isSubmitting}
                    />
                </FormItem>
                <FormItem label="Brand Name" asterisk className="mb-0">
                    <Input
                        placeholder="e.g. Acme Support"
                        value={brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                        disabled={isSubmitting}
                    />
                </FormItem>
                <FormItem label="Description" className="mb-0">
                    <Input
                        textArea
                        placeholder="Optional"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={isSubmitting}
                    />
                </FormItem>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <Button type="button" variant="plain" onClick={handleClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="solid" loading={isSubmitting}>
                        Create Agent
                    </Button>
                </div>
            </form>
        </Dialog>
    )
}

export default CreateAgentDialog
