import { useState } from 'react'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import PasswordInput from '@/components/shared/PasswordInput'
import { FormItem } from '@/components/ui/Form'
import { apiUpdateAccountPassword } from '@/services/AccountService'

const AccountSecurityPanel = () => {
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    const handleSave = async () => {
        setSuccessMessage(null)
        if (!currentPassword || !newPassword || !confirmPassword) {
            setErrorMessage('All fields are required.')
            return
        }
        if (newPassword.length < 8) {
            setErrorMessage('New password must be at least 8 characters.')
            return
        }
        if (newPassword !== confirmPassword) {
            setErrorMessage('New password and confirmation do not match.')
            return
        }
        try {
            setIsSaving(true)
            setErrorMessage(null)
            await apiUpdateAccountPassword(currentPassword, newPassword, confirmPassword)
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
            setSuccessMessage('Password updated. Your other sessions have been signed out.')
        } catch (err: any) {
            setErrorMessage(err?.response?.data?.message || 'Failed to update password.')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="pb-4 border-b border-gray-100 dark:border-gray-800">
                <h4 className="heading-text font-bold">Security</h4>
                <p className="text-gray-500 text-sm mt-1">Change your password.</p>
            </div>

            {errorMessage && (
                <Alert type="danger" showIcon className="text-xs">
                    {errorMessage}
                </Alert>
            )}
            {successMessage && (
                <Alert type="success" showIcon className="text-xs">
                    {successMessage}
                </Alert>
            )}

            <FormItem label="Current Password" className="mb-0">
                <PasswordInput
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={isSaving}
                />
            </FormItem>
            <FormItem label="New Password" className="mb-0">
                <PasswordInput
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isSaving}
                />
            </FormItem>
            <FormItem label="Confirm New Password" className="mb-0">
                <PasswordInput
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isSaving}
                />
            </FormItem>

            <div className="flex justify-end pt-2">
                <Button type="button" variant="solid" loading={isSaving} onClick={handleSave}>
                    Update Password
                </Button>
            </div>
        </div>
    )
}

export default AccountSecurityPanel
