import { useEffect, useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Switcher from '@/components/ui/Switcher'
import Alert from '@/components/ui/Alert'
import PasswordInput from '@/components/shared/PasswordInput'
import { FormItem } from '@/components/ui/Form'
import { apiUpdateLoginAuthSettings } from '@/services/SettingsService'
import type { LoginAuthSettings } from '@/services/SettingsService'

type LoginAuthSettingsPanelProps = {
    loginAuth: LoginAuthSettings | undefined
    onUpdated: (loginAuth: LoginAuthSettings) => void
}

const EMPTY_FORM = {
    google_oauth_enabled: false,
    google_client_id: '',
    google_client_secret: '',
    github_oauth_enabled: false,
    github_client_id: '',
    github_client_secret: '',
    recaptcha_enabled: false,
    recaptcha_site_key: '',
    recaptcha_secret_key: '',
    signup_allowed_countries: '',
}

const LoginAuthSettingsPanel = ({ loginAuth, onUpdated }: LoginAuthSettingsPanelProps) => {
    const [form, setForm] = useState(EMPTY_FORM)
    const [isSaving, setIsSaving] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    useEffect(() => {
        setForm({
            google_oauth_enabled: loginAuth?.google_oauth_enabled ?? false,
            google_client_id: loginAuth?.google_client_id ?? '',
            google_client_secret: '',
            github_oauth_enabled: loginAuth?.github_oauth_enabled ?? false,
            github_client_id: loginAuth?.github_client_id ?? '',
            github_client_secret: '',
            recaptcha_enabled: loginAuth?.recaptcha_enabled ?? false,
            recaptcha_site_key: loginAuth?.recaptcha_site_key ?? '',
            recaptcha_secret_key: '',
            signup_allowed_countries: (loginAuth?.signup_allowed_countries ?? []).join(', '),
        })
    }, [loginAuth])

    const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((prev) => ({ ...prev, [field]: e.target.value }))

    const handleSave = async () => {
        try {
            setIsSaving(true)
            setErrorMessage(null)
            const resp = await apiUpdateLoginAuthSettings({
                google_oauth_enabled: form.google_oauth_enabled,
                google_client_id: form.google_client_id,
                google_client_secret: form.google_client_secret || undefined,
                github_oauth_enabled: form.github_oauth_enabled,
                github_client_id: form.github_client_id,
                github_client_secret: form.github_client_secret || undefined,
                recaptcha_enabled: form.recaptcha_enabled,
                recaptcha_site_key: form.recaptcha_site_key,
                recaptcha_secret_key: form.recaptcha_secret_key || undefined,
                signup_allowed_countries: form.signup_allowed_countries
                    .split(',')
                    .map((c) => c.trim().toUpperCase())
                    .filter(Boolean),
            })
            onUpdated(resp.data)
        } catch (err: any) {
            setErrorMessage(err?.response?.data?.message || 'Failed to save login & auth settings.')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-8">
            <div className="pb-4 border-b border-gray-100 dark:border-gray-800">
                <h4 className="heading-text font-bold">Login & Auth</h4>
                <p className="text-gray-500 text-sm mt-1">
                    Social sign-in, bot protection, and sign-up country restriction. Client secrets are stored but
                    never shown again once saved.
                </p>
            </div>

            {errorMessage && (
                <Alert type="danger" showIcon className="text-xs">
                    {errorMessage}
                </Alert>
            )}

            {/* Google OAuth */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h6 className="font-semibold">Google Sign-In</h6>
                    <Switcher
                        checked={form.google_oauth_enabled}
                        onChange={(checked) => setForm((prev) => ({ ...prev, google_oauth_enabled: checked }))}
                        disabled={isSaving}
                    />
                </div>
                <FormItem label="Client ID" className="mb-0">
                    <Input value={form.google_client_id} onChange={set('google_client_id')} disabled={isSaving} />
                </FormItem>
                <FormItem
                    label="Client Secret"
                    extra={loginAuth?.google_client_secret_set ? 'A secret is already saved — leave blank to keep it.' : undefined}
                    className="mb-0"
                >
                    <PasswordInput
                        value={form.google_client_secret}
                        onChange={set('google_client_secret')}
                        disabled={isSaving}
                        placeholder={loginAuth?.google_client_secret_set ? '••••••••' : ''}
                    />
                </FormItem>
            </div>

            {/* GitHub OAuth */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h6 className="font-semibold">GitHub Sign-In</h6>
                    <Switcher
                        checked={form.github_oauth_enabled}
                        onChange={(checked) => setForm((prev) => ({ ...prev, github_oauth_enabled: checked }))}
                        disabled={isSaving}
                    />
                </div>
                <FormItem label="Client ID" className="mb-0">
                    <Input value={form.github_client_id} onChange={set('github_client_id')} disabled={isSaving} />
                </FormItem>
                <FormItem
                    label="Client Secret"
                    extra={loginAuth?.github_client_secret_set ? 'A secret is already saved — leave blank to keep it.' : undefined}
                    className="mb-0"
                >
                    <PasswordInput
                        value={form.github_client_secret}
                        onChange={set('github_client_secret')}
                        disabled={isSaving}
                        placeholder={loginAuth?.github_client_secret_set ? '••••••••' : ''}
                    />
                </FormItem>
            </div>

            {/* reCAPTCHA */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h6 className="font-semibold">reCAPTCHA</h6>
                    <Switcher
                        checked={form.recaptcha_enabled}
                        onChange={(checked) => setForm((prev) => ({ ...prev, recaptcha_enabled: checked }))}
                        disabled={isSaving}
                    />
                </div>
                <FormItem label="Site Key" className="mb-0">
                    <Input value={form.recaptcha_site_key} onChange={set('recaptcha_site_key')} disabled={isSaving} />
                </FormItem>
                <FormItem
                    label="Secret Key"
                    extra={loginAuth?.recaptcha_secret_key_set ? 'A secret is already saved — leave blank to keep it.' : undefined}
                    className="mb-0"
                >
                    <PasswordInput
                        value={form.recaptcha_secret_key}
                        onChange={set('recaptcha_secret_key')}
                        disabled={isSaving}
                        placeholder={loginAuth?.recaptcha_secret_key_set ? '••••••••' : ''}
                    />
                </FormItem>
            </div>

            {/* Sign-up country restriction */}
            <div className="space-y-4">
                <h6 className="font-semibold">Sign-Up Country Restriction</h6>
                <FormItem
                    label="Allowed Countries"
                    extra="Comma-separated ISO country codes, e.g. IN, US, GB. Leave blank to allow sign-up from anywhere."
                    className="mb-0"
                >
                    <Input
                        value={form.signup_allowed_countries}
                        onChange={set('signup_allowed_countries')}
                        disabled={isSaving}
                    />
                </FormItem>
            </div>

            <div className="flex justify-end pt-2">
                <Button type="button" variant="solid" loading={isSaving} onClick={handleSave}>
                    Save Login & Auth Settings
                </Button>
            </div>
        </div>
    )
}

export default LoginAuthSettingsPanel
