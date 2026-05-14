'use client'
import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import { apiGetParkingById } from '@/services/ParkingService'
import { apiCreateReservation } from '@/services/ReservationService'
import { apiGetWalletBalance } from '@/services/WalletService'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Input from '@/components/ui/Input'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
    PiArrowLeftBold,
    PiCarDuotone,
    PiCurrencyDollarDuotone,
    PiWalletDuotone,
    PiWarningDuotone,
} from 'react-icons/pi'
import logger from '@/utils/logger'
import { useUserProfile } from '@/hooks/useUserProfile'

// Dynamic import — only load the heavy 3D bundle on this page
const ParkingScene = dynamic(() => import('@/components/parking/parking3d/ParkingScene'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-dvh bg-gray-900 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <div className="text-4xl animate-pulse">🏗️</div>
                <p className="text-xs text-gray-400 font-semibold">Loading 3D Digital Twin…</p>
            </div>
        </div>
    ),
})

const DigitalTwinClient = ({ parkingId }) => {
    const router = useRouter()
    const t = useTranslations('parkings.digitalTwin')
    const { data: profileUser } = useUserProfile()
    const [parking, setParking] = useState(null)
    const [loading, setLoading] = useState(true)
    const [selectedSlot, setSelectedSlot] = useState(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [startTime, setStartTime] = useState('')
    const [endTime, setEndTime] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [walletBalance, setWalletBalance] = useState(0)
    const [vehiclePlate, setVehiclePlate] = useState('')

    const fetchData = useCallback(async () => {
        try {
            const [parkingRes, walletRes] = await Promise.all([
                apiGetParkingById(parkingId),
                apiGetWalletBalance().catch(() => ({ data: { balance: 0 } })),
            ])
            setParking(parkingRes?.data || null)
            setWalletBalance(walletRes?.data?.balance || 0)
        } catch (error) {
            logger.error('Failed to load parking details', error)
        } finally {
            setLoading(false)
        }
    }, [parkingId])

    useEffect(() => {
        fetchData()
    }, [fetchData])

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
            await apiCreateReservation({
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

    if (loading) {
        return (
            <div className="w-full h-dvh bg-gray-900 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="text-4xl animate-pulse">🏗️</div>
                    <p className="text-xs text-gray-400 font-semibold">{t('loading')}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="relative w-full h-dvh">
            {/* Back button overlay */}
            <div className="absolute top-4 left-4 z-50">
                <Button
                    variant="solid"
                    onClick={() => router.push(`/parkings/${parkingId}`)}
                    className="!rounded-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-lg border border-gray-200/60 dark:border-gray-700/50 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                    <PiArrowLeftBold className="mr-1.5" />
                    {t('back')}
                </Button>
            </div>

            {/* Parking name overlay */}
            {parking && (
                <div className="absolute top-4 left-16 sm:left-1/2 sm:-translate-x-1/2 right-4 sm:right-auto z-50">
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl px-3 sm:px-4 py-2 shadow-lg border border-gray-200/60 dark:border-gray-700/50"
                    >
                        <h3 className="text-xs sm:text-sm font-bold text-center truncate">{parking.name}</h3>
                        <p className="text-[10px] text-gray-400 text-center truncate">{parking.address}</p>
                    </motion.div>
                </div>
            )}

            {/* Full-screen 3D scene */}
            <ParkingScene
                parking={parking}
                parkingId={parkingId}
                onReserve={handleSlotReserve}
                onBack={() => router.push(`/parkings/${parkingId}`)}
                fullscreen
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

                            <div>
                                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                                    {t('vehiclePlate')} <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    type="text"
                                    value={vehiclePlate}
                                    onChange={(e) => setVehiclePlate(e.target.value)}
                                    placeholder="12345-A-23"
                                />
                                <p className="text-[11px] text-gray-400 mt-1">{t('vehiclePlateHint')}</p>
                            </div>

                            <div className="flex flex-col gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 mb-1 block">{t('startTime')}</label>
                                    <Input
                                        type="datetime-local"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 mb-1 block">{t('endTime')}</label>
                                    <Input
                                        type="datetime-local"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                    />
                                </div>
                            </div>

                            {estimatedCost > 0 && (
                                <div className="bg-primary/5 rounded-xl p-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <PiCurrencyDollarDuotone className="text-lg text-primary" />
                                        <span className="text-sm font-semibold">{t('estimatedCost')}</span>
                                    </div>
                                    <span className="text-lg font-bold text-primary">{estimatedCost} MAD</span>
                                </div>
                            )}

                            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <PiWalletDuotone className="text-lg text-emerald-500" />
                                    <span className="text-sm">{t('walletBalance')}</span>
                                </div>
                                <span className="font-bold">{walletBalance} MAD</span>
                            </div>

                            {walletBalance < estimatedCost && estimatedCost > 0 && (
                                <div className="bg-red-50 dark:bg-red-500/10 rounded-xl p-3 flex items-center gap-2">
                                    <PiWarningDuotone className="text-red-500" />
                                    <span className="text-xs text-red-500 font-medium">
                                        {t('insufficient')}
                                    </span>
                                </div>
                            )}

                            <div className="flex gap-3 justify-end">
                                <Button variant="plain" onClick={() => setDialogOpen(false)}>
                                    {t('cancel')}
                                </Button>
                                <Button
                                    variant="solid"
                                    loading={submitting}
                                    onClick={handleReserve}
                                    disabled={!startTime || !endTime || !plateOk || walletBalance < estimatedCost}
                                >
                                    {t('confirmReservation')}
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Dialog>
        </div>
    )
}

export default DigitalTwinClient


