'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import {
    PiScanDuotone,
    PiCameraDuotone,
    PiUploadSimpleDuotone,
    PiArrowCounterClockwiseDuotone,
    PiCheckCircleDuotone,
    PiWarningCircleDuotone,
    PiXCircleDuotone,
    PiUsersDuotone,
    PiUserCircleDuotone,
} from 'react-icons/pi'
import { apiGuardPlateScan } from '@/services/GuardService'
import { useTranslations } from 'next-intl'

// Aligns with backend `app.alpr.min-confidence` default (0.55).
const LOW_CONFIDENCE_THRESHOLD = 0.55
const HIGH_CONFIDENCE_THRESHOLD = 0.8

function pickConfidenceTone(confidence) {
    if (confidence == null) return 'neutral'
    if (confidence >= HIGH_CONFIDENCE_THRESHOLD) return 'success'
    if (confidence >= LOW_CONFIDENCE_THRESHOLD) return 'warning'
    return 'danger'
}

const TONE_CLASSES = {
    success: {
        wrap: 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10',
        text: 'text-emerald-700 dark:text-emerald-300',
        bar: 'bg-emerald-500',
        chip: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200',
    },
    warning: {
        wrap: 'border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10',
        text: 'text-amber-700 dark:text-amber-300',
        bar: 'bg-amber-500',
        chip: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200',
    },
    danger: {
        wrap: 'border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10',
        text: 'text-red-700 dark:text-red-300',
        bar: 'bg-red-500',
        chip: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200',
    },
    neutral: {
        wrap: 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50',
        text: 'text-gray-600 dark:text-gray-300',
        bar: 'bg-gray-400',
        chip: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
    },
}

export default function PlateScanDialog({ isOpen, onClose, parkingId, onScanned }) {
    const t = useTranslations('guard.plate')
    const tCommon = useTranslations('guard.common')
    const cameraInputRef = useRef(null)
    const uploadInputRef = useRef(null)
    const videoRef = useRef(null)
    const streamRef = useRef(null)
    const [cameraPreviewOpen, setCameraPreviewOpen] = useState(false)
    const [cameraStarting, setCameraStarting] = useState(false)
    const [videoReady, setVideoReady] = useState(false)
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState('')
    const [plate, setPlate] = useState('')
    const [confidence, setConfidence] = useState(null)
    const [message, setMessage] = useState('')
    const [isAppUser, setIsAppUser] = useState(null)
    const [appUsersToday, setAppUsersToday] = useState(null)
    const [nonAppUsersToday, setNonAppUsersToday] = useState(null)
    const [errored, setErrored] = useState(false)

    const reset = () => {
        setLoading(false)
        setStatus('')
        setPlate('')
        setConfidence(null)
        setMessage('')
        setIsAppUser(null)
        setAppUsersToday(null)
        setNonAppUsersToday(null)
        setErrored(false)
    }

    const stopLiveCamera = useCallback(() => {
        streamRef.current?.getTracks().forEach((track) => track.stop())
        streamRef.current = null
        if (videoRef.current) {
            videoRef.current.srcObject = null
        }
        setCameraPreviewOpen(false)
        setCameraStarting(false)
        setVideoReady(false)
    }, [])

    useEffect(() => {
        if (!isOpen) {
            stopLiveCamera()
        }
    }, [isOpen, stopLiveCamera])

    useEffect(() => {
        if (!cameraPreviewOpen || !streamRef.current || !videoRef.current) return
        setVideoReady(false)
        const v = videoRef.current
        v.srcObject = streamRef.current
        v.play().catch(() => {})
    }, [cameraPreviewOpen])

    const handleFile = async (file) => {
        if (!parkingId || !file) return
        stopLiveCamera()
        reset()
        setLoading(true)
        setStatus(t('reading'))
        try {
            const res = await apiGuardPlateScan({ parkingId, file })
            const data = res?.data
            const conf =
                typeof data?.confidence === 'number' ? data.confidence : null
            setPlate(data?.plate || '')
            setConfidence(conf)
            setIsAppUser(!!data?.appUser)
            setMessage(data?.message || '')
            setAppUsersToday(
                typeof data?.appUsersToday === 'number' ? data.appUsersToday : null,
            )
            setNonAppUsersToday(
                typeof data?.nonAppUsersToday === 'number'
                    ? data.nonAppUsersToday
                    : null,
            )
            setStatus(data?.appUser ? t('statusAppUser') : t('statusNonApp'))
            onScanned?.(data)
        } catch (e) {
            setErrored(true)
            setStatus(t('statusError'))
            setMessage(e?.response?.data?.message || t('requestFailed'))
        } finally {
            setLoading(false)
        }
    }

    const triggerFileInputCamera = () => {
        if (cameraInputRef.current) {
            cameraInputRef.current.value = ''
            cameraInputRef.current.click()
        }
    }

    const captureFrameFromVideo = () => {
        const video = videoRef.current
        if (!video || video.videoWidth < 2 || video.videoHeight < 2) return
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.drawImage(video, 0, 0)
        canvas.toBlob(
            (blob) => {
                if (!blob) return
                const file = new File([blob], 'plate-scan.jpg', { type: 'image/jpeg' })
                handleFile(file)
            },
            'image/jpeg',
            0.92,
        )
    }

    const triggerCamera = async () => {
        if (!parkingId || loading) return
        stopLiveCamera()

        if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
            triggerFileInputCamera()
            return
        }

        setCameraStarting(true)
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: 'environment' } },
                audio: false,
            })
            streamRef.current = stream
            setVideoReady(false)
            setCameraPreviewOpen(true)
        } catch {
            triggerFileInputCamera()
        } finally {
            setCameraStarting(false)
        }
    }
    const triggerUpload = () => {
        stopLiveCamera()
        if (uploadInputRef.current) {
            uploadInputRef.current.value = ''
            uploadInputRef.current.click()
        }
    }

    const lowConfidence =
        !errored && confidence !== null && confidence < LOW_CONFIDENCE_THRESHOLD
    const tone = errored
        ? 'danger'
        : confidence === null && plate
            ? 'neutral'
            : pickConfidenceTone(confidence)
    const toneClasses = TONE_CLASSES[tone]
    const hasResult = !!(status || plate || message)

    return (
        <Dialog
            isOpen={isOpen}
            onClose={() => {
                stopLiveCamera()
                reset()
                onClose?.()
            }}
            width={520}
        >
            <div className="flex flex-col gap-5">
                {/* Header */}
                <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
                        <PiScanDuotone className="text-2xl" />
                    </div>
                    <div className="flex-1">
                        <h5 className="text-lg font-bold leading-tight">{t('title')}</h5>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {t('instructions')}
                        </p>
                    </div>
                </div>

                <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files?.[0] || null)}
                />
                <input
                    ref={uploadInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files?.[0] || null)}
                />

                {/* Action buttons */}
                {cameraPreviewOpen && (
                    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-black dark:border-gray-700">
                        <video
                            ref={videoRef}
                            className="max-h-64 w-full object-contain sm:max-h-80"
                            playsInline
                            muted
                            autoPlay
                            onLoadedData={() => setVideoReady(true)}
                        />
                        <div className="flex flex-wrap gap-2 border-t border-gray-800 bg-gray-900/90 p-3">
                            <Button
                                size="sm"
                                variant="solid"
                                className="flex-1"
                                loading={loading}
                                disabled={loading || !videoReady}
                                icon={<PiCameraDuotone />}
                                onClick={captureFrameFromVideo}
                            >
                                {t('capturePhoto')}
                            </Button>
                            <Button
                                size="sm"
                                variant="twoTone"
                                className="flex-1"
                                disabled={loading}
                                onClick={stopLiveCamera}
                            >
                                {t('cancelCamera')}
                            </Button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Button
                        variant="solid"
                        loading={loading || cameraStarting}
                        disabled={loading || cameraStarting || !parkingId || cameraPreviewOpen}
                        icon={<PiCameraDuotone />}
                        onClick={triggerCamera}
                    >
                        {t('scanCamera')}
                    </Button>
                    <Button
                        variant="twoTone"
                        loading={loading}
                        disabled={loading || !parkingId}
                        icon={<PiUploadSimpleDuotone />}
                        onClick={triggerUpload}
                    >
                        {t('uploadPhoto')}
                    </Button>
                </div>

                {/* Result card */}
                {hasResult && (
                    <div className={`rounded-2xl border p-4 transition-colors ${toneClasses.wrap}`}>
                        {/* Status row */}
                        <div className="flex items-center gap-2">
                            {errored || isAppUser === false ? (
                                <PiXCircleDuotone className="text-xl text-red-500" />
                            ) : lowConfidence ? (
                                <PiWarningCircleDuotone className="text-xl text-amber-500" />
                            ) : isAppUser ? (
                                <PiCheckCircleDuotone className="text-xl text-emerald-500" />
                            ) : (
                                <PiScanDuotone className="text-xl text-gray-400" />
                            )}
                            <p className="text-sm font-semibold">
                                {status || t('statusFallback')}
                            </p>
                        </div>

                        {/* Big plate readout */}
                        {plate && (
                            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-white/40 bg-white/70 px-3 py-2 dark:border-white/5 dark:bg-black/20">
                                <div className="min-w-0">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        {t('plateLabel')}
                                    </p>
                                    <p className="truncate font-mono text-xl font-extrabold tracking-wider">
                                        {plate}
                                    </p>
                                </div>
                                {confidence !== null && (
                                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${toneClasses.chip}`}>
                                        {Math.round(confidence * 100)}%
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Confidence bar */}
                        {confidence !== null && (
                            <div className="mt-3">
                                <div className="mb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    <span>{t('confidence')}</span>
                                    <span className={toneClasses.text}>
                                        {tone === 'success'
                                            ? t('confidenceHigh')
                                            : tone === 'warning'
                                                ? t('confidenceMedium')
                                                : t('confidenceLow')}
                                    </span>
                                </div>
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                                    <div
                                        className={`h-full rounded-full transition-all ${toneClasses.bar}`}
                                        style={{ width: `${Math.max(4, Math.round(confidence * 100))}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Message line */}
                        {message && (
                            <p className={`mt-3 text-xs leading-relaxed ${toneClasses.text}`}>
                                {message}
                            </p>
                        )}

                        {/* Match badge */}
                        {!lowConfidence && !errored && isAppUser !== null && (
                            <div
                                className={`mt-3 rounded-lg px-3 py-2 text-sm font-semibold ${
                                    isAppUser
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200'
                                        : 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200'
                                }`}
                            >
                                {isAppUser ? t('badgeApp') : t('badgeNon')}
                            </div>
                        )}

                        {/* Retake CTA on low confidence */}
                        {lowConfidence && (
                            <Button
                                size="sm"
                                variant="solid"
                                className="mt-3 !bg-amber-500 hover:!bg-amber-600"
                                icon={<PiArrowCounterClockwiseDuotone />}
                                onClick={triggerCamera}
                            >
                                {t('retake')}
                            </Button>
                        )}
                    </div>
                )}

                {/* Today counters */}
                {(appUsersToday !== null || nonAppUsersToday !== null) && (
                    <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                                <PiUserCircleDuotone className="text-base" />
                                {t('appUsersToday')}
                            </div>
                            <p className="mt-1 text-2xl font-extrabold text-emerald-700 dark:text-emerald-200">
                                {appUsersToday ?? 0}
                            </p>
                        </div>
                        <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 dark:border-sky-500/20 dark:bg-sky-500/10">
                            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-300">
                                <PiUsersDuotone className="text-base" />
                                {t('nonAppUsersToday')}
                            </div>
                            <p className="mt-1 text-2xl font-extrabold text-sky-700 dark:text-sky-200">
                                {nonAppUsersToday ?? 0}
                            </p>
                        </div>
                    </div>
                )}

                {!parkingId && (
                    <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                        {t('noParking')}
                    </p>
                )}

                <div className="flex justify-end">
                    <Button
                        size="sm"
                        onClick={() => {
                            reset()
                            onClose?.()
                        }}
                    >
                        {tCommon('close')}
                    </Button>
                </div>
            </div>
        </Dialog>
    )
}
