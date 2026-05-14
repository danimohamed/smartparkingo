'use client'
import { useSession } from 'next-auth/react'
import { useEffect } from 'react'

/**
 * Syncs the backend JWT token from the NextAuth session to localStorage.
 * This is needed for OAuth logins (Google, GitHub) where the token is obtained
 * server-side during the signIn callback but the Axios interceptor reads from localStorage.
 */
const BackendTokenSync = () => {
    const { data: session } = useSession()

    useEffect(() => {
        if (session?.user?.backendToken) {
            const currentToken = localStorage.getItem('sp_token')
            if (currentToken !== session.user.backendToken) {
                localStorage.setItem('sp_token', session.user.backendToken)
            }
        }
    }, [session])

    return null
}

export default BackendTokenSync

