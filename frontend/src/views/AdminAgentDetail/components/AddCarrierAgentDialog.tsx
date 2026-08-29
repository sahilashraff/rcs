import { useState } from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import { FormItem } from '@/components/ui/Form'
import Alert from '@/components/ui/Alert'
import type { Carrier } from '@/services/CarrierService'

type CarrierOption = { label: string; value: number }
type OsOption = { label: string; value: 'android' | 'ios' }

const osOptions: OsOption[] = [
    { label: 'Android', value: 'android' },
    { label: 'iOS', value: 'ios' },
]

type AddCarrierAgentDialogProps = {
    isOpen: boolean
    onClose: () => void
    carriers: Carrier[]
    onSubmit: (data: { carrier_id: number; os: 'android' | 'ios' }) => Promise<void>
}

const AddCarrierAgentDialog = ({
    isOpen,
    onClose,
    carriers,
    onSubmit,
}: AddCarrierAgentDialogProps) => {
    const [carrierId, setCarrierId] = useState<number | null>(null)
    const [os, setOs] = useState<'android' | 'ios'>('android')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const carrierOptions: CarrierOption[] = carriers
        .filter((c) => c.is_active)
        .map((c) => ({ label: c.name, value: c.id }))

    const resetForm = () => {
        setCarrierId(null)
        setOs('android')
        setErrorMessage(null)
    }

    const handleClose = () => {
        if (!isSubmitting) {
            resetForm()
            onClose()
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrorMessage(null)

        if (!carrierId) {
            setErrorMessage('Select a carrier.')
            return
        }

        try {
            setIsSubmitting(true)
            await onSubmit({ carrier_id: carrierId, os })
            resetForm()
            onClose()
        } catch (err: any) {
            setErrorMessage(
                err?.response?.data?.message ||
                    err?.message ||
                    'Failed to add carrier registration.',
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog isOpen={isOpen} onClose={handleClose} onRequestClose={handleClose} width={480}>
            <h4 className="font-bold text-lg heading-text mb-4">Add Carrier Registration</h4>

            {errorMessage && (
                <Alert type="danger" showIcon className="mb-4 text-xs">
                    {errorMessage}
                </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <FormItem label="Carrier" asterisk className="mb-0">
                    <Select<CarrierOption>
                        options={carrierOptions}
                        value={carrierOptions.find((opt) => opt.value === carrierId)}
                        onChange={(option) => setCarrierId(option?.value ?? null)}
                        placeholder="Select a carrier..."
                        isDisabled={isSubmitting}
                    />
                </FormItem>
                <FormItem label="OS" asterisk className="mb-0">
                    <Select<OsOption>
                        options={osOptions}
                        value={osOptions.find((opt) => opt.value === os)}
                        onChange={(option) => setOs(option?.value || 'android')}
                        isDisabled={isSubmitting}
                    />
                </FormItem>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <Button type="button" variant="plain" onClick={handleClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="solid" loading={isSubmitting}>
                        Add Registration
                    </Button>
                </div>
            </form>
        </Dialog>
    )
}

export default AddCarrierAgentDialog
