'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import logger from '@/utils/logger'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''
const REROUTE_THRESHOLD_METERS = 50
const ARRIVAL_THRESHOLD_METERS = 30

/**
 * Fetch route from Mapbox Directions API
 */
async function fetchRoute(userLng, userLat, destLng, destLat) {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${userLng},${userLat};${destLng},${destLat}?geometries=geojson&overview=full&steps=true&annotations=distance,duration,speed&access_token=${MAPBOX_TOKEN}`

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    try {
        const res = await fetch(url, { signal: controller.signal })
        clearTimeout(timeout)
        if (!res.ok) throw new Error(`Route API error: ${res.status}`)

        const data = await res.json()
        if (!data.routes || data.routes.length === 0) throw new Error('No route found')

        const route = data.routes[0]
        const coords = route.geometry.coordinates
        const distanceM = route.distance
        const durationS = route.duration
        const steps = route.legs?.[0]?.steps || []

        return {
            coordinates: coords,
            geometry: route.geometry,
            distanceMeters: distanceM,
            durationSeconds: durationS,
            distanceText: distanceM < 1000
                ? `${Math.round(distanceM)} m`
                : `${(distanceM / 1000).toFixed(1)} km`,
            durationText: durationS < 60
                ? `${Math.round(durationS)} sec`
                : `${Math.round(durationS / 60)} min`,
            steps: steps.map((s) => ({
                instruction: s.maneuver?.instruction || '',
                type: s.maneuver?.type || '',
                modifier: s.maneuver?.modifier || '',
                distanceMeters: s.distance,
                durationSeconds: s.duration,
                location: s.maneuver?.location || null,
            })),
        }
    } catch (e) {
        clearTimeout(timeout)
        if (e.name === 'AbortError') throw new Error('Route request timed out')
        throw e
    }
}

/**
 * Haversine distance in meters
 */
function haversineDist(lat1, lng1, lat2, lng2) {
    const dx = (lng2 - lng1) * 111320 * Math.cos(((lat1 + lat2) / 2 * Math.PI) / 180)
    const dy = (lat2 - lat1) * 110540
    return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Find closest point index on route
 */
function closestPointIndex(userLng, userLat, coordinates) {
    let minDist = Infinity
    let minIdx = 0
    for (let i = 0; i < coordinates.length; i++) {
        const [lng, lat] = coordinates[i]
        const d = haversineDist(userLat, userLng, lat, lng)
        if (d < minDist) { minDist = d; minIdx = i }
    }
    return { index: minIdx, distance: minDist }
}

/**
 * Remaining distance along route from index
 */
function remainingRouteDistance(coordinates, fromIndex) {
    let total = 0
    for (let i = fromIndex; i < coordinates.length - 1; i++) {
        const [lng1, lat1] = coordinates[i]
        const [lng2, lat2] = coordinates[i + 1]
        total += haversineDist(lat1, lng1, lat2, lng2)
    }
    return total
}

/**
 * Calculate bearing between two points
 */
function calculateBearing(lat1, lng1, lat2, lng2) {
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const lat1Rad = (lat1 * Math.PI) / 180
    const lat2Rad = (lat2 * Math.PI) / 180
    const x = Math.sin(dLng) * Math.cos(lat2Rad)
    const y = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng)
    return ((Math.atan2(x, y) * 180) / Math.PI + 360) % 360
}

/**
 * useNavigation — full real-time nav with route progress, speed, car animation, follow mode
 */
export default function useNavigation(parking) {
    const [navigating, setNavigating] = useState(false)
    const [route, setRoute] = useState(null)
    const [userPos, setUserPos] = useState(null)
    const [smoothPos, setSmoothPos] = useState(null)
    const [currentStepIndex, setCurrentStepIndex] = useState(0)
    const [distanceRemaining, setDistanceRemaining] = useState(null)
    const [durationRemaining, setDurationRemaining] = useState(null)
    const [bearing, setBearing] = useState(0)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [arrived, setArrived] = useState(false)
    const [followMode, setFollowMode] = useState(true)
    const [speed, setSpeed] = useState(0)
    const [progressIndex, setProgressIndex] = useState(0)
    const [nightMode, setNightMode] = useState(false)

    const watchIdRef = useRef(null)
    const routeRef = useRef(null)
    const lastRerouteTime = useRef(0)
    const parkingRef = useRef(parking)
    const prevPosRef = useRef(null)
    const prevTimeRef = useRef(null)
    const animFrameRef = useRef(null)
    const targetPosRef = useRef(null)
    const currentPosRef = useRef(null)

    useEffect(() => { parkingRef.current = parking }, [parking])
    useEffect(() => { routeRef.current = route }, [route])

    // Smooth animation loop — interpolate toward target position
    useEffect(() => {
        if (!navigating) return
        let running = true
        const animate = () => {
            if (!running) return
            const target = targetPosRef.current
            const current = currentPosRef.current
            if (target && current) {
                const newLat = current.lat + (target.lat - current.lat) * 0.15
                const newLng = current.lng + (target.lng - current.lng) * 0.15
                currentPosRef.current = { lat: newLat, lng: newLng }
                setSmoothPos({ lat: newLat, lng: newLng })
            }
            animFrameRef.current = requestAnimationFrame(animate)
        }
        animFrameRef.current = requestAnimationFrame(animate)
        return () => {
            running = false
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
        }
    }, [navigating])

    const fetchAndSetRoute = useCallback(async (userLat, userLng) => {
        const p = parkingRef.current
        if (!p) return null
        try {
            const r = await fetchRoute(userLng, userLat, p.lng, p.lat)
            setRoute(r)
            setDistanceRemaining(r.distanceText)
            setDurationRemaining(r.durationText)
            setCurrentStepIndex(0)
            setProgressIndex(0)
            setError(null)
            return r
        } catch (e) {
            setError(e.message)
            return null
        }
    }, [])

    const startNavigation = useCallback(async (initialUserLocation) => {
        if (!parking || !MAPBOX_TOKEN) return

        setLoading(true)
        setNavigating(true)
        setArrived(false)
        setError(null)
        setFollowMode(true)
        setSpeed(0)
        setProgressIndex(0)
        setNightMode(false)

        const startLat = initialUserLocation?.lat || 31.6295
        const startLng = initialUserLocation?.lng || -7.9811
        const initPos = { lat: startLat, lng: startLng, heading: 0 }

        setUserPos(initPos)
        setSmoothPos(initPos)
        targetPosRef.current = initPos
        currentPosRef.current = initPos
        prevPosRef.current = null
        prevTimeRef.current = null

        try {
            const r = await fetchAndSetRoute(startLat, startLng)
            if (!r) { setNavigating(false); return }

            if (navigator.geolocation) {
                watchIdRef.current = navigator.geolocation.watchPosition(
                    (position) => {
                        const { latitude, longitude, heading: h, speed: s } = position.coords
                        const newPos = { lat: latitude, lng: longitude, heading: h || 0 }
                        setUserPos(newPos)
                        targetPosRef.current = newPos

                        if (s != null && s > 0) {
                            setSpeed(Math.round(s * 3.6))
                        } else if (prevPosRef.current && prevTimeRef.current) {
                            const dt = (Date.now() - prevTimeRef.current) / 1000
                            if (dt > 0.5) {
                                const dist = haversineDist(prevPosRef.current.lat, prevPosRef.current.lng, latitude, longitude)
                                setSpeed(Math.round((dist / dt) * 3.6))
                            }
                        }
                        prevPosRef.current = { lat: latitude, lng: longitude }
                        prevTimeRef.current = Date.now()
                    },
                    (err) => logger.warn('Geolocation watch error:', err),
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 }
                )
            }
        } catch (e) {
            setError(e.message || 'Navigation failed')
            setNavigating(false)
        } finally {
            setLoading(false)
        }
    }, [parking, fetchAndSetRoute])

    const stopNavigation = useCallback(() => {
        setNavigating(false)
        setRoute(null)
        setArrived(false)
        setCurrentStepIndex(0)
        setDistanceRemaining(null)
        setDurationRemaining(null)
        setError(null)
        setSpeed(0)
        setProgressIndex(0)
        setFollowMode(true)

        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current)
            watchIdRef.current = null
        }
        if (animFrameRef.current) {
            cancelAnimationFrame(animFrameRef.current)
            animFrameRef.current = null
        }
    }, [])

    const toggleFollowMode = useCallback(() => setFollowMode(prev => !prev), [])
    const toggleNightMode = useCallback(() => setNightMode(prev => !prev), [])

    // React to user position changes
    useEffect(() => {
        if (!navigating || !userPos || !routeRef.current || !parkingRef.current) return

        const r = routeRef.current
        const p = parkingRef.current

        // Calculate bearing toward next route point
        const { index: closestIdx } = closestPointIndex(userPos.lng, userPos.lat, r.coordinates)
        const lookAheadIdx = Math.min(closestIdx + 3, r.coordinates.length - 1)
        const [aheadLng, aheadLat] = r.coordinates[lookAheadIdx]
        setBearing(calculateBearing(userPos.lat, userPos.lng, aheadLat, aheadLng))

        // Update progress index
        setProgressIndex(closestIdx)

        // Check arrival
        const distToDest = haversineDist(userPos.lat, userPos.lng, p.lat, p.lng)
        if (distToDest < ARRIVAL_THRESHOLD_METERS) {
            setArrived(true)
            setDistanceRemaining('0 m')
            setDurationRemaining('Arrived')
            setSpeed(0)
            return
        }

        // Remaining distance along route
        const remDist = remainingRouteDistance(r.coordinates, closestIdx)
        setDistanceRemaining(remDist < 1000 ? `${Math.round(remDist)} m` : `${(remDist / 1000).toFixed(1)} km`)

        // Remaining duration
        const proportion = r.distanceMeters > 0 ? remDist / r.distanceMeters : 0
        const etaSec = r.durationSeconds * proportion
        setDurationRemaining(etaSec < 60 ? `${Math.round(etaSec)} sec` : `${Math.round(etaSec / 60)} min`)

        // Update current step
        if (r.steps?.length > 0) {
            let bestStep = 0, bestDist = Infinity
            for (let i = 0; i < r.steps.length; i++) {
                const loc = r.steps[i].location
                if (!loc) continue
                const d = haversineDist(userPos.lat, userPos.lng, loc[1], loc[0])
                if (d < bestDist) { bestDist = d; bestStep = i }
            }
            setCurrentStepIndex(prev => Math.max(prev, bestStep))
        }

        // Check route deviation
        const deviation = closestPointIndex(userPos.lng, userPos.lat, r.coordinates).distance
        const now = Date.now()
        if (deviation > REROUTE_THRESHOLD_METERS && now - lastRerouteTime.current > 5000) {
            lastRerouteTime.current = now
            fetchAndSetRoute(userPos.lat, userPos.lng)
        }
    }, [userPos, navigating, fetchAndSetRoute])

    useEffect(() => {
        return () => {
            if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
        }
    }, [])

    return {
        navigating, route, userPos, smoothPos,
        currentStepIndex, distanceRemaining, durationRemaining,
        bearing, loading, error, arrived,
        followMode, speed, progressIndex, nightMode,
        startNavigation, stopNavigation,
        toggleFollowMode, toggleNightMode,
    }
}

