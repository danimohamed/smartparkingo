'use client'
import { useOwnerEarnings } from '@/hooks/useOwner'
import Card from '@/components/ui/Card'
import Skeleton from '@/components/ui/Skeleton'
import { useTranslations } from 'next-intl'
import {
    PiCurrencyDollarDuotone,
    PiTrendUpDuotone,
    PiClockDuotone,
} from 'react-icons/pi'
import Link from 'next/link'
import Button from '@/components/ui/Button'

const OwnerEarningsClient = () => {
    const { data: earnings, isLoading } = useOwnerEarnings()
    const t = useTranslations('owner.earnings')

    if (isLoading) {
        return (
            <div className="flex flex-col gap-4">
                <Skeleton width={280} height={32} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} height={120} />
                    ))}
                </div>
            </div>
        )
    }

    const cards = [
        {
            label: t('stat.total'),
            value: `${(earnings?.totalEarnings ?? 0).toFixed(2)} MAD`,
            icon: <PiCurrencyDollarDuotone className="text-2xl text-amber-500" />,
            bg: 'bg-amber-50 dark:bg-amber-500/10',
        },
        {
            label: t('stat.thisMonth'),
            value: `${(earnings?.thisMonthEarnings ?? 0).toFixed(2)} MAD`,
            icon: <PiTrendUpDuotone className="text-2xl text-cyan-500" />,
            bg: 'bg-cyan-50 dark:bg-cyan-500/10',
        },
        {
            label: t('stat.today'),
            value: `${(earnings?.todayEarnings ?? 0).toFixed(2)} MAD`,
            icon: <PiClockDuotone className="text-2xl text-rose-500" />,
            bg: 'bg-rose-50 dark:bg-rose-500/10',
        },
    ]

    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h3 className="text-xl sm:text-2xl font-bold">{t('title')}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-base">
                        {t('subtitle')}
                    </p>
                </div>
                <Link href="/owner/withdrawals">
                    <Button variant="solid">{t('requestWithdrawal')}</Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {cards.map((card) => (
                    <Card key={card.label} className="p-6">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${card.bg}`}>
                                {card.icon}
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {card.label}
                                </p>
                                <p className="text-2xl font-bold">{card.value}</p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    )
}

export default OwnerEarningsClient
