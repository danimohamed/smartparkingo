import { lastLiveContext } from '@/services/GeminiService'

// re-export for tests
export { lastLiveContext }

const BOOKING_INTENT =
  /book|reserve|réserv|parking spot|place|حجز|حجز|reservation|parking near|find parking/i

export function matchesBookingIntent(text) {
  return BOOKING_INTENT.test((text || '').toLowerCase())
}

function isDurationOnlyMessage(text) {
  const t = (text || '').trim()
  return /^\d+\s*h\s*$/i.test(t) || /^\d+\s*(hours?|heures?)\s*$/i.test(t)
}

/**
 * After a normal Gemini reply, inject interactive parking cards (mobile parity).
 */
export function shouldInjectParkingPicker(userText, bookingState) {
  if (bookingState !== 'idle') return false
  const raw = lastLiveContext.parkingsRaw
  if (!raw?.length) return false
  const q = (userText || '').toLowerCase()
  if (BOOKING_INTENT.test(q)) return true
  if (isDurationOnlyMessage(userText)) return true
  return false
}

/**
 * Deterministic reply when we show the parking picker (model sometimes ignores LIVE CONTEXT).
 */
export function bookingIntroMarkdownFromContext() {
  const raw = lastLiveContext.parkingsRaw || []
  if (!raw.length) return null
  const lines = raw.map((p, i) => {
    const dist =
      p.distance != null ? `${p.distance.toFixed(1)} km` : '—'
    const rate = p.pricePerHour ?? p.price
    const ph =
      rate === Math.round(rate) ? Math.round(rate) : rate
    return `${i + 1}. **${p.name}** (ID:${p.id}) — ${ph} MAD/h | ${p.availableSlots} free | ${dist}`
  })
  const n = raw.length
  return (
    `Here are the **${n === 1 ? 'closest' : `${n} closest`}** parking${n === 1 ? '' : 's'} you can book — **tap a card below** to choose:\n\n` +
    `${lines.join('\n')}\n\n` +
    `After you pick, tell me **how many hours** you need.`
  )
}

export function buildParkingOptionsFromContext() {
  const raw = lastLiveContext.parkingsRaw || []
  const nameCount = raw.reduce((acc, p) => {
    const n = p.name || ''
    acc[n] = (acc[n] || 0) + 1
    return acc
  }, {})

  return raw.map((p) => {
    const price =
      p.pricePerHour === Math.round(p.pricePerHour)
        ? `${Math.round(p.pricePerHour)}`
        : `${p.pricePerHour}`
    const dist =
      p.distance != null ? `${p.distance.toFixed(1)} km` : ''
    const dupName = (nameCount[p.name] || 0) > 1
    const addr = (p.address || '').trim()
    const shortAddr =
      addr.length > 32 ? `${addr.slice(0, 32)}…` : addr
    const label =
      dupName && shortAddr
        ? `${p.name} · ${shortAddr}`
        : dupName
          ? `${p.name} (#${p.id})`
          : p.name
    return {
      id: String(p.id),
      label,
      subtitle: `#${p.id} · ${p.availableSlots} spots · ${price} MAD/h${dist ? ` · ${dist}` : ''}`,
      data: { parkingId: p.id },
    }
  })
}
