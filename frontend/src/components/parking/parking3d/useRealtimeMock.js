/**
 * parking3d/useRealtimeMock.js
 * Simulates real-time slot status changes when no backend SSE/WS endpoint is available.
 * Enable with NEXT_PUBLIC_MOCK_REALTIME=true in .env.local
 */
import { useEffect, useRef } from 'react'
import useParkingStore from './store'

const MIN_INTERVAL = 3000
const MAX_INTERVAL = 8000

function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

export default function useRealtimeMock(enabled = false) {
    const timerRef = useRef(null)
    const slots = useParkingStore(s => s.slots)
    const patchSlot = useParkingStore(s => s.patchSlot)
    const connectionStatus = useParkingStore(s => s.connectionStatus)

    useEffect(() => {
        // Only enable mock if explicitly opted in AND we're not on a live SSE/WS connection
        const shouldMock =
            enabled &&
            process.env.NEXT_PUBLIC_MOCK_REALTIME === 'true' &&
            connectionStatus !== 'sse' &&
            connectionStatus !== 'ws'

        if (!shouldMock || slots.length === 0) {
            if (timerRef.current) clearTimeout(timerRef.current)
            return
        }

        const tick = () => {
            const slot = slots[Math.floor(Math.random() * slots.length)]
            if (!slot) return

            // Toggle between available and occupied
            const current = slot.status
            let next
            if (current === 'AVAILABLE') {
                next = Math.random() > 0.3 ? 'OCCUPIED' : 'RESERVED'
            } else if (current === 'OCCUPIED' || current === 'RESERVED') {
                next = 'AVAILABLE'
            } else {
                next = current // don't touch MAINTENANCE
            }

            if (next !== current) {
                patchSlot(slot.id, { status: next })
            }

            timerRef.current = setTimeout(tick, randomBetween(MIN_INTERVAL, MAX_INTERVAL))
        }

        timerRef.current = setTimeout(tick, randomBetween(MIN_INTERVAL, MAX_INTERVAL))

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current)
        }
    }, [enabled, slots.length, connectionStatus])
}


