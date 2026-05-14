'use client'
import { useMemo, useState, useRef } from 'react'
import {
    useOwnerParkings,
    useCreateParking,
    useUpdateParking,
    useDeleteParking,
    useOwnerGuardCandidates,
    useAssignParkingGuards,
} from '@/hooks/useOwner'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Skeleton from '@/components/ui/Skeleton'
import Dialog from '@/components/ui/Dialog'
import { FormItem, Form } from '@/components/ui/Form'
import Select from '@/components/ui/Select'
import Checkbox from '@/components/ui/Checkbox'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import {
    PiPlusBold,
    PiPencilSimpleDuotone,
    PiTrashDuotone,
    PiMapPinDuotone,
    PiCarDuotone,
    PiCubeDuotone,
} from 'react-icons/pi'
import Link from 'next/link'

const buildParkingFormSchema = (tv) => z.object({
    name: z.string().min(1, tv('nameRequired')),
    address: z.string().min(1, tv('addressRequired')),
    description: z.string().optional(),
    imageUrl: z.string().optional(),
    totalSlots: z.coerce.number().optional(),
    layoutFloors: z.coerce.number().optional(),
    layoutSpotsPerFloor: z.coerce.number().optional(),
    undergroundFloors: z.boolean().optional(),
    pricePerHour: z.coerce.number().min(0.01, tv('pricePositive')),
    latitude: z.coerce.number().optional(),
    longitude: z.coerce.number().optional(),
})

const OwnerParkingsClient = () => {
    const { data: parkings = [], isLoading } = useOwnerParkings()
    const createMutation = useCreateParking()
    const updateMutation = useUpdateParking()
    const deleteMutation = useDeleteParking()
    const assignGuardsMutation = useAssignParkingGuards()

    const t = useTranslations('owner.parkings')
    const tDialog = useTranslations('owner.parkings.dialog')
    const tCommon = useTranslations('owner.common')
    const tValidation = useTranslations('owner.parkings.validation')
    const tToast = useTranslations('owner.parkings.toast')
    const tDelete = useTranslations('owner.parkings.delete')

    const [dialogOpen, setDialogOpen] = useState(false)
    const [editing, setEditing] = useState(null)
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [selectedGuards, setSelectedGuards] = useState([])
    const fileInputRef = useRef(null)

    const isEdit = Boolean(editing)

    const { data: guardCandidates = [] } = useOwnerGuardCandidates(dialogOpen)

    const guardSelectOptions = useMemo(
        () =>
            (guardCandidates || []).map((g) => ({
                value: g.id,
                label: `${g.fullName} (${g.email})`,
            })),
        [guardCandidates],
    )

    const parkingFormSchema = useMemo(() => buildParkingFormSchema(tValidation), [tValidation])

    const {
        handleSubmit,
        formState: { errors },
        control,
        reset,
        watch,
    } = useForm({
        resolver: zodResolver(parkingFormSchema),
        defaultValues: {
            undergroundFloors: false,
            layoutFloors: 3,
            layoutSpotsPerFloor: 10,
        },
    })

    const layoutFloors = watch('layoutFloors')
    const layoutSpots = watch('layoutSpotsPerFloor')
    const computedTotal =
        !isEdit && layoutFloors != null && layoutSpots != null && !Number.isNaN(+layoutFloors) && !Number.isNaN(+layoutSpots)
            ? Math.max(0, Math.floor(+layoutFloors) * Math.floor(+layoutSpots))
            : null

    const openCreate = () => {
        setEditing(null)
        setSelectedGuards([])
        reset({
            name: '',
            address: '',
            description: '',
            imageUrl: '',
            layoutFloors: 3,
            layoutSpotsPerFloor: 10,
            undergroundFloors: false,
            pricePerHour: '',
            latitude: '',
            longitude: '',
            totalSlots: undefined,
        })
        setDialogOpen(true)
    }

    const openEdit = (parking) => {
        setEditing(parking)
        const g = parking.guardians || []
        setSelectedGuards(
            g.map((x) => ({
                value: x.id,
                label: `${x.fullName} (${x.email})`,
            })),
        )
        reset({
            name: parking.name,
            address: parking.address,
            description: parking.description || '',
            imageUrl: parking.imageUrl || '',
            totalSlots: parking.totalSlots,
            pricePerHour: parking.pricePerHour,
            latitude: parking.latitude ?? '',
            longitude: parking.longitude ?? '',
            layoutFloors: undefined,
            layoutSpotsPerFloor: undefined,
            undergroundFloors: false,
        })
        setDialogOpen(true)
    }

    const handlePickImageFile = (file, onChange) => {
        if (!file) return
        const reader = new FileReader()
        reader.onload = () => {
            const url = String(reader.result || '')
            onChange(url)
        }
        reader.readAsDataURL(file)
    }

    const onDropImage = (e, onChange) => {
        e.preventDefault()
        e.stopPropagation()
        const file = e.dataTransfer?.files?.[0]
        handlePickImageFile(file, onChange)
    }

    const onSubmit = async (values) => {
        try {
            if (editing) {
                if (values.totalSlots == null || values.totalSlots < 1) {
                    toast.push(
                        <Notification title={tCommon('validation')} type="warning">
                            {tValidation('totalSlotsMin')}
                        </Notification>,
                    )
                    return
                }
                const { layoutFloors: _lf, layoutSpotsPerFloor: _ls, undergroundFloors: _ug, ...rest } = values
                await updateMutation.mutateAsync({
                    parkingId: editing.id,
                    data: {
                        name: rest.name,
                        address: rest.address,
                        description: rest.description,
                        imageUrl: values.imageUrl,
                        totalSlots: rest.totalSlots,
                        pricePerHour: rest.pricePerHour,
                        latitude: rest.latitude === '' ? undefined : rest.latitude,
                        longitude: rest.longitude === '' ? undefined : rest.longitude,
                    },
                })
                toast.push(<Notification title={tToast('updated')} type="success" />)
            } else {
                const floors = Math.floor(Number(values.layoutFloors))
                const spots = Math.floor(Number(values.layoutSpotsPerFloor))
                if (!Number.isFinite(floors) || floors < 1 || floors > 10) {
                    toast.push(
                        <Notification title={tCommon('validation')} type="warning">
                            {tValidation('floorsRange')}
                        </Notification>,
                    )
                    return
                }
                if (!Number.isFinite(spots) || spots < 1 || spots > 50) {
                    toast.push(
                        <Notification title={tCommon('validation')} type="warning">
                            {tValidation('spotsRange')}
                        </Notification>,
                    )
                    return
                }
                if (Math.ceil(spots / 10) > 5) {
                    toast.push(
                        <Notification title={tCommon('validation')} type="warning">
                            {tValidation('spots3dCap')}
                        </Notification>,
                    )
                    return
                }
                const totalSlots = floors * spots
                await createMutation.mutateAsync({
                    name: values.name,
                    address: values.address,
                    description: values.description,
                    imageUrl: values.imageUrl,
                    totalSlots,
                    layoutFloors: floors,
                    layoutSpotsPerFloor: spots,
                    undergroundFloors: Boolean(values.undergroundFloors),
                    pricePerHour: values.pricePerHour,
                    latitude: values.latitude === '' ? undefined : values.latitude,
                    longitude: values.longitude === '' ? undefined : values.longitude,
                    guardUserIds: selectedGuards.map((o) => o.value),
                })
                toast.push(<Notification title={tToast('created')} type="success" />)
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

    const onSaveGuardsOnly = async () => {
        if (!editing) return
        try {
            await assignGuardsMutation.mutateAsync({
                parkingId: editing.id,
                guardUserIds: selectedGuards.map((o) => o.value),
            })
            toast.push(<Notification title={tToast('guardiansUpdated')} type="success" />)
        } catch (err) {
            toast.push(
                <Notification title={tCommon('error')} type="danger">
                    {err?.response?.data?.message || tToast('guardiansFailed')}
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
                {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} height={100} />
                ))}
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h3 className="text-xl sm:text-2xl font-bold">{t('title')}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-base">
                        {t('subtitle')}
                    </p>
                </div>
                <Button variant="solid" icon={<PiPlusBold />} onClick={openCreate}>
                    {t('addBtn')}
                </Button>
            </div>

            {parkings.length === 0 ? (
                <Card className="p-8 text-center">
                    <PiCarDuotone className="text-4xl text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">{t('empty')}</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {parkings.map((p) => (
                        <Card key={p.id} className="p-4">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h5 className="font-bold text-lg">{p.name}</h5>
                                    <p className="text-sm text-gray-500 flex items-center gap-1">
                                        <PiMapPinDuotone /> {p.address}
                                    </p>
                                </div>
                                <span
                                    className={`px-2 py-1 text-xs rounded-full ${
                                        p.active
                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                                            : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                                    }`}
                                >
                                    {p.active ? t('active') : t('inactive')}
                                </span>
                            </div>
                            <div className="text-sm space-y-1 mb-4">
                                <p>
                                    {t('totalSlots')} <strong>{p.totalSlots}</strong>
                                </p>
                                <p>
                                    {t('available')} <strong>{p.availableSlots}</strong>
                                </p>
                                <p>
                                    {t('price')} <strong>{p.pricePerHour} {tCommon('perHourMad')}</strong>
                                </p>
                                {p.guardians?.length ? (
                                    <p className="text-gray-600 dark:text-gray-300">
                                        {t('guardians')}{' '}
                                        <strong>{p.guardians.map((g) => g.fullName).join(', ')}</strong>
                                    </p>
                                ) : null}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Link href={`/parkings/${p.id}/3d-twin`} className="flex-1 min-w-[7rem]">
                                    <Button block size="sm" variant="solid" icon={<PiCubeDuotone />}>
                                        {t('btn3DTwin')}
                                    </Button>
                                </Link>
                                <Link href={`/owner/parkings/${p.id}/slots`} className="flex-1 min-w-[7rem]">
                                    <Button block size="sm" variant="twoTone">
                                        {t('btnSlots')}
                                    </Button>
                                </Link>
                                <Button
                                    size="sm"
                                    variant="plain"
                                    icon={<PiPencilSimpleDuotone />}
                                    onClick={() => openEdit(p)}
                                />
                                <Button
                                    size="sm"
                                    variant="plain"
                                    className="text-red-500"
                                    icon={<PiTrashDuotone />}
                                    onClick={() => setDeleteConfirm(p)}
                                />
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog
                isOpen={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onRequestClose={() => setDialogOpen(false)}
            >
                <h5 className="mb-4 font-bold text-lg">{editing ? tDialog('titleEdit') : tDialog('titleNew')}</h5>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <FormItem label={tDialog('name')} invalid={Boolean(errors.name)} errorMessage={errors.name?.message}>
                        <Controller name="name" control={control} render={({ field }) => <Input {...field} />} />
                    </FormItem>
                    <FormItem label={tDialog('address')} invalid={Boolean(errors.address)} errorMessage={errors.address?.message}>
                        <Controller name="address" control={control} render={({ field }) => <Input {...field} />} />
                    </FormItem>
                    <FormItem label={tDialog('description')}>
                        <Controller name="description" control={control} render={({ field }) => <Input {...field} />} />
                    </FormItem>

                    <FormItem label={tDialog('picture')}>
                        <Controller
                            name="imageUrl"
                            control={control}
                            render={({ field }) => (
                                <div className="flex flex-col gap-2">
                                    <Input
                                        placeholder={tDialog('imagePlaceholder')}
                                        value={field.value || ''}
                                        onChange={(e) => field.onChange(e.target.value)}
                                    />
                                    <div
                                        className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-3 flex items-center justify-between gap-3 bg-gray-50/60 dark:bg-gray-800/30"
                                        onDragOver={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                        }}
                                        onDrop={(e) => onDropImage(e, field.onChange)}
                                    >
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                                                {tDialog('dragDrop')}
                                            </p>
                                            <p className="text-[11px] text-gray-400">
                                                {tDialog('orClickUpload')}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => handlePickImageFile(e.target.files?.[0], field.onChange)}
                                            />
                                            <Button
                                                type="button"
                                                size="xs"
                                                variant="twoTone"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                {tDialog('uploadBtn')}
                                            </Button>
                                            {field.value ? (
                                                <img
                                                    src={field.value}
                                                    alt={tDialog('imagePreviewAlt')}
                                                    className="h-16 w-28 rounded-xl object-cover border border-gray-200 dark:border-gray-700"
                                                />
                                            ) : (
                                                <span className="text-xs text-gray-400">{tDialog('noImage')}</span>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-gray-400">
                                        {tDialog('imageTip')}
                                    </p>
                                </div>
                            )}
                        />
                    </FormItem>

                    {editing ? (
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <FormItem
                                label={tDialog('totalSlotsLabel')}
                                invalid={Boolean(errors.totalSlots)}
                                errorMessage={errors.totalSlots?.message}
                            >
                                <Controller
                                    name="totalSlots"
                                    control={control}
                                    render={({ field }) => <Input type="number" {...field} />}
                                />
                            </FormItem>
                            <FormItem
                                label={tDialog('pricePerHour')}
                                invalid={Boolean(errors.pricePerHour)}
                                errorMessage={errors.pricePerHour?.message}
                            >
                                <Controller
                                    name="pricePerHour"
                                    control={control}
                                    render={({ field }) => <Input type="number" step="0.01" {...field} />}
                                />
                            </FormItem>
                        </div>
                    ) : (
                        <>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                {tDialog('layoutHelp')}
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                <FormItem label={tDialog('floors')}>
                                    <Controller name="layoutFloors" control={control} render={({ field }) => <Input type="number" {...field} />} />
                                </FormItem>
                                <FormItem label={tDialog('spotsPerFloor')}>
                                    <Controller
                                        name="layoutSpotsPerFloor"
                                        control={control}
                                        render={({ field }) => <Input type="number" {...field} />}
                                    />
                                </FormItem>
                            </div>
                            {computedTotal != null ? (
                                <p className="text-sm mb-3">
                                    {tDialog('computedTotal', { n: computedTotal })}
                                </p>
                            ) : null}
                            <div className="mb-4">
                                <Controller
                                    name="undergroundFloors"
                                    control={control}
                                    render={({ field }) => (
                                        <Checkbox checked={Boolean(field.value)} onChange={(checked) => field.onChange(checked)}>
                                            {tDialog('underground')}
                                        </Checkbox>
                                    )}
                                />
                            </div>
                            <FormItem
                                label={tDialog('pricePerHour')}
                                invalid={Boolean(errors.pricePerHour)}
                                errorMessage={errors.pricePerHour?.message}
                            >
                                <Controller
                                    name="pricePerHour"
                                    control={control}
                                    render={({ field }) => <Input type="number" step="0.01" {...field} />}
                                />
                            </FormItem>
                        </>
                    )}

                    <div className="grid grid-cols-2 gap-4 mt-2">
                        <FormItem label={tDialog('latitude')}>
                            <Controller name="latitude" control={control} render={({ field }) => <Input type="number" step="any" {...field} />} />
                        </FormItem>
                        <FormItem label={tDialog('longitude')}>
                            <Controller name="longitude" control={control} render={({ field }) => <Input type="number" step="any" {...field} />} />
                        </FormItem>
                    </div>

                    <FormItem label={tDialog('guardiansLabel')} className="mt-2">
                        <Select
                            isMulti
                            options={guardSelectOptions}
                            value={selectedGuards}
                            onChange={setSelectedGuards}
                            placeholder={tDialog('guardiansPlaceholder')}
                        />
                    </FormItem>
                    {editing ? (
                        <div className="mb-4">
                            <Button
                                type="button"
                                size="sm"
                                variant="twoTone"
                                loading={assignGuardsMutation.isPending}
                                onClick={onSaveGuardsOnly}
                            >
                                {tDialog('saveGuardians')}
                            </Button>
                        </div>
                    ) : null}

                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="plain" type="button" onClick={() => setDialogOpen(false)}>
                            {tCommon('cancel')}
                        </Button>
                        <Button
                            variant="solid"
                            type="submit"
                            loading={createMutation.isPending || updateMutation.isPending}
                        >
                            {editing ? tDialog('updateBtn') : tDialog('createBtn')}
                        </Button>
                    </div>
                </Form>
            </Dialog>

            <Dialog
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onRequestClose={() => setDeleteConfirm(null)}
            >
                <h5 className="mb-4 font-bold">{tDelete('title')}</h5>
                <p>
                    {tDelete('bodyPrefix')}<strong>{deleteConfirm?.name}</strong>{tDelete('bodySuffix')}
                </p>
                <div className="flex justify-end gap-2 mt-6">
                    <Button variant="plain" onClick={() => setDeleteConfirm(null)}>
                        {tCommon('cancel')}
                    </Button>
                    <Button variant="solid" color="red" loading={deleteMutation.isPending} onClick={handleDelete}>
                        {tDelete('confirm')}
                    </Button>
                </div>
            </Dialog>
        </div>
    )
}

export default OwnerParkingsClient
