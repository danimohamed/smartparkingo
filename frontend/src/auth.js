import NextAuth from 'next-auth'
import appConfig from '@/configs/app.config'
import authConfig from '@/configs/auth.config'
import { getAuthSecret } from '@/configs/auth-secret'

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    // Must come after spread so auth.config.js can never override these
    secret: getAuthSecret(),
    trustHost: true,
    // Surfaces [auth][debug] / [auth][error] lines in the terminal during `npm run dev`
    debug: process.env.NODE_ENV === 'development',
    pages: {
        // Must be the real sign-in route — not /home (that broke OAuth "stuck on sign-in")
        signIn: appConfig.unAuthenticatedEntryPath,
        error: appConfig.unAuthenticatedEntryPath,
    },
})
