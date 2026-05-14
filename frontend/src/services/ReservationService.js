import ApiService from './ApiService'

export async function apiCreateReservation(data) {
    return ApiService.fetchDataWithAxios({
        url: '/reservations',
        method: 'post',
        data,
    })
}

export async function apiGetReservationById(id) {
    return ApiService.fetchDataWithAxios({
        url: `/reservations/${id}`,
        method: 'get',
    })
}

export async function apiGetMyReservations() {
    return ApiService.fetchDataWithAxios({
        url: '/reservations/my-reservations',
        method: 'get',
    })
}

export async function apiCancelReservation(id) {
    return ApiService.fetchDataWithAxios({
        url: `/reservations/${id}/cancel`,
        method: 'put',
    })
}

export async function apiGetReservationQr(id) {
    return ApiService.fetchDataWithAxios({
        url: `/reservations/${id}/qr`,
        method: 'get',
    })
}

