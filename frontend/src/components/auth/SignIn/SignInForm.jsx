'use client'
import { useState } from 'react'
import Link from 'next/link'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { FormItem, Form } from '@/components/ui/Form'
import PasswordInput from '@/components/shared/PasswordInput'
import classNames from '@/utils/classNames'
import { HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi'
import { useTranslations } from 'next-intl'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// Validation schema kept locale-agnostic — error messages are resolved at
// render time so they live in the translation bundle.
export const signInValidationSchema = z.object({
    email: z.string().min(1, { message: 'validation.required' }),
    password: z.string().min(1, { message: 'validation.required' }),
})

const validationSchema = signInValidationSchema

const stitchInput =
    'w-full rounded-lg border-none bg-park-surface-high px-4 py-3 font-sans text-[#1a1c1e] placeholder:text-[#70797b] transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#276771]/30'

const SignInForm = (props) => {
    const [isSubmitting, setSubmitting] = useState(false)
    const [pwVisible, setPwVisible] = useState(false)
    const t = useTranslations('auth.signIn')
    const tValidation = useTranslations('validation')

    const {
        className,
        setMessage,
        onSignIn,
        passwordHint,
        variant = 'default',
        forgetPasswordUrl = '/forgot-password',
    } = props

    const {
        handleSubmit,
        formState: { errors },
        control,
    } = useForm({
        defaultValues: {
            email: '',
            password: '',
        },
        resolver: zodResolver(validationSchema),
    })

    const handleSignIn = async (values) => {
        if (onSignIn) {
            onSignIn({ values, setSubmitting, setMessage })
        }
    }

    // Resolve a Zod error message — supports either an i18n key or a literal.
    const resolveErr = (msg) => {
        if (!msg) return msg
        if (msg.startsWith('validation.')) {
            try { return tValidation(msg.replace(/^validation\./, '')) } catch { return msg }
        }
        return msg
    }

    if (variant === 'stitch') {
        return (
            <div className={className}>
                <form className="space-y-6" onSubmit={handleSubmit(handleSignIn)} noValidate>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-[#40484a]" htmlFor="sign-in-email">
                            {t('email')}
                        </label>
                        <Controller
                            name="email"
                            control={control}
                            render={({ field }) => (
                                <input
                                    {...field}
                                    id="sign-in-email"
                                    type="email"
                                    autoComplete="email"
                                    placeholder={t('emailPlaceholder')}
                                    className={stitchInput}
                                />
                            )}
                        />
                        {errors.email?.message ? (
                            <p className="text-sm text-red-600">{resolveErr(errors.email.message)}</p>
                        ) : null}
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                            <label className="block text-sm font-medium text-[#40484a]" htmlFor="sign-in-password">
                                {t('password')}
                            </label>
                            <Link
                                href={forgetPasswordUrl}
                                className="text-sm font-semibold text-[#276771] transition-colors hover:text-park-teal"
                            >
                                {t('forgotPassword')}
                            </Link>
                        </div>
                        <div className="relative">
                            <Controller
                                name="password"
                                control={control}
                                render={({ field }) => (
                                    <input
                                        {...field}
                                        id="sign-in-password"
                                        type={pwVisible ? 'text' : 'password'}
                                        autoComplete="current-password"
                                        placeholder={t('passwordPlaceholder')}
                                        className={`${stitchInput} pr-12`}
                                    />
                                )}
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#70797b] transition-colors hover:text-[#40484a]"
                                onClick={() => setPwVisible((v) => !v)}
                                aria-label={pwVisible ? t('password') : t('password')}
                            >
                                {pwVisible ? (
                                    <HiOutlineEyeOff className="h-5 w-5" />
                                ) : (
                                    <HiOutlineEye className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                        {errors.password?.message ? (
                            <p className="text-sm text-red-600">{resolveErr(errors.password.message)}</p>
                        ) : null}
                    </div>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded-lg bg-gradient-to-br from-park-teal to-park-teal-mid py-4 font-display font-bold text-white shadow-lg shadow-park-teal/10 transition-all hover:shadow-xl hover:scale-[1.01] active:scale-[0.98] disabled:opacity-70"
                    >
                        {isSubmitting ? t('submitting') : t('submit')}
                    </button>
                </form>
            </div>
        )
    }

    return (
        <div className={className}>
            <Form onSubmit={handleSubmit(handleSignIn)}>
                <FormItem
                    label={t('email')}
                    invalid={Boolean(errors.email)}
                    errorMessage={resolveErr(errors.email?.message)}
                >
                    <Controller
                        name="email"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="email"
                                placeholder={t('emailPlaceholder')}
                                autoComplete="off"
                                {...field}
                            />
                        )}
                    />
                </FormItem>
                <FormItem
                    label={t('password')}
                    invalid={Boolean(errors.password)}
                    errorMessage={resolveErr(errors.password?.message)}
                    className={classNames(
                        passwordHint ? 'mb-0' : '',
                        errors.password?.message ? 'mb-8' : '',
                    )}
                >
                    <Controller
                        name="password"
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                            <PasswordInput
                                type="text"
                                placeholder={t('passwordPlaceholder')}
                                autoComplete="off"
                                {...field}
                            />
                        )}
                    />
                </FormItem>
                {passwordHint}
                <Button
                    block
                    loading={isSubmitting}
                    variant="solid"
                    type="submit"
                >
                    {isSubmitting ? t('submitting') : t('submit')}
                </Button>
            </Form>
        </div>
    )
}

export default SignInForm
