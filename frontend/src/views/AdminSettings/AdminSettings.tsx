import { useState, useRef, useEffect } from 'react'
import Container from '@/components/shared/Container'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Menu from '@/components/ui/Menu'
import ScrollBar from '@/components/ui/ScrollBar'
import Switcher from '@/components/ui/Switcher'
import Tag from '@/components/ui/Tag'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import ToggleDrawer from '@/components/shared/ToggleDrawer'
import useResponsive from '@/utils/hooks/useResponsive'
import type { ToggleDrawerRef } from '@/components/shared/ToggleDrawer'
import { apiGetSettings, apiUpdateSettings } from '@/services/SettingsService'
import type { Settings } from '@/services/SettingsService'
import GeneralSettingsPanel from './components/GeneralSettingsPanel'
import LocalisationSettingsPanel from './components/LocalisationSettingsPanel'
import FileManagerSettingsPanel from './components/FileManagerSettingsPanel'
import NotificationSoundSettingsPanel from './components/NotificationSoundSettingsPanel'
import {
    PiShieldCheckDuotone,
    PiChatCenteredDotsDuotone,
    PiSlidersHorizontalDuotone,
    PiClockDuotone,
    PiDeviceMobileDuotone,
    PiKeyDuotone,
    PiUsersThreeDuotone,
    PiGlobeDuotone,
    PiFileCloudDuotone,
    PiLockKeyDuotone,
    PiListBold,
    PiPaintBrushDuotone,
    PiCoinsDuotone,
    PiFolderOpenDuotone,
    PiSpeakerHighDuotone,
} from 'react-icons/pi'
import type { ReactNode } from 'react'

type SettingsView =
    | 'security'
    | 'rcs'
    | 'general'
    | 'branding'
    | 'localisation'
    | 'file_manager'
    | 'notification_sound'

const menuList: { label: string; value: SettingsView; icon: ReactNode; desc: string }[] = [
    {
        label: 'General',
        value: 'branding',
        icon: <PiPaintBrushDuotone className="text-xl" />,
        desc: 'Site identity, favicon & logos',
    },
    {
        label: 'Localisation',
        value: 'localisation',
        icon: <PiCoinsDuotone className="text-xl" />,
        desc: 'Currency & timezone',
    },
    {
        label: 'File Manager',
        value: 'file_manager',
        icon: <PiFolderOpenDuotone className="text-xl" />,
        desc: 'Allowed extensions & storage limits',
    },
    {
        label: 'Notification Sound',
        value: 'notification_sound',
        icon: <PiSpeakerHighDuotone className="text-xl" />,
        desc: 'Chat notification sound',
    },
    {
        label: 'Security & Auth',
        value: 'security',
        icon: <PiShieldCheckDuotone className="text-xl" />,
        desc: 'OTP & authentication rules',
    },
    {
        label: 'RCS Rules (India)',
        value: 'rcs',
        icon: <PiChatCenteredDotsDuotone className="text-xl" />,
        desc: 'TRAI timing & quotas',
    },
    {
        label: 'System Defaults',
        value: 'general',
        icon: <PiSlidersHorizontalDuotone className="text-xl" />,
        desc: 'Carrier & media limits',
    },
]

const AdminSettings = () => {
    const [currentView, setCurrentView] = useState<SettingsView>('branding')
    const [settings, setSettings] = useState<Settings | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const { smaller, larger } = useResponsive()
    const drawerRef = useRef<ToggleDrawerRef>(null)

    useEffect(() => {
        apiGetSettings()
            .then((resp) => setSettings(resp.data))
            .catch((error: any) => {
                toast.push(
                    <Notification type="danger" title="Error Loading Settings">
                        {error?.response?.data?.message || 'Failed to fetch settings.'}
                    </Notification>,
                    { placement: 'top-center' },
                )
            })
    }, [])

    const handleToggleOtp = async () => {
        if (!settings) return

        const next = !settings.otp_verification_enabled
        setIsSaving(true)
        try {
            const resp = await apiUpdateSettings({ otp_verification_enabled: next })
            setSettings(resp.data)
            toast.push(
                <Notification type="success" title="Setting Updated">
                    Phone verification has been {next ? 'enabled' : 'disabled'}.
                </Notification>,
                { placement: 'top-center' },
            )
        } catch (error: any) {
            toast.push(
                <Notification type="danger" title="Update Failed">
                    {error?.response?.data?.message || 'Could not update settings.'}
                </Notification>,
                { placement: 'top-center' },
            )
        } finally {
            setIsSaving(false)
        }
    }

    const isOtpEnabled = settings?.otp_verification_enabled ?? false

    const renderMenuContent = (onSelect?: () => void) => (
        <div className="flex flex-col h-full">
            <div className="px-3 py-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Configuration
                </span>
            </div>
            <ScrollBar className="h-full overflow-y-auto">
                <Menu className="mb-4">
                    {menuList.map((item) => {
                        const active = currentView === item.value
                        return (
                            <Menu.MenuItem
                                key={item.value}
                                eventKey={item.value}
                                className={`mb-1.5 rounded-xl transition-all ${
                                    active
                                        ? 'bg-primary-50 text-primary dark:bg-primary-950/60 dark:text-primary-300 font-semibold'
                                        : 'hover:bg-gray-100 dark:hover:bg-gray-800/60 text-gray-600 dark:text-gray-300'
                                }`}
                                isActive={active}
                                onSelect={() => {
                                    setCurrentView(item.value)
                                    onSelect?.()
                                }}
                            >
                                <div className="flex items-center gap-3 py-1">
                                    <span className="text-2xl shrink-0">{item.icon}</span>
                                    <div className="flex flex-col">
                                        <span className="text-sm leading-tight">{item.label}</span>
                                        <span className="text-[11px] text-gray-400 font-normal leading-tight mt-0.5">
                                            {item.desc}
                                        </span>
                                    </div>
                                </div>
                            </Menu.MenuItem>
                        )
                    })}
                </Menu>
            </ScrollBar>
        </div>
    )

    return (
        <Container>
            <AdaptiveCard className="h-full">
                <div className="flex flex-col gap-6">
                    {/* Page Header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 pb-4 border-b border-gray-100 dark:border-gray-800">
                        <div>
                            <h3 className="heading-text">Settings</h3>
                            <p className="text-gray-500 text-sm mt-0.5">
                                Manage platform security, authentication rules, and global configuration.
                            </p>
                        </div>
                    </div>

                    {/* Split Layout */}
                    <div className="flex flex-auto min-h-[500px]">
                        {/* Desktop Sidebar Menu */}
                        {larger.lg && (
                            <div className="w-[240px] xl:w-[280px] shrink-0 ltr:border-r rtl:border-l border-gray-200 dark:border-gray-700/80 ltr:pr-6 rtl:pl-6">
                                {renderMenuContent()}
                            </div>
                        )}

                        {/* Content Area */}
                        <div className="flex-1 xl:ltr:pl-8 xl:rtl:pr-8 ltr:pl-0 rtl:pr-0">
                            {/* Mobile Drawer Trigger */}
                            {smaller.lg && (
                                <div className="mb-6 flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl text-primary">
                                            {menuList.find((m) => m.value === currentView)?.icon}
                                        </span>
                                        <span className="font-semibold text-sm heading-text">
                                            {menuList.find((m) => m.value === currentView)?.label}
                                        </span>
                                    </div>
                                    <ToggleDrawer
                                        ref={drawerRef}
                                        title="Settings Navigation"
                                    >
                                        <div className="p-4">
                                            {renderMenuContent(() =>
                                                drawerRef.current?.handleCloseDrawer(),
                                            )}
                                        </div>
                                    </ToggleDrawer>
                                </div>
                            )}

                            {/* View 0: General branding */}
                            {currentView === 'branding' && (
                                <GeneralSettingsPanel
                                    general={settings?.general}
                                    onUpdated={(general) =>
                                        setSettings((prev) => (prev ? { ...prev, general } : prev))
                                    }
                                />
                            )}

                            {currentView === 'localisation' && (
                                <LocalisationSettingsPanel
                                    localisation={settings?.localisation}
                                    onUpdated={(localisation) =>
                                        setSettings((prev) => (prev ? { ...prev, localisation } : prev))
                                    }
                                />
                            )}

                            {currentView === 'file_manager' && (
                                <FileManagerSettingsPanel
                                    fileManager={settings?.file_manager}
                                    onUpdated={(file_manager) =>
                                        setSettings((prev) => (prev ? { ...prev, file_manager } : prev))
                                    }
                                />
                            )}

                            {currentView === 'notification_sound' && (
                                <NotificationSoundSettingsPanel
                                    notificationSound={settings?.notification_sound}
                                    onUpdated={(notification_sound) =>
                                        setSettings((prev) => (prev ? { ...prev, notification_sound } : prev))
                                    }
                                />
                            )}

                            {/* View 1: Security & Authentication */}
                            {currentView === 'security' && (
                                <div className="space-y-6">
                                    <div className="pb-4 border-b border-gray-100 dark:border-gray-800">
                                        <h4 className="heading-text font-bold">Security & Authentication</h4>
                                        <p className="text-gray-500 text-sm mt-1">
                                            Control sign-up verification mechanisms, session policies, and password requirements.
                                        </p>
                                    </div>

                                    {/* Setting Row 1: Phone OTP Verification */}
                                    <div className="py-5 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 rounded-xl bg-primary-50 dark:bg-primary-950/50 text-primary text-2xl shrink-0 mt-0.5">
                                                <PiDeviceMobileDuotone />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2.5">
                                                    <h6 className="font-semibold heading-text text-base">
                                                        Require Phone OTP Verification at Sign-Up
                                                    </h6>
                                                    <Tag
                                                        className={
                                                            isOtpEnabled
                                                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 text-xs font-semibold'
                                                                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200 text-xs font-semibold'
                                                        }
                                                    >
                                                        {isOtpEnabled ? 'Enabled' : 'Disabled'}
                                                    </Tag>
                                                </div>
                                                <p className="text-sm text-gray-500 mt-1 max-w-xl">
                                                    When enabled, newly registered tenant accounts must verify a 6-digit one-time passcode sent to their phone before logging in or receiving an active session token.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="shrink-0 pl-14 sm:pl-0">
                                            <Switcher
                                                checked={isOtpEnabled}
                                                isLoading={isSaving}
                                                onChange={handleToggleOtp}
                                            />
                                        </div>
                                    </div>

                                    {/* Setting Row 2: Password Policy */}
                                    <div className="py-5 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-2xl shrink-0 mt-0.5">
                                                <PiKeyDuotone />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2.5">
                                                    <h6 className="font-semibold heading-text text-base">
                                                        Password Length & Confirmation Policy
                                                    </h6>
                                                    <Tag className="bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 text-xs font-semibold">
                                                        Active
                                                    </Tag>
                                                </div>
                                                <p className="text-sm text-gray-500 mt-1 max-w-xl">
                                                    Enforces a minimum 8-character password length and identical confirmation matching on registration, sub-account provisioning, and password resets.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Setting Row 3: Session Security */}
                                    <div className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-2xl shrink-0 mt-0.5">
                                                <PiLockKeyDuotone />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2.5">
                                                    <h6 className="font-semibold heading-text text-base">
                                                        Token Invalidation on Sign-Out
                                                    </h6>
                                                    <Tag className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 text-xs font-semibold">
                                                        Enforced
                                                    </Tag>
                                                </div>
                                                <p className="text-sm text-gray-500 mt-1 max-w-xl">
                                                    Sanctum SPA personal access tokens are immediately deleted from the database upon signing out, preventing replay attacks.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* View 2: RCS Rules (India) */}
                            {currentView === 'rcs' && (
                                <div className="space-y-6">
                                    <div className="pb-4 border-b border-gray-100 dark:border-gray-800">
                                        <h4 className="heading-text font-bold">RCS Business Rules & Regulatory Compliance</h4>
                                        <p className="text-gray-500 text-sm mt-1">
                                            Regional telecom regulations, delivery schedules, and conversation limits for India.
                                        </p>
                                    </div>

                                    {/* TRAI Timing Window */}
                                    <div className="py-5 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 text-2xl shrink-0 mt-0.5">
                                                <PiClockDuotone />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2.5">
                                                    <h6 className="font-semibold heading-text text-base">
                                                        Initiation Time Window (TRAI India)
                                                    </h6>
                                                    <Tag className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 text-xs font-semibold">
                                                        07:00 – 22:00 IST
                                                    </Tag>
                                                </div>
                                                <p className="text-sm text-gray-500 mt-1 max-w-xl">
                                                    Businesses are permitted to initiate outbound RCS messages to Indian mobile numbers strictly between 7:00 AM and 10:00 PM (7 days a week) in compliance with TRAI regulations.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Session Window */}
                                    <div className="py-5 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-2xl shrink-0 mt-0.5">
                                                <PiUsersThreeDuotone />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2.5">
                                                    <h6 className="font-semibold heading-text text-base">
                                                        Customer Care Conversational Session
                                                    </h6>
                                                    <Tag className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200 text-xs font-semibold">
                                                        24h Active Window
                                                    </Tag>
                                                </div>
                                                <p className="text-sm text-gray-500 mt-1 max-w-xl">
                                                    Responses to incoming user-initiated messages are treated as customer care interactions and remain valid for 24 hours following the user’s last message.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Outbound Quotas */}
                                    <div className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 text-2xl shrink-0 mt-0.5">
                                                <PiChatCenteredDotsDuotone />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2.5">
                                                    <h6 className="font-semibold heading-text text-base">
                                                        Outbound Rate Limits & Unique User Quotas
                                                    </h6>
                                                    <Tag className="bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 text-xs font-semibold">
                                                        Enforced
                                                    </Tag>
                                                </div>
                                                <p className="text-sm text-gray-500 mt-1 max-w-xl">
                                                    Protects carrier delivery reputation by restricting unsolicited repeat messages per destination and limiting total unique recipients reachable per billing cycle.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* View 3: System Defaults */}
                            {currentView === 'general' && (
                                <div className="space-y-6">
                                    <div className="pb-4 border-b border-gray-100 dark:border-gray-800">
                                        <h4 className="heading-text font-bold">System & Telecom Defaults</h4>
                                        <p className="text-gray-500 text-sm mt-1">
                                            Default telecom dialing codes, rich media payload limits, and carousel configurations.
                                        </p>
                                    </div>

                                    {/* Country Code */}
                                    <div className="py-5 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-2xl shrink-0 mt-0.5">
                                                <PiGlobeDuotone />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2.5">
                                                    <h6 className="font-semibold heading-text text-base">
                                                        Default Dialing & Country Code
                                                    </h6>
                                                    <Tag className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 text-xs font-semibold">
                                                        +91 (India)
                                                    </Tag>
                                                </div>
                                                <p className="text-sm text-gray-500 mt-1 max-w-xl">
                                                    Pre-selected country code applied to registration forms, tenant onboarding, and carrier routing pipelines.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Media Upload Limits */}
                                    <div className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 text-2xl shrink-0 mt-0.5">
                                                <PiFileCloudDuotone />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2.5">
                                                    <h6 className="font-semibold heading-text text-base">
                                                        RCS Rich Card & Carousel Limits
                                                    </h6>
                                                    <Tag className="bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200 text-xs font-semibold">
                                                        Max 10 Cards / 10MB
                                                    </Tag>
                                                </div>
                                                <p className="text-sm text-gray-500 mt-1 max-w-xl">
                                                    Enforces Google RCS specifications: up to 10 rich cards per carousel, 4 suggested action chips per card, and 10MB max image/video file size.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </AdaptiveCard>
        </Container>
    )
}

export default AdminSettings
