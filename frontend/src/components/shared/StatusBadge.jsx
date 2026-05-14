import Tag from '@/components/ui/Tag'

const colorMap = {
    ACTIVE: { bg: 'bg-emerald-100 dark:bg-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400' },
    COMPLETED: { bg: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-600 dark:text-blue-400' },
    CANCELLED: { bg: 'bg-red-100 dark:bg-red-500/20', text: 'text-red-600 dark:text-red-400' },
    PENDING: { bg: 'bg-amber-100 dark:bg-amber-500/20', text: 'text-amber-600 dark:text-amber-400' },
    FAILED: { bg: 'bg-red-100 dark:bg-red-500/20', text: 'text-red-600 dark:text-red-400' },
    REFUNDED: { bg: 'bg-violet-100 dark:bg-violet-500/20', text: 'text-violet-600 dark:text-violet-400' },
    TOP_UP: { bg: 'bg-emerald-100 dark:bg-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400' },
    PAYMENT: { bg: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-600 dark:text-blue-400' },
    REFUND: { bg: 'bg-amber-100 dark:bg-amber-500/20', text: 'text-amber-600 dark:text-amber-400' },
    NO_SHOW: { bg: 'bg-orange-100 dark:bg-orange-500/20', text: 'text-orange-600 dark:text-orange-400' },
}

const fallback = { bg: 'bg-gray-100 dark:bg-gray-600', text: 'text-gray-600 dark:text-gray-300' }

const StatusBadge = ({ status }) => {
    const c = colorMap[status] || fallback
    return (
        <Tag className={`${c.bg} ${c.text} border-0 font-semibold rounded-lg`}>
            {status}
        </Tag>
    )
}

export default StatusBadge
