import { useEffect, useRef, useState } from 'react'
import Button from '@/components/ui/Button'
import Switcher from '@/components/ui/Switcher'
import Alert from '@/components/ui/Alert'
import Upload from '@/components/ui/Upload'
import { PiPlayFill } from 'react-icons/pi'
import { apiUpdateNotificationSoundSettings } from '@/services/SettingsService'
import type { NotificationSoundSettings } from '@/services/SettingsService'

type NotificationSoundSettingsPanelProps = {
    notificationSound: NotificationSoundSettings | undefined
    onUpdated: (notificationSound: NotificationSoundSettings) => void
}

const NotificationSoundSettingsPanel = ({
    notificationSound,
    onUpdated,
}: NotificationSoundSettingsPanelProps) => {
    const [enabled, setEnabled] = useState(true)
    const [file, setFile] = useState<File | undefined>()
    const [isSaving, setIsSaving] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const audioRef = useRef<HTMLAudioElement>(null)

    useEffect(() => {
        setEnabled(notificationSound?.enabled ?? true)
    }, [notificationSound])

    const handleSave = async () => {
        try {
            setIsSaving(true)
            setErrorMessage(null)
            const resp = await apiUpdateNotificationSoundSettings(enabled, file)
            onUpdated(resp.data)
            setFile(undefined)
        } catch (err: any) {
            setErrorMessage(err?.response?.data?.message || 'Failed to save notification sound settings.')
        } finally {
            setIsSaving(false)
        }
    }

    const previewUrl = file ? URL.createObjectURL(file) : notificationSound?.sound_url

    return (
        <div className="space-y-6">
            <div className="pb-4 border-b border-gray-100 dark:border-gray-800">
                <h4 className="heading-text font-bold">Notification Sound</h4>
                <p className="text-gray-500 text-sm mt-1">
                    The sound played for new chat notifications, and whether it plays at all.
                </p>
            </div>

            {errorMessage && (
                <Alert type="danger" showIcon className="text-xs">
                    {errorMessage}
                </Alert>
            )}

            <div className="flex items-center justify-between py-2">
                <div>
                    <div className="font-semibold text-sm heading-text">Play Notification Sound</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                        Turn off to silence chat notifications platform-wide, without removing the sound file.
                    </div>
                </div>
                <Switcher checked={enabled} onChange={setEnabled} disabled={isSaving} />
            </div>

            <div className="flex items-center gap-4 py-2">
                <Button
                    type="button"
                    size="sm"
                    variant="default"
                    icon={<PiPlayFill />}
                    disabled={!previewUrl}
                    onClick={() => audioRef.current?.play()}
                >
                    Preview
                </Button>
                <div className="text-xs text-gray-500">
                    {file ? file.name : notificationSound?.sound_url ? 'Current sound uploaded' : 'No sound uploaded yet'}
                </div>
                {previewUrl && <audio ref={audioRef} src={previewUrl} />}
            </div>

            <Upload accept="audio/*" uploadLimit={1} showList={false} onChange={(fileList) => setFile(fileList[0])}>
                <Button type="button" size="sm" variant="default">
                    {notificationSound?.sound_url ? 'Replace Sound' : 'Upload Sound'}
                </Button>
            </Upload>

            <div className="flex justify-end pt-2">
                <Button type="button" variant="solid" loading={isSaving} onClick={handleSave}>
                    Save Notification Sound Settings
                </Button>
            </div>
        </div>
    )
}

export default NotificationSoundSettingsPanel
