'use client'
import { useMemo } from 'react'
import { useDashboardData } from '@/hooks/useDashboard'
import useCurrentSession from '@/utils/hooks/useCurrentSession'
import { useTranslations } from 'next-intl'
import Card from '@/components/ui/Card'
import Skeleton from '@/components/ui/Skeleton'
import StatCard from '@/components/shared/dashboard/StatCard'
import SectionContainer from '@/components/shared/dashboard/SectionContainer'
import ActivityItem from '@/components/shared/dashboard/ActivityItem'
import ChartCard from '@/components/shared/dashboard/ChartCard'
import QuickActionCard from '@/components/shared/dashboard/QuickActionCard'
import InsightCard from '@/components/shared/dashboard/InsightCard'
import StatusBadge from '@/components/shared/StatusBadge'
import EmptyState from '@/components/shared/EmptyState'
import StatsSkeleton from '@/components/shared/loaders/StatsSkeleton'
import Link from 'next/link'
import dayjs from 'dayjs'
import { motion } from 'framer-motion'
import {
    PiCalendarCheckDuotone,
    PiCreditCardDuotone,
    PiWalletDuotone,
    PiMapPinDuotone,
    PiCarDuotone,
    PiMagnifyingGlassDuotone,
    PiMapTrifoldDuotone,
    PiArrowUpBold,
    PiReceiptDuotone,
    PiClockDuotone,
    PiArrowRightBold,
    PiArrowDownBold,
    PiArrowCounterClockwiseBold,
    PiStarDuotone,
    PiCalendarBlankDuotone,
    PiDownloadSimpleBold,
} from 'react-icons/pi'
import { COLOR_1, COLOR_2, COLOR_4 } from '@/constants/chart.constant'
import generateInvoicePdf from '@/utils/generateInvoicePdf'

// --- Greeting helper (locale-aware via i18n keys) ---
const getGreetingKey = () => {
    const h = new Date().getHours()
    if (h < 12) return 'greetingMorning'
    if (h < 18) return 'greetingAfternoon'
    return 'greetingEvening'
}

// --- Dashboard Skeleton ---
const DashboardSkeleton = () => (
    <div className="flex flex-col gap-4 sm:gap-6 max-w-6xl mx-auto">
        <div>
            <Skeleton width={260} height={28} className="mb-2 rounded-lg" />
            <Skeleton width={180} height={14} className="rounded" />
        </div>
        <StatsSkeleton count={4} />
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} height={64} className="rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Skeleton height={300} className="rounded-2xl" />
            <Skeleton height={300} className="rounded-2xl" />
        </div>
    </div>
)

// --- Wallet Preview (receives t from parent via prop) ---
const WalletPreview = ({ balance, transactions, t }) => {
    const recent = transactions.slice(0, 3)
    const txIcon = { TOP_UP: PiArrowUpBold, PAYMENT: PiArrowDownBold, REFUND: PiArrowCounterClockwiseBold }
    const txColor = {
        TOP_UP: 'bg-emerald-100 dark:bg-emerald-500/15',
        PAYMENT: 'bg-blue-100 dark:bg-blue-500/15',
        REFUND: 'bg-amber-100 dark:bg-amber-500/15',
    }

    return (
        <SectionContainer title={t('section.wallet')} viewAllHref="/my-wallet">
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-4 text-white mb-4">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10 flex items-center gap-3">
                    <PiWalletDuotone className="text-2xl" />
                    <div>
                        <p className="text-xs opacity-70 font-medium">{t('section.balance')}</p>
                        <p className="text-xl font-bold">{(balance || 0).toFixed(2)} MAD</p>
                    </div>
                </div>
            </div>
            {recent.length === 0 ? (
                <p className="text-center text-gray-400 text-xs py-4">{t('section.noTransactions')}</p>
            ) : (
                <div>
                    {recent.map((tx) => {
                        const Icon = txIcon[tx.type] || PiCreditCardDuotone
                        return (
                            <ActivityItem key={tx.id} icon={Icon} iconColor={txColor[tx.type] || 'bg-gray-100 dark:bg-gray-700'}
                                title={tx.description || tx.type} date={tx.createdAt} amount={tx.amount?.toFixed(2)} status={tx.type} />
                        )
                    })}
                </div>
            )}
            <Link href="/my-wallet" className="mt-3 block w-full text-center py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors">
                {t('section.topUp')}
            </Link>
        </SectionContainer>
    )
}

// --- Main Component ---
const HomeClient = () => {
    const { data, isLoading } = useDashboardData()
    const { session } = useCurrentSession()
    const t = useTranslations('home')

    const userName = session?.user?.name || 'User'

    const { parkings = [], reservations = [], payments = [], walletBalance = 0, transactions = [] } = data || {}

    const activeReservations = useMemo(() => reservations.filter(r => r.status === 'ACTIVE'), [reservations])
    const completedPayments = useMemo(() => payments.filter(p => p.status === 'COMPLETED'), [payments])
    const totalSpent = useMemo(() => completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0), [completedPayments])

    const upcomingReservations = useMemo(() =>
        reservations.filter(r => r.status === 'ACTIVE' && dayjs(r.endTime).isAfter(dayjs()))
            .sort((a, b) => new Date(a.startTime) - new Date(b.startTime)).slice(0, 5),
    [reservations])

    const recentPayments = useMemo(() =>
        [...payments].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 4),
    [payments])

    const spendingChartData = useMemo(() => {
        const weeks = Array.from({ length: 4 }, (_, i) => {
            const start = dayjs().subtract(3 - i, 'week').startOf('week')
            const end = start.endOf('week')
            return { label: start.format('MMM DD'), start, end, amount: 0 }
        })
        completedPayments.forEach(p => {
            const d = dayjs(p.createdAt)
            const week = weeks.find(w => d.isAfter(w.start) && d.isBefore(w.end))
            if (week) week.amount += p.amount || 0
        })
        return weeks
    }, [completedPayments])

    const resChartData = useMemo(() => {
        const weeks = Array.from({ length: 4 }, (_, i) => {
            const start = dayjs().subtract(3 - i, 'week').startOf('week')
            const end = start.endOf('week')
            return { label: start.format('MMM DD'), start, end, count: 0 }
        })
        reservations.forEach(r => {
            const d = dayjs(r.createdAt || r.startTime)
            const week = weeks.find(w => d.isAfter(w.start) && d.isBefore(w.end))
            if (week) week.count++
        })
        return weeks
    }, [reservations])

    // Smart insights — fully translated
    const insights = useMemo(() => {
        const out = []
        const thisWeekStart = dayjs().startOf('week')
        const weekSpent = completedPayments.filter(p => dayjs(p.createdAt).isAfter(thisWeekStart)).reduce((s, p) => s + (p.amount || 0), 0)
        if (weekSpent > 0) out.push(t('insight.weeklySpend', { amount: weekSpent.toFixed(2) }))

        const parkingCounts = {}
        reservations.forEach(r => { if (r.parkingName) parkingCounts[r.parkingName] = (parkingCounts[r.parkingName] || 0) + 1 })
        const topParking = Object.entries(parkingCounts).sort((a, b) => b[1] - a[1])[0]
        if (topParking) out.push(t('insight.mostUsed', { name: topParking[0] }))

        const hourCounts = {}
        reservations.forEach(r => {
            if (r.startTime) {
                const h = dayjs(r.startTime).hour()
                const period = h < 12 ? 'Morning' : h < 18 ? 'Afternoon' : 'Evening'
                hourCounts[period] = (hourCounts[period] || 0) + 1
            }
        })
        const bestTime = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]
        if (bestTime) {
            const keyMap = { Morning: 'bestTimeMorning', Afternoon: 'bestTimeAfternoon', Evening: 'bestTimeEvening' }
            out.push(t(`insight.${keyMap[bestTime[0]]}`))
        }
        return out
    }, [reservations, completedPayments, t])

    const favoriteParkingName = useMemo(() => {
        const counts = {}
        reservations.forEach(r => { if (r.parkingName) counts[r.parkingName] = (counts[r.parkingName] || 0) + 1 })
        const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
        return top ? top[0] : null
    }, [reservations])

    if (isLoading) return <DashboardSkeleton />

    return (
        <div className="flex flex-col gap-4 sm:gap-6 max-w-6xl mx-auto">
            {/* Greeting */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <h3 className="font-bold text-xl sm:text-2xl text-gray-900 dark:text-white">
                    {t(getGreetingKey())}, {userName.split(' ')[0]} 👋
                </h3>
                <p className="text-gray-400 text-xs sm:text-sm mt-1">{t('subtitle')}</p>
            </motion.div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard icon={PiCalendarCheckDuotone} label={t('stat.activeReservations')}
                    value={activeReservations.length} description={t('stat.activeReservationsDesc', { count: reservations.length })}
                    color="emerald" index={0} />
                <StatCard icon={PiWalletDuotone} label={t('stat.walletBalance')}
                    value={`${walletBalance.toFixed(2)} MAD`} description={t('stat.walletBalanceDesc')}
                    color="indigo" index={1} />
                <StatCard icon={PiCreditCardDuotone} label={t('stat.totalSpent')}
                    value={`${totalSpent.toFixed(2)} MAD`} description={t('stat.totalSpentDesc', { count: completedPayments.length })}
                    color="purple" index={2} />
                <StatCard
                    icon={favoriteParkingName ? PiStarDuotone : PiCarDuotone}
                    label={favoriteParkingName ? t('stat.favoriteParking') : t('stat.availableParkings')}
                    value={favoriteParkingName || parkings.length}
                    description={favoriteParkingName ? t('stat.favoriteParkingDesc') : t('stat.availableParkingsDesc')}
                    color="amber" index={3} />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <QuickActionCard icon={PiMagnifyingGlassDuotone} label={t('quick.findParking')} href="/parkings" color="indigo" index={0} />
                <QuickActionCard icon={PiMapTrifoldDuotone} label={t('quick.viewMap')} href="/parking-map" color="emerald" index={1} />
                <QuickActionCard icon={PiArrowUpBold} label={t('quick.topUpWallet')} href="/my-wallet" color="amber" index={2} />
                <QuickActionCard icon={PiCalendarCheckDuotone} label={t('quick.myReservations')} href="/my-reservations" color="purple" index={3} />
            </div>

            {/* Smart Insights */}
            <InsightCard insights={insights} />

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartCard title={t('section.reservations')} subtitle={t('section.reservationsSubtitle')} type="area"
                    series={[{ name: t('section.reservations'), data: resChartData.map(w => w.count) }]}
                    xAxis={resChartData.map(w => w.label)} height={260}
                    customOptions={{
                        colors: [COLOR_1],
                        fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 90, 100] } },
                        stroke: { width: 2.5, curve: 'smooth' },
                        xaxis: { categories: resChartData.map(w => w.label) },
                        yaxis: { labels: { formatter: v => Math.round(v).toString() } },
                        dataLabels: { enabled: false },
                        chart: { toolbar: { show: false }, zoom: { enabled: false } },
                    }} />
                <ChartCard title={t('section.spending')} subtitle={t('section.spendingSubtitle')} type="bar"
                    series={[{ name: t('section.spending'), data: spendingChartData.map(w => Math.round(w.amount * 100) / 100) }]}
                    xAxis={spendingChartData.map(w => w.label)} height={260}
                    customOptions={{
                        colors: [COLOR_4],
                        plotOptions: { bar: { borderRadius: 6, borderRadiusApplication: 'end', columnWidth: '45%' } },
                        xaxis: { categories: spendingChartData.map(w => w.label) },
                        dataLabels: { enabled: false },
                        chart: { toolbar: { show: false }, zoom: { enabled: false } },
                        tooltip: { y: { formatter: v => `${v.toFixed(2)} MAD` } },
                    }} />
            </div>

            {/* Upcoming Reservations + Wallet */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                    <SectionContainer title={t('section.upcoming')} viewAllHref="/my-reservations">
                        {upcomingReservations.length === 0 ? (
                            <EmptyState icon={PiCalendarBlankDuotone} title={t('section.upcomingEmpty')} description={t('section.upcomingEmptyDesc')}
                                action={
                                    <Link href="/parkings" className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-500 hover:text-indigo-600 transition-colors">
                                        {t('section.findParkingCta')} <PiArrowRightBold />
                                    </Link>
                                } />
                        ) : (
                            <div className="space-y-1">
                                {upcomingReservations.map(r => (
                                    <div key={r.id} className="flex items-center gap-3.5 py-3 border-b border-gray-50 dark:border-gray-800 last:border-0">
                                        <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                                            <PiCarDuotone className="text-base text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                                                {r.parkingName} — {t('section.slot')} {r.slotNumber}
                                            </p>
                                            <p className="text-xs text-gray-400 flex items-center gap-1">
                                                <PiClockDuotone className="text-[11px]" />
                                                {dayjs(r.startTime).format('DD/MM HH:mm')} → {dayjs(r.endTime).format('HH:mm')}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end flex-shrink-0 gap-1">
                                            <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{r.totalPrice} MAD</span>
                                            <StatusBadge status={r.status} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </SectionContainer>
                </div>
                <WalletPreview balance={walletBalance} transactions={transactions} t={t} />
            </div>

            {/* Recent Payments */}
            {recentPayments.length > 0 && (
                <SectionContainer title={t('section.recentPayments')} viewAllHref="/my-payments">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                        {recentPayments.map(p => (
                            <div key={p.id} className="flex items-center gap-3.5 py-3 border-b border-gray-50 dark:border-gray-800 last:border-0">
                                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                                    <PiReceiptDuotone className="text-base text-gray-600 dark:text-gray-300" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                                        {p.parkingName || `Payment INV-${String(p.id).padStart(5, '0')}`}
                                    </p>
                                    <p className="text-xs text-gray-400 truncate">
                                        {p.createdAt ? dayjs(p.createdAt).format('DD/MM/YYYY HH:mm') : ''}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {p.status === 'COMPLETED' && (
                                        <button className="p-1 rounded-md text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
                                            title={t('downloadInvoice')} onClick={() => generateInvoicePdf(p)}>
                                            <PiDownloadSimpleBold className="text-base" />
                                        </button>
                                    )}
                                    <div className="flex flex-col items-end gap-1">
                                        {p.amount !== undefined && (
                                            <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{p.amount?.toFixed(2)} MAD</span>
                                        )}
                                        <StatusBadge status={p.status} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </SectionContainer>
            )}

            {/* Available Parkings */}
            {parkings.length > 0 && (
                <SectionContainer title={t('section.availableParkings')} viewAllHref="/parkings">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {parkings.slice(0, 6).map((p, i) => (
                            <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                                <Link href={`/parkings/${p.id}`}>
                                    <div className="group rounded-xl border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 transition-all cursor-pointer">
                                        <div className="flex items-center gap-2.5 mb-2.5">
                                            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                                                <PiCarDuotone className="text-sm text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <h6 className="font-bold text-sm text-gray-800 dark:text-gray-200 truncate">{p.name}</h6>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
                                            <PiMapPinDuotone className="flex-shrink-0" />
                                            <span className="truncate">{p.address}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs">
                                                <span className="text-emerald-500 font-bold">{p.availableSlots}</span>
                                                <span className="text-gray-400">/{p.totalSlots} {t('slots')}</span>
                                            </span>
                                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{p.pricePerHour} {t('perHour')}</span>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </SectionContainer>
            )}
        </div>
    )
}

export default HomeClient

