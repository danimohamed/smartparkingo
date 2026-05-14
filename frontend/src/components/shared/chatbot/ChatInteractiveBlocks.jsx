'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import useChatStore from './useChatStore'
import { PiCarDuotone, PiArrowRightBold, PiChatCircleDuotone } from 'react-icons/pi'
import { useTranslations } from 'next-intl'

export function ParkingOptionsBlock({ msg }) {
  const t = useTranslations('chatbot.interactive')
  const bookingState = useChatStore((s) => s.bookingState)
  const selectParking = useChatStore((s) => s.selectParking)
  const enabled = bookingState === 'awaitingParkingChoice'

  return (
    <div className="space-y-2 max-w-[92%]">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
        {t('parkingQuestion')}
      </p>
      <div className="flex flex-col gap-2">
        {(msg.options || []).map((opt) => (
          <button
            key={opt.id}
            type="button"
            disabled={!enabled}
            onClick={() => selectParking(opt)}
            className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-all ${
              enabled
                ? 'border-primary/40 bg-white dark:bg-gray-800 hover:border-primary hover:shadow-sm cursor-pointer'
                : 'border-gray-200 dark:border-gray-600 opacity-50 cursor-not-allowed'
            }`}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <PiCarDuotone className="text-lg" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="font-semibold text-gray-900 dark:text-gray-100 block truncate">
                {opt.label}
              </span>
              {opt.subtitle && (
                <span className="text-[11px] text-gray-500 line-clamp-2">
                  {opt.subtitle}
                </span>
              )}
            </span>
            {enabled && <PiArrowRightBold className="text-gray-400 shrink-0" />}
          </button>
        ))}
      </div>
    </div>
  )
}

export function TimeSelectionBlock({ msg }) {
  const t = useTranslations('chatbot.interactive')
  const bookingState = useChatStore((s) => s.bookingState)
  const selectTime = useChatStore((s) => s.selectTime)
  const enabled = bookingState === 'awaitingTimeSelection'
  const meta = msg.metadata || {}

  const [start, setStart] = useState(() => {
    const d = meta.defaultStart
      ? new Date(meta.defaultStart)
      : new Date(Date.now() + 60 * 60 * 1000)
    d.setSeconds(0, 0)
    return d
  })
  const [durationHours, setDurationHours] = useState(1)

  const end = useMemo(() => {
    const e = new Date(start.getTime())
    e.setHours(e.getHours() + durationHours)
    return e
  }, [start, durationHours])

  const pricePerHour = meta.pricePerHour ?? 0
  const totalCost = durationHours * pricePerHour

  const toLocalInput = (d) => {
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const handleConfirm = () => {
    selectTime(start, end)
  }

  return (
    <div
      className={`rounded-xl border border-primary/30 bg-white dark:bg-gray-800 p-3 text-sm max-w-[92%] ${
        !enabled ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      <p className="font-bold text-gray-900 dark:text-gray-100 mb-1">
        {t('selectTime')}
      </p>
      <p className="text-[11px] text-gray-500 mb-2">
        {t('slotInfo', { parking: meta.parkingName, slot: meta.slotNumber, floor: meta.slotFloor, type: meta.slotType })}
      </p>
      <label className="block text-[11px] font-medium text-gray-600 mb-1">
        {t('start')}
      </label>
      <input
        type="datetime-local"
        disabled={!enabled}
        value={toLocalInput(start)}
        onChange={(e) => {
          const v = e.target.value
          if (!v) return
          setStart(new Date(v))
        }}
        className="input input-sm w-full mb-2 rounded-lg"
      />
      <p className="text-[11px] font-medium text-gray-600 mb-1">{t('duration')}</p>
      <div className="flex gap-1 mb-2">
        {[1, 2, 3, 4].map((h) => (
          <button
            key={h}
            type="button"
            disabled={!enabled}
            onClick={() => setDurationHours(h)}
            className={`flex-1 rounded-lg py-1.5 text-xs font-semibold ${
              durationHours === h
                ? 'bg-primary text-neutral'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
            }`}
          >
            {h}h
          </button>
        ))}
      </div>
      <p className="text-[11px] text-gray-500 mb-2">
        {t('end', { time: end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })}
      </p>
      <div className="rounded-lg bg-primary/10 px-2 py-1.5 text-center text-sm font-bold text-primary mb-2">
        {totalCost === Math.round(totalCost)
          ? Math.round(totalCost)
          : totalCost.toFixed(1)}{' '}
        MAD
      </div>
      <Button
        block
        size="sm"
        variant="solid"
        disabled={!enabled}
        onClick={handleConfirm}
      >
        {t('continue')}
      </Button>
    </div>
  )
}

export function GuardChatCtaBlock({ msg }) {
  const t = useTranslations('chatbot.interactive')
  const m = msg.metadata || {}
  const chatId = m.chatId
  const parkingName = m.parkingName || t('thisParking')
  const href =
    chatId != null ? `/messages?chat=${encodeURIComponent(String(chatId))}` : '/messages'

  return (
    <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/90 p-3 text-sm dark:border-emerald-500/30 dark:bg-emerald-500/10 max-w-[92%]">
      <p className="text-[12px] leading-relaxed text-emerald-950 dark:text-emerald-100">
        {msg.content}
      </p>
      {parkingName && (
        <p className="mt-2 text-[11px] text-emerald-800/80 dark:text-emerald-200/80">
          {t('parking')} <strong>{parkingName}</strong>
        </p>
      )}
      <div className="mt-3">
        <Button
          asElement={Link}
          href={href}
          size="sm"
          variant="solid"
          className="inline-flex items-center gap-2 !px-4"
          icon={<PiChatCircleDuotone className="text-lg" />}
        >
          {t('chat')}
        </Button>
      </div>
    </div>
  )
}

export function PaymentConfirmBlock({ msg }) {
  const t = useTranslations('chatbot.interactive')
  const bookingState = useChatStore((s) => s.bookingState)
  const confirmBooking = useChatStore((s) => s.confirmBooking)
  const cancelBooking = useChatStore((s) => s.cancelBooking)
  const enabled = bookingState === 'awaitingConfirmation'
  const m = msg.metadata || {}

  return (
    <div
      className={`rounded-xl border border-primary/30 bg-white dark:bg-gray-800 p-3 text-sm max-w-[92%] ${
        !enabled ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      <p className="font-bold text-gray-900 dark:text-gray-100 mb-2">
        {t('summary')}
      </p>
      <ul className="text-[11px] text-gray-600 dark:text-gray-300 space-y-1 mb-2">
        <li>
          <strong>{t('parking')}</strong> {m.parkingName}
        </li>
        <li>
          <strong>{t('slot')}</strong> {m.slotNumber} (Floor {m.slotFloor}, {m.slotType})
        </li>
        <li>
          <strong>{t('time')}</strong> {m.timeRange} ({m.hours} h)
        </li>
        <li>
          <strong>{t('cost')}</strong>{' '}
          {m.cost === Math.round(m.cost) ? Math.round(m.cost) : m.cost} MAD
        </li>
        <li>
          <strong>{t('wallet')}</strong>{' '}
          {m.walletBalance === Math.round(m.walletBalance)
            ? Math.round(m.walletBalance)
            : m.walletBalance}{' '}
          MAD {m.sufficient ? '✓' : '⚠️'}
        </li>
      </ul>
      {!m.sufficient && (
        <p className="text-[11px] text-error mb-2">
          {t('insufficient')}
        </p>
      )}
      <div className="flex gap-2">
        <Button
          size="sm"
          className="flex-1"
          disabled={!enabled}
          onClick={cancelBooking}
        >
          {t('cancel')}
        </Button>
        <Button
          size="sm"
          variant="solid"
          className="flex-[2]"
          disabled={!enabled || !m.sufficient}
          onClick={() => confirmBooking()}
        >
          {t('confirm')}
        </Button>
      </div>
    </div>
  )
}
