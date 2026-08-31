import { useEffect, useState } from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Checkbox from '@/components/ui/Checkbox'
import Alert from '@/components/ui/Alert'
import { apiGetCarriers } from '@/services/CarrierService'
import type { Carrier } from '@/services/CarrierService'

type ApproveDialogProps = {
    isOpen: boolean
    onClose: () => void
    onSubmit: (agents: { carrier_id: number; os: 'android' | 'ios' }[]) => Promise<void>
}

const OS_OPTIONS: ('android' | 'ios')[] = ['android', 'ios']

const ApproveDialog = ({ isOpen, onClose, onSubmit }: ApproveDialogProps) => {
    const [carriers, setCarriers] = useState<Carrier[]>([])
    const [selected, setSelected] = useState<Set<string>>(new Set())
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    useEffect(() => {
        if (isOpen) {
            apiGetCarriers().then((resp) => setCarriers(resp.data.filter((c) => c.is_active)))
        }
    }, [isOpen])

    const toggle = (key: string) => {
        setSelected((prev) => {
            const next = new Set(prev)
            if (next.has(key)) next.delete(key)
            else next.add(key)
            return next
        })
    }

    const handleClose = () => {
        if (!isSubmitting) {
            setSelected(new Set())
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
        const agents = Array.from(selected).map((key) => {
            const [carrierId, os] = key.split(':')
            return { carrier_id: Number(carrierId), os: os as 'android' | 'ios' }
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
        <Dialog isOpen={isOpen} onClose={handleClose} onRequestClose={handleClose} width={480}>
            <h4 className="font-bold text-lg heading-text mb-4">Approve — Select Carrier/OS Registrations</h4>
            {errorMessage && (
                <Alert type="danger" showIcon className="mb-4 text-xs">
                    {errorMessage}
                </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                    {carriers.flatMap((carrier) =>
                        OS_OPTIONS.map((os) => {
                            const key = `${carrier.id}:${os}`
                            return (
                                <Checkbox
                                    key={key}
                                    checked={selected.has(key)}
                                    onChange={() => toggle(key)}
                                    disabled={isSubmitting}
                                >
                                    {carrier.name} · {os}
                                </Checkbox>
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
