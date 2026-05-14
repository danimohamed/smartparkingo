import ApiService from './ApiService'

export async function apiListGuardChats() {
    return ApiService.fetchDataWithAxios({
        url: '/chats',
        method: 'get',
    })
}

export async function apiGetGuardChatMessages(chatId) {
    return ApiService.fetchDataWithAxios({
        url: `/chats/${chatId}/messages`,
        method: 'get',
    })
}

export async function apiSendGuardChatMessage(chatId, body) {
    return ApiService.fetchDataWithAxios({
        url: `/chats/${chatId}/messages`,
        method: 'post',
        data: { body },
    })
}
