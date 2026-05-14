'use client'
import { useRef, useEffect } from 'react'
import { CameraControls } from '@react-three/drei'
import * as THREE from 'three'
import useParkingStore from './store'

/**
 * Programmatic camera with CameraControls.
 * Supports three modes: orbit, topDown, firstPerson.
 * Smoothly flies to focusTarget when a slot is selected.
 * Restricts polar angle to prevent clipping under the ground.
 */
const CameraController = () => {
    const controlsRef = useRef(null)
    const focusTarget = useParkingStore(s => s.focusTarget)
    const cameraMode = useParkingStore(s => s.cameraMode)
    const prevModeRef = useRef(cameraMode)

    // Initial setup — stronger wheel zoom + zoom toward cursor
    useEffect(() => {
        const c = controlsRef.current
        if (!c) return
        c.minPolarAngle = 0.2
        c.maxPolarAngle = Math.PI / 2.15
        c.minDistance = 4
        c.maxDistance = 160
        c.dollySpeed = 3.2
        c.dollyToCursor = true
        c.truckSpeed = 1.0
    }, [])

    // Camera mode switching
    useEffect(() => {
        const c = controlsRef.current
        if (!c) return

        const prev = prevModeRef.current
        prevModeRef.current = cameraMode

        switch (cameraMode) {
            case 'topDown': {
                // Lock to pure top-down view
                c.minPolarAngle = 0
                c.maxPolarAngle = 0.05
                c.minDistance = 10
                c.maxDistance = 220
                c.dollySpeed = 4.2
                c.dollyToCursor = true
                c.truckSpeed = 2.0
                // Animate to top-down position
                c.setLookAt(0, 60, 0.1, 0, 0, 0, true)
                break
            }
            case 'firstPerson': {
                // Lock to human-height perspective
                c.minPolarAngle = Math.PI / 4
                c.maxPolarAngle = Math.PI / 2.05
                c.minDistance = 1
                c.maxDistance = 18
                c.dollySpeed = 1.4
                c.dollyToCursor = true
                c.truckSpeed = 3.0
                // Animate to ground-level
                c.setLookAt(0, 1.7, 12, 0, 1.7, 0, true)
                break
            }
            case 'orbit':
            default: {
                // Restore standard orbit settings
                c.minPolarAngle = 0.2
                c.maxPolarAngle = Math.PI / 2.15
                c.minDistance = 4
                c.maxDistance = 160
                c.dollySpeed = 3.2
                c.dollyToCursor = true
                c.truckSpeed = 1.0
                // Only animate back if switching from another mode
                if (prev !== 'orbit') {
                    c.setLookAt(20, 25, 25, 0, 0, 0, true)
                }
                break
            }
        }
    }, [cameraMode])

    // Fly-to-slot animation
    useEffect(() => {
        const c = controlsRef.current
        if (!c || !focusTarget) return

        const { x, y, z } = focusTarget.position

        if (cameraMode === 'firstPerson') {
            // Walk to the slot at human height
            c.setLookAt(x, 1.7, z + 6, x, 1.0, z, true)
        } else if (cameraMode === 'topDown') {
            // Pan to slot from above
            c.setLookAt(x, 60, 0.1, x, 0, z, true)
        } else {
            // Default orbit: look from above-right
            const camOffset = new THREE.Vector3(x + 4, y + 6, z + 5)
            c.setLookAt(camOffset.x, camOffset.y, camOffset.z, x, y, z, true)
        }
    }, [focusTarget, cameraMode])

    return (
        <CameraControls
            ref={controlsRef}
            makeDefault
            smoothTime={0.1}
            dollyToCursor
        />
    )
}

export default CameraController

