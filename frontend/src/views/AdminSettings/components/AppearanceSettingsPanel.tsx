import { useEffect, useState } from 'react'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import Radio from '@/components/ui/Radio'
import classNames from '@/utils/classNames'
import { TbCheck } from 'react-icons/tb'
import { FormItem } from '@/components/ui/Form'
import presetThemeSchemaConfig from '@/configs/preset-theme-schema.config'
import { apiUpdateAppearanceSettings, MODE_OPTIONS } from '@/services/SettingsService'
import type { AppearanceSettings, ThemeMode, ThemeSchema } from '@/services/SettingsService'

type AppearanceSettingsPanelProps = {
    appearance: AppearanceSettings | undefined
    onUpdated: (appearance: AppearanceSettings) => void
}

const AppearanceSettingsPanel = ({ appearance, onUpdated }: AppearanceSettingsPanelProps) => {
    const [schema, setSchema] = useState<ThemeSchema>('default')
    const [mode, setMode] = useState<ThemeMode>('light')
    const [isSaving, setIsSaving] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    useEffect(() => {
        setSchema(appearance?.default_theme_schema ?? 'default')
        setMode(appearance?.default_mode ?? 'light')
    }, [appearance])

    const handleSave = async () => {
        try {
            setIsSaving(true)
            setErrorMessage(null)
            const resp = await apiUpdateAppearanceSettings({ default_theme_schema: schema, default_mode: mode })
            onUpdated(resp.data)
        } catch (err: any) {
            setErrorMessage(err?.response?.data?.message || 'Failed to save appearance settings.')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="pb-4 border-b border-gray-100 dark:border-gray-800">
                <h4 className="heading-text font-bold">Appearance</h4>
                <p className="text-gray-500 text-sm mt-1">
                    The default theme a browser starts with the first time it visits — anyone who's already picked
                    their own theme keeps it; this only sets what a brand-new visitor sees.
                </p>
            </div>

            {errorMessage && (
                <Alert type="danger" showIcon className="text-xs">
                    {errorMessage}
                </Alert>
            )}

            <FormItem label="Default Color Scheme" className="mb-0">
                <div className="flex items-center gap-3">
                    {Object.entries(presetThemeSchemaConfig).map(([key, value]) => (
                        <button
                            key={key}
                            type="button"
                            disabled={isSaving}
                            className={classNames(
                                'h-9 w-9 rounded-full flex items-center justify-center border-2 border-white shadow-sm',
                                schema === key && 'ring-2 ring-primary',
                            )}
                            style={{ backgroundColor: value[mode].primary || '' }}
                            onClick={() => setSchema(key as ThemeSchema)}
                            title={key}
                        >
                            {schema === key && <TbCheck className="text-neutral text-lg" />}
                        </button>
                    ))}
                </div>
            </FormItem>

            <FormItem label="Default Mode" className="mb-0">
                <Radio.Group value={mode} onChange={(val) => setMode(val as ThemeMode)}>
                    {MODE_OPTIONS.map((opt) => (
                        <Radio key={opt.value} value={opt.value} disabled={isSaving}>
                            {opt.label}
                        </Radio>
                    ))}
                </Radio.Group>
            </FormItem>

            <div className="flex justify-end pt-2">
                <Button type="button" variant="solid" loading={isSaving} onClick={handleSave}>
                    Save Appearance Settings
                </Button>
            </div>
        </div>
    )
}

export default AppearanceSettingsPanel
