import { useState } from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import PasswordInput from '@/components/shared/PasswordInput'
import Alert from '@/components/ui/Alert'
import { FormItem } from '@/components/ui/Form'
import { apiCreateTenant, apiSendTenantResetLink } from '@/services/TenantService'
import type { CreateTenantData, Tenant } from '@/services/TenantService'

type CreateTenantDialogProps = {
    isOpen: boolean
    onClose: () => void
    onCreated: () => void
}

const PASSWORD_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*'

const generatePassword = () => {
    const bytes = new Uint32Array(14)
    crypto.getRandomValues(bytes)
    return Array.from(bytes, (b) => PASSWORD_CHARS[b % PASSWORD_CHARS.length]).join('')
}

const EMPTY_FORM = {
    name: '',
    owner_name: '',
    owner_email: '',
    owner_country_code: '+91',
    owner_phone: '',
    owner_password: '',
}

const CreateTenantDialog = ({ isOpen, onClose, onCreated }: CreateTenantDialogProps) => {
    const [form, setForm] = useState(EMPTY_FORM)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [created, setCreated] = useState<{ tenant: Tenant; password: string } | null>(null)
    const [isSendingResetLink, setIsSendingResetLink] = useState(false)
    const [resetLinkSent, setResetLinkSent] = useState(false)

    const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((prev) => ({ ...prev, [field]: e.target.value }))

    const handleClose = () => {
        if (isSubmitting) return
        setForm(EMPTY_FORM)
        setErrorMessage(null)
        setCreated(null)
        setResetLinkSent(false)
        onClose()
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.owner_password || form.owner_password.length < 8) {
            setErrorMessage('Password must be at least 8 characters.')
            return
        }
        try {
            setIsSubmitting(true)
            const data: CreateTenantData = {
                name: form.name,
                owner_name: form.owner_name,
                owner_email: form.owner_email,
                owner_country_code: form.owner_country_code || undefined,
                owner_phone: form.owner_phone || undefined,
                owner_password: form.owner_password,
            }
            const resp = await apiCreateTenant(data)
            setCreated({ tenant: resp.data.tenant, password: form.owner_password })
            onCreated()
        } catch (err: any) {
            setErrorMessage(err?.response?.data?.message || 'Failed to create account.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleSendResetLink = async () => {
        if (!created) return
        try {
            setIsSendingResetLink(true)
            await apiSendTenantResetLink(created.tenant.id)
            setResetLinkSent(true)
        } finally {
            setIsSendingResetLink(false)
        }
    }

    if (created) {
        return (
            <Dialog isOpen={isOpen} onClose={handleClose} onRequestClose={handleClose} width={420}>
                <h4 className="font-bold text-lg heading-text mb-4">Account Created</h4>
                <p className="text-sm mb-4">
                    <strong>{created.tenant.name}</strong> was created for {form.owner_email}.
                </p>
                <FormItem label="Password — copy this now, it won't be shown again" className="mb-4">
                    <Input readOnly value={created.password} onFocus={(e) => e.target.select()} />
                </FormItem>
                {resetLinkSent ? (
                    <Alert type="success" showIcon className="mb-4 text-xs">
                        A password reset link was sent to {form.owner_email}.
                    </Alert>
                ) : (
                    <Button
                        type="button"
                        variant="default"
                        size="sm"
                        className="mb-4"
                        loading={isSendingResetLink}
                        onClick={handleSendResetLink}
                    >
                        Send Reset Link Instead
                    </Button>
                )}
                <div className="flex items-center justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
                    <Button type="button" variant="solid" onClick={handleClose}>
                        Done
                    </Button>
                </div>
            </Dialog>
        )
    }

    return (
        <Dialog isOpen={isOpen} onClose={handleClose} onRequestClose={handleClose} width={480}>
            <h4 className="font-bold text-lg heading-text mb-4">Create Account</h4>
            {errorMessage && (
                <Alert type="danger" showIcon className="mb-4 text-xs">
                    {errorMessage}
                </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
                <FormItem label="Company Name" className="mb-0">
                    <Input value={form.name} onChange={set('name')} required disabled={isSubmitting} />
                </FormItem>
                <FormItem label="Owner Name" className="mb-0">
                    <Input value={form.owner_name} onChange={set('owner_name')} required disabled={isSubmitting} />
                </FormItem>
                <FormItem label="Owner Email" className="mb-0">
                    <Input
                        type="email"
                        value={form.owner_email}
                        onChange={set('owner_email')}
                        required
                        disabled={isSubmitting}
                    />
                </FormItem>
                <div className="grid grid-cols-3 gap-3">
                    <FormItem label="Country Code" className="mb-0">
                        <Input value={form.owner_country_code} onChange={set('owner_country_code')} disabled={isSubmitting} />
                    </FormItem>
                    <div className="col-span-2">
                        <FormItem label="Phone" className="mb-0">
                            <Input value={form.owner_phone} onChange={set('owner_phone')} disabled={isSubmitting} />
                        </FormItem>
                    </div>
                </div>
                <FormItem label="Password" className="mb-0">
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <PasswordInput
                                value={form.owner_password}
                                onChange={set('owner_password')}
                                disabled={isSubmitting}
                            />
                        </div>
                        <Button
                            type="button"
                            variant="default"
                            disabled={isSubmitting}
                            onClick={() => setForm((prev) => ({ ...prev, owner_password: generatePassword() }))}
                        >
                            Generate
                        </Button>
                    </div>
                </FormItem>
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <Button type="button" variant="plain" onClick={handleClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="solid" loading={isSubmitting}>
                        Create
                    </Button>
                </div>
            </form>
        </Dialog>
    )
}

export default CreateTenantDialog
