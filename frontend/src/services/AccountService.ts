import ApiService from './ApiService'

export type Account = {
    name: string
    email: string
    country_code: string | null
    phone: string | null
    avatar_url: string | null
    is_owner: boolean
    is_admin: boolean
}

export async function apiGetAccount() {
    return ApiService.fetchDataWithAxios<{ data: Account }>({
        url: '/account',
        method: 'get',
    })
}

export type UpdateAccountFields = {
    name: string
    email: string
    country_code?: string
    phone?: string
}

export async function apiUpdateAccount(fields: UpdateAccountFields, avatar?: File) {
    const formData = new FormData()
    formData.append('name', fields.name)
    formData.append('email', fields.email)
    if (fields.country_code) formData.append('country_code', fields.country_code)
    if (fields.phone) formData.append('phone', fields.phone)
    if (avatar) formData.append('avatar', avatar)

    return ApiService.fetchDataWithAxios<{ data: Account }, FormData>({
        url: '/account',
        method: 'post',
        data: formData,
    })
}

export async function apiUpdateAccountPassword(
    currentPassword: string,
    newPassword: string,
    newPasswordConfirmation: string,
) {
    return ApiService.fetchDataWithAxios<{ status: string }>({
        url: '/account/password',
        method: 'put',
        data: {
            current_password: currentPassword,
            new_password: newPassword,
            new_password_confirmation: newPasswordConfirmation,
        },
    })
}
