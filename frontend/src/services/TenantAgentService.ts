import ApiService from './ApiService'

export type TenantAgentEntry = {
    id: number
    carrier_name: string
    os: 'android' | 'ios'
    status: string
}

export type TenantAgents = {
    status: string
    agents: TenantAgentEntry[]
}

export async function apiGetTenantAgents() {
    return ApiService.fetchDataWithAxios<{ data: TenantAgents }>({
        url: '/agents',
        method: 'get',
    })
}
