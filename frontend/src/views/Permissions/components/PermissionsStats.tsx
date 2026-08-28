import Card from '@/components/ui/Card'
import Tag from '@/components/ui/Tag'
import {
    TbUsers,
    TbShieldCheck,
    TbLockCheck,
    TbKey,
} from 'react-icons/tb'

type PermissionsStatsProps = {
    subAccountsCount: number
    featuresCount: number
    grantedCount: number
}

const PermissionsStats = ({
    subAccountsCount,
    featuresCount,
    grantedCount,
}: PermissionsStatsProps) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Card 1: Total Sub-Accounts */}
            <Card className="border border-gray-200 dark:border-gray-700/80">
                <div className="flex items-center justify-between">
                    <div>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Total Staff Accounts
                        </span>
                        <div className="mt-2 flex items-center gap-2">
                            <h3 className="font-bold text-2xl heading-text leading-none">
                                {subAccountsCount}
                            </h3>
                            <Tag className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs py-0.5 px-2 font-medium">
                                Active Staff
                            </Tag>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Delegated tenant logins
                        </p>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl">
                        <TbUsers className="text-2xl" />
                    </div>
                </div>
            </Card>

            {/* Card 2: Registered Feature Modules */}
            <Card className="border border-gray-200 dark:border-gray-700/80">
                <div className="flex items-center justify-between">
                    <div>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Protected Modules
                        </span>
                        <div className="mt-2 flex items-center gap-2">
                            <h3 className="font-bold text-2xl heading-text leading-none">
                                {featuresCount}
                            </h3>
                            <Tag className="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-xs py-0.5 px-2 font-medium">
                                Registry
                            </Tag>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Gate-enforced features
                        </p>
                    </div>
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
                        <TbShieldCheck className="text-2xl" />
                    </div>
                </div>
            </Card>

            {/* Card 3: Active Grants */}
            <Card className="border border-gray-200 dark:border-gray-700/80">
                <div className="flex items-center justify-between">
                    <div>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Active Grants
                        </span>
                        <div className="mt-2 flex items-center gap-2">
                            <h3 className="font-bold text-2xl heading-text leading-none">
                                {grantedCount}
                            </h3>
                            <Tag className="bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400 border border-violet-200 dark:border-violet-800 text-xs py-0.5 px-2 font-medium">
                                Direct RBAC
                            </Tag>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Assigned feature permissions
                        </p>
                    </div>
                    <div className="p-3 bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 rounded-xl">
                        <TbKey className="text-2xl" />
                    </div>
                </div>
            </Card>

            {/* Card 4: Access Policy */}
            <Card className="border border-gray-200 dark:border-gray-700/80">
                <div className="flex items-center justify-between">
                    <div>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Security Policy
                        </span>
                        <div className="mt-2 flex items-center gap-2">
                            <h3 className="font-bold text-2xl heading-text leading-none">
                                Strict
                            </h3>
                            <Tag className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs py-0.5 px-2 font-medium">
                                Default Deny
                            </Tag>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Owner-restricted access
                        </p>
                    </div>
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
                        <TbLockCheck className="text-2xl" />
                    </div>
                </div>
            </Card>
        </div>
    )
}

export default PermissionsStats
