const AGENT_STATUS_TAG_CLASSES: Record<string, string> = {
    live: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    partially_live:
        'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    pending:
        'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    submitted:
        'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700',
    rejected:
        'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800',
    suspended:
        'bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400 border-orange-200 dark:border-orange-800',
    terminated:
        'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400 border-red-200 dark:border-red-800',
}

/**
 * Single source of truth for status -> Tag color across every Agent-related
 * table (AdminAgents, tenant-side Agents). Covers both the six real
 * per-Agent-row statuses and the two tenant-level aggregate-only statuses
 * (`pending`, `partially_live`) that only ever appear on the tenant-side
 * aggregate badge.
 */
export function getAgentStatusTagClass(status: string): string {
    return AGENT_STATUS_TAG_CLASSES[status] ?? AGENT_STATUS_TAG_CLASSES.draft
}
