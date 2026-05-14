import ApiService from './ApiService'

export async function apiGetWalletBalance() {
    return ApiService.fetchDataWithAxios({
        url: '/wallet/balance',
        method: 'get',
    })
}

export async function apiTopUpWallet(data) {
    return ApiService.fetchDataWithAxios({
        url: '/wallet/top-up',
        method: 'post',
        data,
    })
}

export async function apiPayWithWallet(data) {
    return ApiService.fetchDataWithAxios({
        url: '/wallet/pay',
        method: 'post',
        data,
    })
}

export async function apiGetWalletTransactions() {
    return ApiService.fetchDataWithAxios({
        url: '/wallet/transactions',
        method: 'get',
    })
}

