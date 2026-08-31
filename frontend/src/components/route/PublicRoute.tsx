import { Navigate, Outlet } from 'react-router'
import getEntryPath from '@/utils/getEntryPath'
import { useAuth } from '@/auth'

const PublicRoute = () => {
    const { authenticated, user } = useAuth()

    return authenticated ? <Navigate to={getEntryPath(user.isAdmin, user.isUnlocked)} /> : <Outlet />
}

export default PublicRoute
