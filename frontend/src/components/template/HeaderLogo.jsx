import Logo from '@/components/template/Logo'
import useTheme from '@/utils/hooks/useTheme'
import appConfig from '@/configs/app.config'
import Link from 'next/link'

const HeaderLogo = ({ mode }) => {
    const defaultMode = useTheme((state) => state.mode)

    return (
        <Link href={appConfig.authenticatedEntryPath}>
            <Logo
                imgClass="max-h-10 sm:max-h-12 lg:max-h-14"
                mode={mode || defaultMode}
                className="block"
            />
        </Link>
    )
}

export default HeaderLogo
