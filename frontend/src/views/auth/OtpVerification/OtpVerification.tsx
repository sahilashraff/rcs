import Alert from '@/components/ui/Alert'
import OtpVerificationForm from './components/OtpVerificationForm'
import useTimeOutMessage from '@/utils/hooks/useTimeOutMessage'
import { apiResendOtp } from '@/services/AuthService'
import { useSearchParams } from 'react-router'

export const OtpVerificationBase = () => {
    const [searchParams] = useSearchParams()
    const userId = Number(searchParams.get('userId'))

    const [otpResend, setOtpResend] = useTimeOutMessage()
    const [message, setMessage] = useTimeOutMessage()

    const handleResendOtp = async () => {
        try {
            await apiResendOtp({ userId })
            setOtpResend('We have sent you a new One Time Password.')
            // eslint-disable-next-line  @typescript-eslint/no-explicit-any
        } catch (errors: any) {
            setMessage?.(
                errors?.response?.data?.message || 'Some error occured!',
            )
        }
    }

    return (
        <div>
            <div className="mb-8">
                <h3 className="mb-2">OTP Verification</h3>
                <p className="font-semibold heading-text">
                    We have sent you a One Time Password to your phone.
                </p>
            </div>
            {message && (
                <Alert showIcon className="mb-4" type="danger">
                    <span className="break-all">{message}</span>
                </Alert>
            )}
            {otpResend && (
                <Alert showIcon className="mb-4" type="info">
                    <span className="break-all">{otpResend}</span>
                </Alert>
            )}
            <OtpVerificationForm userId={userId} setMessage={setMessage} />
            <div className="mt-4 text-center">
                <span className="font-semibold">Din&apos;t receive OTP? </span>
                <button
                    className="heading-text font-bold underline"
                    onClick={handleResendOtp}
                >
                    Resend OTP
                </button>
            </div>
        </div>
    )
}

const OtpVerification = () => {
    return <OtpVerificationBase />
}

export default OtpVerification
