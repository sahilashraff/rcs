import ApiService from './ApiService'

export type Carrier = {
    id: number
    code: string
    name: string
    country: string
    is_active: boolean
}

export async function apiGetCarriers() {
    return ApiService.fetchDataWithAxios<{ data: Carrier[] }>({
        url: '/admin/carriers',
        method: 'get',
    })
}

export async function apiCreateCarrier(data: {
    code: string
    name: string
    country: string
}) {
    return ApiService.fetchDataWithAxios<{ data: Carrier }>({
        url: '/admin/carriers',
        method: 'post',
        data,
    })
}

export async function apiUpdateCarrier(
    carrierId: number,
    data: { name?: string; country?: string; is_active?: boolean },
) {
    return ApiService.fetchDataWithAxios<{ data: Carrier }>({
        url: `/admin/carriers/${carrierId}`,
        method: 'put',
        data,
    })
}
