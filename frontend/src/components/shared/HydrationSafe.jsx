'use client'

import { useEffect, useState } from 'react'

/**
 * Renders children only after mount so Floating UI / useId IDs are not part of
 * the server HTML (avoids hydration mismatch vs first client paint).
 */
export default function HydrationSafe({ children, fallback = null }) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return fallback
    }

    return children
}
