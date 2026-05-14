import ApiService from './ApiService'

export async function apiGetNavigationRoute(userLat, userLng, parkingLat, parkingLng) {
    return ApiService.fetchDataWithAxios({
        url: '/navigation/route',
        method: 'get',
        params: { userLat, userLng, parkingLat, parkingLng },
    })
}
