'use client'
import { motion } from 'framer-motion'
import Tag from '@/components/ui/Tag'
import useChatStore from './useChatStore'
import { useTranslations } from 'next-intl'

const QUICK_PROMPT_KEYS = [
    'bookParking',
    'availableSpots',
    'myReservations',
    'payReservation',
    'walletBalance',
    'cancelBooking',
]

export default function QuickPrompts({ onSelect }) {
    const t = useTranslations('chatbot.quickPrompts')
    const messages = useChatStore((s) => s.messages)
    if (messages.length > 0) return null
    return (
        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
            {QUICK_PROMPT_KEYS.map((key, i) => (
                <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                >
                    <Tag
                        className="cursor-pointer hover:bg-primary-subtle hover:text-primary hover:border-primary/30 transition-colors text-[10px]"
                        onClick={() => onSelect(t(`${key}.text`))}
                    >
                        {t(`${key}.label`)}
                    </Tag>
                </motion.div>
            ))}
        </div>
    )
}
