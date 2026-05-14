'use client'

import { motion } from 'framer-motion'

const MapSkeleton = () => {
    return (
        <div className="relative h-[calc(100vh-80px)] w-full overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-900">
            {/* Map skeleton */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-100 dark:from-gray-800 dark:to-gray-900 animate-pulse" />

            {/* Fake filter bar */}
            <div className="absolute top-4 left-4 right-4 z-10">
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-3 flex gap-3">
                    {[80, 60, 100, 50, 70].map((w, i) => (
                        <div
                            key={i}
                            className="h-8 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse"
                            style={{ width: `${w}px` }}
                        />
                    ))}
                </div>
            </div>

            {/* Fake markers */}
            {[
                { top: '30%', left: '40%' },
                { top: '45%', left: '60%' },
                { top: '35%', left: '25%' },
                { top: '55%', left: '50%' },
                { top: '40%', left: '70%' },
            ].map((pos, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 0.5, scale: 1 }}
                    transition={{ delay: i * 0.15, duration: 0.4 }}
                    className="absolute"
                    style={pos}
                >
                    <div className="w-8 h-8 rounded-full bg-blue-300 dark:bg-blue-600 animate-pulse" />
                </motion.div>
            ))}

            {/* Center pulse - user location */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <motion.div
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="w-6 h-6 rounded-full bg-blue-500 border-3 border-white shadow-lg"
                />
            </div>

            {/* Loading text */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-12 text-center">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl px-6 py-4 shadow-lg"
                >
                    <div className="flex items-center gap-3">
                        <svg className="animate-spin h-5 w-5 text-indigo-500" viewBox="0 0 24 24">
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                            Finding nearby parkings...
                        </span>
                    </div>
                </motion.div>
            </div>

            {/* Bottom panel skeleton */}
            <div className="absolute bottom-0 left-0 right-0">
                <div className="bg-white/90 dark:bg-gray-800/90 rounded-t-3xl p-4">
                    <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600 mx-auto mb-4" />
                    <div className="flex gap-3 overflow-hidden">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="flex-shrink-0 w-64 h-24 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse"
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MapSkeleton

