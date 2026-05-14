'use client'
import { motion } from 'framer-motion'

const legendItems = [
    { color: 'bg-emerald-500', label: 'Available', pulse: true },
    { color: 'bg-amber-500', label: 'Reserved', pulse: false },
    { color: 'bg-red-500', label: 'Occupied', pulse: false },
    { color: 'bg-gray-400', label: 'Maintenance', pulse: false },
]

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.2 },
    },
}

const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
}

const ParkingLegend = () => {
    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-wrap gap-5 items-center"
        >
            {legendItems.map((item) => (
                <motion.div
                    key={item.label}
                    variants={itemVariants}
                    className="flex items-center gap-2"
                >
                    <div className="relative">
                        <div className={`w-4 h-4 rounded-md ${item.color}`} />
                        {item.pulse && (
                            <motion.div
                                className={`absolute inset-0 rounded-md ${item.color}`}
                                animate={{
                                    scale: [1, 1.6, 1],
                                    opacity: [0.6, 0, 0.6],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                }}
                            />
                        )}
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                        {item.label}
                    </span>
                </motion.div>
            ))}
        </motion.div>
    )
}

export default ParkingLegend

