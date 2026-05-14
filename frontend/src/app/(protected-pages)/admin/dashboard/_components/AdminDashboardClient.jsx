'use client'
import { useEffect, useState, useMemo } from 'react'
import {
    apiGetDashboard,
    apiGetAllReservations,
    apiGetAllPayments,
    apiGetAllUsers,
} from '@/services/AdminService'
import Card from '@/components/ui/Card'
import Tag from '@/components/ui/Tag'
import Button from '@/components/ui/Button'
import Skeleton from '@/components/ui/Skeleton'
import Segment from '@/components/ui/Segment'
import {
    PiCarDuotone,
    PiUsersDuotone,
    PiCalendarCheckDuotone,
    PiCreditCardDuotone,
    PiSquaresFourDuotone,
    PiClockDuotone,
    PiTrendUpDuotone,
    PiWalletDuotone,
    PiArrowRightBold,
    PiWarningDuotone,
    PiCurrencyDollarDuotone,
    PiLightningDuotone,
    PiMapPinDuotone,
    PiDownloadSimpleBold,
} from 'react-icons/pi'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import logger from '@/utils/logger'
import generateInvoicePdf from '@/utils/generateInvoicePdf'
import { useTranslations } from 'next-intl'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

const statusColor = {
    ACTIVE: 'bg-emerald-500',
    COMPLETED: 'bg-blue-500',
    CANCELLED: 'bg-red-500',
}

const paymentStatusColor = {
    PENDING: 'bg-amber-500',
    COMPLETED: 'bg-emerald-500',
    FAILED: 'bg-red-500',
    REFUNDED: 'bg-blue-500',
}

const AdminDashboardClient = () => {
    const t = useTranslations('admin.dashboard')
    const tCommon = useTranslations('admin.common')
    const tStatus = useTranslations('admin.status')
    const tPaymentStatus = useTranslations('admin.paymentStatus')
    const [stats, setStats] = useState(null)
    const [reservations, setReservations] = useState([])
    const [payments, setPayments] = useState([])
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [chartPeriod, setChartPeriod] = useState('30')

    useEffect(() => {
        const fetchAll = async () => {
            let errorMsg = null

            try {
                const results = await Promise.allSettled([
                    apiGetDashboard(),
                    apiGetAllReservations(),
                    apiGetAllPayments(),
                    apiGetAllUsers(),
                ])

                const [dashResult, resResult, payResult, usrResult] = results

                // Check for auth errors first (401/403)
                const firstRejected = results.find((r) => r.status === 'rejected')
                if (firstRejected) {
                    const status = firstRejected.reason?.response?.status
                    if (status === 401) {
                            errorMsg = t('sessionExpired')
                    } else if (status === 403) {
                            errorMsg = t('accessDeniedDashboard')
                    } else {
                        logger.error('Dashboard API error:', firstRejected.reason)
                    }
                }

                if (dashResult.status === 'fulfilled') {
                    setStats(dashResult.value?.data || null)
                } else {
                    logger.error('Failed to load dashboard stats:', dashResult.reason)
                    if (!errorMsg) {
                        const status = dashResult.reason?.response?.status
                        if (status === 401) {
                            errorMsg = t('sessionExpired')
                        } else if (status === 403) {
                            errorMsg = t('accessDenied')
                        } else {
                            errorMsg = t('loadFailed')
                        }
                    }
                }

                if (resResult.status === 'fulfilled') {
                    setReservations(resResult.value?.data || [])
                }
                if (payResult.status === 'fulfilled') {
                    setPayments(payResult.value?.data || [])
                }
                if (usrResult.status === 'fulfilled') {
                    setUsers(usrResult.value?.data || [])
                }
            } catch (err) {
                logger.error('Failed to load dashboard', err)
                errorMsg = t('unexpected')
            } finally {
                if (errorMsg) setError(errorMsg)
                setLoading(false)
            }
        }
        fetchAll()
    }, [t])

    // Chart data from backend
    const reservationChartData = useMemo(() => {
        if (!stats?.reservationsPerDay) return { categories: [], series: [] }
        const entries = Object.entries(stats.reservationsPerDay)
        const sliced = chartPeriod === '7' ? entries.slice(-7) : chartPeriod === '14' ? entries.slice(-14) : entries
        return {
            categories: sliced.map(([d]) => d),
            series: [{ name: t('charts.reservations'), data: sliced.map(([, v]) => v) }],
        }
    }, [stats, chartPeriod, t])

    const revenueChartData = useMemo(() => {
        if (!stats?.revenuePerDay) return { categories: [], series: [] }
        const entries = Object.entries(stats.revenuePerDay)
        const sliced = chartPeriod === '7' ? entries.slice(-7) : chartPeriod === '14' ? entries.slice(-14) : entries
        return {
            categories: sliced.map(([d]) => d),
            series: [{ name: t('charts.revenue'), data: sliced.map(([, v]) => parseFloat(v.toFixed(2))) }],
        }
    }, [stats, chartPeriod, t])

    // Slot status donut
    const slotDonutData = useMemo(() => {
        if (!stats) return { labels: [], series: [] }
        return {
            labels: [t('charts.available'), t('charts.occupied'), t('charts.reserved'), t('charts.maintenance')],
            series: [stats.availableSlots, stats.occupiedSlots || 0, stats.reservedSlots || 0, stats.maintenanceSlots || 0],
        }
    }, [stats, t])

    // Reservation status donut
    const reservationDonutData = useMemo(() => {
        if (!stats) return { labels: [], series: [] }
        return {
            labels: [t('charts.active'), t('charts.completed'), t('charts.cancelled')],
            series: [stats.activeReservations || 0, stats.completedReservations || 0, stats.cancelledReservations || 0],
        }
    }, [stats, t])

    // Payment method bar
    const paymentMethodData = useMemo(() => {
        if (!stats?.paymentMethodDistribution) return { categories: [], series: [] }
        const entries = Object.entries(stats.paymentMethodDistribution)
        return {
            categories: entries.map(([k]) => k.replace('_', ' ')),
            series: [{ name: t('charts.payments'), data: entries.map(([, v]) => v) }],
        }
    }, [stats, t])

    // Recent reservations
    const recentReservations = useMemo(() => {
        return [...reservations]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 6)
    }, [reservations])

    // Recent payments
    const recentPayments = useMemo(() => {
        return [...payments]
            .sort((a, b) => new Date(b.paidAt || 0).getTime() - new Date(a.paidAt || 0).getTime())
            .slice(0, 6)
    }, [payments])

    // New users today
    const newUsersToday = useMemo(() => {
        const today = new Date().toLocaleDateString('en-CA')
        return users.filter((u) => u.createdAt && new Date(u.createdAt).toLocaleDateString('en-CA') === today).length
    }, [users])

    if (loading) {
        return (
            <div className="flex flex-col gap-6">
                <div>
                    <Skeleton width={280} height={32} />
                    <Skeleton className="mt-1" width={350} height={18} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Card key={i}>
                            <div className="flex items-center gap-4">
                                <Skeleton variant="circle" width={52} height={52} />
                                <div>
                                    <Skeleton width={90} height={14} />
                                    <Skeleton className="mt-2" width={70} height={28} />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card><Skeleton height={320} /></Card>
                    <Card><Skeleton height={320} /></Card>
                </div>
            </div>
        )
    }

    if (!stats) {
        return (
            <Card>
                <div className="text-center py-16">
                    <PiWarningDuotone className="text-6xl text-amber-400 mx-auto mb-4" />
                    <h4 className="font-bold text-gray-600 dark:text-gray-200 mb-2">{t('loadFailedTitle')}</h4>
                    <p className="text-gray-400">{error || t('backendRetry')}</p>
                    {error && (error.includes('session') || error.includes('Access denied')) ? (
                        <Link href="/sign-in">
                            <Button className="mt-4" variant="solid">{tCommon('signIn')}</Button>
                        </Link>
                    ) : (
                        <Button className="mt-4" variant="solid" onClick={() => window.location.reload()}>{tCommon('retry')}</Button>
                    )}
                </div>
            </Card>
        )
    }

    const occupancyRate = stats.totalSlots > 0 ? (((stats.totalSlots - stats.availableSlots) / stats.totalSlots) * 100) : 0

    // KPI cards config
    const kpiCards = [
        {
            label: t('kpi.totalParkings'),
            value: stats.totalParkings,
            icon: <PiCarDuotone className="text-2xl" />,
            color: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-100 dark:bg-blue-900/30',
            href: '/admin/parkings',
        },
        {
            label: t('kpi.totalSlots'),
            value: stats.totalSlots.toLocaleString(),
            sub: t('kpi.available', { count: stats.availableSlots }),
            icon: <PiSquaresFourDuotone className="text-2xl" />,
            color: 'text-indigo-600 dark:text-indigo-400',
            bg: 'bg-indigo-100 dark:bg-indigo-900/30',
            href: '/admin/parking-slots',
        },
        {
            label: t('kpi.totalUsers'),
            value: stats.totalUsers,
            sub: t('kpi.usersSub', { admins: stats.adminUsers || 0, newUsers: newUsersToday }),
            icon: <PiUsersDuotone className="text-2xl" />,
            color: 'text-purple-600 dark:text-purple-400',
            bg: 'bg-purple-100 dark:bg-purple-900/30',
            href: '/admin/users',
        },
        {
            label: t('kpi.activeReservations'),
            value: stats.activeReservations,
            sub: t('kpi.today', { count: stats.todayReservations }),
            icon: <PiCalendarCheckDuotone className="text-2xl" />,
            color: 'text-amber-600 dark:text-amber-400',
            bg: 'bg-amber-100 dark:bg-amber-900/30',
            href: '/admin/reservations',
        },
        {
            label: t('kpi.totalRevenue'),
            value: `${(stats.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`,
            sub: t('kpi.revenueToday', { amount: (stats.todayRevenue || 0).toFixed(2) }),
            icon: <PiCurrencyDollarDuotone className="text-2xl" />,
            color: 'text-green-600 dark:text-green-400',
            bg: 'bg-green-100 dark:bg-green-900/30',
            href: '/admin/payments',
            highlight: true,
        },
        {
            label: t('kpi.occupancyRate'),
            value: `${occupancyRate.toFixed(1)}%`,
            icon: <PiTrendUpDuotone className="text-2xl" />,
            color: occupancyRate > 80 ? 'text-red-600 dark:text-red-400' : occupancyRate > 50 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400',
            bg: occupancyRate > 80 ? 'bg-red-100 dark:bg-red-900/30' : occupancyRate > 50 ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30',
        },
        {
            label: t('kpi.pendingPayments'),
            value: stats.pendingPayments || 0,
            sub: t('kpi.completed', { count: stats.completedPayments || 0 }),
            icon: <PiClockDuotone className="text-2xl" />,
            color: 'text-orange-600 dark:text-orange-400',
            bg: 'bg-orange-100 dark:bg-orange-900/30',
            href: '/admin/payments',
        },
        {
            label: t('kpi.walletBalances'),
            value: `${(stats.totalWalletBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`,
            icon: <PiWalletDuotone className="text-2xl" />,
            color: 'text-cyan-600 dark:text-cyan-400',
            bg: 'bg-cyan-100 dark:bg-cyan-900/30',
            href: '/admin/wallets',
        },
    ]

    // Chart options
    const commonChartOpts = {
        chart: { toolbar: { show: false }, zoom: { enabled: false } },
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 2.5 },
        tooltip: { theme: 'dark' },
        grid: { borderColor: '#e5e7eb30', padding: { left: 10, right: 10 } },
    }

    const areaChartOptions = {
        ...commonChartOpts,
        chart: { ...commonChartOpts.chart, type: 'area' },
        xaxis: { categories: reservationChartData.categories, labels: { rotate: -45, style: { fontSize: '10px' }, show: reservationChartData.categories.length <= 14 } },
        yaxis: { title: { text: t('charts.count'), style: { fontSize: '12px' } } },
        fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05 } },
        colors: ['#6366f1'],
    }

    const revenueChartOptions = {
        ...commonChartOpts,
        chart: { ...commonChartOpts.chart, type: 'area' },
        xaxis: { categories: revenueChartData.categories, labels: { rotate: -45, style: { fontSize: '10px' }, show: revenueChartData.categories.length <= 14 } },
        yaxis: { title: { text: 'MAD', style: { fontSize: '12px' } }, labels: { formatter: (v) => `${v.toFixed(0)}` } },
        fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05 } },
        colors: ['#10b981'],
    }

    const slotDonutOptions = {
        chart: { type: 'donut' },
        labels: slotDonutData.labels,
        colors: ['#10b981', '#ef4444', '#f59e0b', '#6b7280'],
        legend: { position: 'bottom', fontSize: '12px' },
        plotOptions: { pie: { donut: { size: '60%', labels: { show: true, total: { show: true, label: t('charts.total'), fontSize: '14px', fontWeight: 700, formatter: () => stats.totalSlots } } } } },
        dataLabels: { enabled: false },
    }

    const reservationDonutOptions = {
        chart: { type: 'donut' },
        labels: reservationDonutData.labels,
        colors: ['#10b981', '#3b82f6', '#ef4444'],
        legend: { position: 'bottom', fontSize: '12px' },
        plotOptions: { pie: { donut: { size: '60%', labels: { show: true, total: { show: true, label: t('charts.total'), fontSize: '14px', fontWeight: 700 } } } } },
        dataLabels: { enabled: false },
    }

    const paymentMethodBarOptions = {
        chart: { type: 'bar', toolbar: { show: false } },
        plotOptions: { bar: { borderRadius: 8, horizontal: true, barHeight: '60%' } },
        xaxis: { categories: paymentMethodData.categories },
        colors: ['#8b5cf6'],
        dataLabels: { enabled: true, style: { fontSize: '12px' } },
        tooltip: { theme: 'dark' },
        grid: { borderColor: '#e5e7eb30' },
    }

    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                <div>
                    <h3 className="font-bold text-xl sm:text-2xl">{t('title')}</h3>
                    <p className="text-gray-500 text-xs sm:text-base">{t('subtitle')}</p>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                    <PiLightningDuotone className="text-amber-500" />
                    <span>{t('lastUpdated', { date: new Date().toLocaleString() })}</span>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpiCards.map((card) => {
                    const inner = (
                        <Card key={card.label} className={`hover:shadow-lg transition-all duration-200 ${card.highlight ? 'ring-2 ring-green-200 dark:ring-green-800' : ''}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className={`${card.bg} rounded-xl p-3 ${card.color} flex-shrink-0`}>{card.icon}</div>
                                    <div className="min-w-0">
                                        <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">{card.label}</p>
                                        <h4 className="font-bold text-lg mt-0.5">{card.value}</h4>
                                        {card.sub && <p className="text-xs text-gray-400 mt-0.5 truncate">{card.sub}</p>}
                                    </div>
                                </div>
                                {card.href && <PiArrowRightBold className="text-gray-300 flex-shrink-0" />}
                            </div>
                        </Card>
                    )
                    return card.href ? (
                        <Link key={card.label} href={card.href} className="block">
                            {inner}
                        </Link>
                    ) : (
                        <div key={card.label}>{inner}</div>
                    )
                })}
            </div>

            {/* Occupancy Bar */}
            <Card>
                <div className="flex items-center justify-between mb-4">
                    <h5 className="font-bold">{t('sections.slotOccupancy')}</h5>
                    <span className={`text-sm font-bold ${occupancyRate > 80 ? 'text-red-500' : occupancyRate > 50 ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {t('sections.occupiedPercent', { percent: occupancyRate.toFixed(1) })}
                    </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-5 overflow-hidden flex">
                    <div className="bg-emerald-500 h-full transition-all" style={{ width: `${(stats.availableSlots / stats.totalSlots) * 100}%` }} title={t('charts.available')} />
                    <div className="bg-red-500 h-full transition-all" style={{ width: `${((stats.occupiedSlots || 0) / stats.totalSlots) * 100}%` }} title={t('charts.occupied')} />
                    <div className="bg-amber-500 h-full transition-all" style={{ width: `${((stats.reservedSlots || 0) / stats.totalSlots) * 100}%` }} title={t('charts.reserved')} />
                    <div className="bg-gray-400 h-full transition-all" style={{ width: `${((stats.maintenanceSlots || 0) / stats.totalSlots) * 100}%` }} title={t('charts.maintenance')} />
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3 text-sm">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /><span>{t('charts.available')}: <strong>{stats.availableSlots}</strong></span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500" /><span>{t('charts.occupied')}: <strong>{stats.occupiedSlots || 0}</strong></span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500" /><span>{t('charts.reserved')}: <strong>{stats.reservedSlots || 0}</strong></span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gray-400" /><span>{t('charts.maintenance')}: <strong>{stats.maintenanceSlots || 0}</strong></span></div>
                </div>
            </Card>

            {/* Charts Row 1 — Time Series */}
            <div className="flex items-center justify-between">
                <h5 className="font-bold text-lg">{t('sections.analytics')}</h5>
                <Segment value={chartPeriod} onChange={(val) => setChartPeriod(val)} size="sm">
                    <Segment.Item value="7">7D</Segment.Item>
                    <Segment.Item value="14">14D</Segment.Item>
                    <Segment.Item value="30">30D</Segment.Item>
                </Segment>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <h6 className="font-bold mb-1">{t('sections.reservationsTrend')}</h6>
                    <p className="text-xs text-gray-400 mb-3">{t('sections.dailyReservationCount')}</p>
                    {reservationChartData.categories.length > 0 ? (
                        <Chart options={areaChartOptions} series={reservationChartData.series} type="area" height={280} />
                    ) : (
                        <p className="text-gray-400 text-center py-12">{t('sections.noReservationData')}</p>
                    )}
                </Card>
                <Card>
                    <h6 className="font-bold mb-1">{t('sections.revenueTrend')}</h6>
                    <p className="text-xs text-gray-400 mb-3">{t('sections.dailyRevenue')}</p>
                    {revenueChartData.categories.length > 0 ? (
                        <Chart options={revenueChartOptions} series={revenueChartData.series} type="area" height={280} />
                    ) : (
                        <p className="text-gray-400 text-center py-12">{t('sections.noRevenueData')}</p>
                    )}
                </Card>
            </div>

            {/* Charts Row 2 — Distributions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                <Card>
                    <h6 className="font-bold mb-4">{t('sections.slotStatusDistribution')}</h6>
                    {slotDonutData.series.some((v) => v > 0) ? (
                        <Chart options={slotDonutOptions} series={slotDonutData.series} type="donut" height={260} />
                    ) : (
                        <p className="text-gray-400 text-center py-12">{tCommon('noData')}</p>
                    )}
                </Card>
                <Card>
                    <h6 className="font-bold mb-4">{t('sections.reservationStatus')}</h6>
                    {reservationDonutData.series.some((v) => v > 0) ? (
                        <Chart options={reservationDonutOptions} series={reservationDonutData.series} type="donut" height={260} />
                    ) : (
                        <p className="text-gray-400 text-center py-12">{tCommon('noData')}</p>
                    )}
                </Card>
                <Card>
                    <h6 className="font-bold mb-4">{t('sections.paymentMethods')}</h6>
                    {paymentMethodData.categories.length > 0 ? (
                        <Chart options={paymentMethodBarOptions} series={paymentMethodData.series} type="bar" height={260} />
                    ) : (
                        <p className="text-gray-400 text-center py-12">{t('sections.noPaymentData')}</p>
                    )}
                </Card>
            </div>

            {/* Top Parkings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <h6 className="font-bold">{t('sections.topOccupancy')}</h6>
                        <Link href="/admin/parkings" className="text-sm text-blue-500 hover:underline flex items-center gap-1">
                            {tCommon('viewAll')} <PiArrowRightBold className="text-xs" />
                        </Link>
                    </div>
                    {stats.topParkingsByOccupancy && stats.topParkingsByOccupancy.length > 0 ? (
                        <div className="space-y-4">
                            {stats.topParkingsByOccupancy.map((p, i) => {
                                const occRate = p.totalSlots > 0 ? ((p.totalSlots - p.availableSlots) / p.totalSlots) * 100 : 0
                                return (
                                    <div key={p.id || i}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-700' : 'bg-gray-300'}`}>{i + 1}</span>
                                                <span className="font-medium text-sm truncate max-w-[200px]">{p.name}</span>
                                            </div>
                                            <span className="text-sm font-bold">{occRate.toFixed(0)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                            <div
                                                className={`h-full rounded-full transition-all ${occRate > 80 ? 'bg-red-500' : occRate > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                style={{ width: `${occRate}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">{t('sections.availableTotal', { available: p.availableSlots, total: p.totalSlots })}</p>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <p className="text-gray-400 text-center py-8">{t('sections.noParkingData')}</p>
                    )}
                </Card>
                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <h6 className="font-bold">{t('sections.topRevenue')}</h6>
                        <Link href="/admin/payments" className="text-sm text-blue-500 hover:underline flex items-center gap-1">
                            {tCommon('viewAll')} <PiArrowRightBold className="text-xs" />
                        </Link>
                    </div>
                    {stats.topParkingsByRevenue && stats.topParkingsByRevenue.length > 0 ? (
                        <div className="space-y-3">
                            {stats.topParkingsByRevenue.map((p, i) => (
                                <div key={p.id || i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                    <div className="flex items-center gap-3">
                                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-700' : 'bg-blue-400'}`}>{i + 1}</span>
                                        <div>
                                            <p className="font-medium text-sm">{p.name}</p>
                                             <p className="text-xs text-gray-400">{t('sections.reservationCount', { count: p.reservationCount })}</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-emerald-600 whitespace-nowrap">{(p.revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-400 text-center py-8">{t('sections.noRevenueData')}</p>
                    )}
                </Card>
            </div>

            {/* Recent Activities */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <h6 className="font-bold">{t('sections.recentReservations')}</h6>
                        <Link href="/admin/reservations" className="text-sm text-blue-500 hover:underline flex items-center gap-1">
                            {tCommon('viewAll')} <PiArrowRightBold className="text-xs" />
                        </Link>
                    </div>
                    {recentReservations.length === 0 ? (
                        <div className="text-center py-8">
                            <PiCalendarCheckDuotone className="text-4xl text-gray-300 mx-auto mb-2" />
                            <p className="text-gray-400 text-sm">{t('sections.noReservations')}</p>
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {recentReservations.map((r) => (
                                <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-sm truncate">{r.userFullName}</p>
                                        </div>
                                        <p className="text-xs text-gray-500 truncate mt-0.5">
                                             <PiMapPinDuotone className="inline mr-0.5" />{r.parkingName} · {t('sections.reservationRef', { id: String(r.slotNumber).padStart(5, '0') })}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {r.createdAt && new Date(r.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                                        <span className="font-bold text-sm whitespace-nowrap">{r.totalPrice} MAD</span>
                                        <Tag className={`${statusColor[r.status] || 'bg-gray-500'} text-white border-0 text-xs`}>
                                             {tStatus(r.status)}
                                        </Tag>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <h6 className="font-bold">{t('sections.recentPayments')}</h6>
                        <Link href="/admin/payments" className="text-sm text-blue-500 hover:underline flex items-center gap-1">
                            {tCommon('viewAll')} <PiArrowRightBold className="text-xs" />
                        </Link>
                    </div>
                    {recentPayments.length === 0 ? (
                        <div className="text-center py-8">
                            <PiCreditCardDuotone className="text-4xl text-gray-300 mx-auto mb-2" />
                            <p className="text-gray-400 text-sm">{t('sections.noPayments')}</p>
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {recentPayments.map((p) => (
                                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                    <div className="flex-1 min-w-0">
                                         <p className="font-medium text-sm">{t('sections.paymentRef', { id: String(p.id).padStart(5, '0') })}</p>
                                         <p className="text-xs text-gray-500 mt-0.5">{t('sections.reservationRef', { id: String(p.reservationId).padStart(5, '0') })} · {p.paymentMethod || 'N/A'}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {p.paidAt && new Date(p.paidAt).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                                        {p.status === 'COMPLETED' && (
                                            <button
                                                className="p-1 rounded-md text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
                                                title={tCommon('downloadInvoice')}
                                                onClick={() => generateInvoicePdf(p)}
                                            >
                                                <PiDownloadSimpleBold className="text-base" />
                                            </button>
                                        )}
                                        <span className="font-bold text-sm whitespace-nowrap">{p.amount} MAD</span>
                                        <Tag className={`${paymentStatusColor[p.status] || 'bg-gray-500'} text-white border-0 text-xs`}>
                                             {tPaymentStatus(p.status)}
                                        </Tag>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>

            {/* Quick Actions */}
            <Card>
                <h6 className="font-bold mb-4">{t('sections.quickActions')}</h6>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {[
                        { label: t('quick.users'), href: '/admin/users', icon: <PiUsersDuotone className="text-2xl" />, bg: 'bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100', color: 'text-purple-600' },
                        { label: t('quick.parkings'), href: '/admin/parkings', icon: <PiCarDuotone className="text-2xl" />, bg: 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100', color: 'text-blue-600' },
                        { label: t('quick.slots'), href: '/admin/parking-slots', icon: <PiSquaresFourDuotone className="text-2xl" />, bg: 'bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100', color: 'text-indigo-600' },
                        { label: t('quick.reservations'), href: '/admin/reservations', icon: <PiCalendarCheckDuotone className="text-2xl" />, bg: 'bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100', color: 'text-amber-600' },
                        { label: t('quick.payments'), href: '/admin/payments', icon: <PiCreditCardDuotone className="text-2xl" />, bg: 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100', color: 'text-green-600' },
                        { label: t('quick.wallets'), href: '/admin/wallets', icon: <PiWalletDuotone className="text-2xl" />, bg: 'bg-cyan-50 dark:bg-cyan-900/20 hover:bg-cyan-100', color: 'text-cyan-600' },
                    ].map((action) => (
                        <Link key={action.label} href={action.href}>
                            <div className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl ${action.bg} ${action.color} transition-all cursor-pointer hover:scale-[1.02]`}>
                                {action.icon}
                                <span className="text-xs font-medium text-center">{action.label}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </Card>
        </div>
    )
}

export default AdminDashboardClient
