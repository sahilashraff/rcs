import { useState } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Steps from '@/components/ui/Steps'
import Checkbox from '@/components/ui/Checkbox'
import Upload from '@/components/ui/Upload'
import Alert from '@/components/ui/Alert'
import { FormItem, Form } from '@/components/ui/Form'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type {
    OnboardingRequestRecord,
    OnboardingFormFields,
    OnboardingDocumentFiles,
} from '@/services/OnboardingService'

type OnboardingFormProps = {
    initialData: OnboardingRequestRecord | null
    onSubmit: (fields: OnboardingFormFields, files: OnboardingDocumentFiles) => Promise<void>
}

const validationSchema = z.object({
    company_name: z.string().trim().min(1, { message: 'Company name is required' }),
    company_description: z.string().trim().min(1, { message: 'Company description is required' }),
    company_location: z.string().trim().min(1, { message: 'Company location is required' }),
    company_website: z.string().trim().min(1, { message: 'Company website is required' }),
    gstin: z.string().trim().min(1, { message: 'GSTIN is required' }),
    pan: z.string().trim().min(1, { message: 'PAN is required' }),
    cin: z.string().trim().min(1, { message: 'CIN is required' }),
    udyam_registration_number: z.string().trim().min(1, { message: 'Udyam registration number is required' }),
    account_transaction_type: z.array(z.string()).min(1, { message: 'Select at least one transaction type' }),
    company_address: z.string().trim().min(1, { message: 'Company address is required' }),
    company_phone: z.string().trim().min(1, { message: 'Company phone is required' }),
    company_email: z.string().trim().min(1, { message: 'Company email is required' }).email({ message: 'Enter a valid email' }),
    rcs_account_name: z.string().trim().min(1, { message: 'RCS account/legal name is required' }),
    rcs_display_name: z.string().trim().min(1, { message: 'RCS display name is required' }),
    rcs_brand_color: z.string().trim().min(1, { message: 'Brand color is required' }),
    rcs_description: z.string().trim().min(1, { message: 'RCS description is required' }).max(100, { message: 'Max 100 characters' }),
    contact_phone_number: z.string().trim().min(1, { message: 'Contact phone number is required' }),
    brand_contact_email: z.string().trim().min(1, { message: 'Brand contact email is required' }).email({ message: 'Enter a valid email' }),
    brand_website: z.string().trim().min(1, { message: 'Brand website is required' }),
    terms_of_use_url: z.string().trim().min(1, { message: 'Terms of use URL is required' }),
    privacy_policy_url: z.string().trim().min(1, { message: 'Privacy policy URL is required' }),
    rcs_content_languages: z.array(z.string()).min(1, { message: 'List at least one language' }),
    rcs_opt_in_url: z.string().trim().min(1, { message: 'Opt-in URL is required' }),
    industry_type: z.string().trim().min(1, { message: 'Industry type is required' }),
    contact_person_name: z.string().trim().min(1, { message: 'Contact person name is required' }),
    contact_person_designation: z.string().trim().min(1, { message: 'Designation is required' }),
    contact_person_email: z.string().trim().min(1, { message: 'Contact person email is required' }).email({ message: 'Enter a valid email' }),
    contact_person_mobile_number: z.string().trim().min(1, { message: 'Contact person mobile number is required' }),
})

type OnboardingFormSchema = z.infer<typeof validationSchema>

const TRANSACTION_TYPE_OPTIONS = [
    { value: 'otp', label: 'OTP' },
    { value: 'transactional', label: 'Transactional' },
    { value: 'promotional', label: 'Promotional' },
    { value: 'multi_use', label: 'Multi-use' },
]

const DOCUMENT_FIELDS = [
    { key: 'brand_logo', label: 'Brand Logo', accept: 'image/*' },
    { key: 'brand_banner', label: 'Brand Banner', accept: 'image/*' },
    { key: 'incorporation_certificate', label: 'Certificate of Incorporation', accept: 'application/pdf,image/*' },
    { key: 'pan_document', label: 'PAN Document', accept: 'application/pdf,image/*' },
    { key: 'gst_document', label: 'GST Document', accept: 'application/pdf,image/*' },
    { key: 'other_document', label: 'Other Document (optional)', accept: 'application/pdf,image/*' },
] as const

const STEP_FIELDS: (keyof OnboardingFormSchema)[][] = [
    ['company_name', 'company_description', 'company_location', 'company_website', 'gstin', 'pan', 'cin', 'udyam_registration_number', 'account_transaction_type', 'company_address', 'company_phone', 'company_email'],
    ['rcs_account_name', 'rcs_display_name', 'rcs_brand_color', 'rcs_description'],
    ['contact_phone_number', 'brand_contact_email', 'brand_website'],
    ['terms_of_use_url', 'privacy_policy_url', 'rcs_content_languages', 'rcs_opt_in_url'],
    ['industry_type', 'contact_person_name', 'contact_person_designation', 'contact_person_email', 'contact_person_mobile_number'],
    [],
]

const emptyDefaults: OnboardingFormSchema = {
    company_name: '', company_description: '', company_location: '', company_website: '',
    gstin: '', pan: '', cin: '', udyam_registration_number: '', account_transaction_type: [],
    company_address: '', company_phone: '', company_email: '',
    rcs_account_name: '', rcs_display_name: '', rcs_brand_color: '', rcs_description: '',
    contact_phone_number: '', brand_contact_email: '', brand_website: '',
    terms_of_use_url: '', privacy_policy_url: '', rcs_content_languages: [], rcs_opt_in_url: '',
    industry_type: '', contact_person_name: '', contact_person_designation: '',
    contact_person_email: '', contact_person_mobile_number: '',
}

const OnboardingForm = ({ initialData, onSubmit }: OnboardingFormProps) => {
    const [currentStep, setCurrentStep] = useState(0)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [files, setFiles] = useState<OnboardingDocumentFiles>({})
    const [languagesInput, setLanguagesInput] = useState(
        initialData?.rcs_content_languages.join(', ') ?? '',
    )

    const {
        handleSubmit,
        trigger,
        setValue,
        watch,
        formState: { errors },
        control,
    } = useForm<OnboardingFormSchema>({
        resolver: zodResolver(validationSchema),
        defaultValues: initialData
            ? { ...emptyDefaults, ...initialData }
            : emptyDefaults,
    })

    const transactionTypes = watch('account_transaction_type')

    const handleNext = async () => {
        const valid = await trigger(STEP_FIELDS[currentStep])
        if (valid) setCurrentStep((step) => step + 1)
    }

    const handleBack = () => setCurrentStep((step) => step - 1)

    const handleLanguagesChange = (value: string) => {
        setLanguagesInput(value)
        setValue(
            'rcs_content_languages',
            value.split(',').map((v) => v.trim()).filter(Boolean),
        )
    }

    const requiredDocsMissing = (['brand_logo', 'brand_banner', 'incorporation_certificate', 'pan_document', 'gst_document'] as const)
        .some((key) => !files[key] && !initialData?.[`${key}_file_id`])

    const onValidSubmit = async (values: OnboardingFormSchema) => {
        if (requiredDocsMissing) {
            setErrorMessage('All documents except "Other" are required.')
            return
        }
        setErrorMessage(null)
        setIsSubmitting(true)
        try {
            await onSubmit(values, files)
        } catch (err: any) {
            setErrorMessage(err?.response?.data?.message || 'Submission failed.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div>
            <h3 className="mb-4">RCS Onboarding — KYC Details</h3>
            {initialData?.status === 'rejected' && initialData.rejection_reason && (
                <Alert type="danger" showIcon className="mb-4">
                    <strong>Rejected:</strong> {initialData.rejection_reason}
                </Alert>
            )}
            {errorMessage && (
                <Alert type="danger" showIcon className="mb-4">
                    {errorMessage}
                </Alert>
            )}
            <Steps current={currentStep} className="mb-8">
                <Steps.Item title="Company" />
                <Steps.Item title="RCS Account" />
                <Steps.Item title="Contact Info" />
                <Steps.Item title="Legal & Language" />
                <Steps.Item title="Contact Person" />
                <Steps.Item title="Documents" />
            </Steps>
            <Form onSubmit={handleSubmit(onValidSubmit)}>
                {currentStep === 0 && (
                    <>
                        <FormItem label="Registered Company Name" invalid={Boolean(errors.company_name)} errorMessage={errors.company_name?.message}>
                            <Controller name="company_name" control={control} render={({ field }) => <Input {...field} />} />
                        </FormItem>
                        <FormItem label="Company Description" invalid={Boolean(errors.company_description)} errorMessage={errors.company_description?.message}>
                            <Controller name="company_description" control={control} render={({ field }) => <Input textArea {...field} />} />
                        </FormItem>
                        <FormItem label="Location" invalid={Boolean(errors.company_location)} errorMessage={errors.company_location?.message}>
                            <Controller name="company_location" control={control} render={({ field }) => <Input {...field} />} />
                        </FormItem>
                        <FormItem label="Website" invalid={Boolean(errors.company_website)} errorMessage={errors.company_website?.message}>
                            <Controller name="company_website" control={control} render={({ field }) => <Input {...field} />} />
                        </FormItem>
                        <div className="grid grid-cols-2 gap-3">
                            <FormItem label="GSTIN" invalid={Boolean(errors.gstin)} errorMessage={errors.gstin?.message}>
                                <Controller name="gstin" control={control} render={({ field }) => <Input {...field} />} />
                            </FormItem>
                            <FormItem label="PAN" invalid={Boolean(errors.pan)} errorMessage={errors.pan?.message}>
                                <Controller name="pan" control={control} render={({ field }) => <Input {...field} />} />
                            </FormItem>
                            <FormItem label="CIN" invalid={Boolean(errors.cin)} errorMessage={errors.cin?.message}>
                                <Controller name="cin" control={control} render={({ field }) => <Input {...field} />} />
                            </FormItem>
                            <FormItem label="Udyam Registration Number" invalid={Boolean(errors.udyam_registration_number)} errorMessage={errors.udyam_registration_number?.message}>
                                <Controller name="udyam_registration_number" control={control} render={({ field }) => <Input {...field} />} />
                            </FormItem>
                        </div>
                        <FormItem label="Account Transaction Type" invalid={Boolean(errors.account_transaction_type)} errorMessage={errors.account_transaction_type?.message}>
                            <Checkbox.Group
                                value={transactionTypes}
                                onChange={(value) => setValue('account_transaction_type', value as string[])}
                            >
                                {TRANSACTION_TYPE_OPTIONS.map((opt) => (
                                    <Checkbox key={opt.value} value={opt.value}>{opt.label}</Checkbox>
                                ))}
                            </Checkbox.Group>
                        </FormItem>
                        <FormItem label="Company Address" invalid={Boolean(errors.company_address)} errorMessage={errors.company_address?.message}>
                            <Controller name="company_address" control={control} render={({ field }) => <Input textArea {...field} />} />
                        </FormItem>
                        <div className="grid grid-cols-2 gap-3">
                            <FormItem label="Company Phone" invalid={Boolean(errors.company_phone)} errorMessage={errors.company_phone?.message}>
                                <Controller name="company_phone" control={control} render={({ field }) => <Input {...field} />} />
                            </FormItem>
                            <FormItem label="Company Email" invalid={Boolean(errors.company_email)} errorMessage={errors.company_email?.message}>
                                <Controller name="company_email" control={control} render={({ field }) => <Input {...field} />} />
                            </FormItem>
                        </div>
                        <Button block variant="solid" type="button" onClick={handleNext}>Next</Button>
                    </>
                )}
                {currentStep === 1 && (
                    <>
                        <FormItem label="Account / Legal Name" invalid={Boolean(errors.rcs_account_name)} errorMessage={errors.rcs_account_name?.message}>
                            <Controller name="rcs_account_name" control={control} render={({ field }) => <Input {...field} />} />
                        </FormItem>
                        <FormItem label="Display Name" invalid={Boolean(errors.rcs_display_name)} errorMessage={errors.rcs_display_name?.message}>
                            <Controller name="rcs_display_name" control={control} render={({ field }) => <Input {...field} />} />
                        </FormItem>
                        <FormItem label="Brand Color" invalid={Boolean(errors.rcs_brand_color)} errorMessage={errors.rcs_brand_color?.message}>
                            <Controller name="rcs_brand_color" control={control} render={({ field }) => <Input type="color" {...field} />} />
                        </FormItem>
                        <FormItem label="Description (max 100 chars)" invalid={Boolean(errors.rcs_description)} errorMessage={errors.rcs_description?.message}>
                            <Controller name="rcs_description" control={control} render={({ field }) => <Input maxLength={100} {...field} />} />
                        </FormItem>
                        <div className="flex gap-3">
                            <Button block type="button" onClick={handleBack}>Back</Button>
                            <Button block variant="solid" type="button" onClick={handleNext}>Next</Button>
                        </div>
                    </>
                )}
                {currentStep === 2 && (
                    <>
                        <FormItem label="Phone Number" invalid={Boolean(errors.contact_phone_number)} errorMessage={errors.contact_phone_number?.message}>
                            <Controller name="contact_phone_number" control={control} render={({ field }) => <Input {...field} />} />
                        </FormItem>
                        <FormItem label="Brand Contact Email" invalid={Boolean(errors.brand_contact_email)} errorMessage={errors.brand_contact_email?.message}>
                            <Controller name="brand_contact_email" control={control} render={({ field }) => <Input {...field} />} />
                        </FormItem>
                        <FormItem label="Brand Website" invalid={Boolean(errors.brand_website)} errorMessage={errors.brand_website?.message}>
                            <Controller name="brand_website" control={control} render={({ field }) => <Input {...field} />} />
                        </FormItem>
                        <div className="flex gap-3">
                            <Button block type="button" onClick={handleBack}>Back</Button>
                            <Button block variant="solid" type="button" onClick={handleNext}>Next</Button>
                        </div>
                    </>
                )}
                {currentStep === 3 && (
                    <>
                        <FormItem label="Terms of Use URL" invalid={Boolean(errors.terms_of_use_url)} errorMessage={errors.terms_of_use_url?.message}>
                            <Controller name="terms_of_use_url" control={control} render={({ field }) => <Input {...field} />} />
                        </FormItem>
                        <FormItem label="Privacy Policy URL" invalid={Boolean(errors.privacy_policy_url)} errorMessage={errors.privacy_policy_url?.message}>
                            <Controller name="privacy_policy_url" control={control} render={({ field }) => <Input {...field} />} />
                        </FormItem>
                        <FormItem label="RCS Message Content Languages (comma-separated)" invalid={Boolean(errors.rcs_content_languages)} errorMessage={errors.rcs_content_languages?.message}>
                            <Input
                                placeholder="en, hi"
                                value={languagesInput}
                                onChange={(e) => handleLanguagesChange(e.target.value)}
                            />
                        </FormItem>
                        <FormItem label="RCS Opt-in URL" invalid={Boolean(errors.rcs_opt_in_url)} errorMessage={errors.rcs_opt_in_url?.message}>
                            <Controller name="rcs_opt_in_url" control={control} render={({ field }) => <Input {...field} />} />
                        </FormItem>
                        <div className="flex gap-3">
                            <Button block type="button" onClick={handleBack}>Back</Button>
                            <Button block variant="solid" type="button" onClick={handleNext}>Next</Button>
                        </div>
                    </>
                )}
                {currentStep === 4 && (
                    <>
                        <FormItem label="Industry Type" invalid={Boolean(errors.industry_type)} errorMessage={errors.industry_type?.message}>
                            <Controller name="industry_type" control={control} render={({ field }) => <Input {...field} />} />
                        </FormItem>
                        <FormItem label="Contact Person Name" invalid={Boolean(errors.contact_person_name)} errorMessage={errors.contact_person_name?.message}>
                            <Controller name="contact_person_name" control={control} render={({ field }) => <Input {...field} />} />
                        </FormItem>
                        <FormItem label="Designation" invalid={Boolean(errors.contact_person_designation)} errorMessage={errors.contact_person_designation?.message}>
                            <Controller name="contact_person_designation" control={control} render={({ field }) => <Input {...field} />} />
                        </FormItem>
                        <FormItem label="Email (domain email)" invalid={Boolean(errors.contact_person_email)} errorMessage={errors.contact_person_email?.message}>
                            <Controller name="contact_person_email" control={control} render={({ field }) => <Input {...field} />} />
                        </FormItem>
                        <FormItem label="Mobile Number" invalid={Boolean(errors.contact_person_mobile_number)} errorMessage={errors.contact_person_mobile_number?.message}>
                            <Controller name="contact_person_mobile_number" control={control} render={({ field }) => <Input {...field} />} />
                        </FormItem>
                        <div className="flex gap-3">
                            <Button block type="button" onClick={handleBack}>Back</Button>
                            <Button block variant="solid" type="button" onClick={handleNext}>Next</Button>
                        </div>
                    </>
                )}
                {currentStep === 5 && (
                    <>
                        {DOCUMENT_FIELDS.map(({ key, label, accept }) => (
                            <FormItem key={key} label={label}>
                                {initialData?.[`${key}_file_id` as keyof OnboardingRequestRecord] && !files[key] && (
                                    <div className="text-xs text-gray-500 mb-1">
                                        Already uploaded — choose a file to replace it.
                                    </div>
                                )}
                                <Upload
                                    accept={accept}
                                    uploadLimit={1}
                                    onChange={(fileList) =>
                                        setFiles((prev) => ({ ...prev, [key]: fileList[0] }))
                                    }
                                />
                            </FormItem>
                        ))}
                        <div className="flex gap-3">
                            <Button block type="button" onClick={handleBack}>Back</Button>
                            <Button block loading={isSubmitting} variant="solid" type="submit">
                                {isSubmitting ? 'Submitting...' : 'Submit for Review'}
                            </Button>
                        </div>
                    </>
                )}
            </Form>
        </div>
    )
}

export default OnboardingForm
