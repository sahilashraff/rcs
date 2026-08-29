import appConfig from '@/configs/app.config'
import getEntryPath from '@/utils/getEntryPath'
import { useAuth } from '@/auth'
import { Navigate } from 'react-router'

const { unAuthenticatedEntryPath } = appConfig

const FallbackRoute = () => {

    const { authenticated, user } = useAuth()

    return (
        <Navigate replace to={ authenticated ? getEntryPath(user.isAdmin) : unAuthenticatedEntryPath } />
    )
}

export default FallbackRoute