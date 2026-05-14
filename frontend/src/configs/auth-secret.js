/**
 * Single source of truth for Auth.js `secret` (must match in Node + Edge middleware).
 * @see https://errors.authjs.dev#missingsecret
 */
const LOCAL_DEV_FALLBACK =
    'local-dev-authjs-secret-min-32-chars-do-not-use-in-prod'

export function getAuthSecret() {
    const fromEnv = (process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET)?.trim()
    if (fromEnv) return fromEnv
    // Never use the fallback on real production deploys
    if (
        process.env.VERCEL_ENV === 'production' ||
        (process.env.NODE_ENV === 'production' && process.env.VERCEL)
    ) {
        return undefined
    }
    return LOCAL_DEV_FALLBACK
}
