'use client'
import { useEffect, useMemo, useState } from 'react'
import { useOwnerDashboard, useOwnerReservations } from '@/hooks/useOwner'
import Card from '@/components/ui/Card'
import Skeleton from '@/components/ui/Skeleton'
import { apiGetCurrentUser } from '@/services/UserService'
import { useTranslations } from 'next-intl'
import {
    PiCarDuotone,
    PiSquaresFourDuotone,
    PiCalendarCheckDuotone,
    PiCurrencyDollarDuotone,
    PiTrendUpDuotone,
    PiClockDuotone,
    PiShieldCheckDuotone,
    PiXCircleFill,
} from 'react-icons/pi'
import dynamic from 'next/dynamic'
import Link from 'next/link'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

const statusColor = {
    ACTIVE: 'bg-emerald-500',
    COMPLETED: 'bg-blue-500',
    CANCELLED: 'bg-red-500',
}

const OwnerDashboardClient = () => {
    const { data: stats, isLoading } = useOwnerDashboard()
    const { data: reservations = [] } = useOwnerReservations()
    const [isAdmin, setIsAdmin] = useState(false)
    const t = useTranslations('owner.dashboard')
    const tStatus = useTranslations('owner.reservationStatus')

    useEffect(() => {
        let mounted = true
        apiGetCurrentUser()
            .then((res) => {
                const role = res?.data?.role
                if (mounted) setIsAdmin(role === 'ADMIN')
            })
            .catch(() => {})
        return () => {
            mounted = false
        }
    }, [])

    const recentReservations = useMemo(() => {
        return [...reservations]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5)
    }, [reservations])

    if (isLoading) {
        return (
            <div className="flex flex-col gap-6">
                <Skeleton width={280} height={32} />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} height={120} />
                    ))}
                </div>
            </div>
        )
    }

    const statCards = [
        {
            label: t('stat.totalParkings'),
            value: stats?.totalParkings ?? 0,
            icon: <PiCarDuotone className="text-2xl text-blue-500" />,
            bg: 'bg-blue-50 dark:bg-blue-500/10',
        },
        {
            label: t('stat.totalSlots'),
            value: stats?.totalSlots ?? 0,
            icon: <PiSquaresFourDuotone className="text-2xl text-violet-500" />,
            bg: 'bg-violet-50 dark:bg-violet-500/10',
        },
        {
            label: t('stat.activeReservations'),
            value: stats?.activeReservations ?? 0,
            icon: <PiCalendarCheckDuotone className="text-2xl text-emerald-500" />,
            bg: 'bg-emerald-50 dark:bg-emerald-500/10',
        },
        {
            label: t('stat.totalEarnings'),
            value: `${(stats?.totalEarnings ?? 0).toFixed(2)} MAD`,
            icon: <PiCurrencyDollarDuotone className="text-2xl text-amber-500" />,
            bg: 'bg-amber-50 dark:bg-amber-500/10',
        },
        {
            label: t('stat.thisMonth'),
            value: `${(stats?.thisMonthEarnings ?? 0).toFixed(2)} MAD`,
            icon: <PiTrendUpDuotone className="text-2xl text-cyan-500" />,
            bg: 'bg-cyan-50 dark:bg-cyan-500/10',
        },
        {
            label: t('stat.today'),
            value: `${(stats?.todayEarnings ?? 0).toFixed(2)} MAD`,
            icon: <PiClockDuotone className="text-2xl text-rose-500" />,
            bg: 'bg-rose-50 dark:bg-rose-500/10',
        },
        {
            label: 'App users today',
            value: stats?.appUsersToday ?? 0,
            icon: <PiShieldCheckDuotone className="text-2xl text-emerald-600" />,
            bg: 'bg-emerald-50 dark:bg-emerald-500/10',
        },
        {
            label: 'Non-app users today',
            value: stats?.nonAppUsersToday ?? 0,
            icon: <PiXCircleFill className="text-2xl text-red-500" />,
            bg: 'bg-red-50 dark:bg-red-500/10',
        },
    ]

    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            <div>
                <h3 className="text-xl sm:text-2xl font-bold">{t('title')}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-base">
                    {isAdmin ? t('subtitleAdmin') : t('subtitleOwner')}
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {statCards.map((card) => (
                    <Card key={card.label} className="p-4">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${card.bg}`}>
                                {card.icon}
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {card.label}
                                </p>
                                <p className="text-xl font-bold">{card.value}</p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Quick Links (owners only) */}
            {!isAdmin && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link href="/owner/parkings">
                        <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                            <div className="flex items-center gap-3">
                                <PiCarDuotone className="text-xl text-blue-500" />
                                <span className="font-semibold">{t('quick.manageParkings')}</span>
                            </div>
                        </Card>
                    </Link>
                    <Link href="/owner/reservations">
                        <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                            <div className="flex items-center gap-3">
                                <PiCalendarCheckDuotone className="text-xl text-emerald-500" />
                                <span className="font-semibold">{t('quick.viewReservations')}</span>
                            </div>
                        </Card>
                    </Link>
                    <Link href="/owner/withdrawals">
                        <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                            <div className="flex items-center gap-3">
                                <PiCurrencyDollarDuotone className="text-xl text-amber-500" />
                                <span className="font-semibold">{t('quick.withdrawals')}</span>
                            </div>
                        </Card>
                    </Link>
                </div>
            )}

            {/* Recent Reservations */}
            <Card>
                <div className="p-4">
                    <h5 className="font-bold mb-4">{t('recent.title')}</h5>
                    {recentReservations.length === 0 ? (
                        <p className="text-gray-500 text-sm">{t('recent.empty')}</p>
                    ) : (
                        <>
                            {/* Mobile card view */}
                            <div className="block md:hidden space-y-3">
                                {recentReservations.map((r) => (
                                    <div key={r.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-sm">{r.userFullName}</span>
                                            <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full ${r.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : r.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${statusColor[r.status] || 'bg-gray-400'}`} />
                                                {tStatus(r.status)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500">{r.parkingName} · {t('recent.slotShort', { number: r.slotNumber })}</p>
                                        <div className="flex items-center justify-between pt-1.5 border-t border-gray-100 dark:border-gray-700">
                                            <span className="font-bold text-sm">{r.totalPrice?.toFixed(2)} MAD</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {/* Desktop table view */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-gray-500 dark:text-gray-400 border-b">
                                            <th className="pb-2 font-medium">{t('recent.user')}</th>
                                            <th className="pb-2 font-medium">{t('recent.parking')}</th>
                                            <th className="pb-2 font-medium">{t('recent.slot')}</th>
                                            <th className="pb-2 font-medium">{t('recent.status')}</th>
                                            <th className="pb-2 font-medium">{t('recent.price')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentReservations.map((r) => (
                                            <tr key={r.id} className="border-b last:border-b-0">
                                                <td className="py-2">{r.userFullName}</td>
                                                <td className="py-2">{r.parkingName}</td>
                                                <td className="py-2">{r.slotNumber}</td>
                                                <td className="py-2">
                                                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${statusColor[r.status] || 'bg-gray-400'}`} />
                                                    {tStatus(r.status)}
                                                </td>
                                                <td className="py-2">{r.totalPrice?.toFixed(2)} MAD</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </Card>
        </div>
    )
}

export default OwnerDashboardClient
