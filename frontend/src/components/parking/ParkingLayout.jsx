'use client'
import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import SlotCard from './SlotCard'
import SlotDetailsPanel from './SlotDetailsPanel'
import ParkingLegend from './ParkingLegend'
import ParkingOverview from './ParkingOverview'
import SlotGridSkeleton from './SlotGridSkeleton'
import { PiCarDuotone, PiGridFourDuotone, PiCubeDuotone } from 'react-icons/pi'

const gridContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.03 },
    },
}

const entranceVariants = {
    hidden: { opacity: 0, scale: 0.92, y: 30 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            type: 'spring',
            stiffness: 200,
            damping: 20,
            staggerChildren: 0.1,
        },
    },
}

const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', stiffness: 300, damping: 25 },
    },
}

const ParkingLayout = ({ parking, slots, loading, onReserve }) => {
    const router = useRouter()
    const t = useTranslations('parkingLot')
    const [selectedSlot, setSelectedSlot] = useState(null)
    const [detailsOpen, setDetailsOpen] = useState(false)

    const floors = useMemo(() => {
        const raw = [...new Set(slots.map((s) => s.floor || 'Ground'))]
        return raw.sort((a, b) =>
            String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' }),
        )
    }, [slots])

    const [activeFloor, setActiveFloor] = useState(null)

    useEffect(() => {
        if (floors.length > 0 && activeFloor === null) {
            setActiveFloor(floors[0])
        }
    }, [floors, activeFloor])

    // Filter slots by active floor
    const floorSlots = useMemo(() => {
        return slots.filter(s => (s.floor || 'Ground') === activeFloor)
    }, [slots, activeFloor])

    const handleFloorChange = useCallback(
        (floor) => {
            setActiveFloor(floor)
            setSelectedSlot(null)
        },
        [],
    )

    useEffect(() => {
        if (floors.length <= 1) return undefined
        const onKey = (e) => {
            if (e.defaultPrevented) return
            const tag = e.target?.tagName?.toLowerCase()
            if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target?.isContentEditable) {
                return
            }
            const i = floors.indexOf(activeFloor)
            if (i < 0) return
            if (e.key === 'ArrowUp' || e.key === 'PageUp') {
                if (i < floors.length - 1) {
                    e.preventDefault()
                    handleFloorChange(floors[i + 1])
                }
            } else if (e.key === 'ArrowDown' || e.key === 'PageDown') {
                if (i > 0) {
                    e.preventDefault()
                    handleFloorChange(floors[i - 1])
                }
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [floors, activeFloor, handleFloorChange])

    const handleSlotClick = (slot) => {
        if (slot.status !== 'AVAILABLE') return
        setSelectedSlot(prev => (prev?.id === slot.id ? null : slot))
        setDetailsOpen(true)
    }

    const handleCloseDetails = () => {
        setDetailsOpen(false)
        setTimeout(() => setSelectedSlot(null), 300)
    }

    const handleReserve = (slot) => {
        setDetailsOpen(false)
        onReserve?.(slot)
    }

    // Loading state
    if (loading) {
        return <SlotGridSkeleton />
    }

    // Empty state
    if (!slots || slots.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-20"
            >
                <motion.div
                    animate={{
                        y: [0, -10, 0],
                        rotate: [0, -5, 5, 0],
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <PiCarDuotone className="text-8xl text-gray-200 dark:text-gray-600" />
                </motion.div>
                <h4 className="text-lg font-bold text-gray-400 mt-6">{t('layout.emptyTitle')}</h4>
                <p className="text-gray-400 text-sm mt-2">
                    {t('layout.emptyDesc')}
                </p>
            </motion.div>
        )
    }

    return (
        <motion.div
            variants={entranceVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-6"
        >
            {/* View Mode Toggle — soft “game menu” chips */}
            <motion.div variants={sectionVariants} className="flex items-center justify-between">
                <div />
                <div className="flex items-center gap-1 rounded-2xl border border-slate-200/80 bg-gradient-to-r from-slate-50 to-slate-100/80 p-1 shadow-inner dark:border-slate-600/60 dark:from-slate-900/80 dark:to-slate-800/80">
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        aria-current="page"
                        className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold tracking-wide transition-all duration-200 bg-white text-primary shadow-md ring-1 ring-primary/20 dark:bg-slate-700 dark:text-emerald-300"
                    >
                        <PiGridFourDuotone className="text-sm" />
                        {t('layout.lotView')}
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={() => router.push(`/parkings/${parking?.id}/3d-twin`)}
                        className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold tracking-wide text-slate-500 transition-all duration-200 hover:bg-white/80 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700/80 dark:hover:text-slate-100"
                    >
                        <PiCubeDuotone className="text-sm" />
                        {t('layout.tour3d')}
                    </motion.button>
                </div>
            </motion.div>

            {/* Overview Stats */}
            <motion.div variants={sectionVariants}>
                <ParkingOverview parking={parking} slots={slots} />
            </motion.div>

            {/* Legend */}
            <motion.div variants={sectionVariants}>
                <ParkingLegend />
            </motion.div>

            {/* Lot view: classic slot grid (no top-down / 3D-style canvas) */}
            <motion.div variants={sectionVariants} className="relative">
                <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/40 sm:rounded-3xl sm:p-6">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h5 className="text-base font-bold text-slate-800 dark:text-slate-100">
                                {t('layout.parkingSlots')}
                            </h5>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {t('layout.tapToReserve')}
                                {floors.length > 1 ? t('layout.floorHint') : ''}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2 text-[11px]">
                            <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 font-mono text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                                {t('layout.availableCount', { count: floorSlots.filter((s) => s.status === 'AVAILABLE').length })}
                            </span>
                            <span className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                {t('layout.onThisFloor', { count: floorSlots.length })}
                            </span>
                        </div>
                    </div>

                    {floors.length > 1 && (
                        <div className="mb-4 flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                {t('layout.floor')}
                            </span>
                            <div className="flex flex-wrap gap-2">
                                {floors.map((floor) => {
                                    const active = activeFloor === floor
                                    return (
                                        <button
                                            key={floor}
                                            type="button"
                                            onClick={() => handleFloorChange(floor)}
                                            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                                                active
                                                    ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary/20'
                                                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-500'
                                            }`}
                                        >
                                            {floor}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    <motion.div
                        variants={gridContainerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3"
                    >
                        {floorSlots.map((slot) => (
                            <SlotCard
                                key={slot.id}
                                slot={slot}
                                isSelected={selectedSlot?.id === slot.id}
                                onClick={handleSlotClick}
                            />
                        ))}
                    </motion.div>
                </div>
            </motion.div>

            {/* Details Panel */}
            <SlotDetailsPanel
                slot={selectedSlot}
                parking={parking}
                isOpen={detailsOpen}
                onClose={handleCloseDetails}
                onReserve={handleReserve}
            />
        </motion.div>
    )
}

export default ParkingLayout

