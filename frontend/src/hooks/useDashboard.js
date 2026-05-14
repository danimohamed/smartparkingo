'use client'
import { useQuery } from '@tanstack/react-query'
import { apiGetActiveParkings } from '@/services/ParkingService'
import { apiGetMyReservations } from '@/services/ReservationService'
import { apiGetMyPayments } from '@/services/PaymentService'
import { apiGetWalletBalance, apiGetWalletTransactions } from '@/services/WalletService'

const DASHBOARD_KEY = 'dashboard'

export function useDashboardData() {
    return useQuery({
        queryKey: [DASHBOARD_KEY],
        queryFn: async () => {
            const [parkingsRes, reservationsRes, paymentsRes, walletRes, txRes] =
                await Promise.all([
                    apiGetActiveParkings().catch(() => ({ data: [] })),
                    apiGetMyReservations().catch(() => ({ data: [] })),
                    apiGetMyPayments().catch(() => ({ data: [] })),
                    apiGetWalletBalance().catch(() => ({ data: { balance: 0 } })),
                    apiGetWalletTransactions().catch(() => ({ data: [] })),
                ])

            return {
                parkings: parkingsRes?.data || [],
                reservations: reservationsRes?.data || [],
                payments: paymentsRes?.data || [],
                walletBalance: walletRes?.data?.balance ?? 0,
                transactions: txRes?.data || [],
            }
        },
        staleTime: 30 * 1000,
        refetchOnWindowFocus: true,
    })
}
