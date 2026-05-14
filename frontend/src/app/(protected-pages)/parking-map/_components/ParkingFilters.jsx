'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { PiMapPinDuotone, PiCurrencyDollarBold, PiCarDuotone, PiBatteryChargingDuotone, PiBuildingsDuotone, PiTreeDuotone } from 'react-icons/pi'

const distanceOptions = [
    { value: 1, label: '1 km' },
    { value: 3, label: '3 km' },
    { value: 5, label: '5 km' },
    { value: 10, label: '10 km' },
]

const ParkingFilters = ({ filters, onFilterChange }) => {
    const t = useTranslations('parkingMap.filters')

    const typeOptions = [
        { value: 'all', label: t('allTypes'), icon: PiCarDuotone },
        { value: 'Covered', label: t('covered'), icon: PiBuildingsDuotone },
        { value: 'Outdoor', label: t('outdoor'), icon: PiTreeDuotone },
        { value: 'EV Charging', label: t('ev'), icon: PiBatteryChargingDuotone },
    ]

    const updateFilter = (key, value) => {
        onFilterChange({ ...filters, [key]: value })
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex items-center gap-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 px-3 py-2 overflow-x-auto scrollbar-hide max-w-full"
        >
            {/* Distance */}
            <PiMapPinDuotone className="text-blue-500 text-base flex-shrink-0" />
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
                {distanceOptions.map((opt) => (
                    <button
                        key={opt.value}
                        onClick={() => updateFilter('distance', opt.value)}
                        className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-all ${
                            filters.distance === opt.value
                                ? 'bg-blue-500 text-white shadow-sm'
                                : 'text-gray-500 dark:text-gray-400'
                        }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            <div className="w-px h-5 bg-gray-200 dark:bg-gray-600" />

            {/* Type */}
            {typeOptions.map((opt) => {
                const Icon = opt.icon
                return (
                    <button
                        key={opt.value}
                        onClick={() => updateFilter('parkingType', opt.value)}
                        className={`flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-lg transition-all ${
                            filters.parkingType === opt.value
                                ? 'bg-indigo-500 text-white shadow-sm'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                        }`}
                    >
                        <Icon className="text-xs" />
                        {opt.label}
                    </button>
                )
            })}

            <div className="w-px h-5 bg-gray-200 dark:bg-gray-600" />

            {/* Available */}
            <button
                onClick={() => updateFilter('availableOnly', !filters.availableOnly)}
                className={`flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-lg transition-all ${
                    filters.availableOnly
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}
            >
                <span className={`w-1.5 h-1.5 rounded-full ${filters.availableOnly ? 'bg-white' : 'bg-emerald-400'}`} />
                {t('available')}
            </button>

            <div className="w-px h-5 bg-gray-200 dark:bg-gray-600" />

            {/* Price */}
            <PiCurrencyDollarBold className="text-amber-500 text-sm" />
            <input
                type="range"
                min={0}
                max={100}
                value={filters.priceMax}
                onChange={(e) => updateFilter('priceMax', Number(e.target.value))}
                className="w-16 h-1 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-300 whitespace-nowrap">
                {t('priceMax', { price: filters.priceMax })}
            </span>
        </motion.div>
    )
}

export default ParkingFilters

