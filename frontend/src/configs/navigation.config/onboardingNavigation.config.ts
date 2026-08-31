import type { NavigationTree } from '@/@types/navigation'

// A locked User has nothing to navigate to but the onboarding wizard
// itself — no sidebar items needed while isUnlocked is false, matching
// the spec's "no sidebar navigation needed" call.
const onboardingNavigationConfig: NavigationTree[] = []

export default onboardingNavigationConfig
