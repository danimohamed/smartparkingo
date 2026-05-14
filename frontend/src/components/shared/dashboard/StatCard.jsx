'use client'
import { motion } from 'framer-motion'

const StatCard = ({ icon: Icon, label, value, description, color, index = 0 }) => {
    const colorMap = {
        blue: {
            bg: 'bg-blue-50 dark:bg-blue-500/10',
            icon: 'text-blue-600 dark:text-blue-400',
            ring: 'ring-blue-100 dark:ring-blue-500/20',
        },
        emerald: {
            bg: 'bg-emerald-50 dark:bg-emerald-500/10',
            icon: 'text-emerald-600 dark:text-emerald-400',
            ring: 'ring-emerald-100 dark:ring-emerald-500/20',
        },
        purple: {
            bg: 'bg-purple-50 dark:bg-purple-500/10',
            icon: 'text-purple-600 dark:text-purple-400',
            ring: 'ring-purple-100 dark:ring-purple-500/20',
        },
        amber: {
            bg: 'bg-amber-50 dark:bg-amber-500/10',
            icon: 'text-amber-600 dark:text-amber-400',
            ring: 'ring-amber-100 dark:ring-amber-500/20',
        },
        indigo: {
            bg: 'bg-indigo-50 dark:bg-indigo-500/10',
            icon: 'text-indigo-600 dark:text-indigo-400',
            ring: 'ring-indigo-100 dark:ring-indigo-500/20',
        },
        pink: {
            bg: 'bg-pink-50 dark:bg-pink-500/10',
            icon: 'text-pink-600 dark:text-pink-400',
            ring: 'ring-pink-100 dark:ring-pink-500/20',
        },
    }

    const c = colorMap[color] || colorMap.blue

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.08 }}
            className="group relative rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-5 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-gray-900/30 transition-all duration-300"
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                        {label}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {value}
                    </p>
                    {description && (
                        <p className="text-xs text-gray-400 mt-1.5">{description}</p>
                    )}
                </div>
                <div className={`w-11 h-11 rounded-xl ${c.bg} ring-1 ${c.ring} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`text-xl ${c.icon}`} />
                </div>
            </div>
        </motion.div>
    )
}

export default StatCard
