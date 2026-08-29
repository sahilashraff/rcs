import { lazy } from 'react'
import type { Routes } from '@/@types/routes'

export const adminProtectedRoutes: Routes = [
    {
        key: 'admin.dashboard',
        path: '/admin',
        component: lazy(() => import('@/views/AdminDashboard')),
        authority: [],
        meta: {
            pageBackgroundType: 'plain',
            pageContainerType: 'contained',
        },
    },
]
