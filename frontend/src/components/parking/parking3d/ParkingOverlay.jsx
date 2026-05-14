'use client'
import { useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import useParkingStore from './store'
import {
    PiXBold,
    PiCarDuotone,
    PiCurrencyDollarDuotone,
    PiStarDuotone,
    PiLightningDuotone,
    PiWheelchairDuotone,
    PiClockDuotone,
    PiEyeDuotone,
    PiEyeSlashDuotone,
    PiArrowsOutDuotone,
    PiPersonDuotone,
    PiCompassDuotone,
    PiWifiHighDuotone,
    PiWifiSlashDuotone,
    PiNavigationArrowDuotone,
} from 'react-icons/pi'

/* ── Legend ─────────────────────────────────────────────────── */
const StatusLegend = () => {
    const t = useTranslations('parkingLot.status')
    const items = [
        { label: t('AVAILABLE'), color: '#10b981' },
        { label: t('OCCUPIED'), color: '#ef4444' },
        { label: t('RESERVED'), color: '#f59e0b' },
        { label: t('MAINTENANCE'), color: '#6b7280' },
    ]
    return (
        <div className="flex items-center gap-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl px-3.5 py-2 shadow-lg border border-gray-200/60 dark:border-gray-700/50">
            {items.map(i => (
                <div key={i.label} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ background: i.color }} />
                    <span className="text-[10px] font-medium text-gray-600 dark:text-gray-300">{i.label}</span>
                </div>
            ))}
        </div>
    )
}

/* ── Status filter pills ───────────────────────────────────── */
const StatusFilter = () => {
    const filterStatus = useParkingStore(s => s.filterStatus)
    const setFilterStatus = useParkingStore(s => s.setFilterStatus)
    const tShort = useTranslations('parkingLot.statusShort')

    const filters = ['ALL', 'AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE']
    const colors = {
        ALL: 'bg-gray-500',
        AVAILABLE: 'bg-emerald-500',
        OCCUPIED: 'bg-red-500',
        RESERVED: 'bg-amber-500',
        MAINTENANCE: 'bg-gray-400',
    }

    return (
        <div className="flex items-center gap-1 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl p-1 shadow-lg border border-gray-200/60 dark:border-gray-700/50">
            {filters.map(f => (
                <button
                    key={f}
                    onClick={() => setFilterStatus(f)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                        f === filterStatus
                            ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
                >
                    <span className={`w-1.5 h-1.5 rounded-full ${colors[f]}`} />
                    {tShort(f)}
                </button>
            ))}
        </div>
    )
}

/* ── Camera mode toggle ────────────────────────────────────── */
const CameraModeToggle = () => {
    const cameraMode = useParkingStore(s => s.cameraMode)
    const setCameraMode = useParkingStore(s => s.setCameraMode)
    const t = useTranslations('parkingLot.camera')

    const modes = [
        { key: 'orbit', icon: <PiCompassDuotone className="text-xs" />, label: t('orbit') },
        { key: 'topDown', icon: <PiArrowsOutDuotone className="text-xs" />, label: t('topDown') },
        { key: 'firstPerson', icon: <PiPersonDuotone className="text-xs" />, label: t('firstPerson') },
    ]

    return (
        <div className="flex items-center gap-1 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl p-1 shadow-lg border border-gray-200/60 dark:border-gray-700/50">
            {modes.map(m => (
                <button
                    key={m.key}
                    onClick={() => setCameraMode(m.key)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                        m.key === cameraMode
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                    {m.icon}
                    {m.label}
                </button>
            ))}
        </div>
    )
}

/* ── Labels toggle ─────────────────────────────────────────── */
const LabelsToggle = () => {
    const showLabels = useParkingStore(s => s.showLabels)
    const setShowLabels = useParkingStore(s => s.setShowLabels)
    const t = useTranslations('parkingLot.toggles')

    return (
        <button
            onClick={() => setShowLabels(!showLabels)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl shadow-lg border border-gray-200/60 dark:border-gray-700/50 text-[10px] font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
            {showLabels
                ? <><PiEyeDuotone className="text-sm text-primary" /> {t('labels')}</>
                : <><PiEyeSlashDuotone className="text-sm text-gray-400" /> {t('labels')}</>
            }
        </button>
    )
}

/* ── Connection indicator ──────────────────────────────────── */
const ConnectionIndicator = () => {
    const connectionStatus = useParkingStore(s => s.connectionStatus)
    const t = useTranslations('parkingLot.connection')

    const config = {
        sse: { color: 'bg-emerald-400', pulse: true, label: t('live'), icon: <PiWifiHighDuotone /> },
        ws: { color: 'bg-emerald-400', pulse: true, label: t('live'), icon: <PiWifiHighDuotone /> },
        polling: { color: 'bg-amber-400', pulse: false, label: t('polling'), icon: <PiWifiHighDuotone /> },
        disconnected: { color: 'bg-red-400', pulse: false, label: t('offline'), icon: <PiWifiSlashDuotone /> },
    }

    const c = config[connectionStatus] || config.disconnected

    return (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl shadow-lg border border-gray-200/60 dark:border-gray-700/50">
            <span className="relative flex h-2 w-2">
                {c.pulse && (
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${c.color}`} />
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${c.color}`} />
            </span>
            <span className="text-[9px] font-semibold text-gray-500 dark:text-gray-400">
                {c.label}
            </span>
        </div>
    )
}

/* ── Occupancy sparkline ───────────────────────────────────── */
const OccupancySparkline = () => {
    const occupancyHistory = useParkingStore(s => s.occupancyHistory)

    const points = useMemo(() => {
        if (occupancyHistory.length < 2) return null
        const w = 80
        const h = 24
        const step = w / Math.max(occupancyHistory.length - 1, 1)
        return occupancyHistory
            .map((entry, i) => `${i * step},${h - (entry.rate / 100) * h}`)
            .join(' ')
    }, [occupancyHistory])

    if (!points) return null

    const latest = occupancyHistory[occupancyHistory.length - 1]?.rate ?? 0

    return (
        <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl shadow-lg border border-gray-200/60 dark:border-gray-700/50">
            <svg width="80" height="24" className="overflow-visible">
                <polyline
                    points={points}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                />
            </svg>
            <span className="text-[10px] font-bold text-primary">{latest}%</span>
        </div>
    )
}

/* ── Floor navigator (↑↓ + chips) + keyboard in 3D view ───── */
const useFloorKeyboardShortcuts = () => {
    const floors = useParkingStore(s => s.floors)
    const activeFloor = useParkingStore(s => s.activeFloor)
    const setActiveFloor = useParkingStore(s => s.setActiveFloor)

    useEffect(() => {
        if (floors.length <= 1) return undefined
        const onKey = (e) => {
            const tag = e.target?.tagName?.toLowerCase()
            if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target?.isContentEditable) {
                return
            }
            const i = floors.indexOf(activeFloor)
            if (i < 0) return
            if (e.key === 'ArrowUp' || e.key === 'PageUp') {
                if (i < floors.length - 1) {
                    e.preventDefault()
                    setActiveFloor(floors[i + 1])
                }
            } else if (e.key === 'ArrowDown' || e.key === 'PageDown') {
                if (i > 0) {
                    e.preventDefault()
                    setActiveFloor(floors[i - 1])
                }
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [floors, activeFloor, setActiveFloor])
}

const FloorNavigatorPanel = () => {
    const floors = useParkingStore(s => s.floors)
    const activeFloor = useParkingStore(s => s.activeFloor)
    const setActiveFloor = useParkingStore(s => s.setActiveFloor)
    const t = useTranslations('parkingLot.layout')
    const tMeta = useTranslations('parkingLot.meta')

    useFloorKeyboardShortcuts()

    if (floors.length <= 1) return null

    return (
        <div className="flex items-center gap-1 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl p-1 shadow-lg border border-gray-200/60 dark:border-gray-700/50">
            <span className="px-3 py-2 text-[10px] font-semibold text-gray-500 dark:text-gray-300">
                {t('floor')}
            </span>
            <div className="flex items-center gap-1">
                {floors.map((f) => {
                    const isActive = f === activeFloor
                    const label = String(f ?? '').toLowerCase() === 'ground' ? tMeta('ground') : String(f ?? '')
                    return (
                        <button
                            key={String(f)}
                            type="button"
                            onClick={() => setActiveFloor(f)}
                            className={`min-w-[2.25rem] px-3 py-2 rounded-lg text-[10px] font-semibold transition-all ${
                                isActive
                                    ? 'bg-primary text-white shadow-sm'
                                    : 'text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white'
                            }`}
                        >
                            {label}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

/* ── Stats bar ─────────────────────────────────────────────── */
const StatsBar = () => {
    const floorSlots = useParkingStore(s => s.floorSlots)
    const parking = useParkingStore(s => s.parking)
    const t = useTranslations('parkingLot.stats')

    const total = floorSlots.length
    const available = floorSlots.filter(s => s.status === 'AVAILABLE').length
    const occupied = floorSlots.filter(s => s.status === 'OCCUPIED').length
    const reserved = floorSlots.filter(s => s.status === 'RESERVED').length

    return (
        <div className="flex items-center gap-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl px-4 py-2.5 shadow-lg border border-gray-200/60 dark:border-gray-700/50">
            <div className="text-center">
                <div className="text-sm font-bold">{total}</div>
                <div className="text-[9px] text-gray-400 uppercase tracking-wider">{t('total')}</div>
            </div>
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-600" />
            <div className="text-center">
                <div className="text-sm font-bold text-emerald-500">{available}</div>
                <div className="text-[9px] text-gray-400 uppercase tracking-wider">{t('free')}</div>
            </div>
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-600" />
            <div className="text-center">
                <div className="text-sm font-bold text-red-500">{occupied}</div>
                <div className="text-[9px] text-gray-400 uppercase tracking-wider">{t('taken')}</div>
            </div>
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-600" />
            <div className="text-center">
                <div className="text-sm font-bold text-amber-500">{reserved}</div>
                <div className="text-[9px] text-gray-400 uppercase tracking-wider">{t('reserved')}</div>
            </div>
            {parking?.pricePerHour && (
                <>
                    <div className="w-px h-6 bg-gray-200 dark:bg-gray-600" />
                    <div className="text-center">
                        <div className="text-sm font-bold text-primary">{parking.pricePerHour}</div>
                        <div className="text-[9px] text-gray-400 uppercase tracking-wider">{t('pricePerHour')}</div>
                    </div>
                </>
            )}
        </div>
    )
}

/* ── Slot type icon ────────────────────────────────────────── */
const typeIconsMap = {
    STANDARD:    <PiCarDuotone className="text-lg text-blue-500" />,
    VIP:         <PiStarDuotone className="text-lg text-amber-500" />,
    ELECTRIC:    <PiLightningDuotone className="text-lg text-green-500" />,
    HANDICAPPED: <PiWheelchairDuotone className="text-lg text-purple-500" />,
}

const statusColorMap = {
    AVAILABLE: 'text-emerald-500',
    OCCUPIED: 'text-red-500',
    RESERVED: 'text-amber-500',
    MAINTENANCE: 'text-gray-400',
}

/* ── Info panel ────────────────────────────────────────────── */
const InfoPanel = ({ onReserve }) => {
    const selectedSlot = useParkingStore(s => s.selectedSlot)
    const infoPanelOpen = useParkingStore(s => s.infoPanelOpen)
    const deselectSlot = useParkingStore(s => s.deselectSlot)
    const parking = useParkingStore(s => s.parking)
    const setFocusTarget = useParkingStore(s => s.setFocusTarget)
    const setCameraMode = useParkingStore(s => s.setCameraMode)
    const t = useTranslations('parkingLot')

    const slot = selectedSlot
    const slotType = slot?.slotType in typeIconsMap ? slot.slotType : 'STANDARD'
    const typeIcon = typeIconsMap[slotType]
    const typeLabel = t(`type.${slotType}`)
    const statusKey = slot?.status in statusColorMap ? slot.status : 'MAINTENANCE'
    const statusText = t(`status.${statusKey}`)
    const statusColor = statusColorMap[statusKey]

    const handleNavigate = () => {
        if (!slot) return
        // Switch to first-person camera, then re-trigger the focus target
        // so CameraController flies to the slot at walking height.
        const currentTarget = useParkingStore.getState().focusTarget
        setCameraMode('firstPerson')
        // Clear then re-set focusTarget so the useEffect in CameraController fires
        setTimeout(() => {
            setFocusTarget(null)
            setTimeout(() => {
                setFocusTarget(currentTarget || { position: { x: 0, y: 0.04, z: 0 } })
            }, 50)
        }, 200)
    }

    return (
        <AnimatePresence>
            {infoPanelOpen && slot && (
                <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 20, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="absolute top-[7.5rem] right-3 z-10 w-72 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200/60 dark:border-gray-700/50 overflow-hidden max-h-[calc(100%-8rem)] overflow-y-auto"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700/50">
                        <h4 className="font-bold text-sm">{t('layout.slotDetails')}</h4>
                        <button
                            onClick={deselectSlot}
                            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <PiXBold className="text-xs" />
                        </button>
                    </div>

                    <div className="p-4 flex flex-col gap-3">
                        {/* Slot visual */}
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center mb-2">
                                <span className="text-3xl">
                                    {slot.slotType === 'VIP' ? '⭐' : slot.slotType === 'ELECTRIC' ? '⚡' : slot.slotType === 'HANDICAPPED' ? '♿' : '🅿️'}
                                </span>
                            </div>
                            <div className="text-lg font-bold">{slot.slotNumber}</div>
                            <div className={`text-xs font-semibold ${statusColor}`}>● {statusText}</div>
                        </div>

                        {/* Details grid */}
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-2.5">
                                <div className="text-[9px] text-gray-400 mb-0.5">{t('meta.type')}</div>
                                <div className="flex items-center gap-1.5">
                                    {typeIcon}
                                    <span className="text-xs font-semibold">{typeLabel}</span>
                                </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-2.5">
                                <div className="text-[9px] text-gray-400 mb-0.5">{t('meta.floor')}</div>
                                <div className="flex items-center gap-1.5">
                                    <PiClockDuotone className="text-lg text-blue-400" />
                                    <span className="text-xs font-semibold">{slot.floor || t('meta.ground')}</span>
                                </div>
                            </div>
                            {parking?.pricePerHour && (
                                <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-2.5 col-span-2">
                                    <div className="text-[9px] text-gray-400 mb-0.5">{t('meta.price')}</div>
                                    <div className="flex items-center gap-1.5">
                                        <PiCurrencyDollarDuotone className="text-lg text-primary" />
                                        <span className="text-sm font-bold text-primary">{parking.pricePerHour} {t('meta.pricePerHour')}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action buttons */}
                        {slot.status === 'AVAILABLE' && (
                            <button
                                onClick={() => onReserve?.(slot)}
                                className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors shadow-sm"
                            >
                                {t('layout.reserveSlot')}
                            </button>
                        )}

                        {/* Navigate to slot (first-person walk) */}
                        <button
                            onClick={handleNavigate}
                            className="w-full py-2 rounded-xl bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-1.5"
                        >
                            <PiNavigationArrowDuotone className="text-sm" />
                            {t('layout.walkToSlot')}
                        </button>

                        {slot.status !== 'AVAILABLE' && (
                            <div className="bg-red-50 dark:bg-red-500/10 rounded-xl p-3 text-center">
                                <p className="text-xs text-red-500 font-medium">
                                    {t('layout.slotIsCurrently', { status: statusText.toLowerCase() })}
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

/* ── Main overlay export ──────────────────────────────────── */
const ParkingOverlay = ({ onReserve, onBack }) => {
    return (
        <>
            {/* Top left: Filter */}
            <div className={`absolute left-3 z-10 flex flex-col gap-2 ${onBack ? 'top-16' : 'top-3'}`}>
                <StatusFilter />
            </div>

            {/* Top right: Floor navigator + Camera controls */}
            <div className="absolute top-3 right-3 z-10 flex max-w-[calc(100vw-1rem)] flex-col items-end gap-2">
                <FloorNavigatorPanel />
                <div className="flex flex-wrap items-center justify-end gap-2">
                    <CameraModeToggle />
                    <LabelsToggle />
                </div>
            </div>

            {/* Bottom left: Stats + Sparkline + Connection */}
            <div className="absolute bottom-3 left-3 right-3 z-10 flex items-end flex-wrap gap-2">
                <StatsBar />
                <div className="flex items-center gap-2">
                    <OccupancySparkline />
                    <ConnectionIndicator />
                </div>
            </div>

            {/* Info panel (right side, below floor selector) */}
            <InfoPanel onReserve={onReserve} />
        </>
    )
}

export default ParkingOverlay

