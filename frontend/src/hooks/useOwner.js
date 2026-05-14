'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    apiGetOwnerDashboard,
    apiGetOwnerEarnings,
    apiGetOwnerParkings,
    apiGetOwnerParkingById,
    apiCreateOwnerParking,
    apiUpdateOwnerParking,
    apiDeleteOwnerParking,
    apiGetOwnerGuardCandidates,
    apiSetOwnerParkingGuards,
    apiGetOwnerSlots,
    apiAddOwnerSlot,
    apiUpdateOwnerSlot,
    apiDeleteOwnerSlot,
    apiGetOwnerReservations,
    apiRequestWithdrawal,
    apiGetOwnerWithdrawals,
} from '@/services/OwnerService'

const OWNER_KEYS = {
    dashboard: ['owner', 'dashboard'],
    earnings: ['owner', 'earnings'],
    parkings: ['owner', 'parkings'],
    parking: (id) => ['owner', 'parkings', id],
    guardCandidates: ['owner', 'guard-candidates'],
    slots: (parkingId) => ['owner', 'slots', parkingId],
    reservations: ['owner', 'reservations'],
    withdrawals: ['owner', 'withdrawals'],
}

export function useOwnerDashboard() {
    return useQuery({
        queryKey: OWNER_KEYS.dashboard,
        queryFn: async () => {
            const res = await apiGetOwnerDashboard()
            return res?.data || {}
        },
        staleTime: 30_000,
    })
}

export function useOwnerEarnings() {
    return useQuery({
        queryKey: OWNER_KEYS.earnings,
        queryFn: async () => {
            const res = await apiGetOwnerEarnings()
            return res?.data || {}
        },
        staleTime: 30_000,
    })
}

export function useOwnerParkings() {
    return useQuery({
        queryKey: OWNER_KEYS.parkings,
        queryFn: async () => {
            const res = await apiGetOwnerParkings()
            return res?.data || []
        },
        staleTime: 30_000,
    })
}

export function useOwnerParkingById(parkingId) {
    return useQuery({
        queryKey: OWNER_KEYS.parking(parkingId),
        queryFn: async () => {
            const res = await apiGetOwnerParkingById(parkingId)
            return res?.data || null
        },
        enabled: !!parkingId,
    })
}

export function useCreateParking() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: apiCreateOwnerParking,
        onSuccess: () => qc.invalidateQueries({ queryKey: OWNER_KEYS.parkings }),
    })
}

export function useUpdateParking() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ parkingId, data }) => apiUpdateOwnerParking(parkingId, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: OWNER_KEYS.parkings }),
    })
}

export function useDeleteParking() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: apiDeleteOwnerParking,
        onSuccess: () => qc.invalidateQueries({ queryKey: OWNER_KEYS.parkings }),
    })
}

export function useOwnerGuardCandidates(enabled = true) {
    return useQuery({
        queryKey: OWNER_KEYS.guardCandidates,
        queryFn: async () => {
            const res = await apiGetOwnerGuardCandidates()
            return res?.data || []
        },
        enabled,
        staleTime: 60_000,
    })
}

export function useAssignParkingGuards() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ parkingId, guardUserIds }) =>
            apiSetOwnerParkingGuards(parkingId, { guardUserIds }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: OWNER_KEYS.parkings })
        },
    })
}

export function useOwnerSlots(parkingId) {
    return useQuery({
        queryKey: OWNER_KEYS.slots(parkingId),
        queryFn: async () => {
            const res = await apiGetOwnerSlots(parkingId)
            return res?.data || []
        },
        enabled: !!parkingId,
        staleTime: 30_000,
    })
}

export function useAddSlot() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ parkingId, data }) => apiAddOwnerSlot(parkingId, data),
        onSuccess: (_, { parkingId }) =>
            qc.invalidateQueries({ queryKey: OWNER_KEYS.slots(parkingId) }),
    })
}

export function useUpdateSlot() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ slotId, data }) => apiUpdateOwnerSlot(slotId, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['owner', 'slots'] }),
    })
}

export function useDeleteSlot() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: apiDeleteOwnerSlot,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['owner', 'slots'] }),
    })
}

export function useOwnerReservations() {
    return useQuery({
        queryKey: OWNER_KEYS.reservations,
        queryFn: async () => {
            const res = await apiGetOwnerReservations()
            return res?.data || []
        },
        staleTime: 30_000,
    })
}

export function useOwnerWithdrawals() {
    return useQuery({
        queryKey: OWNER_KEYS.withdrawals,
        queryFn: async () => {
            const res = await apiGetOwnerWithdrawals()
            return res?.data || []
        },
        staleTime: 30_000,
    })
}

export function useRequestWithdrawal() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: apiRequestWithdrawal,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: OWNER_KEYS.withdrawals })
            qc.invalidateQueries({ queryKey: OWNER_KEYS.earnings })
            qc.invalidateQueries({ queryKey: OWNER_KEYS.dashboard })
        },
    })
}
