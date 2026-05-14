'use client'
import { useState, useMemo } from 'react'
import { useOwnerWithdrawals, useRequestWithdrawal, useOwnerEarnings } from '@/hooks/useOwner'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Skeleton from '@/components/ui/Skeleton'
import Dialog from '@/components/ui/Dialog'
import { FormItem, Form } from '@/components/ui/Form'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import dayjs from 'dayjs'
import { PiPlusBold } from 'react-icons/pi'

const buildWithdrawSchema = (tv) => z.object({
    amount: z.coerce.number().min(1, tv('amountMin')),
})

const statusColor = {
    PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
    APPROVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
    REJECTED: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
}

const OwnerWithdrawalsClient = () => {
    const { data: withdrawals = [], isLoading } = useOwnerWithdrawals()
    const { data: earnings } = useOwnerEarnings()
    const requestMutation = useRequestWithdrawal()
    const [dialogOpen, setDialogOpen] = useState(false)
    const t = useTranslations('owner.withdrawals')
    const tDialog = useTranslations('owner.withdrawals.dialog')
    const tStatus = useTranslations('owner.withdrawals.status')
    const tToast = useTranslations('owner.withdrawals.toast')
    const tCommon = useTranslations('owner.common')
    const tValidation = useTranslations('owner.withdrawals.validation')

    const withdrawSchema = useMemo(() => buildWithdrawSchema(tValidation), [tValidation])

    const { handleSubmit, formState: { errors }, control, reset } = useForm({
        resolver: zodResolver(withdrawSchema),
    })

    const onSubmit = async (values) => {
        try {
            await requestMutation.mutateAsync(values)
            toast.push(<Notification title={tToast('requested')} type="success" />)
            setDialogOpen(false)
            reset()
        } catch (err) {
            toast.push(
                <Notification title={tCommon('error')} type="danger">
                    {err?.response?.data?.message || tToast('failed')}
                </Notification>,
            )
        }
    }

    if (isLoading) {
        return (
            <div className="flex flex-col gap-4">
                <Skeleton width={280} height={32} />
                <Skeleton height={300} />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h3 className="text-xl sm:text-2xl font-bold">{t('title')}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-base">
                        {t('availableBalancePrefix')}
                        <strong>{(earnings?.totalEarnings ?? 0).toFixed(2)} MAD</strong>
                    </p>
                </div>
                <Button
                    variant="solid"
                    icon={<PiPlusBold />}
                    onClick={() => {
                        reset({ amount: '' })
                        setDialogOpen(true)
                    }}
                >
                    {t('requestBtn')}
                </Button>
            </div>

            <Card>
                {withdrawals.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">{t('empty')}</div>
                ) : (
                    <>
                        {/* Mobile card view */}
                        <div className="block md:hidden space-y-3 p-3">
                            {withdrawals.map((w) => (
                                <div key={w.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-mono text-sm text-primary">WDR-{String(w.id).padStart(5, '0')}</span>
                                        <span className={`px-2 py-1 text-xs rounded-full ${statusColor[w.status] || ''}`}>{tStatus(w.status)}</span>
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                                        <span className="font-bold text-sm">{w.amount?.toFixed(2)} MAD</span>
                                        <span className="text-xs text-gray-400">{dayjs(w.createdAt).format('DD/MM/YYYY HH:mm')}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* Desktop table view */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-gray-500 dark:text-gray-400 border-b">
                                        <th className="p-3 font-medium">{t('columns.ref')}</th>
                                        <th className="p-3 font-medium">{t('columns.amount')}</th>
                                        <th className="p-3 font-medium">{t('columns.status')}</th>
                                        <th className="p-3 font-medium">{t('columns.date')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {withdrawals.map((w) => (
                                        <tr key={w.id} className="border-b last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <td className="p-3 font-mono text-sm text-primary">WDR-{String(w.id).padStart(5, '0')}</td>
                                            <td className="p-3 font-medium">{w.amount?.toFixed(2)} MAD</td>
                                            <td className="p-3">
                                                <span className={`px-2 py-1 text-xs rounded-full ${statusColor[w.status] || ''}`}>{tStatus(w.status)}</span>
                                            </td>
                                            <td className="p-3">{dayjs(w.createdAt).format('DD/MM/YYYY HH:mm')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </Card>

            {/* Request Dialog */}
            <Dialog
                isOpen={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onRequestClose={() => setDialogOpen(false)}
            >
                <h5 className="mb-4 font-bold text-lg">{tDialog('title')}</h5>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <FormItem
                        label={tDialog('amountLabel')}
                        invalid={Boolean(errors.amount)}
                        errorMessage={errors.amount?.message}
                    >
                        <Controller
                            name="amount"
                            control={control}
                            render={({ field }) => (
                                <Input type="number" step="0.01" placeholder={tDialog('amountPlaceholder')} {...field} />
                            )}
                        />
                    </FormItem>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="plain" onClick={() => setDialogOpen(false)}>
                            {tCommon('cancel')}
                        </Button>
                        <Button
                            variant="solid"
                            type="submit"
                            loading={requestMutation.isPending}
                        >
                            {tCommon('submit')}
                        </Button>
                    </div>
                </Form>
            </Dialog>
        </div>
    )
}

export default OwnerWithdrawalsClient
