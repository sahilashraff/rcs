import ProtectedRoute from './ProtectedRoute'
import PublicRoute from './PublicRoute'
import AuthorityGuard from './AuthorityGuard'
import FallbackRoute from './FallbackRoute'
import AppRoute from './AppRoute'
import PageContainer from '@/components/template/PageContainer'
import {
    protectedRoutes,
    publicRoutes,
    adminProtectedRoutes,
} from '@/configs/routes.config'
import { onboardingProtectedRoutes } from '@/configs/routes.config/onboardingRoutes.config'
import getEntryPath from '@/utils/getEntryPath'
import { useAuth } from '@/auth'
import { Routes, Route, Navigate } from 'react-router'
import type { LayoutType } from '@/@types/theme'

interface ViewsProps {
    pageContainerType?: 'default' | 'gutterless' | 'contained'
    layout?: LayoutType
}

type AllRoutesProps = ViewsProps

const AllRoutes = (props: AllRoutesProps) => {
    const { user } = useAuth()
    const activeRoutes = user.isAdmin
        ? adminProtectedRoutes
        : user.isUnlocked
          ? protectedRoutes
          : onboardingProtectedRoutes
    const entryPath = getEntryPath(user.isAdmin, user.isUnlocked)

    return (
        <Routes>
            <Route path="/" element={<PublicRoute />}>
                <Route
                    index
                    element={<FallbackRoute />}
                />
                {publicRoutes.map((route) => (
                    <Route
                        key={route.path}
                        path={route.path}
                        element={
                            <AppRoute
                                routeKey={route.key}
                                component={route.component}
                                {...route.meta}
                            />
                        }
                    />
                ))}
            </Route>
            <Route path="/" element={<ProtectedRoute />}>
                <Route index element={<Navigate replace to={entryPath} />} />
                {activeRoutes.map((route, index) => (
                    <Route
                        key={route.key + index}
                        path={route.path}
                        element={
                            <AuthorityGuard
                                userAuthority={user.authority}
                                authority={route.authority}
                            >
                                <PageContainer {...props} {...route.meta}>
                                    <AppRoute
                                        routeKey={route.key}
                                        component={route.component}
                                        {...route.meta}
                                    />
                                </PageContainer>
                            </AuthorityGuard>
                        }
                    />
                ))}
                <Route path="*" element={<Navigate replace to="/" />} />
            </Route>
        </Routes>
    )
}

export default AllRoutes
