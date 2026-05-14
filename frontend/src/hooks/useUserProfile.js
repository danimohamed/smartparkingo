'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    apiGetCurrentUser,
    apiUpdateProfile,
    apiUpdateDefaultVehiclePlate,
    apiChangePassword,
} from '@/services/UserService'

export const USER_PROFILE_KEY = ['user-profile']

export function useUserProfile() {
    return useQuery({
        queryKey: USER_PROFILE_KEY,
        queryFn: async () => {
            const res = await apiGetCurrentUser()
            return res?.data || null
        },
        staleTime: 30_000,
        refetchOnWindowFocus: true,
    })
}

export function useUpdateProfile() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (data) => apiUpdateProfile(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: USER_PROFILE_KEY })
        },
    })
}

export function useUpdateDefaultVehiclePlate() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (data) => apiUpdateDefaultVehiclePlate(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: USER_PROFILE_KEY })
        },
    })
}

export function useChangePassword() {
    return useMutation({
        mutationFn: (data) => apiChangePassword(data),
    })
}
