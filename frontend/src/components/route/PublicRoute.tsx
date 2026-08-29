import { Navigate, Outlet } from 'react-router'
import getEntryPath from '@/utils/getEntryPath'
import { useAuth } from '@/auth'

const PublicRoute = () => {
    const { authenticated, user } = useAuth()

    return authenticated ? <Navigate to={getEntryPath(user.isAdmin)} /> : <Outlet />
}

export default PublicRoute
