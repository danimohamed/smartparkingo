'use client'
import Card from '@/components/ui/Card'
import Link from 'next/link'
import { PiArrowRightBold } from 'react-icons/pi'

const SectionContainer = ({ title, viewAllHref, children, className = '' }) => {
    return (
        <Card className={`overflow-hidden ${className}`}>
            <div className="flex items-center justify-between mb-4">
                <h6 className="font-bold text-gray-900 dark:text-white">{title}</h6>
                {viewAllHref && (
                    <Link
                        href={viewAllHref}
                        className="flex items-center gap-1.5 text-xs font-semibold text-indigo-500 hover:text-indigo-600 transition-colors"
                    >
                        View All
                        <PiArrowRightBold className="text-[10px]" />
                    </Link>
                )}
            </div>
            {children}
        </Card>
    )
}

export default SectionContainer
