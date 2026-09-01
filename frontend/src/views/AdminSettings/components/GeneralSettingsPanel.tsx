import { useEffect, useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Alert from '@/components/ui/Alert'
import Upload from '@/components/ui/Upload'
import { FormItem } from '@/components/ui/Form'
import { apiUpdateGeneralSettings, GENERAL_LOGO_FIELDS } from '@/services/SettingsService'
import type {
    GeneralLogoField,
    GeneralSettings,
    GeneralSettingsFiles,
} from '@/services/SettingsService'

type GeneralSettingsPanelProps = {
    general: GeneralSettings | undefined
    onUpdated: (general: GeneralSettings) => void
}

const LOGO_LABELS: Record<GeneralLogoField, string> = {
    favicon: 'Favicon',
    logo_light_expanded: 'Logo — Light Mode, Expanded',
    logo_light_collapsed: 'Logo — Light Mode, Collapsed',
    logo_dark_expanded: 'Logo — Dark Mode, Expanded',
    logo_dark_collapsed: 'Logo — Dark Mode, Collapsed',
}

const LogoSlot = ({
    field,
    currentUrl,
    selectedFile,
    onSelect,
}: {
    field: GeneralLogoField
    currentUrl?: string | null
    selectedFile?: File
    onSelect: (file: File | undefined) => void
}) => {
    const previewUrl = selectedFile ? URL.createObjectURL(selectedFile) : currentUrl

    return (
        <div className="flex items-center gap-4 py-4 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
            <div className="w-16 h-16 shrink-0 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                {previewUrl ? (
                    <img src={previewUrl} alt={LOGO_LABELS[field]} className="max-w-full max-h-full object-contain" />
                ) : (
                    <span className="text-[10px] text-gray-400">None</span>
                )}
            </div>
            <div className="flex-1">
                <div className="font-semibold text-sm heading-text">{LOGO_LABELS[field]}</div>
            </div>
            <Upload
                accept={field === 'favicon' ? 'image/x-icon,image/png' : 'image/png,image/webp'}
                uploadLimit={1}
                showList={false}
                onChange={(fileList) => onSelect(fileList[0])}
            >
                <Button type="button" size="sm" variant="default">
                    Replace
                </Button>
            </Upload>
        </div>
    )
}

const GeneralSettingsPanel = ({ general, onUpdated }: GeneralSettingsPanelProps) => {
    const [siteName, setSiteName] = useState('')
    const [metaDescription, setMetaDescription] = useState('')
    const [files, setFiles] = useState<GeneralSettingsFiles>({})
    const [isSaving, setIsSaving] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    useEffect(() => {
        setSiteName(general?.site_name ?? '')
        setMetaDescription(general?.meta_description ?? '')
    }, [general])

    const handleSave = async () => {
        if (!siteName.trim()) {
            setErrorMessage('Site name is required.')
            return
        }
        try {
            setIsSaving(true)
            setErrorMessage(null)
            const resp = await apiUpdateGeneralSettings(
                { site_name: siteName.trim(), meta_description: metaDescription.trim() || undefined },
                files,
            )
            onUpdated(resp.data)
            setFiles({})
        } catch (err: any) {
            setErrorMessage(err?.response?.data?.message || 'Failed to save general settings.')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="pb-4 border-b border-gray-100 dark:border-gray-800">
                <h4 className="heading-text font-bold">General</h4>
                <p className="text-gray-500 text-sm mt-1">
                    Site identity: name, meta description, favicon, and the four logo variants used across light/dark
                    mode and the collapsed/expanded sidebar.
                </p>
            </div>

            {errorMessage && (
                <Alert type="danger" showIcon className="text-xs">
                    {errorMessage}
                </Alert>
            )}

            <FormItem label="Site Name" className="mb-0">
                <Input value={siteName} onChange={(e) => setSiteName(e.target.value)} disabled={isSaving} />
            </FormItem>
            <FormItem label="Meta Description" className="mb-0">
                <Input
                    textArea
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    disabled={isSaving}
                />
            </FormItem>

            <div>
                <h6 className="font-semibold mb-1">Branding Images</h6>
                <div>
                    {GENERAL_LOGO_FIELDS.map((field) => (
                        <LogoSlot
                            key={field}
                            field={field}
                            currentUrl={general?.[`${field}_url`]}
                            selectedFile={files[field]}
                            onSelect={(file) => setFiles((prev) => ({ ...prev, [field]: file }))}
                        />
                    ))}
                </div>
            </div>

            <div className="flex justify-end pt-2">
                <Button type="button" variant="solid" loading={isSaving} onClick={handleSave}>
                    Save General Settings
                </Button>
            </div>
        </div>
    )
}

export default GeneralSettingsPanel
