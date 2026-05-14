const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL

const appConfig = {
    apiPrefix: backendUrl ? `${backendUrl}/api` : '/backend-api',
    authenticatedEntryPath: '/home',
    unAuthenticatedEntryPath: '/sign-in',
    locale: 'fr',
    locales: ['fr', 'en'],
    defaultLocale: 'fr',
    activeNavTranslation: true,
}

export default appConfig
