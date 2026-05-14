import { create } from 'zustand'
import { lastLiveContext } from '@/services/GeminiService'
import { apiGetAvailableSlots } from '@/services/ParkingSlotService'
import { apiCreateReservation } from '@/services/ReservationService'
import { apiGetWalletBalance } from '@/services/WalletService'
import { buildParkingOptionsFromContext } from './chatBookingFlow'
import { normalizeVehiclePlate } from '@/utils/plate'

const fmtTime = (d) => {
  const dt = typeof d === 'string' ? new Date(d) : d
  const h = String(dt.getHours()).padStart(2, '0')
  const m = String(dt.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

/** Match ParkingDetailClient / backend LocalDateTime: local wall time, no timezone. */
const toLocalApiDateTime = (d) => {
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`
}

const useChatStore = create((set, get) => ({
  isOpen: false,
  messages: [],
  isTyping: false,

  bookingState: 'idle',
  nearbyParkings: [],
  selectedParking: null,
  selectedSlot: null,
  selectedStart: null,
  selectedEnd: null,
  vehiclePlate: '',
  walletBalance: 0,

  setVehiclePlate: (val) => set({ vehiclePlate: val }),

  toggleOpen: () => set((s) => ({ isOpen: !s.isOpen })),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),

  addMessage: (msg) =>
    set((s) => ({
      messages: [
        ...s.messages,
        { id: Date.now() + Math.random(), timestamp: new Date(), ...msg },
      ],
    })),

  updateLastMessage: (content) =>
    set((s) => {
      const msgs = [...s.messages]
      if (msgs.length > 0) {
        msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content }
      }
      return { messages: msgs }
    }),

  setTyping: (val) => set({ isTyping: val }),

  clearChat: () =>
    set({
      messages: [],
      bookingState: 'idle',
      nearbyParkings: [],
      selectedParking: null,
      selectedSlot: null,
      selectedStart: null,
      selectedEnd: null,
      vehiclePlate: '',
    }),

  resetBooking: () =>
    set({
      bookingState: 'idle',
      nearbyParkings: [],
      selectedParking: null,
      selectedSlot: null,
      selectedStart: null,
      selectedEnd: null,
      vehiclePlate: '',
    }),

  getHistory: () =>
    get()
      .messages.filter(
        (m) =>
          !m.error &&
          !m.type &&
          m.content &&
          m.content !== '…',
      )
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content })),

  injectParkingPicker: () => {
    const opts = buildParkingOptionsFromContext()
    if (!opts.length) return
    const balance = lastLiveContext.balance ?? 0
    set({
      bookingState: 'awaitingParkingChoice',
      nearbyParkings: lastLiveContext.parkingsRaw || [],
      walletBalance: balance,
    })
    get().addMessage({
      role: 'assistant',
      content: 'Pick a parking:',
      type: 'parkingOptions',
      options: opts,
    })
  },

  selectParking: async (option) => {
    if (get().bookingState !== 'awaitingParkingChoice') return
    const parking = get().nearbyParkings.find(
      (p) => String(p.id) === String(option.id),
    )
    if (!parking) return

    get().addMessage({ role: 'user', content: option.label })
    set({ isTyping: true })

    try {
      const res = await apiGetAvailableSlots(parking.id)
      const slots = res?.data || []
      if (!slots.length) {
        get().addMessage({
          role: 'assistant',
          content: `Sorry, no available slots right now at ${parking.name}. Try another parking.`,
          error: true,
        })
        get().resetBooking()
        set({ isTyping: false })
        return
      }

      const slot = slots[0]
      const now = new Date()
      const start = new Date(now.getTime() + 60 * 60 * 1000)
      start.setMinutes(0, 0, 0)
      if (start <= now) start.setHours(start.getHours() + 1)

      set({
        selectedParking: parking,
        selectedSlot: slot,
        bookingState: 'awaitingTimeSelection',
        isTyping: false,
      })

      get().addMessage({
        role: 'assistant',
        content: `Choose your reservation time for ${parking.name}`,
        type: 'timeSelection',
        metadata: {
          parkingName: parking.name,
          pricePerHour: parking.pricePerHour,
          slotNumber: slot.slotNumber,
          slotFloor: slot.floor ?? 'RDC',
          slotType: slot.slotType,
          defaultStart: start.toISOString(),
          walletBalance: get().walletBalance,
        },
      })
    } catch {
      get().addMessage({
        role: 'assistant',
        content: 'Could not load slots. Please try again.',
        error: true,
      })
      get().resetBooking()
      set({ isTyping: false })
    }
  },

  selectTime: (start, end) => {
    if (get().bookingState !== 'awaitingTimeSelection') return
    const parking = get().selectedParking
    const slot = get().selectedSlot
    if (!parking || !slot) return

    const hours = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60),
    )
    const cost = hours * parking.pricePerHour
    const timeRange = `${fmtTime(start)} → ${fmtTime(end)}`

    get().addMessage({
      role: 'user',
      content: `Book from ${timeRange} (${hours}h)`,
    })

    const bal = get().walletBalance
    set({
      bookingState: 'awaitingConfirmation',
      selectedStart: start,
      selectedEnd: end,
      vehiclePlate: '',
    })

    get().addMessage({
      role: 'assistant',
      content: 'Booking summary',
      type: 'paymentConfirm',
      metadata: {
        parkingName: parking.name,
        slotNumber: slot.slotNumber,
        slotFloor: slot.floor ?? 'RDC',
        slotType: slot.slotType,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        timeRange,
        hours,
        cost,
        walletBalance: bal,
        sufficient: bal >= cost,
      },
    })
  },

  confirmBooking: async () => {
    if (get().bookingState !== 'awaitingConfirmation') return
    const slot = get().selectedSlot
    const start = get().selectedStart
    const end = get().selectedEnd
    if (!slot || !start || !end) return

    get().addMessage({ role: 'user', content: 'Confirm booking ✓' })
    set({ isTyping: true })

    try {
      const plateNormalized = normalizeVehiclePlate(get().vehiclePlate)
      if (!plateNormalized) {
        set({ isTyping: false })
        get().addMessage({
          role: 'assistant',
          content: '❌ Please enter your **vehicle plate** before confirming.',
          error: true,
        })
        return
      }
      const res = await apiCreateReservation({
        parkingSlotId: slot.id,
        vehiclePlate: plateNormalized,
        startTime: toLocalApiDateTime(start),
        endTime: toLocalApiDateTime(end),
      })
      const r = res?.data
      let bal = get().walletBalance
      try {
        const w = await apiGetWalletBalance()
        bal = w?.data?.balance ?? bal
      } catch {
        /* ignore */
      }

      const costStr =
        r?.totalPrice === Math.round(r?.totalPrice)
          ? `${Math.round(r.totalPrice)}`
          : `${r?.totalPrice}`
      const balStr =
        bal === Math.round(bal) ? `${Math.round(bal)}` : `${bal}`

      get().addMessage({
        role: 'assistant',
        content:
          `✅ Reservation booked & paid!\n\n` +
          `📍 ${r?.parkingName}\n` +
          `🅿️ Slot ${r?.slotNumber}\n` +
          `🕐 ${fmtTime(start)} → ${fmtTime(end)}\n` +
          `💰 ${costStr} MAD deducted from wallet\n` +
          `💳 Remaining balance: ${balStr} MAD\n\n` +
          `Have a great parking experience! 🚗`,
      })

      const chatIds = r?.guardChatIds
      const hasGuardChats = Array.isArray(chatIds) && chatIds.length > 0
      if (hasGuardChats) {
        get().addMessage({
          role: 'assistant',
          content:
            'Need help with directions, access, or anything else? Don’t hesitate to contact the guard assigned to this parking.',
          type: 'guardChatCta',
          metadata: {
            chatId: chatIds[0],
            parkingName: r?.parkingName ?? '',
          },
        })
      } else {
        get().addMessage({
          role: 'assistant',
          content:
            'If you need help later, open **Guard chats** from the menu — we’ll connect you when a guard is available for your lot.',
        })
      }

      get().resetBooking()
    } catch (e) {
      const data = e?.response?.data
      const msg =
        (typeof data === 'string' ? data : data?.message) ||
        e?.message ||
        ''
      let text = msg || 'Could not create reservation.'
      if (msg.toLowerCase().includes('insufficient')) {
        text = 'Insufficient wallet balance. Please top up first.'
      } else if (
        msg.toLowerCase().includes('not available') ||
        msg.toLowerCase().includes('already reserved')
      ) {
        text = 'This slot is no longer available for that time. Try another slot or parking.'
      }
      get().addMessage({ role: 'assistant', content: `⚠️ ${text}`, error: true })
      get().resetBooking()
    } finally {
      set({ isTyping: false })
    }
  },

  cancelBooking: () => {
    get().addMessage({ role: 'user', content: 'Cancel' })
    get().addMessage({
      role: 'assistant',
      content: 'No problem! Let me know if you need anything else. 😊',
    })
    get().resetBooking()
  },
}))

export default useChatStore
