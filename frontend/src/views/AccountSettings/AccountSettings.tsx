import { useEffect, useState } from 'react'
import Container from '@/components/shared/Container'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Tabs from '@/components/ui/Tabs'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import AccountProfilePanel from './components/AccountProfilePanel'
import AccountSecurityPanel from './components/AccountSecurityPanel'
import { apiGetAccount } from '@/services/AccountService'
import type { Account } from '@/services/AccountService'

const { TabNav, TabList, TabContent } = Tabs

const AccountSettings = () => {
    const [account, setAccount] = useState<Account | null>(null)

    useEffect(() => {
        apiGetAccount()
            .then((resp) => setAccount(resp.data))
            .catch((error: any) => {
                toast.push(
                    <Notification type="danger" title="Error Loading Account">
                        {error?.response?.data?.message || 'Failed to fetch your account.'}
                    </Notification>,
                    { placement: 'top-center' },
                )
            })
    }, [])

    return (
        <Container>
            <AdaptiveCard>
                <div className="flex flex-col gap-6">
                    <div className="pb-2 border-b border-gray-100 dark:border-gray-800">
                        <h3 className="heading-text">Account Settings</h3>
                        <p className="text-gray-500 text-sm mt-0.5">
                            Manage your own profile and password.
                        </p>
                    </div>

                    <Tabs defaultValue="profile">
                        <TabList>
                            <TabNav value="profile">Profile</TabNav>
                            <TabNav value="security">Security</TabNav>
                        </TabList>
                        <div className="pt-6">
                            <TabContent value="profile">
                                <AccountProfilePanel
                                    account={account ?? undefined}
                                    onUpdated={setAccount}
                                />
                            </TabContent>
                            <TabContent value="security">
                                <AccountSecurityPanel />
                            </TabContent>
                        </div>
                    </Tabs>
                </div>
            </AdaptiveCard>
        </Container>
    )
}

export default AccountSettings
