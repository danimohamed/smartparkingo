'use client'
import StatusBadge from '@/components/shared/StatusBadge'
import dayjs from 'dayjs'

const ActivityItem = ({ icon: Icon, title, subtitle, amount, status, date, iconColor = 'bg-gray-100 dark:bg-gray-700' }) => {
    return (
        <div className="flex items-center gap-3.5 py-3 border-b border-gray-50 dark:border-gray-800 last:border-0">
            <div className={`w-9 h-9 rounded-xl ${iconColor} flex items-center justify-center flex-shrink-0`}>
                <Icon className="text-base text-gray-600 dark:text-gray-300" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                    {title}
                </p>
                <p className="text-xs text-gray-400 truncate">
                    {subtitle || (date ? dayjs(date).format('MMM DD, HH:mm') : '')}
                </p>
            </div>
            <div className="flex flex-col items-end flex-shrink-0 gap-1">
                {amount !== undefined && (
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                        {amount} MAD
                    </span>
                )}
                {status && <StatusBadge status={status} />}
            </div>
        </div>
    )
}

export default ActivityItem
