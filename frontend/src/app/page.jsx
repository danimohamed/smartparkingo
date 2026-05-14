import { auth } from '@/auth'
import appConfig from '@/configs/app.config'
import { redirect } from 'next/navigation'
import AboutLanding from './_components/AboutLanding'

export const metadata = {
    title: 'Parkingo — Park smarter. Move faster.',
    description:
        'Discover, reserve, and pay for parking in one place. Parkingo connects drivers, lot owners, and guards.',
}

const Page = async () => {
    const session = await auth()
    if (session) {
        redirect(appConfig.authenticatedEntryPath)
    }
    return <AboutLanding />
}

export default Page
