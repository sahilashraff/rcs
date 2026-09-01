import { useEffect, useState } from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import Alert from '@/components/ui/Alert'
import { FormItem } from '@/components/ui/Form'
import { apiGetCarriers } from '@/services/CarrierService'
import type { Carrier } from '@/services/CarrierService'
import { AGENT_TYPE_OPTIONS } from '@/services/AgentService'
import type { AgentSummary, AgentType } from '@/services/AgentService'

type EditAgentDialogProps = {
    agent: AgentSummary | null
    onClose: () => void
    onSubmit: (data: {
        carrier_id: number
        os: 'android' | 'ios'
        type: AgentType
        carrier_external_id: string | null
    }) => Promise<void>
}

const OS_OPTIONS = [
    { value: 'android' as const, label: 'Android' },
    { value: 'ios' as const, label: 'iOS' },
]

const EditAgentDialog = ({ agent, onClose, onSubmit }: EditAgentDialogProps) => {
    const [carriers, setCarriers] = useState<Carrier[]>([])
    const [carrierId, setCarrierId] = useState<number | null>(null)
    const [os, setOs] = useState<'android' | 'ios' | null>(null)
    const [type, setType] = useState<AgentType | null>(null)
    const [carrierExternalId, setCarrierExternalId] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    useEffect(() => {
        if (agent) {
            apiGetCarriers().then((resp) => setCarriers(resp.data))
            setCarrierId(agent.carrier_id)
            setOs(agent.os)
            setType(agent.type)
            setCarrierExternalId(agent.carrier_external_id ?? '')
            setErrorMessage(null)
        }
    }, [agent])

    const handleClose = () => {
        if (!isSubmitting) onClose()
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!carrierId || !os || !type) {
            setErrorMessage('Choose a carrier, OS, and type.')
            return
        }
        try {
            setIsSubmitting(true)
            await onSubmit({ carrier_id: carrierId, os, type, carrier_external_id: carrierExternalId.trim() || null })
            handleClose()
        } catch (err: any) {
            setErrorMessage(err?.response?.data?.message || 'Failed to update agent.')
        } finally {
            setIsSubmitting(false)
        }
    }

    // Include the agent's current carrier even if it's since been deactivated,
    // so editing an existing row never drops the option it's already set to.
    const carrierOptions = carriers
        .filter((c) => c.is_active || c.id === agent?.carrier_id)
        .map((c) => ({ value: c.id, label: c.name }))

    return (
        <Dialog isOpen={Boolean(agent)} onClose={handleClose} onRequestClose={handleClose} width={420}>
            <h4 className="font-bold text-lg heading-text mb-4">Edit Agent</h4>
            {errorMessage && (
                <Alert type="danger" showIcon className="mb-4 text-xs">
                    {errorMessage}
                </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
                <FormItem label="Carrier" className="mb-0">
                    <Select
                        options={carrierOptions}
                        value={carrierOptions.find((opt) => opt.value === carrierId)}
                        onChange={(option) => setCarrierId(option?.value ?? null)}
                        isDisabled={isSubmitting}
                    />
                </FormItem>
                <FormItem label="OS" className="mb-0">
                    <Select
                        options={OS_OPTIONS}
                        value={OS_OPTIONS.find((opt) => opt.value === os)}
                        onChange={(option) => setOs(option?.value ?? null)}
                        isDisabled={isSubmitting}
                    />
                </FormItem>
                <FormItem label="Type" className="mb-0">
                    <Select
                        options={AGENT_TYPE_OPTIONS}
                        value={AGENT_TYPE_OPTIONS.find((opt) => opt.value === type)}
                        onChange={(option) => setType(option?.value ?? null)}
                        isDisabled={isSubmitting}
                    />
                </FormItem>
                <FormItem label="Carrier External ID" className="mb-0">
                    <Input
                        value={carrierExternalId}
                        onChange={(e) => setCarrierExternalId(e.target.value)}
                        disabled={isSubmitting}
                    />
                </FormItem>
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <Button type="button" variant="plain" onClick={handleClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="solid" loading={isSubmitting}>
                        Save
                    </Button>
                </div>
            </form>
        </Dialog>
    )
}

export default EditAgentDialog
