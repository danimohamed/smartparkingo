'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { PiMapPinDuotone, PiStarFill, PiCurrencyDollarBold, PiCarDuotone } from 'react-icons/pi'
import { formatDistance } from './utils'

const ParkingList = ({ parkings, selectedParking, nearestParking, onSelect }) => {
    const t = useTranslations('parkingMap.list')
    return (
        <div className="overflow-x-auto flex gap-3 px-4 pb-4 scrollbar-hide">
            {parkings.length === 0 ? (
                <div className="flex items-center justify-center w-full py-8">
                    <p className="text-sm text-gray-400">{t('empty')}</p>
                </div>
            ) : (
                parkings.map((parking, index) => {
                    const isNearest = nearestParking && parking.id === nearestParking.id
                    const isSelected = selectedParking && parking.id === selectedParking.id

                    return (
                        <motion.div
                            key={parking.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => onSelect(parking)}
                            className={`flex-shrink-0 w-64 cursor-pointer rounded-2xl p-4 transition-all duration-300 border-2 ${
                                isSelected
                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-lg shadow-indigo-500/20'
                                    : isNearest
                                    ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 shadow-lg shadow-emerald-500/20'
                                    : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-md'
                            }`}
                        >
                            {/* Nearest badge */}
                            {isNearest && (
                                <div className="flex items-center gap-1 mb-2">
                                    <span className="px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                                        {t('nearest')}
                                    </span>
                                </div>
                            )}

                            <div className="flex items-start justify-between mb-2">
                                <h5 className="font-bold text-sm text-gray-800 dark:text-gray-200 line-clamp-1 flex-1">
                                    {parking.name}
                                </h5>
                                <div className="flex items-center gap-0.5 ml-2 flex-shrink-0">
                                    <PiStarFill className="text-amber-400 text-xs" />
                                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                                        {parking.rating}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                <div className="flex items-center gap-1">
                                    <PiMapPinDuotone className="text-blue-500" />
                                    <span className="font-medium">{formatDistance(parking.distance)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <PiCurrencyDollarBold className="text-amber-500" />
                                    <span className="font-medium">{parking.pricePerHour} MAD/h</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <PiCarDuotone className={`${(parking.availableSlots || 0) > 0 ? 'text-emerald-500' : 'text-red-400'}`} />
                                    <span className={`font-bold ${(parking.availableSlots || 0) > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                                        {parking.availableSlots || 0}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    )
                })
            )}
        </div>
    )
}

export default ParkingList

