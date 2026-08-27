import { NAV_ITEM_TYPE_ITEM } from '@/constants/navigation.constant'
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
        key: 'permissions',
        path: '/permissions',
        title: 'Sub-Accounts & Permissions',
        translateKey: 'nav.permissions',
        icon: 'singleMenu',
        type: NAV_ITEM_TYPE_ITEM,
        authority: ['permissions'],
        subMenu: [],
    },
]

export default navigationConfig
