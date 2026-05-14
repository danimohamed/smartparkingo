'use client'

import { useLocale, useFormatter } from 'next-intl'

/**
 * Centralized localized formatters.
 *
 * Always use these (instead of inline `Intl.NumberFormat`/`dayjs.format`) so
 * dates display in the user's locale (with a fr-MA bias when French is active)
 * and currency renders consistently as MAD.
 */
export function useLocalizedFormatters() {
    const locale = useLocale()
    const fmt = useFormatter()

    const intlLocale = locale === 'fr' ? 'fr-MA' : locale === 'ar' ? 'ar-MA' : 'en-US'

    return {
        locale,
        intlLocale,
        currency: (value) =>
            new Intl.NumberFormat(intlLocale, {
                style: 'currency',
                currency: 'MAD',
                maximumFractionDigits: 2,
            }).format(value ?? 0),
        date: (d, opts) =>
            d
                ? new Intl.DateTimeFormat(intlLocale, opts || { dateStyle: 'medium' }).format(
                      typeof d === 'string' ? new Date(d) : d,
                  )
                : '',
        dateTime: (d) =>
            d
                ? new Intl.DateTimeFormat(intlLocale, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                  }).format(typeof d === 'string' ? new Date(d) : d)
                : '',
        relative: (d) => fmt.relativeTime(typeof d === 'string' ? new Date(d) : d),
        number: (n) => new Intl.NumberFormat(intlLocale).format(n ?? 0),
    }
}

