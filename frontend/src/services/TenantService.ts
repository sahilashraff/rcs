import ApiService from './ApiService'

export type Tenant = {
    id: number
    name: string
    max_storage_mb: number
}

export async function apiGetTenants() {
    return ApiService.fetchDataWithAxios<{ data: Tenant[] }>({
        url: '/admin/tenants',
        method: 'get',
    })
}

export type CreateTenantData = {
    name: string
    owner_name: string
    owner_email: string
    owner_country_code?: string
    owner_phone?: string
    owner_password: string
}

export async function apiCreateTenant(data: CreateTenantData) {
    return ApiService.fetchDataWithAxios<{
        data: { tenant: Tenant; user: { id: number; name: string; email: string } }
    }>({
        url: '/admin/tenants',
        method: 'post',
        data,
    })
}

export async function apiSendTenantResetLink(tenantId: number) {
    return ApiService.fetchDataWithAxios<{ status: string }>({
        url: `/admin/tenants/${tenantId}/send-reset-link`,
        method: 'post',
    })
}

export async function apiUpdateTenantStorage(tenantId: number, maxStorageMb: number) {
    return ApiService.fetchDataWithAxios<{ data: Tenant }>({
        url: `/admin/tenants/${tenantId}/storage`,
        method: 'patch',
        data: { max_storage_mb: maxStorageMb },
    })
}
