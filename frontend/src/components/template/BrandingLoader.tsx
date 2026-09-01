import { useEffect } from 'react'
import { apiGetBranding } from '@/services/BrandingService'
import { useBrandingStore } from '@/store/brandingStore'

/**
 * Fetches branding once on app boot and populates the Zustand store
 * so React components (Logo, Footer, etc.) can read logos / site name.
 *
 * DOM-level branding (document title, favicon, meta description) is
 * handled by the inline bootstrap script in index.html — which fires
 * before React even loads — so we don't touch the DOM here.
 */
const BrandingLoader = () => {
    const setBranding = useBrandingStore((state) => state.setBranding)

    useEffect(() => {
        apiGetBranding()
            .then((resp) => setBranding(resp.data))
            .catch(() => {
                // Branding is cosmetic — fall back to bundled defaults silently.
            })
    }, [setBranding])

    return null
}

export default BrandingLoader


