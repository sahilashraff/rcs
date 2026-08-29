import ApiService from './ApiService'

export type Tenant = {
    id: number
    name: string
}

export async function apiGetTenants() {
    return ApiService.fetchDataWithAxios<{ data: Tenant[] }>({
        url: '/admin/tenants',
        method: 'get',
    })
}
