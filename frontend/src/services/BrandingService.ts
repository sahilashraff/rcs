import ApiService from './ApiService'
import type { GeneralSettings, AppearanceSettings } from './SettingsService'

export type BrandingResponse = GeneralSettings & AppearanceSettings

export async function apiGetBranding() {
    return ApiService.fetchDataWithAxios<{ data: BrandingResponse }>({
        url: '/branding',
        method: 'get',
    })
}
