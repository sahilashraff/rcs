import Alert from '@/components/ui/Alert'
import type { OnboardingRequestRecord } from '@/services/OnboardingService'

type OnboardingPendingBannerProps = {
    request: OnboardingRequestRecord
}

const OnboardingPendingBanner = ({ request }: OnboardingPendingBannerProps) => (
    <div className="flex flex-col gap-4">
        <h3>KYC Under Admin Review</h3>
        <Alert type="info" showIcon>
            Your onboarding request has been submitted and is awaiting review. You&apos;ll be
            notified once a decision has been made.
        </Alert>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
                <div className="text-gray-500">Company</div>
                <div className="font-semibold">{request.company_name}</div>
            </div>
            <div>
                <div className="text-gray-500">RCS Display Name</div>
                <div className="font-semibold">{request.rcs_display_name}</div>
            </div>
            <div>
                <div className="text-gray-500">Contact Person</div>
                <div className="font-semibold">{request.contact_person_name}</div>
            </div>
            <div>
                <div className="text-gray-500">Contact Email</div>
                <div className="font-semibold">{request.contact_person_email}</div>
            </div>
        </div>
    </div>
)

export default OnboardingPendingBanner
