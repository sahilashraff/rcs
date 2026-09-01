import ApiService from './ApiService'
import type { GeneralSettings } from './SettingsService'

export async function apiGetBranding() {
    return ApiService.fetchDataWithAxios<{ data: GeneralSettings }>({
        url: '/branding',
        method: 'get',
    })
}
