import HorizontalMenuContent from './HorizontalMenuContent'
import { useRouteKeyStore } from '@/store/routeKeyStore'
import { useSessionUser } from '@/store/authStore'
import appConfig from '@/configs/app.config'
import navigationConfig from '@/configs/navigation.config'
import adminNavigationConfig from '@/configs/navigation.config/adminNavigation.config'
import onboardingNavigationConfig from '@/configs/navigation.config/onboardingNavigation.config'

const HorizontalNav = ({
    translationSetup = appConfig.activeNavTranslation,
}: {
    translationSetup?: boolean
}) => {
    const currentRouteKey = useRouteKeyStore((state) => state.currentRouteKey)

    const userAuthority = useSessionUser((state) => state.user.authority)
    const isAdmin = useSessionUser((state) => state.user.isAdmin)
    const isUnlocked = useSessionUser((state) => state.user.isUnlocked)
    const activeNavigationConfig = isAdmin
        ? adminNavigationConfig
        : isUnlocked
          ? navigationConfig
          : onboardingNavigationConfig

    return (
        <HorizontalMenuContent
            navigationTree={activeNavigationConfig}
            routeKey={currentRouteKey}
            userAuthority={userAuthority || []}
            translationSetup={translationSetup}
        />
    )
}

export default HorizontalNav
