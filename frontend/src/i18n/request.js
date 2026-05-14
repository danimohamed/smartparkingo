import { getRequestConfig } from 'next-intl/server'
import { getLocale } from '@/server/actions/locale'
import appConfig from '@/configs/app.config'

/**
 * next-intl request config.
 *
 * - Locale resolved server-side (cookie → header → 'fr').
 * - Loads the active locale's messages and DEEP-MERGES them on top of the
 *   French bundle so any missing key transparently falls back to French
 *   (NOT to English, per project policy).
 */
function deepMerge(base, override) {
    if (typeof base !== 'object' || base === null) return override ?? base
    if (typeof override !== 'object' || override === null) return base
    const out = Array.isArray(base) ? [...base] : { ...base }
    for (const key of Object.keys(override)) {
        out[key] = deepMerge(base[key], override[key])
    }
    return out
}

export default getRequestConfig(async () => {
    const requested = await getLocale()
    const supported = appConfig.locales || ['fr', 'en']
    const locale = supported.includes(requested) ? requested : (appConfig.defaultLocale || 'fr')

    const fr = (await import('../../messages/fr.json')).default
    const messages =
        locale === 'fr'
            ? fr
            : deepMerge(fr, (await import(`../../messages/${locale}.json`)).default)

    return {
        locale,
        messages,
        timeZone: 'Africa/Casablanca',
        now: new Date(),
        formats: {
            dateTime: {
                short: { day: '2-digit', month: '2-digit', year: 'numeric' },
                long: {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                },
            },
            number: {
                currency: { style: 'currency', currency: 'MAD' },
            },
        },
    }
})
