import type { ReactNode } from 'react'
import {
    TbShieldCheck,
    TbLayoutDashboard,
    TbBuildingBroadcastTower,
    TbRobot,
    TbSpeakerphone,
    TbChartBar,
    TbFiles,
    TbSettings,
    TbLock,
} from 'react-icons/tb'

export const FEATURE_METADATA: Record<
    string,
    { label: string; description: string; icon: ReactNode; colorClass: string; badgeClass: string }
> = {
    permissions: {
        label: 'Team',
        description: 'Manage staff accounts, assign granular role permissions and module gates.',
        icon: <TbShieldCheck className="text-xl text-indigo-500" />,
        colorClass: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800',
        badgeClass: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
    },
    dashboard: {
        label: 'Dashboard & Analytics',
        description: 'View tenant overview metrics, live throughput, and key performance charts.',
        icon: <TbLayoutDashboard className="text-xl text-emerald-500" />,
        colorClass: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
        badgeClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    },
    carriers: {
        label: 'Carrier Management',
        description: 'Configure and monitor Jio, VI, and Airtel carrier registrations and rate cards.',
        icon: <TbBuildingBroadcastTower className="text-xl text-blue-500" />,
        colorClass: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
        badgeClass: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    },
    agents: {
        label: 'RCS Agents & Bots',
        description: 'Create and register RCS business agents, brand assets, and bot capabilities.',
        icon: <TbRobot className="text-xl text-violet-500" />,
        colorClass: 'text-violet-500 bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800',
        badgeClass: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400 border-violet-200 dark:border-violet-800',
    },
    campaigns: {
        label: 'Campaigns & Broadcasts',
        description: 'Launch mass RCS marketing broadcasts, carousel sequences, and track CTRs.',
        icon: <TbSpeakerphone className="text-xl text-amber-500" />,
        colorClass: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
        badgeClass: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    },
    analytics: {
        label: 'Reports & Deep Analytics',
        description: 'Export delivery receipts, read rates, click actions, and carrier spend audits.',
        icon: <TbChartBar className="text-xl text-cyan-500" />,
        colorClass: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800',
        badgeClass: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800',
    },
    templates: {
        label: 'Media & Template Assets',
        description: 'Manage rich card media, hero images, carousel cards, and suggested actions.',
        icon: <TbFiles className="text-xl text-pink-500" />,
        colorClass: 'text-pink-500 bg-pink-50 dark:bg-pink-950/40 border-pink-200 dark:border-pink-800',
        badgeClass: 'bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400 border-pink-200 dark:border-pink-800',
    },
    files: {
        label: 'File Manager',
        description: 'Upload, organize, preview media assets, documents, and monitor storage quota.',
        icon: <TbFiles className="text-xl text-blue-500" />,
        colorClass: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
        badgeClass: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    },
    settings: {
        label: 'Tenant Settings & API Keys',
        description: 'Webhooks, API keys, security preferences, and whitelabel configurations.',
        icon: <TbSettings className="text-xl text-slate-500" />,
        colorClass: 'text-slate-500 bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800',
        badgeClass: 'bg-slate-50 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400 border-slate-200 dark:border-slate-800',
    },
}


export const getFeatureMetadata = (key: string, fallbackLabel?: string) => {
    if (FEATURE_METADATA[key]) {
        return FEATURE_METADATA[key]
    }
    return {
        label: fallbackLabel || key.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        description: 'Configure access permissions for this module.',
        icon: <TbLock className="text-xl text-gray-500" />,
        colorClass: 'text-gray-500 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
        badgeClass: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700',
    }
}

export const AVATAR_COLORS = [
    'bg-blue-500 text-white',
    'bg-indigo-500 text-white',
    'bg-violet-500 text-white',
    'bg-emerald-500 text-white',
    'bg-teal-500 text-white',
    'bg-amber-500 text-white',
    'bg-rose-500 text-white',
    'bg-cyan-500 text-white',
]

export const getAvatarColor = (name: string) => {
    let hash = 0
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    const index = Math.abs(hash) % AVATAR_COLORS.length
    return AVATAR_COLORS[index]
}

export const getInitials = (name: string) => {
    if (!name) return 'SA'
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) {
        return parts[0].substring(0, 2).toUpperCase()
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
