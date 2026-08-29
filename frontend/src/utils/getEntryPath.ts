import appConfig from '@/configs/app.config'

export default function getEntryPath(isAdmin?: boolean): string {
    return isAdmin ? appConfig.adminEntryPath : appConfig.authenticatedEntryPath
}
