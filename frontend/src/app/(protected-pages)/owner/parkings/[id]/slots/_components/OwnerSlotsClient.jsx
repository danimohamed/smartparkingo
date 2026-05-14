'use client'
import { useState, useMemo } from 'react'
import {
    useOwnerSlots,
    useOwnerParkingById,
    useAddSlot,
    useUpdateSlot,
    useDeleteSlot,
} from '@/hooks/useOwner'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Skeleton from '@/components/ui/Skeleton'
import Dialog from '@/components/ui/Dialog'
import Tag from '@/components/ui/Tag'
import { FormItem, Form } from '@/components/ui/Form'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { PiPlusBold, PiPencilSimpleDuotone, PiTrashDuotone } from 'react-icons/pi'
import Link from 'next/link'

const buildSlotSchema = (tv) => z.object({
    slotNumber: z.string().min(1, tv('slotNumberRequired')),
    slotType: z.string().optional(),
    floor: z.string().optional(),
})

const statusTagColor = {
    AVAILABLE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
    OCCUPIED: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
    RESERVED: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
    MAINTENANCE: 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400',
}

const OwnerSlotsClient = ({ parkingId }) => {
    const { data: parking } = useOwnerParkingById(parkingId)
    const { data: slots = [], isLoading } = useOwnerSlots(parkingId)
    const addMutation = useAddSlot()
    const updateMutation = useUpdateSlot()
    const deleteMutation = useDeleteSlot()

    const t = useTranslations('owner.slots')
    const tDialog = useTranslations('owner.slots.dialog')
    const tDelete = useTranslations('owner.slots.delete')
    const tToast = useTranslations('owner.slots.toast')
    const tCommon = useTranslations('owner.common')
    const tValidation = useTranslations('owner.slots.validation')
    const tStatus = useTranslations('parkingLot.status')
    const tType = useTranslations('owner.slots.types')
    const slotTypeLabel = (k) => {
        try { return tType(k) } catch { return k }
    }

    const [dialogOpen, setDialogOpen] = useState(false)
    const [editing, setEditing] = useState(null)
    const [deleteConfirm, setDeleteConfirm] = useState(null)

    const slotSchema = useMemo(() => buildSlotSchema(tValidation), [tValidation])

    const { handleSubmit, formState: { errors }, control, reset } = useForm({
        resolver: zodResolver(slotSchema),
    })

    const openCreate = () => {
        setEditing(null)
        reset({ slotNumber: '', slotType: 'STANDARD', floor: '' })
        setDialogOpen(true)
    }

    const openEdit = (slot) => {
        setEditing(slot)
        reset({
            slotNumber: slot.slotNumber,
            slotType: slot.slotType || 'STANDARD',
            floor: slot.floor || '',
        })
        setDialogOpen(true)
    }

    const onSubmit = async (values) => {
        try {
            const payload = { ...values, parkingId: Number(parkingId) }
            if (editing) {
                await updateMutation.mutateAsync({ slotId: editing.id, data: payload })
                toast.push(<Notification title={tToast('updated')} type="success" />)
            } else {
                await addMutation.mutateAsync({ parkingId, data: payload })
                toast.push(<Notification title={tToast('added')} type="success" />)
            }
            setDialogOpen(false)
        } catch (err) {
            toast.push(
                <Notification title={tCommon('error')} type="danger">
                    {err?.response?.data?.message || tCommon('operationFailed')}
                </Notification>,
            )
        }
    }

    const handleDelete = async () => {
        try {
            await deleteMutation.mutateAsync(deleteConfirm.id)
            toast.push(<Notification title={tToast('deleted')} type="success" />)
            setDeleteConfirm(null)
        } catch (err) {
            toast.push(
                <Notification title={tCommon('error')} type="danger">
                    {err?.response?.data?.message || tCommon('deleteFailed')}
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
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Link href="/owner/parkings" className="text-sm text-blue-500 hover:underline">
                            {t('breadcrumb')}
                        </Link>
                        <span className="text-gray-400">/</span>
                        <span className="text-sm text-gray-500">{parking?.name || t('parkingFallback')}</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold">{t('title')}</h3>
                </div>
                <Button variant="solid" icon={<PiPlusBold />} onClick={openCreate}>
                    {t('addBtn')}
                </Button>
            </div>

            {slots.length === 0 ? (
                <Card className="p-8 text-center">
                    <p className="text-gray-500">{t('empty')}</p>
                </Card>
            ) : (
                <Card>
                    {/* Mobile card view */}
                    <div className="block md:hidden space-y-3 p-3">
                        {slots.map((s) => (
                            <div key={s.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-sm">{s.slotNumber}</span>
                                    <span className={`px-2 py-1 text-xs rounded-full ${statusTagColor[s.status] || ''}`}>{tStatus(s.status)}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                    <span>{t('rowType')} {slotTypeLabel(s.slotType)}</span>
                                    <span>{t('rowFloor')} {s.floor || '—'}</span>
                                </div>
                                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                                    <Button size="xs" variant="plain" className="min-h-[44px]" icon={<PiPencilSimpleDuotone />} onClick={() => openEdit(s)} />
                                    <Button size="xs" variant="plain" className="text-red-500 min-h-[44px]" icon={<PiTrashDuotone />} onClick={() => setDeleteConfirm(s)} />
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Desktop table view */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-500 dark:text-gray-400 border-b">
                                    <th className="p-3 font-medium">{t('columns.number')}</th>
                                    <th className="p-3 font-medium">{t('columns.type')}</th>
                                    <th className="p-3 font-medium">{t('columns.floor')}</th>
                                    <th className="p-3 font-medium">{t('columns.status')}</th>
                                    <th className="p-3 font-medium text-right">{t('columns.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {slots.map((s) => (
                                    <tr key={s.id} className="border-b last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="p-3 font-medium">{s.slotNumber}</td>
                                        <td className="p-3">{slotTypeLabel(s.slotType)}</td>
                                        <td className="p-3">{s.floor || '—'}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 text-xs rounded-full ${statusTagColor[s.status] || ''}`}>{tStatus(s.status)}</span>
                                        </td>
                                        <td className="p-3 text-right">
                                            <Button size="xs" variant="plain" icon={<PiPencilSimpleDuotone />} onClick={() => openEdit(s)} />
                                            <Button size="xs" variant="plain" className="text-red-500" icon={<PiTrashDuotone />} onClick={() => setDeleteConfirm(s)} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Create/Edit Dialog */}
            <Dialog isOpen={dialogOpen} onClose={() => setDialogOpen(false)} onRequestClose={() => setDialogOpen(false)}>
                <h5 className="mb-4 font-bold text-lg">
                    {editing ? tDialog('titleEdit') : tDialog('titleNew')}
                </h5>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <FormItem label={tDialog('slotNumber')} invalid={Boolean(errors.slotNumber)} errorMessage={errors.slotNumber?.message}>
                        <Controller name="slotNumber" control={control} render={({ field }) => <Input {...field} />} />
                    </FormItem>
                    <FormItem label={tDialog('slotType')}>
                        <Controller name="slotType" control={control} render={({ field }) => (
                            <select {...field} className="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-800">
                                <option value="STANDARD">{slotTypeLabel('STANDARD')}</option>
                                <option value="HANDICAPPED">{slotTypeLabel('HANDICAPPED')}</option>
                                <option value="ELECTRIC">{slotTypeLabel('ELECTRIC')}</option>
                                <option value="LARGE">{slotTypeLabel('LARGE')}</option>
                            </select>
                        )} />
                    </FormItem>
                    <FormItem label={tDialog('floor')}>
                        <Controller name="floor" control={control} render={({ field }) => <Input {...field} />} />
                    </FormItem>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="plain" onClick={() => setDialogOpen(false)}>{tCommon('cancel')}</Button>
                        <Button variant="solid" type="submit" loading={addMutation.isPending || updateMutation.isPending}>
                            {editing ? tDialog('updateBtn') : tDialog('addBtn')}
                        </Button>
                    </div>
                </Form>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onRequestClose={() => setDeleteConfirm(null)}>
                <h5 className="mb-4 font-bold">{tDelete('title')}</h5>
                <p>{tDelete('bodyPrefix')}<strong>{deleteConfirm?.slotNumber}</strong>{tDelete('bodySuffix')}</p>
                <div className="flex justify-end gap-2 mt-6">
                    <Button variant="plain" onClick={() => setDeleteConfirm(null)}>{tCommon('cancel')}</Button>
                    <Button variant="solid" color="red" loading={deleteMutation.isPending} onClick={handleDelete}>
                        {tCommon('delete')}
                    </Button>
                </div>
            </Dialog>
        </div>
    )
}

export default OwnerSlotsClient
