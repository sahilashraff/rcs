import ApiService from './ApiService'

export type OnboardingStatus = 'draft' | 'submitted' | 'approved' | 'rejected'

export type FileUploadRecord = {
    id: number
    original_name: string
    mime_type: string
    size: number
    url: string | null
}

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
    brand_logo_file_id: number | null
    brand_logo_file: FileUploadRecord | null
    brand_banner_file_id: number | null
    brand_banner_file: FileUploadRecord | null
    incorporation_certificate_file_id: number | null
    incorporation_certificate_file: FileUploadRecord | null
    pan_document_file_id: number | null
    pan_document_file: FileUploadRecord | null
    gst_document_file_id: number | null
    gst_document_file: FileUploadRecord | null
    other_document_file_id: number | null
    other_document_file: FileUploadRecord | null
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
    | 'brand_logo_file_id'
    | 'brand_logo_file'
    | 'brand_banner_file_id'
    | 'brand_banner_file'
    | 'incorporation_certificate_file_id'
    | 'incorporation_certificate_file'
    | 'pan_document_file_id'
    | 'pan_document_file'
    | 'gst_document_file_id'
    | 'gst_document_file'
    | 'other_document_file_id'
    | 'other_document_file'
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
