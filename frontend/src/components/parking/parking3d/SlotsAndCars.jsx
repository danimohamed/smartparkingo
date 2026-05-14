'use client'
import { useRef, useMemo, useEffect, useCallback, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { Select } from '@react-three/postprocessing'
import * as THREE from 'three'
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js'
import useParkingStore from './store'
import {
    STATUS_COLORS,
    SLOT,
    CAR,
    ROW_TOP_PREFIXES,
    HIGHLIGHT_COLOR,
} from './constants'

const _tempObj = new THREE.Object3D()
const _tempColor = new THREE.Color()
const _targetColor = new THREE.Color()

/**
 * Compute world-space position for each slot based on slotNumber prefix.
 * Top row (A-C): z < 0 (above lane), Bottom row (D-E): z > 0 (below lane).
 */
function computeSlotPositions(slots) {
    const top = []
    const bot = []

    slots.forEach(s => {
        const prefix = s.slotNumber.split('-')[0]
        if (ROW_TOP_PREFIXES.includes(prefix)) top.push(s)
        else bot.push(s)
    })

    top.sort((a, b) => a.slotNumber.localeCompare(b.slotNumber))
    bot.sort((a, b) => a.slotNumber.localeCompare(b.slotNumber))

    const positions = {}
    const stride = SLOT.WIDTH + SLOT.GAP

    // Top row
    const topOffset = -(top.length * stride) / 2 + SLOT.WIDTH / 2
    top.forEach((s, i) => {
        positions[s.id] = {
            x: topOffset + i * stride,
            y: SLOT.HEIGHT / 2,
            z: -(SLOT.LANE_WIDTH / 2 + SLOT.DEPTH / 2),
        }
    })

    // Bottom row
    const botOffset = -(bot.length * stride) / 2 + SLOT.WIDTH / 2
    bot.forEach((s, i) => {
        positions[s.id] = {
            x: botOffset + i * stride,
            y: SLOT.HEIGHT / 2,
            z: SLOT.LANE_WIDTH / 2 + SLOT.DEPTH / 2,
        }
    })

    return positions
}

/* ── Instanced slot pads ──────────────────────────────────── */
const SlotPads = memo(({ slots, positions }) => {
    const meshRef = useRef()
    const hoveredId = useParkingStore(s => s.hoveredSlotId)
    const selectedId = useParkingStore(s => s.selectedSlotId)
    const filterStatus = useParkingStore(s => s.filterStatus)
    const hoverSlot = useParkingStore(s => s.hoverSlot)
    const unhoverSlot = useParkingStore(s => s.unhoverSlot)
    const selectSlot = useParkingStore(s => s.selectSlot)
    const setFocusTarget = useParkingStore(s => s.setFocusTarget)

    const count = slots.length
    const slotGeom = useMemo(() => new THREE.BoxGeometry(SLOT.WIDTH, SLOT.HEIGHT, SLOT.DEPTH), [])
    const slotMat = useMemo(() => new THREE.MeshStandardMaterial({
        roughness: 0.65,
        metalness: 0.05,
        toneMapped: true,
        transparent: true,
    }), [])

    // Index map: instanceId → slot
    const indexMap = useMemo(() => {
        const m = {}
        slots.forEach((s, i) => { m[i] = s })
        return m
    }, [slots])

    // Set transforms & colors — also recompute bounding sphere so raycasts
    // work immediately after a floor switch (InstancedMesh needs updated bounds).
    useEffect(() => {
        if (!meshRef.current || count === 0) return
        slots.forEach((slot, i) => {
            const p = positions[slot.id]
            if (!p) return
            _tempObj.position.set(p.x, p.y, p.z)
            _tempObj.updateMatrix()
            meshRef.current.setMatrixAt(i, _tempObj.matrix)

            const col = STATUS_COLORS[slot.status] || STATUS_COLORS.MAINTENANCE
            meshRef.current.setColorAt(i, col)
        })
        meshRef.current.instanceMatrix.needsUpdate = true
        if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
        // Recompute bounding volumes so raycasting works on new instances
        meshRef.current.computeBoundingBox()
        meshRef.current.computeBoundingSphere()
    }, [slots, positions, count])

    // Animate hover/selection highlight + filter dimming per-frame (throttled)
    const frameCount = useRef(0)
    useFrame(() => {
        if (!meshRef.current) return
        // Throttle: update every 2nd frame for performance
        frameCount.current++
        if (frameCount.current % 2 !== 0) return

        let needsUpdate = false
        const isFiltering = filterStatus !== 'ALL'

        slots.forEach((slot, i) => {
            const isDimmed = isFiltering && slot.status !== filterStatus

            if (slot.id === selectedId) {
                _targetColor.copy(HIGHLIGHT_COLOR)
            } else if (slot.id === hoveredId) {
                _targetColor.copy(STATUS_COLORS[slot.status] || STATUS_COLORS.MAINTENANCE).lerp(HIGHLIGHT_COLOR, 0.4)
            } else {
                _targetColor.copy(STATUS_COLORS[slot.status] || STATUS_COLORS.MAINTENANCE)
            }

            // Dim filtered-out slots
            if (isDimmed) {
                _targetColor.multiplyScalar(0.3)
            }

            meshRef.current.getColorAt(i, _tempColor)
            if (!_tempColor.equals(_targetColor)) {
                _tempColor.lerp(_targetColor, 0.15)
                meshRef.current.setColorAt(i, _tempColor)
                needsUpdate = true
            }
        })

        if (needsUpdate && meshRef.current.instanceColor) {
            meshRef.current.instanceColor.needsUpdate = true
        }
    })

    const handlePointer = useCallback((e, type) => {
        e.stopPropagation()
        const idx = e.instanceId
        if (idx === undefined || idx === null) return
        const slot = indexMap[idx]
        if (!slot) return

        if (type === 'over') {
            hoverSlot(slot.id)
            document.body.style.cursor = 'pointer'
        } else if (type === 'out') {
            unhoverSlot()
            document.body.style.cursor = 'default'
        } else if (type === 'click') {
            selectSlot(slot.id)
            const p = positions[slot.id]
            if (p) setFocusTarget({ position: { x: p.x, y: p.y, z: p.z } })
        }
    }, [indexMap, positions, hoverSlot, unhoverSlot, selectSlot, setFocusTarget])

    return (
        <instancedMesh
            ref={meshRef}
            args={[slotGeom, slotMat, count]}
            castShadow
            receiveShadow
            frustumCulled
            onPointerOver={(e) => handlePointer(e, 'over')}
            onPointerOut={(e) => handlePointer(e, 'out')}
            onClick={(e) => handlePointer(e, 'click')}
        />
    )
})
SlotPads.displayName = 'SlotPads'

/* ── Instanced car bodies (for occupied/reserved slots) ─────── */
const CarInstances = memo(({ slots, positions }) => {
    const meshRef = useRef()
    const scalesRef = useRef({})

    const occupiedSlots = useMemo(
        () => slots.filter(s => s.status === 'OCCUPIED' || s.status === 'RESERVED'),
        [slots],
    )

    // Reset scales whenever the slot set changes (floor switch)
    useEffect(() => {
        scalesRef.current = {}
    }, [slots])

    const count = occupiedSlots.length

    // Merged body + roof geometry for a more realistic silhouette
    const carGeom = useMemo(() => {
        const body = new THREE.BoxGeometry(CAR.WIDTH, CAR.HEIGHT * 0.5, CAR.DEPTH)
        body.translate(0, 0, 0)
        const roof = new THREE.BoxGeometry(CAR.WIDTH * 0.75, CAR.HEIGHT * 0.4, CAR.DEPTH * 0.52)
        roof.translate(0, CAR.HEIGHT * 0.45, -CAR.DEPTH * 0.06)
        try {
            const merged = BufferGeometryUtils.mergeGeometries([body, roof])
            return merged || body
        } catch (_) {
            return body
        }
    }, [])

    const carMat = useMemo(() => new THREE.MeshStandardMaterial({
        roughness: 0.25,
        metalness: 0.7,
        toneMapped: true,
        envMapIntensity: 1.2,
    }), [])

    // Position cars on occupied slots + spring-in scale animation
    useEffect(() => {
        if (!meshRef.current || count === 0) return
        const palette = [0x1e293b, 0xfafafa, 0xdc2626, 0x2563eb, 0x6b7280, 0x0f172a, 0xfbbf24, 0x7c3aed, 0x059669]

        occupiedSlots.forEach((slot, i) => {
            const p = positions[slot.id]
            if (!p) return
            // Start at scale 0 for spring-in animation
            const currentScale = scalesRef.current[slot.id] || 0
            const s = currentScale < 0.01 ? 0.01 : currentScale
            scalesRef.current[slot.id] = s

            _tempObj.position.set(p.x, p.y + SLOT.HEIGHT / 2 + CAR.HEIGHT * 0.25, p.z)
            _tempObj.scale.set(s, s, s)
            _tempObj.updateMatrix()
            meshRef.current.setMatrixAt(i, _tempObj.matrix)

            const col = palette[slot.id % palette.length]
            meshRef.current.setColorAt(i, _tempColor.setHex(col))
        })
        meshRef.current.instanceMatrix.needsUpdate = true
        if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
    }, [occupiedSlots, positions, count])

    // Animate spring-in scale
    useFrame(() => {
        if (!meshRef.current || count === 0) return
        let needsUpdate = false

        occupiedSlots.forEach((slot, i) => {
            const p = positions[slot.id]
            if (!p) return

            const current = scalesRef.current[slot.id] || 0
            if (current >= 0.99) return

            // Elastic spring interpolation
            const next = current + (1 - current) * 0.08
            scalesRef.current[slot.id] = next > 0.99 ? 1 : next

            _tempObj.position.set(p.x, p.y + SLOT.HEIGHT / 2 + CAR.HEIGHT * 0.25, p.z)
            _tempObj.scale.setScalar(scalesRef.current[slot.id])
            _tempObj.updateMatrix()
            meshRef.current.setMatrixAt(i, _tempObj.matrix)
            needsUpdate = true
        })

        if (needsUpdate) {
            meshRef.current.instanceMatrix.needsUpdate = true
        }
    })

    if (count === 0) return null

    return (
        <instancedMesh
            ref={meshRef}
            args={[carGeom, carMat, count]}
            castShadow
            frustumCulled
        />
    )
})
CarInstances.displayName = 'CarInstances'

/* ── Slot number labels using drei <Text> (GPU-rendered, fast) ── */
const SlotLabels = memo(({ slots, positions }) => {
    const showLabels = useParkingStore(s => s.showLabels)
    const selectedId = useParkingStore(s => s.selectedSlotId)
    const hoveredId = useParkingStore(s => s.hoveredSlotId)

    if (!showLabels) return null

    return (
        <group>
            {slots.map(slot => {
                const p = positions[slot.id]
                if (!p) return null
                const isActive = slot.id === selectedId || slot.id === hoveredId
                return (
                    <Text
                        key={slot.id}
                        position={[p.x, p.y + 0.15, p.z]}
                        rotation-x={-Math.PI / 2}
                        fontSize={isActive ? 0.5 : 0.35}
                        color={isActive ? '#ffffff' : '#d4d4d8'}
                        anchorX="center"
                        anchorY="middle"
                        outlineWidth={isActive ? 0.03 : 0}
                        outlineColor="#000000"
                        font={undefined}
                    >
                        {slot.slotNumber}
                    </Text>
                )
            })}
        </group>
    )
})
SlotLabels.displayName = 'SlotLabels'

/* ── Slot divider lines (white markings between slots) ────── */
const SlotMarkings = memo(({ slots, positions }) => {
    const lines = useMemo(() => {
        const result = []
        slots.forEach(slot => {
            const p = positions[slot.id]
            if (!p) return
            // Left edge line
            result.push({
                key: `${slot.id}-l`,
                pos: [p.x - SLOT.WIDTH / 2, 0.006, p.z],
                size: [0.06, SLOT.DEPTH - 0.3],
            })
            // Right edge line
            result.push({
                key: `${slot.id}-r`,
                pos: [p.x + SLOT.WIDTH / 2, 0.006, p.z],
                size: [0.06, SLOT.DEPTH - 0.3],
            })
        })
        return result
    }, [slots, positions])

    return (
        <group>
            {lines.map(l => (
                <mesh key={l.key} rotation-x={-Math.PI / 2} position={l.pos} receiveShadow>
                    <planeGeometry args={l.size} />
                    <meshStandardMaterial color="#ffffff" roughness={0.8} opacity={0.7} transparent />
                </mesh>
            ))}
        </group>
    )
})
SlotMarkings.displayName = 'SlotMarkings'

/* ── Hovered/Selected slot outline wrapper ──────────────────── */
const SlotOutlineWrapper = memo(({ slots, positions }) => {
    const hoveredId = useParkingStore(s => s.hoveredSlotId)
    const selectedId = useParkingStore(s => s.selectedSlotId)

    const activeSlots = useMemo(
        () => slots.filter(s => s.id === hoveredId || s.id === selectedId),
        [slots, hoveredId, selectedId],
    )

    if (activeSlots.length === 0) return null

    return (
        <>
            {activeSlots.map(slot => {
                const p = positions[slot.id]
                if (!p) return null
                const isSelected = slot.id === selectedId
                return (
                    <Select key={slot.id} enabled>
                        <mesh
                            position={[p.x, p.y + 0.01, p.z]}
                            castShadow={false}
                            receiveShadow={false}
                        >
                            <boxGeometry args={[SLOT.WIDTH + 0.1, SLOT.HEIGHT + 0.05, SLOT.DEPTH + 0.1]} />
                            <meshStandardMaterial
                                color={isSelected ? '#3b82f6' : '#60a5fa'}
                                transparent
                                opacity={0}
                                depthWrite={false}
                            />
                        </mesh>
                    </Select>
                )
            })}
        </>
    )
})
SlotOutlineWrapper.displayName = 'SlotOutlineWrapper'

/* ── Main exported component ──────────────────────────────── */
const SlotsAndCars = () => {
    const floorSlots = useParkingStore(s => s.floorSlots)
    const activeFloor = useParkingStore(s => s.activeFloor)

    const positions = useMemo(
        () => computeSlotPositions(floorSlots),
        [floorSlots],
    )

    if (floorSlots.length === 0) return null

    // key={activeFloor} forces full remount of every InstancedMesh when
    // the user switches floors. Without this, the old instancedMesh keeps
    // stale instance count and positions, breaking raycasts on new floors.
    return (
        <group key={activeFloor}>
            <SlotPads slots={floorSlots} positions={positions} />
            <CarInstances slots={floorSlots} positions={positions} />
            <SlotMarkings slots={floorSlots} positions={positions} />
            <SlotLabels slots={floorSlots} positions={positions} />
            <SlotOutlineWrapper slots={floorSlots} positions={positions} />
        </group>
    )
}

export default SlotsAndCars

