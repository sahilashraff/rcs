import ApiService from './ApiService'

export type AgentSummary = {
    id: number
    tenant_id: number
    tenant_name: string
    brand_name: string | null
    carrier_id: number
    carrier_code: string
    carrier_name: string
    os: 'android' | 'ios'
    status: string
    carrier_external_id: string | null
    rejection_reason: string | null
    suspended_by: 'admin' | 'carrier' | null
}

export async function apiGetAgents() {
    return ApiService.fetchDataWithAxios<{ data: AgentSummary[] }>({
        url: '/admin/agents',
        method: 'get',
    })
}

export async function apiTransitionAgent(
    agentId: number,
    action: string,
    rejectionReason?: string,
) {
    return ApiService.fetchDataWithAxios<{ data: AgentSummary }>({
        url: `/admin/agents/${agentId}/transition`,
        method: 'post',
        data: { action, rejection_reason: rejectionReason },
    })
}
