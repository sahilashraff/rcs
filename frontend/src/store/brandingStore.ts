import { create } from 'zustand'
import type { GeneralSettings } from '@/services/SettingsService'

type BrandingState = {
    branding: GeneralSettings | null
    setBranding: (branding: GeneralSettings) => void
}

export const useBrandingStore = create<BrandingState>()((set) => ({
    branding: null,
    setBranding: (branding) => set({ branding }),
}))
