'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'

const QuickActionCard = ({ icon: Icon, label, href, color, index = 0 }) => {
    const colorMap = {
        indigo: 'from-indigo-500 to-blue-500 shadow-indigo-500/20',
        emerald: 'from-emerald-500 to-teal-500 shadow-emerald-500/20',
        amber: 'from-amber-500 to-orange-500 shadow-amber-500/20',
        purple: 'from-purple-500 to-pink-500 shadow-purple-500/20',
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.06 }}
        >
            <Link href={href} className="block group">
                <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${colorMap[color] || colorMap.indigo} p-4 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5`}>
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
                            <Icon className="text-xl" />
                        </div>
                        <span className="text-sm font-bold">{label}</span>
                    </div>
                </div>
            </Link>
        </motion.div>
    )
}

export default QuickActionCard
