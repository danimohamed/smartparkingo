'use client'

import dynamic from 'next/dynamic'
import PostLoginLayout from '@/components/layouts/PostLoginLayout'

const ChatWidget = dynamic(
    () => import('@/components/shared/chatbot/ChatWidget'),
    { ssr: false, loading: () => null },
)

/**
 * Keeps ChatWidget outside PostLoginLayout so SSR/client trees match inside the header
 * (avoids Floating UI useId hydration mismatches on UserDropdown).
 */
export default function ProtectedAppShell({ children }) {
    return (
        <>
            <PostLoginLayout>{children}</PostLoginLayout>
            <ChatWidget />
        </>
    )
}
