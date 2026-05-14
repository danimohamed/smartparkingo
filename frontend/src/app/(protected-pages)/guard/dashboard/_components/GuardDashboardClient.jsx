'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { apiGetCurrentUser } from '@/services/UserService'
import { apiGetAllParkings } from '@/services/ParkingService'
import { apiGetSlotsByParking } from '@/services/ParkingSlotService'
import {
    apiGuardValidateEntry,
    apiGuardValidateExit,
    apiGuardValidateEntryManual,
    apiGuardValidateExitManual,
    apiGuardActiveBookings,
    apiGuardManualOccupy,
    apiGuardManualFree,
} from '@/services/GuardService'
import GuardQrScannerDialog from '@/components/guard/GuardQrScannerDialog'
import PlateScanDialog from '@/components/guard/PlateScanDialog'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Dialog from '@/components/ui/Dialog'
import Tag from '@/components/ui/Tag'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import StatusBadge from '@/components/shared/StatusBadge'
import Skeleton from '@/components/ui/Skeleton'
import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import {
    PiShieldCheckDuotone,
    PiSignInDuotone,
    PiSignOutDuotone,
    PiCarDuotone,
    PiListChecksDuotone,
    PiLockKeyOpenDuotone,
    PiLockKeyDuotone,
    PiCheckCircleFill,
    PiXCircleFill,
    PiArrowCounterClockwiseBold,
    PiScanDuotone,
} from 'react-icons/pi'

const statusColor = {
    ACTIVE: 'bg-emerald-500',
    COMPLETED: 'bg-blue-500',
    CANCELLED: 'bg-red-500',
    NO_SHOW: 'bg-orange-500',
}

const GuardDashboardClient = () => {
    const t = useTranslations('guard.dashboard')
    const tCommon = useTranslations('guard.common')
    const tStatus = useTranslations('guard.status')
    const tBookings = useTranslations('guard.dashboard.bookings')
    const tManual = useTranslations('guard.dashboard.manual')
    const tSlot = useTranslations('guard.dashboard.slot')
    const tQr = useTranslations('guard.dashboard.qrToast')
    const tCheckIn = useTranslations('guard.dashboard.checkInToast')
    const tCheckOut = useTranslations('guard.dashboard.checkOutToast')

    const [user, setUser] = useState(null)
    const [adminParkings, setAdminParkings] = useState([])
    const [adminParkingId, setAdminParkingId] = useState(null)
    const [bookings, setBookings] = useState([])
    const [slots, setSlots] = useState([])
    const [loading, setLoading] = useState(true)

    const scanModeRef = useRef('entry')
    const [scanOpen, setScanOpen] = useState(false)
    const [scanDialogTitle, setScanDialogTitle] = useState('')

    // Manual entry/exit
    const [manualDialogOpen, setManualDialogOpen] = useState(false)
    const [manualMode, setManualMode] = useState('entry') // entry | exit
    const [manualResId, setManualResId] = useState('')
    const [manualLoading, setManualLoading] = useState(false)
    const [manualResult, setManualResult] = useState(null)

    // Slot actions
    const [slotDialogOpen, setSlotDialogOpen] = useState(false)
    const [slotAction, setSlotAction] = useState('occupy') // occupy | free
    const [selectedSlotId, setSelectedSlotId] = useState('')
    const [slotActionLoading, setSlotActionLoading] = useState(false)

    // Plate scan
    const [plateScanOpen, setPlateScanOpen] = useState(false)

    const fetchData = useCallback(async () => {
        try {
            const userRes = await apiGetCurrentUser()
            const userData = userRes?.data
            setUser(userData)

            const isAdmin = userData?.role === 'ADMIN'
            let pid = userData?.assignedParkingId

            if (isAdmin) {
                const parksRes = await apiGetAllParkings().catch(() => null)
                const list = parksRes?.data || []
                const safe = Array.isArray(list) ? list : []
                setAdminParkings(safe)
                if (!pid && safe.length > 0) {
                    pid = safe[0].id
                    setAdminParkingId(pid)
                }
            }

            pid = pid || adminParkingId

            if (pid) {
                const [bookingsRes, slotsRes] = await Promise.all([
                    apiGuardActiveBookings(pid),
                    apiGetSlotsByParking(pid),
                ])
                setBookings(bookingsRes?.data || [])
                setSlots(slotsRes?.data || [])
            }
        } catch (error) {
            toast.push(
                <Notification type="danger" title={tCommon('error')}>
                    {t('loadFailed')}
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }, [adminParkingId, t, tCommon])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    useEffect(() => {
        const isAdmin = user?.role === 'ADMIN'
        const pid = isAdmin ? adminParkingId : user?.assignedParkingId
        if (!pid) return
        const interval = setInterval(async () => {
            try {
                const [bookingsRes, slotsRes] = await Promise.all([
                    apiGuardActiveBookings(pid),
                    apiGetSlotsByParking(pid),
                ])
                setBookings(bookingsRes?.data || [])
                setSlots(slotsRes?.data || [])
            } catch (_) {}
        }, 30000)
        return () => clearInterval(interval)
    }, [user?.assignedParkingId, user?.role, adminParkingId])

    const handleGuardQrDecoded = async (payload) => {
        setScanOpen(false)
        const mode = scanModeRef.current
        try {
            const res =
                mode === 'entry'
                    ? await apiGuardValidateEntry(payload)
                    : await apiGuardValidateExit(payload)
            const data = res?.data
            toast.push(
                <Notification
                    type={data?.valid ? 'success' : 'warning'}
                    title={data?.valid ? tQr('valid') : tQr('rejected')}
                >
                    {data?.message ||
                        (data?.valid ? tQr('ok') : tQr('couldNotValidate'))}
                </Notification>,
            )
            fetchData()
        } catch (e) {
            toast.push(
                <Notification type="danger" title={tCommon('error')}>
                    {e?.response?.data?.message || tQr('requestFailed')}
                </Notification>,
            )
        }
    }

    const handleManualValidation = async () => {
        if (!manualResId) return
        setManualLoading(true)
        setManualResult(null)
        try {
            const apiFn =
                manualMode === 'entry'
                    ? apiGuardValidateEntryManual
                    : apiGuardValidateExitManual
            const res = await apiFn(parseInt(manualResId))
            setManualResult(res?.data)
            fetchData()
        } catch (error) {
            setManualResult({
                valid: false,
                message:
                    error?.response?.data?.message || tManual('validationFailed'),
            })
        } finally {
            setManualLoading(false)
        }
    }

    const handleSlotAction = async () => {
        if (!selectedSlotId) return
        setSlotActionLoading(true)
        try {
            const apiFn =
                slotAction === 'occupy'
                    ? apiGuardManualOccupy
                    : apiGuardManualFree
            await apiFn(parseInt(selectedSlotId))
            toast.push(
                <Notification type="success" title={tSlot('successTitle')}>
                    {slotAction === 'occupy' ? tSlot('successOccupied') : tSlot('successFreed')}
                </Notification>,
            )
            setSlotDialogOpen(false)
            setSelectedSlotId('')
            fetchData()
        } catch (error) {
            toast.push(
                <Notification type="danger" title={tCommon('error')}>
                    {error?.response?.data?.message || tSlot('operationFailed')}
                </Notification>,
            )
        } finally {
            setSlotActionLoading(false)
        }
    }

    const availableSlots = slots.filter((s) => s.status === 'AVAILABLE')
    const occupiedSlots = slots.filter(
        (s) => s.status === 'RESERVED' || s.status === 'OCCUPIED',
    )

    if (loading) {
        return (
            <div className="flex flex-col gap-6">
                <Skeleton width={200} height={28} />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} height={80} className="rounded-2xl" />
                    ))}
                </div>
                <Card>
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="mt-3" height={40} />
                    ))}
                </Card>
            </div>
        )
    }

    const isAdmin = user?.role === 'ADMIN'
    const activeParkingId = isAdmin ? adminParkingId : user?.assignedParkingId
    const activeParkingName = isAdmin
        ? adminParkings.find((p) => p.id === adminParkingId)?.name || t('selectedParkingFallback')
        : user?.assignedParkingName

    if (!activeParkingId) {
        return (
            <Card>
                <div className="text-center py-16">
                    <PiShieldCheckDuotone className="text-6xl text-gray-300 mx-auto mb-4" />
                    <h5 className="font-bold mb-2">
                        {isAdmin ? t('noParking.selectParking') : t('noParking.noAssigned')}
                    </h5>
                    {isAdmin ? (
                        <div className="mx-auto mt-4 max-w-[360px] text-left">
                            <p className="text-gray-500 text-sm mb-2">
                                {t('noParking.chooseHelp')}
                            </p>
                            <select
                                className="input w-full rounded-xl"
                                value={adminParkingId ?? ''}
                                onChange={(e) => setAdminParkingId(e.target.value ? Number(e.target.value) : null)}
                            >
                                {(adminParkings || []).map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                            <Button
                                variant="solid"
                                className="w-full mt-3"
                                disabled={!adminParkingId}
                                onClick={() => fetchData()}
                            >
                                {t('noParking.loadDashboard')}
                            </Button>
                        </div>
                    ) : (
                        <p className="text-gray-400">
                            {t('noParking.askAdmin')}
                        </p>
                    )}
                </div>
            </Card>
        )
    }

    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            {/* Header */}
            <div>
                <h3 className="font-bold text-lg sm:text-xl flex items-center gap-2">
                    <PiShieldCheckDuotone className="text-indigo-500" />
                    {t('title')}
                </h3>
                <p className="text-gray-500 text-xs sm:text-sm mt-1">
                    {t('subtitle', { parking: activeParkingName, name: user.fullName })}
                </p>
                {isAdmin && adminParkings.length > 0 && (
                    <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2">
                        <span className="text-xs font-semibold text-gray-500">{tCommon('parking')}</span>
                        <select
                            className="input input-sm rounded-xl"
                            value={adminParkingId ?? ''}
                            onChange={(e) => setAdminParkingId(e.target.value ? Number(e.target.value) : null)}
                        >
                            {adminParkings.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                        <Button size="sm" onClick={() => fetchData()} className="sm:ml-auto">
                            {tCommon('refresh')}
                        </Button>
                    </div>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-2xl p-4 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400">
                    <p className="text-xs font-medium opacity-70 mb-1">
                        {t('stat.activeBookings')}
                    </p>
                    <p className="text-2xl font-bold">{bookings.length}</p>
                </div>
                <div className="rounded-2xl p-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                    <p className="text-xs font-medium opacity-70 mb-1">
                        {t('stat.availableSlots')}
                    </p>
                    <p className="text-2xl font-bold">{availableSlots.length}</p>
                </div>
                <div className="rounded-2xl p-4 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400">
                    <p className="text-xs font-medium opacity-70 mb-1">
                        {t('stat.occupiedSlots')}
                    </p>
                    <p className="text-2xl font-bold">{occupiedSlots.length}</p>
                </div>
                <div className="rounded-2xl p-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
                    <p className="text-xs font-medium opacity-70 mb-1">
                        {t('stat.totalSlots')}
                    </p>
                    <p className="text-2xl font-bold">{slots.length}</p>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Button
                    variant="solid"
                    className="h-16"
                    block
                    icon={<PiScanDuotone className="text-xl" />}
                    onClick={() => {
                        scanModeRef.current = 'entry'
                        setScanDialogTitle(t('btn.scanEntryTitle'))
                        setScanOpen(true)
                    }}
                >
                    {t('btn.scanEntry')}
                </Button>
                <Button
                    variant="solid"
                    className="h-16 !bg-violet-600 hover:!bg-violet-700 active:!bg-violet-700"
                    block
                    icon={<PiScanDuotone className="text-xl" />}
                    onClick={() => {
                        scanModeRef.current = 'exit'
                        setScanDialogTitle(t('btn.scanExitTitle'))
                        setScanOpen(true)
                    }}
                >
                    {t('btn.scanExit')}
                </Button>
                <Button
                    variant="twoTone"
                    className="h-16"
                    block
                    icon={<PiSignInDuotone className="text-xl" />}
                    onClick={() => {
                        setManualMode('entry')
                        setManualResId('')
                        setManualResult(null)
                        setManualDialogOpen(true)
                    }}
                >
                    {t('btn.manualCheckIn')}
                </Button>
                <Button
                    variant="twoTone"
                    className="h-16"
                    block
                    icon={<PiSignOutDuotone className="text-xl" />}
                    onClick={() => {
                        setManualMode('exit')
                        setManualResId('')
                        setManualResult(null)
                        setManualDialogOpen(true)
                    }}
                >
                    {t('btn.manualCheckOut')}
                </Button>
                <Button
                    variant="twoTone"
                    className="h-16"
                    block
                    icon={<PiLockKeyDuotone className="text-xl" />}
                    onClick={() => {
                        setSlotAction('occupy')
                        setSelectedSlotId('')
                        setSlotDialogOpen(true)
                    }}
                >
                    {t('btn.occupySlot')}
                </Button>
                <Button
                    variant="twoTone"
                    className="h-16"
                    block
                    icon={<PiLockKeyOpenDuotone className="text-xl" />}
                    onClick={() => {
                        setSlotAction('free')
                        setSelectedSlotId('')
                        setSlotDialogOpen(true)
                    }}
                >
                    {t('btn.freeSlot')}
                </Button>
            </div>

            {/* Scan Plate — full-width row so it's always visible */}
            <div>
                <Button
                    variant="solid"
                    className="h-16 w-full !bg-emerald-600 hover:!bg-emerald-700 active:!bg-emerald-700"
                    block
                    icon={<PiCarDuotone className="text-xl" />}
                    onClick={() => setPlateScanOpen(true)}
                >
                    {t('btn.scanPlate')}
                </Button>
            </div>

            {/* Active Bookings */}
            <Card>
                <div className="flex items-center justify-between mb-4">
                    <h5 className="font-bold flex items-center gap-2">
                        <PiListChecksDuotone className="text-indigo-500" />
                        {tBookings('title')}
                    </h5>
                    <Button
                        size="xs"
                        variant="plain"
                        icon={<PiArrowCounterClockwiseBold />}
                        onClick={fetchData}
                    >
                        {tCommon('refresh')}
                    </Button>
                </div>

                {bookings.length === 0 ? (
                    <div className="text-center py-12">
                        <PiCarDuotone className="text-6xl text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-400">
                            {tBookings('empty')}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {bookings.map((b) => (
                            <div
                                key={b.id}
                                className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-mono text-sm text-primary">
                                            RES-{String(b.id).padStart(5, '0')}
                                        </span>
                                        <Tag
                                            className={`${statusColor[b.status] || 'bg-gray-500'} text-white border-0 text-[10px]`}
                                        >
                                            {tStatus(b.status)}
                                        </Tag>
                                        {b.checkedIn && (
                                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                                {tBookings('tagIn')}
                                            </span>
                                        )}
                                        {b.checkedOut && (
                                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded">
                                                {tBookings('tagOut')}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm font-medium">
                                        {b.userFullName}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {tBookings('slotShort', { number: b.slotNumber })} &middot;{' '}
                                        {dayjs(b.startTime).format(
                                            'HH:mm',
                                        )}{' '}
                                        →{' '}
                                        {dayjs(b.endTime).format('HH:mm')}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className="font-bold text-sm">
                                        {b.totalPrice} MAD
                                    </span>
                                    {!b.checkedIn && b.status === 'ACTIVE' && (
                                        <Button
                                            size="xs"
                                            variant="solid"
                                            onClick={async () => {
                                                try {
                                                    await apiGuardValidateEntryManual(b.id)
                                                    toast.push(
                                                        <Notification
                                                            type="success"
                                                            title={tCheckIn('title')}
                                                        >
                                                            {tCheckIn('msg', { id: b.id })}
                                                        </Notification>,
                                                    )
                                                    fetchData()
                                                } catch (e) {
                                                    toast.push(
                                                        <Notification
                                                            type="danger"
                                                            title={tCommon('error')}
                                                        >
                                                            {e?.response?.data?.message || tCheckIn('failed')}
                                                        </Notification>,
                                                    )
                                                }
                                            }}
                                        >
                                            {tBookings('checkIn')}
                                        </Button>
                                    )}
                                    {b.checkedIn && !b.checkedOut && (
                                        <Button
                                            size="xs"
                                            variant="twoTone"
                                            onClick={async () => {
                                                try {
                                                    await apiGuardValidateExitManual(b.id)
                                                    toast.push(
                                                        <Notification
                                                            type="success"
                                                            title={tCheckOut('title')}
                                                        >
                                                            {tCheckOut('msg', { id: b.id })}
                                                        </Notification>,
                                                    )
                                                    fetchData()
                                                } catch (e) {
                                                    toast.push(
                                                        <Notification
                                                            type="danger"
                                                            title={tCommon('error')}
                                                        >
                                                            {e?.response?.data?.message || tCheckOut('failed')}
                                                        </Notification>,
                                                    )
                                                }
                                            }}
                                        >
                                            {tBookings('checkOut')}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            <GuardQrScannerDialog
                isOpen={scanOpen}
                onClose={() => setScanOpen(false)}
                title={scanDialogTitle}
                onDecoded={handleGuardQrDecoded}
            />

            <PlateScanDialog
                isOpen={plateScanOpen}
                onClose={() => setPlateScanOpen(false)}
                parkingId={activeParkingId}
                onScanned={() => fetchData()}
            />

            {/* Manual Entry/Exit Dialog */}
            <Dialog
                isOpen={manualDialogOpen}
                onClose={() => setManualDialogOpen(false)}
                width={400}
            >
                <h5 className="mb-4 font-bold">
                    {manualMode === 'entry' ? tManual('titleIn') : tManual('titleOut')}
                </h5>
                <p className="text-sm text-gray-500 mb-3">
                    {manualMode === 'entry' ? tManual('hintIn') : tManual('hintOut')}
                </p>
                <Input
                    type="number"
                    placeholder={tManual('idPlaceholder')}
                    value={manualResId}
                    onChange={(e) => setManualResId(e.target.value)}
                    className="mb-4"
                />

                {manualResult && (
                    <div
                        className={`flex items-center gap-3 rounded-xl p-4 mb-4 ${
                            manualResult.valid
                                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400'
                        }`}
                    >
                        {manualResult.valid ? (
                            <PiCheckCircleFill className="text-2xl text-emerald-500" />
                        ) : (
                            <PiXCircleFill className="text-2xl text-red-500" />
                        )}
                        <div>
                            <p className="font-bold text-sm">
                                {manualResult.valid ? tManual('valid') : tManual('rejected')}
                            </p>
                            <p className="text-xs">{manualResult.message}</p>
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-2">
                    <Button
                        size="sm"
                        onClick={() => setManualDialogOpen(false)}
                    >
                        {tCommon('close')}
                    </Button>
                    <Button
                        size="sm"
                        variant="solid"
                        loading={manualLoading}
                        onClick={handleManualValidation}
                    >
                        {tManual('validate')}
                    </Button>
                </div>
            </Dialog>

            {/* Slot Occupy/Free Dialog */}
            <Dialog
                isOpen={slotDialogOpen}
                onClose={() => setSlotDialogOpen(false)}
                width={400}
            >
                <h5 className="mb-4 font-bold">
                    {slotAction === 'occupy'
                        ? tSlot('titleOccupy')
                        : tSlot('titleFree')}
                </h5>
                <p className="text-sm text-gray-500 mb-3">
                    {slotAction === 'occupy' ? tSlot('hintOccupy') : tSlot('hintFree')}
                </p>
                <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto mb-4">
                    {(slotAction === 'occupy' ? availableSlots : occupiedSlots).map(
                        (s) => (
                            <button
                                key={s.id}
                                onClick={() => setSelectedSlotId(s.id)}
                                className={`p-2 rounded-lg border-2 text-center text-sm font-bold transition-all ${
                                    selectedSlotId === s.id
                                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600'
                                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-400'
                                }`}
                            >
                                {s.slotNumber}
                            </button>
                        ),
                    )}
                </div>
                {(slotAction === 'occupy'
                    ? availableSlots
                    : occupiedSlots
                ).length === 0 && (
                    <p className="text-center text-gray-400 text-sm py-4">
                        {slotAction === 'occupy' ? tSlot('noneAvailable') : tSlot('noneOccupied')}
                    </p>
                )}
                <div className="flex justify-end gap-2">
                    <Button
                        size="sm"
                        onClick={() => setSlotDialogOpen(false)}
                    >
                        {tCommon('cancel')}
                    </Button>
                    <Button
                        size="sm"
                        variant="solid"
                        loading={slotActionLoading}
                        disabled={!selectedSlotId}
                        onClick={handleSlotAction}
                    >
                        {slotAction === 'occupy' ? tSlot('occupyBtn') : tSlot('freeBtn')}
                    </Button>
                </div>
            </Dialog>
        </div>
    )
}

export default GuardDashboardClient
