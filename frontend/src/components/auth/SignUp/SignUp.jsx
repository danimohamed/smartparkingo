'use client'
import Alert from '@/components/ui/Alert'
import SignUpForm from './SignUpForm'
import useTimeOutMessage from '@/utils/hooks/useTimeOutMessage'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

function GoogleMark() {
    return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
            <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
            />
            <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
            />
            <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
            />
            <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
            />
        </svg>
    )
}

export const SignUp = ({ onSignUp, onOauthSignUp, signInUrl = '/sign-in' }) => {
    const [message, setMessage] = useTimeOutMessage()
    const t = useTranslations('auth.signUp')
    const tCommon = useTranslations('common')

    return (
        <div className="w-full max-w-[420px] space-y-8">
            <div className="text-center lg:text-left">
                <h2 className="font-display text-3xl font-bold tracking-tight text-white">{t('title')}</h2>
                <p className="mt-2 font-sans text-[#70797b]">{t('subtitle')}</p>
            </div>

            {message ? (
                <Alert showIcon className="mb-2" type="danger">
                    <span className="break-all">{message}</span>
                </Alert>
            ) : null}

            <SignUpForm variant="stitch" onSignUp={onSignUp} setMessage={setMessage} />

            <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-[#70797b]/10" />
                <span className="mx-4 flex-shrink text-sm font-medium text-[#bfc8ca]">{tCommon('or')}</span>
                <div className="flex-grow border-t border-[#70797b]/10" />
            </div>

            <button
                type="button"
                onClick={() => onOauthSignUp?.({ type: 'google', setMessage })}
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-[#bfc8ca]/10 bg-white py-3.5 font-semibold text-[#1a1c1e] transition-all hover:bg-white/90 active:scale-[0.98]"
            >
                <GoogleMark />
                {tCommon('continueWithGoogle')}
            </button>

            <p className="pt-4 text-center font-medium text-[#bfc8ca]">
                {t('haveAccount')}
                <Link href={signInUrl} className="ml-1 font-bold text-park-gold transition-colors hover:text-white">
                    {t('signInLink')}
                </Link>
            </p>
        </div>
    )
}

export default SignUp
