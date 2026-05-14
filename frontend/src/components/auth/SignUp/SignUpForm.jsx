'use client'
import { useState } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { FormItem, Form } from '@/components/ui/Form'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi'
import { useTranslations } from 'next-intl'

export const signUpValidationSchema = z
    .object({
        fullName: z.string().min(2, { message: 'validation.fullNameMin' }),
        email: z.email({ message: 'validation.email' }),
        phone: z.string().optional(),
        role: z.string().default('USER'),
        password: z.string().min(8, { message: 'validation.passwordMin' }),
        confirmPassword: z.string().min(1, { message: 'validation.confirmPasswordRequired' }),
        terms: z.boolean().optional(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'validation.passwordMismatch',
        path: ['confirmPassword'],
    })
    .refine((data) => data.terms === true, {
        message: 'validation.termsRequired',
        path: ['terms'],
    })

const SignUpForm = (props) => {
    const { onSignUp, className, setMessage, variant = 'default' } = props
    const [isSubmitting, setSubmitting] = useState(false)
    const [pwVisible, setPwVisible] = useState(false)
    const t = useTranslations('auth.signUp')
    const tV = useTranslations('validation')

    const {
        handleSubmit,
        formState: { errors },
        control,
    } = useForm({
        defaultValues: {
            fullName: '',
            email: '',
            phone: '',
            role: 'USER',
            password: '',
            confirmPassword: '',
            terms: false,
        },
        resolver: zodResolver(signUpValidationSchema),
    })

    const handleSignUp = async (values) => {
        if (onSignUp) {
            onSignUp({ values, setSubmitting, setMessage })
        }
    }

    // Resolve a Zod error message key → localized string
    const resolveErr = (msg) => {
        if (!msg) return msg
        if (msg.startsWith('validation.')) {
            try { return tV(msg.replace(/^validation\./, '')) } catch { return msg }
        }
        return msg
    }

    if (variant === 'stitch') {
        const input =
            'w-full rounded-lg border-none bg-[#e8e8ea] px-4 py-3.5 text-[#1a1c1e] placeholder:text-[#70797b]/70 transition-all focus:outline-none focus:ring-2 focus:ring-[#276771]/30'

        const pillBase =
            'flex-1 rounded-lg px-4 py-2 text-sm transition-all'

        return (
            <div className={className}>
                {/* Role segmented control */}
                <Controller
                    name="role"
                    control={control}
                    render={({ field }) => (
                        <div className="flex items-center gap-1 rounded-xl bg-[#eeeef0] p-1">
                            { [
                                { value: 'USER', label: t('roleDriver') },
                                { value: 'PARKING_OWNER', label: t('roleOwner') },
                                { value: 'GUARD', label: t('roleGuard') },
                            ].map((opt) => {
                                const active = field.value === opt.value
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => field.onChange(opt.value)}
                                        className={[
                                            pillBase,
                                            active
                                                ? 'bg-white text-park-teal shadow-sm font-semibold'
                                                : 'text-[#70797b] hover:text-white/90',
                                        ].join(' ')}
                                    >
                                        {opt.label}
                                    </button>
                                )
                            })}
                        </div>
                    )}
                />

                <form className="mt-6 space-y-5" onSubmit={handleSubmit(handleSignUp)} noValidate>
                    {/* Full Name */}
                    <div className="space-y-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#bfc8ca]">
                            {t('fullName')}
                        </label>
                        <Controller
                            name="fullName"
                            control={control}
                            render={({ field }) => (
                                <input {...field} className={input} placeholder={t('fullNamePlaceholder')} type="text" autoComplete="name" />
                            )}
                        />
                        {errors.fullName?.message && (
                            <p className="text-sm text-red-500">{resolveErr(errors.fullName.message)}</p>
                        )}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#bfc8ca]">
                            {t('email')}
                        </label>
                        <Controller
                            name="email"
                            control={control}
                            render={({ field }) => (
                                <input
                                    {...field}
                                    className={input}
                                    placeholder={t('emailPlaceholder')}
                                    type="email"
                                    autoComplete="email"
                                />
                            )}
                        />
                        {errors.email?.message && (
                            <p className="text-sm text-red-500">{resolveErr(errors.email.message)}</p>
                        )}
                    </div>

                    {/* Password + Confirm */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[#bfc8ca]">
                                {t('password')}
                            </label>
                            <div className="relative">
                                <Controller
                                    name="password"
                                    control={control}
                                    render={({ field }) => (
                                        <input
                                            {...field}
                                            className={`${input} pr-12`}
                                            placeholder={t('passwordPlaceholder')}
                                            type={pwVisible ? 'text' : 'password'}
                                            autoComplete="new-password"
                                        />
                                    )}
                                />
                                <button
                                    type="button"
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#70797b] hover:text-white"
                                    onClick={() => setPwVisible((v) => !v)}
                                    aria-label={pwVisible ? t('hidePassword') : t('showPassword')}
                                >
                                    {pwVisible ? <HiOutlineEyeOff className="h-5 w-5" /> : <HiOutlineEye className="h-5 w-5" />}
                                </button>
                            </div>
                            {errors.password?.message && (
                                <p className="text-sm text-red-500">{resolveErr(errors.password.message)}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[#bfc8ca]">
                                {t('confirm')}
                            </label>
                            <Controller
                                name="confirmPassword"
                                control={control}
                                render={({ field }) => (
                                    <input
                                        {...field}
                                        className={input}
                                        placeholder={t('confirmPlaceholder')}
                                        type="password"
                                        autoComplete="new-password"
                                    />
                                )}
                            />
                            {errors.confirmPassword?.message && (
                                <p className="text-sm text-red-500">{resolveErr(errors.confirmPassword.message)}</p>
                            )}
                        </div>
                    </div>

                    {/* Terms */}
                    <div className="flex items-start gap-3 py-2">
                        <div className="pt-0.5">
                            <Controller
                                name="terms"
                                control={control}
                                render={({ field }) => (
                                    <input
                                        id="terms"
                                        type="checkbox"
                                        checked={!!field.value}
                                        onChange={(e) => field.onChange(e.target.checked)}
                                        className="h-5 w-5 cursor-pointer rounded bg-[#e8e8ea] text-[#276771] focus:ring-0"
                                    />
                                )}
                            />
                        </div>
                        <label className="text-sm leading-relaxed text-[#bfc8ca]" htmlFor="terms">
                            {t('termsPrefix')}{' '}
                            <span className="font-medium text-[#94d0dc]">{t('termsLink')}</span> {t('and')}{' '}
                            <span className="font-medium text-[#94d0dc]">{t('privacyLink')}</span>.
                        </label>
                    </div>
                    {errors.terms?.message && (
                        <p className="-mt-3 text-sm text-red-500">{resolveErr(errors.terms.message)}</p>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="mt-4 w-full rounded-lg bg-gradient-to-r from-park-teal to-park-teal-mid py-4 font-display text-lg font-bold text-white shadow-lg shadow-park-teal/20 transition-all active:scale-[0.98] disabled:opacity-70"
                    >
                        {isSubmitting ? t('submitting') : t('submit')}
                    </button>
                </form>
            </div>
        )
    }

    // Default variant
    return (
        <div className={className}>
            <Form onSubmit={handleSubmit(handleSignUp)}>
                <FormItem label={t('fullName')} invalid={Boolean(errors.fullName)} errorMessage={resolveErr(errors.fullName?.message)}>
                    <Controller
                        name="fullName"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="text"
                                placeholder={t('fullNamePlaceholder')}
                                autoComplete="off"
                                {...field}
                            />
                        )}
                    />
                </FormItem>
                <FormItem label={t('email')} invalid={Boolean(errors.email)} errorMessage={resolveErr(errors.email?.message)}>
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
                <FormItem label={t('phone')} invalid={Boolean(errors.phone)} errorMessage={resolveErr(errors.phone?.message)}>
                    <Controller
                        name="phone"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="text"
                                placeholder={t('phonePlaceholder')}
                                autoComplete="off"
                                {...field}
                            />
                        )}
                    />
                </FormItem>
                <FormItem label={t('iWantTo')}>
                    <Controller
                        name="role"
                        control={control}
                        defaultValue="USER"
                        render={({ field }) => (
                            <select
                                {...field}
                                className="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-800 bg-white"
                            >
                                <option value="USER">{t('roleDriverFull')}</option>
                                <option value="PARKING_OWNER">{t('roleOwnerFull')}</option>
                                <option value="GUARD">{t('roleGuardFull')}</option>
                            </select>
                        )}
                    />
                </FormItem>
                <FormItem label={t('password')} invalid={Boolean(errors.password)} errorMessage={resolveErr(errors.password?.message)}>
                    <Controller
                        name="password"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="password"
                                autoComplete="off"
                                placeholder={t('passwordPlaceholder')}
                                {...field}
                            />
                        )}
                    />
                </FormItem>
                <FormItem label={t('confirmPassword')} invalid={Boolean(errors.confirmPassword)} errorMessage={resolveErr(errors.confirmPassword?.message)}>
                    <Controller
                        name="confirmPassword"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="password"
                                autoComplete="off"
                                placeholder={t('confirmPlaceholder')}
                                {...field}
                            />
                        )}
                    />
                </FormItem>
                <Button block loading={isSubmitting} variant="solid" type="submit">
                    {isSubmitting ? t('submitting') : t('submit')}
                </Button>
            </Form>
        </div>
    )
}

export default SignUpForm
