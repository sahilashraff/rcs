import ApiService from './ApiService'
import endpointConfig from '@/configs/endpoint.config'
import type {
    SignInCredential,
    SignUpCredential,
    ForgotPassword,
    ResetPassword,
    VerifyOtp,
    ResendOtp,
    SignInResponse,
    SignInSuccessResponse,
    SignUpResponse,
    CurrentUserResponse,
} from '@/@types/auth'

export async function apiSignIn(data: SignInCredential) {
    return ApiService.fetchDataWithAxios<SignInResponse>({
        url: endpointConfig.signIn,
        method: 'post',
        data,
    })
}

export async function apiSignUp(data: SignUpCredential) {
    return ApiService.fetchDataWithAxios<SignUpResponse>({
        url: endpointConfig.signUp,
        method: 'post',
        data,
    })
}

export async function apiSignOut() {
    return ApiService.fetchDataWithAxios({
        url: endpointConfig.signOut,
        method: 'post',
    })
}

// Refetches the signed-in user's authority live from the backend — the
// single source of truth for what they can access. Called on app boot so
// a permission an Owner just granted or revoked takes effect immediately,
// instead of waiting for the next sign-in to refresh the cached copy.
export async function apiGetCurrentUser() {
    return ApiService.fetchDataWithAxios<CurrentUserResponse>({
        url: endpointConfig.currentUser,
        method: 'get',
    })
}

export async function apiForgotPassword<T>(data: ForgotPassword) {
    return ApiService.fetchDataWithAxios<T>({
        url: endpointConfig.forgotPassword,
        method: 'post',
        data,
    })
}

export async function apiResetPassword<T>(data: ResetPassword) {
    return ApiService.fetchDataWithAxios<T>({
        url: endpointConfig.resetPassword,
        method: 'post',
        data,
    })
}

export async function apiVerifyOtp(data: VerifyOtp) {
    return ApiService.fetchDataWithAxios<SignInSuccessResponse>({
        url: '/otp/verify',
        method: 'post',
        data,
    })
}

export async function apiResendOtp(data: ResendOtp) {
    return ApiService.fetchDataWithAxios<{ status: string }>({
        url: '/otp/resend',
        method: 'post',
        data,
    })
}
