'use client'

import { useEffect, useRef, useState } from 'react'
import { useLocale } from 'next-intl'
import logger from '@/utils/logger'
import { ensureRtlPlugin, applyMapLanguage } from '../_utils/mapboxLocale'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''
const MAPBOX_VERSION = '3.4.0'
const DAY_STYLE = 'mapbox://styles/mapbox/streets-v12'
const NIGHT_STYLE = 'mapbox://styles/mapbox/navigation-night-v1'

function loadMapboxFromCDN() {
    return new Promise((resolve, reject) => {
        if (window.mapboxgl) return resolve(window.mapboxgl)
        if (!document.getElementById('mapbox-cdn-css')) {
            const link = document.createElement('link')
            link.id = 'mapbox-cdn-css'
            link.rel = 'stylesheet'
            link.href = `https://api.mapbox.com/mapbox-gl-js/v${MAPBOX_VERSION}/mapbox-gl.css`
            document.head.appendChild(link)
        }
        if (!document.getElementById('mapbox-cdn-js')) {
            const script = document.createElement('script')
            script.id = 'mapbox-cdn-js'
            script.src = `https://api.mapbox.com/mapbox-gl-js/v${MAPBOX_VERSION}/mapbox-gl.js`
            script.onload = () => resolve(window.mapboxgl)
            script.onerror = () => reject(new Error('Failed to load Mapbox'))
            document.head.appendChild(script)
        } else {
            const poll = setInterval(() => {
                if (window.mapboxgl) { clearInterval(poll); resolve(window.mapboxgl) }
            }, 100)
            setTimeout(() => { clearInterval(poll); reject(new Error('Timeout')) }, 10000)
        }
    })
}

/** Build a car-shaped SVG marker that rotates with bearing */
function buildCarMarker() {
    const el = document.createElement('div')
    el.className = 'nav-car-marker'
    el.innerHTML = `
        <div style="position:relative;width:48px;height:48px;">
            <div style="position:absolute;inset:0;border-radius:50%;background:rgba(66,133,244,0.12);animation:navPulse 2s ease infinite;"></div>
            <div style="position:absolute;top:4px;left:4px;width:40px;height:40px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 3px 8px rgba(0,0,0,0.35));">
                <svg width="32" height="32" viewBox="0 0 24 24" class="car-icon" style="transition:transform 0.4s ease">
                    <path d="M5 11l1.5-4.5h11L19 11" stroke="#4285F4" stroke-width="1.5" fill="none" stroke-linecap="round"/>
                    <rect x="4" y="11" width="16" height="7" rx="2" fill="#4285F4"/>
                    <rect x="5" y="12" width="4" height="3" rx="0.5" fill="#B3D4FC" opacity="0.8"/>
                    <rect x="15" y="12" width="4" height="3" rx="0.5" fill="#B3D4FC" opacity="0.8"/>
                    <circle cx="7.5" cy="18.5" r="1.5" fill="#333"/>
                    <circle cx="16.5" cy="18.5" r="1.5" fill="#333"/>
                    <rect x="10" y="6" width="4" height="5" rx="0.5" fill="#B3D4FC" opacity="0.6"/>
                </svg>
            </div>
        </div>
    `
    return el
}

function buildDestinationMarker() {
    const el = document.createElement('div')
    el.innerHTML = `
        <div style="position:relative;">
            <div style="width:48px;height:48px;background:linear-gradient(135deg,#10B981,#059669);border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(16,185,129,0.4);border:3px solid white;">
                <span style="transform:rotate(45deg);color:white;font-weight:800;font-size:16px;">P</span>
            </div>
            <div style="position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);width:16px;height:4px;border-radius:50%;background:rgba(0,0,0,0.15);"></div>
        </div>
    `
    return el
}

const NavigationMap = ({ route, userPos, smoothPos, parking, bearing, arrived, followMode, progressIndex, nightMode }) => {
    const containerRef = useRef(null)
    const mapRef = useRef(null)
    const mapboxglRef = useRef(null)
    const userMarkerRef = useRef(null)
    const destMarkerRef = useRef(null)
    const initialPosRef = useRef(null)
    const currentStyleRef = useRef(DAY_STYLE)
    const routeAddedRef = useRef(false)
    const [ready, setReady] = useState(false)
    const locale = useLocale()

    const displayPos = smoothPos || userPos
    if (!initialPosRef.current && displayPos) {
        initialPosRef.current = { lat: displayPos.lat, lng: displayPos.lng }
    }

    // Inject CSS overrides
    useEffect(() => {
        const id = 'nav-map-styles'
        if (!document.getElementById(id)) {
            const s = document.createElement('style')
            s.id = id
            s.textContent = `
                @keyframes navPulse {
                    0% { transform: scale(1); opacity: 0.6; }
                    50% { transform: scale(1.5); opacity: 0.2; }
                    100% { transform: scale(1); opacity: 0.6; }
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
            document.head.appendChild(s)
        }
    }, [])

    // Initialize map
    useEffect(() => {
        let cancelled = false
        let retryTimer = null

        async function init() {
            const pos = initialPosRef.current
            if (!pos || !MAPBOX_TOKEN || mapRef.current) return

            try {
                const mapboxgl = await loadMapboxFromCDN()
                if (cancelled) return
                mapboxglRef.current = mapboxgl
                mapboxgl.accessToken = MAPBOX_TOKEN
                ensureRtlPlugin(mapboxgl)

                const container = containerRef.current
                if (!container) return

                await new Promise((r) => {
                    let tries = 0
                    const c = () => {
                        if (container.offsetWidth > 0 && container.offsetHeight > 0) return r()
                        if (++tries > 100) return r()
                        requestAnimationFrame(c)
                    }
                    c()
                })
                if (cancelled) return

                const m = new mapboxgl.Map({
                    container,
                    style: nightMode ? NIGHT_STYLE : DAY_STYLE,
                    center: [pos.lng, pos.lat],
                    zoom: 16,
                    pitch: 55,
                    bearing: 0,
                    attributionControl: false,
                    // Moroccan worldview: Western Sahara is rendered as part of
                    // Morocco with no dashed disputed-border line.
                    worldview: 'MA',
                })

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
                    } catch (_) { /* ignore */ }
                    applyMapLanguage(m, locale)
                })

                currentStyleRef.current = nightMode ? NIGHT_STYLE : DAY_STYLE

                m.addControl(new mapboxgl.NavigationControl({ showCompass: true, showZoom: false }), 'top-right')

                m.on('load', () => {
                    if (!cancelled) { setReady(true); m.resize() }
                })

                setTimeout(() => { if (!cancelled) setReady(true) }, 3000)

                ;[200, 500, 1000, 2000].forEach((ms) =>
                    setTimeout(() => { if (m && !m._removed) m.resize() }, ms)
                )

                mapRef.current = m
            } catch (e) {
                logger.error('Nav map init error:', e)
                if (!cancelled) setReady(true)
            }
        }

        if (initialPosRef.current) {
            init()
        } else {
            retryTimer = setInterval(() => {
                if (initialPosRef.current && !mapRef.current) {
                    clearInterval(retryTimer)
                    init()
                }
            }, 50)
            setTimeout(() => { clearInterval(retryTimer); if (!mapRef.current) setReady(true) }, 5000)
        }

        return () => {
            cancelled = true
            if (retryTimer) clearInterval(retryTimer)
            if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
        }
    }, [])

    // Night mode style switch
    useEffect(() => {
        const m = mapRef.current
        if (!m || !ready) return
        const target = nightMode ? NIGHT_STYLE : DAY_STYLE
        if (currentStyleRef.current !== target) {
            currentStyleRef.current = target
            routeAddedRef.current = false
            m.setStyle(target)
        }
    }, [nightMode, ready])

    // Re-add route layers after style change
    useEffect(() => {
        const m = mapRef.current
        if (!m) return
        const handleStyleData = () => {
            if (route?.coordinates && !routeAddedRef.current) {
                addRouteLayers(m, route, progressIndex)
            }
        }
        m.on('styledata', handleStyleData)
        return () => m.off('styledata', handleStyleData)
    }, [route, progressIndex])

    // Re-translate map labels when the user changes app language at runtime.
    useEffect(() => {
        if (!ready || !mapRef.current) return
        applyMapLanguage(mapRef.current, locale)
    }, [locale, ready])

    // Build split route GeoJSON and add layers
    function addRouteLayers(m, routeData, pIdx) {
        if (!routeData?.coordinates || routeData.coordinates.length < 2) return
        try {
            const coords = routeData.coordinates
            const splitIdx = Math.min(Math.max(pIdx || 0, 0), coords.length - 1)

            const completedCoords = coords.slice(0, splitIdx + 1)
            const remainingCoords = coords.slice(splitIdx)

            const completedGeo = { type: 'Feature', geometry: { type: 'LineString', coordinates: completedCoords.length > 1 ? completedCoords : [coords[0], coords[0]] } }
            const remainingGeo = { type: 'Feature', geometry: { type: 'LineString', coordinates: remainingCoords.length > 1 ? remainingCoords : [coords[coords.length - 1], coords[coords.length - 1]] } }

            // Remaining route (blue)
            if (m.getSource('nav-route-remaining')) {
                m.getSource('nav-route-remaining').setData(remainingGeo)
            } else {
                m.addSource('nav-route-remaining', { type: 'geojson', data: remainingGeo })
                m.addLayer({
                    id: 'nav-route-remaining-glow', type: 'line', source: 'nav-route-remaining',
                    layout: { 'line-join': 'round', 'line-cap': 'round' },
                    paint: { 'line-color': '#4285F4', 'line-width': 14, 'line-opacity': 0.15, 'line-blur': 4 },
                })
                m.addLayer({
                    id: 'nav-route-remaining-line', type: 'line', source: 'nav-route-remaining',
                    layout: { 'line-join': 'round', 'line-cap': 'round' },
                    paint: { 'line-color': '#4285F4', 'line-width': 6, 'line-opacity': 0.9 },
                })
            }

            // Completed route (gray)
            if (m.getSource('nav-route-completed')) {
                m.getSource('nav-route-completed').setData(completedGeo)
            } else {
                m.addSource('nav-route-completed', { type: 'geojson', data: completedGeo })
                m.addLayer({
                    id: 'nav-route-completed-line', type: 'line', source: 'nav-route-completed',
                    layout: { 'line-join': 'round', 'line-cap': 'round' },
                    paint: { 'line-color': '#9CA3AF', 'line-width': 5, 'line-opacity': 0.6 },
                })
            }
            routeAddedRef.current = true
        } catch (e) { logger.warn('Route layer error:', e) }
    }

    // Draw/update route polyline with progress split
    useEffect(() => {
        const m = mapRef.current
        if (!m || !ready || !route?.coordinates) return

        const doAdd = () => addRouteLayers(m, route, progressIndex)

        if (m.isStyleLoaded && m.isStyleLoaded()) {
            doAdd()
        } else {
            m.once('load', doAdd)
        }
    }, [route, ready, progressIndex])

    // Fit bounds on initial route
    useEffect(() => {
        const m = mapRef.current
        if (!m || !ready || !route?.coordinates?.length || !mapboxglRef.current) return

        try {
            const bounds = route.coordinates.reduce(
                (b, c) => b.extend(c),
                new mapboxglRef.current.LngLatBounds(route.coordinates[0], route.coordinates[0])
            )
            m.fitBounds(bounds, { padding: { top: 120, bottom: 300, left: 60, right: 60 }, duration: 1000 })
        } catch (e) { logger.warn('fitBounds error:', e) }
        // Only run on route change, not every progressIndex update
    }, [route, ready])

    // Update car marker and camera follow
    useEffect(() => {
        const m = mapRef.current
        if (!m || !ready || !displayPos || !mapboxglRef.current) return

        const markerLng = displayPos.lng
        const markerLat = displayPos.lat

        if (userMarkerRef.current) {
            userMarkerRef.current.setLngLat([markerLng, markerLat])
            const icon = userMarkerRef.current.getElement()?.querySelector('.car-icon')
            if (icon) icon.style.transform = `rotate(${bearing || 0}deg)`
        } else {
            const el = buildCarMarker()
            const icon = el.querySelector('.car-icon')
            if (icon) icon.style.transform = `rotate(${bearing || 0}deg)`
            userMarkerRef.current = new mapboxglRef.current.Marker({
                element: el,
                anchor: 'center',
            }).setLngLat([markerLng, markerLat]).addTo(m)
        }

        // Camera follow
        if (followMode && !arrived) {
            m.easeTo({
                center: [markerLng, markerLat],
                bearing: bearing || 0,
                zoom: 17,
                pitch: 55,
                duration: 800,
                easing: (t) => t,
            })
        }
    }, [displayPos, ready, bearing, arrived, followMode])

    // Destination marker
    useEffect(() => {
        const m = mapRef.current
        if (!m || !ready || !parking || !mapboxglRef.current) return

        if (!destMarkerRef.current) {
            destMarkerRef.current = new mapboxglRef.current.Marker({
                element: buildDestinationMarker(),
                anchor: 'bottom',
            }).setLngLat([parking.lng, parking.lat]).addTo(m)
        }
    }, [parking, ready])

    return (
        <div style={{ position: 'absolute', inset: 0 }}>
            <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
            {!ready && (
                <div style={{
                    position: 'absolute', inset: 0, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    background: '#1a1a2e', zIndex: 10,
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            width: 44, height: 44, border: '4px solid #4285F4',
                            borderTopColor: 'transparent', borderRadius: '50%',
                            animation: 'spin 1s linear infinite', margin: '0 auto 12px',
                        }} />
                        <p style={{ color: '#9CA3AF', fontSize: 14 }}>Loading navigation...</p>
                        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                    </div>
                </div>
            )}
        </div>
    )
}

export default NavigationMap




