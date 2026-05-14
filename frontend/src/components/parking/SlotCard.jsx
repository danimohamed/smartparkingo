'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'

const statusConfig = {
    AVAILABLE: { bg: 'bg-emerald-500', hoverBg: 'hover:bg-emerald-400', glow: 'shadow-emerald-500/50', ring: 'ring-emerald-400', pulse: true },
    OCCUPIED: { bg: 'bg-red-500', hoverBg: '', glow: 'shadow-red-500/30', ring: 'ring-red-400', pulse: false },
    RESERVED: { bg: 'bg-amber-500', hoverBg: '', glow: 'shadow-amber-500/30', ring: 'ring-amber-400', pulse: false },
    MAINTENANCE: { bg: 'bg-gray-400', hoverBg: '', glow: 'shadow-gray-400/30', ring: 'ring-gray-400', pulse: false },
}

const slotTypeIcons = {
    STANDARD: '🅿️',
    HANDICAPPED: '♿',
    VIP: '⭐',
    ELECTRIC: '⚡',
}

const slotVariant = {
    hidden: { opacity: 0, scale: 0.6, y: 20 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { type: 'spring', stiffness: 300, damping: 24 },
    },
    exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
}

const tooltipVariants = {
    hidden: { opacity: 0, y: 8, scale: 0.9 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.15 } },
    exit: { opacity: 0, y: 8, scale: 0.9, transition: { duration: 0.1 } },
}

const SlotCard = ({ slot, isSelected, onClick }) => {
    const [hovered, setHovered] = useState(false)
    const t = useTranslations('parkingLot')
    const config = statusConfig[slot.status] || statusConfig.MAINTENANCE
    const slotType = slot.slotType in slotTypeIcons ? slot.slotType : 'STANDARD'
    const typeIcon = slotTypeIcons[slotType]
    const typeLabel = t(`type.${slotType}`)
    const statusLabel = t(`status.${slot.status}`)
    const isAvailable = slot.status === 'AVAILABLE'

    return (
        <motion.div
            variants={slotVariant}
            layout
            className="relative"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <motion.div
                onClick={() => isAvailable && onClick?.(slot)}
                whileHover={isAvailable ? { scale: 1.12, zIndex: 10 } : { scale: 1.02 }}
                whileTap={isAvailable ? { scale: 0.95 } : {}}
                animate={
                    isSelected
                        ? {
                              scale: 1.08,
                              boxShadow: '0 0 24px 6px rgba(16, 185, 129, 0.45)',
                          }
                        : {}
                }
                className={classNames(
                    'relative rounded-xl sm:rounded-2xl p-2 sm:p-3 text-center text-white shadow-sm ring-1 ring-white/10 transition-colors duration-500 select-none',
                    config.bg,
                    isAvailable && config.hoverBg,
                    isAvailable ? 'cursor-pointer' : 'cursor-default opacity-80',
                    isSelected && `ring-3 ${config.ring} ring-offset-2 ring-offset-white dark:ring-offset-gray-900`,
                    hovered && isAvailable && `shadow-lg ${config.glow}`,
                )}
                style={{ minHeight: 80 }}
            >
                {/* Pulse ring for available slots */}
                {config.pulse && !isSelected && (
                    <motion.div
                        className="absolute inset-0 rounded-2xl border-2 border-emerald-400"
                        animate={{
                            scale: [1, 1.08, 1],
                            opacity: [0.6, 0, 0.6],
                        }}
                        transition={{
                            duration: 2.5,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    />
                )}

                {/* Slot type icon */}
                <div className="text-2xl leading-none mb-1 drop-shadow-sm">
                    {typeIcon}
                </div>

                {/* Slot number */}
                <div className="font-bold text-sm tracking-wide drop-shadow-sm">
                    {slot.slotNumber}
                </div>

                {/* Slot type label */}
                <div className="text-[10px] uppercase tracking-widest opacity-70 mt-0.5">
                    {typeLabel}
                </div>

                {/* Selected indicator */}
                {isSelected && (
                    <motion.div
                        layoutId="selected-indicator"
                        className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-lg"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    >
                        <span className="text-emerald-600 text-xs font-bold">✓</span>
                    </motion.div>
                )}
            </motion.div>

            {/* Tooltip on hover */}
            <AnimatePresence>
                {hovered && (
                    <motion.div
                        variants={tooltipVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="absolute -top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
                    >
                        <div className="bg-gray-900 text-white text-xs rounded-xl px-3 py-2 shadow-xl whitespace-nowrap">
                            <div className="font-bold">{slot.slotNumber}</div>
                            <div className="opacity-70">
                                {typeLabel} • {statusLabel}
                            </div>
                        </div>
                        <div className="w-2 h-2 bg-gray-900 rotate-45 mx-auto -mt-1" />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

export default SlotCard

