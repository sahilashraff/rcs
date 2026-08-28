import { useState } from 'react'
import Avatar from '@/components/ui/Avatar'
import Card from '@/components/ui/Card'
import Tag from '@/components/ui/Tag'
import Button from '@/components/ui/Button'
import Switcher from '@/components/ui/Switcher'
import Dropdown from '@/components/ui/Dropdown'
import Tooltip from '@/components/ui/Tooltip'
import {
    TbShieldCheck,
    TbDotsVertical,
    TbUserPlus,
    TbCopy,
    TbUsers,
    TbShieldOff,
} from 'react-icons/tb'
import { getFeatureMetadata, getAvatarColor, getInitials } from '../constants'
import type { Feature, SubAccount } from '../types'

type SubAccountTableProps = {
    subAccounts: SubAccount[]
    features: Feature[]
    togglingUserId: number | null
    onTogglePermission: (subAccount: SubAccount, featureKey: string) => Promise<void>
    onManageAccess: (subAccount: SubAccount) => void
    onOpenCreateDialog: () => void
    onCopyEmail?: (email: string) => void
}

const SubAccountTable = ({
    subAccounts,
    features,
    togglingUserId,
    onTogglePermission,
    onManageAccess,
    onOpenCreateDialog,
    onCopyEmail,
}: SubAccountTableProps) => {
    const [togglingKey, setTogglingKey] = useState<string | null>(null)

    const handleToggle = async (subAccount: SubAccount, key: string) => {
        setTogglingKey(`${subAccount.id}-${key}`)
        try {
            await onTogglePermission(subAccount, key)
        } finally {
            setTogglingKey(null)
        }
    }

    return (
        <Card bodyClass="p-0 overflow-hidden" className="border border-gray-200 dark:border-gray-700/80">
            {subAccounts.length === 0 ? (
                    <div className="text-center py-12 px-6">
                        <div className="max-w-md mx-auto flex flex-col items-center">
                            <div className="w-14 h-14 rounded-2xl bg-primary-subtle text-primary flex items-center justify-center mb-3 text-2xl">
                                <TbUsers />
                            </div>
                            <h4 className="font-bold text-base heading-text mb-1">
                                No Staff Sub-Accounts Found
                            </h4>
                            <p className="text-gray-500 text-xs mb-5 max-w-sm">
                                Create delegated sub-accounts for your team members and grant them specific access to dashboard, bots, and carriers.
                            </p>
                            <Button
                                size="sm"
                                variant="solid"
                                icon={<TbUserPlus className="text-base" />}
                                onClick={onOpenCreateDialog}
                            >
                                Create First Sub-Account
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700/80 bg-gray-50/75 dark:bg-gray-800/40 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    <th className="py-4 px-6">Staff Member</th>
                                    <th className="py-4 px-6">Role</th>
                                    <th className="py-4 px-6">Granted Permissions</th>
                                    {features.map((feature) => (
                                        <th key={feature.key} className="py-4 px-4 text-center">
                                            <Tooltip title={feature.label}>
                                                <span className="cursor-help inline-flex items-center gap-1 font-semibold text-gray-600 dark:text-gray-300">
                                                    {feature.label.split(' ')[0]}
                                                </span>
                                            </Tooltip>
                                        </th>
                                    ))}
                                    <th className="py-4 px-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700/80">
                                {subAccounts.map((account) => {
                                    const avatarColor = getAvatarColor(account.name)
                                    const initials = getInitials(account.name)
                                    const hasAnyPermission = account.permissions && account.permissions.length > 0

                                    return (
                                        <tr
                                            key={account.id}
                                            className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                                        >
                                            {/* User Column */}
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3.5">
                                                    <Avatar
                                                        size={40}
                                                        shape="circle"
                                                        className={`${avatarColor} font-bold text-sm flex items-center justify-center`}
                                                    >
                                                        {initials}
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-bold text-sm heading-text">
                                                            {account.name}
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            {account.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Role Column */}
                                            <td className="py-4 px-6 whitespace-nowrap">
                                                <Tag className="bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-xs font-semibold py-0.5 px-2.5">
                                                    Sub-Account
                                                </Tag>
                                            </td>

                                            {/* Granted Permissions Summary Tags */}
                                            <td className="py-4 px-6">
                                                <div className="flex flex-wrap items-center gap-1.5 max-w-xs">
                                                    {hasAnyPermission ? (
                                                        account.permissions.map((key) => {
                                                            const meta = getFeatureMetadata(key)
                                                            return (
                                                                <span
                                                                    key={key}
                                                                    className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md border font-medium ${meta.badgeClass}`}
                                                                >
                                                                    <span className="scale-90">{meta.icon}</span>
                                                                    <span>{meta.label.split(' ')[0]}</span>
                                                                </span>
                                                            )
                                                        })
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 font-medium">
                                                            <TbShieldOff className="text-xs" />
                                                            Default Deny (0 Access)
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Direct Feature Matrix Toggles */}
                                            {features.map((feature) => {
                                                const isGranted = account.permissions.includes(feature.key)
                                                const isCurrentToggling =
                                                    togglingKey === `${account.id}-${feature.key}` ||
                                                    togglingUserId === account.id

                                                return (
                                                    <td
                                                        key={feature.key}
                                                        className="py-4 px-4 text-center whitespace-nowrap"
                                                    >
                                                        <div className="inline-flex items-center justify-center">
                                                            <Switcher
                                                                checked={isGranted}
                                                                isLoading={isCurrentToggling}
                                                                onChange={() =>
                                                                    handleToggle(account, feature.key)
                                                                }
                                                            />
                                                        </div>
                                                    </td>
                                                )
                                            })}

                                            {/* Action Buttons */}
                                            <td className="py-4 px-6 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="default"
                                                        icon={<TbShieldCheck className="text-primary text-base" />}
                                                        onClick={() => onManageAccess(account)}
                                                    >
                                                        Manage Access
                                                    </Button>
                                                    <Dropdown
                                                        placement="bottom-end"
                                                        renderTitle={
                                                            <Button
                                                                size="sm"
                                                                variant="plain"
                                                                shape="circle"
                                                                icon={<TbDotsVertical className="text-base text-gray-500" />}
                                                            />
                                                        }
                                                    >
                                                        <Dropdown.Item
                                                            eventKey="manage"
                                                            onClick={() => onManageAccess(account)}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <TbShieldCheck className="text-base text-primary" />
                                                                <span>Configure Permissions</span>
                                                            </div>
                                                        </Dropdown.Item>
                                                        {onCopyEmail && (
                                                            <Dropdown.Item
                                                                eventKey="copy"
                                                                onClick={() => onCopyEmail(account.email)}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <TbCopy className="text-base text-gray-500" />
                                                                    <span>Copy Staff Email</span>
                                                                </div>
                                                            </Dropdown.Item>
                                                        )}
                                                    </Dropdown>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
        </Card>
    )
}

export default SubAccountTable
