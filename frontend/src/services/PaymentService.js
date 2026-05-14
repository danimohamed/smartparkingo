import ApiService from './ApiService'

export async function apiGetPaymentByReservation(reservationId) {
    return ApiService.fetchDataWithAxios({
        url: `/payments/reservation/${reservationId}`,
        method: 'get',
    })
}

export async function apiGetMyPayments() {
    return ApiService.fetchDataWithAxios({
        url: '/payments/my-payments',
        method: 'get',
    })
}

