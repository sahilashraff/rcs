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

export type LoginAuthSettings = {
    google_oauth_enabled: boolean
    google_client_id: string
    google_client_secret_set: boolean
    github_oauth_enabled: boolean
    github_client_id: string
    github_client_secret_set: boolean
    recaptcha_enabled: boolean
    recaptcha_site_key: string
    recaptcha_secret_key_set: boolean
    signup_allowed_countries: string[]
}

export type PusherSettings = {
    enabled: boolean
    app_id: string
    key: string
    secret_set: boolean
    cluster: string
}

export const AI_PROVIDER_OPTIONS = [
    { value: 'anthropic', label: 'Anthropic' },
    { value: 'openai', label: 'OpenAI' },
    { value: 'google', label: 'Google' },
    { value: 'azure_openai', label: 'Azure OpenAI' },
    { value: 'custom', label: 'Custom (OpenAI-compatible)' },
] as const

export type AiProvider = (typeof AI_PROVIDER_OPTIONS)[number]['value']

export type AiProviderSettings = {
    enabled: boolean
    provider: AiProvider
    api_key_set: boolean
    default_model: string
}

export type Settings = {
    otp_verification_enabled: boolean
    general: GeneralSettings
    localisation: LocalisationSettings
    file_manager: FileManagerSettings
    notification_sound: NotificationSoundSettings
    login_auth: LoginAuthSettings
    pusher: PusherSettings
    ai_provider: AiProviderSettings
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

export type LoginAuthUpdateFields = {
    google_oauth_enabled: boolean
    google_client_id?: string
    google_client_secret?: string
    github_oauth_enabled: boolean
    github_client_id?: string
    github_client_secret?: string
    recaptcha_enabled: boolean
    recaptcha_site_key?: string
    recaptcha_secret_key?: string
    signup_allowed_countries: string[]
}

export async function apiUpdateLoginAuthSettings(data: LoginAuthUpdateFields) {
    return ApiService.fetchDataWithAxios<{ data: LoginAuthSettings }>({
        url: '/admin/settings/login-auth',
        method: 'put',
        data,
    })
}

export type PusherUpdateFields = {
    enabled: boolean
    app_id?: string
    key?: string
    secret?: string
    cluster?: string
}

export async function apiUpdatePusherSettings(data: PusherUpdateFields) {
    return ApiService.fetchDataWithAxios<{ data: PusherSettings }>({
        url: '/admin/settings/pusher',
        method: 'put',
        data,
    })
}

export type AiProviderUpdateFields = {
    enabled: boolean
    provider: AiProvider
    api_key?: string
    default_model?: string
}

export async function apiUpdateAiProviderSettings(data: AiProviderUpdateFields) {
    return ApiService.fetchDataWithAxios<{ data: AiProviderSettings }>({
        url: '/admin/settings/ai-provider',
        method: 'put',
        data,
    })
}
