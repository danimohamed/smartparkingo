'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGetMyReservations, apiCancelReservation } from '@/services/ReservationService'

export const RESERVATIONS_KEY = ['my-reservations']

export function useMyReservations() {
    return useQuery({
        queryKey: RESERVATIONS_KEY,
        queryFn: async () => {
            const res = await apiGetMyReservations()
            return res?.data || []
        },
        refetchOnWindowFocus: true,
        refetchInterval: 30_000,
        staleTime: 15_000,
    })
}

export function useCancelReservation() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id) => apiCancelReservation(id),
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: RESERVATIONS_KEY })
            const previous = queryClient.getQueryData(RESERVATIONS_KEY)
            queryClient.setQueryData(RESERVATIONS_KEY, (old) =>
                old?.map((r) =>
                    r.id === id ? { ...r, status: 'CANCELLED' } : r,
                ),
            )
            return { previous }
        },
        onError: (_err, _id, context) => {
            queryClient.setQueryData(RESERVATIONS_KEY, context?.previous)
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: RESERVATIONS_KEY })
        },
    })
}
