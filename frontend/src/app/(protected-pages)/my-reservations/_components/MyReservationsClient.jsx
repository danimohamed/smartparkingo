'use client'
import { useState, useMemo, useCallback, useEffect } from 'react'
import { useMyReservations, useCancelReservation } from '@/hooks/useReservations'
import { useTranslations } from 'next-intl'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Select from '@/components/ui/Select'
import DatePicker from '@/components/ui/DatePicker'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import StatusBadge from '@/components/shared/StatusBadge'
import EmptyState from '@/components/shared/EmptyState'
import CardSkeleton from '@/components/shared/loaders/CardSkeleton'
import TableRowSkeleton from '@/components/shared/loaders/TableRowSkeleton'
import Table from '@/components/ui/Table'
import dayjs from 'dayjs'
import Link from 'next/link'
import {
    PiCalendarCheckDuotone,
    PiXCircleDuotone,
    PiListBold,
    PiSquaresFourBold,
    PiCaretUpDownBold,
    PiTimerDuotone,
    PiMapPinDuotone,
    PiCarDuotone,
    PiWarningDuotone,
    PiFunnelBold,
    PiClockCountdownDuotone,
    PiWalletDuotone,
    PiCheckCircleDuotone,
    PiCreditCardDuotone,
    PiDownloadSimpleBold,
    PiQrCodeDuotone,
    PiSignInDuotone,
    PiSignOutDuotone,
} from 'react-icons/pi'
import generateInvoicePdf from '@/utils/generateInvoicePdf'
import { apiGetReservationQr } from '@/services/ReservationService'

const { Tr, Th, Td, THead, TBody } = Table

// --- Countdown Hook inlined for reservation cards ---
function useCountdownTimer(targetDate) {
    const calc = useCallback(() => {
        const diff = new Date(targetDate).getTime() - Date.now()
        if (diff <= 0) return null
        const h = Math.floor(diff / 3_600_000)
        const m = Math.floor((diff % 3_600_000) / 60_000)
        const s = Math.floor((diff % 60_000) / 1000)
        return { h, m, s, total: diff }
    }, [targetDate])

    const [tl, setTl] = useState(calc)

    useEffect(() => {
        setTl(calc())
        const id = setInterval(() => {
            const v = calc()
            setTl(v)
            if (!v) clearInterval(id)
        }, 1000)
        return () => clearInterval(id)
    }, [calc])

    return tl
}

// --- Countdown display for reservation card ---
const Countdown = ({ targetDate, label }) => {
    const tl = useCountdownTimer(targetDate)
    if (!tl) return null
    const isUrgent = tl.total < 3_600_000 // less than 1h

    return (
        <div className={`flex items-center gap-1.5 text-xs font-semibold rounded-lg px-2.5 py-1.5 ${
            isUrgent
                ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
        }`}>
            {isUrgent ? <PiWarningDuotone className="text-sm" /> : <PiClockCountdownDuotone className="text-sm" />}
            <span>{label}: </span>
            <span className="font-mono tabular-nums">{String(tl.h).padStart(2, '0')}:{String(tl.m).padStart(2, '0')}:{String(tl.s).padStart(2, '0')}</span>
        </div>
    )
}

// --- Payment Badge ---
const PaymentBadge = ({ paymentStatus, paymentMethod }) => {
    if (!paymentStatus) return null
    const config = {
        COMPLETED: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', icon: <PiCheckCircleDuotone /> },
        PENDING: { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', icon: <PiClockCountdownDuotone /> },
        REFUNDED: { bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', icon: <PiWalletDuotone /> },
        FAILED: { bg: 'bg-red-50 dark:bg-red-500/10', text: 'text-red-600 dark:text-red-400', icon: <PiWarningDuotone /> },
    }
    const c = config[paymentStatus] || config.PENDING
    return (
        <div className={`inline-flex items-center gap-1 text-xs font-semibold rounded-lg px-2 py-1 ${c.bg} ${c.text}`}>
            {c.icon}
            <span>{paymentStatus}</span>
            {paymentMethod && <span className="opacity-60">· {paymentMethod}</span>}
        </div>
    )
}

// --- Reservation Card ---
const ReservationCard = ({ reservation, onCancel, onShowQr, t }) => {
    const now = new Date()
    const startDate = new Date(reservation.startTime)
    const endDate = new Date(reservation.endTime)
    const hasStarted = startDate <= now
    const isActive = reservation.status === 'ACTIVE'
    const canCancel = isActive && !hasStarted

    return (
        <div className="group rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-lg hover:border-primary/30 transition-all duration-200 overflow-hidden">
            {/* Top color bar */}
            <div className={`h-1 ${
                reservation.status === 'ACTIVE' ? 'bg-emerald-500' :
                reservation.status === 'COMPLETED' ? 'bg-blue-500' :
                reservation.status === 'NO_SHOW' ? 'bg-orange-400' : 'bg-red-400'
            }`} />

            <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <PiCarDuotone className="text-xl text-primary" />
                        </div>
                        <div>
                            <h6 className="font-bold text-gray-900 dark:text-gray-100 text-sm">{reservation.parkingName}</h6>
                            <p className="text-xs text-gray-400">{t('card.slot')} {reservation.slotNumber}</p>
                        </div>
                    </div>
                    <StatusBadge status={reservation.status} />
                </div>

                {/* Time */}
                <div className="space-y-2 mb-4">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <PiTimerDuotone className="text-gray-400 text-base flex-shrink-0" />
                        <span className="whitespace-nowrap">{dayjs(reservation.startTime).format('MMM DD, YYYY HH:mm')}</span>
                        <span className="text-gray-300 dark:text-gray-600">→</span>
                        <span className="whitespace-nowrap">{dayjs(reservation.endTime).format('HH:mm')}</span>
                    </div>
                </div>

                {/* Countdown timers */}
                {isActive && !hasStarted && (
                    <div className="mb-3">
                        <Countdown targetDate={reservation.startTime} label={t('card.startsIn')} />
                    </div>
                )}
                {isActive && hasStarted && endDate > now && (
                    <div className="mb-3">
                        <Countdown targetDate={reservation.endTime} label={t('card.endsIn')} />
                    </div>
                )}

                {/* Payment Info */}
                {reservation.paymentStatus && (
                    <div className="mb-3">
                        <PaymentBadge paymentStatus={reservation.paymentStatus} paymentMethod={reservation.paymentMethod} />
                    </div>
                )}

                {/* Check-in / Check-out badges */}
                {(reservation.checkedIn || reservation.checkedOut) && (
                    <div className="flex items-center gap-2 mb-3">
                        {reservation.checkedIn && (
                            <div className="inline-flex items-center gap-1 text-xs font-semibold rounded-lg px-2 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <PiSignInDuotone className="text-sm" />
                                {t('card.checkedIn')}
                            </div>
                        )}
                        {reservation.checkedOut && (
                            <div className="inline-flex items-center gap-1 text-xs font-semibold rounded-lg px-2 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                <PiSignOutDuotone className="text-sm" />
                                {t('card.checkedOut')}
                            </div>
                        )}
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                    <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {reservation.totalPrice} <span className="text-sm font-normal text-gray-400">MAD</span>
                    </div>
                    <div className="flex items-center gap-1">
                        {isActive && (
                            <Button
                                size="xs"
                                variant="plain"
                                className="text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
                                title={t('card.showQr')}
                                onClick={() => onShowQr(reservation.id)}
                            >
                                <PiQrCodeDuotone className="text-lg" />
                            </Button>
                        )}
                        {reservation.paymentStatus === 'COMPLETED' && (
                            <Button
                                size="xs"
                                variant="plain"
                                className="text-gray-400 hover:text-primary"
                                title={t('card.downloadInvoice')}
                                onClick={() => generateInvoicePdf(
                                    { id: reservation.paymentId || reservation.id, reservationId: reservation.id, amount: reservation.totalPrice, status: reservation.paymentStatus, paymentMethod: reservation.paymentMethod, paidAt: reservation.paidAt },
                                    { parkingName: reservation.parkingName, slotNumber: reservation.slotNumber, startTime: reservation.startTime, endTime: reservation.endTime }
                                )}
                            >
                                <PiDownloadSimpleBold className="text-lg" />
                            </Button>
                        )}
                        {canCancel && (
                            <Button
                                size="xs"
                                variant="plain"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10"
                                onClick={() => onCancel(reservation.id)}
                            >
                                <PiXCircleDuotone className="text-lg mr-1" /> {t('card.cancel')}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

// --- Main Component ---
const MyReservationsClient = () => {
    const { data: reservations = [], isLoading, isError } = useMyReservations()
    const cancelMutation = useCancelReservation()
    const t = useTranslations('myReservations')

    const STATUS_OPTIONS = [
        { value: 'ALL', label: t('filter.allStatuses') },
        { value: 'ACTIVE', label: t('filter.statusActive') },
        { value: 'COMPLETED', label: t('filter.statusCompleted') },
        { value: 'CANCELLED', label: t('filter.statusCancelled') },
        { value: 'NO_SHOW', label: t('filter.statusNoShow') },
    ]

    const SORT_OPTIONS = [
        { value: 'date-desc', label: t('filter.sortNewest') },
        { value: 'date-asc', label: t('filter.sortOldest') },
        { value: 'price-desc', label: t('filter.sortPriceDesc') },
        { value: 'price-asc', label: t('filter.sortPriceAsc') },
    ]

    const [viewMode, setViewMode] = useState('card')
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [sortBy, setSortBy] = useState('date-desc')
    const [dateRange, setDateRange] = useState([null, null])
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
    const [selectedId, setSelectedId] = useState(null)
    const [qrDialogOpen, setQrDialogOpen] = useState(false)
    const [qrToken, setQrToken] = useState(null)
    const [qrLoading, setQrLoading] = useState(false)

    // --- Filtered & sorted ---
    const filteredData = useMemo(() => {
        let list = [...reservations]

        // Status filter
        if (statusFilter !== 'ALL') {
            list = list.filter((r) => r.status === statusFilter)
        }

        // Date range filter
        const [from, to] = dateRange
        if (from) list = list.filter((r) => dayjs(r.startTime).isAfter(dayjs(from).startOf('day')))
        if (to) list = list.filter((r) => dayjs(r.startTime).isBefore(dayjs(to).endOf('day')))

        // Sort
        list.sort((a, b) => {
            switch (sortBy) {
                case 'date-asc': return new Date(a.startTime) - new Date(b.startTime)
                case 'price-desc': return b.totalPrice - a.totalPrice
                case 'price-asc': return a.totalPrice - b.totalPrice
                default: return new Date(b.startTime) - new Date(a.startTime)
            }
        })

        return list
    }, [reservations, statusFilter, sortBy, dateRange])

    // --- Stats ---
    const stats = useMemo(() => ({
        total: reservations.length,
        active: reservations.filter((r) => r.status === 'ACTIVE').length,
        completed: reservations.filter((r) => r.status === 'COMPLETED').length,
        cancelled: reservations.filter((r) => r.status === 'CANCELLED').length,
        noShow: reservations.filter((r) => r.status === 'NO_SHOW').length,
    }), [reservations])

    // --- Cancel handlers ---
    const handleCancelClick = (id) => {
        setSelectedId(id)
        setCancelDialogOpen(true)
    }

    const handleConfirmCancel = async () => {
        try {
            await cancelMutation.mutateAsync(selectedId)
            toast.push(
                <Notification title={t('toast.cancelledTitle')} type="success">
                    {t('toast.cancelledDesc')}
                </Notification>,
            )
            setCancelDialogOpen(false)
        } catch (error) {
            toast.push(
                <Notification title={t('toast.cancelFailedTitle')} type="danger">
                    {error?.response?.data?.message || t('toast.cancelFailedDefault')}
                </Notification>,
            )
        }
    }

    const handleShowQr = async (reservationId) => {
        setQrDialogOpen(true)
        setQrLoading(true)
        setQrToken(null)
        try {
            const res = await apiGetReservationQr(reservationId)
            setQrToken(res?.data?.qrData || null)
        } catch (_) {
            setQrToken(null)
        } finally {
            setQrLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h3 className="font-bold text-lg sm:text-xl">{t('title')}</h3>
                    <p className="text-gray-500 text-xs sm:text-sm">{t('subtitle')}</p>
                </div>
                <Link href="/parkings">
                    <Button variant="solid" size="sm">+ {t('newReservation')}</Button>
                </Link>
            </div>

            {/* Stats Strip */}
            {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-20 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {[
                        { label: t('stat.total'), value: stats.total, color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200' },
                        { label: t('stat.active'), value: stats.active, color: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
                        { label: t('stat.completed'), value: stats.completed, color: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400' },
                        { label: t('stat.cancelled'), value: stats.cancelled, color: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400' },
                        { label: t('stat.noShow'), value: stats.noShow, color: 'bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400' },
                    ].map((s) => (
                        <div key={s.label} className={`rounded-2xl p-4 ${s.color}`}>
                            <p className="text-xs font-medium opacity-70 mb-1">{s.label}</p>
                            <p className="text-2xl font-bold">{s.value}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Filters Bar */}
            <Card bodyClass="p-3">
                <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-1.5 text-gray-400">
                        <PiFunnelBold className="text-base" />
                        <span className="text-xs font-semibold">{t('filter.label')}</span>
                    </div>
                    <div className="w-full sm:w-44">
                        <Select
                            instanceId="res-status-filter"
                            size="sm"
                            options={STATUS_OPTIONS}
                            value={STATUS_OPTIONS.find((o) => o.value === statusFilter)}
                            onChange={(opt) => setStatusFilter(opt?.value || 'ALL')}
                            placeholder={t('filter.status')}
                            isSearchable={false}
                        />
                    </div>
                    <div className="w-full sm:w-44">
                        <Select
                            instanceId="res-sort-by"
                            size="sm"
                            options={SORT_OPTIONS}
                            value={SORT_OPTIONS.find((o) => o.value === sortBy)}
                            onChange={(opt) => setSortBy(opt?.value || 'date-desc')}
                            placeholder={t('filter.sortBy')}
                            isSearchable={false}
                        />
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <div className="flex-1 sm:w-36 sm:flex-none">
                            <DatePicker size="sm" placeholder={t('filter.from')} value={dateRange[0]}
                                onChange={(d) => setDateRange([d, dateRange[1]])} clearable />
                        </div>
                        <div className="flex-1 sm:w-36 sm:flex-none">
                            <DatePicker size="sm" placeholder={t('filter.to')} value={dateRange[1]}
                                onChange={(d) => setDateRange([dateRange[0], d])} clearable />
                        </div>
                    </div>
                    <div className="sm:ml-auto hidden sm:flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5 self-end">
                        <button onClick={() => setViewMode('card')}
                            className={`p-1.5 rounded-md transition-colors ${viewMode === 'card' ? 'bg-white dark:bg-gray-600 shadow-sm text-primary' : 'text-gray-400 hover:text-gray-600'}`}>
                            <PiSquaresFourBold className="text-lg" />
                        </button>
                        <button onClick={() => setViewMode('table')}
                            className={`p-1.5 rounded-md transition-colors ${viewMode === 'table' ? 'bg-white dark:bg-gray-600 shadow-sm text-primary' : 'text-gray-400 hover:text-gray-600'}`}>
                            <PiListBold className="text-lg" />
                        </button>
                    </div>
                </div>
            </Card>

            {/* Content */}
            {isLoading ? (
                viewMode === 'card' ? (
                    <CardSkeleton count={6} />
                ) : (
                    <Card>
                        <Table>
                            <THead>
                                <Tr>
                                    {[t('table.parking'), t('table.slot'), t('table.startTime'), t('table.endTime'), t('table.price'), t('table.status'), t('table.payment'), t('table.actions')].map((h) => (
                                        <Th key={h}>{h}</Th>
                                    ))}
                                </Tr>
                            </THead>
                            <TableRowSkeleton columns={8} rows={5} />
                        </Table>
                    </Card>
                )
            ) : filteredData.length === 0 ? (
                <Card>
                    <EmptyState
                        icon={PiCalendarCheckDuotone}
                        title={reservations.length === 0 ? t('empty.title') : t('empty.titleFiltered')}
                        description={reservations.length === 0 ? t('empty.description') : t('empty.descFiltered')}
                        action={
                            reservations.length === 0 ? (
                                <Link href="/parkings">
                                    <Button variant="solid" size="sm">{t('empty.browseParkings')}</Button>
                                </Link>
                            ) : (
                                <Button size="sm" variant="plain"
                                    onClick={() => { setStatusFilter('ALL'); setDateRange([null, null]) }}>
                                    {t('empty.clearFilters')}
                                </Button>
                            )
                        }
                    />
                </Card>
            ) : viewMode === 'card' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredData.map((r) => (
                        <ReservationCard key={r.id} reservation={r} onCancel={handleCancelClick} onShowQr={handleShowQr} t={t} />
                    ))}
                </div>
            ) : (
                <Card bodyClass="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <THead>
                                <Tr>
                                    <Th>{t('table.parking')}</Th>
                                    <Th>{t('table.slot')}</Th>
                                    <Th>{t('table.startTime')}</Th>
                                    <Th>{t('table.endTime')}</Th>
                                    <Th>{t('table.price')}</Th>
                                    <Th>{t('table.status')}</Th>
                                    <Th>{t('table.payment')}</Th>
                                    <Th>{t('table.countdown')}</Th>
                                    <Th>{t('table.actions')}</Th>
                                </Tr>
                            </THead>
                            <TBody>
                                {filteredData.map((r) => {
                                    const now = new Date()
                                    const started = new Date(r.startTime) <= now
                                    const canCancel = r.status === 'ACTIVE' && !started
                                    return (
                                        <Tr key={r.id}>
                                            <Td>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                        <PiCarDuotone className="text-primary" />
                                                    </div>
                                                    <span className="font-semibold text-sm">{r.parkingName}</span>
                                                </div>
                                            </Td>
                                            <Td><span className="font-mono text-sm bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{r.slotNumber}</span></Td>
                                            <Td className="text-sm">{dayjs(r.startTime).format('MMM DD, HH:mm')}</Td>
                                            <Td className="text-sm">{dayjs(r.endTime).format('MMM DD, HH:mm')}</Td>
                                            <Td className="font-bold">{r.totalPrice} MAD</Td>
                                            <Td><StatusBadge status={r.status} /></Td>
                                            <Td><PaymentBadge paymentStatus={r.paymentStatus} paymentMethod={r.paymentMethod} /></Td>
                                            <Td>
                                                {r.status === 'ACTIVE' && !started && (
                                                    <Countdown targetDate={r.startTime} label={t('table.starts')} />
                                                )}
                                                {r.status === 'ACTIVE' && started && new Date(r.endTime) > now && (
                                                    <Countdown targetDate={r.endTime} label={t('table.ends')} />
                                                )}
                                            </Td>
                                            <Td>
                                                <div className="flex items-center gap-1">
                                                    {r.status === 'ACTIVE' && (
                                                        <Button size="xs" variant="plain"
                                                            className="text-indigo-500 hover:text-indigo-700"
                                                            title={t('card.showQr')}
                                                            onClick={() => handleShowQr(r.id)}>
                                                            <PiQrCodeDuotone className="text-lg" />
                                                        </Button>
                                                    )}
                                                    {r.paymentStatus === 'COMPLETED' && (
                                                        <Button size="xs" variant="plain"
                                                            className="text-gray-400 hover:text-primary"
                                                            title={t('card.downloadInvoice')}
                                                            onClick={() => generateInvoicePdf(
                                                                { id: r.paymentId || r.id, reservationId: r.id, amount: r.totalPrice, status: r.paymentStatus, paymentMethod: r.paymentMethod, paidAt: r.paidAt },
                                                                { parkingName: r.parkingName, slotNumber: r.slotNumber, startTime: r.startTime, endTime: r.endTime }
                                                            )}>
                                                            <PiDownloadSimpleBold className="text-lg" />
                                                        </Button>
                                                    )}
                                                    {canCancel && (
                                                        <Button size="xs" variant="plain"
                                                            className="text-red-500 hover:text-red-700"
                                                            onClick={() => handleCancelClick(r.id)}>
                                                            <PiXCircleDuotone className="text-lg mr-1" /> {t('card.cancel')}
                                                        </Button>
                                                    )}
                                                </div>
                                            </Td>
                                        </Tr>
                                    )
                                })}
                            </TBody>
                        </Table>
                    </div>
                </Card>
            )}

            {/* QR Dialog */}
            <Dialog isOpen={qrDialogOpen} onClose={() => setQrDialogOpen(false)} onRequestClose={() => setQrDialogOpen(false)}>
                <div className="flex flex-col items-center text-center py-4">
                    <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center mb-4">
                        <PiQrCodeDuotone className="text-3xl text-indigo-500" />
                    </div>
                    <h5 className="font-bold mb-2">{t('qr.title')}</h5>
                    <p className="text-gray-500 text-sm mb-4">{t('qr.subtitle')}</p>
                    {qrLoading ? (
                        <div className="flex items-center justify-center h-48">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                        </div>
                    ) : qrToken ? (
                        <div className="bg-white p-4 rounded-2xl shadow-inner border border-gray-100">
                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrToken)}`}
                                alt="QR Code" width={200} height={200} />
                        </div>
                    ) : (
                        <p className="text-gray-400 text-sm">{t('qr.unavailable')}</p>
                    )}
                    <Button className="mt-6" variant="solid" onClick={() => setQrDialogOpen(false)}>{t('qr.close')}</Button>
                </div>
            </Dialog>

            {/* Cancel Dialog */}
            <Dialog isOpen={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} onRequestClose={() => setCancelDialogOpen(false)}>
                <div className="flex flex-col items-center text-center py-4">
                    <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center mb-4">
                        <PiWarningDuotone className="text-3xl text-red-500" />
                    </div>
                    <h5 className="font-bold mb-2">{t('cancelDialog.title')}</h5>
                    <p className="text-gray-500 text-sm mb-6 max-w-xs">{t('cancelDialog.description')}</p>
                    <div className="flex gap-3 w-full">
                        <Button className="flex-1" onClick={() => setCancelDialogOpen(false)}>
                            {t('cancelDialog.keepBtn')}
                        </Button>
                        <Button className="flex-1" variant="solid" loading={cancelMutation.isPending}
                            customColorClass={() => 'bg-red-500 hover:bg-red-600 active:bg-red-600 text-white'}
                            onClick={handleConfirmCancel}>
                            {cancelMutation.isPending ? t('cancelDialog.cancellingBtn') : t('cancelDialog.confirmBtn')}
                        </Button>
                    </div>
                </div>
            </Dialog>
        </div>
    )
}

export default MyReservationsClient

