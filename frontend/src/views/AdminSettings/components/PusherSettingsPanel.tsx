import { useEffect, useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Switcher from '@/components/ui/Switcher'
import Alert from '@/components/ui/Alert'
import PasswordInput from '@/components/shared/PasswordInput'
import { FormItem } from '@/components/ui/Form'
import { apiUpdatePusherSettings } from '@/services/SettingsService'
import type { PusherSettings } from '@/services/SettingsService'

type PusherSettingsPanelProps = {
    pusher: PusherSettings | undefined
    onUpdated: (pusher: PusherSettings) => void
}

const EMPTY_FORM = {
    enabled: false,
    app_id: '',
    key: '',
    secret: '',
    cluster: '',
}

const PusherSettingsPanel = ({ pusher, onUpdated }: PusherSettingsPanelProps) => {
    const [form, setForm] = useState(EMPTY_FORM)
    const [isSaving, setIsSaving] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    useEffect(() => {
        setForm({
            enabled: pusher?.enabled ?? false,
            app_id: pusher?.app_id ?? '',
            key: pusher?.key ?? '',
            secret: '',
            cluster: pusher?.cluster ?? '',
        })
    }, [pusher])

    const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((prev) => ({ ...prev, [field]: e.target.value }))

    const handleSave = async () => {
        try {
            setIsSaving(true)
            setErrorMessage(null)
            const resp = await apiUpdatePusherSettings({
                enabled: form.enabled,
                app_id: form.app_id,
                key: form.key,
                secret: form.secret || undefined,
                cluster: form.cluster,
            })
            onUpdated(resp.data)
        } catch (err: any) {
            setErrorMessage(err?.response?.data?.message || 'Failed to save Pusher settings.')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
                <div>
                    <h4 className="heading-text font-bold">Pusher</h4>
                    <p className="text-gray-500 text-sm mt-1">Realtime chat connection credentials.</p>
                </div>
                <Switcher
                    checked={form.enabled}
                    onChange={(checked) => setForm((prev) => ({ ...prev, enabled: checked }))}
                    disabled={isSaving}
                />
            </div>

            {errorMessage && (
                <Alert type="danger" showIcon className="text-xs">
                    {errorMessage}
                </Alert>
            )}

            <FormItem label="App ID" className="mb-0">
                <Input value={form.app_id} onChange={set('app_id')} disabled={isSaving} />
            </FormItem>
            <FormItem label="Key" className="mb-0">
                <Input value={form.key} onChange={set('key')} disabled={isSaving} />
            </FormItem>
            <FormItem
                label="Secret"
                extra={pusher?.secret_set ? 'A secret is already saved — leave blank to keep it.' : undefined}
                className="mb-0"
            >
                <PasswordInput
                    value={form.secret}
                    onChange={set('secret')}
                    disabled={isSaving}
                    placeholder={pusher?.secret_set ? '••••••••' : ''}
                />
            </FormItem>
            <FormItem label="Cluster" extra="e.g. mt1, us2, eu, ap2" className="mb-0">
                <Input value={form.cluster} onChange={set('cluster')} disabled={isSaving} />
            </FormItem>

            <div className="flex justify-end pt-2">
                <Button type="button" variant="solid" loading={isSaving} onClick={handleSave}>
                    Save Pusher Settings
                </Button>
            </div>
        </div>
    )
}

export default PusherSettingsPanel
