import ApiService from './ApiService'

import type { AgentType } from './AgentService'

export type TenantAgentEntry = {
    id: number
    carrier_name: string
    os: 'android' | 'ios'
    type: AgentType
    status: string
    rejection_reason: string | null
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
