import { useState } from 'react'
import Button from '@/components/ui/Button'
import { FormItem, Form } from '@/components/ui/Form'
import OtpInput from '@/components/shared/OtpInput'
import { useAuth } from '@/auth'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { CommonProps } from '@/@types/common'

interface OtpVerificationFormProps extends CommonProps {
    userId: number
    setMessage?: (message: string) => void
}

type OtpVerificationFormSchema = {
    otp: string
}

const OTP_LENGTH = 6

const validationSchema = z.object({
    otp: z
        .string({ error: 'Please enter the verification code' })
        .min(1, { message: 'Please enter the verification code' })
        .min(OTP_LENGTH, { message: 'Please enter a valid 6-digit OTP' }),
})

const OtpVerificationForm = (props: OtpVerificationFormProps) => {
    const [isSubmitting, setSubmitting] = useState<boolean>(false)

    const { className, setMessage, userId } = props

    const { verifyOtp } = useAuth()

    const {
        handleSubmit,
        formState: { errors },
        control,
    } = useForm<OtpVerificationFormSchema>({
        resolver: zodResolver(validationSchema),
        defaultValues: {
            otp: '',
        },
    })

    const onOtpSubmit = async (values: OtpVerificationFormSchema) => {
        setSubmitting(true)
        const result = await verifyOtp({ userId, code: values.otp })

        if (result?.status === 'failed') {
            setMessage?.(result.message)
        }

        setSubmitting(false)
    }

    return (
        <div className={className}>
            <Form onSubmit={handleSubmit(onOtpSubmit)}>
                <FormItem
                    invalid={Boolean(errors.otp)}
                    errorMessage={errors.otp?.message}
                >
                    <Controller
                        name="otp"
                        control={control}
                        render={({ field }) => (
                            <OtpInput
                                placeholder=""
                                inputClass="h-[58px]"
                                length={OTP_LENGTH}
                                {...field}
                            />
                        )}
                    />
                </FormItem>
                <Button
                    block
                    loading={isSubmitting}
                    variant="solid"
                    type="submit"
                >
                    {isSubmitting ? 'Verifying...' : 'Verify OTP'}
                </Button>
            </Form>
        </div>
    )
}

export default OtpVerificationForm
