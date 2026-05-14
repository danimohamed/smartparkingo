'use server'

import { cookies } from 'next/headers'
import appConfig from '@/configs/app.config'
import { COOKIES_KEY } from '@/constants/app.constant'

const COOKIE_NAME = COOKIES_KEY.LOCALE

/**
 * Resolve the active locale.
 * Priority: explicit cookie → French (default).
 *
 * The browser's `Accept-Language` header is intentionally ignored: French is
 * the product default for every visitor, regardless of OS/browser language.
 * Users can switch to another locale via the in-app language selector, which
 * writes the cookie consumed here.
 */
export async function getLocale() {
    const cookieStore = await cookies()
    const cookieLocale = cookieStore.get(COOKIE_NAME)?.value
    if (cookieLocale && (appConfig.locales || []).includes(cookieLocale)) {
        return cookieLocale
    }


    return appConfig.defaultLocale || 'fr'
}

export async function setLocale(locale) {
    const cookieStore = await cookies()
    const safe = (appConfig.locales || []).includes(locale) ? locale : appConfig.defaultLocale
    // Make the cookie readable by client-side code (Axios interceptor) + 1 year persistence.
    cookieStore.set(COOKIE_NAME, safe, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'lax',
        httpOnly: false,
    })
}
