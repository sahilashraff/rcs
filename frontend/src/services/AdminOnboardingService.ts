import ApiService from './ApiService'
import type { OnboardingRequestRecord, OnboardingStatus } from './OnboardingService'
import type { AgentType } from './AgentService'

export type OnboardingRequestSummary = {
    id: number
    tenant_id: number
    tenant_name: string
    status: OnboardingStatus
    submitted_at: string
}

export type OnboardingRequestDetail = OnboardingRequestRecord & {
    tenant: { id: number; name: string; brand_name: string | null }
}

export async function apiGetOnboardingRequests() {
    return ApiService.fetchDataWithAxios<{ data: OnboardingRequestSummary[] }>({
        url: '/admin/onboarding-requests',
        method: 'get',
    })
}

export async function apiGetOnboardingRequest(id: number) {
    return ApiService.fetchDataWithAxios<{ data: OnboardingRequestDetail }>({
        url: `/admin/onboarding-requests/${id}`,
        method: 'get',
    })
}

export async function apiApproveOnboardingRequest(
    id: number,
    agents: { carrier_id: number; os: 'android' | 'ios'; type: AgentType }[],
) {
    return ApiService.fetchDataWithAxios<{ data: OnboardingRequestRecord }>({
        url: `/admin/onboarding-requests/${id}/approve`,
        method: 'post',
        data: { agents },
    })
}

export async function apiRejectOnboardingRequest(id: number, rejectionReason: string) {
    return ApiService.fetchDataWithAxios<{ data: OnboardingRequestRecord }>({
        url: `/admin/onboarding-requests/${id}/reject`,
        method: 'post',
        data: { rejection_reason: rejectionReason },
    })
}

