import { useEffect, useState, useCallback } from 'react'
import Container from '@/components/shared/Container'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import OnboardingForm from './components/OnboardingForm'
import OnboardingPendingBanner from './components/OnboardingPendingBanner'
import OnboardingApprovedPanel from './components/OnboardingApprovedPanel'
import { apiGetMyOnboarding, apiSubmitOnboarding } from '@/services/OnboardingService'
import type {
    OnboardingRequestRecord,
    OnboardingFormFields,
    OnboardingDocumentFiles,
} from '@/services/OnboardingService'

const Onboarding = () => {
    const [request, setRequest] = useState<OnboardingRequestRecord | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const loadData = useCallback(async () => {
        try {
            setIsLoading(true)
            const resp = await apiGetMyOnboarding()
            setRequest(resp.data)
        } catch (error: any) {
            toast.push(
                <Notification type="danger" title="Error Loading Onboarding Status">
                    {error?.response?.data?.message || 'Failed to load onboarding status.'}
                </Notification>,
                { placement: 'top-center' },
            )
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        loadData()
    }, [loadData])

    const handleSubmit = async (fields: OnboardingFormFields, files: OnboardingDocumentFiles) => {
        try {
            await apiSubmitOnboarding(fields, files)
            toast.push(
                <Notification type="success" title="Submitted">
                    Your onboarding request has been submitted for review.
                </Notification>,
                { placement: 'top-center' },
            )
            await loadData()
        } catch (error: any) {
            toast.push(
                <Notification type="danger" title="Submission Failed">
                    {error?.response?.data?.message || 'Could not submit your request.'}
                </Notification>,
                { placement: 'top-center' },
            )
            throw error
        }
    }

    if (isLoading) {
        return <></>
    }

    return (
        <Container>
            <AdaptiveCard>
                {!request || request.status === 'rejected' ? (
                    <OnboardingForm initialData={request} onSubmit={handleSubmit} />
                ) : request.status === 'submitted' ? (
                    <OnboardingPendingBanner request={request} />
                ) : (
                    <OnboardingApprovedPanel request={request} />
                )}
            </AdaptiveCard>
        </Container>
    )
}

export default Onboarding
