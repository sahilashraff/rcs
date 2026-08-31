import { useState } from 'react'
import Button from '@/components/ui/Button'
import Tag from '@/components/ui/Tag'
import { getAgentStatusTagClass } from '@/utils/agentStatusTagClass'
import ApproveDialog from './ApproveDialog'
import RejectDialog from './RejectDialog'
import { apiDownloadOnboardingDocument } from '@/services/AdminOnboardingService'
import type { OnboardingRequestDetail as OnboardingRequestDetailType } from '@/services/AdminOnboardingService'

type OnboardingRequestDetailProps = {
    request: OnboardingRequestDetailType
    onBack: () => void
    onApprove: (agents: { carrier_id: number; os: 'android' | 'ios' }[]) => Promise<void>
    onReject: (reason: string) => Promise<void>
}

const FIELD_GROUPS: { title: string; fields: [string, keyof OnboardingRequestDetailType][] }[] = [
    {
        title: 'Company Details',
        fields: [
            ['Registered Company Name', 'company_name'],
            ['Description', 'company_description'],
            ['Location', 'company_location'],
            ['Website', 'company_website'],
            ['GSTIN', 'gstin'],
            ['PAN', 'pan'],
            ['CIN', 'cin'],
            ['Udyam Registration Number', 'udyam_registration_number'],
            ['Account Transaction Type', 'account_transaction_type'],
            ['Address', 'company_address'],
            ['Phone', 'company_phone'],
            ['Email', 'company_email'],
        ],
    },
    {
        title: 'RCS Account',
        fields: [
            ['Account / Legal Name', 'rcs_account_name'],
            ['Display Name', 'rcs_display_name'],
            ['Brand Color', 'rcs_brand_color'],
            ['Description', 'rcs_description'],
        ],
    },
    {
        title: 'Display Contact Info',
        fields: [
            ['Phone Number', 'contact_phone_number'],
            ['Brand Contact Email', 'brand_contact_email'],
            ['Brand Website', 'brand_website'],
        ],
    },
    {
        title: 'Legal / Language Info',
        fields: [
            ['Terms of Use URL', 'terms_of_use_url'],
            ['Privacy Policy URL', 'privacy_policy_url'],
            ['Content Languages', 'rcs_content_languages'],
            ['Opt-in URL', 'rcs_opt_in_url'],
        ],
    },
    {
        title: 'Contact Person',
        fields: [
            ['Industry Type', 'industry_type'],
            ['Name', 'contact_person_name'],
            ['Designation', 'contact_person_designation'],
            ['Email', 'contact_person_email'],
            ['Mobile Number', 'contact_person_mobile_number'],
        ],
    },
]

const DOCUMENT_FIELDS: [string, string][] = [
    ['Brand Logo', 'brand_logo'],
    ['Brand Banner', 'brand_banner'],
    ['Certificate of Incorporation', 'incorporation_certificate'],
    ['PAN Document', 'pan_document'],
    ['GST Document', 'gst_document'],
    ['Other Document', 'other_document'],
]

const OnboardingRequestDetail = ({ request, onBack, onApprove, onReject }: OnboardingRequestDetailProps) => {
    const [approveOpen, setApproveOpen] = useState(false)
    const [rejectOpen, setRejectOpen] = useState(false)

    const viewDocument = async (field: string) => {
        const blob = await apiDownloadOnboardingDocument(request.id, field)
        const url = URL.createObjectURL(blob)
        window.open(url, '_blank')
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <Button size="sm" variant="plain" onClick={onBack}>&larr; Back to list</Button>
                    <h3 className="mt-2">{request.tenant.name}</h3>
                </div>
                <Tag className={`text-xs font-semibold capitalize border ${getAgentStatusTagClass(request.status)}`}>
                    {request.status}
                </Tag>
            </div>

            {request.status === 'rejected' && request.rejection_reason && (
                <div className="text-sm text-red-500">Rejection reason: {request.rejection_reason}</div>
            )}

            {FIELD_GROUPS.map((group) => (
                <div key={group.title}>
                    <h5 className="mb-2">{group.title}</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {group.fields.map(([label, field]) => (
                            <div key={String(field)}>
                                <div className="text-gray-500">{label}</div>
                                <div className="font-semibold">
                                    {Array.isArray(request[field]) ? (request[field] as string[]).join(', ') : String(request[field])}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            <div>
                <h5 className="mb-2">Documents</h5>
                <div className="flex flex-wrap gap-2">
                    {DOCUMENT_FIELDS.map(([label, field]) => {
                        const path = request[`${field}_path` as keyof OnboardingRequestDetailType]
                        return (
                            <Button key={field} size="sm" disabled={!path} onClick={() => viewDocument(field)}>
                                {label}
                            </Button>
                        )
                    })}
                </div>
            </div>

            {request.status === 'submitted' && (
                <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <Button variant="solid" onClick={() => setApproveOpen(true)}>Approve</Button>
                    <Button variant="default" onClick={() => setRejectOpen(true)}>Reject</Button>
                </div>
            )}

            <ApproveDialog isOpen={approveOpen} onClose={() => setApproveOpen(false)} onSubmit={onApprove} />
            <RejectDialog isOpen={rejectOpen} onClose={() => setRejectOpen(false)} onSubmit={onReject} />
        </div>
    )
}

export default OnboardingRequestDetail
