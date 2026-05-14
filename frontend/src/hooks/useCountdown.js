import { useState, useEffect, useRef } from 'react'

export default function useCountdown(targetDate) {
    const getTimeLeft = () => {
        const diff = new Date(targetDate).getTime() - Date.now()
        if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true, totalSeconds: 0 }
        return {
            days: Math.floor(diff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((diff / (1000 * 60)) % 60),
            seconds: Math.floor((diff / 1000) % 60),
            isExpired: false,
            totalSeconds: Math.floor(diff / 1000),
        }
    }

    const [timeLeft, setTimeLeft] = useState(getTimeLeft)
    const intervalRef = useRef(null)

    useEffect(() => {
        setTimeLeft(getTimeLeft())
        intervalRef.current = setInterval(() => {
            const t = getTimeLeft()
            setTimeLeft(t)
            if (t.isExpired) clearInterval(intervalRef.current)
        }, 1000)
        return () => clearInterval(intervalRef.current)
    }, [targetDate])

    return timeLeft
}

