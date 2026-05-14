'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    apiGetWalletBalance,
    apiTopUpWallet,
    apiPayWithWallet,
    apiGetWalletTransactions,
} from '@/services/WalletService'

export const WALLET_KEY = ['my-wallet']
export const WALLET_TX_KEY = ['my-wallet-transactions']

export function useWalletBalance() {
    return useQuery({
        queryKey: WALLET_KEY,
        queryFn: async () => {
            const res = await apiGetWalletBalance()
            return res?.data || { balance: 0 }
        },
        refetchOnWindowFocus: true,
        staleTime: 15_000,
    })
}

export function useWalletTransactions() {
    return useQuery({
        queryKey: WALLET_TX_KEY,
        queryFn: async () => {
            const res = await apiGetWalletTransactions()
            return res?.data || []
        },
        refetchOnWindowFocus: true,
        staleTime: 30_000,
    })
}

export function useTopUpWallet() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (data) => apiTopUpWallet(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: WALLET_KEY })
            queryClient.invalidateQueries({ queryKey: WALLET_TX_KEY })
        },
    })
}

export function usePayWithWallet() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (data) => apiPayWithWallet(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: WALLET_KEY })
            queryClient.invalidateQueries({ queryKey: WALLET_TX_KEY })
            queryClient.invalidateQueries({ queryKey: ['my-reservations'] })
            queryClient.invalidateQueries({ queryKey: ['my-payments'] })
        },
    })
}
