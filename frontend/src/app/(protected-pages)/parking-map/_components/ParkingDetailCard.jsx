'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import {
    PiMapPinDuotone,
    PiStarFill,
    PiCarDuotone,
    PiCurrencyDollarBold,
    PiXBold,
    PiNavigationArrowFill,
    PiBuildingsDuotone,
    PiTreeDuotone,
    PiBatteryChargingDuotone,
    PiShieldCheckDuotone,
} from 'react-icons/pi'
import { formatDistance } from './utils'

const typeIcons = {
    Covered: PiBuildingsDuotone,
    Outdoor: PiTreeDuotone,
    'EV Charging': PiBatteryChargingDuotone,
}

const ParkingDetailCard = ({ parking, slotsLoading, onReserve, onNavigate, onClose }) => {
    const t = useTranslations('parkingMap.detail')
    const TypeIcon = typeIcons[parking.parkingType] || PiCarDuotone
    const hasSlots = (parking.availableSlots || 0) > 0

    return (
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* Header with gradient */}
            <div className="relative bg-gradient-to-r from-indigo-500 to-blue-500 px-5 py-4">
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                >
                    <PiXBold className="text-white text-sm" />
                </button>

                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                        <TypeIcon className="text-white text-2xl" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white text-lg leading-tight truncate">{parking.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-0.5">
                                <PiStarFill className="text-amber-300 text-xs" />
                                <span className="text-white/90 text-xs font-medium">{parking.rating}</span>
                            </div>
                            <span className="text-white/50">•</span>
                            <span className="text-white/80 text-xs">{parking.parkingType}</span>
                            {parking.pricingTier && (
                                <>
                                    <span className="text-white/50">•</span>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                        parking.pricingTier === 'PREMIUM' ? 'bg-amber-400/30 text-amber-200' :
                                        parking.pricingTier === 'ECONOMY' ? 'bg-emerald-400/30 text-emerald-200' :
                                        'bg-white/20 text-white/90'
                                    }`}>{parking.pricingTier}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Details */}
            <div className="px-5 py-4 space-y-4">
                {/* Address */}
                <div className="flex items-start gap-2">
                    <PiMapPinDuotone className="text-gray-400 text-lg flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-snug">
                        {parking.address || t('addressUnavailable')}
                    </p>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 text-center">
                        <PiNavigationArrowFill className="text-blue-500 text-lg mx-auto mb-1" />
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('distance')}</p>
                        <p className="font-bold text-sm text-gray-800 dark:text-gray-200">
                            {parking.distance ? formatDistance(parking.distance) : '--'}
                        </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 text-center">
                        <PiCarDuotone className={`text-lg mx-auto mb-1 ${hasSlots ? 'text-emerald-500' : 'text-red-400'}`} />
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('available')}</p>
                        <p className={`font-bold text-sm ${hasSlots ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                            {slotsLoading ? '...' : `${parking.availableSlots || 0}/${parking.totalSlots || 0}`}
                        </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 text-center">
                        <PiCurrencyDollarBold className="text-amber-500 text-lg mx-auto mb-1" />
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('pricePerHour')}</p>
                        <p className="font-bold text-sm text-gray-800 dark:text-gray-200">
                            {parking.pricePerHour} MAD
                        </p>
                    </div>
                </div>

                {/* Guard */}
                {parking.guardName && (
                    <div className="flex items-center gap-2 text-sm">
                        <PiShieldCheckDuotone className="text-indigo-500" />
                        <span className="text-gray-600 dark:text-gray-300">{parking.guardName}</span>
                        {parking.guardPhone && <span className="text-gray-400 text-xs">{parking.guardPhone}</span>}
                    </div>
                )}

                {/* Description */}
                {parking.description && (
                    <p className="text-xs text-gray-400 leading-relaxed">{parking.description}</p>
                )}

                {/* Action buttons */}
                <div className="flex gap-3">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onNavigate}
                        className="flex-1 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 flex items-center justify-center gap-2"
                    >
                        <PiNavigationArrowFill className="text-base" />
                        {t('navigate')}
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onReserve}
                        disabled={!hasSlots}
                        className={`flex-1 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 ${
                            hasSlots
                                ? 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                        {hasSlots ? t('reserve') : t('full')}
                    </motion.button>
                </div>
            </div>
        </div>
    )
}

export default ParkingDetailCard



