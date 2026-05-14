'use client'

import { useEffect, useRef, useState } from 'react'
import { ensureRtlPlugin, applyMapLanguage, getCurrentLocale } from '../_utils/mapboxLocale'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''
const MAPBOX_VERSION = '3.4.0'

function buildMarkerEl(parking, isNearest, isSelected) {
    const size = isNearest ? 44 : 38
    const bg = isNearest ? '#10B981' : isSelected ? '#6366F1' : '#3B82F6'
    const shadow = isNearest ? '0 4px 12px rgba(16,185,129,0.4)' : '0 4px 12px rgba(59,130,246,0.4)'
    const fontSize = isNearest ? 13 : 11
    const badgeBg = (parking.availableSlots || 0) > 0 ? '#10B981' : '#EF4444'
    const bounce = isNearest ? 'animation:markerBounce 1s ease infinite;' : ''
    const scale = isSelected ? 'transform:scale(1.2);' : ''

    const el = document.createElement('div')
    el.style.cssText = 'cursor:pointer;position:relative;' + scale
    el.innerHTML = `
        <div style="width:${size}px;height:${size}px;background:${bg};border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:${shadow};border:2px solid white;${bounce}">
            <span style="transform:rotate(45deg);color:white;font-weight:700;font-size:${fontSize}px">P</span>
        </div>
        <div style="position:absolute;top:-8px;right:-8px;background:${badgeBg};color:white;font-size:10px;font-weight:700;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white">${parking.availableSlots || 0}</div>
    `
    return el
}

function buildUserEl() {
    const el = document.createElement('div')
    el.innerHTML = '<div style="width:20px;height:20px;background:#4285F4;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(66,133,244,0.3),0 2px 8px rgba(0,0,0,0.3);animation:userPulse 2s infinite"></div>'
    return el
}

// Load Mapbox GL JS + CSS from CDN (completely bypasses build system)
function loadMapboxFromCDN() {
    return new Promise((resolve, reject) => {
        // Check if already loaded
        if (window.mapboxgl) return resolve(window.mapboxgl)

        // Load CSS
        if (!document.getElementById('mapbox-cdn-css')) {
            const link = document.createElement('link')
            link.id = 'mapbox-cdn-css'
            link.rel = 'stylesheet'
            link.href = `https://api.mapbox.com/mapbox-gl-js/v${MAPBOX_VERSION}/mapbox-gl.css`
            document.head.appendChild(link)
        }

        // Load JS
        if (!document.getElementById('mapbox-cdn-js')) {
            const script = document.createElement('script')
            script.id = 'mapbox-cdn-js'
            script.src = `https://api.mapbox.com/mapbox-gl-js/v${MAPBOX_VERSION}/mapbox-gl.js`
            script.onload = () => resolve(window.mapboxgl)
            script.onerror = () => reject(new Error('Failed to load Mapbox GL JS from CDN'))
            document.head.appendChild(script)
        } else {
            // Script tag exists but mapboxgl not ready yet, poll
            const check = setInterval(() => {
                if (window.mapboxgl) {
                    clearInterval(check)
                    resolve(window.mapboxgl)
                }
            }, 100)
            setTimeout(() => { clearInterval(check); reject(new Error('Timeout loading Mapbox')) }, 10000)
        }
    })
}

const ParkingMap = ({
    parkings,
    userLocation,
    selectedParking,
    nearestParking,
    onSelectParking,
    onCenterUser,
}) => {
    const mapContainer = useRef(null)
    const map = useRef(null)
    const markersRef = useRef([])
    const userMarkerRef = useRef(null)
    const mapboxglRef = useRef(null)
    const [mapReady, setMapReady] = useState(false)
    const [error, setError] = useState(null)
    const initialLocationRef = useRef(null)
    const hasCenteredOnReal = useRef(false)
    const locale = getCurrentLocale()

    // Capture initial location once
    if (!initialLocationRef.current && userLocation) {
        initialLocationRef.current = { lat: userLocation.lat, lng: userLocation.lng }
    }

    // Inject keyframe animations + Mapbox CSS overrides at runtime (bypasses PostCSS)
    useEffect(() => {
        const id = 'parking-map-keyframes'
        if (!document.getElementById(id)) {
            const style = document.createElement('style')
            style.id = id
            style.textContent = `
                @keyframes userPulse {
                    0% { box-shadow: 0 0 0 4px rgba(66,133,244,0.3), 0 2px 8px rgba(0,0,0,0.3); }
                    50% { box-shadow: 0 0 0 12px rgba(66,133,244,0.1), 0 2px 8px rgba(0,0,0,0.3); }
                    100% { box-shadow: 0 0 0 4px rgba(66,133,244,0.3), 0 2px 8px rgba(0,0,0,0.3); }
                }
                @keyframes markerBounce {
                    0%, 100% { transform: rotate(-45deg) translateY(0); }
                    50% { transform: rotate(-45deg) translateY(-6px); }
                }
                .mapboxgl-map { position: relative !important; width: 100% !important; height: 100% !important; overflow: hidden !important; }
                .mapboxgl-canvas-container { position: absolute !important; width: 100% !important; height: 100% !important; overflow: hidden !important; }
                .mapboxgl-canvas { position: absolute !important; left: 0 !important; top: 0 !important; }
                .mapboxgl-canvas:focus { outline: none !important; }
                .mapboxgl-map img { max-width: none !important; }
                .mapboxgl-map canvas { display: block !important; max-width: none !important; }
                .mapboxgl-map *, .mapboxgl-map *::before, .mapboxgl-map *::after { box-sizing: content-box; }
                .mapboxgl-ctrl-group, .mapboxgl-ctrl-group *, .mapboxgl-ctrl-attrib { box-sizing: border-box !important; }
                .mapboxgl-control-container { position: absolute !important; top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important; pointer-events: none !important; }
                .mapboxgl-control-container > * { pointer-events: auto !important; }
                .mapboxgl-marker { position: absolute !important; }
            `
            document.head.appendChild(style)
        }
    }, [])

    // Load Mapbox from CDN and initialize map (only once)
    useEffect(() => {
        let cancelled = false
        let retryTimer = null

        async function init() {
            const initLoc = initialLocationRef.current
            if (!MAPBOX_TOKEN || !initLoc || map.current) return

            try {
                const mapboxgl = await loadMapboxFromCDN()
                if (cancelled) return

                mapboxglRef.current = mapboxgl
                mapboxgl.accessToken = MAPBOX_TOKEN
                // Register Arabic/RTL plugin BEFORE creating any Map instance
                ensureRtlPlugin(mapboxgl)

                const container = mapContainer.current
                if (!container) return

                // Wait for container to have dimensions
                await new Promise((r) => {
                    let tries = 0
                    const check = () => {
                        if (container.offsetWidth > 0 && container.offsetHeight > 0) return r()
                        if (++tries > 100) return r()
                        requestAnimationFrame(check)
                    }
                    check()
                })
                if (cancelled) return

                const m = new mapboxgl.Map({
                    container,
                    style: 'mapbox://styles/mapbox/streets-v12',
                    center: [initLoc.lng, initLoc.lat],
                    zoom: 13,
                    attributionControl: false,
                    // Render Morocco as a single, complete territory (Western Sahara
                    // included, no dashed disputed-border line). Mapbox worldviews:
                    // https://docs.mapbox.com/style-spec/reference/sources/#vector-worldviews
                    worldview: 'MA',
                })

                // Belt-and-suspenders: also force the worldview filter on the
                // admin-0-boundary-disputed layer so the dashed line never shows.
                m.on('style.load', () => {
                    try {
                        if (m.getLayer('admin-0-boundary-disputed')) {
                            m.setFilter('admin-0-boundary-disputed', [
                                'all',
                                ['==', ['get', 'disputed'], 'true'],
                                ['==', ['get', 'admin_level'], 0],
                                ['==', ['get', 'maritime'], 'false'],
                                ['match', ['get', 'worldview'], ['all', 'MA'], true, false],
                            ])
                        }
                    } catch (_) { /* layer absent in some style versions */ }
                    // Translate every label layer to the current app locale
                    // (Arabic, French, English, …)
                    applyMapLanguage(m, locale)
                })

                m.addControl(new mapboxgl.NavigationControl(), 'top-right')

                m.on('load', () => {
                    if (!cancelled) {
                        setMapReady(true)
                        m.resize()
                    }
                })

                // Force ready after 3s
                setTimeout(() => { if (!cancelled) setMapReady(true) }, 3000)

                ;[200, 500, 1000, 2000].forEach((ms) =>
                    setTimeout(() => { if (m && !m._removed) m.resize() }, ms)
                )

                map.current = m
            } catch (e) {
                if (!cancelled) setError(e.message)
            }
        }

        if (initialLocationRef.current) {
            init()
        } else {
            retryTimer = setInterval(() => {
                if (initialLocationRef.current && !map.current) {
                    clearInterval(retryTimer)
                    init()
                }
            }, 50)
            setTimeout(() => { clearInterval(retryTimer); if (!map.current) setError('Location not available') }, 10000)
        }

        return () => {
            cancelled = true
            if (retryTimer) clearInterval(retryTimer)
            if (map.current) {
                map.current.remove()
                map.current = null
            }
        }
    }, []) // Empty deps — runs once on mount, cleans up on unmount only

    // Re-translate labels whenever the user toggles the app language.
    useEffect(() => {
        if (!mapReady || !map.current) return
        applyMapLanguage(map.current, locale)
    }, [locale, mapReady])

    // User location marker — smoothly update position
    useEffect(() => {
        if (!map.current || !mapReady || !userLocation || !mapboxglRef.current) return

        if (userMarkerRef.current) {
            userMarkerRef.current.setLngLat([userLocation.lng, userLocation.lat])
        } else {
            userMarkerRef.current = new mapboxglRef.current.Marker({ element: buildUserEl() })
                .setLngLat([userLocation.lng, userLocation.lat])
                .addTo(map.current)
        }

        // When the first REAL GPS position arrives, fly to it
        if (userLocation.isReal && !hasCenteredOnReal.current) {
            hasCenteredOnReal.current = true
            map.current.flyTo({
                center: [userLocation.lng, userLocation.lat],
                zoom: 13,
                duration: 1500,
            })
        }
    }, [mapReady, userLocation])

    // Parking markers
    useEffect(() => {
        if (!map.current || !mapReady || !mapboxglRef.current) return

        markersRef.current.forEach((m) => m.remove())
        markersRef.current = []

        parkings.forEach((parking) => {
            const isNearest = nearestParking && parking.id === nearestParking.id
            const isSelected = selectedParking && parking.id === selectedParking.id

            const el = buildMarkerEl(parking, isNearest, isSelected)
            el.addEventListener('click', () => {
                onSelectParking(parking)
                map.current?.flyTo({ center: [parking.lng, parking.lat], zoom: 15, duration: 800 })
            })

            const marker = new mapboxglRef.current.Marker({ element: el, anchor: 'bottom' })
                .setLngLat([parking.lng, parking.lat])
                .addTo(map.current)

            markersRef.current.push(marker)
        })
    }, [parkings, mapReady, nearestParking, selectedParking, onSelectParking])

    // Fly to selected
    useEffect(() => {
        if (!map.current || !selectedParking) return
        map.current.flyTo({ center: [selectedParking.lng, selectedParking.lat], zoom: 15, duration: 800 })
    }, [selectedParking])

    // Expose centerOnUser
    useEffect(() => {
        if (onCenterUser) {
            onCenterUser.current = () => {
                if (map.current && userLocation) {
                    map.current.flyTo({
                        center: [userLocation.lng, userLocation.lat],
                        zoom: 14,
                        duration: 1200,
                    })
                }
            }
        }
    })

    if (!MAPBOX_TOKEN) {
        return (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' }}>
                <p style={{ color: '#ef4444', fontWeight: 600 }}>Set NEXT_PUBLIC_MAPBOX_TOKEN in .env</p>
            </div>
        )
    }

    return (
        <div style={{ position: 'absolute', inset: 0 }}>
            <div ref={mapContainer} style={{ position: 'absolute', inset: 0 }} />

            {error && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', zIndex: 10 }}>
                    <p style={{ color: '#ef4444', fontWeight: 600 }}>Map error: {error}</p>
                </div>
            )}

            {!error && !mapReady && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', zIndex: 10 }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ width: 40, height: 40, border: '4px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
                        <p style={{ color: '#6b7280', fontSize: 14 }}>Loading map...</p>
                        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ParkingMap
