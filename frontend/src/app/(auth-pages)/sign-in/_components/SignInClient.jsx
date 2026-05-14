'use client'
import SignIn from '@/components/auth/SignIn'
import { onSignInWithCredentials } from '@/server/actions/auth/handleSignIn'
import { getProviders, signIn as clientSignIn } from 'next-auth/react'
import { REDIRECT_URL_KEY } from '@/constants/app.constant'
import { useSearchParams } from 'next/navigation'
import appConfig from '@/configs/app.config'
import { getAuthJsErrorMessage } from '@/utils/authJsErrorMessage'

const SignInClient = () => {
    const searchParams = useSearchParams()
    const callbackUrl = searchParams.get(REDIRECT_URL_KEY)
    const authQueryError = searchParams.get('error')

    const handleSignIn = async ({ values, setSubmitting, setMessage }) => {
        setSubmitting(true)

        try {
            // First call backend to get the JWT token
            const res = await fetch(`${appConfig.apiPrefix}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            })
            const json = await res.json()

            if (res.ok && json.success) {
                // Store token for axios interceptor
                localStorage.setItem('sp_token', json.data.token)
            } else {
                // Backend login failed — show the error and stop
                setMessage(json?.message || 'Invalid credentials!')
                setSubmitting(false)
                return
            }
        } catch {
            // Network error — continue with NextAuth flow anyway
        }

        const data = await onSignInWithCredentials(values, callbackUrl || '')
        if (data?.error) {
            setMessage(data.error)
            setSubmitting(false)
        }
    }

    const handleOAuthSignIn = async ({ type, setMessage }) => {
        if (type !== 'google') return
        try {
            const providers = await getProviders()
            if (!providers?.google) {
                setMessage?.(
                    'Google sign-in is not configured: add a non-empty GOOGLE_AUTH_CLIENT_SECRET (and GOOGLE_AUTH_CLIENT_ID) to frontend/.env.local, then restart `npm run dev`.',
                )
                return
            }
            const result = await clientSignIn('google', {
                callbackUrl: callbackUrl || appConfig.authenticatedEntryPath,
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
                'Could not start Google sign-in. Refresh the page and ensure .env.local has valid Google OAuth credentials.',
            )
        } catch (e) {
            console.error(e)
            setMessage?.(
                e?.message ||
                    'Google sign-in failed (network or server error). Check the browser console.',
            )
        }
    }

    return (
        <SignIn
            onSignIn={handleSignIn}
            onOauthSignIn={handleOAuthSignIn}
            authQueryError={authQueryError}
        />
    )
}

export default SignInClient
