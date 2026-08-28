import { useState } from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { FormItem } from '@/components/ui/Form'
import PasswordInput from '@/components/shared/PasswordInput'
import Checkbox from '@/components/ui/Checkbox'
import Alert from '@/components/ui/Alert'
import {
    TbUserPlus,
    TbUser,
    TbMail,
    TbLock,
    TbShieldCheck,
    TbInfoCircle,
} from 'react-icons/tb'
import { getFeatureMetadata } from '../constants'
import type { Feature } from '../types'

type CreateSubAccountDialogProps = {
    isOpen: boolean
    onClose: () => void
    features: Feature[]
    onSubmit: (data: {
        name: string
        email: string
        password: string
        permissions: string[]
    }) => Promise<void>
}

const CreateSubAccountDialog = ({
    isOpen,
    onClose,
    features,
    onSubmit,
}: CreateSubAccountDialogProps) => {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const resetForm = () => {
        setName('')
        setEmail('')
        setPassword('')
        setSelectedPermissions([])
        setErrorMessage(null)
    }

    const handleClose = () => {
        if (!isSubmitting) {
            resetForm()
            onClose()
        }
    }

    const togglePermission = (key: string) => {
        setSelectedPermissions((prev) =>
            prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
        )
    }

    const handleSelectAll = () => {
        if (selectedPermissions.length === features.length) {
            setSelectedPermissions([])
        } else {
            setSelectedPermissions(features.map((f) => f.key))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrorMessage(null)

        if (!name.trim()) {
            setErrorMessage('Staff member name is required.')
            return
        }

        if (!email.trim() || !email.includes('@')) {
            setErrorMessage('Please enter a valid email address.')
            return
        }

        if (!password || password.length < 6) {
            setErrorMessage('Password must be at least 6 characters long.')
            return
        }

        try {
            setIsSubmitting(true)
            await onSubmit({
                name: name.trim(),
                email: email.trim(),
                password,
                permissions: selectedPermissions,
            })
            resetForm()
            onClose()
        } catch (err: any) {
            setErrorMessage(
                err?.response?.data?.message ||
                    err?.message ||
                    'Failed to create sub-account. Please verify the credentials and try again.',
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog
            isOpen={isOpen}
            onClose={handleClose}
            onRequestClose={handleClose}
            width={640}
        >
            <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-primary-subtle text-primary flex items-center justify-center text-xl">
                    <TbUserPlus />
                </div>
                <div>
                    <h4 className="font-bold text-lg heading-text">
                        Create Staff Sub-Account
                    </h4>
                    <p className="text-xs text-gray-500">
                        Add a new team member and assign their initial platform module access.
                    </p>
                </div>
            </div>

            {errorMessage && (
                <Alert type="danger" showIcon className="mb-4 text-xs">
                    {errorMessage}
                </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormItem label="Full Name" asterisk className="mb-0">
                        <Input
                            placeholder="e.g. Sarah Jenkins"
                            prefix={<TbUser className="text-gray-400 text-base" />}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={isSubmitting}
                        />
                    </FormItem>
                    <FormItem label="Email Address" asterisk className="mb-0">
                        <Input
                            type="email"
                            placeholder="e.g. sarah@agency.com"
                            prefix={<TbMail className="text-gray-400 text-base" />}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isSubmitting}
                        />
                    </FormItem>
                </div>

                <FormItem label="Initial Password" asterisk className="mb-0">
                    <PasswordInput
                        placeholder="At least 6 characters"
                        prefix={<TbLock className="text-gray-400 text-base" />}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isSubmitting}
                    />
                    <span className="text-[11px] text-gray-400 mt-1 block">
                        The staff member will use this password to sign in to their sub-account.
                    </span>
                </FormItem>

                {/* Feature Permissions Checklist */}
                <div className="pt-2">
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            Initial Module Permissions
                        </label>
                        {features.length > 0 && (
                            <button
                                type="button"
                                className="text-xs text-primary hover:underline font-semibold"
                                onClick={handleSelectAll}
                            >
                                {selectedPermissions.length === features.length
                                    ? 'Deselect All'
                                    : 'Select All'}
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-2.5 max-h-56 overflow-y-auto pr-1">
                        {features.map((feature) => {
                            const meta = getFeatureMetadata(feature.key, feature.label)
                            const isChecked = selectedPermissions.includes(feature.key)

                            return (
                                <div
                                    key={feature.key}
                                    onClick={() => togglePermission(feature.key)}
                                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                        isChecked
                                            ? 'bg-primary-subtle/30 border-primary/40'
                                            : 'bg-gray-50/50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700/80 hover:bg-gray-100/50'
                                    }`}
                                >
                                    <div className="mt-0.5">
                                        <Checkbox
                                            checked={isChecked}
                                            onChange={() => {}}
                                        />
                                    </div>
                                    <div className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                                        {meta.icon}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-sm heading-text">
                                                {meta.label}
                                            </span>
                                            {feature.sidebar && (
                                                <span className="text-[10px] uppercase font-semibold text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                                                    Sidebar
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {meta.description}
                                        </p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <Button
                        type="button"
                        variant="plain"
                        onClick={handleClose}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="solid"
                        loading={isSubmitting}
                        icon={<TbShieldCheck />}
                    >
                        Create Sub-Account
                    </Button>
                </div>
            </form>
        </Dialog>
    )
}

export default CreateSubAccountDialog
