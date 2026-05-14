/**
 * Human-readable messages for Auth.js / NextAuth `error` query values.
 * @see https://authjs.dev/guides/basics/pages
 * @param {string | null | undefined} code
 * @returns {string}
 */
export function getAuthJsErrorMessage(code) {
    if (!code) return ''
    const map = {
        MissingCSRF:
            'Sign-in cookie was missing or blocked. Refresh this page and try Google again (avoid mixing http://127.0.0.1 and http://localhost).',
        Configuration:
            'Auth.js configuration error (details are often only in the server terminal). Most common locally: empty GOOGLE_AUTH_CLIENT_SECRET in frontend/.env.local, missing AUTH_SECRET on Vercel, or wrong AUTH_URL/NEXTAUTH_URL vs the address in your browser. After fixing env vars, restart `npm run dev` and watch for [auth] lines in that terminal.',
        AccessDenied: 'Access was denied.',
        Verification: 'The sign-in link has expired or was already used.',
        OAuthSignin:
            'Could not start Google sign-in. Check GOOGLE_AUTH_CLIENT_ID and GOOGLE_AUTH_CLIENT_SECRET in .env.local.',
        OAuthCallback: 'Google sign-in failed during the callback.',
        OAuthCreateAccount: 'Could not create an account from your Google profile.',
        OAuthAccountNotLinked:
            'This email is already used with another sign-in method. Sign in with your password or link accounts in settings.',
        Callback: 'Authentication callback failed.',
        SessionRequired: 'You must be signed in to view this page.',
    }
    return map[code] || `Sign-in failed (${code}). Try again or refresh the page.`
}
