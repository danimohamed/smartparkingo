'use client'
import { useState } from 'react'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import ActionLink from '@/components/shared/ActionLink'
import ResetPasswordForm from './ResetPasswordForm'
import useTimeOutMessage from '@/utils/hooks/useTimeOutMessage'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

export const ResetPassword = ({
    signInUrl = '/sign-in',
    onResetPasswordSubmit,
}) => {
    const [resetComplete, setResetComplete] = useState(false)
    const [message, setMessage] = useTimeOutMessage()
    const router = useRouter()
    const t = useTranslations('auth.resetPassword')

    const handleContinue = () => router.push(signInUrl)

    return (
        <div>
            <div className="mb-6">
                {resetComplete ? (
                    <>
                        <h3 className="mb-1 text-xl sm:text-2xl">
                            {t('doneTitle')}
                        </h3>
                        <p className="font-semibold heading-text text-sm sm:text-base">
                            {t('doneSubtitle')}
                        </p>
                    </>
                ) : (
                    <>
                        <h3 className="mb-1 text-xl sm:text-2xl">
                            {t('title')}
                        </h3>
                        <p className="font-semibold heading-text text-sm sm:text-base">
                            {t('subtitle')}
                        </p>
                    </>
                )}
            </div>
            {message && (
                <Alert showIcon className="mb-4" type="danger">
                    <span className="break-all">{message}</span>
                </Alert>
            )}
            <ResetPasswordForm
                resetComplete={resetComplete}
                setMessage={setMessage}
                setResetComplete={setResetComplete}
                onResetPasswordSubmit={onResetPasswordSubmit}
            >
                <Button
                    block
                    variant="solid"
                    type="button"
                    onClick={handleContinue}
                >
                    {t('continue')}
                </Button>
            </ResetPasswordForm>
            <div className="mt-4 text-center">
                <span>{t('backTo')} </span>
                <ActionLink
                    href={signInUrl}
                    className="heading-text font-bold"
                    themeColor={false}
                >
                    {t('signInLink')}
                </ActionLink>
            </div>
        </div>
    )
}

export default ResetPassword
