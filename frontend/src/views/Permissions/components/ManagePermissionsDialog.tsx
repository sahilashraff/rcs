import { useState, useEffect } from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import Switcher from '@/components/ui/Switcher'
import Tag from '@/components/ui/Tag'
import Alert from '@/components/ui/Alert'
import ScrollBar from '@/components/ui/ScrollBar'
import {
    TbShieldCheck,
    TbShieldLock,
    TbUser,
    TbCheck,
    TbX,
    TbLockAccess,
    TbInfoCircle,
} from 'react-icons/tb'
import { getFeatureMetadata, getAvatarColor, getInitials } from '../constants'
import type { Feature, SubAccount } from '../types'

type ManagePermissionsDialogProps = {
    isOpen: boolean
    onClose: () => void
    subAccount: SubAccount | null
    features: Feature[]
    onSavePermissions: (userId: number, permissions: string[]) => Promise<void>
}

const ManagePermissionsDialog = ({
    isOpen,
    onClose,
    subAccount,
    features,
    onSavePermissions,
}: ManagePermissionsDialogProps) => {
    const [permissions, setPermissions] = useState<string[]>([])
    const [isSaving, setIsSaving] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    useEffect(() => {
        if (subAccount) {
            setPermissions(subAccount.permissions || [])
            setErrorMessage(null)
        }
    }, [subAccount])

    if (!subAccount) return null

    const avatarColor = getAvatarColor(subAccount.name)
    const initials = getInitials(subAccount.name)

    const togglePermission = (key: string) => {
        setPermissions((prev) =>
            prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
        )
    }

    const handleGrantAll = () => {
        setPermissions(features.map((f) => f.key))
    }

    const handleRevokeAll = () => {
        setPermissions([])
    }

    const handleSave = async () => {
        try {
            setIsSaving(true)
            setErrorMessage(null)
            await onSavePermissions(subAccount.id, permissions)
            onClose()
        } catch (err: any) {
            setErrorMessage(
                err?.response?.data?.message ||
                    err?.message ||
                    'Failed to update permissions. Please try again.',
            )
        } finally {
            setIsSaving(false)
        }
    }

    const grantedCount = permissions.length
    const totalCount = features.length

    return (
        <Dialog
            isOpen={isOpen}
            onClose={() => !isSaving && onClose()}
            onRequestClose={() => !isSaving && onClose()}
            width={720}
        >
            {/* Header with Sub-Account Info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3.5">
                    <Avatar
                        size={48}
                        shape="circle"
                        className={`${avatarColor} font-bold text-base flex items-center justify-center`}
                    >
                        {initials}
                    </Avatar>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="font-bold text-lg heading-text">
                                {subAccount.name}
                            </h4>
                            <Tag className="bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-xs font-semibold py-0.5 px-2">
                                Sub-Account
                            </Tag>
                        </div>
                        <p className="text-xs text-gray-500">{subAccount.email}</p>
                    </div>
                </div>

                {/* Counter Badge & Quick Actions */}
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-500">
                        Granted:{' '}
                        <span className="font-bold text-primary">
                            {grantedCount} / {totalCount}
                        </span>
                    </span>
                    <Button
                        size="xs"
                        variant="plain"
                        className="text-primary font-semibold hover:bg-primary-subtle"
                        onClick={handleGrantAll}
                        disabled={isSaving}
                    >
                        Grant All
                    </Button>
                    <span className="text-gray-300">|</span>
                    <Button
                        size="xs"
                        variant="plain"
                        className="text-red-500 font-semibold hover:bg-red-50 dark:hover:bg-red-950/30"
                        onClick={handleRevokeAll}
                        disabled={isSaving}
                    >
                        Revoke All
                    </Button>
                </div>
            </div>

            {errorMessage && (
                <Alert type="danger" showIcon className="mt-4 mb-2 text-xs">
                    {errorMessage}
                </Alert>
            )}

            {/* Feature Modules Switcher List */}
            <ScrollBar className="my-4 max-h-[420px] pr-2">
                <div className="space-y-3">
                    {features.map((feature) => {
                        const meta = getFeatureMetadata(feature.key, feature.label)
                        const isGranted = permissions.includes(feature.key)

                        return (
                            <div
                                key={feature.key}
                                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                                    isGranted
                                        ? 'bg-primary-subtle/20 border-primary/40'
                                        : 'bg-gray-50/50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700/80 hover:bg-gray-100/50'
                                }`}
                            >
                                <div className="flex items-center gap-3.5">
                                    <div
                                        className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl border ${meta.colorClass}`}
                                    >
                                        {meta.icon}
                                    </div>
                                    <div className="max-w-md">
                                        <div className="flex items-center gap-2">
                                            <h6 className="font-bold text-sm heading-text">
                                                {meta.label}
                                            </h6>
                                            {feature.sidebar && (
                                                <span className="text-[10px] uppercase font-semibold text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                                                    Sidebar Link
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {meta.description}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Tag
                                        className={`text-xs font-semibold py-0.5 px-2 ${
                                            isGranted
                                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                                : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                                        }`}
                                    >
                                        {isGranted ? 'Allowed' : 'Blocked'}
                                    </Tag>
                                    <Switcher
                                        checked={isGranted}
                                        onChange={() => togglePermission(feature.key)}
                                        disabled={isSaving}
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>
            </ScrollBar>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <TbInfoCircle className="text-sm text-primary" />
                    <span>Permission updates take effect immediately for the staff user.</span>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        type="button"
                        variant="plain"
                        onClick={onClose}
                        disabled={isSaving}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="solid"
                        loading={isSaving}
                        icon={<TbShieldCheck className="text-lg" />}
                        onClick={handleSave}
                    >
                        Save Permissions
                    </Button>
                </div>
            </div>
        </Dialog>
    )
}

export default ManagePermissionsDialog
