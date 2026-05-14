'use client'
import { Suspense, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import {
    Environment,
    ContactShadows,
    BakeShadows,
    Preload,
    PerformanceMonitor,
} from '@react-three/drei'
import {
    Selection,
    EffectComposer,
    Bloom,
    Outline,
    SMAA,
} from '@react-three/postprocessing'
import * as THREE from 'three'
import CameraController from './CameraController'
import SlotsAndCars from './SlotsAndCars'
import GroundPlane from './GroundPlane'
import EntryExitMarkers from './EntryExitMarkers'
import BuildingShell from './BuildingShell'
import ParkingOverlay from './ParkingOverlay'
import LoadingScreen from './LoadingScreen'
import useParkingStore from './store'
import useRealtimeMock from './useRealtimeMock'

/**
 * Inner scene contents — everything inside <Canvas>.
 */
const SceneContents = () => {
    const floorSlots = useParkingStore(s => s.floorSlots)

    return (
        <Selection>
            {/* Camera */}
            <CameraController />

            {/* Lighting — directional with soft shadows */}
            <ambientLight intensity={0.4} />
            <directionalLight
                position={[20, 30, 15]}
                intensity={1.6}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
                shadow-camera-near={0.5}
                shadow-camera-far={80}
                shadow-camera-left={-40}
                shadow-camera-right={40}
                shadow-camera-top={40}
                shadow-camera-bottom={-40}
                shadow-bias={-0.0005}
            />
            <directionalLight
                position={[-10, 15, -10]}
                intensity={0.3}
            />

            {/* Fill light from below to soften harsh shadows */}
            <hemisphereLight
                color="#b1e1ff"
                groundColor="#2a2a2e"
                intensity={0.35}
            />

            {/* Environment map for PBR reflections */}
            <Environment preset="city" background={false} />

            {/* Contact shadows for soft ground AO effect */}
            <ContactShadows
                position={[0, 0.01, 0]}
                opacity={0.35}
                scale={80}
                blur={2}
                far={20}
                resolution={512}
            />

            {/* Ground */}
            <GroundPlane slotCount={floorSlots.length} />

            {/* Building shell (pillars + walls, open top) */}
            <BuildingShell slotCount={floorSlots.length} />

            {/* Entry / Exit pillars */}
            <EntryExitMarkers slotCount={Math.ceil(floorSlots.length * 0.6)} />

            {/* Instanced slots + cars + outline selection */}
            <SlotsAndCars />

            {/* Post-processing: Bloom + Outline on hover/select */}
            <EffectComposer multisampling={0} autoClear={false}>
                <Bloom
                    luminanceThreshold={0.9}
                    luminanceSmoothing={0.4}
                    intensity={0.15}
                    mipmapBlur
                />
                <Outline
                    blur
                    edgeStrength={3}
                    pulseSpeed={0.4}
                    visibleEdgeColor={0x3b82f6}
                    hiddenEdgeColor={0x1d4ed8}
                    xRay={false}
                />
                <SMAA />
            </EffectComposer>

            {/* Bake static shadows for perf */}
            <BakeShadows />
            <Preload all />
        </Selection>
    )
}

/**
 * ParkingScene — main exported component.
 * Wraps the R3F Canvas + 2D overlay + data loading.
 */
const ParkingScene = ({ parking, parkingId, onReserve, onBack, fullscreen = false }) => {
    const loadSlots = useParkingStore(s => s.loadSlots)
    const connectRealtime = useParkingStore(s => s.connectRealtime)
    const disconnectRealtime = useParkingStore(s => s.disconnectRealtime)
    const setParking = useParkingStore(s => s.setParking)
    const loading = useParkingStore(s => s.loading)
    const deselectSlot = useParkingStore(s => s.deselectSlot)

    // Mock real-time updates (only active when NEXT_PUBLIC_MOCK_REALTIME=true)
    useRealtimeMock(true)

    // Load data on mount
    useEffect(() => {
        if (parking) setParking(parking)
        if (parkingId) loadSlots(parkingId)
    }, [parkingId, parking])

    // Real-time connection (SSE → polling fallback)
    useEffect(() => {
        if (!parkingId) return
        connectRealtime(parkingId)
        return () => disconnectRealtime()
    }, [parkingId])

    return (
        <div
            className={`relative w-full touch-none overflow-hidden bg-gray-900 ${
                fullscreen
                    ? 'h-dvh'
                    : 'rounded-2xl border border-gray-200/60 dark:border-gray-700/50'
            }`}
            style={fullscreen ? undefined : { height: 600 }}
        >
            {/* R3F Canvas */}
            <Canvas
                shadows
                dpr={[1, 1.5]}
                gl={{
                    antialias: true,
                    toneMapping: THREE.ACESFilmicToneMapping,
                    toneMappingExposure: 1.1,
                    outputColorSpace: THREE.SRGBColorSpace,
                    powerPreference: 'high-performance',
                }}
                camera={{
                    position: [20, 25, 25],
                    fov: 45,
                    near: 0.1,
                    far: 200,
                }}
                onPointerMissed={deselectSlot}
            >
                {/* Auto-adjust DPR based on frame rate */}
                <PerformanceMonitor
                    onIncline={() => {}}
                    onDecline={() => {}}
                    flipflops={3}
                    bounds={(refreshrate) => [refreshrate * 0.5, refreshrate * 0.9]}
                />
                <Suspense fallback={null}>
                    <SceneContents />
                </Suspense>
            </Canvas>

            {/* Loading overlay */}
            <LoadingScreen />

            {/* 2D UI overlay */}
            {!loading && <ParkingOverlay onReserve={onReserve} onBack={onBack} />}

            {/* Controls hint */}
            <div className="absolute bottom-3 right-3 z-10 max-w-[14rem] text-right font-mono text-[9px] leading-relaxed text-cyan-100/45 select-none pointer-events-none">
                Orbit · Scroll zoom · Click slot
                <span className="block text-slate-500/80">↑ next floor · ↓ prev (when not typing)</span>
            </div>
        </div>
    )
}

export default ParkingScene
