export type FileItem = {
    id: string
    name: string
    fileType: string
    srcUrl: string
    size: number
    author: {
        name: string
        email: string
        img: string
    }
    uploadDate: number
}

export type StorageUsage = {
    used_bytes: number
    max_storage_mb: number
    max_storage_bytes: number
    used_percentage: number
    file_count: number
}

export type DropdownItemCallbackProps = {
    onDownload?: () => void
    onShare?: () => void
    onRename?: () => void
    onDelete?: () => void
}

export type Layout = 'grid' | 'list'

export type Files = FileItem[]

export type BaseFileItemProps = {
    id?: string
    name?: string
    fileType?: string
    srcUrl?: string
    size?: number
    loading?: boolean
    uploadDate?: number
    author?: {
        name: string
        email: string
        img: string
    }
    onClick?: () => void
} & DropdownItemCallbackProps
