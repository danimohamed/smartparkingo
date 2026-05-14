import validateCredential from '../server/actions/user/validateCredential'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080'

const googleId = process.env.GOOGLE_AUTH_CLIENT_ID?.trim()
const googleSecret = process.env.GOOGLE_AUTH_CLIENT_SECRET?.trim()
if (process.env.NODE_ENV === 'development' && googleId && !googleSecret) {
    console.warn(
        '[auth] GOOGLE_AUTH_CLIENT_SECRET is empty — Google sign-in is disabled until you paste the client secret from Google Cloud Console into frontend/.env.local',
    )
}

const providers = []
if (googleId && googleSecret) {
    providers.push(
        Google({
            clientId: googleId,
            clientSecret: googleSecret,
        }),
    )
}
providers.push(
    Credentials({
        async authorize(credentials) {
            const user = await validateCredential(credentials)
            if (!user) {
                return null
            }

            return {
                id: user.id,
                name: user.userName,
                email: user.email,
                image: user.avatar,
                authority: user.authority,
                backendToken: user.token,
            }
        },
    }),
)

// eslint-disable-next-line import/no-anonymous-default-export
export default {
    providers,
    callbacks: {
        async signIn({ user, account }) {
            // For OAuth providers, register/login user on backend and get JWT
            if (account?.provider === 'google') {
                try {
                    const res = await fetch(`${BACKEND_URL}/api/auth/oauth-login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email: user.email,
                            fullName: user.name || user.email.split('@')[0],
                            image: user.image || '',
                        }),
                    })
                    const json = await res.json()
                    if (res.ok && json.success) {
                        user.backendToken = json.data.token
                        user.authority = [json.data.role?.toLowerCase()]
                        user.id = json.data.id
                    }
                } catch {
                    // OAuth login failed silently — user will proceed without backend token
                }
            }
            return true
        },
        async jwt({ token, user }) {
            if (user) {
                token.authority = user.authority
                token.backendToken = user.backendToken
            }
            return token
        },
        async session({ session, token }) {
            return {
                ...session,
                user: {
                    ...session.user,
                    id: token.sub,
                    authority: token.authority,
                    backendToken: token.backendToken,
                },
            }
        },
    },
}
