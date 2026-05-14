'use client'
import { useQuery } from '@tanstack/react-query'
import { apiGetMyPayments } from '@/services/PaymentService'

export const PAYMENTS_KEY = ['my-payments']

export function useMyPayments() {
    return useQuery({
        queryKey: PAYMENTS_KEY,
        queryFn: async () => {
            const res = await apiGetMyPayments()
            return res?.data || []
        },
        refetchOnWindowFocus: true,
        staleTime: 30_000,
    })
}
