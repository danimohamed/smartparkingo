import ApiService from './ApiService'

// ─── Dashboard & Earnings ───────────────────────────
export async function apiGetOwnerDashboard() {
    return ApiService.fetchDataWithAxios({
        url: '/owner/dashboard',
        method: 'get',
    })
}

export async function apiGetOwnerEarnings() {
    return ApiService.fetchDataWithAxios({
        url: '/owner/earnings',
        method: 'get',
    })
}

// ─── Parking Management ─────────────────────────────
export async function apiGetOwnerParkings() {
    return ApiService.fetchDataWithAxios({
        url: '/owner/parkings',
        method: 'get',
    })
}

export async function apiGetOwnerParkingById(parkingId) {
    return ApiService.fetchDataWithAxios({
        url: `/owner/parkings/${parkingId}`,
        method: 'get',
    })
}

export async function apiCreateOwnerParking(data) {
    return ApiService.fetchDataWithAxios({
        url: '/owner/parkings',
        method: 'post',
        data,
    })
}

export async function apiUpdateOwnerParking(parkingId, data) {
    return ApiService.fetchDataWithAxios({
        url: `/owner/parkings/${parkingId}`,
        method: 'put',
        data,
    })
}

export async function apiDeleteOwnerParking(parkingId) {
    return ApiService.fetchDataWithAxios({
        url: `/owner/parkings/${parkingId}`,
        method: 'delete',
    })
}

export async function apiGetOwnerGuardCandidates() {
    return ApiService.fetchDataWithAxios({
        url: '/owner/guard-candidates',
        method: 'get',
    })
}

export async function apiSetOwnerParkingGuards(parkingId, data) {
    return ApiService.fetchDataWithAxios({
        url: `/owner/parkings/${parkingId}/guards`,
        method: 'put',
        data,
    })
}

// ─── Slot Management ────────────────────────────────
export async function apiGetOwnerSlots(parkingId) {
    return ApiService.fetchDataWithAxios({
        url: `/owner/parkings/${parkingId}/slots`,
        method: 'get',
    })
}

export async function apiAddOwnerSlot(parkingId, data) {
    return ApiService.fetchDataWithAxios({
        url: `/owner/parkings/${parkingId}/slots`,
        method: 'post',
        data,
    })
}

export async function apiUpdateOwnerSlot(slotId, data) {
    return ApiService.fetchDataWithAxios({
        url: `/owner/slots/${slotId}`,
        method: 'put',
        data,
    })
}

export async function apiDeleteOwnerSlot(slotId) {
    return ApiService.fetchDataWithAxios({
        url: `/owner/slots/${slotId}`,
        method: 'delete',
    })
}

// ─── Reservations ───────────────────────────────────
export async function apiGetOwnerReservations() {
    return ApiService.fetchDataWithAxios({
        url: '/owner/reservations',
        method: 'get',
    })
}

// ─── Withdrawals ────────────────────────────────────
export async function apiRequestWithdrawal(data) {
    return ApiService.fetchDataWithAxios({
        url: '/owner/withdrawals',
        method: 'post',
        data,
    })
}

export async function apiGetOwnerWithdrawals() {
    return ApiService.fetchDataWithAxios({
        url: '/owner/withdrawals',
        method: 'get',
    })
}
