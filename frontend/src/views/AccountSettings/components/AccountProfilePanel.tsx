import { useEffect, useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Avatar from '@/components/ui/Avatar'
import Upload from '@/components/ui/Upload'
import Alert from '@/components/ui/Alert'
import { FormItem } from '@/components/ui/Form'
import { PiUserDuotone } from 'react-icons/pi'
import { apiUpdateAccount } from '@/services/AccountService'
import { apiGetCurrentUser } from '@/services/AuthService'
import { useSessionUser } from '@/store/authStore'
import type { Account } from '@/services/AccountService'

type AccountProfilePanelProps = {
    account: Account | undefined
    onUpdated: (account: Account) => void
}

const AccountProfilePanel = ({ account, onUpdated }: AccountProfilePanelProps) => {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [countryCode, setCountryCode] = useState('')
    const [phone, setPhone] = useState('')
    const [avatarFile, setAvatarFile] = useState<File | undefined>()
    const [isSaving, setIsSaving] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const setSessionUser = useSessionUser((state) => state.setUser)

    useEffect(() => {
        setName(account?.name ?? '')
        setEmail(account?.email ?? '')
        setCountryCode(account?.country_code ?? '')
        setPhone(account?.phone ?? '')
    }, [account])

    const avatarPreview = avatarFile ? URL.createObjectURL(avatarFile) : account?.avatar_url

    const handleSave = async () => {
        if (!name.trim() || !email.trim()) {
            setErrorMessage('Name and email are required.')
            return
        }
        try {
            setIsSaving(true)
            setErrorMessage(null)
            const resp = await apiUpdateAccount(
                { name: name.trim(), email: email.trim(), country_code: countryCode || undefined, phone: phone || undefined },
                avatarFile,
            )
            onUpdated(resp.data)
            setAvatarFile(undefined)

            // Keep the header dropdown / sidebar avatar and name in sync
            // immediately, rather than waiting for the next app boot's
            // apiGetCurrentUser() refresh.
            const me = await apiGetCurrentUser()
            setSessionUser(me.user)
        } catch (err: any) {
            setErrorMessage(err?.response?.data?.message || 'Failed to save profile.')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="pb-4 border-b border-gray-100 dark:border-gray-800">
                <h4 className="heading-text font-bold">Profile</h4>
                <p className="text-gray-500 text-sm mt-1">Your name, contact details, and avatar.</p>
            </div>

            {errorMessage && (
                <Alert type="danger" showIcon className="text-xs">
                    {errorMessage}
                </Alert>
            )}

            <div className="flex items-center gap-4">
                <Avatar
                    size={64}
                    shape="circle"
                    {...(avatarPreview ? { src: avatarPreview } : { icon: <PiUserDuotone /> })}
                />
                <Upload accept="image/*" uploadLimit={1} showList={false} onChange={(fileList) => setAvatarFile(fileList[0])}>
                    <Button type="button" size="sm" variant="default">
                        {account?.avatar_url ? 'Replace Avatar' : 'Upload Avatar'}
                    </Button>
                </Upload>
            </div>

            <FormItem label="Name" className="mb-0">
                <Input value={name} onChange={(e) => setName(e.target.value)} disabled={isSaving} />
            </FormItem>
            <FormItem label="Email" className="mb-0">
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isSaving} />
            </FormItem>
            <div className="grid grid-cols-3 gap-3">
                <FormItem label="Country Code" className="mb-0">
                    <Input value={countryCode} onChange={(e) => setCountryCode(e.target.value)} disabled={isSaving} />
                </FormItem>
                <div className="col-span-2">
                    <FormItem label="Phone" className="mb-0">
                        <Input value={phone} onChange={(e) => setPhone(e.target.value)} disabled={isSaving} />
                    </FormItem>
                </div>
            </div>

            <div className="flex justify-end pt-2">
                <Button type="button" variant="solid" loading={isSaving} onClick={handleSave}>
                    Save Profile
                </Button>
            </div>
        </div>
    )
}

export default AccountProfilePanel
