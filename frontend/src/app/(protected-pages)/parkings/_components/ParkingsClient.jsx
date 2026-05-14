'use client'
import { useEffect, useMemo, useState } from 'react'
import { apiGetAllParkings, apiSearchParkings, apiRateParking } from '@/services/ParkingService'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Tag from '@/components/ui/Tag'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
    PiCarDuotone,
    PiMapPinDuotone,
    PiMagnifyingGlassBold,
    PiShieldCheckDuotone,
    PiCaretDownBold,
    PiStarDuotone,
    PiArrowsOutDuotone,
    PiNavigationArrowDuotone,
} from 'react-icons/pi'
import logger from '@/utils/logger'

const ParkingsClient = () => {
    const router = useRouter()
    const t = useTranslations('parkings.list')
    const [parkings, setParkings] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [expanded, setExpanded] = useState(() => new Set())
    const [ratingSavingId, setRatingSavingId] = useState(null)

    const fetchParkings = async (query) => {
        setLoading(true)
        try {
            const res = query
                ? await apiSearchParkings(query)
                : await apiGetAllParkings()
            setParkings(res?.data || [])
        } catch (error) {
            logger.error('Failed to load parkings', error)
        } finally {
            setLoading(false)
        }
    }

    const expandedIds = useMemo(() => expanded, [expanded])

    const toggleExpanded = (id) => {
        setExpanded((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const googleMapsHref = (p) => {
        if (p?.latitude != null && p?.longitude != null) {
            return `https://www.google.com/maps?q=${encodeURIComponent(`${p.latitude},${p.longitude}`)}`
        }
        if (p?.address) {
            return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address)}`
        }
        return null
    }

    const handleRate = async (parkingId, stars, e) => {
        e?.preventDefault?.()
        e?.stopPropagation?.()
        try {
            setRatingSavingId(parkingId)
            await apiRateParking(parkingId, stars)
            await fetchParkings(search)
        } catch (err) {
            logger.error('Failed to save rating', err)
        } finally {
            setRatingSavingId(null)
        }
    }

    useEffect(() => {
        fetchParkings()
    }, [])

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchParkings(search)
        }, 400)
        return () => clearTimeout(timer)
    }, [search])

    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-lg sm:text-xl">{t('title')}</h3>
                    <p className="text-gray-500 text-xs sm:text-sm">{t('subtitle')}</p>
                </div>
            </div>

            <div className="relative w-full sm:max-w-md">
                <Input
                    placeholder={t('searchPlaceholder')}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    prefix={<PiMagnifyingGlassBold className="text-lg" />}
                />
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
                </div>
            ) : parkings.length === 0 ? (
                <Card>
                    <div className="text-center py-12">
                        <PiCarDuotone className="text-6xl text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-400">{t('noResults')}</p>
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {parkings.map((parking) => {
                        const isExpanded = expandedIds.has(parking.id)
                        return (
                        <div
                            key={parking.id}
                            className={`${isExpanded ? 'sm:col-span-2 lg:col-span-3' : ''}`}
                        >
                            <Card
                                className="hover:shadow-lg transition-all cursor-pointer border border-gray-200 dark:border-gray-700 h-full overflow-hidden"
                                onClick={() => router.push(`/parkings/${parking.id}`)}
                            >
                            <div className="flex flex-col">
                                {/* Image header */}
                                <div className="relative h-40 w-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-gray-800 dark:to-gray-900">
                                    {parking.imageUrl ? (
                                        <img
                                            src={parking.imageUrl}
                                            alt={parking.name}
                                            className="absolute inset-0 h-full w-full object-cover"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="flex items-center gap-2 rounded-2xl bg-white/70 px-3 py-2 text-slate-700 shadow-sm backdrop-blur dark:bg-gray-900/60 dark:text-slate-200">
                                                <PiCarDuotone className="text-xl text-primary" />
                                                <span className="text-xs font-semibold">{t('smartParking')}</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/55 to-transparent" />

                                    <div className="absolute left-3 bottom-3 right-3 flex items-end justify-between gap-2">
                                        <div className="min-w-0">
                                            <h5 className="truncate text-sm font-bold text-white">
                                                {parking.name}
                                            </h5>
                                            <div className="mt-1 flex items-center gap-1 text-[11px] text-white/80">
                                                <PiMapPinDuotone className="shrink-0" />
                                                <span className="truncate">{parking.address}</span>
                                            </div>
                                        </div>
                                        <Tag
                                            className={`${parking.active ? 'bg-emerald-500' : 'bg-red-500'} text-white border-0`}
                                        >
                                            {parking.active ? t('active') : t('inactive')}
                                        </Tag>
                                    </div>
                                </div>

                                <div className="p-4 flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {parking.pricingTier && (
                                                <Tag
                                                    className={`border-0 text-[10px] ${
                                                        parking.pricingTier === 'PREMIUM'
                                                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                                                            : parking.pricingTier === 'ECONOMY'
                                                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                                                              : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
                                                    }`}
                                                >
                                                    {parking.pricingTier}
                                                </Tag>
                                            )}
                                            {parking.dailyCapPrice > 0 && (
                                                <Tag className="border-0 text-[10px] bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                                                    {t('cap', { amount: parking.dailyCapPrice })}
                                                </Tag>
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            aria-label={t('showMoreDetails')}
                                            onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                toggleExpanded(parking.id)
                                            }}
                                            className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition-all hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 ${
                                                expandedIds.has(parking.id) ? 'rotate-180' : ''
                                            }`}
                                        >
                                            <PiCaretDownBold />
                                        </button>
                                    </div>

                                    {parking.description && (
                                        <p className="text-sm text-gray-400 line-clamp-2">{parking.description}</p>
                                    )}

                                    {parking.guardName && (
                                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                                            <PiShieldCheckDuotone className="text-indigo-500 flex-shrink-0" />
                                            <span className="truncate">{parking.guardName}</span>
                                            {parking.guardPhone && <span className="text-gray-400">· {parking.guardPhone}</span>}
                                        </div>
                                    )}

                                    <div className="border-t dark:border-gray-700 pt-3 mt-1 flex items-center justify-between">
                                        <div className="text-sm">
                                            <span className="text-emerald-500 font-bold text-lg">{parking.availableSlots}</span>
                                            <span className="text-gray-400"> {t('slotsAvailable', { total: parking.totalSlots })}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-bold text-primary text-lg">{parking.pricePerHour}</span>
                                            <span className="text-gray-400 text-sm"> {t('perHour')}</span>
                                        </div>
                                    </div>

                                    {/* Dropdown details */}
                                    {isExpanded && (
                                        <div
                                            className="mt-2 rounded-2xl border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-700 dark:bg-gray-800/60"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="rounded-xl bg-white p-3 dark:bg-gray-800">
                                                    <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                                                        {t('capacity')}
                                                    </div>
                                                    <div className="mt-1 font-bold text-gray-900 dark:text-gray-100">
                                                        {t('slots', { count: parking.totalSlots ?? 0 })}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {t('available', { count: parking.availableSlots ?? 0 })}
                                                    </div>
                                                </div>
                                                <div className="rounded-xl bg-white p-3 dark:bg-gray-800">
                                                    <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                                                        {t('floors')}
                                                    </div>
                                                    <div className="mt-1 font-bold text-gray-900 dark:text-gray-100">
                                                        {parking.layoutFloors ?? '—'}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {parking.layoutSpotsPerFloor
                                                            ? t('perFloor', { count: parking.layoutSpotsPerFloor })
                                                            : '—'}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-3 grid grid-cols-1 gap-2">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                                                        <PiStarDuotone className="text-base text-amber-500" />
                                                        {t('rating')}{' '}
                                                        <span className="text-gray-600 dark:text-gray-300">
                                                            {parking.avgRating != null
                                                                ? Number(parking.avgRating).toFixed(1)
                                                                : '0.0'}
                                                        </span>
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                                                        <PiArrowsOutDuotone className="text-base text-cyan-500" />
                                                        {t('layout')} <span className="text-gray-500">{parking.undergroundFloors ? t('underground') : t('aboveGround')}</span>
                                                    </span>
                                                </div>

                                                <div className="rounded-xl bg-white px-3 py-2 dark:bg-gray-800">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                                                            {t('rateThis')}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            {[1, 2, 3, 4, 5].map((s) => {
                                                                const filled =
                                                                    parking.avgRating != null &&
                                                                    Number(parking.avgRating) >= s
                                                                return (
                                                                    <button
                                                                        key={s}
                                                                        type="button"
                                                                        disabled={ratingSavingId === parking.id}
                                                                        onClick={(e) => handleRate(parking.id, s, e)}
                                                                        className={`h-8 w-8 rounded-lg border border-gray-200 bg-white text-amber-500 transition hover:bg-amber-50 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 ${
                                                                            filled ? '' : 'opacity-60'
                                                                        }`}
                                                                        aria-label={t('rateAria', { n: s })}
                                                                    >
                                                                        ★
                                                                    </button>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>

                                                {googleMapsHref(parking) && (
                                                    <a
                                                        href={googleMapsHref(parking)}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-bold text-primary hover:underline dark:bg-gray-800"
                                                    >
                                                        <PiNavigationArrowDuotone className="text-base" />
                                                        {t('openInMaps')}
                                                    </a>
                                                )}

                                                <div className="flex items-center justify-between pt-2">
                                                    <Link
                                                        href={`/parkings/${parking.id}`}
                                                        className="text-xs font-bold text-primary hover:underline"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {t('viewParking')}
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            </Card>
                        </div>
                    )})}
                </div>
            )}
        </div>
    )
}

export default ParkingsClient

