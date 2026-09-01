import { useEffect, useMemo, useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Switcher from '@/components/ui/Switcher'
import Alert from '@/components/ui/Alert'
import PasswordInput from '@/components/shared/PasswordInput'
import { FormItem } from '@/components/ui/Form'
import { apiUpdateAiProviderSettings, AI_PROVIDER_OPTIONS } from '@/services/SettingsService'
import type { AiProvider, AiProviderSettings } from '@/services/SettingsService'

type AiProviderSettingsPanelProps = {
    aiProvider: AiProviderSettings | undefined
    onUpdated: (aiProvider: AiProviderSettings) => void
}

const AiProviderSettingsPanel = ({ aiProvider, onUpdated }: AiProviderSettingsPanelProps) => {
    const [enabled, setEnabled] = useState(false)
    const [provider, setProvider] = useState<AiProvider>('anthropic')
    const [apiKey, setApiKey] = useState('')
    const [defaultModel, setDefaultModel] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    useEffect(() => {
        setEnabled(aiProvider?.enabled ?? false)
        setProvider(aiProvider?.provider ?? 'anthropic')
        setApiKey('')
        setDefaultModel(aiProvider?.default_model ?? '')
    }, [aiProvider])

    const providerValue = useMemo(
        () => AI_PROVIDER_OPTIONS.find((opt) => opt.value === provider),
        [provider],
    )

    const handleSave = async () => {
        try {
            setIsSaving(true)
            setErrorMessage(null)
            const resp = await apiUpdateAiProviderSettings({
                enabled,
                provider,
                api_key: apiKey || undefined,
                default_model: defaultModel,
            })
            onUpdated(resp.data)
        } catch (err: any) {
            setErrorMessage(err?.response?.data?.message || 'Failed to save AI provider settings.')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
                <div>
                    <h4 className="heading-text font-bold">AI Provider</h4>
                    <p className="text-gray-500 text-sm mt-1">
                        The LLM provider and credentials used for AI-powered features.
                    </p>
                </div>
                <Switcher checked={enabled} onChange={setEnabled} disabled={isSaving} />
            </div>

            {errorMessage && (
                <Alert type="danger" showIcon className="text-xs">
                    {errorMessage}
                </Alert>
            )}

            <FormItem label="Provider" className="mb-0">
                <Select
                    options={AI_PROVIDER_OPTIONS}
                    value={providerValue}
                    onChange={(option) => option && setProvider(option.value)}
                    isDisabled={isSaving}
                />
            </FormItem>
            <FormItem
                label="API Key"
                extra={aiProvider?.api_key_set ? 'A key is already saved — leave blank to keep it.' : undefined}
                className="mb-0"
            >
                <PasswordInput
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    disabled={isSaving}
                    placeholder={aiProvider?.api_key_set ? '••••••••' : ''}
                />
            </FormItem>
            <FormItem label="Default Model" extra="e.g. claude-sonnet-5, gpt-4o" className="mb-0">
                <Input
                    value={defaultModel}
                    onChange={(e) => setDefaultModel(e.target.value)}
                    disabled={isSaving}
                />
            </FormItem>

            <div className="flex justify-end pt-2">
                <Button type="button" variant="solid" loading={isSaving} onClick={handleSave}>
                    Save AI Provider Settings
                </Button>
            </div>
        </div>
    )
}

export default AiProviderSettingsPanel
