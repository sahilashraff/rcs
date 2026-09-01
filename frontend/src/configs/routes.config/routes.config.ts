import { lazy } from 'react'
import authRoute from './authRoute'
import othersRoute from './othersRoute'
import {
    FEATURE_PERMISSIONS,
    FEATURE_AGENTS,
    FEATURE_FILES,
} from '@/constants/feature.constant'
import type { Routes } from '@/@types/routes'

export const publicRoutes: Routes = [...authRoute]

export const protectedRoutes: Routes = [
    {
        key: 'home',
        path: '/home',
        component: lazy(() => import('@/views/Home')),
        authority: [],
        meta: {
            pageBackgroundType: 'plain',
            pageContainerType: 'contained',
        },
    },
    {
        key: FEATURE_FILES,
        path: '/files',
        component: lazy(() => import('@/views/FileManager')),
        authority: [FEATURE_FILES],
        meta: {
            pageBackgroundType: 'plain',
            pageContainerType: 'contained',
        },
    },
    {
        key: FEATURE_PERMISSIONS,
        path: '/permissions',
        component: lazy(() => import('@/views/Permissions')),
        authority: [FEATURE_PERMISSIONS],
        meta: {
            pageBackgroundType: 'plain',
            pageContainerType: 'contained',
        },
    },
    {
        key: FEATURE_AGENTS,
        path: '/agents',
        component: lazy(() => import('@/views/Agents')),
        authority: [FEATURE_AGENTS],
        meta: {
            pageBackgroundType: 'plain',
            pageContainerType: 'contained',
        },
    },

    {
        key: 'account',
        path: '/account',
        component: lazy(() => import('@/views/AccountSettings')),
        authority: [],
        meta: {
            pageBackgroundType: 'plain',
            pageContainerType: 'contained',
        },
    },
    ...othersRoute,
]
