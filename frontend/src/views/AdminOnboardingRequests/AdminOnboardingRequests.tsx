import { useEffect, useState, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import Container from '@/components/shared/Container'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import OnboardingRequestListTableTools from './components/OnboardingRequestListTableTools'
import OnboardingRequestListTable from './components/OnboardingRequestListTable'
import OnboardingRequestDetail from './components/OnboardingRequestDetail'
import {
    apiGetOnboardingRequests,
    apiGetOnboardingRequest,
    apiApproveOnboardingRequest,
    apiRejectOnboardingRequest,
} from '@/services/AdminOnboardingService'
import type {
    OnboardingRequestSummary,
    OnboardingRequestDetail as OnboardingRequestDetailType,
} from '@/services/AdminOnboardingService'
import type { AgentType } from '@/services/AgentService'

const AdminOnboardingRequests = () => {
    const [searchParams, setSearchParams] = useSearchParams()
    const selectedId = searchParams.get('id')

    const [requests, setRequests] = useState<OnboardingRequestSummary[]>([])
    const [detail, setDetail] = useState<OnboardingRequestDetailType | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [pageIndex, setPageIndex] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    const loadList = useCallback(async () => {
        try {
            setIsLoading(true)
            const resp = await apiGetOnboardingRequests()
            setRequests(resp.data || [])
        } catch (error: any) {
            toast.push(
                <Notification type="danger" title="Error Loading Onboarding Requests">
                    {error?.response?.data?.message || 'Failed to fetch onboarding requests.'}
                </Notification>,
                { placement: 'top-center' },
            )
        } finally {
            setIsLoading(false)
        }
    }, [])

    const loadDetail = useCallback(async (id: number) => {
        try {
            setIsLoading(true)
            const resp = await apiGetOnboardingRequest(id)
            setDetail(resp.data)
        } catch (error: any) {
            toast.push(
                <Notification type="danger" title="Error Loading Request">
                    {error?.response?.data?.message || 'Failed to fetch this onboarding request.'}
                </Notification>,
                { placement: 'top-center' },
            )
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        if (selectedId) {
            loadDetail(Number(selectedId))
        } else {
            setDetail(null)
            loadList()
        }
    }, [selectedId, loadList, loadDetail])

    const handleView = (id: number) => setSearchParams({ id: String(id) })
    const handleBack = () => setSearchParams({})

    const handleApprove = async (agents: { carrier_id: number; os: 'android' | 'ios'; type: AgentType }[]) => {
        if (!detail) return
        await apiApproveOnboardingRequest(detail.id, agents)
        toast.push(
            <Notification type="success" title="Approved">
                Onboarding request approved — Agent rows created.
            </Notification>,
            { placement: 'top-center' },
        )
        await loadDetail(detail.id)
    }

    const handleReject = async (reason: string) => {
        if (!detail) return
        await apiRejectOnboardingRequest(detail.id, reason)
        toast.push(
            <Notification type="success" title="Rejected">
                Onboarding request rejected.
            </Notification>,
            { placement: 'top-center' },
        )
        await loadDetail(detail.id)
    }

    const filteredRequests = useMemo(() => {
        return requests.filter((r) => {
            const query = searchQuery.toLowerCase().trim()
            const matchesQuery = !query || r.tenant_name.toLowerCase().includes(query)
            if (!matchesQuery) return false
            if (statusFilter !== 'all' && r.status !== statusFilter) return false
            return true
        })
    }, [requests, searchQuery, statusFilter])

    useEffect(() => {
        setPageIndex(1)
    }, [searchQuery, statusFilter])

    const pageRequests = useMemo(() => {
        const start = (pageIndex - 1) * pageSize
        return filteredRequests.slice(start, start + pageSize)
    }, [filteredRequests, pageIndex, pageSize])

    const handleSelectChange = (size: number) => {
        setPageSize(size)
        setPageIndex(1)
    }

    return (
        <Container>
            <AdaptiveCard>
                {detail ? (
                    <OnboardingRequestDetail
                        request={detail}
                        onBack={handleBack}
                        onApprove={handleApprove}
                        onReject={handleReject}
                    />
                ) : (
                    <div className="flex flex-col gap-4">
                        <h3>Onboarding Requests</h3>
                        <OnboardingRequestListTableTools
                            onSearchChange={setSearchQuery}
                            statusFilter={statusFilter}
                            onStatusFilterChange={setStatusFilter}
                        />
                        <OnboardingRequestListTable
                            requests={pageRequests}
                            isLoading={isLoading}
                            onView={handleView}
                            pagingData={{
                                total: filteredRequests.length,
                                pageIndex,
                                pageSize,
                            }}
                            onPaginationChange={setPageIndex}
                            onSelectChange={handleSelectChange}
                        />
                    </div>
                )}
            </AdaptiveCard>
        </Container>
    )
}

export default AdminOnboardingRequests
