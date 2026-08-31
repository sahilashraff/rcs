import { NAV_ITEM_TYPE_ITEM } from '@/constants/navigation.constant'
import type { NavigationTree } from '@/@types/navigation'

const adminNavigationConfig: NavigationTree[] = [
    {
        key: 'admin.dashboard',
        path: '/admin',
        title: 'Dashboard',
        translateKey: 'nav.adminDashboard',
        icon: 'dashboard',
        type: NAV_ITEM_TYPE_ITEM,
        authority: [],
        subMenu: [],
    },
    {
        key: 'admin.tenants',
        path: '/admin/tenants',
        title: 'Tenants',
        translateKey: 'nav.adminTenants',
        icon: 'tenants',
        type: NAV_ITEM_TYPE_ITEM,
        authority: [],
        subMenu: [],
    },
    {
        key: 'admin.carriers',
        path: '/admin/carriers',
        title: 'Carriers',
        translateKey: 'nav.adminCarriers',
        icon: 'carriers',
        type: NAV_ITEM_TYPE_ITEM,
        authority: [],
        subMenu: [],
    },
    {
        key: 'admin.agents',
        path: '/admin/agents',
        title: 'Agents',
        translateKey: 'nav.adminAgents',
        icon: 'agents',
        type: NAV_ITEM_TYPE_ITEM,
        authority: [],
        subMenu: [],
    },
    {
        key: 'admin.onboardingRequests',
        path: '/admin/onboarding-requests',
        title: 'Onboarding Requests',
        translateKey: 'nav.adminOnboardingRequests',
        icon: 'onboardingRequests',
        type: NAV_ITEM_TYPE_ITEM,
        authority: [],
        subMenu: [],
    },
    {
        key: 'admin.settings',
        path: '/admin/settings',
        title: 'Settings',
        translateKey: 'nav.adminSettings',
        icon: 'settings',
        type: NAV_ITEM_TYPE_ITEM,
        authority: [],
        subMenu: [],
    },
]

export default adminNavigationConfig
