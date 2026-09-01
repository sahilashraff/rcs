import { useEffect, useState } from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Checkbox from '@/components/ui/Checkbox'
import Select from '@/components/ui/Select'
import Alert from '@/components/ui/Alert'
import { apiGetCarriers } from '@/services/CarrierService'
import type { Carrier } from '@/services/CarrierService'
import { AGENT_TYPE_OPTIONS } from '@/services/AgentService'
import type { AgentType } from '@/services/AgentService'

type ApproveDialogProps = {
    isOpen: boolean
    onClose: () => void
    onSubmit: (agents: { carrier_id: number; os: 'android' | 'ios'; type: AgentType }[]) => Promise<void>
}

const OS_OPTIONS: ('android' | 'ios')[] = ['android', 'ios']

const ApproveDialog = ({ isOpen, onClose, onSubmit }: ApproveDialogProps) => {
    const [carriers, setCarriers] = useState<Carrier[]>([])
    const [selected, setSelected] = useState<Map<string, AgentType | undefined>>(new Map())
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    useEffect(() => {
        if (isOpen) {
            apiGetCarriers().then((resp) => setCarriers(resp.data.filter((c) => c.is_active)))
        }
    }, [isOpen])

    const toggle = (key: string) => {
        setSelected((prev) => {
            const next = new Map(prev)
            if (next.has(key)) next.delete(key)
            else next.set(key, undefined)
            return next
        })
    }

    const setType = (key: string, type: AgentType) => {
        setSelected((prev) => new Map(prev).set(key, type))
    }

    const handleClose = () => {
        if (!isSubmitting) {
            setSelected(new Map())
            setErrorMessage(null)
            onClose()
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (selected.size === 0) {
            setErrorMessage('Select at least one carrier/OS combination.')
            return
        }
        if (Array.from(selected.values()).some((type) => !type)) {
            setErrorMessage('Choose a type for every selected carrier/OS combination.')
            return
        }
        const agents = Array.from(selected.entries()).map(([key, type]) => {
            const [carrierId, os] = key.split(':')
            return { carrier_id: Number(carrierId), os: os as 'android' | 'ios', type: type as AgentType }
        })
        try {
            setIsSubmitting(true)
            await onSubmit(agents)
            handleClose()
        } catch (err: any) {
            setErrorMessage(err?.response?.data?.message || 'Failed to approve request.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog isOpen={isOpen} onClose={handleClose} onRequestClose={handleClose} width={560}>
            <h4 className="font-bold text-lg heading-text mb-4">Approve — Select Carrier/OS Registrations</h4>
            {errorMessage && (
                <Alert type="danger" showIcon className="mb-4 text-xs">
                    {errorMessage}
                </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    {carriers.flatMap((carrier) =>
                        OS_OPTIONS.map((os) => {
                            const key = `${carrier.id}:${os}`
                            const isSelected = selected.has(key)
                            return (
                                <div key={key} className="flex items-center gap-3">
                                    <Checkbox
                                        checked={isSelected}
                                        onChange={() => toggle(key)}
                                        disabled={isSubmitting}
                                    >
                                        {carrier.name} · {os}
                                    </Checkbox>
                                    {isSelected && (
                                        <Select
                                            className="w-44"
                                            size="sm"
                                            placeholder="Type"
                                            options={AGENT_TYPE_OPTIONS}
                                            value={AGENT_TYPE_OPTIONS.find((opt) => opt.value === selected.get(key))}
                                            onChange={(option) => option && setType(key, option.value)}
                                            isDisabled={isSubmitting}
                                        />
                                    )}
                                </div>
                            )
                        }),
                    )}
                </div>
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <Button type="button" variant="plain" onClick={handleClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="solid" loading={isSubmitting}>
                        Approve
                    </Button>
                </div>
            </form>
        </Dialog>
    )
}

export default ApproveDialog
