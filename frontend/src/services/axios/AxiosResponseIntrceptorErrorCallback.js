import { signOut } from 'next-auth/react'

let isSigningOut = false

/**
 * Global Axios response error handler.
 *
 * On HTTP 401 from the backend (JWT expired / invalid), clear the local
 * Axios token and trigger a NextAuth sign-out so the user is redirected
 * to the sign-in page instead of staring at empty data.
 *
 * Other errors are propagated unchanged so callers can render their
 * own UI states.
 */
const AxiosResponseIntrceptorErrorCallback = async (error) => {
    const status = error?.response?.status

    if (status === 401 && typeof window !== 'undefined' && !isSigningOut) {
        isSigningOut = true
        try {
            localStorage.removeItem('sp_token')
        } catch (_) {
            // ignore — best effort
        }
        try {
            await signOut({ callbackUrl: '/sign-in', redirect: true })
        } catch (_) {
            // ignore — best effort
        } finally {
            // Reset on next tick so a future session can be invalidated again.
            setTimeout(() => { isSigningOut = false }, 1000)
        }
    }
}

export default AxiosResponseIntrceptorErrorCallback
