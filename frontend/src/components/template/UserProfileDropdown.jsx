'use client'
import Avatar from '@/components/ui/Avatar'
import Dropdown from '@/components/ui/Dropdown'
import withHeaderItem from '@/utils/hoc/withHeaderItem'
import Link from 'next/link'
import signOut from '@/server/actions/auth/handleSignOut'
import useCurrentSession from '@/utils/hooks/useCurrentSession'
import { useTranslations } from 'next-intl'
import { PiUserDuotone, PiSignOutDuotone } from 'react-icons/pi'

const _UserDropdown = () => {
    const { session } = useCurrentSession()
    const t = useTranslations('common.userMenu')

    const handleSignOut = async () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('sp_token')
        }
        await signOut()
    }

    const avatarProps = {
        ...(session?.user?.image
            ? { src: session?.user?.image }
            : { icon: <PiUserDuotone /> }),
    }

    return (
        <Dropdown
            className="flex"
            toggleClassName="flex items-center"
            renderTitle={
                <div className="cursor-pointer flex items-center">
                    <Avatar size={32} {...avatarProps} />
                </div>
            }
            placement="bottom-end"
        >
            <Dropdown.Item variant="header">
                <div className="py-2 px-3 flex items-center gap-3">
                    <Avatar {...avatarProps} />
                    <div>
                        <div className="font-bold text-gray-900 dark:text-gray-100">
                            {session?.user?.name || t('anonymous')}
                        </div>
                        <div className="text-xs">
                            {session?.user?.email || t('noEmail')}
                        </div>
                    </div>
                </div>
            </Dropdown.Item>
            <Dropdown.Item variant="divider" />
            <Dropdown.Item eventKey="my-profile" className="px-0">
                <Link className="flex h-full w-full px-2" href="/profile">
                    <span className="flex gap-2 items-center w-full">
                        <span className="text-xl">
                            <PiUserDuotone />
                        </span>
                        <span>{t('myProfile')}</span>
                    </span>
                </Link>
            </Dropdown.Item>
            <Dropdown.Item
                eventKey="sign-out"
                className="gap-2"
                onClick={handleSignOut}
            >
                <span className="text-xl">
                    <PiSignOutDuotone />
                </span>
                <span>{t('signOut')}</span>
            </Dropdown.Item>
        </Dropdown>
    )
}

const UserDropdown = withHeaderItem(_UserDropdown)

export default UserDropdown
