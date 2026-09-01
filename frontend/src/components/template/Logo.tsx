import classNames from 'classnames'
import { APP_NAME } from '@/constants/app.constant'
import { useBrandingStore } from '@/store/brandingStore'
import type { GeneralLogoField } from '@/services/SettingsService'
import type { CommonProps } from '@/@types/common'

interface LogoProps extends CommonProps {
    type?: 'full' | 'streamline'
    mode?: 'light' | 'dark'
    imgClass?: string
    logoWidth?: number | string
}

const LOGO_SRC_PATH = '/img/logo/'

const Logo = (props: LogoProps) => {
    const {
        type = 'full',
        mode = 'light',
        className,
        imgClass,
        style,
        logoWidth = 'auto',
    } = props

    const branding = useBrandingStore((state) => state.branding)

    const uploadedField: GeneralLogoField = `logo_${mode}_${type === 'full' ? 'expanded' : 'collapsed'}`
    const uploadedUrl = branding?.[`${uploadedField}_url`]
    const src = uploadedUrl || `${LOGO_SRC_PATH}logo-${mode}-${type}.png`

    return (
        <div
            className={classNames('logo', className)}
            style={{
                ...style,
                ...{ width: logoWidth },
            }}
        >
            <img
                className={imgClass}
                src={src}
                alt={`${branding?.site_name || APP_NAME} logo`}
            />
        </div>
    )
}

export default Logo
