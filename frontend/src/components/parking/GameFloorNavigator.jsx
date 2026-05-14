'use client'
import { motion } from 'framer-motion'
import classNames from 'classnames'
import { PiCaretUpBold, PiCaretDownBold } from 'react-icons/pi'

/**
 * Video-game style floor control: vertical up/down + current level readout + quick floor chips.
 */
const GameFloorNavigator = ({ floors, activeFloor, onFloorChange, className }) => {
    if (!floors?.length) return null

    const idx = floors.indexOf(activeFloor)
    const safeIdx = idx >= 0 ? idx : 0
    /** ↑ = next floor (e.g. 1 → 2), ↓ = previous floor */
    const canGoNext = safeIdx < floors.length - 1
    const canGoPrev = safeIdx > 0

    const goNextFloor = () => {
        if (canGoNext) onFloorChange?.(floors[safeIdx + 1])
    }
    const goPrevFloor = () => {
        if (canGoPrev) onFloorChange?.(floors[safeIdx - 1])
    }

    return (
        <div
            className={classNames(
                'flex flex-col sm:flex-row sm:items-stretch gap-4 sm:gap-6',
                className,
            )}
        >
            {/* Elevator / level column */}
            <div
                className={classNames(
                    'flex sm:flex-col items-center justify-center gap-1 rounded-2xl p-2 sm:p-3',
                    'bg-gradient-to-b from-slate-800/90 to-slate-900/95',
                    'border border-cyan-500/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_32px_rgba(0,0,0,0.35)]',
                    'dark:from-slate-900/95 dark:to-slate-950/98',
                )}
            >
                <motion.button
                    type="button"
                    aria-label="Next floor"
                    disabled={!canGoNext}
                    whileHover={canGoNext ? { scale: 1.06 } : {}}
                    whileTap={canGoNext ? { scale: 0.94 } : {}}
                    onClick={goNextFloor}
                    className={classNames(
                        'flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl text-lg transition-colors',
                        canGoNext
                            ? 'bg-cyan-500/20 text-cyan-200 hover:bg-cyan-400/30 border border-cyan-400/40'
                            : 'bg-slate-700/30 text-slate-500 cursor-not-allowed border border-transparent',
                    )}
                >
                    <PiCaretUpBold className="text-xl" />
                </motion.button>

                <div className="flex min-h-[5.5rem] min-w-[10.5rem] sm:min-w-[11rem] flex-col items-center justify-center rounded-xl px-3 py-2 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-cyan-200/70">
                        Level
                    </span>
                    <motion.span
                        key={activeFloor}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                        className="mt-1 font-mono text-xl font-bold leading-tight text-white tabular-nums drop-shadow-sm sm:text-2xl"
                    >
                        {activeFloor ?? floors[0]}
                    </motion.span>
                    <span className="mt-1 font-mono text-[11px] tabular-nums text-slate-400">
                        {safeIdx + 1} / {floors.length}
                    </span>
                </div>

                <motion.button
                    type="button"
                    aria-label="Previous floor"
                    disabled={!canGoPrev}
                    whileHover={canGoPrev ? { scale: 1.06 } : {}}
                    whileTap={canGoPrev ? { scale: 0.94 } : {}}
                    onClick={goPrevFloor}
                    className={classNames(
                        'flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl text-lg transition-colors',
                        canGoPrev
                            ? 'bg-cyan-500/20 text-cyan-200 hover:bg-cyan-400/30 border border-cyan-400/40'
                            : 'bg-slate-700/30 text-slate-500 cursor-not-allowed border border-transparent',
                    )}
                >
                    <PiCaretDownBold className="text-xl" />
                </motion.button>
            </div>

            {/* Quick jump chips */}
            <div className="flex flex-1 flex-wrap content-center items-center gap-2">
                <span className="hidden text-[10px] font-bold uppercase tracking-widest text-slate-500 sm:block sm:w-full">
                    Jump to
                </span>
                {floors.map((floor) => {
                    const isActive = activeFloor === floor
                    return (
                        <motion.button
                            key={floor}
                            type="button"
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => onFloorChange?.(floor)}
                            className={classNames(
                                'rounded-xl border px-3 py-2 text-xs font-semibold transition-colors',
                                isActive
                                    ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                                    : 'border-slate-600/60 bg-slate-800/50 text-slate-300 hover:border-cyan-500/40 hover:bg-slate-700/60',
                            )}
                        >
                            {floor}
                        </motion.button>
                    )
                })}
            </div>
        </div>
    )
}

export default GameFloorNavigator
