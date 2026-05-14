/**
 * parking3d/BuildingShell.jsx
 * Translucent architectural enclosure — pillars, walls, entry ramp (no ceiling for clear top view).
 * Provides spatial context & photorealistic architectural-viz feel.
 */
'use client'
import { useMemo } from 'react'
import * as THREE from 'three'
import { SLOT } from './constants'

const PILLAR_RADIUS = 0.25
const PILLAR_HEIGHT = 3.5
const PILLAR_COLOR = '#d4d4d8'
const WALL_COLOR = '#a1a1aa'
const WALL_OPACITY = 0.08

const BuildingShell = ({ slotCount = 50 }) => {
    const slotsPerRow = Math.ceil(slotCount * 0.6)
    const totalWidth = Math.max(slotsPerRow * (SLOT.WIDTH + SLOT.GAP) + 6, 40)
    const totalDepth = SLOT.DEPTH * 2 + SLOT.LANE_WIDTH + 10

    const pillars = useMemo(() => {
        const result = []
        const cols = Math.floor(totalWidth / 8) + 1
        const zPositions = [
            -totalDepth / 2 + 1,
            0,
            totalDepth / 2 - 1,
        ]

        for (let c = 0; c < cols; c++) {
            const x = -totalWidth / 2 + 3 + c * ((totalWidth - 6) / (cols - 1 || 1))
            for (const z of zPositions) {
                result.push({ x, z, key: `p-${c}-${z}` })
            }
        }
        return result
    }, [totalWidth, totalDepth])

    return (
        <group>
            {/* ── Structural pillars ───────────────────────────── */}
            {pillars.map(p => (
                <mesh
                    key={p.key}
                    position={[p.x, PILLAR_HEIGHT / 2, p.z]}
                    castShadow
                    receiveShadow
                >
                    <cylinderGeometry args={[PILLAR_RADIUS, PILLAR_RADIUS, PILLAR_HEIGHT, 8]} />
                    <meshStandardMaterial
                        color={PILLAR_COLOR}
                        roughness={0.85}
                        metalness={0.05}
                    />
                </mesh>
            ))}

            {/* ── Translucent walls (left & right) ─────────────── */}
            {[-1, 1].map(side => (
                <mesh
                    key={`wall-${side}`}
                    position={[side * (totalWidth / 2 + 1), PILLAR_HEIGHT / 2, 0]}
                    receiveShadow
                >
                    <boxGeometry args={[0.1, PILLAR_HEIGHT, totalDepth + 2]} />
                    <meshStandardMaterial
                        color={WALL_COLOR}
                        roughness={0.7}
                        transparent
                        opacity={WALL_OPACITY}
                        side={THREE.DoubleSide}
                    />
                </mesh>
            ))}

            {/* ── Back wall ────────────────────────────────────── */}
            <mesh
                position={[0, PILLAR_HEIGHT / 2, -(totalDepth / 2 + 1)]}
                receiveShadow
            >
                <boxGeometry args={[totalWidth + 2, PILLAR_HEIGHT, 0.1]} />
                <meshStandardMaterial
                    color={WALL_COLOR}
                    roughness={0.7}
                    transparent
                    opacity={WALL_OPACITY}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* ── Entry/Exit ramp indicator (ground-level) ───── */}
            <mesh
                rotation-x={-Math.PI / 2}
                position={[0, 0.003, totalDepth / 2 + 1.5]}
            >
                <planeGeometry args={[8, 3]} />
                <meshStandardMaterial
                    color="#3b82f6"
                    roughness={0.7}
                    transparent
                    opacity={0.15}
                />
            </mesh>

            {/* ── Directional arrows on ramp ────────────────── */}
            {[-2, 0, 2].map((offset, i) => (
                <mesh
                    key={`arrow-${i}`}
                    rotation-x={-Math.PI / 2}
                    position={[offset, 0.007, totalDepth / 2 + 1.5]}
                >
                    <coneGeometry args={[0.3, 0.8, 3]} />
                    <meshStandardMaterial
                        color="#3b82f6"
                        transparent
                        opacity={0.4}
                    />
                </mesh>
            ))}

            {/* ── Pillar base rings (architectural detail) ──── */}
            {pillars.map(p => (
                <mesh
                    key={`base-${p.key}`}
                    position={[p.x, 0.05, p.z]}
                    rotation-x={-Math.PI / 2}
                >
                    <ringGeometry args={[PILLAR_RADIUS, PILLAR_RADIUS + 0.15, 16]} />
                    <meshStandardMaterial
                        color="#a1a1aa"
                        roughness={0.9}
                    />
                </mesh>
            ))}
        </group>
    )
}

export default BuildingShell


