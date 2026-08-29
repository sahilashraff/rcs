import ApiService from './ApiService'

export type TenantAgentCarrierStatus = {
    carrier_name: string
    os: 'android' | 'ios'
    status: string
}

export type TenantAgent = {
    id: number
    name: string
    brand_name: string
    status: string
    carrier_agents: TenantAgentCarrierStatus[]
}

export async function apiGetTenantAgents() {
    return ApiService.fetchDataWithAxios<{ data: TenantAgent[] }>({
        url: '/agents',
        method: 'get',
    })
}
