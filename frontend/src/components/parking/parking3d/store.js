/**
 * parking3d/store.js
 * Zustand store for 3D parking state — slots, camera, UI, real-time sync.
 */
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { apiGetSlotsByParking } from '@/services/ParkingSlotService'
import appConfig from '@/configs/app.config'

const MAX_HISTORY = 60

const useParkingStore = create(
    subscribeWithSelector((set, get) => ({
        /* ── Slot data ─────────────────────────────────────────── */
        slots: [],
        slotsMap: {},
        floors: [],
        activeFloor: null,
        floorSlots: [],

        /* ── Interaction state ─────────────────────────────────── */
        hoveredSlotId: null,
        selectedSlotId: null,
        selectedSlot: null,
        focusTarget: null,

        /* ── UI state ──────────────────────────────────────────── */
        infoPanelOpen: false,
        loading: true,
        error: null,

        /* ── Filter & view state ───────────────────────────────── */
        filterStatus: 'ALL',
        showLabels: true,
        cameraMode: 'orbit',

        /* ── Real-time connection ──────────────────────────────── */
        connectionStatus: 'disconnected',
        _eventSource: null,
        _pollingInterval: null,

        /* ── Occupancy history (for sparkline) ─────────────────── */
        occupancyHistory: [],

        /* ── Parking info ──────────────────────────────────────── */
        parking: null,

        /* ── Actions ───────────────────────────────────────────── */

        setParking: (parking) => set({ parking }),

        loadSlots: async (parkingId) => {
            set({ loading: true, error: null })
            try {
                const res = await apiGetSlotsByParking(parkingId)
                const allSlots = res?.data || []
                const slotsMap = {}
                allSlots.forEach(s => { slotsMap[s.id] = s })

                const floors = [...new Set(allSlots.map(s => s.floor || 'Ground'))].sort()
                const activeFloor = floors[0] || null
                const floorSlots = allSlots.filter(s => (s.floor || 'Ground') === activeFloor)

                const occupied = allSlots.filter(s => s.status === 'OCCUPIED' || s.status === 'RESERVED').length
                const rate = allSlots.length > 0 ? Math.round((occupied / allSlots.length) * 100) : 0

                set({
                    slots: allSlots,
                    slotsMap,
                    floors,
                    activeFloor,
                    floorSlots,
                    loading: false,
                    occupancyHistory: [{ time: Date.now(), rate }],
                })
            } catch (err) {
                set({ error: err?.message || 'Failed to load slots', loading: false })
            }
        },

        setActiveFloor: (floor) => {
            const { slots } = get()
            const floorSlots = slots.filter(s => (s.floor || 'Ground') === floor)
            set({
                activeFloor: floor,
                floorSlots,
                selectedSlotId: null,
                selectedSlot: null,
                hoveredSlotId: null,
                infoPanelOpen: false,
                focusTarget: null,
                cameraMode: 'orbit',
            })
        },

        hoverSlot: (id) => set({ hoveredSlotId: id }),
        unhoverSlot: () => set({ hoveredSlotId: null }),

        selectSlot: (id) => {
            const { slotsMap } = get()
            const slot = slotsMap[id] || null
            set({ selectedSlotId: id, selectedSlot: slot, infoPanelOpen: !!slot })
        },

        deselectSlot: () => set({
            selectedSlotId: null,
            selectedSlot: null,
            infoPanelOpen: false,
            focusTarget: null,
        }),

        setFocusTarget: (target) => set({ focusTarget: target }),

        setFilterStatus: (status) => set({ filterStatus: status }),
        setShowLabels: (val) => set({ showLabels: val }),
        setCameraMode: (mode) => set({ cameraMode: mode }),

        /* ── Real-time update: patch a single slot without re-fetching all ── */
        patchSlot: (id, updates) => {
            const { slotsMap, slots, activeFloor, selectedSlotId, occupancyHistory } = get()
            if (!slotsMap[id]) return
            const updated = { ...slotsMap[id], ...updates }
            const newMap = { ...slotsMap, [id]: updated }
            const newSlots = slots.map(s => s.id === id ? updated : s)
            const floorSlots = newSlots.filter(s => (s.floor || 'Ground') === activeFloor)

            const occupied = newSlots.filter(s => s.status === 'OCCUPIED' || s.status === 'RESERVED').length
            const rate = newSlots.length > 0 ? Math.round((occupied / newSlots.length) * 100) : 0
            const newHistory = [...occupancyHistory, { time: Date.now(), rate }].slice(-MAX_HISTORY)

            const patch = { slotsMap: newMap, slots: newSlots, floorSlots, occupancyHistory: newHistory }
            if (selectedSlotId === id) {
                patch.selectedSlot = updated
            }
            set(patch)
        },

        /* ── Bulk refresh (polling fallback) ─────────────────── */
        refreshSlots: async (parkingId) => {
            try {
                const res = await apiGetSlotsByParking(parkingId)
                const allSlots = res?.data || []
                const slotsMap = {}
                allSlots.forEach(s => { slotsMap[s.id] = s })
                const { activeFloor, occupancyHistory, selectedSlotId } = get()
                const floorSlots = allSlots.filter(s => (s.floor || 'Ground') === activeFloor)

                const occupied = allSlots.filter(s => s.status === 'OCCUPIED' || s.status === 'RESERVED').length
                const rate = allSlots.length > 0 ? Math.round((occupied / allSlots.length) * 100) : 0
                const newHistory = [...occupancyHistory, { time: Date.now(), rate }].slice(-MAX_HISTORY)

                const patch = { slots: allSlots, slotsMap, floorSlots, occupancyHistory: newHistory }
                if (selectedSlotId && slotsMap[selectedSlotId]) {
                    patch.selectedSlot = slotsMap[selectedSlotId]
                }
                set(patch)
            } catch (_) { /* silent */ }
        },

        /* ── Real-time connection management ─────────────────── */
        connectRealtime: (parkingId) => {
            const { _eventSource, _pollingInterval } = get()
            if (_eventSource) _eventSource.close()
            if (_pollingInterval) clearInterval(_pollingInterval)

            // Try SSE first
            try {
                const es = new EventSource(`${appConfig.apiPrefix}/parkings/${parkingId}/events`)
                es.onopen = () => set({ connectionStatus: 'sse' })
                es.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data)
                        if (data.slotId && data.status) {
                            get().patchSlot(data.slotId, { status: data.status })
                        }
                    } catch (_) {}
                }
                es.onerror = () => {
                    es.close()
                    get()._startPolling(parkingId)
                }
                set({ _eventSource: es })
            } catch (_) {
                get()._startPolling(parkingId)
            }
        },

        _startPolling: (parkingId) => {
            const { _pollingInterval } = get()
            if (_pollingInterval) clearInterval(_pollingInterval)
            const interval = setInterval(() => get().refreshSlots(parkingId), 15000)
            set({ _pollingInterval: interval, connectionStatus: 'polling', _eventSource: null })
        },

        disconnectRealtime: () => {
            const { _eventSource, _pollingInterval } = get()
            if (_eventSource) _eventSource.close()
            if (_pollingInterval) clearInterval(_pollingInterval)
            set({ _eventSource: null, _pollingInterval: null, connectionStatus: 'disconnected' })
        },
    })),
)

export default useParkingStore

