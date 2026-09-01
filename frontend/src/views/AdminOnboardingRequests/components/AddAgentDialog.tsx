import { useEffect, useState } from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Alert from '@/components/ui/Alert'
import { FormItem } from '@/components/ui/Form'
import { apiGetCarriers } from '@/services/CarrierService'
import type { Carrier } from '@/services/CarrierService'
import { AGENT_TYPE_OPTIONS } from '@/services/AgentService'
import type { AgentType } from '@/services/AgentService'

type AddAgentDialogProps = {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: { carrier_id: number; os: 'android' | 'ios'; type: AgentType }) => Promise<void>
}

const OS_OPTIONS = [
    { value: 'android' as const, label: 'Android' },
    { value: 'ios' as const, label: 'iOS' },
]

const AddAgentDialog = ({ isOpen, onClose, onSubmit }: AddAgentDialogProps) => {
    const [carriers, setCarriers] = useState<Carrier[]>([])
    const [carrierId, setCarrierId] = useState<number | null>(null)
    const [os, setOs] = useState<'android' | 'ios' | null>(null)
    const [type, setType] = useState<AgentType | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    useEffect(() => {
        if (isOpen) {
            apiGetCarriers().then((resp) => setCarriers(resp.data.filter((c) => c.is_active)))
        }
    }, [isOpen])

    const handleClose = () => {
        if (!isSubmitting) {
            setCarrierId(null)
            setOs(null)
            setType(null)
            setErrorMessage(null)
            onClose()
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!carrierId || !os || !type) {
            setErrorMessage('Choose a carrier, OS, and type.')
            return
        }
        try {
            setIsSubmitting(true)
            await onSubmit({ carrier_id: carrierId, os, type })
            handleClose()
        } catch (err: any) {
            setErrorMessage(err?.response?.data?.message || 'Failed to add agent.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const carrierOptions = carriers.map((c) => ({ value: c.id, label: c.name }))

    return (
        <Dialog isOpen={isOpen} onClose={handleClose} onRequestClose={handleClose} width={420}>
            <h4 className="font-bold text-lg heading-text mb-4">Add Agent</h4>
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
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <Button type="button" variant="plain" onClick={handleClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="solid" loading={isSubmitting}>
                        Add
                    </Button>
                </div>
            </form>
        </Dialog>
    )
}

export default AddAgentDialog
