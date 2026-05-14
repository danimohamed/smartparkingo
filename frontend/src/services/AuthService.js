import ApiService from './ApiService'

export async function apiSignUp(data) {
    const url = data.role === 'PARKING_OWNER' ? '/auth/register-owner' : '/auth/register'
    return ApiService.fetchDataWithAxios({
        url,
        method: 'post',
        data: {
            fullName: data.fullName,
            email: data.email,
            password: data.password,
            phone: data.phone || null,
        },
    })
}

export async function apiForgotPassword(data) {
    return ApiService.fetchDataWithAxios({
        url: '/auth/forgot-password',
        method: 'post',
        data,
    })
}

export async function apiResetPassword(data) {
    return ApiService.fetchDataWithAxios({
        url: '/auth/reset-password',
        method: 'post',
        data,
    })
}
