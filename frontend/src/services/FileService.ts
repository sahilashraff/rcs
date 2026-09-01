import ApiService from './ApiService'
import type { FileItem, StorageUsage } from '@/views/FileManager/types'

export async function apiGetFiles() {
    return ApiService.fetchDataWithAxios<{ data: FileItem[] }>({
        url: '/files',
        method: 'get',
    })
}

export async function apiUploadFiles(files: File[]) {
    const formData = new FormData()
    files.forEach((file) => {
        formData.append('files[]', file)
    })

    return ApiService.fetchDataWithAxios<{ data: FileItem[]; message: string }, FormData>({
        url: '/files',
        method: 'post',
        data: formData,
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })
}

export async function apiRenameFile(id: string, name: string) {
    return ApiService.fetchDataWithAxios<{ data: FileItem; message: string }>({
        url: `/files/${id}`,
        method: 'put',
        data: { name },
    })
}

export async function apiDeleteFile(id: string) {
    return ApiService.fetchDataWithAxios<{ status: string; message: string }>({
        url: `/files/${id}`,
        method: 'delete',
    })
}

export async function apiGetStorageUsage() {
    return ApiService.fetchDataWithAxios<{ data: StorageUsage }>({
        url: '/files/storage-usage',
        method: 'get',
    })
}

/**
 * The one download call for any PRIVATE FileUpload (onboarding
 * documents, etc.) — authenticated, since the app uses Bearer tokens
 * rather than cookies, so a plain <a href> can't carry auth. Public
 * files (e.g. File Manager uploads) don't need this: their `url` is
 * already a real, unauthenticated URL, use it directly.
 */
export async function apiDownloadFile(fileId: number) {
    return ApiService.fetchDataWithAxios<Blob>({
        url: `/files/${fileId}/download`,
        method: 'get',
        responseType: 'blob',
    })
}
