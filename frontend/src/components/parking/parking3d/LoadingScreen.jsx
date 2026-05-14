'use client'
import { useProgress } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'

const LoadingScreen = () => {
    const { progress, active } = useProgress()

    return (
        <AnimatePresence>
            {active && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-gray-900"
                >
                    <div className="flex flex-col items-center gap-4">
                        <div className="text-4xl">🏗️</div>
                        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                            Building 3D Scene
                        </p>
                        {/* Progress bar */}
                        <div className="w-48 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-primary rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                        <span className="text-xs text-gray-400 font-mono">
                            {Math.round(progress)}%
                        </span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export default LoadingScreen

