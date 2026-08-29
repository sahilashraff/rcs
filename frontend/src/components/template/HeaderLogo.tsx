import Logo from '@/components/template/Logo'
import { useThemeStore } from '@/store/themeStore'
import { useSessionUser } from '@/store/authStore'
import getEntryPath from '@/utils/getEntryPath'
import { Link } from 'react-router'
import type { Mode } from '@/@types/theme'

const HeaderLogo = ({ mode }: { mode?: Mode }) => {
    const defaultMode = useThemeStore((state) => state.mode)
    const isAdmin = useSessionUser((state) => state.user.isAdmin)

    return (
        <Link to={getEntryPath(isAdmin)}>
            <Logo
                imgClass="max-h-10"
                mode={mode || defaultMode}
                className="hidden lg:block"
            />
        </Link>
    )
}

export default HeaderLogo
