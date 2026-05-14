'use client'

import { useEffect, useRef, useId, useState } from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useTranslations } from 'next-intl'

/**
 * Browser camera QR scan (html5-qrcode). Falls back to pasting the raw payload.
 */
const GuardQrScannerDialog = ({
    isOpen,
    onClose,
    title,
    onDecoded,
}) => {
    const t = useTranslations('guard.qr')
    const reactId = useId().replace(/:/g, '')
    const containerId = `guard_qr_reader_${reactId}`
    const scannerRef = useRef(null)
    const decodedRef = useRef(false)
    const onDecodedRef = useRef(onDecoded)
    const [cameraError, setCameraError] = useState(null)
    const [pasteValue, setPasteValue] = useState('')

    useEffect(() => {
        onDecodedRef.current = onDecoded
    }, [onDecoded])

    useEffect(() => {
        if (!isOpen) {
            decodedRef.current = false
            setCameraError(null)
            setPasteValue('')
            const q = scannerRef.current
            if (q) {
                q.stop()
                    .then(() => q.clear())
                    .catch(() => {})
                scannerRef.current = null
            }
            return
        }

        decodedRef.current = false
        let cancelled = false

        const start = async () => {
            setCameraError(null)
            await new Promise((r) => setTimeout(r, 0))
            if (cancelled || !document.getElementById(containerId)) return
            try {
                const { Html5Qrcode } = await import('html5-qrcode')
                if (cancelled) return
                const html5QrCode = new Html5Qrcode(containerId, false)
                scannerRef.current = html5QrCode
                await html5QrCode.start(
                    { facingMode: 'environment' },
                    { fps: 10, qrbox: { width: 260, height: 260 } },
                    async (decodedText) => {
                        if (cancelled || decodedRef.current) return
                        decodedRef.current = true
                        try {
                            await html5QrCode.stop()
                            html5QrCode.clear()
                        } catch {
                            /* ignore */
                        }
                        scannerRef.current = null
                        onDecodedRef.current(decodedText.trim())
                    },
                    () => {},
                )
            } catch (e) {
                if (!cancelled) {
                    setCameraError(
                        e?.message ||
                            t('cameraUnavailable'),
                    )
                }
            }
        }

        start()

        return () => {
            cancelled = true
            const q = scannerRef.current
            if (q) {
                q.stop()
                    .then(() => q.clear())
                    .catch(() => {})
                scannerRef.current = null
            }
        }
    }, [isOpen, containerId, t])

    const handlePasteSubmit = () => {
        const t = pasteValue.trim()
        if (!t) return
        onDecodedRef.current(t)
    }

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            onRequestClose={onClose}
            width={440}
        >
            <h5 className="font-bold text-lg mb-1 pr-10">{title}</h5>

            <p className="text-sm text-gray-500 mb-3">
                {t('subtitle')}
            </p>

            <div
                id={containerId}
                className="w-full min-h-[220px] rounded-xl overflow-hidden bg-gray-900/90 dark:bg-black/50"
            />

            {cameraError && (
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                    {cameraError}
                </p>
            )}

            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs font-semibold text-gray-500 mb-2">
                    {t('orPaste')}
                </p>
                <Input
                    textArea
                    rows={3}
                    placeholder={t('pastePlaceholder')}
                    value={pasteValue}
                    onChange={(e) => setPasteValue(e.target.value)}
                    className="mb-2"
                />
                <Button
                    size="sm"
                    variant="twoTone"
                    block
                    disabled={!pasteValue.trim()}
                    onClick={handlePasteSubmit}
                >
                    {t('submit')}
                </Button>
            </div>
        </Dialog>
    )
}

export default GuardQrScannerDialog
