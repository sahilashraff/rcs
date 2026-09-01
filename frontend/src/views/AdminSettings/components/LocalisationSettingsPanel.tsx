import { useEffect, useMemo, useState } from 'react'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Alert from '@/components/ui/Alert'
import { FormItem } from '@/components/ui/Form'
import { apiUpdateLocalisationSettings, apiGetTimezones } from '@/services/SettingsService'
import { CURRENCY_OPTIONS } from '@/constants/currency.constant'
import type { LocalisationSettings } from '@/services/SettingsService'

type LocalisationSettingsPanelProps = {
    localisation: LocalisationSettings | undefined
    onUpdated: (localisation: LocalisationSettings) => void
}

const LocalisationSettingsPanel = ({ localisation, onUpdated }: LocalisationSettingsPanelProps) => {
    const [currencyCode, setCurrencyCode] = useState('')
    const [timezone, setTimezone] = useState('')
    const [timezoneOptions, setTimezoneOptions] = useState<{ value: string; label: string }[]>([])
    const [isSaving, setIsSaving] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    useEffect(() => {
        setCurrencyCode(localisation?.currency_code ?? '')
        setTimezone(localisation?.timezone ?? '')
    }, [localisation])

    useEffect(() => {
        // Sourced from the backend's canonical IANA list (PHP/ICU) rather
        // than the browser's Intl.supportedValuesOf('timeZone') — that
        // API isn't guaranteed to return canonical names (it can return
        // legacy aliases like "Asia/Calcutta" instead of "Asia/Kolkata"),
        // which would then fail the backend's own validation on save.
        apiGetTimezones().then((resp) => {
            setTimezoneOptions((resp.data || []).map((tz) => ({ value: tz, label: tz })))
        })
    }, [])

    const currencyValue = useMemo(
        () => CURRENCY_OPTIONS.find((opt) => opt.value === currencyCode),
        [currencyCode],
    )
    const timezoneValue = useMemo(
        () => timezoneOptions.find((opt) => opt.value === timezone),
        [timezone, timezoneOptions],
    )

    const handleSave = async () => {
        if (!currencyCode || !timezone) {
            setErrorMessage('Choose both a currency and a timezone.')
            return
        }
        try {
            setIsSaving(true)
            setErrorMessage(null)
            const resp = await apiUpdateLocalisationSettings({ currency_code: currencyCode, timezone })
            onUpdated(resp.data)
        } catch (err: any) {
            setErrorMessage(err?.response?.data?.message || 'Failed to save localisation settings.')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="pb-4 border-b border-gray-100 dark:border-gray-800">
                <h4 className="heading-text font-bold">Localisation</h4>
                <p className="text-gray-500 text-sm mt-1">
                    Default currency and timezone used across the platform.
                </p>
            </div>

            {errorMessage && (
                <Alert type="danger" showIcon className="text-xs">
                    {errorMessage}
                </Alert>
            )}

            <FormItem label="Currency" className="mb-0">
                <Select
                    options={CURRENCY_OPTIONS}
                    value={currencyValue}
                    onChange={(option) => setCurrencyCode(option?.value ?? '')}
                    isDisabled={isSaving}
                />
            </FormItem>
            <FormItem label="Timezone" className="mb-0">
                <Select
                    options={timezoneOptions}
                    value={timezoneValue}
                    onChange={(option) => setTimezone(option?.value ?? '')}
                    isDisabled={isSaving || timezoneOptions.length === 0}
                />
            </FormItem>

            <div className="flex justify-end pt-2">
                <Button type="button" variant="solid" loading={isSaving} onClick={handleSave}>
                    Save Localisation Settings
                </Button>
            </div>
        </div>
    )
}

export default LocalisationSettingsPanel
