import authRoute from './authRoute'

export const protectedRoutes = {
    '/home': {
        key: 'home',
        authority: [],
        meta: {
            pageBackgroundType: 'plain',
            pageContainerType: 'contained',
        },
    },
    '/parkings': {
        key: 'parkings',
        authority: [],
        meta: {
            pageBackgroundType: 'plain',
            pageContainerType: 'contained',
        },
    },
    '/parking-map': {
        key: 'parkingMap',
        authority: [],
        meta: {
            pageBackgroundType: 'plain',
            pageContainerType: 'gutterless',
            footer: false,
        },
    },
    '/parkings/[id]': {
        key: 'parkingDetail',
        authority: [],
        dynamicRoute: true,
        meta: {
            pageBackgroundType: 'plain',
            pageContainerType: 'contained',
        },
    },
    '/parkings/[id]/3d-twin': {
        key: 'parking3dTwin',
        authority: [],
        dynamicRoute: true,
        meta: {
            pageBackgroundType: 'plain',
            pageContainerType: 'gutterless',
            footer: false,
        },
    },
    '/my-reservations': {
        key: 'myReservations',
        authority: [],
        meta: {
            pageBackgroundType: 'plain',
            pageContainerType: 'contained',
        },
    },
    '/messages': {
        key: 'messages',
        authority: [],
        meta: {
            pageBackgroundType: 'plain',
            pageContainerType: 'contained',
        },
    },
    '/my-payments': {
        key: 'myPayments',
        authority: [],
        meta: {
            pageBackgroundType: 'plain',
            pageContainerType: 'contained',
        },
    },
    '/my-wallet': {
        key: 'myWallet',
        authority: [],
        meta: {
            pageBackgroundType: 'plain',
            pageContainerType: 'contained',
        },
    },
    '/profile': {
        key: 'profile',
        authority: [],
        meta: {
            pageBackgroundType: 'plain',
            pageContainerType: 'contained',
        },
    },
    '/admin/dashboard': {
        key: 'adminDashboard',
        authority: ['admin'],
        meta: {
            pageBackgroundType: 'plain',
            pageContainerType: 'contained',
        },
    },
    '/admin/users': {
        key: 'adminUsers',
        authority: ['admin'],
        meta: {
            pageBackgroundType: 'plain',
            pageContainerType: 'contained',
        },
    },
    '/admin/reservations': {
        key: 'adminReservations',
        authority: ['admin'],
        meta: {
            pageBackgroundType: 'plain',
            pageContainerType: 'contained',
        },
    },
    '/admin/payments': {
        key: 'adminPayments',
        authority: ['admin'],
        meta: {
            pageBackgroundType: 'plain',
            pageContainerType: 'contained',
        },
    },
    '/admin/parkings': {
        key: 'adminParkings',
        authority: ['admin'],
        meta: {
            pageBackgroundType: 'plain',
            pageContainerType: 'contained',
        },
    },
    '/admin/parking-slots': {
        key: 'adminParkingSlots',
        authority: ['admin'],
        meta: {
            pageBackgroundType: 'plain',
            pageContainerType: 'contained',
        },
    },
    '/admin/wallets': {
        key: 'adminWallets',
        authority: ['admin'],
        meta: {
            pageBackgroundType: 'plain',
            pageContainerType: 'contained',
        },
    },
    '/owner/dashboard': {
        key: 'ownerDashboard',
        authority: ['parking_owner', 'admin'],
        meta: {
            pageBackgroundType: 'plain',
            pageContainerType: 'contained',
        },
    },
    '/owner/parkings': {
        key: 'ownerParkings',
        authority: ['parking_owner'],
        meta: {
            pageBackgroundType: 'plain',
            pageContainerType: 'contained',
        },
    },
    '/owner/parkings/[id]/slots': {
        key: 'ownerSlots',
        authority: ['parking_owner'],
        dynamicRoute: true,
        meta: {
            pageBackgroundType: 'plain',
            pageContainerType: 'contained',
        },
    },
    '/owner/reservations': {
        key: 'ownerReservations',
        authority: ['parking_owner'],
        meta: {
            pageBackgroundType: 'plain',
            pageContainerType: 'contained',
        },
    },
    '/owner/earnings': {
        key: 'ownerEarnings',
        authority: ['parking_owner'],
        meta: {
            pageBackgroundType: 'plain',
            pageContainerType: 'contained',
        },
    },
    '/owner/withdrawals': {
        key: 'ownerWithdrawals',
        authority: ['parking_owner'],
        meta: {
            pageBackgroundType: 'plain',
            pageContainerType: 'contained',
        },
    },
    '/guard/dashboard': {
        key: 'guardDashboard',
        authority: ['guard', 'admin'],
        meta: {
            pageBackgroundType: 'plain',
            pageContainerType: 'contained',
        },
    },
}

export const publicRoutes = {
    '/': {
        key: 'landing',
        authority: [],
        meta: {
            pageBackgroundType: 'plain',
            pageContainerType: 'gutterless',
            footer: false,
        },
    },
}

export const authRoutes = authRoute
