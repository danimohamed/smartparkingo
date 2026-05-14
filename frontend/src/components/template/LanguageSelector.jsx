'use client'
import { useMemo, useTransition } from 'react'
import Avatar from '@/components/ui/Avatar'
import Dropdown from '@/components/ui/Dropdown'
import classNames from 'classnames'
import withHeaderItem from '@/utils/hoc/withHeaderItem'
import { HiCheck } from 'react-icons/hi'
import { setLocale } from '@/server/actions/locale'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'

// Aligned with project policy: French is the default & fallback, English is
// the secondary language, Arabic is reserved for the future RTL rollout.
const languageList = [
    { label: 'Français', value: 'fr', flag: 'FR' },
    { label: 'English', value: 'en', flag: 'US' },
    // { label: 'العربية', value: 'ar', flag: 'SA' }, // Enable when ar.json + RTL audit is done
]

const _LanguageSelector = ({ className }) => {
    const locale = useLocale()
    const router = useRouter()
    const [pending, startTransition] = useTransition()

    const selectLangFlag = useMemo(() => {
        return languageList.find((lang) => lang.value === locale)?.flag || 'FR'
    }, [locale])

    const handleUpdateLocale = (next) => {
        if (next === locale || pending) return
        startTransition(async () => {
            await setLocale(next)
            router.refresh()
        })
    }

    const selectedLanguage = (
        <div className={classNames(className, 'flex items-center')}>
            <Avatar
                size={24}
                shape="circle"
                src={`/img/countries/${selectLangFlag}.png`}
            />
        </div>
    )

    return (
        <Dropdown renderTitle={selectedLanguage} placement="bottom-end">
            {languageList.map((lang) => (
                <Dropdown.Item
                    key={lang.label}
                    className="justify-between"
                    eventKey={lang.label}
                    onClick={() => handleUpdateLocale(lang.value)}
                >
                    <span className="flex items-center">
                        <Avatar
                            size={18}
                            shape="circle"
                            src={`/img/countries/${lang.flag}.png`}
                        />
                        <span className="ltr:ml-2 rtl:mr-2">{lang.label}</span>
                    </span>
                    {locale === lang.value && (
                        <HiCheck className="text-emerald-500 text-lg" />
                    )}
                </Dropdown.Item>
            ))}
        </Dropdown>
    )
}

const LanguageSelector = withHeaderItem(_LanguageSelector)

export default LanguageSelector
