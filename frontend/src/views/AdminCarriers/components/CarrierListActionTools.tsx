import Button from '@/components/ui/Button'
import { TbPlus } from 'react-icons/tb'

type CarrierListActionToolsProps = {
    onAddCarrier: () => void
}

const CarrierListActionTools = ({ onAddCarrier }: CarrierListActionToolsProps) => {
    return (
        <div className="flex flex-col md:flex-row gap-3">
            <Button
                variant="solid"
                icon={<TbPlus className="text-xl" />}
                onClick={onAddCarrier}
            >
                Add Carrier
            </Button>
        </div>
    )
}

export default CarrierListActionTools
