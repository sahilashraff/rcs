export type SignInCredential = {
    email: string
    password: string
}

export type AuthUser = {
    userId: string
    userName: string
    authority: string[]
    avatar: string
    email: string
    isAdmin: boolean
    isUnlocked: boolean
}

export type SignUpCredential = {
    name: string
    email: string
    country_code: string
    phone: string
    password: string
}

export type SignInSuccessResponse = {
    token: string
    user: AuthUser
}

export type RequiresVerificationResponse = {
    requiresVerification: true
    userId: number
}

export type SignInResponse = SignInSuccessResponse | RequiresVerificationResponse

export type SignUpResponse = SignInSuccessResponse | RequiresVerificationResponse

export type CurrentUserResponse = {
    user: AuthUser
}

export type ForgotPassword = {
    email: string
}

export type ResetPassword = {
    email: string
    token: string
    password: string
}

export type VerifyOtp = {
    userId: number
    code: string
}

export type ResendOtp = {
    userId: number
}

export type AuthRequestStatus = 'success' | 'failed' | ''

export type AuthResult = Promise<{
    status: AuthRequestStatus
    message: string
}>

export type User = {
    userId?: string | null
    avatar?: string | null
    userName?: string | null
    email?: string | null
    authority?: string[]
    isAdmin?: boolean
    isUnlocked?: boolean
}

export type Token = {
    accessToken: string
    refereshToken?: string
}

export type OauthSignInCallbackPayload = {
    onSignIn: (tokens: Token, user?: User) => void
    redirect: () => void
}
