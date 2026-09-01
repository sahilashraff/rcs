import { useEffect } from 'react'
import { apiGetBranding } from '@/services/BrandingService'
import { useBrandingStore } from '@/store/brandingStore'

/**
 * Fetches real branding once on app boot — before sign-in, so the
 * sign-in/sign-up pages show it too — and applies the parts that live
 * outside React's tree (document title, favicon link).
 */
const BrandingLoader = () => {
    const setBranding = useBrandingStore((state) => state.setBranding)

    useEffect(() => {
        apiGetBranding()
            .then((resp) => {
                const branding = resp.data
                setBranding(branding)

                if (branding.site_name) {
                    document.title = branding.site_name
                }

                if (branding.favicon_url) {
                    const link =
                        document.querySelector<HTMLLinkElement>("link[rel~='icon']") ||
                        document.head.appendChild(Object.assign(document.createElement('link'), { rel: 'icon' }))
                    link.href = branding.favicon_url
                }
            })
            .catch(() => {
                // Branding is cosmetic — fall back to the bundled defaults silently.
            })
    }, [setBranding])

    return null
}

export default BrandingLoader
