'use client'
import { useState, useMemo } from 'react'
import { useOwnerReservations } from '@/hooks/useOwner'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Skeleton from '@/components/ui/Skeleton'
import { useTranslations } from 'next-intl'
import dayjs from 'dayjs'

const statusColor = {
    ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
    COMPLETED: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
    CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
}

const OwnerReservationsClient = () => {
    const { data: reservations = [], isLoading } = useOwnerReservations()
    const [search, setSearch] = useState('')
    const t = useTranslations('owner.reservations')
    const tStatus = useTranslations('owner.reservationStatus')
    const tDashRecent = useTranslations('owner.dashboard.recent')

    const filtered = useMemo(() => {
        if (!search) return reservations
        const q = search.toLowerCase()
        return reservations.filter(
            (r) =>
                r.userFullName?.toLowerCase().includes(q) ||
                r.parkingName?.toLowerCase().includes(q) ||
                r.slotNumber?.toLowerCase().includes(q),
        )
    }, [reservations, search])

    if (isLoading) {
        return (
            <div className="flex flex-col gap-4">
                <Skeleton width={280} height={32} />
                <Skeleton height={400} />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            <div>
                <h3 className="text-xl sm:text-2xl font-bold">{t('title')}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-base">
                    {t('subtitle')}
                </p>
            </div>

            <div className="w-full sm:max-w-xs">
                <Input
                    placeholder={t('searchPlaceholder')}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <Card>
                {filtered.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">{t('empty')}</div>
                ) : (
                    <>
                        {/* Mobile card view */}
                        <div className="block md:hidden space-y-3 p-3">
                            {filtered.map((r) => (
                                <div key={r.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-sm">{r.userFullName}</span>
                                        <span className={`px-2 py-1 text-xs rounded-full ${statusColor[r.status] || ''}`}>{tStatus(r.status)}</span>
                                    </div>
                                    <p className="text-xs text-gray-500">{r.parkingName} · {tDashRecent('slotShort', { number: r.slotNumber })}</p>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
                                        <span>{dayjs(r.startTime).format('DD/MM/YY HH:mm')}</span>
                                        <span>→</span>
                                        <span>{dayjs(r.endTime).format('DD/MM/YY HH:mm')}</span>
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
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
                                        <th className="p-3 font-medium">{t('columns.user')}</th>
                                        <th className="p-3 font-medium">{t('columns.parking')}</th>
                                        <th className="p-3 font-medium">{t('columns.slot')}</th>
                                        <th className="p-3 font-medium">{t('columns.start')}</th>
                                        <th className="p-3 font-medium">{t('columns.end')}</th>
                                        <th className="p-3 font-medium">{t('columns.status')}</th>
                                        <th className="p-3 font-medium">{t('columns.price')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((r) => (
                                        <tr key={r.id} className="border-b last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <td className="p-3">{r.userFullName}</td>
                                            <td className="p-3">{r.parkingName}</td>
                                            <td className="p-3">{r.slotNumber}</td>
                                            <td className="p-3">{dayjs(r.startTime).format('DD/MM/YY HH:mm')}</td>
                                            <td className="p-3">{dayjs(r.endTime).format('DD/MM/YY HH:mm')}</td>
                                            <td className="p-3">
                                                <span className={`px-2 py-1 text-xs rounded-full ${statusColor[r.status] || ''}`}>{tStatus(r.status)}</span>
                                            </td>
                                            <td className="p-3 font-medium">{r.totalPrice?.toFixed(2)} MAD</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </Card>
        </div>
    )
}

export default OwnerReservationsClient
