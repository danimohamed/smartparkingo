'use client'

import { useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

/** Seconds before loop end when the message fades in (smooth “end of scene”). */
const END_LEAD_SEC = 1.35

export default function AuthSideVideoPanel({ src }) {
    const [showMessage, setShowMessage] = useState(false)

    const handleTimeUpdate = useCallback((e) => {
        const v = e.currentTarget
        const d = v.duration
        if (!d || !Number.isFinite(d)) return
        const remaining = d - v.currentTime
        setShowMessage(remaining <= END_LEAD_SEC && remaining >= 0)
    }, [])

    return (
        <div className="relative h-full w-full min-h-0 overflow-hidden rounded-3xl">
            <video
                src={src}
                className="absolute inset-0 h-full w-full rounded-3xl object-cover"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                onTimeUpdate={handleTimeUpdate}
                aria-hidden
            />
            <AnimatePresence>
                {showMessage ? (
                    <motion.div
                        key="park-tagline"
                        role="status"
                        aria-live="polite"
                        initial={{ opacity: 0, scale: 0.92, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 8 }}
                        transition={{
                            type: 'spring',
                            stiffness: 200,
                            damping: 38,
                            mass: 1.35,
                        }}
                        className="absolute inset-0 z-10 flex items-center justify-center p-5 sm:p-8 pointer-events-none"
                    >
                        <div className="max-w-[min(100%,20rem)] rounded-2xl border border-white/15 bg-black/55 px-5 py-4 text-center shadow-2xl backdrop-blur-md sm:px-7 sm:py-5">
                            <p className="text-base font-semibold tracking-tight text-white sm:text-lg">
                                Never struggle to park again
                            </p>
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    )
}
