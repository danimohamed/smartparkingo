'use client'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import SignUp from '@/components/auth/SignUp'
import { apiSignUp } from '@/services/AuthService'
import { useRouter } from 'next/navigation'
import { getProviders, signIn as clientSignIn } from 'next-auth/react'
import appConfig from '@/configs/app.config'
import { getAuthJsErrorMessage } from '@/utils/authJsErrorMessage'

const SignUpClient = () => {
    const router = useRouter()

    const handlSignUp = async ({ values, setSubmitting, setMessage }) => {
        try {
            setSubmitting(true)
            await apiSignUp(values)
            toast.push(
                <Notification title="Account created!" type="success">
                    You can now sign in from our sign in page
                </Notification>,
            )
            router.push('/sign-in')
        } catch (error) {
            const msg = error?.response?.data?.message || error?.message || 'Sign up failed'
            setMessage(msg)
        } finally {
            setSubmitting(false)
        }
    }

    const handleOAuthSignUp = async ({ type, setMessage }) => {
        if (type !== 'google') return
        try {
            const providers = await getProviders()
            if (!providers?.google) {
                setMessage?.(
                    'Google sign-in is not configured: add GOOGLE_AUTH_CLIENT_SECRET to frontend/.env.local, then restart the dev server.',
                )
                return
            }
            const result = await clientSignIn('google', {
                callbackUrl: appConfig.authenticatedEntryPath,
                redirect: false,
            })
            if (result?.error) {
                setMessage?.(getAuthJsErrorMessage(result.error))
                return
            }
            if (result?.url) {
                window.location.href = result.url
                return
            }
            setMessage?.(
                'Could not start Google sign-in. Refresh the page and check Google OAuth settings in .env.local.',
            )
        } catch (e) {
            console.error(e)
            setMessage?.(e?.message || 'Google sign-in failed.')
        }
    }

    return <SignUp onSignUp={handlSignUp} onOauthSignUp={handleOAuthSignUp} />
}

export default SignUpClient
