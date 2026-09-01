import ApiService from './ApiService'

/**
 * The one download call for any private FileUpload, wherever it's
 * referenced from (onboarding documents today, anything else that
 * stores private files later). Public files don't need this — use
 * their `url` directly.
 */
export async function apiDownloadFile(fileId: number) {
    return ApiService.fetchDataWithAxios<Blob>({
        url: `/files/${fileId}/download`,
        method: 'get',
        responseType: 'blob',
    })
}
