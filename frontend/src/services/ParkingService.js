import ApiService from './ApiService'

export async function apiGetAllParkings() {
    return ApiService.fetchDataWithAxios({
        url: '/parkings',
        method: 'get',
    })
}

export async function apiGetParkingById(id) {
    return ApiService.fetchDataWithAxios({
        url: `/parkings/${id}`,
        method: 'get',
    })
}

export async function apiRateParking(parkingId, rating) {
    return ApiService.fetchDataWithAxios({
        url: `/parkings/${parkingId}/rating`,
        method: 'post',
        data: { rating },
    })
}

export async function apiGetActiveParkings() {
    return ApiService.fetchDataWithAxios({
        url: '/parkings/active',
        method: 'get',
    })
}

export async function apiSearchParkings(name) {
    return ApiService.fetchDataWithAxios({
        url: '/parkings/search',
        method: 'get',
        params: { name },
    })
}

export async function apiCreateParking(data) {
    return ApiService.fetchDataWithAxios({
        url: '/parkings',
        method: 'post',
        data,
    })
}

export async function apiUpdateParking(id, data) {
    return ApiService.fetchDataWithAxios({
        url: `/parkings/${id}`,
        method: 'put',
        data,
    })
}

export async function apiDeleteParking(id) {
    return ApiService.fetchDataWithAxios({
        url: `/parkings/${id}`,
        method: 'delete',
    })
}

