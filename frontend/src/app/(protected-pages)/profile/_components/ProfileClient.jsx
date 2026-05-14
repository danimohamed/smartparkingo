'use client'

import { useState, useMemo, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Avatar from '@/components/ui/Avatar'
import Notification from '@/components/ui/Notification'
import Skeleton from '@/components/ui/Skeleton'
import Tag from '@/components/ui/Tag'
import Dialog from '@/components/ui/Dialog'
import toast from '@/components/ui/toast'
import { useUserProfile, useUpdateProfile, useChangePassword, useUpdateDefaultVehiclePlate } from '@/hooks/useUserProfile'
import { useTranslations } from 'next-intl'
import {
    PiUserDuotone,
    PiEnvelopeDuotone,
    PiPhoneDuotone,
    PiShieldCheckDuotone,
    PiCalendarDuotone,
    PiPencilSimpleDuotone,
    PiFloppyDiskDuotone,
    PiXCircleDuotone,
    PiLockKeyDuotone,
    PiCheckCircleDuotone,
    PiWarningDuotone,
    PiEyeDuotone,
    PiEyeSlashDuotone,
    PiCarDuotone,
} from 'react-icons/pi'
import dayjs from 'dayjs'

// ─── Role Badge ──────────────────────────────────────────
const roleBadgeConfig = {
    USER: { bg: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-600 dark:text-blue-400' },
    ADMIN: { bg: 'bg-red-100 dark:bg-red-500/20', text: 'text-red-600 dark:text-red-400' },
    PARKING_OWNER: { bg: 'bg-amber-100 dark:bg-amber-500/20', text: 'text-amber-600 dark:text-amber-400' },
}

const RoleBadge = ({ role, t }) => {
    const config = roleBadgeConfig[role] || roleBadgeConfig.USER
    return (
        <Tag className={`${config.bg} ${config.text} border-0 font-semibold rounded-lg`}>
            {t(`roles.${role}`) || role}
        </Tag>
    )
}

// ─── Profile Completion Bar ──────────────────────────────
const ProfileCompletion = ({ user, t }) => {
    const completion = useMemo(() => {
        if (!user) return 0
        let score = 0
        if (user.fullName) score += 34
        if (user.email) score += 33
        if (user.phone) score += 33
        return score
    }, [user])

    return (
        <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('completion')}</span>
                <span className="text-sm font-bold text-primary">{completion}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${completion}%` }}
                />
            </div>
        </div>
    )
}

// ─── Skeleton Loader ─────────────────────────────────────
const ProfileSkeleton = () => (
    <div className="max-w-4xl mx-auto space-y-6">
        <Card>
            <div className="flex flex-col sm:flex-row items-center gap-6 p-2">
                <Skeleton variant="circle" width={96} height={96} />
                <div className="flex-1 space-y-3 w-full">
                    <Skeleton width="60%" height={24} />
                    <Skeleton width="40%" height={16} />
                    <Skeleton width="30%" height={16} />
                </div>
            </div>
        </Card>
        <Card>
            <div className="space-y-4 p-2">
                <Skeleton width="30%" height={20} />
                <Skeleton width="100%" height={40} />
                <Skeleton width="100%" height={40} />
                <Skeleton width="100%" height={40} />
            </div>
        </Card>
    </div>
)

// ─── Info Row ────────────────────────────────────────────
const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="text-lg text-primary" />
        </div>
        <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">{label}</p>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{value || '—'}</p>
        </div>
    </div>
)

// ─── Main Component ──────────────────────────────────────
const ProfileClient = () => {
    const { data: user, isLoading, isError } = useUserProfile()
    const updateProfile = useUpdateProfile()
    const updateDefaultVehiclePlate = useUpdateDefaultVehiclePlate()
    const changePassword = useChangePassword()
    const t = useTranslations('profile')

    // Edit mode state
    const [editing, setEditing] = useState(false)
    const [fullName, setFullName] = useState('')
    const [phone, setPhone] = useState('')
    const [formErrors, setFormErrors] = useState({})

    // Password dialog state
    const [showPasswordDialog, setShowPasswordDialog] = useState(false)
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [passwordErrors, setPasswordErrors] = useState({})
    const [showCurrentPw, setShowCurrentPw] = useState(false)
    const [showNewPw, setShowNewPw] = useState(false)
    const [showConfirmPw, setShowConfirmPw] = useState(false)

    const [defaultVehiclePlateLocal, setDefaultVehiclePlateLocal] = useState('')

    useEffect(() => {
        if (user?.defaultVehiclePlate != null) {
            setDefaultVehiclePlateLocal(user.defaultVehiclePlate)
        } else {
            setDefaultVehiclePlateLocal('')
        }
    }, [user?.defaultVehiclePlate])

    // ── Enter edit mode ──
    const handleStartEdit = () => {
        setFullName(user?.fullName || '')
        setPhone(user?.phone || '')
        setFormErrors({})
        setEditing(true)
    }

    // ── Cancel edit ──
    const handleCancelEdit = () => {
        setEditing(false)
        setFormErrors({})
    }

    // ── Validate profile form ──
    const validateProfileForm = () => {
        const errors = {}
        if (!fullName.trim()) errors.fullName = t('validation.fullNameRequired')
        else if (fullName.trim().length < 2) errors.fullName = t('validation.fullNameMin')
        if (phone && phone.length > 20) errors.phone = t('validation.phoneMax')
        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }

    // ── Save profile ──
    const handleSaveProfile = async () => {
        if (!validateProfileForm()) return
        try {
            await updateProfile.mutateAsync({ fullName: fullName.trim(), phone: phone.trim() || null })
            toast.push(
                <Notification type="success" title={t('toast.updateSuccessTitle')} duration={3000}>
                    {t('toast.updateSuccessMsg')}
                </Notification>
            )
            setEditing(false)
        } catch (err) {
            toast.push(
                <Notification type="danger" title={t('toast.updateFailedTitle')} duration={4000}>
                    {err?.response?.data?.message || t('toast.updateFailedDefault')}
                </Notification>
            )
        }
    }

    const handleSaveDefaultVehiclePlate = async () => {
        try {
            await updateDefaultVehiclePlate.mutateAsync({
                defaultVehiclePlate: defaultVehiclePlateLocal.trim(),
            })
            toast.push(
                <Notification type="success" title={t('vehicle.toastSavedTitle')} duration={3000}>
                    {t('vehicle.toastSavedMsg')}
                </Notification>,
            )
        } catch (err) {
            toast.push(
                <Notification type="danger" title={t('vehicle.toastFailedTitle')} duration={4000}>
                    {err?.response?.data?.message || t('vehicle.toastFailedDefault')}
                </Notification>,
            )
        }
    }

    const handleClearDefaultVehiclePlate = async () => {
        try {
            await updateDefaultVehiclePlate.mutateAsync({ defaultVehiclePlate: '' })
            setDefaultVehiclePlateLocal('')
            toast.push(
                <Notification type="success" title={t('vehicle.toastClearedTitle')} duration={3000}>
                    {t('vehicle.toastClearedMsg')}
                </Notification>,
            )
        } catch (err) {
            toast.push(
                <Notification type="danger" title={t('vehicle.toastFailedTitle')} duration={4000}>
                    {err?.response?.data?.message || t('vehicle.toastFailedDefault')}
                </Notification>,
            )
        }
    }

    // ── Open password dialog ──
    const handleOpenPasswordDialog = () => {
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setPasswordErrors({})
        setShowCurrentPw(false)
        setShowNewPw(false)
        setShowConfirmPw(false)
        setShowPasswordDialog(true)
    }

    // ── Validate password form ──
    const validatePasswordForm = () => {
        const errors = {}
        if (!currentPassword) errors.currentPassword = t('validation.currentPasswordRequired')
        if (!newPassword) errors.newPassword = t('validation.newPasswordRequired')
        else if (newPassword.length < 6) errors.newPassword = t('validation.newPasswordMin')
        if (!confirmPassword) errors.confirmPassword = t('validation.confirmPasswordRequired')
        else if (newPassword !== confirmPassword) errors.confirmPassword = t('validation.passwordMismatch')
        setPasswordErrors(errors)
        return Object.keys(errors).length === 0
    }

    // ── Submit password change ──
    const handleChangePassword = async () => {
        if (!validatePasswordForm()) return
        try {
            await changePassword.mutateAsync({ currentPassword, newPassword, confirmPassword })
            toast.push(
                <Notification type="success" title={t('toast.passwordSuccessTitle')} duration={3000}>
                    {t('toast.passwordSuccessMsg')}
                </Notification>
            )
            setShowPasswordDialog(false)
        } catch (err) {
            toast.push(
                <Notification type="danger" title={t('toast.passwordFailedTitle')} duration={4000}>
                    {err?.response?.data?.message || t('toast.passwordFailedDefault')}
                </Notification>
            )
        }
    }

    // ── Loading/Error states ──
    if (isLoading) return <ProfileSkeleton />

    if (isError || !user) {
        return (
            <div className="max-w-4xl mx-auto">
                <Card>
                    <div className="flex flex-col items-center py-16">
                        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center mb-4">
                            <PiWarningDuotone className="text-3xl text-red-500" />
                        </div>
                        <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('error.title')}</h5>
                        <p className="text-sm text-gray-400">{t('error.subtitle')}</p>
                    </div>
                </Card>
            </div>
        )
    }

    const initials = user.fullName
        ?.split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)

    return (
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
            {/* ── Header Card ── */}
            <Card>
                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 p-2">
                    <div className="relative flex-shrink-0">
                        <Avatar
                            size={96}
                            shape="circle"
                            className="bg-primary/10 text-primary text-2xl font-bold"
                        >
                            {initials}
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 border-3 border-white dark:border-gray-800 flex items-center justify-center">
                            <PiCheckCircleDuotone className="text-white text-sm" />
                        </div>
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                {user.fullName}
                            </h3>
                            <RoleBadge role={user.role} t={t} />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {t('memberSince', { date: dayjs(user.createdAt).format('MMMM D, YYYY') })}
                        </p>
                        <ProfileCompletion user={user} t={t} />
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ── Profile Details / Edit Form ── */}
                <div className="lg:col-span-2">
                    <Card
                        header={{
                            content: (
                                <div className="flex items-center justify-between w-full">
                                    <h5 className="font-semibold text-gray-800 dark:text-gray-200">
                                        {editing ? t('info.editTitle') : t('info.title')}
                                    </h5>
                                    {!editing && (
                                        <Button
                                            size="sm"
                                            variant="plain"
                                            icon={<PiPencilSimpleDuotone />}
                                            onClick={handleStartEdit}
                                        >
                                            {t('info.editBtn')}
                                        </Button>
                                    )}
                                </div>
                            ),
                            className: 'px-6 py-4',
                        }}
                    >
                        {editing ? (
                            /* ── Edit Mode ── */
                            <div className="space-y-5 p-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                                        {t('info.fullName')} <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        prefix={<PiUserDuotone className="text-lg text-gray-400" />}
                                        placeholder={t('info.fullNamePlaceholder')}
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        invalid={!!formErrors.fullName}
                                    />
                                    {formErrors.fullName && (
                                        <p className="text-xs text-red-500 mt-1">{formErrors.fullName}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                                        {t('info.email')}
                                    </label>
                                    <Input
                                        prefix={<PiEnvelopeDuotone className="text-lg text-gray-400" />}
                                        value={user.email}
                                        disabled
                                        className="opacity-60"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">{t('info.emailHint')}</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                                        {t('info.phone')}
                                    </label>
                                    <Input
                                        prefix={<PiPhoneDuotone className="text-lg text-gray-400" />}
                                        placeholder={t('info.phonePlaceholder')}
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        invalid={!!formErrors.phone}
                                    />
                                    {formErrors.phone && (
                                        <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p>
                                    )}
                                </div>

                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 pt-2">
                                    <Button
                                        variant="solid"
                                        icon={<PiFloppyDiskDuotone />}
                                        loading={updateProfile.isPending}
                                        onClick={handleSaveProfile}
                                        block
                                        className="sm:w-auto"
                                    >
                                        {t('info.saveBtn')}
                                    </Button>
                                    <Button
                                        variant="default"
                                        icon={<PiXCircleDuotone />}
                                        onClick={handleCancelEdit}
                                        disabled={updateProfile.isPending}
                                        block
                                        className="sm:w-auto"
                                    >
                                        {t('info.cancelBtn')}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            /* ── View Mode ── */
                            <div className="p-2">
                                <InfoRow icon={PiUserDuotone} label={t('info.fullName')} value={user.fullName} />
                                <InfoRow icon={PiEnvelopeDuotone} label={t('info.email')} value={user.email} />
                                <InfoRow icon={PiPhoneDuotone} label={t('info.phone')} value={user.phone} />
                                <InfoRow icon={PiShieldCheckDuotone} label={t('info.role')} value={t(`roles.${user.role}`) || user.role} />
                                <InfoRow icon={PiCalendarDuotone} label={t('info.memberSince')} value={dayjs(user.createdAt).format('MMMM D, YYYY')} />
                            </div>
                        )}
                    </Card>

                    <Card
                        header={{
                            content: (
                                <h5 className="font-semibold text-gray-800 dark:text-gray-200">
                                    {t('vehicle.title')}
                                </h5>
                            ),
                            className: 'px-6 py-4',
                        }}
                        className="mt-6"
                    >
                        <div className="p-2 space-y-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('vehicle.description')}</p>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                                    {t('vehicle.label')}
                                </label>
                                <Input
                                    prefix={<PiCarDuotone className="text-lg text-gray-400" />}
                                    placeholder={t('vehicle.placeholder')}
                                    value={defaultVehiclePlateLocal}
                                    onChange={(e) => setDefaultVehiclePlateLocal(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    variant="solid"
                                    icon={<PiFloppyDiskDuotone />}
                                    loading={updateDefaultVehiclePlate.isPending}
                                    onClick={handleSaveDefaultVehiclePlate}
                                >
                                    {t('vehicle.saveBtn')}
                                </Button>
                                <Button
                                    variant="default"
                                    onClick={handleClearDefaultVehiclePlate}
                                    disabled={updateDefaultVehiclePlate.isPending}
                                >
                                    {t('vehicle.clearBtn')}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* ── Actions Sidebar ── */}
                <div className="space-y-6">
                    {/* Security Card */}
                    <Card
                        header={{
                            content: (
                                <h5 className="font-semibold text-gray-800 dark:text-gray-200">
                                    {t('security.title')}
                                </h5>
                            ),
                            className: 'px-6 py-4',
                        }}
                    >
                        <div className="p-2 space-y-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {t('security.description')}
                            </p>
                            <Button
                                block
                                variant="default"
                                icon={<PiLockKeyDuotone />}
                                onClick={handleOpenPasswordDialog}
                            >
                                {t('security.changePasswordBtn')}
                            </Button>
                        </div>
                    </Card>

                    {/* Account Info Card */}
                    <Card
                        header={{
                            content: (
                                <h5 className="font-semibold text-gray-800 dark:text-gray-200">
                                    {t('accountInfo.title')}
                                </h5>
                            ),
                            className: 'px-6 py-4',
                        }}
                    >
                        <div className="p-2 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">{t('accountInfo.account')}</span>
                                <RoleBadge role={user.role} t={t} />
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">{t('accountInfo.status')}</span>
                                <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                                    <PiCheckCircleDuotone className="text-sm" />
                                    {t('accountInfo.statusActive')}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">{t('accountInfo.joined')}</span>
                                <span className="text-gray-700 dark:text-gray-300">
                                    {dayjs(user.createdAt).format('MMM D, YYYY')}
                                </span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* ── Password Change Dialog ── */}
            <Dialog
                isOpen={showPasswordDialog}
                onClose={() => setShowPasswordDialog(false)}
                width={440}
            >
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <PiLockKeyDuotone className="text-xl text-primary" />
                        </div>
                        <div>
                            <h5 className="font-semibold text-gray-900 dark:text-gray-100">{t('passwordDialog.title')}</h5>
                            <p className="text-xs text-gray-400">{t('passwordDialog.subtitle')}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                                {t('passwordDialog.currentPassword')}
                            </label>
                            <Input
                                type={showCurrentPw ? 'text' : 'password'}
                                placeholder={t('passwordDialog.currentPasswordPlaceholder')}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                invalid={!!passwordErrors.currentPassword}
                                suffix={
                                    <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="text-gray-400 hover:text-gray-600">
                                        {showCurrentPw ? <PiEyeSlashDuotone /> : <PiEyeDuotone />}
                                    </button>
                                }
                            />
                            {passwordErrors.currentPassword && (
                                <p className="text-xs text-red-500 mt-1">{passwordErrors.currentPassword}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                                {t('passwordDialog.newPassword')}
                            </label>
                            <Input
                                type={showNewPw ? 'text' : 'password'}
                                placeholder={t('passwordDialog.newPasswordPlaceholder')}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                invalid={!!passwordErrors.newPassword}
                                suffix={
                                    <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="text-gray-400 hover:text-gray-600">
                                        {showNewPw ? <PiEyeSlashDuotone /> : <PiEyeDuotone />}
                                    </button>
                                }
                            />
                            {passwordErrors.newPassword && (
                                <p className="text-xs text-red-500 mt-1">{passwordErrors.newPassword}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                                {t('passwordDialog.confirmPassword')}
                            </label>
                            <Input
                                type={showConfirmPw ? 'text' : 'password'}
                                placeholder={t('passwordDialog.confirmPasswordPlaceholder')}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                invalid={!!passwordErrors.confirmPassword}
                                suffix={
                                    <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="text-gray-400 hover:text-gray-600">
                                        {showConfirmPw ? <PiEyeSlashDuotone /> : <PiEyeDuotone />}
                                    </button>
                                }
                            />
                            {passwordErrors.confirmPassword && (
                                <p className="text-xs text-red-500 mt-1">{passwordErrors.confirmPassword}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 mt-6">
                        <Button
                            variant="solid"
                            loading={changePassword.isPending}
                            onClick={handleChangePassword}
                        >
                            {t('passwordDialog.updateBtn')}
                        </Button>
                        <Button
                            variant="default"
                            onClick={() => setShowPasswordDialog(false)}
                            disabled={changePassword.isPending}
                        >
                            {t('passwordDialog.cancelBtn')}
                        </Button>
                    </div>
                </div>
            </Dialog>
        </div>
    )
}

export default ProfileClient
