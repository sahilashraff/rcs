import { NAV_ITEM_TYPE_ITEM } from '@/constants/navigation.constant'
import type { NavigationTree } from '@/@types/navigation'

// A locked User has exactly one route available — /onboarding — so this
// is the single item shown. authority: [] matches onboardingRoutes.config's
// own '/onboarding' route authority, the same authority/gating scheme
// used everywhere else (see CLAUDE.md), not a separate mechanism.
const onboardingNavigationConfig: NavigationTree[] = [
    {
        key: 'onboarding',
        path: '/onboarding',
        title: 'Onboarding',
        translateKey: 'nav.onboarding',
        icon: 'onboarding',
        type: NAV_ITEM_TYPE_ITEM,
        authority: [],
        subMenu: [],
    },
]

export default onboardingNavigationConfig
