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

export type Agent = {
    id: number
    tenant_id: number
    carrier_id: number
    os: 'android' | 'ios'
    carrier_external_id: string | null
    status: string
    rejection_reason: string | null
    suspended_by: 'admin' | 'carrier' | null
    last_submitted_payload: unknown
    last_carrier_response: unknown
    created_at: string
    updated_at: string
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
    return ApiService.fetchDataWithAxios<{ data: Agent }>({
        url: `/admin/agents/${agentId}/transition`,
        method: 'post',
        data: { action, rejection_reason: rejectionReason },
    })
}
