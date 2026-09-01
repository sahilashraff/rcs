import { useEffect, useState, useCallback } from 'react'
import Button from '@/components/ui/Button'
import Tag from '@/components/ui/Tag'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { getAgentStatusTagClass } from '@/utils/agentStatusTagClass'
import ApproveDialog from './ApproveDialog'
import RejectDialog from './RejectDialog'
import AddAgentDialog from './AddAgentDialog'
import AgentListTable from '@/views/AdminAgents/components/AgentListTable'
import EditAgentDialog from '@/views/AdminAgents/components/EditAgentDialog'
import { apiDownloadFile } from '@/services/FileService'
import {
    apiGetAgents,
    apiCreateAgent,
    apiUpdateAgent,
    apiDeleteAgent,
    apiTransitionAgent,
} from '@/services/AgentService'
import type { OnboardingRequestDetail as OnboardingRequestDetailType } from '@/services/AdminOnboardingService'
import type { AgentSummary, AgentType } from '@/services/AgentService'

type OnboardingRequestDetailProps = {
    request: OnboardingRequestDetailType
    onBack: () => void
    onApprove: (agents: { carrier_id: number; os: 'android' | 'ios'; type: AgentType }[]) => Promise<void>
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
    const [agents, setAgents] = useState<AgentSummary[]>([])
    const [agentsLoading, setAgentsLoading] = useState(false)
    const [addAgentOpen, setAddAgentOpen] = useState(false)
    const [editingAgent, setEditingAgent] = useState<AgentSummary | null>(null)
    const [deletingAgent, setDeletingAgent] = useState<AgentSummary | null>(null)

    const loadAgents = useCallback(async () => {
        setAgentsLoading(true)
        try {
            const resp = await apiGetAgents(request.tenant_id)
            setAgents(resp.data || [])
        } finally {
            setAgentsLoading(false)
        }
    }, [request.tenant_id])

    useEffect(() => {
        if (request.status === 'approved') {
            loadAgents()
        }
    }, [request.status, loadAgents])

    const handleTransition = async (agentId: number, action: string, rejectionReason?: string) => {
        try {
            await apiTransitionAgent(agentId, action, rejectionReason)
            await loadAgents()
        } catch (error: any) {
            toast.push(
                <Notification type="danger" title="Transition Failed">
                    {error?.response?.data?.message || 'Could not update status.'}
                </Notification>,
                { placement: 'top-center' },
            )
        }
    }

    const handleAddAgent = async (data: { carrier_id: number; os: 'android' | 'ios'; type: AgentType }) => {
        await apiCreateAgent(request.tenant_id, data)
        toast.push(<Notification type="success" title="Agent Added">Agent created.</Notification>, { placement: 'top-center' })
        await loadAgents()
    }

    const handleEditAgent = async (data: {
        carrier_id: number
        os: 'android' | 'ios'
        type: AgentType
        carrier_external_id: string | null
    }) => {
        if (!editingAgent) return
        await apiUpdateAgent(editingAgent.id, data)
        toast.push(<Notification type="success" title="Agent Updated">Agent updated.</Notification>, { placement: 'top-center' })
        await loadAgents()
    }

    const handleDeleteAgent = async () => {
        if (!deletingAgent) return
        try {
            await apiDeleteAgent(deletingAgent.id)
            toast.push(<Notification type="success" title="Agent Deleted">Agent removed.</Notification>, { placement: 'top-center' })
            await loadAgents()
        } catch (error: any) {
            toast.push(
                <Notification type="danger" title="Delete Failed">
                    {error?.response?.data?.message || 'Could not delete agent.'}
                </Notification>,
                { placement: 'top-center' },
            )
        } finally {
            setDeletingAgent(null)
        }
    }

    const viewDocument = async (fileId: number) => {
        const blob = await apiDownloadFile(fileId)
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
                        const fileId = request[`${field}_file_id` as keyof OnboardingRequestDetailType] as number | null
                        return (
                            <Button key={field} size="sm" disabled={!fileId} onClick={() => fileId && viewDocument(fileId)}>
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

            {request.status === 'approved' && (
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between mb-2">
                        <h5>Agents</h5>
                        <Button size="sm" variant="solid" onClick={() => setAddAgentOpen(true)}>
                            Add Agent
                        </Button>
                    </div>
                    <AgentListTable
                        agents={agents}
                        isLoading={agentsLoading}
                        onTransition={handleTransition}
                        onEdit={setEditingAgent}
                        onDelete={setDeletingAgent}
                        pagingData={{ total: agents.length, pageIndex: 1, pageSize: agents.length || 10 }}
                        onPaginationChange={() => {}}
                        onSelectChange={() => {}}
                    />
                </div>
            )}

            <ApproveDialog isOpen={approveOpen} onClose={() => setApproveOpen(false)} onSubmit={onApprove} />
            <RejectDialog isOpen={rejectOpen} onClose={() => setRejectOpen(false)} onSubmit={onReject} />
            <AddAgentDialog isOpen={addAgentOpen} onClose={() => setAddAgentOpen(false)} onSubmit={handleAddAgent} />
            <EditAgentDialog agent={editingAgent} onClose={() => setEditingAgent(null)} onSubmit={handleEditAgent} />
            <ConfirmDialog
                isOpen={Boolean(deletingAgent)}
                type="danger"
                title="Delete Agent"
                confirmText="Delete"
                onClose={() => setDeletingAgent(null)}
                onRequestClose={() => setDeletingAgent(null)}
                onCancel={() => setDeletingAgent(null)}
                onConfirm={handleDeleteAgent}
            >
                <p>
                    Delete the {deletingAgent?.carrier_name} · {deletingAgent?.os} draft registration? This cannot be
                    undone.
                </p>
            </ConfirmDialog>
        </div>
    )
}

export default OnboardingRequestDetail
