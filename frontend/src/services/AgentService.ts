import ApiService from './ApiService'

export const AGENT_TYPE_OPTIONS = [
    { value: 'otp', label: 'OTP' },
    { value: 'transactional', label: 'Transactional' },
    { value: 'promotional', label: 'Promotional' },
    { value: 'multi_use', label: 'Multi-use' },
] as const

export const AGENT_TYPES = AGENT_TYPE_OPTIONS.map((opt) => opt.value)

export type AgentType = (typeof AGENT_TYPE_OPTIONS)[number]['value']

export type AgentSummary = {
    id: number
    tenant_id: number
    tenant_name: string
    brand_name: string | null
    carrier_id: number
    carrier_code: string
    carrier_name: string
    os: 'android' | 'ios'
    type: AgentType
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
    type: AgentType
    carrier_external_id: string | null
    status: string
    rejection_reason: string | null
    suspended_by: 'admin' | 'carrier' | null
    last_submitted_payload: unknown
    last_carrier_response: unknown
    created_at: string
    updated_at: string
}

export async function apiGetAgents(tenantId?: number) {
    return ApiService.fetchDataWithAxios<{ data: AgentSummary[] }>({
        url: '/admin/agents',
        method: 'get',
        params: tenantId ? { tenant_id: tenantId } : undefined,
    })
}

export async function apiCreateAgent(
    tenantId: number,
    data: { carrier_id: number; os: 'android' | 'ios'; type: AgentType },
) {
    return ApiService.fetchDataWithAxios<{ data: Agent }>({
        url: `/admin/tenants/${tenantId}/agents`,
        method: 'post',
        data,
    })
}

export async function apiUpdateAgent(
    agentId: number,
    data: {
        carrier_id?: number
        os?: 'android' | 'ios'
        type?: AgentType
        carrier_external_id?: string | null
    },
) {
    return ApiService.fetchDataWithAxios<{ data: Agent }>({
        url: `/admin/agents/${agentId}`,
        method: 'patch',
        data,
    })
}

export async function apiDeleteAgent(agentId: number) {
    return ApiService.fetchDataWithAxios<void>({
        url: `/admin/agents/${agentId}`,
        method: 'delete',
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
