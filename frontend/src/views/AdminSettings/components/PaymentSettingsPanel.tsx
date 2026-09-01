import { useEffect, useMemo, useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Switcher from '@/components/ui/Switcher'
import Alert from '@/components/ui/Alert'
import PasswordInput from '@/components/shared/PasswordInput'
import { FormItem } from '@/components/ui/Form'
import { apiUpdatePaymentSettings, PAYMENT_GATEWAY_OPTIONS } from '@/services/SettingsService'
import type { PaymentGateway, PaymentSettings } from '@/services/SettingsService'

type PaymentSettingsPanelProps = {
    payment: PaymentSettings | undefined
    onUpdated: (payment: PaymentSettings) => void
}

const PaymentSettingsPanel = ({ payment, onUpdated }: PaymentSettingsPanelProps) => {
    const [enabled, setEnabled] = useState(false)
    const [gateway, setGateway] = useState<PaymentGateway>('stripe')
    const [publicKey, setPublicKey] = useState('')
    const [secretKey, setSecretKey] = useState('')
    const [webhookSecret, setWebhookSecret] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    useEffect(() => {
        setEnabled(payment?.enabled ?? false)
        setGateway(payment?.gateway ?? 'stripe')
        setPublicKey(payment?.public_key ?? '')
        setSecretKey('')
        setWebhookSecret('')
    }, [payment])

    const gatewayValue = useMemo(
        () => PAYMENT_GATEWAY_OPTIONS.find((opt) => opt.value === gateway),
        [gateway],
    )

    const handleSave = async () => {
        try {
            setIsSaving(true)
            setErrorMessage(null)
            const resp = await apiUpdatePaymentSettings({
                enabled,
                gateway,
                public_key: publicKey,
                secret_key: secretKey || undefined,
                webhook_secret: webhookSecret || undefined,
            })
            onUpdated(resp.data)
        } catch (err: any) {
            setErrorMessage(err?.response?.data?.message || 'Failed to save payment settings.')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
                <div>
                    <h4 className="heading-text font-bold">Payment</h4>
                    <p className="text-gray-500 text-sm mt-1">Payment gateway used for billing.</p>
                </div>
                <Switcher checked={enabled} onChange={setEnabled} disabled={isSaving} />
            </div>

            {errorMessage && (
                <Alert type="danger" showIcon className="text-xs">
                    {errorMessage}
                </Alert>
            )}

            <FormItem label="Gateway" className="mb-0">
                <Select
                    options={PAYMENT_GATEWAY_OPTIONS}
                    value={gatewayValue}
                    onChange={(option) => option && setGateway(option.value)}
                    isDisabled={isSaving}
                />
            </FormItem>
            <FormItem label="Public / Publishable Key" className="mb-0">
                <Input value={publicKey} onChange={(e) => setPublicKey(e.target.value)} disabled={isSaving} />
            </FormItem>
            <FormItem
                label="Secret Key"
                extra={payment?.secret_key_set ? 'A secret is already saved — leave blank to keep it.' : undefined}
                className="mb-0"
            >
                <PasswordInput
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    disabled={isSaving}
                    placeholder={payment?.secret_key_set ? '••••••••' : ''}
                />
            </FormItem>
            <FormItem
                label="Webhook Secret"
                extra={payment?.webhook_secret_set ? 'A secret is already saved — leave blank to keep it.' : undefined}
                className="mb-0"
            >
                <PasswordInput
                    value={webhookSecret}
                    onChange={(e) => setWebhookSecret(e.target.value)}
                    disabled={isSaving}
                    placeholder={payment?.webhook_secret_set ? '••••••••' : ''}
                />
            </FormItem>

            <div className="flex justify-end pt-2">
                <Button type="button" variant="solid" loading={isSaving} onClick={handleSave}>
                    Save Payment Settings
                </Button>
            </div>
        </div>
    )
}

export default PaymentSettingsPanel
