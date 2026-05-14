import { apiGetAllParkings } from './ParkingService'
import { apiGetMyReservations, apiCreateReservation, apiCancelReservation } from './ReservationService'
import { apiGetWalletBalance, apiPayWithWallet, apiGetWalletTransactions } from './WalletService'
import { apiGetAvailableSlots } from './ParkingSlotService'
import { apiGetCurrentUser } from './UserService'
import { apiGetMyPayments } from './PaymentService'

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || ''
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

if (!GEMINI_API_KEY && typeof window !== 'undefined') {
  console.warn('[ParkBot] NEXT_PUBLIC_GEMINI_API_KEY is not set — chatbot will not work.')
}

/** Last live context from the most recent Gemini request (for booking suggestions). */
export let lastLiveContext = {}

function distanceKm(lat1, lon1, lat2, lon2) {
  const r = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** Normalize parking name so franchise duplicates don't fill all 3 suggestion slots. */
function parkingNameKey(name) {
  return (name || '').trim().toLowerCase()
}

/**
 * Top N parkings for the booking chips: prefer **distinct names** (closest of each),
 * then fill by distance if fewer than N unique names exist.
 */
function pickTopParkingsRaw(sortedByDistance, max = 3) {
  const build = (requireAvailability) => {
    const out = []
    const seenIds = new Set()
    const seenNames = new Set()
    const slotOk = (p) =>
      !requireAvailability ||
      p.availableSlots == null ||
      p.availableSlots > 0

    for (const p of sortedByDistance) {
      if (out.length >= max) break
      if (!slotOk(p)) continue
      if (seenIds.has(p.id)) continue
      const key = parkingNameKey(p.name)
      if (seenNames.has(key)) continue
      seenNames.add(key)
      seenIds.add(p.id)
      out.push(p)
    }

    if (out.length < max) {
      for (const p of sortedByDistance) {
        if (out.length >= max) break
        if (!slotOk(p)) continue
        if (seenIds.has(p.id)) continue
        seenIds.add(p.id)
        out.push(p)
      }
    }
    return out
  }

  const withAvail = build(true)
  if (withAvail.length > 0) return withAvail
  return build(false)
}

const MODELS = [
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-2.0-flash-lite',
]

// Remember which model worked last so we try it first next time
let lastWorkingModel = null

function geminiUrl(model, stream = false) {
  const action = stream ? 'streamGenerateContent' : 'generateContent'
  const alt = stream ? '&alt=sse' : ''
  return `${GEMINI_BASE}/${model}:${action}?key=${GEMINI_API_KEY}${alt}`
}

function getOrderedModels() {
  if (!lastWorkingModel || lastWorkingModel === MODELS[0]) return MODELS
  return [lastWorkingModel, ...MODELS.filter(m => m !== lastWorkingModel)]
}

function nowMorocco() {
  return new Date().toLocaleString('sv-SE', { timeZone: 'Africa/Casablanca' }).replace(' ', 'T')
}

const SYSTEM_PROMPT = `You are ParkBot 🤖, the full-service AI assistant for SmartParking in Marrakech, Morocco.
You manage the ENTIRE parking booking experience through chat.

Currency: MAD (Moroccan Dirham). Pricing: per hour, minimum 1 hour, cost = ceil(hours) × pricePerHour.

=== WHAT YOU CAN DO ===
1. 🔍 Search & list parkings (name, location, price, availability)
2. 📋 Show user's reservations, payments, wallet balance, transactions
3. 🚗 CREATE a reservation (pick slot, time, confirm, book)
4. ❌ CANCEL a reservation
5. 💳 PAY for a reservation using wallet
6. 🧮 Calculate costs, compare prices, recommend parkings
7. 💡 Answer questions about Marrakech parking tips

=== RULES ===
- Respond in the SAME language as the user (English, French, Arabic darija)
- Use markdown formatting. Use emojis for clarity.
- Keep answers concise (max 5 sentences) unless listing data
- ONLY use data from [CONTEXT] blocks below — never invent IDs, names, or prices
- NEVER say you "need the system" to load parkings, or that you cannot see options — when [LIVE PARKING DATA] or [TOP 3 FOR PICKER] is present, you have the list and must use it
- Slot types: STANDARD, VIP, ELECTRIC, HANDICAPPED
- Floors: RDC=ground, 1-4=above, -1 to -5=underground

=== ACTIONS ===
You can execute real backend actions by including ONE action block per response.
Format EXACTLY:

\`\`\`action
{"type":"reserve","parkingSlotId":123,"startTime":"2026-03-26T14:00:00","endTime":"2026-03-26T16:00:00"}
\`\`\`

\`\`\`action
{"type":"cancel","reservationId":456}
\`\`\`

\`\`\`action
{"type":"pay","reservationId":456}
\`\`\`

=== BOOKING FLOW (you MUST follow this) ===
1. USER ASKS TO BOOK / RESERVE → **FIRST reply only:** List exactly the **three** parkings from [LIVE PARKING DATA] that match [TOP 3 FOR PICKER] (name, ID, MAD/h, free slots, distance). Say the app will show three buttons for the same options. **Do NOT ask "how many hours" or "what time" before listing these three parkings once.** After that, you may ask duration and start time.
2. USER PICKS A PARKING (or you recommend one) → Show available slots for that parking (slot number, floor, type)
3. USER CONFIRMS OR YOU PICK BEST MATCH → Show a SUMMARY before booking:
   📋 **Booking Summary**
   - Parking: [name]
   - Slot: [number] (floor [X], [type])
   - Time: [start] → [end] ([N] hours)
   - Cost: [amount] MAD
   - Wallet: [balance] MAD [✅ sufficient / ⚠️ insufficient]
   Then ask: "Shall I confirm this reservation?"
4. USER CONFIRMS ("yes", "ok", "confirm", "oui", "نعم") → Output the action block + confirmation message
5. AFTER BOOKING → Remind user to pay: "Your reservation is created! Pay [X] MAD from your wallet? (say 'pay')"

=== CANCELLATION FLOW ===
1. Show user's active reservations
2. User picks one → Show details + ask "Are you sure?"
3. User confirms → Output cancel action

=== PAYMENT FLOW ===
1. User says "pay" or "pay for reservation #X" → Check wallet balance ≥ cost
2. If sufficient → Output pay action
3. If insufficient → Tell user their balance and how much more they need

=== VALIDATION RULES ===
- NEVER output an action block without ALL required fields
- NEVER guess slot IDs — only use IDs from [AVAILABLE SLOTS]
- startTime MUST be in the future. Default: current time + 10 minutes, rounded to next quarter hour
- endTime = startTime + requested hours (minimum 1h)
- Before reserve action: verify wallet balance ≥ estimated cost. Warn if insufficient (but still allow booking since payment is separate)
- Before pay action: verify wallet balance ≥ payment amount. REFUSE if insufficient.
- For booking requests: never skip step 1 of BOOKING FLOW (list three parkings before asking hours/time)
- If something is missing in other flows, ask the user — never invent data

Current date/time: ${nowMorocco()}`

// ─── Context fetching ────────────────────────────────────────
function isBookingIntentMessage(q) {
  return /book|reserve|réserv|parking spot|place|حجز|reservation|parking near|find parking|i want to|je veux|je voudrais|أريد|حاب|نحجز/i.test(
    q,
  )
}

function isDurationOnlyFollowUp(msg) {
  const t = msg.trim()
  return /^\d+\s*h\s*$/i.test(t) || /^\d+\s*(hours?|heures?)\s*$/i.test(t)
}

// ─── Context fetching ────────────────────────────────────────
async function fetchLiveContext(msg) {
  const previousParkings = lastLiveContext.parkings
  const previousParkingsRaw = lastLiveContext.parkingsRaw

  const ctx = {}
  const q = msg.toLowerCase()

  if (typeof window !== 'undefined' && 'geolocation' in navigator) {
    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 6000,
          maximumAge: 120000,
        })
      })
      ctx.userLat = pos.coords.latitude
      ctx.userLng = pos.coords.longitude
    } catch {
      /* optional */
    }
  }

  // Always fetch user + wallet (lightweight, needed for personalization & validation)
  const basePromises = [
    apiGetCurrentUser()
      .then(res => { ctx.user = res?.data })
      .catch(() => {}),
    apiGetWalletBalance()
      .then(res => { ctx.balance = res?.data?.balance ?? 0 })
      .catch(() => {}),
  ]

  const needsParkings =
    /park|slot|find|avail|dispo|cheap|price|prix|وقوف|near|proche|reserv|book|حجز|réserv|reserve|cher/.test(
      q,
    ) || isBookingIntentMessage(q)
  const needsReservations = /reserv|book|cancel|my |mes |حجز|réserv|pay|annul|show|list|history|histor/.test(q)
  const needsPayments = /pay|paid|payment|paiement|دفع|wallet|trans|factur/.test(q)
  const needsSlots = /reserv|book|حجز|réserv|reserve|slot|place|crén/.test(q)

  if (needsParkings) {
    basePromises.push(
      apiGetAllParkings()
        .then(res => {
          const raw = (res?.data || []).filter((p) => p.active !== false)
          let withDist = raw.map(p => {
            let dist = null
            if (
              ctx.userLat != null &&
              ctx.userLng != null &&
              p.latitude != null &&
              p.longitude != null
            ) {
              dist = distanceKm(ctx.userLat, ctx.userLng, p.latitude, p.longitude)
            }
            return { ...p, distance: dist }
          })
          withDist.sort((a, b) => (a.distance ?? 9999) - (b.distance ?? 9999))
          ctx.parkings = withDist.map(p => ({
            id: p.id,
            name: p.name,
            address: p.address,
            price: p.pricePerHour,
            available: p.availableSlots,
            total: p.totalSlots,
            distance: p.distance,
          }))
          ctx.parkingsRaw = pickTopParkingsRaw(withDist, 3)
        })
        .catch(() => {})
    )
  }

  if (needsReservations) {
    basePromises.push(
      apiGetMyReservations()
        .then(res => {
          ctx.reservations = (res?.data || []).map(r => ({
            id: r.id, slot: r.slotNumber, parking: r.parkingName,
            slotId: r.parkingSlotId,
            start: r.startTime, end: r.endTime, status: r.status, price: r.totalPrice
          }))
        })
        .catch(() => {})
    )
  }

  if (needsPayments) {
    basePromises.push(
      apiGetMyPayments()
        .then(res => {
          ctx.payments = (res?.data || []).slice(0, 10).map(p => ({
            id: p.id, reservationId: p.reservationId, amount: p.amount,
            status: p.status, method: p.paymentMethod, paidAt: p.paidAt
          }))
        })
        .catch(() => {}),
      apiGetWalletTransactions()
        .then(res => {
          ctx.transactions = (res?.data || []).slice(0, 5)
        })
        .catch(() => {})
    )
  }

  await Promise.all(basePromises)

  if (
    !ctx.parkingsRaw?.length &&
    previousParkingsRaw?.length &&
    isDurationOnlyFollowUp(msg)
  ) {
    ctx.parkingsRaw = previousParkingsRaw
    ctx.parkings = previousParkings
  }

  // Fetch available slots for parkings with free spots
  if (needsSlots && ctx.parkings?.length) {
    const parkingsWithSlots = ctx.parkings.filter(p => p.available > 0).slice(0, 8)
    const slotPromises = parkingsWithSlots.map(p =>
      apiGetAvailableSlots(p.id)
        .then(res => ({ parkingId: p.id, parkingName: p.name, price: p.price, slots: (res?.data || []).slice(0, 15) }))
        .catch(() => ({ parkingId: p.id, parkingName: p.name, price: p.price, slots: [] }))
    )
    ctx.availableSlots = await Promise.all(slotPromises)
  }

  lastLiveContext = { ...ctx }
  return ctx
}

// ─── Build Gemini contents ───────────────────────────────────
function buildContents(userMessage, history, ctx) {
  let ctxBlock = ''

  if (ctx.user) {
    ctxBlock += `\n[USER PROFILE]\nName: ${ctx.user.fullName} | Email: ${ctx.user.email} | Phone: ${ctx.user.phone || 'N/A'} | Role: ${ctx.user.role}\n`
  }
  if (ctx.balance !== undefined) {
    ctxBlock += `[WALLET BALANCE] ${ctx.balance} MAD\n`
  }
  if (ctx.parkings?.length) {
    ctxBlock +=
      '\n[LIVE PARKING DATA] (sorted by distance — when suggesting ~3 parkings, prefer **3 different names** (closest per name); the database may list several rows with the same name at different IDs)\n'
    ctx.parkings.forEach(p => {
      const dist =
        p.distance != null ? `${p.distance.toFixed(1)}km away` : 'distance unknown'
      ctxBlock += `- **${p.name}** (ID:${p.id}) | ${p.price} MAD/h | ${p.available}/${p.total} free | ${dist}\n`
    })
  }
  if (ctx.parkingsRaw?.length) {
    ctxBlock += '\n[TOP 3 FOR PICKER — list these three in your reply; the UI shows tappable cards for the same three]\n'
    ctx.parkingsRaw.forEach(p => {
      const dist =
        p.distance != null ? `${p.distance.toFixed(1)}km` : 'distance unknown'
      const ph = p.pricePerHour ?? p.price
      ctxBlock += `- **${p.name}** (ID:${p.id}) | ${ph} MAD/h | ${p.availableSlots} free | ${dist}\n`
    })
  }
  if (ctx.availableSlots?.length) {
    ctxBlock += '\n[AVAILABLE SLOTS]\n'
    ctx.availableSlots.forEach(ps => {
      if (ps.slots.length > 0) {
        ctxBlock += `📍 ${ps.parkingName} (parkingID:${ps.parkingId}, ${ps.price} MAD/h):\n`
        ps.slots.forEach(s => {
          ctxBlock += `  - slotId:${s.id} | ${s.slotNumber} | floor:${s.floor} | type:${s.slotType}\n`
        })
      } else {
        ctxBlock += `📍 ${ps.parkingName}: NO available slots\n`
      }
    })
  }
  if (ctx.reservations?.length) {
    ctxBlock += '\n[MY RESERVATIONS]\n'
    ctx.reservations.forEach(r => {
      ctxBlock += `- Reservation #${r.id} | ${r.parking} | slot ${r.slot} (slotId:${r.slotId}) | ${r.start} → ${r.end} | ${r.status} | ${r.price} MAD\n`
    })
  }
  if (ctx.payments?.length) {
    ctxBlock += '\n[MY PAYMENTS]\n'
    ctx.payments.forEach(p => {
      ctxBlock += `- Payment #${p.id} for reservation #${p.reservationId} | ${p.amount} MAD | ${p.status} | ${p.method || 'N/A'}\n`
    })
  }
  if (ctx.transactions?.length) {
    ctxBlock += '\n[WALLET TRANSACTIONS]\n'
    ctx.transactions.forEach(t => {
      ctxBlock += `- ${t.type}: ${t.amount} MAD | ${t.description || ''} | ${t.createdAt}\n`
    })
  }

  const fullMsg = ctxBlock ? `${userMessage}\n\n--- LIVE CONTEXT ---${ctxBlock}` : userMessage

  return [
    { role: 'user', parts: [{ text: `[SYSTEM INSTRUCTIONS]\n${SYSTEM_PROMPT}` }] },
    { role: 'model', parts: [{ text: 'Understood! I am ParkBot — I can search parkings, book slots, cancel reservations, process wallet payments, and check all your data. How can I help?' }] },
    ...history.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] })),
    { role: 'user', parts: [{ text: fullMsg }] },
  ]
}

// ─── Action parser ───────────────────────────────────────────
export function parseActions(text) {
  const actions = []
  const cleanText = text.replace(/```action\s*\n?([\s\S]*?)```/g, (_, json) => {
    try {
      const action = JSON.parse(json.trim())
      if (action.type) actions.push(action)
    } catch (_) {}
    return ''
  }).trim()
  return { cleanText, actions }
}

// ─── Action executor ─────────────────────────────────────────
export async function executeAction(action) {
  try {
    if (action.type === 'reserve') {
      const { parkingSlotId, startTime, endTime, vehiclePlate } = action
      if (!parkingSlotId || !startTime || !endTime || !vehiclePlate) {
        return {
          success: false,
          message:
            '❌ Missing reservation data (slotId, startTime, endTime, or vehiclePlate).',
        }
      }
      const res = await apiCreateReservation({
        parkingSlotId,
        vehiclePlate,
        startTime,
        endTime,
      })
      const r = res?.data
      return {
        success: true,
        message: `✅ **Reservation created successfully!**\n\n| Detail | Value |\n|--------|-------|\n| 🏢 Parking | ${r?.parkingName} |\n| 🅿️ Slot | ${r?.slotNumber} |\n| 🕐 Start | ${r?.startTime} |\n| 🕑 End | ${r?.endTime} |\n| 💰 Cost | ${r?.totalPrice} MAD |\n| 📌 Status | ${r?.status} |\n| 🎫 Ref | RES-${String(r?.id).padStart(5, '0')} |\n\n💳 Say **"pay"** to pay with your wallet!`
      }
    }

    if (action.type === 'cancel') {
      const { reservationId } = action
      if (!reservationId) return { success: false, message: '❌ Missing reservation ID.' }
      const res = await apiCancelReservation(reservationId)
      const r = res?.data
      return {
        success: true,
        message: `✅ **Reservation RES-${String(r?.id).padStart(5, '0')} cancelled.**\n- Parking: ${r?.parkingName}\n- Slot: ${r?.slotNumber}\n- Status: ${r?.status}`
      }
    }

    if (action.type === 'pay') {
      const { reservationId } = action
      if (!reservationId) return { success: false, message: '❌ Missing reservation ID.' }
      const res = await apiPayWithWallet({ reservationId })
      const w = res?.data
      return {
        success: true,
        message: `✅ **Payment successful!**\n- Reservation RES-${String(reservationId).padStart(5, '0')} is now **PAID** 🎉\n- Remaining wallet balance: **${w?.balance ?? '?'} MAD**`
      }
    }

    return { success: false, message: '❌ Unknown action type.' }
  } catch (err) {
    const apiMsg = err?.response?.data?.message || err?.message || 'Action failed'
    return { success: false, message: `❌ **Action failed:** ${apiMsg}` }
  }
}

// ─── Streaming API call ──────────────────────────────────────
export async function sendToGeminiStream(userMessage, history = [], onChunk) {
  if (!GEMINI_API_KEY) {
    throw new Error('API_KEY_INVALID')
  }

  const ctx = await fetchLiveContext(userMessage)
  const contents = buildContents(userMessage, history, ctx)
  const body = JSON.stringify({
    contents,
    generationConfig: { temperature: 0.7, maxOutputTokens: 1000 },
  })

  const ordered = getOrderedModels()
  let lastError = null

  for (const model of ordered) {
    try {
      const res = await fetch(geminiUrl(model, true), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      })

      if (res.status === 429) { lastError = new Error('RATE_LIMITED'); continue }
      if (res.status === 403) throw new Error('API_KEY_INVALID')
      if (res.status === 400) throw new Error('BAD_REQUEST')
      if (!res.ok) throw new Error(`GEMINI_${res.status}`)

      lastWorkingModel = model

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const jsonStr = line.slice(6).trim()
          if (!jsonStr || jsonStr === '[DONE]') continue
          try {
            const parsed = JSON.parse(jsonStr)
            const chunk = parsed?.candidates?.[0]?.content?.parts?.[0]?.text
            if (chunk) { fullText += chunk; onChunk?.(fullText) }
          } catch (_) {}
        }
      }

      if (!fullText) throw new Error('EMPTY_RESPONSE')
      return fullText
    } catch (err) {
      if (err.message === 'RATE_LIMITED') { lastError = err; continue }
      throw err
    }
  }
  throw lastError || new Error('RATE_LIMITED')
}

// ─── Quick prompts ───────────────────────────────────────────
export const QUICK_PROMPTS = [
  { label: '🚗 Book parking',       text: 'I want to reserve a parking spot' },
  { label: '🅿️ Available spots',    text: 'Show available parkings with free slots' },
  { label: '📋 My reservations',    text: 'Show all my reservations' },
  { label: '💳 Pay reservation',    text: 'Pay for my latest reservation' },
  { label: '💰 Wallet balance',     text: 'What is my wallet balance?' },
  { label: '❌ Cancel booking',     text: 'I want to cancel a reservation' },
]
