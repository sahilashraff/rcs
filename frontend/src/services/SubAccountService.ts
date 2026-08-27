import ApiService from './ApiService'

export type Feature = {
    key: string
    label: string
    route: string
    sidebar: boolean
    public: boolean
}

export type SubAccount = {
    id: number
    name: string
    email: string
    permissions: string[]
}

export async function apiGetFeatures() {
    return ApiService.fetchDataWithAxios<{ data: Feature[] }>({
        url: '/features',
        method: 'get',
    })
}

export async function apiGetSubAccounts() {
    return ApiService.fetchDataWithAxios<{ data: SubAccount[] }>({
        url: '/sub-accounts',
        method: 'get',
    })
}

export async function apiCreateSubAccount(data: {
    name: string
    email: string
    password: string
}) {
    return ApiService.fetchDataWithAxios<{ data: SubAccount }>({
        url: '/sub-accounts',
        method: 'post',
        data,
    })
}

export async function apiUpdateSubAccountPermissions(
    userId: number,
    featureKeys: string[],
) {
    return ApiService.fetchDataWithAxios<{ data: { feature_keys: string[] } }>({
        url: `/sub-accounts/${userId}/permissions`,
        method: 'put',
        data: { feature_keys: featureKeys },
    })
}
