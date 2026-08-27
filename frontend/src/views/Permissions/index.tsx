import { useEffect, useState } from 'react'
import {
    apiGetFeatures,
    apiGetSubAccounts,
    apiCreateSubAccount,
    apiUpdateSubAccountPermissions,
    type Feature,
    type SubAccount,
} from '@/services/SubAccountService'

const Permissions = () => {
    const [features, setFeatures] = useState<Feature[]>([])
    const [subAccounts, setSubAccounts] = useState<SubAccount[]>([])
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const load = async () => {
        const [featuresResp, subAccountsResp] = await Promise.all([
            apiGetFeatures(),
            apiGetSubAccounts(),
        ])
        setFeatures(featuresResp.data)
        setSubAccounts(subAccountsResp.data)
    }

    useEffect(() => {
        load()
    }, [])

    const createSubAccount = async () => {
        await apiCreateSubAccount({ name, email, password })
        setName('')
        setEmail('')
        setPassword('')
        await load()
    }

    const toggle = async (subAccount: SubAccount, key: string) => {
        const has = subAccount.permissions.includes(key)
        const next = has
            ? subAccount.permissions.filter((k) => k !== key)
            : [...subAccount.permissions, key]
        await apiUpdateSubAccountPermissions(subAccount.id, next)
        await load()
    }

    return (
        <div>
            <h3>Create sub-account</h3>
            <input
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            <input
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <input
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <button onClick={createSubAccount}>Create</button>

            <h3>Sub-accounts</h3>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        {features.map((f) => (
                            <th key={f.key}>{f.label}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {subAccounts.map((sa) => (
                        <tr key={sa.id}>
                            <td>{sa.name}</td>
                            <td>{sa.email}</td>
                            {features.map((f) => (
                                <td key={f.key}>
                                    <input
                                        type="checkbox"
                                        checked={sa.permissions.includes(
                                            f.key,
                                        )}
                                        onChange={() => toggle(sa, f.key)}
                                    />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default Permissions
