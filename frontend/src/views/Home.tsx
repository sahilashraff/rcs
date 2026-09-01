import Container from '@/components/shared/Container'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Tag from '@/components/ui/Tag'
import { useNavigate } from 'react-router'
import { useEffect, useState } from 'react'
import { apiGetTenantAgents } from '@/services/TenantAgentService'
import type { TenantAgents } from '@/services/TenantAgentService'
import { apiGetSubAccounts } from '@/services/SubAccountService'
import {
    PiRobotDuotone,
    PiUsersDuotone,
    PiArrowRightBold,
    PiCheckCircleDuotone,
    PiBroadcastDuotone,
} from 'react-icons/pi'

const statusTagClasses: Record<string, string> = {
    live: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    partially_live: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    pending: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700',
    suspended: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800',
    terminated: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400 border-red-200 dark:border-red-800',
}

const Home = () => {
    const navigate = useNavigate()
    const [agentData, setAgentData] = useState<TenantAgents | null>(null)
    const [memberCount, setMemberCount] = useState<number>(0)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        Promise.allSettled([apiGetTenantAgents(), apiGetSubAccounts()])
            .then(([agentRes, subAccountRes]) => {
                if (agentRes.status === 'fulfilled') {
                    setAgentData(agentRes.value.data)
                }
                if (subAccountRes.status === 'fulfilled') {
                    setMemberCount(subAccountRes.value.data?.length ?? 0)
                }
            })
            .finally(() => setIsLoading(false))
    }, [])

    const agentStatus = agentData?.status || 'draft'
    const tagClass = statusTagClasses[agentStatus] || statusTagClasses.draft
    const registeredCarriersCount = agentData?.agents?.length ?? 0

    return (
        <Container>
            <div className="mb-6">
                <h3 className="heading-text">Overview</h3>
                <p className="text-gray-500 text-sm mt-1">
                    Welcome to your RCS Business Messaging dashboard. Monitor your bot deployments and manage team access.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Agent Status Card */}
                <Card className="border border-gray-200 dark:border-gray-700/80 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-lg bg-primary-50 dark:bg-primary-950/50 text-primary text-2xl">
                                <PiRobotDuotone />
                            </div>
                            <div>
                                <h6 className="font-semibold heading-text">RCS Bot Status</h6>
                                <p className="text-xs text-gray-500 mt-0.5">Carrier Registrations</p>
                            </div>
                        </div>
                        <Tag className={`text-xs font-semibold capitalize border ${tagClass}`}>
                            {agentStatus.replace('_', ' ')}
                        </Tag>
                    </div>

                    <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <PiBroadcastDuotone className="text-base" />
                            <span>{isLoading ? '...' : `${registeredCarriersCount} Carrier(s) Configured`}</span>
                        </div>
                        <Button
                            size="xs"
                            variant="plain"
                            icon={<PiArrowRightBold />}
                            onClick={() => navigate('/agents')}
                        >
                            View Agents
                        </Button>
                    </div>
                </Card>

                {/* Team Members Card */}
                <Card className="border border-gray-200 dark:border-gray-700/80 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-2xl">
                                <PiUsersDuotone />
                            </div>
                            <div>
                                <h6 className="font-semibold heading-text">Team Members</h6>
                                <p className="text-xs text-gray-500 mt-0.5">Sub-Account Access</p>
                            </div>
                        </div>
                        <span className="text-xl font-bold heading-text">
                            {isLoading ? '...' : memberCount}
                        </span>
                    </div>

                    <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <PiCheckCircleDuotone className="text-base text-emerald-500" />
                            <span>Role-based permissions</span>
                        </div>
                        <Button
                            size="xs"
                            variant="plain"
                            icon={<PiArrowRightBold />}
                            onClick={() => navigate('/permissions')}
                        >
                            Manage Team
                        </Button>
                    </div>
                </Card>
            </div>
        </Container>
    )
}

export default Home
