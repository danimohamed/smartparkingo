'use client'
import { motion } from 'framer-motion'
import {
    PiLightbulbDuotone,
    PiTrendUpBold,
    PiClockDuotone,
} from 'react-icons/pi'

const INSIGHT_ICONS = [PiLightbulbDuotone, PiTrendUpBold, PiClockDuotone]
const INSIGHT_COLORS = [
    'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20',
    'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20',
    'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-500/20',
]

const InsightCard = ({ insights = [] }) => {
    if (insights.length === 0) return null

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {insights.map((text, i) => {
                const Icon = INSIGHT_ICONS[i % INSIGHT_ICONS.length]
                const color = INSIGHT_COLORS[i % INSIGHT_COLORS.length]
                return (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${color}`}
                    >
                        <Icon className="text-lg flex-shrink-0" />
                        <p className="text-xs font-medium">{text}</p>
                    </motion.div>
                )
            })}
        </div>
    )
}

export default InsightCard
