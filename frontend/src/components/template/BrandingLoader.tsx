import { useEffect } from 'react'
import { apiGetBranding } from '@/services/BrandingService'
import { useBrandingStore } from '@/store/brandingStore'
import { useThemeStore } from '@/store/themeStore'

/**
 * Fetches branding once on app boot and populates the Zustand store
 * so React components (Logo, Footer, etc.) can read logos / site name.
 *
 * DOM-level branding (document title, favicon, meta description) is
 * handled by the inline bootstrap script in index.html — which fires
 * before React even loads — so we don't touch the DOM here.
 *
 * Also applies the admin's default theme schema/mode, but ONLY for a
 * browser that has never persisted its own theme choice — the absence
 * of the 'theme' localStorage key (themeStore's persist name) is how we
 * tell "never visited before" apart from "visited and picked light
 * mode," which would otherwise look identical. A returning visitor's
 * own choice always wins; this never overwrites it.
 */
const BrandingLoader = () => {
    const setBranding = useBrandingStore((state) => state.setBranding)

    useEffect(() => {
        apiGetBranding()
            .then((resp) => {
                setBranding(resp.data)

                if (localStorage.getItem('theme') === null) {
                    useThemeStore.getState().setSchema(resp.data.default_theme_schema)
                    useThemeStore.getState().setMode(resp.data.default_mode)
                }
            })
            .catch(() => {
                // Branding is cosmetic — fall back to bundled defaults silently.
            })
    }, [setBranding])

    return null
}

export default BrandingLoader


