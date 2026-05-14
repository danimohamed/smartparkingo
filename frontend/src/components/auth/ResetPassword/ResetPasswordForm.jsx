'use client'
import { useState } from 'react'
import Button from '@/components/ui/Button'
import { FormItem, Form } from '@/components/ui/Form'
import PasswordInput from '@/components/shared/PasswordInput'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'

const validationSchema = z
    .object({
        newPassword: z.string().min(1, 'validation.required'),
        confirmPassword: z.string().min(1, 'validation.confirmPasswordRequired'),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: 'validation.passwordMismatch',
        path: ['confirmPassword'],
    })

const ResetPasswordForm = (props) => {
    const [isSubmitting, setSubmitting] = useState(false)
    const { className, setMessage, setResetComplete, resetComplete, onResetPasswordSubmit, children } = props
    const t = useTranslations('auth.resetPassword')
    const tV = useTranslations('validation')

    const { handleSubmit, formState: { errors }, control } = useForm({
        resolver: zodResolver(validationSchema),
    })

    const resolveErr = (msg) => {
        if (!msg) return msg
        if (msg.startsWith('validation.')) {
            try { return tV(msg.replace(/^validation\./, '')) } catch { return msg }
        }
        return msg
    }

    const handleResetPassword = async (values) => {
        if (onResetPasswordSubmit) {
            onResetPasswordSubmit({ values, setSubmitting, setMessage, setResetComplete })
        }
    }

    return (
        <div className={className}>
            {!resetComplete ? (
                <Form onSubmit={handleSubmit(handleResetPassword)}>
                    <FormItem label={t('password')} invalid={Boolean(errors.newPassword)} errorMessage={resolveErr(errors.newPassword?.message)}>
                        <Controller name="newPassword" control={control} render={({ field }) => (
                            <PasswordInput autoComplete="off" placeholder="••••••••••••" {...field} />
                        )} />
                    </FormItem>
                    <FormItem label={t('confirmPassword')} invalid={Boolean(errors.confirmPassword)} errorMessage={resolveErr(errors.confirmPassword?.message)}>
                        <Controller name="confirmPassword" control={control} render={({ field }) => (
                            <PasswordInput autoComplete="off" placeholder="••••••••••••" {...field} />
                        )} />
                    </FormItem>
                    <Button block loading={isSubmitting} variant="solid" type="submit">
                        {isSubmitting ? t('submitting') : t('submit')}
                    </Button>
                </Form>
            ) : (
                <>{children}</>
            )}
        </div>
    )
}

export default ResetPasswordForm
