import ApiService from './ApiService'

export async function apiGetCurrentUser() {
    return ApiService.fetchDataWithAxios({
        url: '/users/me',
        method: 'get',
    })
}

export async function apiUpdateProfile(data) {
    return ApiService.fetchDataWithAxios({
        url: '/users/me',
        method: 'put',
        data,
    })
}

export async function apiUpdateDefaultVehiclePlate(data) {
    return ApiService.fetchDataWithAxios({
        url: '/users/me/default-vehicle-plate',
        method: 'put',
        data,
    })
}

export async function apiChangePassword(data) {
    return ApiService.fetchDataWithAxios({
        url: '/users/me/password',
        method: 'put',
        data,
    })
}
