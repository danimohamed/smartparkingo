'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Card from '@/components/ui/Card'
import Skeleton from '@/components/ui/Skeleton'
import { useOwnerParkings, useOwnerParkingAnalyticsLive } from '@/hooks/useOwner'
import { apiGetOwnerParkingAnalyticsVideoObjectUrl, apiResetOwnerParkingAnalyticsLive } from '@/services/OwnerService'
import { PiVideoCameraDuotone } from 'react-icons/pi'
import { useTranslations } from 'next-intl'

/** Letterboxed video: map normalized [nx,ny,nw,nh] to CSS pixels inside the video box. */
function videoContentRect(video) {
    const vw = video.videoWidth
    const vh = video.videoHeight
    if (!vw || !vh) return null
    const cw = video.clientWidth
    const ch = video.clientHeight
    const ar = vw / vh
    const boxAr = cw / ch
    let dw
    let dh
    let ox
    let oy
    if (boxAr > ar) {
        dh = ch
        dw = ch * ar
        ox = (cw - dw) / 2
        oy = 0
    } else {
        dw = cw
        dh = cw / ar
        ox = 0
        oy = (ch - dh) / 2
    }
    return { ox, oy, dw, dh, vw, vh }
}

// Slot-based overlay removed: leave the video clean.

export default function OwnerLotAnalyticsSection() {
    const { data: parkings = [], isLoading: loadingParkings } = useOwnerParkings()
    const [parkingId, setParkingId] = useState(null)
    const [videoUrl, setVideoUrl] = useState(null)
    const videoRef = useRef(null)
    const [hasStarted, setHasStarted] = useState(false)
    const [startedAt, setStartedAt] = useState(null)
    const t = useTranslations('owner.analytics')

    useEffect(() => {
        if (!loadingParkings && parkings.length > 0 && parkingId == null) {
            setParkingId(parkings[0].id)
        }
    }, [loadingParkings, parkings, parkingId])

    const { data: live, isError, refetch } = useOwnerParkingAnalyticsLive(parkingId, hasStarted)

    const display = useMemo(() => {
        if (!hasStarted) {
            return {
                enteredCount: 0,
                exitedCount: 0,
                carsInFrame: 0,
                updatedAt: null,
                parkingLotCapacity: live?.parkingLotCapacity,
            }
        }
        return live
    }, [hasStarted, live])

    useEffect(() => {
        if (!parkingId) return undefined
        let blobUrl = null
        let dead = false
        apiGetOwnerParkingAnalyticsVideoObjectUrl(parkingId)
            .then((u) => {
                if (dead) {
                    URL.revokeObjectURL(u)
                    return
                }
                blobUrl = u
                setVideoUrl(u)
            })
            .catch(() => {
                if (!dead) setVideoUrl(null)
            })
        return () => {
            dead = true
            if (blobUrl) URL.revokeObjectURL(blobUrl)
            setVideoUrl(null)
        }
    }, [parkingId])

    useEffect(() => {
        // Switching parking should not show previous parking's stats.
        setHasStarted(false)
        setStartedAt(null)
    }, [parkingId])

    const onPlay = async () => {
        if (!parkingId) return
        try {
            await apiResetOwnerParkingAnalyticsLive(parkingId)
        } catch {
            // If reset fails, still start polling; user will see a warning if worker isn't running.
        }
        setHasStarted(true)
        setStartedAt(Date.now())
        // Pull immediately (then react-query interval continues)
        refetch?.()
    }

    if (loadingParkings) {
        return (
            <Card className="p-4">
                <Skeleton height={24} width={200} className="mb-4" />
                <Skeleton height={200} />
            </Card>
        )
    }

    if (parkings.length === 0) {
        return null
    }

    return (
        <Card>
            <div className="p-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h5 className="font-bold flex items-center gap-2">
                            <PiVideoCameraDuotone className="text-xl text-indigo-500" />
                            {t('title')}
                        </h5>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {t('helpText')}
                        </p>
                    </div>
                    <label className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                        <span className="shrink-0">{t('parking')}</span>
                        <select
                            className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-sm min-w-[12rem]"
                            value={parkingId ?? ''}
                            onChange={(e) => setParkingId(Number(e.target.value))}
                        >
                            {parkings.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                {isError ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t('errorAccess')}
                    </p>
                ) : (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                            <div className="rounded-lg bg-gray-50 dark:bg-gray-800/60 p-3">
                                <p className="text-gray-500 dark:text-gray-400">{t('entered')}</p>
                                <p className="text-lg font-bold">{display?.enteredCount ?? 0}</p>
                                {display?.parkingLotCapacity != null && display.parkingLotCapacity > 0 && (
                                    <p className="text-[10px] text-gray-400 mt-0.5">
                                        {t('lotCapacity', { n: display.parkingLotCapacity })}
                                    </p>
                                )}
                            </div>
                            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-500/10 p-3">
                                <p className="text-emerald-700 dark:text-emerald-400">{t('exited')}</p>
                                <p className="text-lg font-bold">{display?.exitedCount ?? 0}</p>
                            </div>
                            <div className="rounded-lg bg-red-50 dark:bg-red-500/10 p-3">
                                <p className="text-red-700 dark:text-red-400">{t('carsInFrame')}</p>
                                <p className="text-lg font-bold">{display?.carsInFrame ?? 0}</p>
                            </div>
                            <div className="rounded-lg bg-gray-50 dark:bg-gray-800/60 p-3">
                                <p className="text-gray-500 dark:text-gray-400">{t('lastUpdate')}</p>
                                <p className="text-sm font-bold">
                                    {display?.updatedAt ? new Date(display.updatedAt).toLocaleTimeString() : hasStarted ? t('waiting') : '—'}
                                </p>
                            </div>
                        </div>
                        {display?.updatedAt && (
                            <p className="text-xs text-gray-400">
                                {t('lastAiUpdate', { date: new Date(display.updatedAt).toLocaleString() })}
                            </p>
                        )}

                        <div className="relative w-full max-h-[min(70vh,720px)] rounded-lg border border-gray-200 dark:border-gray-700 bg-black overflow-hidden">
                            {videoUrl ? (
                                <>
                                    <video
                                        ref={videoRef}
                                        key={videoUrl}
                                        className="relative z-0 w-full max-h-[min(70vh,720px)] object-contain block"
                                        src={videoUrl}
                                        controls
                                        playsInline
                                        onPlay={onPlay}
                                    />
                                </>
                            ) : (
                                <p className="text-sm text-gray-400 p-6">{t('videoUnavailable')}</p>
                            )}
                        </div>
                        {!hasStarted && (
                            <p className="text-xs text-amber-600 dark:text-amber-400">
                                {t('pressPlay')}
                            </p>
                        )}
                        {hasStarted && !display?.updatedAt && (
                            <p className="text-xs text-amber-600 dark:text-amber-400">
                                {t('waitingUpdatesPrefix')}<code className="text-[11px]">owner-analytics/worker.py</code>{t('waitingUpdatesSuffix')}
                            </p>
                        )}
                        {hasStarted &&
                            startedAt &&
                            (!display?.updatedAt || Date.now() - new Date(display.updatedAt).getTime() > 15_000) && (
                                <p className="text-xs text-gray-400">
                                    {t('noFreshUpdates')}
                                </p>
                            )}
                    </>
                )}
            </div>
        </Card>
    )
}
