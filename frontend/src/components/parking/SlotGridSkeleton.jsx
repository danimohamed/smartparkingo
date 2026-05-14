'use client'
import { motion } from 'framer-motion'

const shimmer = {
    hidden: { opacity: 0.5 },
    visible: { opacity: 1, transition: { duration: 0.8, repeat: Infinity, repeatType: 'reverse' } },
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.04 },
    },
}

const slotVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
}

const SlotGridSkeleton = ({ count = 16 }) => {
    return (
        <div className="flex flex-col gap-6">
            {/* Overview skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <motion.div
                        key={i}
                        variants={shimmer}
                        initial="hidden"
                        animate="visible"
                        className="bg-gray-100 dark:bg-gray-700/50 rounded-2xl h-24 animate-pulse"
                        style={{ animationDelay: `${i * 0.15}s` }}
                    />
                ))}
            </div>

            {/* Floor selector skeleton */}
            <div className="flex gap-2">
                {[...Array(3)].map((_, i) => (
                    <div
                        key={i}
                        className="bg-gray-100 dark:bg-gray-700/50 rounded-xl h-10 w-24 animate-pulse"
                        style={{ animationDelay: `${i * 0.1}s` }}
                    />
                ))}
            </div>

            {/* Legend skeleton */}
            <div className="flex gap-4">
                {[...Array(4)].map((_, i) => (
                    <div
                        key={i}
                        className="bg-gray-100 dark:bg-gray-700/50 rounded-md h-5 w-24 animate-pulse"
                    />
                ))}
            </div>

            {/* Slot grid skeleton */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3"
            >
                {[...Array(count)].map((_, i) => (
                    <motion.div
                        key={i}
                        variants={slotVariants}
                        className="bg-gray-100 dark:bg-gray-700/50 rounded-2xl animate-pulse"
                        style={{
                            height: 90,
                            animationDelay: `${i * 0.05}s`,
                        }}
                    />
                ))}
            </motion.div>
        </div>
    )
}

export default SlotGridSkeleton

