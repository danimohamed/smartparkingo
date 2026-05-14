'use client'

import classNames from '@/utils/classNames'
import { HEADER_HEIGHT } from '@/constants/theme.constant'
import HydrationSafe from '@/components/shared/HydrationSafe'

const headerEndFallback = (
    <div
        className="flex items-center justify-end gap-2 min-w-[5.5rem] h-10"
        aria-hidden
    >
        <div className="h-8 w-8 shrink-0 rounded-full bg-gray-200/80 dark:bg-gray-700/80" />
        <div className="h-8 w-8 shrink-0 rounded-full bg-gray-200/80 dark:bg-gray-700/80" />
    </div>
)

const Header = (props) => {
    const {
        headerStart,
        headerEnd,
        headerMiddle,
        className,
        container,
        wrapperClass,
    } = props

    return (
        <header className={classNames('header', className)}>
            <div
                className={classNames(
                    'header-wrapper',
                    container && 'container mx-auto',
                    wrapperClass,
                )}
                style={{ height: HEADER_HEIGHT }}
            >
                <div className="header-action header-action-start">
                    {headerStart}
                </div>
                {headerMiddle && (
                    <div className="header-action header-action-middle">
                        {headerMiddle}
                    </div>
                )}
                <div className="header-action header-action-end">
                    {headerEnd ? (
                        <HydrationSafe fallback={headerEndFallback}>{headerEnd}</HydrationSafe>
                    ) : null}
                </div>
            </div>
        </header>
    )
}

export default Header
