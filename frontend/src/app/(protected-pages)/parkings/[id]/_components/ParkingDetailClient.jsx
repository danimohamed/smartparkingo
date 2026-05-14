'use client'
import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { apiGetParkingById } from '@/services/ParkingService'
import { apiGetSlotsByParking } from '@/services/ParkingSlotService'
import { apiCreateReservation } from '@/services/ReservationService'
import { apiGetWalletBalance } from '@/services/WalletService'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Input from '@/components/ui/Input'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import ParkingLayout from '@/components/parking/ParkingLayout'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import logger from '@/utils/logger'
import { useUserProfile } from '@/hooks/useUserProfile'
import {
    PiCarDuotone,
    PiMapPinDuotone,
    PiArrowLeftBold,
    PiCurrencyDollarDuotone,
    PiWalletDuotone,
    PiWarningDuotone,
    PiShieldCheckDuotone,
    PiTagDuotone,
    PiQrCodeDuotone,
} from 'react-icons/pi'
import { apiGetReservationQr } from '@/services/ReservationService'

const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', stiffness: 300, damping: 25 },
    },
}

const parkingInfoVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            type: 'spring',
            stiffness: 200,
            damping: 20,
            delay: 0.1,
        },
    },
}

const ParkingDetailClient = ({ parkingId }) => {
    const router = useRouter()
    const t = useTranslations('parkings.detail')
    const { data: profileUser } = useUserProfile()
    const [parking, setParking] = useState(null)
    const [slots, setSlots] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedSlot, setSelectedSlot] = useState(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [startTime, setStartTime] = useState('')
    const [endTime, setEndTime] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [walletBalance, setWalletBalance] = useState(0)
    const [qrDialogOpen, setQrDialogOpen] = useState(false)
    const [qrToken, setQrToken] = useState(null)
    const [qrLoading, setQrLoading] = useState(false)
    const [vehiclePlate, setVehiclePlate] = useState('')

    const unwrapApiData = (res) => {
        // Our backend usually returns { success, message, data }, but some callers/environments
        // may already hand us the raw payload. Accept both to avoid false "not found".
        return res?.data ?? res
    }

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            // Always try to load the parking first so we don't show a false "not found"
            const parkingRes = await apiGetParkingById(parkingId)
            const parkingPayload = unwrapApiData(parkingRes)
            setParking(parkingPayload?.id ? parkingPayload : null)
        } catch (error) {
            logger.error('Failed to load parking', error)
            setParking(null)
        }

        // Slots and wallet are best-effort (slots can be public/secured depending on env)
        try {
            const slotsRes = await apiGetSlotsByParking(parkingId)
            const slotsPayload = unwrapApiData(slotsRes)
            setSlots(Array.isArray(slotsPayload) ? slotsPayload : [])
        } catch (error) {
            logger.error('Failed to load parking slots', error)
            setSlots([])
        }

        try {
            const walletRes = await apiGetWalletBalance()
            const walletPayload = unwrapApiData(walletRes)
            setWalletBalance(walletPayload?.balance || 0)
        } catch (_) {
            setWalletBalance(0)
        }

        setLoading(false)
    }, [parkingId])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    // Auto-refresh slots every 30 seconds for real-time updates
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const slotsRes = await apiGetSlotsByParking(parkingId)
                const slotsPayload = unwrapApiData(slotsRes)
                setSlots(Array.isArray(slotsPayload) ? slotsPayload : [])
            } catch (_) {
                // silent fail on background refresh
            }
        }, 30000)
        return () => clearInterval(interval)
    }, [parkingId])

    const handleSlotReserve = (slot) => {
        setSelectedSlot(slot)
        const now = new Date()
        const start = new Date(now.getTime() + 60 * 60 * 1000)
        const end = new Date(start.getTime() + 60 * 60 * 1000)
        setStartTime(formatDateTimeLocal(start))
        setEndTime(formatDateTimeLocal(end))
        setVehiclePlate(profileUser?.defaultVehiclePlate || '')
        setDialogOpen(true)
    }

    const formatDateTimeLocal = (date) => {
        const pad = (n) => String(n).padStart(2, '0')
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
    }

    const estimatedCost =
        startTime && endTime
            ? Math.max(1, Math.ceil((new Date(endTime) - new Date(startTime)) / (1000 * 60 * 60))) *
              (parking?.pricePerHour || 0)
            : 0

    const plateOk = vehiclePlate.trim().length >= 4

    const handleReserve = async () => {
        if (!startTime || !endTime || !plateOk) return
        setSubmitting(true)
        try {
            const res = await apiCreateReservation({
                parkingSlotId: selectedSlot.id,
                startTime: startTime + ':00',
                endTime: endTime + ':00',
                vehiclePlate: vehiclePlate.trim(),
            })
            toast.push(
                <Notification title={t('toast.createdTitle')} type="success">
                    {t('toast.createdMsg', { slot: selectedSlot.slotNumber, amount: estimatedCost })}
                </Notification>,
            )
            setDialogOpen(false)

            const reservationId = res?.data?.id
            if (reservationId) {
                setQrLoading(true)
                setQrDialogOpen(true)
                try {
                    const qrRes = await apiGetReservationQr(reservationId)
                    setQrToken(qrRes?.data?.qrData || null)
                } catch (_) {
                    setQrToken(null)
                } finally {
                    setQrLoading(false)
                }
            }

            const [slotsRes, walletRes] = await Promise.all([
                apiGetSlotsByParking(parkingId),
                apiGetWalletBalance().catch(() => ({ data: { balance: 0 } })),
            ])
            setSlots(slotsRes?.data || [])
            setWalletBalance(walletRes?.data?.balance || 0)
        } catch (error) {
            toast.push(
                <Notification title={t('toast.failedTitle')} type="danger">
                    {error?.response?.data?.message || t('toast.failedDefault')}
                </Notification>,
            )
        } finally {
            setSubmitting(false)
        }
    }

    // Loading skeleton
    if (loading) {
        return (
            <div className="flex flex-col gap-6">
                <Button
                    variant="plain"
                    size="sm"
                    className="self-start"
                    onClick={() => router.push('/parkings')}
                >
                    <PiArrowLeftBold className="mr-1" /> {t('back')}
                </Button>
                <ParkingLayout parking={null} slots={[]} loading={true} />
            </div>
        )
    }

    // Not found
    if (!parking) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
            >
                <Card>
                    <div className="text-center py-16">
                        <motion.div
                            animate={{ rotate: [0, -10, 10, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <PiCarDuotone className="text-7xl text-gray-300 mx-auto" />
                        </motion.div>
                        <p className="text-gray-400 mt-4 text-lg">{t('notFound')}</p>
                        <Button className="mt-6" variant="solid" onClick={() => router.push('/parkings')}>
                            {t('back')}
                        </Button>
                    </div>
                </Card>
            </motion.div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Back Button */}
            <motion.div
                variants={headerVariants}
                initial="hidden"
                animate="visible"
            >
                <Button
                    variant="plain"
                    size="sm"
                    className="self-start"
                    onClick={() => router.push('/parkings')}
                >
                    <PiArrowLeftBold className="mr-1" /> {t('back')}
                </Button>
            </motion.div>

            {/* Parking Header */}
            <motion.div
                variants={parkingInfoVariants}
                initial="hidden"
                animate="visible"
            >
                <div className="bg-gradient-to-r from-primary/5 via-white to-emerald-50 dark:from-primary/10 dark:via-gray-800 dark:to-emerald-500/5 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <motion.div
                                initial={{ rotate: -180, scale: 0 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                                className="bg-primary/10 rounded-2xl p-4 shadow-sm"
                            >
                                <PiCarDuotone className="text-3xl text-primary" />
                            </motion.div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-xl">{parking.name}</h3>
                                    {parking.pricingTier && (
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                            parking.pricingTier === 'PREMIUM' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                                            parking.pricingTier === 'ECONOMY' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                                            'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
                                        }`}>{parking.pricingTier}</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 text-gray-500 mt-1">
                                    <PiMapPinDuotone />
                                    <span className="text-sm">{parking.address}</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-gray-500">
                                    <span className="font-semibold text-primary">{parking.pricePerHour} MAD/h</span>
                                    {parking.dailyCapPrice > 0 && (
                                        <span className="flex items-center gap-1">
                                            <PiTagDuotone className="text-amber-500" />
                                            {t('dailyCap', { amount: parking.dailyCapPrice })}
                                        </span>
                                    )}
                                </div>
                                {parking.guardName && (
                                    <div className="flex items-center gap-1.5 mt-1.5 text-sm text-gray-500">
                                        <PiShieldCheckDuotone className="text-indigo-500" />
                                        <span>{parking.guardName}</span>
                                        {parking.guardPhone && <span className="text-gray-400">· {parking.guardPhone}</span>}
                                    </div>
                                )}
                                {parking.description && (
                                    <p className="text-gray-400 text-sm mt-1">{parking.description}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>


            {/* Interactive Parking Layout */}
            <ParkingLayout
                parking={parking}
                slots={slots}
                loading={false}
                onReserve={handleSlotReserve}
            />

            {/* Reservation Dialog */}
            <Dialog
                isOpen={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onRequestClose={() => setDialogOpen(false)}
            >
                <AnimatePresence>
                    {dialogOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="flex flex-col gap-4"
                        >
                            <h5 className="font-bold text-lg">
                                {t('reserveSlot', { slot: selectedSlot?.slotNumber || '' })}
                            </h5>

                            <div className="flex items-center gap-2 text-gray-500">
                                <PiCarDuotone />
                                <span>
                                    {parking?.name} — {selectedSlot?.slotType}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 text-gray-500">
                                <PiCurrencyDollarDuotone />
                                <span>{t('perHour', { price: parking?.pricePerHour })}</span>
                            </div>

                            {/* Wallet Balance */}
                            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-500/10 rounded-xl px-4 py-3">
                                <PiWalletDuotone className="text-blue-500 text-lg" />
                                <span className="text-sm text-blue-700 dark:text-blue-400">
                                    {t('walletBalance')}
                                </span>
                                <span className="font-bold text-blue-700 dark:text-blue-400 ml-auto">
                                    {walletBalance.toFixed(2)} MAD
                                </span>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-1">
                                    {t('vehiclePlate')} <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    type="text"
                                    value={vehiclePlate}
                                    onChange={(e) => setVehiclePlate(e.target.value)}
                                    placeholder="12345-A-23"
                                />
                                <p className="text-xs text-gray-400 mt-1">{t('vehiclePlateHint')}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-1">
                                    {t('startTime')}
                                </label>
                                <Input
                                    type="datetime-local"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-1">
                                    {t('endTime')}
                                </label>
                                <Input
                                    type="datetime-local"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                />
                            </div>

                            {startTime &&
                                endTime &&
                                (() => {
                                    const cost =
                                        Math.max(
                                            1,
                                            Math.ceil(
                                                (new Date(endTime) - new Date(startTime)) /
                                                    (1000 * 60 * 60),
                                            ),
                                        ) * (parking?.pricePerHour || 0)
                                    const insufficient = walletBalance < cost
                                    return (
                                        <div className="space-y-3">
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4"
                                            >
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">{t('totalCost')}</span>
                                                    <span className="font-bold text-primary text-lg">
                                                        {cost} MAD
                                                    </span>
                                                </div>
                                                <div className="flex justify-between mt-2">
                                                    <span className="text-gray-500 text-sm">
                                                        {t('balanceAfter')}
                                                    </span>
                                                    <span
                                                        className={`font-bold text-sm ${
                                                            insufficient
                                                                ? 'text-red-500'
                                                                : 'text-emerald-500'
                                                        }`}
                                                    >
                                                        {(walletBalance - cost).toFixed(2)} MAD
                                                    </span>
                                                </div>
                                            </motion.div>
                                            {insufficient && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="flex items-center gap-2 bg-red-50 dark:bg-red-500/10 rounded-xl px-4 py-3"
                                                >
                                                    <PiWarningDuotone className="text-red-500" />
                                                    <span className="text-sm text-red-600 dark:text-red-400">
                                                        {t('insufficient')}{' '}
                                                        <a
                                                            href="/my-wallet"
                                                            className="underline font-semibold"
                                                        >
                                                            {t('topUpFirst')}
                                                        </a>
                                                        {t('first')}
                                                    </span>
                                                </motion.div>
                                            )}
                                        </div>
                                    )
                                })()}

                            <div className="flex gap-2 justify-end mt-2">
                                <Button onClick={() => setDialogOpen(false)}>{t('cancel')}</Button>
                                <Button
                                    variant="solid"
                                    loading={submitting}
                                    onClick={handleReserve}
                                    disabled={
                                        submitting ||
                                        !plateOk ||
                                        (startTime &&
                                            endTime &&
                                            walletBalance <
                                                Math.max(
                                                    1,
                                                    Math.ceil(
                                                        (new Date(endTime) - new Date(startTime)) /
                                                            (1000 * 60 * 60),
                                                    ),
                                                ) *
                                                    (parking?.pricePerHour || 0))
                                    }
                                >
                                    {submitting ? t('reserving') : t('payAndReserve')}
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Dialog>

            {/* QR Code Dialog */}
            <Dialog
                isOpen={qrDialogOpen}
                onClose={() => setQrDialogOpen(false)}
                onRequestClose={() => setQrDialogOpen(false)}
            >
                <div className="flex flex-col items-center text-center py-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center mb-4">
                        <PiQrCodeDuotone className="text-3xl text-emerald-500" />
                    </div>
                    <h5 className="font-bold mb-2">{t('qrTitle')}</h5>
                    <p className="text-gray-500 text-sm mb-4">
                        {t('qrSubtitle')}
                    </p>
                    {qrLoading ? (
                        <div className="flex items-center justify-center h-48">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                        </div>
                    ) : qrToken ? (
                        <div className="bg-white p-4 rounded-2xl shadow-inner border border-gray-100">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrToken)}`}
                                alt="Reservation QR Code"
                                width={200}
                                height={200}
                            />
                        </div>
                    ) : (
                        <p className="text-gray-400 text-sm">{t('qrUnavailable')}</p>
                    )}
                    <Button
                        className="mt-6"
                        variant="solid"
                        onClick={() => setQrDialogOpen(false)}
                    >
                        {t('done')}
                    </Button>
                </div>
            </Dialog>
        </div>
    )
}

export default ParkingDetailClient
