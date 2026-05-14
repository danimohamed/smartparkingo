'use client'

import { useEffect } from 'react'
import Alert from '@/components/ui/Alert'
import SignInForm from './SignInForm'
import useTimeOutMessage from '@/utils/hooks/useTimeOutMessage'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { getAuthJsErrorMessage } from '@/utils/authJsErrorMessage'

const HORIZONTAL_LOGO = '/landing/logo-horizontal.png'

function GoogleMark() {
    return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
            <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
            />
            <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
            />
            <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
            />
            <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
            />
        </svg>
    )
}

const SignIn = ({
    signUpUrl = '/sign-up',
    forgetPasswordUrl = '/forgot-password',
    onSignIn,
    onOauthSignIn,
    authQueryError,
}) => {
    const [message, setMessage] = useTimeOutMessage()
    const t = useTranslations('auth.signIn')
    const tCommon = useTranslations('common')

    const handleGoogleSignIn = () => {
        onOauthSignIn?.({ type: 'google', setMessage })
    }

    useEffect(() => {
        if (authQueryError) {
            setMessage(getAuthJsErrorMessage(authQueryError))
        }
    }, [authQueryError, setMessage])

    return (
        <div className="w-full max-w-[420px]">
            <div className="mb-8">
                <Link href="/" className="group inline-flex items-center">
                    <Image
                        src={HORIZONTAL_LOGO}
                        alt={tCommon('appName')}
                        width={280}
                        height={64}
                        className="h-10 w-auto object-contain transition-transform group-hover:scale-[1.01]"
                        priority
                    />
                </Link>
            </div>

            <div className="rounded-xl border border-[#bfc8ca]/10 bg-white p-8 shadow-[0_12px_24px_rgba(26,28,30,0.06)] sm:p-10">
                <div className="mb-8">
                    <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#1a1c1e]">
                        {t('title')}
                    </h1>
                    <p className="mt-2 font-sans text-[#40484a]">{t('subtitle')}</p>
                </div>

                {message ? (
                    <Alert showIcon className="mb-6" type="danger">
                        <span className="break-all">{message}</span>
                    </Alert>
                ) : null}

                <SignInForm
                    variant="stitch"
                    setMessage={setMessage}
                    onSignIn={onSignIn}
                    forgetPasswordUrl={forgetPasswordUrl}
                />

                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-[#bfc8ca]/30" />
                    </div>
                    <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest text-[#70797b]">
                        <span className="bg-white px-4">{t('orContinueWith')}</span>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="flex w-full items-center justify-center gap-3 rounded-lg border border-[#bfc8ca]/30 bg-white py-3.5 font-semibold text-[#1a1c1e] transition-all hover:border-[#bfc8ca]/60 hover:bg-park-surface-low"
                >
                    <GoogleMark />
                    Google
                </button>
            </div>

            <p className="mt-8 text-center font-sans text-[#40484a]">
                {t('noAccount')}{' '}
                <Link
                    href={signUpUrl}
                    className="font-bold text-[#276771] transition-colors hover:underline"
                >
                    {t('createAccount')}
                </Link>
            </p>
        </div>
    )
}

export default SignIn
