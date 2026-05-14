'use client'
import { useRef, useState, useMemo, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { ROW_TOP_PREFIXES } from './parking3d/constants'
import {
    PiCaretUpBold,
    PiCaretDownBold,
    PiMinus,
    PiPlus,
    PiArrowsOutCardinal,
} from 'react-icons/pi'

const SLOT_W = 54
const SLOT_D = 92
const GAP = 10
const LANE = 76
const PAD = 28

/** Wheel zoom range (scale factor) */
const ZOOM_MIN = 0.22
const ZOOM_MAX = 5

const CAR_PALETTE = [
    'linear-gradient(165deg,#f8fafc 0%,#cbd5e1 45%,#94a3b8 100%)',
    'linear-gradient(165deg,#e2e8f0 0%,#94a3b8 50%,#64748b 100%)',
    'linear-gradient(165deg,#1e293b 0%,#334155 55%,#475569 100%)',
    'linear-gradient(165deg,#fef2f2 0%,#fecaca 50%,#f87171 100%)',
    'linear-gradient(165deg,#eff6ff 0%,#bfdbfe 50%,#60a5fa 100%)',
]

function carGradientForId(id) {
    return CAR_PALETTE[Math.abs(Number(id) || 0) % CAR_PALETTE.length]
}

function partitionSlots(slots) {
    const top = []
    const bot = []
    const rest = []
    slots.forEach((s) => {
        const prefix = String(s.slotNumber || '').split('-')[0]
        if (ROW_TOP_PREFIXES.includes(prefix)) top.push(s)
        else if (['D', 'E'].includes(prefix)) bot.push(s)
        else rest.push(s)
    })
    top.sort((a, b) => a.slotNumber.localeCompare(b.slotNumber))
    bot.sort((a, b) => a.slotNumber.localeCompare(b.slotNumber))
    rest.sort((a, b) => a.slotNumber.localeCompare(b.slotNumber))
    return { top, bot, rest }
}

function rowWidth(count) {
    if (count <= 0) return 0
    return count * (SLOT_W + GAP) - GAP
}

/**
 * Bird’s-eye parking lot: asphalt, white line bays, lane, simple car shapes.
 * Zoom + drag pan; floor controls are delegated to parent toolbar props.
 */
const ParkingLotTopDown = ({
    slots,
    selectedSlotId,
    onSlotClick,
    /** Floor toolbar (optional — hide when single floor) */
    floorIndex,
    floorCount,
    floorLabel,
    onFloorUp,
    onFloorDown,
    canFloorUp,
    canFloorDown,
    showFloorControls,
}) => {
    const t = useTranslations('parkingLot')
    const tStatus = useTranslations('parkingLot.status')
    const wrapRef = useRef(null)
    const dragRef = useRef({ active: false, sx: 0, sy: 0, px: 0, py: 0 })
    const [zoom, setZoom] = useState(1)
    const [pan, setPan] = useState({ x: 0, y: 0 })

    const { top, bot, rest } = useMemo(() => partitionSlots(slots || []), [slots])

    const layout = useMemo(() => {
        if (rest.length > 0 && top.length === 0 && bot.length === 0) {
            const cols = Math.ceil(Math.sqrt(rest.length))
            return { mode: 'grid', grid: rest, cols }
        }
        return { mode: 'lanes', top, bot }
    }, [top, bot, rest])

    const lotSize = useMemo(() => {
        if (layout.mode === 'grid') {
            const cols = layout.cols
            const rows = Math.ceil(layout.grid.length / cols)
            const w = PAD * 2 + cols * (SLOT_W + GAP) - GAP
            const h = PAD * 2 + rows * (SLOT_D + GAP) - GAP
            return { w, h }
        }
        const maxRow = Math.max(rowWidth(layout.top.length), rowWidth(layout.bot.length), SLOT_W)
        const w = PAD * 2 + maxRow
        const hasTop = layout.top.length > 0
        const hasBot = layout.bot.length > 0
        let h = PAD * 2
        if (hasTop) h += SLOT_D
        if (hasTop && hasBot) h += LANE
        if (hasBot) h += SLOT_D
        if (!hasTop && !hasBot) h += SLOT_D
        return { w, h }
    }, [layout])

    const clampPan = useCallback(
        (nx, ny, z) => {
            const el = wrapRef.current
            if (!el) return { x: nx, y: ny }
            const vw = el.clientWidth
            const vh = el.clientHeight
            const scaledW = lotSize.w * z
            const scaledH = lotSize.h * z
            const maxX = Math.max(0, (scaledW - vw) / 2 + 40)
            const maxY = Math.max(0, (scaledH - vh) / 2 + 40)
            return {
                x: Math.min(maxX, Math.max(-maxX, nx)),
                y: Math.min(maxY, Math.max(-maxY, ny)),
            }
        },
        [lotSize.w, lotSize.h],
    )

    // Non-passive wheel so zoom wins over page scroll / browser defaults (trackpad friendly)
    useEffect(() => {
        const el = wrapRef.current
        if (!el) return undefined

        const onWheel = (e) => {
            e.preventDefault()
            e.stopPropagation()
            let dy = e.deltaY
            if (e.deltaMode === 1) dy *= 14
            if (e.deltaMode === 2) dy *= el.clientHeight * 0.04
            // Trackpads use pixel mode with many small steps — higher coeff = faster pinch/scroll zoom
            const factor = Math.exp(-dy * 0.0052)
            setZoom((z) => {
                const nz = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z * factor))
                setPan((p) => clampPan(p.x, p.y, nz))
                return nz
            })
        }

        el.addEventListener('wheel', onWheel, { passive: false })
        return () => el.removeEventListener('wheel', onWheel)
    }, [clampPan])

    const zoomIn = () => {
        setZoom((z) => {
            const nz = Math.min(ZOOM_MAX, z * 1.3)
            setPan((p) => clampPan(p.x, p.y, nz))
            return nz
        })
    }
    const zoomOut = () => {
        setZoom((z) => {
            const nz = Math.max(ZOOM_MIN, z / 1.3)
            setPan((p) => clampPan(p.x, p.y, nz))
            return nz
        })
    }
    const resetView = () => {
        setZoom(1)
        setPan({ x: 0, y: 0 })
    }

    const onPointerDown = (e) => {
        if (e.button !== 0) return
        dragRef.current = {
            active: true,
            sx: e.clientX,
            sy: e.clientY,
            px: pan.x,
            py: pan.y,
        }
        e.currentTarget.setPointerCapture(e.pointerId)
    }
    const onPointerMove = (e) => {
        if (!dragRef.current.active) return
        const dx = e.clientX - dragRef.current.sx
        const dy = e.clientY - dragRef.current.sy
        setPan(() =>
            clampPan(dragRef.current.px + dx, dragRef.current.py + dy, zoom),
        )
    }
    const onPointerUp = (e) => {
        dragRef.current.active = false
        try {
            e.currentTarget.releasePointerCapture(e.pointerId)
        } catch (_) {}
    }

    useEffect(() => {
        setPan((p) => clampPan(p.x, p.y, zoom))
    }, [zoom, lotSize.w, lotSize.h, clampPan])

    const renderSlotCell = (slot) => {
        const available = slot.status === 'AVAILABLE'
        const occupied = slot.status === 'OCCUPIED' || slot.status === 'RESERVED'
        const maintenance = slot.status === 'MAINTENANCE'
        const selected = selectedSlotId === slot.id

        return (
            <button
                key={slot.id}
                type="button"
                disabled={!available}
                onClick={() => available && onSlotClick?.(slot)}
                className={classNames(
                    'relative flex flex-col items-center justify-end overflow-hidden rounded-sm border-2 border-white/90 bg-[#3f4247] shadow-[inset_0_2px_6px_rgba(0,0,0,0.35)] transition-transform',
                    available && 'cursor-pointer hover:brightness-110 hover:ring-2 hover:ring-emerald-300/80',
                    !available && 'cursor-default opacity-95',
                    selected && 'z-10 ring-2 ring-sky-400 ring-offset-2 ring-offset-[#2d3035]',
                )}
                style={{ width: SLOT_W, height: SLOT_D }}
                title={`${slot.slotNumber} — ${tStatus(slot.status)}`}
            >
                {occupied && (
                    <div
                        className="absolute left-1/2 top-2 -translate-x-1/2 rounded-md shadow-md"
                        style={{
                            width: SLOT_W * 0.72,
                            height: SLOT_D * 0.62,
                            background: carGradientForId(slot.id),
                            boxShadow: '0 4px 8px rgba(0,0,0,0.35)',
                        }}
                    />
                )}
                {slot.status === 'RESERVED' && (
                    <div className="absolute inset-0 bg-amber-500/25" />
                )}
                {maintenance && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-600/50">
                        <span className="text-[10px] font-bold text-white/90">×</span>
                    </div>
                )}
                <span className="relative mb-1 max-w-full truncate px-0.5 font-mono text-[9px] font-bold text-white/90 drop-shadow">
                    {slot.slotNumber}
                </span>
            </button>
        )
    }

    const renderLaneRow = () => (
        <div
            className="relative flex w-full items-center justify-center"
            style={{ height: LANE, minHeight: LANE }}
        >
            <div className="absolute inset-x-8 top-1/2 h-0 border-t-2 border-dashed border-white/55" />
            <span className="relative rounded bg-black/20 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-white/45">
                {t('layout.aisle')}
            </span>
        </div>
    )

    const renderLanesLayout = () => {
        const maxW = Math.max(rowWidth(layout.top.length), rowWidth(layout.bot.length), SLOT_W)
        return (
            <div className="flex flex-col items-center" style={{ width: maxW + PAD * 2 }}>
                {layout.top.length > 0 && (
                    <div
                        className="flex justify-center gap-[10px]"
                        style={{ paddingTop: PAD, paddingLeft: PAD, paddingRight: PAD }}
                    >
                        {layout.top.map(renderSlotCell)}
                    </div>
                )}
                {layout.top.length > 0 && layout.bot.length > 0 && renderLaneRow()}
                {layout.bot.length > 0 && (
                    <div
                        className="flex justify-center gap-[10px]"
                        style={{ paddingBottom: PAD, paddingLeft: PAD, paddingRight: PAD }}
                    >
                        {layout.bot.map(renderSlotCell)}
                    </div>
                )}
                {layout.top.length === 0 && layout.bot.length === 0 && (
                    <div className="p-8 text-center text-sm text-white/50">{t('layout.noSlotsFloor')}</div>
                )}
            </div>
        )
    }

    const renderGridLayout = () => {
        const cols = layout.cols
        return (
            <div
                className="grid gap-[10px]"
                style={{
                    gridTemplateColumns: `repeat(${cols}, ${SLOT_W}px)`,
                    padding: PAD,
                }}
            >
                {layout.grid.map(renderSlotCell)}
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-3">
            {/* Toolbar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/20 px-2 py-1 font-mono text-[10px] text-white/70">
                        <PiArrowsOutCardinal className="text-emerald-400/90" />
                        {t('layout.dragToPan')}
                    </span>
                    <div className="flex items-center gap-1 rounded-xl border border-white/15 bg-black/25 p-1">
                        <button
                            type="button"
                            aria-label={t('layout.zoomOut')}
                            onClick={zoomOut}
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20"
                        >
                            <PiMinus className="text-lg" />
                        </button>
                        <span className="min-w-[3rem] text-center font-mono text-xs tabular-nums text-white/85">
                            {Math.round(zoom * 100)}%
                        </span>
                        <button
                            type="button"
                            aria-label={t('layout.zoomIn')}
                            onClick={zoomIn}
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20"
                        >
                            <PiPlus className="text-lg" />
                        </button>
                        <button
                            type="button"
                            onClick={resetView}
                            className="ml-1 rounded-lg px-2 py-1.5 font-mono text-[10px] text-white/60 hover:text-white"
                        >
                            {t('layout.reset')}
                        </button>
                    </div>
                </div>

                {showFloorControls && floorCount > 1 && (
                    <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-black/25 px-2 py-1.5">
                        <button
                            type="button"
                            aria-label={t('layout.prevFloor')}
                            disabled={!canFloorDown}
                            onClick={onFloorDown}
                            className={classNames(
                                'flex h-10 w-10 items-center justify-center rounded-lg transition',
                                canFloorDown
                                    ? 'bg-white/15 text-white hover:bg-white/25'
                                    : 'cursor-not-allowed text-white/25',
                            )}
                        >
                            <PiCaretDownBold className="text-xl" />
                        </button>
                        <div className="min-w-[7.5rem] text-center">
                            <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/45">
                                {t('layout.floor')}
                            </div>
                            <div className="font-mono text-sm font-bold tabular-nums text-white">
                                {floorIndex + 1} / {floorCount}
                            </div>
                            <div className="truncate font-mono text-[11px] text-emerald-200/90">{floorLabel}</div>
                        </div>
                        <button
                            type="button"
                            aria-label={t('layout.nextFloor')}
                            disabled={!canFloorUp}
                            onClick={onFloorUp}
                            className={classNames(
                                'flex h-10 w-10 items-center justify-center rounded-lg transition',
                                canFloorUp
                                    ? 'bg-white/15 text-white hover:bg-white/25'
                                    : 'cursor-not-allowed text-white/25',
                            )}
                        >
                            <PiCaretUpBold className="text-xl" />
                        </button>
                    </div>
                )}
            </div>

            {/* Viewport */}
            <div
                ref={wrapRef}
                className="relative touch-none overflow-hidden overscroll-contain rounded-2xl border border-white/10 shadow-[inset_0_0_80px_rgba(0,0,0,0.45)]"
                style={{
                    minHeight: 320,
                    maxHeight: 'min(70vh, 720px)',
                    background:
                        'linear-gradient(165deg,#4a4e55 0%,#35383e 38%,#3d4148 72%,#32353b 100%)',
                }}
            >
                {/* Soft vignette + asphalt grain */}
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.14]"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                    }}
                />
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.35)_100%)]" />

                {/* Corner lamp posts (decorative) */}
                <div className="pointer-events-none absolute left-3 top-3 flex h-10 w-2 flex-col items-center">
                    <div className="h-3 w-3 rounded-full bg-amber-100/30 shadow-[0_0_12px_rgba(253,230,138,0.35)]" />
                    <div className="h-7 w-1 rounded-sm bg-gradient-to-b from-zinc-400 to-zinc-600" />
                </div>
                <div className="pointer-events-none absolute right-3 top-3 flex h-10 w-2 flex-col items-center">
                    <div className="h-3 w-3 rounded-full bg-amber-100/30 shadow-[0_0_12px_rgba(253,230,138,0.35)]" />
                    <div className="h-7 w-1 rounded-sm bg-gradient-to-b from-zinc-400 to-zinc-600" />
                </div>
                <div className="pointer-events-none absolute bottom-3 left-3 flex h-10 w-2 flex-col items-center">
                    <div className="h-7 w-1 rounded-sm bg-gradient-to-b from-zinc-400 to-zinc-600" />
                    <div className="h-3 w-3 rounded-full bg-amber-100/20" />
                </div>
                <div className="pointer-events-none absolute bottom-3 right-3 flex h-10 w-2 flex-col items-center">
                    <div className="h-7 w-1 rounded-sm bg-gradient-to-b from-zinc-400 to-zinc-600" />
                    <div className="h-3 w-3 rounded-full bg-amber-100/20" />
                </div>

                <div
                    className="relative flex h-full min-h-[300px] cursor-grab items-center justify-center active:cursor-grabbing"
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerLeave={onPointerUp}
                >
                    <motion.div
                        className="will-change-transform"
                        style={{
                            width: lotSize.w,
                            height: lotSize.h,
                            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                        }}
                        transition={{ type: 'tween', duration: 0 }}
                    >
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={floorLabel}
                                initial={{ opacity: 0.65, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0.5 }}
                                className="rounded-lg border border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
                                style={{
                                    width: lotSize.w,
                                    height: lotSize.h,
                                    background:
                                        'linear-gradient(180deg,#45494f 0%,#3a3d43 40%,#36393f 100%)',
                                }}
                            >
                                {layout.mode === 'lanes' ? renderLanesLayout() : renderGridLayout()}
                            </motion.div>
                        </AnimatePresence>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}

export default ParkingLotTopDown
