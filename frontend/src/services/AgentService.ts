import ApiService from './ApiService'

export type AgentSummary = {
    id: number
    tenant_id: number
    tenant_name: string
    name: string
    brand_name: string
    status: string
}

export type CarrierAgentDetail = {
    id: number
    carrier_id: number
    carrier_code: string
    carrier_name: string
    os: 'android' | 'ios'
    status: string
    carrier_external_id: string | null
    rejection_reason: string | null
    suspended_by: 'admin' | 'carrier' | null
}

export type AgentDetail = {
    id: number
    tenant_id: number
    tenant_name: string
    name: string
    brand_name: string
    description: string | null
    status: string
    carrier_agents: CarrierAgentDetail[]
}

export async function apiGetAgents() {
    return ApiService.fetchDataWithAxios<{ data: AgentSummary[] }>({
        url: '/admin/agents',
        method: 'get',
    })
}

export async function apiCreateAgent(data: {
    tenant_id: number
    name: string
    brand_name: string
    description?: string
}) {
    return ApiService.fetchDataWithAxios<{ data: { id: number } }>({
        url: '/admin/agents',
        method: 'post',
        data,
    })
}

export async function apiGetAgent(agentId: number) {
    return ApiService.fetchDataWithAxios<{ data: AgentDetail }>({
        url: `/admin/agents/${agentId}`,
        method: 'get',
    })
}

export async function apiAddCarrierAgent(
    agentId: number,
    data: { carrier_id: number; os?: 'android' | 'ios' },
) {
    return ApiService.fetchDataWithAxios<{ data: CarrierAgentDetail }>({
        url: `/admin/agents/${agentId}/carrier-agents`,
        method: 'post',
        data,
    })
}

export async function apiTransitionCarrierAgent(
    carrierAgentId: number,
    action: string,
    rejectionReason?: string,
) {
    return ApiService.fetchDataWithAxios<{ data: CarrierAgentDetail }>({
        url: `/admin/carrier-agents/${carrierAgentId}/transition`,
        method: 'post',
        data: { action, rejection_reason: rejectionReason },
    })
}
