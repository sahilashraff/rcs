import appConfig from '@/configs/app.config'

export default function getEntryPath(isAdmin?: boolean, isUnlocked?: boolean): string {
    if (isAdmin) return appConfig.adminEntryPath
    if (!isUnlocked) return appConfig.onboardingEntryPath
    return appConfig.authenticatedEntryPath
}
