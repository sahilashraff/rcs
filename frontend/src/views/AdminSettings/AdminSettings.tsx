import { useEffect, useState } from 'react'
import Container from '@/components/shared/Container'
import Card from '@/components/ui/Card'
import Switcher from '@/components/ui/Switcher'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import { apiGetSettings, apiUpdateSettings } from '@/services/SettingsService'
import type { Settings } from '@/services/SettingsService'

const AdminSettings = () => {
    const [settings, setSettings] = useState<Settings | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        apiGetSettings()
            .then((resp) => setSettings(resp.data))
            .catch((error: any) => {
                toast.push(
                    <Notification type="danger" title="Error Loading Settings">
                        {error?.response?.data?.message || 'Failed to fetch settings.'}
                    </Notification>,
                    { placement: 'top-center' },
                )
            })
    }, [])

    const handleToggleOtp = async () => {
        if (!settings) return

        const next = !settings.otp_verification_enabled
        setIsSaving(true)
        try {
            const resp = await apiUpdateSettings({ otp_verification_enabled: next })
            setSettings(resp.data)
        } catch (error: any) {
            toast.push(
                <Notification type="danger" title="Update Failed">
                    {error?.response?.data?.message || 'Could not update settings.'}
                </Notification>,
                { placement: 'top-center' },
            )
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Container className="py-2">
            <h3 className="mb-4">Settings</h3>
            <Card className="border border-gray-200 dark:border-gray-700/80">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="font-semibold heading-text">
                            Require phone verification at sign-up
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                            When on, new accounts must verify a code sent to
                            their phone before they can sign in.
                        </p>
                    </div>
                    <Switcher
                        checked={settings?.otp_verification_enabled ?? false}
                        isLoading={isSaving}
                        onChange={handleToggleOtp}
                    />
                </div>
            </Card>
        </Container>
    )
}

export default AdminSettings
