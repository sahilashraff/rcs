import { useState } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Steps from '@/components/ui/Steps'
import { FormItem, Form } from '@/components/ui/Form'
import PasswordInput from '@/components/shared/PasswordInput'
import { useAuth } from '@/auth'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { CommonProps } from '@/@types/common'

interface SignUpFormProps extends CommonProps {
    disableSubmit?: boolean
    setMessage?: (message: string) => void
}

type SignUpFormSchema = {
    name: string
    email: string
    country_code: string
    phone: string
    password: string
    confirmPassword: string
}

const validationSchema = z
    .object({
        name: z
            .string({ error: 'Please enter your full name' })
            .trim()
            .min(1, { message: 'Please enter your full name' }),
        email: z
            .string({ error: 'Please enter your email' })
            .trim()
            .min(1, { message: 'Please enter your email' })
            .email({ message: 'Please enter a valid email' }),
        country_code: z
            .string({ error: 'Country code is required' })
            .trim()
            .min(1, { message: 'Country code is required' }),
        phone: z
            .string({ error: 'Please enter your phone number' })
            .trim()
            .min(1, { message: 'Please enter your phone number' })
            .min(6, { message: 'Please enter a valid phone number' }),
        password: z
            .string({ error: 'Please enter your password' })
            .min(1, { message: 'Please enter your password' })
            .min(8, { message: 'Password must be at least 8 characters' }),
        confirmPassword: z
            .string({ error: 'Please confirm your password' })
            .min(1, { message: 'Please confirm your password' }),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    })

const STEP_FIELDS = [
    ['name', 'email', 'country_code', 'phone'],
    ['password', 'confirmPassword'],
] as const

const SignUpForm = (props: SignUpFormProps) => {
    const { disableSubmit = false, className, setMessage } = props

    const [isSubmitting, setSubmitting] = useState<boolean>(false)
    const [currentStep, setCurrentStep] = useState(0)

    const { signUp } = useAuth()

    const {
        handleSubmit,
        trigger,
        formState: { errors },
        control,
    } = useForm<SignUpFormSchema>({
        resolver: zodResolver(validationSchema),
        defaultValues: {
            name: '',
            email: '',
            country_code: '+91',
            phone: '',
            password: '',
            confirmPassword: '',
        },
    })

    const handleNext = async () => {
        const valid = await trigger(STEP_FIELDS[currentStep])
        if (valid) {
            setCurrentStep((step) => step + 1)
        }
    }

    const handleBack = () => {
        setCurrentStep((step) => step - 1)
    }

    const onSignUp = async (values: SignUpFormSchema) => {
        const { name, email, country_code, phone, password } = values

        if (!disableSubmit) {
            setSubmitting(true)
            const result = await signUp({
                name,
                email,
                country_code,
                phone,
                password,
            })

            if (result?.status === 'failed') {
                setMessage?.(result.message)
            }

            setSubmitting(false)
        }
    }

    return (
        <div className={className}>
            <Steps current={currentStep} className="mb-8">
                <Steps.Item title="Your Details" />
                <Steps.Item title="Set Password" />
            </Steps>
            <Form onSubmit={handleSubmit(onSignUp)}>
                {currentStep === 0 && (
                    <>
                        <FormItem
                            label="Full Name"
                            invalid={Boolean(errors.name)}
                            errorMessage={errors.name?.message}
                        >
                            <Controller
                                name="name"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        type="text"
                                        placeholder="Full Name"
                                        autoComplete="off"
                                        {...field}
                                    />
                                )}
                            />
                        </FormItem>
                        <FormItem
                            label="Email"
                            invalid={Boolean(errors.email)}
                            errorMessage={errors.email?.message}
                        >
                            <Controller
                                name="email"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        type="email"
                                        placeholder="Email"
                                        autoComplete="off"
                                        {...field}
                                    />
                                )}
                            />
                        </FormItem>
                        <div className="grid grid-cols-3 gap-3">
                            <FormItem
                                label="Code"
                                invalid={Boolean(errors.country_code)}
                                errorMessage={errors.country_code?.message}
                            >
                                <Controller
                                    name="country_code"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            type="text"
                                            placeholder="+91"
                                            autoComplete="off"
                                            {...field}
                                        />
                                    )}
                                />
                            </FormItem>
                            <div className="col-span-2">
                                <FormItem
                                    label="Phone Number"
                                    invalid={Boolean(errors.phone)}
                                    errorMessage={errors.phone?.message}
                                >
                                    <Controller
                                        name="phone"
                                        control={control}
                                        render={({ field }) => (
                                            <Input
                                                type="tel"
                                                placeholder="Phone Number"
                                                autoComplete="off"
                                                {...field}
                                            />
                                        )}
                                    />
                                </FormItem>
                            </div>
                        </div>
                        <Button
                            block
                            variant="solid"
                            type="button"
                            onClick={handleNext}
                        >
                            Next
                        </Button>
                    </>
                )}
                {currentStep === 1 && (
                    <>
                        <FormItem
                            label="Password"
                            invalid={Boolean(errors.password)}
                            errorMessage={errors.password?.message}
                        >
                            <Controller
                                name="password"
                                control={control}
                                render={({ field }) => (
                                    <PasswordInput
                                        autoComplete="off"
                                        placeholder="Password"
                                        {...field}
                                    />
                                )}
                            />
                        </FormItem>
                        <FormItem
                            label="Confirm Password"
                            invalid={Boolean(errors.confirmPassword)}
                            errorMessage={errors.confirmPassword?.message}
                        >
                            <Controller
                                name="confirmPassword"
                                control={control}
                                render={({ field }) => (
                                    <PasswordInput
                                        autoComplete="off"
                                        placeholder="Confirm Password"
                                        {...field}
                                    />
                                )}
                            />
                        </FormItem>
                        <div className="flex gap-3">
                            <Button block type="button" onClick={handleBack}>
                                Back
                            </Button>
                            <Button
                                block
                                loading={isSubmitting}
                                variant="solid"
                                type="submit"
                            >
                                {isSubmitting
                                    ? 'Creating Account...'
                                    : 'Sign Up'}
                            </Button>
                        </div>
                    </>
                )}
            </Form>
        </div>
    )
}

export default SignUpForm
