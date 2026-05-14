'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import {
    PiXBold,
    PiClockDuotone,
    PiCarDuotone,
    PiCalendarDuotone,
    PiCheckCircleFill,
} from 'react-icons/pi'

const ReservationModal = ({ parking, slots, reserving, onReserve, onClose, defaultVehiclePlate = '' }) => {
    const t = useTranslations('parkingMap.modal')
    const [selectedSlot, setSelectedSlot] = useState(null)
    const [startTime, setStartTime] = useState('')
    const [endTime, setEndTime] = useState('')
    const [vehiclePlate, setVehiclePlate] = useState(defaultVehiclePlate || '')

    useEffect(() => {
        if (defaultVehiclePlate) {
            setVehiclePlate(defaultVehiclePlate)
        }
    }, [defaultVehiclePlate])

    // Set default times to now + 1 hour
    useState(() => {
        const now = new Date()
        const start = new Date(now.getTime() + 30 * 60000) // +30 min
        const end = new Date(now.getTime() + 90 * 60000) // +1.5 hours

        const formatDateTime = (date) => {
            const pad = (n) => String(n).padStart(2, '0')
            return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
        }

        setStartTime(formatDateTime(start))
        setEndTime(formatDateTime(end))
    })

    const handleSubmit = () => {
        if (!selectedSlot || !startTime || !endTime) return
        onReserve(selectedSlot, startTime + ':00', endTime + ':00', vehiclePlate)
    }

    const isValid = selectedSlot && startTime && endTime && startTime < endTime && vehiclePlate.trim().length > 0

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative w-full sm:max-w-md bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[85vh] overflow-y-auto"
            >
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-700 z-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white">{t('title')}</h3>
                            <p className="text-sm text-gray-400 mt-0.5">{parking.name}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            <PiXBold className="text-gray-500 text-sm" />
                        </button>
                    </div>
                </div>

                <div className="px-6 py-5 space-y-5">
                    {/* Slot selection */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                            <PiCarDuotone className="text-indigo-500" />
                            {t('selectSlot')}
                        </label>
                        {slots.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-4">{t('noSlots')}</p>
                        ) : (
                            <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
                                {slots.map((slot) => (
                                    <motion.button
                                        key={slot.id}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setSelectedSlot(slot.id)}
                                        className={`relative p-3 rounded-xl border-2 transition-all duration-200 ${
                                            selectedSlot === slot.id
                                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                                                : 'border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500'
                                        }`}
                                    >
                                        {selectedSlot === slot.id && (
                                            <PiCheckCircleFill className="absolute top-1 right-1 text-indigo-500 text-sm" />
                                        )}
                                        <p className="font-bold text-sm text-gray-800 dark:text-gray-200">{slot.slotNumber}</p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">
                                            {slot.slotType} • F{slot.floor}
                                        </p>
                                    </motion.button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Time selection */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                            <PiCalendarDuotone className="text-indigo-500" />
                            {t('selectTime')}
                        </label>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">{t('startTime')}</label>
                                <input
                                    type="datetime-local"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">{t('endTime')}</label>
                                <input
                                    type="datetime-local"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                                />
                            </div>
                        </div>

                        {/* Price estimate */}
                        {startTime && endTime && startTime < endTime && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/20 rounded-xl px-4 py-3"
                            >
                                <div className="flex items-center gap-2">
                                    <PiClockDuotone className="text-indigo-500" />
                                    <span className="text-sm text-gray-600 dark:text-gray-300">{t('estimatedCost')}</span>
                                </div>
                                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                    {(
                                        ((new Date(endTime) - new Date(startTime)) / 3600000) *
                                        parking.pricePerHour
                                    ).toFixed(2)}{' '}
                                    MAD
                                </span>
                            </motion.div>
                        )}
                    </div>

                    {/* Vehicle plate */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                            <PiCarDuotone className="text-indigo-500" />
                            {t('plateLabel')} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={vehiclePlate}
                            onChange={(e) => setVehiclePlate(e.target.value)}
                            placeholder={t('platePlaceholder')}
                            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                        />
                        <p className="text-[11px] text-gray-400">
                            {t('plateHint')}
                        </p>
                    </div>

                    {/* Reserve button */}
                    <motion.button
                        whileHover={isValid ? { scale: 1.02 } : {}}
                        whileTap={isValid ? { scale: 0.98 } : {}}
                        onClick={handleSubmit}
                        disabled={!isValid || reserving}
                        className={`w-full py-4 rounded-2xl font-bold text-sm transition-all duration-200 ${
                            isValid && !reserving
                                ? 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                        {reserving ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        fill="none"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                </svg>
                                {t('reserving')}
                            </span>
                        ) : (
                            t('confirm')
                        )}
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>
    )
}

export default ReservationModal

