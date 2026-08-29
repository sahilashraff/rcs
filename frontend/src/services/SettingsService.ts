import ApiService from './ApiService'

export type Settings = {
    otp_verification_enabled: boolean
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
