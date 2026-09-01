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

export type Settings = {
    otp_verification_enabled: boolean
    general: GeneralSettings
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
