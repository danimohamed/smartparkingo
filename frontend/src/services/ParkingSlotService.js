import ApiService from './ApiService'

export async function apiGetSlotById(id) {
    return ApiService.fetchDataWithAxios({
        url: `/parking-slots/${id}`,
        method: 'get',
    })
}

export async function apiGetSlotsByParking(parkingId) {
    return ApiService.fetchDataWithAxios({
        url: `/parking-slots/parking/${parkingId}`,
        method: 'get',
    })
}

export async function apiGetAvailableSlots(parkingId) {
    return ApiService.fetchDataWithAxios({
        url: `/parking-slots/available/${parkingId}`,
        method: 'get',
    })
}

export async function apiCreateSlot(data) {
    return ApiService.fetchDataWithAxios({
        url: '/parking-slots',
        method: 'post',
        data,
    })
}

export async function apiUpdateSlot(id, data) {
    return ApiService.fetchDataWithAxios({
        url: `/parking-slots/${id}`,
        method: 'put',
        data,
    })
}

export async function apiDeleteSlot(id) {
    return ApiService.fetchDataWithAxios({
        url: `/parking-slots/${id}`,
        method: 'delete',
    })
}

