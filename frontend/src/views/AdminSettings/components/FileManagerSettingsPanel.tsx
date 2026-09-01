import { useEffect, useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Alert from '@/components/ui/Alert'
import { FormItem } from '@/components/ui/Form'
import { apiUpdateFileManagerSettings } from '@/services/SettingsService'
import type { FileManagerSettings } from '@/services/SettingsService'

type FileManagerSettingsPanelProps = {
    fileManager: FileManagerSettings | undefined
    onUpdated: (fileManager: FileManagerSettings) => void
}

const FileManagerSettingsPanel = ({ fileManager, onUpdated }: FileManagerSettingsPanelProps) => {
    const [extensionsInput, setExtensionsInput] = useState('')
    const [maxStorageMb, setMaxStorageMb] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    useEffect(() => {
        setExtensionsInput((fileManager?.allowed_extensions ?? []).join(', '))
        setMaxStorageMb(fileManager?.max_storage_mb ? String(fileManager.max_storage_mb) : '')
    }, [fileManager])

    const handleSave = async () => {
        const extensions = extensionsInput
            .split(',')
            .map((ext) => ext.trim().replace(/^\./, ''))
            .filter(Boolean)
        const storageMb = Number(maxStorageMb)

        if (extensions.length === 0) {
            setErrorMessage('List at least one allowed extension.')
            return
        }
        if (!storageMb || storageMb < 1) {
            setErrorMessage('Enter a valid storage limit (in MB).')
            return
        }

        try {
            setIsSaving(true)
            setErrorMessage(null)
            const resp = await apiUpdateFileManagerSettings({
                allowed_extensions: extensions,
                max_storage_mb: storageMb,
            })
            onUpdated(resp.data)
        } catch (err: any) {
            setErrorMessage(err?.response?.data?.message || 'Failed to save file manager settings.')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="pb-4 border-b border-gray-100 dark:border-gray-800">
                <h4 className="heading-text font-bold">File Manager</h4>
                <p className="text-gray-500 text-sm mt-1">
                    Allowed upload extensions and the default storage limit new tenants are assigned. Changing the
                    default here doesn't retroactively change existing tenants — edit those individually from the
                    Tenants list.
                </p>
            </div>

            {errorMessage && (
                <Alert type="danger" showIcon className="text-xs">
                    {errorMessage}
                </Alert>
            )}

            <FormItem
                label="Allowed Extensions"
                extra="Comma-separated, e.g. jpg, png, pdf, docx, mp4"
                className="mb-0"
            >
                <Input
                    value={extensionsInput}
                    onChange={(e) => setExtensionsInput(e.target.value)}
                    disabled={isSaving}
                />
            </FormItem>
            <FormItem label="Default Max Storage (MB) for New Tenants" className="mb-0">
                <Input
                    type="number"
                    min={1}
                    value={maxStorageMb}
                    onChange={(e) => setMaxStorageMb(e.target.value)}
                    disabled={isSaving}
                />
            </FormItem>

            <div className="flex justify-end pt-2">
                <Button type="button" variant="solid" loading={isSaving} onClick={handleSave}>
                    Save File Manager Settings
                </Button>
            </div>
        </div>
    )
}

export default FileManagerSettingsPanel
