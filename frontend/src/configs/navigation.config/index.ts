import { NAV_ITEM_TYPE_ITEM } from '@/constants/navigation.constant'
import { FEATURE_PERMISSIONS, FEATURE_AGENTS } from '@/constants/feature.constant'
import type { NavigationTree } from '@/@types/navigation'

const navigationConfig: NavigationTree[] = [
    {
        key: 'home',
        path: '/home',
        title: 'Home',
        translateKey: 'nav.home',
        icon: 'home',
        type: NAV_ITEM_TYPE_ITEM,
        authority: [],
        subMenu: [],
    },
    {
        key: FEATURE_PERMISSIONS,
        path: '/permissions',
        title: 'Team',
        translateKey: 'nav.permissions',
        icon: 'singleMenu',
        type: NAV_ITEM_TYPE_ITEM,
        authority: [FEATURE_PERMISSIONS],
        subMenu: [],
    },
    {
        key: FEATURE_AGENTS,
        path: '/agents',
        title: 'Agents',
        translateKey: 'nav.agents',
        icon: 'singleMenu',
        type: NAV_ITEM_TYPE_ITEM,
        authority: [FEATURE_AGENTS],
        subMenu: [],
    },
]

export default navigationConfig
