'use client'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '@/components/ui/Button'
import { PiCarDuotone, PiXBold, PiClockDuotone, PiLightningDuotone, PiStarDuotone, PiWheelchairDuotone } from 'react-icons/pi'
import { useTranslations } from 'next-intl'

const panelVariants = {
    hidden: { x: '100%', opacity: 0 },
    visible: {
        x: 0,
        opacity: 1,
        transition: { type: 'spring', stiffness: 350, damping: 30 },
    },
    exit: {
        x: '100%',
        opacity: 0,
        transition: { duration: 0.25, ease: 'easeIn' },
    },
}

const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
}

const slotTypeIcons = {
    STANDARD: <PiCarDuotone className="text-2xl text-blue-500" />,
    VIP: <PiStarDuotone className="text-2xl text-amber-500" />,
    ELECTRIC: <PiLightningDuotone className="text-2xl text-green-500" />,
    HANDICAPPED: <PiWheelchairDuotone className="text-2xl text-purple-500" />,
}

const statusColors = {
    AVAILABLE: 'text-emerald-500',
    OCCUPIED: 'text-red-500',
    RESERVED: 'text-amber-500',
    MAINTENANCE: 'text-gray-500',
}

const SlotDetailsPanel = ({ slot, parking, isOpen, onClose, onReserve }) => {
    const t = useTranslations('parkingLot')
    const slotType = slot?.slotType in slotTypeIcons ? slot.slotType : 'STANDARD'
    const typeIcon = slotTypeIcons[slotType]
    const typeLabel = t(`typeFull.${slotType}`)
    const typeDescription = t(`typeDescription.${slotType}`)
    const isAvailable = slot?.status === 'AVAILABLE'

    return (
        <AnimatePresence>
            {isOpen && slot && (
                <>
                    {/* Overlay */}
                    <motion.div
                        variants={overlayVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                        onClick={onClose}
                    />

                    {/* Panel */}
                    <motion.div
                        variants={panelVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl z-50 overflow-y-auto"
                    >
                        {/* Header */}
                        <div className="p-6 border-b dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <motion.h4
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="text-lg font-bold"
                                >
                                    {t('layout.slotDetails')}
                                </motion.h4>
                                <motion.button
                                    whileHover={{ scale: 1.1, rotate: 90 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={onClose}
                                    className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <PiXBold className="text-lg" />
                                </motion.button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 flex flex-col gap-6">
                            {/* Slot Visual */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.15, type: 'spring', stiffness: 300 }}
                                className="flex flex-col items-center"
                            >
                                <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4 shadow-inner">
                                    <span className="text-5xl">{slot.slotType === 'VIP' ? '⭐' : slot.slotType === 'ELECTRIC' ? '⚡' : slot.slotType === 'HANDICAPPED' ? '♿' : '🅿️'}</span>
                                </div>
                                <h3 className="text-2xl font-bold">{slot.slotNumber}</h3>
                                <div className={`text-sm font-semibold mt-1 ${statusColors[slot.status]}`}>
                                    ● {t(`status.${slot.status}`)}
                                </div>
                            </motion.div>

                            {/* Details Grid */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="grid grid-cols-2 gap-3"
                            >
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-4">
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('meta.type')}</div>
                                    <div className="flex items-center gap-2">
                                        {typeIcon}
                                        <span className="font-semibold text-sm">{typeLabel}</span>
                                    </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-4">
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('meta.floor')}</div>
                                    <div className="flex items-center gap-2">
                                        <PiClockDuotone className="text-2xl text-blue-400" />
                                        <span className="font-semibold text-sm">{slot.floor || t('meta.ground')}</span>
                                    </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-4 col-span-2">
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('meta.parking')}</div>
                                    <div className="font-semibold text-sm">{parking?.name}</div>
                                    <div className="text-xs text-gray-400 mt-0.5">{parking?.address}</div>
                                </div>
                                {parking?.pricePerHour && (
                                    <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-4 col-span-2">
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('meta.price')}</div>
                                        <div className="font-bold text-xl text-primary">
                                            {parking.pricePerHour} <span className="text-sm font-normal text-gray-400">{t('meta.perHour')}</span>
                                        </div>
                                    </div>
                                )}
                            </motion.div>

                            {/* Type description */}
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed"
                            >
                                {typeDescription}
                            </motion.p>

                            {/* Action Button */}
                            {isAvailable && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.35, type: 'spring' }}
                                >
                                    <Button
                                        variant="solid"
                                        block
                                        className="!rounded-2xl !py-3 !text-base !font-bold"
                                        onClick={() => onReserve(slot)}
                                    >
                                        {t('layout.reserveSlot')}
                                    </Button>
                                </motion.div>
                            )}

                            {!isAvailable && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.35 }}
                                    className="bg-red-50 dark:bg-red-500/10 rounded-2xl p-4 text-center"
                                >
                                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                                        {t('layout.slotIsCurrently', { status: t(`status.${slot.status}`).toLowerCase() })}
                                    </p>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}

export default SlotDetailsPanel

