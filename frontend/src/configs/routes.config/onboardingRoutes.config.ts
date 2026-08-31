import { lazy } from 'react'
import type { Routes } from '@/@types/routes'

export const onboardingProtectedRoutes: Routes = [
    {
        key: 'onboarding',
        path: '/onboarding',
        component: lazy(() => import('@/views/Onboarding')),
        authority: [],
        meta: {
            pageBackgroundType: 'plain',
            pageContainerType: 'contained',
        },
    },
]
