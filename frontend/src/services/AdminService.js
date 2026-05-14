import ApiService from './ApiService'

export async function apiGetDashboard() {
    return ApiService.fetchDataWithAxios({
        url: '/admin/dashboard',
        method: 'get',
    })
}

export async function apiGetAllUsers() {
    return ApiService.fetchDataWithAxios({
        url: '/admin/users',
        method: 'get',
    })
}

export async function apiDeleteUser(id) {
    return ApiService.fetchDataWithAxios({
        url: `/admin/users/${id}`,
        method: 'delete',
    })
}

export async function apiChangeUserRole(id, data) {
    return ApiService.fetchDataWithAxios({
        url: `/admin/users/${id}/role`,
        method: 'put',
        data,
    })
}

export async function apiGetAllReservations() {
    return ApiService.fetchDataWithAxios({
        url: '/admin/reservations',
        method: 'get',
    })
}

export async function apiAdminCancelReservation(id) {
    return ApiService.fetchDataWithAxios({
        url: `/admin/reservations/${id}/cancel`,
        method: 'put',
    })
}

export async function apiGetAllPayments() {
    return ApiService.fetchDataWithAxios({
        url: '/admin/payments',
        method: 'get',
    })
}

export async function apiGetAllWallets() {
    return ApiService.fetchDataWithAxios({
        url: '/admin/wallets',
        method: 'get',
    })
}

export async function apiGetWalletTransactionsByUser(userId) {
    return ApiService.fetchDataWithAxios({
        url: `/admin/wallets/${userId}/transactions`,
        method: 'get',
    })
}

// ─── Reports / Analytics ──────────────────────────
export async function apiGetReportsData(params) {
    return ApiService.fetchDataWithAxios({
        url: '/admin/dashboard',
        method: 'get',
        params,
    })
}

// ─── User Detail (reservations + payments) ────────
export async function apiGetUserReservations(userId) {
    return ApiService.fetchDataWithAxios({
        url: `/admin/users/${userId}/reservations`,
        method: 'get',
    })
}

export async function apiGetUserPayments(userId) {
    return ApiService.fetchDataWithAxios({
        url: `/admin/users/${userId}/payments`,
        method: 'get',
    })
}

// ─── Refund Payment ───────────────────────────────
export async function apiRefundPayment(paymentId) {
    return ApiService.fetchDataWithAxios({
        url: `/admin/payments/${paymentId}/refund`,
        method: 'put',
    })
}

// ─── Settings ─────────────────────────────────────
export async function apiGetSettings() {
    // Settings are stored locally until backend endpoint exists
    const settings = typeof window !== 'undefined' ? localStorage.getItem('admin_settings') : null
    return { data: settings ? JSON.parse(settings) : null }
}

export async function apiSaveSettings(data) {
    if (typeof window !== 'undefined') {
        localStorage.setItem('admin_settings', JSON.stringify(data))
    }
    return { data }
}

