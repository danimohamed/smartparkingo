'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { PiCarDuotone, PiCheckCircleDuotone, PiUsersDuotone, PiCurrencyDollarDuotone } from 'react-icons/pi'

/**
 * Animated counter hook - counts up to a target number
 */
const useAnimatedCounter = (target, duration = 1200) => {
    const [count, setCount] = useState(0)

    useEffect(() => {
        if (target === 0) {
            setCount(0)
            return
        }
        const startTime = performance.now()
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime
            const progress = Math.min(elapsed / duration, 1)
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3)
            const currentCount = Math.round(eased * target)
            setCount(currentCount)
            if (progress < 1) {
                requestAnimationFrame(animate)
            }
        }
        requestAnimationFrame(animate)
    }, [target, duration])

    return count
}

const statCardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: 'spring', stiffness: 300, damping: 25 },
    },
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
}

const StatCard = ({ icon, label, value, suffix, color, bgColor }) => {
    const animatedValue = useAnimatedCounter(value)

    return (
        <motion.div
            variants={statCardVariants}
            whileHover={{ y: -4, boxShadow: '0 12px 40px -12px rgba(0,0,0,0.15)' }}
            className={`${bgColor} rounded-2xl p-5 flex items-center gap-4 transition-shadow`}
        >
            <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center shadow-sm`}>
                {icon}
            </div>
            <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">
                    {label}
                </div>
                <div className="text-2xl font-bold mt-0.5">
                    {animatedValue}
                    {suffix && <span className="text-sm text-gray-400 font-normal ml-1">{suffix}</span>}
                </div>
            </div>
        </motion.div>
    )
}

const ParkingOverview = ({ parking, slots }) => {
    const totalSlots = parking?.totalSlots || slots?.length || 0
    const availableSlots = slots?.filter(s => s.status === 'AVAILABLE').length || 0
    const occupiedSlots = slots?.filter(s => s.status === 'OCCUPIED').length || 0

    const stats = [
        {
            icon: <PiCarDuotone className="text-xl text-white" />,
            label: 'Total Slots',
            value: totalSlots,
            color: 'bg-blue-500',
            bgColor: 'bg-blue-50 dark:bg-blue-500/10',
        },
        {
            icon: <PiCheckCircleDuotone className="text-xl text-white" />,
            label: 'Available',
            value: availableSlots,
            suffix: `/ ${totalSlots}`,
            color: 'bg-emerald-500',
            bgColor: 'bg-emerald-50 dark:bg-emerald-500/10',
        },
        {
            icon: <PiUsersDuotone className="text-xl text-white" />,
            label: 'Occupied',
            value: occupiedSlots,
            color: 'bg-red-500',
            bgColor: 'bg-red-50 dark:bg-red-500/10',
        },
        {
            icon: <PiCurrencyDollarDuotone className="text-xl text-white" />,
            label: 'Price',
            value: parking?.pricePerHour || 0,
            suffix: 'MAD/h',
            color: 'bg-primary',
            bgColor: 'bg-primary/5',
        },
    ]

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
            {stats.map((stat, index) => (
                <StatCard key={index} {...stat} />
            ))}
        </motion.div>
    )
}

export default ParkingOverview



