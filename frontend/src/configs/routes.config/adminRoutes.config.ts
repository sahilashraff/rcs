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
    {
        key: 'admin.tenants',
        path: '/admin/tenants',
        component: lazy(() => import('@/views/AdminTenants')),
        authority: [],
        meta: {
            pageBackgroundType: 'plain',
            pageContainerType: 'contained',
        },
    },
    {
        key: 'admin.carriers',
        path: '/admin/carriers',
        component: lazy(() => import('@/views/AdminCarriers')),
        authority: [],
        meta: {
            pageBackgroundType: 'plain',
            pageContainerType: 'contained',
        },
    },
    {
        key: 'admin.agents',
        path: '/admin/agents',
        component: lazy(() => import('@/views/AdminAgents')),
        authority: [],
        meta: {
            pageBackgroundType: 'plain',
            pageContainerType: 'contained',
        },
    },
    {
        key: 'admin.agents.detail',
        path: '/admin/agents/:id',
        component: lazy(() => import('@/views/AdminAgentDetail')),
        authority: [],
        meta: {
            pageBackgroundType: 'plain',
            pageContainerType: 'contained',
        },
    },
]
