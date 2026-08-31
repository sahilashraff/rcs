import ApiService from './ApiService'

export type OnboardingStatus = 'draft' | 'submitted' | 'approved' | 'rejected'

export type OnboardingRequestRecord = {
    id: number
    tenant_id: number
    status: OnboardingStatus
    company_name: string
    company_description: string
    company_location: string
    company_website: string
    gstin: string
    pan: string
    cin: string
    udyam_registration_number: string
    account_transaction_type: string[]
    company_address: string
    company_phone: string
    company_email: string
    rcs_account_name: string
    rcs_display_name: string
    rcs_brand_color: string
    rcs_description: string
    contact_phone_number: string
    brand_contact_email: string
    brand_website: string
    terms_of_use_url: string
    privacy_policy_url: string
    rcs_content_languages: string[]
    rcs_opt_in_url: string
    industry_type: string
    contact_person_name: string
    contact_person_designation: string
    contact_person_email: string
    contact_person_mobile_number: string
    brand_logo_path: string | null
    brand_banner_path: string | null
    incorporation_certificate_path: string | null
    pan_document_path: string | null
    gst_document_path: string | null
    other_document_path: string | null
    rejection_reason: string | null
    reviewed_by: number | null
    reviewed_at: string | null
    created_at: string
    updated_at: string
}

export type OnboardingFormFields = Omit<
    OnboardingRequestRecord,
    | 'id'
    | 'tenant_id'
    | 'status'
    | 'brand_logo_path'
    | 'brand_banner_path'
    | 'incorporation_certificate_path'
    | 'pan_document_path'
    | 'gst_document_path'
    | 'other_document_path'
    | 'rejection_reason'
    | 'reviewed_by'
    | 'reviewed_at'
    | 'created_at'
    | 'updated_at'
>

export type OnboardingDocumentFiles = {
    brand_logo?: File
    brand_banner?: File
    incorporation_certificate?: File
    pan_document?: File
    gst_document?: File
    other_document?: File
}

export async function apiGetMyOnboarding() {
    return ApiService.fetchDataWithAxios<{ data: OnboardingRequestRecord | null }>({
        url: '/onboarding/mine',
        method: 'get',
    })
}

export async function apiSubmitOnboarding(
    fields: OnboardingFormFields,
    files: OnboardingDocumentFiles,
) {
    const formData = new FormData()

    Object.entries(fields).forEach(([key, value]) => {
        if (Array.isArray(value)) {
            value.forEach((item) => formData.append(`${key}[]`, item))
            return
        }
        formData.append(key, String(value))
    })

    Object.entries(files).forEach(([key, file]) => {
        if (file) formData.append(key, file)
    })

    return ApiService.fetchDataWithAxios<{ data: OnboardingRequestRecord }, FormData>({
        url: '/onboarding',
        method: 'post',
        data: formData,
    })
}
