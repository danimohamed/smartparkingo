import { auth } from '@/auth'
import AuthProvider from '@/components/auth/AuthProvider'
import BackendTokenSync from '@/components/auth/BackendTokenSync'
import ThemeProvider from '@/components/template/Theme/ThemeProvider'
import pageMetaConfig from '@/configs/page-meta.config'
import NavigationProvider from '@/components/template/Navigation/NavigationProvider'
import QueryProvider from '@/components/shared/QueryProvider'
import { getNavigation } from '@/server/actions/navigation/getNavigation'
import { getTheme } from '@/server/actions/theme'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages, getNow, getTimeZone } from 'next-intl/server'
import '@/assets/styles/app.css'

export const metadata = {
    ...pageMetaConfig,
}

export default async function RootLayout({ children }) {
    const session = await auth()

    const navigationTree = await getNavigation()

    const theme = await getTheme()

    const locale = await getLocale()
    const messages = await getMessages()
    const now = await getNow()
    const timeZone = await getTimeZone()

    return (
        <AuthProvider session={session}>
            <html
                lang={locale}
                className={theme.mode === 'dark' ? 'dark' : 'light'}
                dir={locale === 'ar' ? 'rtl' : theme.direction}
                suppressHydrationWarning
            >
                <body suppressHydrationWarning>
                    <BackendTokenSync />
                    <NextIntlClientProvider
                        locale={locale}
                        messages={messages}
                        timeZone={timeZone}
                        now={now}
                    >
                        <ThemeProvider theme={theme}>
                            <NavigationProvider navigationTree={navigationTree}>
                                <QueryProvider>
                                    {children}
                                </QueryProvider>
                            </NavigationProvider>
                        </ThemeProvider>
                    </NextIntlClientProvider>
                </body>
            </html>
        </AuthProvider>
    )
}
