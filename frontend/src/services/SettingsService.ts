import ApiService from './ApiService'

export const GENERAL_LOGO_FIELDS = [
    'favicon',
    'logo_light_expanded',
    'logo_light_collapsed',
    'logo_dark_expanded',
    'logo_dark_collapsed',
] as const

export type GeneralLogoField = (typeof GENERAL_LOGO_FIELDS)[number]

export type GeneralSettings = {
    site_name?: string
    meta_description?: string | null
} & {
    [K in GeneralLogoField as `${K}_url`]?: string | null
}

export type LocalisationSettings = {
    currency_code: string
    timezone: string
}

export type FileManagerSettings = {
    allowed_extensions: string[]
    max_storage_mb: number
}

export type NotificationSoundSettings = {
    enabled: boolean
    sound_url: string | null
}

export type Settings = {
    otp_verification_enabled: boolean
    general: GeneralSettings
    localisation: LocalisationSettings
    file_manager: FileManagerSettings
    notification_sound: NotificationSoundSettings
}

export async function apiGetSettings() {
    return ApiService.fetchDataWithAxios<{ data: Settings }>({
        url: '/admin/settings',
        method: 'get',
    })
}

export async function apiUpdateSettings(data: Partial<Settings>) {
    return ApiService.fetchDataWithAxios<{ data: Settings }>({
        url: '/admin/settings',
        method: 'put',
        data,
    })
}

export type GeneralSettingsFields = {
    site_name: string
    meta_description?: string
}

export type GeneralSettingsFiles = Partial<Record<GeneralLogoField, File>>

export async function apiUpdateGeneralSettings(
    fields: GeneralSettingsFields,
    files: GeneralSettingsFiles,
) {
    const formData = new FormData()

    formData.append('site_name', fields.site_name)
    if (fields.meta_description) {
        formData.append('meta_description', fields.meta_description)
    }

    Object.entries(files).forEach(([key, file]) => {
        if (file) formData.append(key, file)
    })

    return ApiService.fetchDataWithAxios<{ data: GeneralSettings }, FormData>({
        url: '/admin/settings/general',
        method: 'post',
        data: formData,
    })
}

export async function apiGetTimezones() {
    return ApiService.fetchDataWithAxios<{ data: string[] }>({
        url: '/admin/settings/timezones',
        method: 'get',
    })
}

export async function apiUpdateLocalisationSettings(data: LocalisationSettings) {
    return ApiService.fetchDataWithAxios<{ data: LocalisationSettings }>({
        url: '/admin/settings/localisation',
        method: 'put',
        data,
    })
}

export async function apiUpdateFileManagerSettings(data: FileManagerSettings) {
    return ApiService.fetchDataWithAxios<{ data: FileManagerSettings }>({
        url: '/admin/settings/file-manager',
        method: 'put',
        data,
    })
}

export async function apiUpdateNotificationSoundSettings(enabled: boolean, sound?: File) {
    const formData = new FormData()
    formData.append('enabled', enabled ? '1' : '0')
    if (sound) formData.append('sound', sound)

    return ApiService.fetchDataWithAxios<{ data: NotificationSoundSettings }, FormData>({
        url: '/admin/settings/notification-sound',
        method: 'post',
        data: formData,
    })
}
