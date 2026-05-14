import ApiService from './ApiService'

export async function apiGuardValidateEntry(qrPayload) {
    return ApiService.fetchDataWithAxios({
        url: '/guard/validate-entry',
        method: 'post',
        data: { qrPayload },
    })
}

export async function apiGuardValidateExit(qrPayload) {
    return ApiService.fetchDataWithAxios({
        url: '/guard/validate-exit',
        method: 'post',
        data: { qrPayload },
    })
}

export async function apiGuardValidateEntryManual(reservationId) {
    return ApiService.fetchDataWithAxios({
        url: '/guard/validate-entry-manual',
        method: 'post',
        data: { reservationId },
    })
}

export async function apiGuardValidateExitManual(reservationId) {
    return ApiService.fetchDataWithAxios({
        url: '/guard/validate-exit-manual',
        method: 'post',
        data: { reservationId },
    })
}

export async function apiGuardActiveBookings(parkingId) {
    return ApiService.fetchDataWithAxios({
        url: `/guard/parking/${parkingId}/active-bookings`,
        method: 'get',
    })
}

export async function apiGuardGetTodayPlateScanStats(parkingId) {
    return ApiService.fetchDataWithAxios({
        url: `/guard/parking/${parkingId}/plate-scan-stats/today`,
        method: 'get',
    })
}

export async function apiGuardPlateScan({ parkingId, file }) {
    const formData = new FormData()
    formData.append('parkingId', String(parkingId))
    formData.append('file', file)

    return ApiService.fetchDataWithAxios({
        url: '/guard/plate/scan',
        method: 'post',
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
    })
}

export async function apiGuardManualOccupy(slotId) {
    return ApiService.fetchDataWithAxios({
        url: `/guard/slots/${slotId}/manual-occupy`,
        method: 'post',
    })
}

export async function apiGuardManualFree(slotId) {
    return ApiService.fetchDataWithAxios({
        url: `/guard/slots/${slotId}/manual-free`,
        method: 'post',
    })
}
