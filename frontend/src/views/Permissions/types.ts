import type { ReactNode } from 'react'

export type Feature = {
    key: string
    label: string
    route: string
    sidebar: boolean
    public: boolean
    description?: string
    category?: string
}

export type SubAccount = {
    id: number
    name: string
    email: string
    permissions: string[]
    createdAt?: string
    status?: 'active' | 'blocked' | 'pending'
}

export type CreateSubAccountFormData = {
    name: string
    email: string
    password: string
    initialPermissions: string[]
}

export type FeatureMeta = {
    key: string
    label: string
    description: string
    icon: ReactNode
    badgeColor?: string
}
