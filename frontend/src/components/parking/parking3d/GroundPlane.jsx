'use client'
import { useMemo } from 'react'
import { Shape, ShapeGeometry } from 'three'
import { SLOT } from './constants'

/**
 * Ground plane + lane stripe markings + directional arrows.
 * PBR concrete-like material, no external textures needed.
 */
const GroundPlane = ({ slotCount = 50 }) => {
    const slotsPerRow = Math.ceil(slotCount * 0.6)
    const totalWidth = Math.max(slotsPerRow * (SLOT.WIDTH + SLOT.GAP) + 6, 40)
    const totalDepth = SLOT.DEPTH * 2 + SLOT.LANE_WIDTH + 10

    // Arrow positions along the lane
    const arrows = useMemo(() => {
        const count = Math.floor(totalWidth / 6)
        const result = []
        for (let i = 0; i < count; i++) {
            result.push(-totalWidth / 2 + 5 + i * 6)
        }
        return result
    }, [totalWidth])

    // Arrow shape geometry (triangle)
    const arrowShape = useMemo(() => {
        const shape = new Shape()
        shape.moveTo(0, 0.5)
        shape.lineTo(-0.35, -0.3)
        shape.lineTo(-0.12, -0.3)
        shape.lineTo(-0.12, -0.5)
        shape.lineTo(0.12, -0.5)
        shape.lineTo(0.12, -0.3)
        shape.lineTo(0.35, -0.3)
        shape.closePath()
        return new ShapeGeometry(shape)
    }, [])

    return (
        <group>
            {/* Main ground */}
            <mesh
                rotation-x={-Math.PI / 2}
                position={[0, -0.01, 0]}
                receiveShadow
            >
                <planeGeometry args={[totalWidth, totalDepth]} />
                <meshStandardMaterial
                    color="#3a3a3c"
                    roughness={0.92}
                    metalness={0.02}
                />
            </mesh>

            {/* Sidewalk/curb strip (slightly lighter border) */}
            <mesh
                rotation-x={-Math.PI / 2}
                position={[0, -0.005, 0]}
                receiveShadow
            >
                <planeGeometry args={[totalWidth + 4, totalDepth + 4]} />
                <meshStandardMaterial
                    color="#52525b"
                    roughness={0.95}
                    metalness={0.01}
                />
            </mesh>

            {/* Lane stripe — center dashed line */}
            {Array.from({ length: Math.ceil(totalWidth / 2.4) }, (_, i) => (
                <mesh
                    key={`stripe-${i}`}
                    rotation-x={-Math.PI / 2}
                    position={[-totalWidth / 2 + i * 2.4 + 0.6, 0.005, 0]}
                    receiveShadow
                >
                    <planeGeometry args={[1.2, 0.15]} />
                    <meshStandardMaterial color="#fbbf24" roughness={0.7} />
                </mesh>
            ))}

            {/* Directional arrows on the lane */}
            {arrows.map((x, i) => (
                <mesh
                    key={`arrow-${i}`}
                    geometry={arrowShape}
                    rotation-x={-Math.PI / 2}
                    rotation-z={Math.PI / 2}
                    position={[x, 0.007, 0]}
                >
                    <meshStandardMaterial
                        color="#ffffff"
                        roughness={0.7}
                        transparent
                        opacity={0.35}
                    />
                </mesh>
            ))}

            {/* Outer boundary lines */}
            {[-1, 1].map(side => (
                <mesh
                    key={`bound-${side}`}
                    rotation-x={-Math.PI / 2}
                    position={[0, 0.004, side * (totalDepth / 2 - 0.5)]}
                    receiveShadow
                >
                    <planeGeometry args={[totalWidth - 2, 0.1]} />
                    <meshStandardMaterial color="#e5e7eb" roughness={0.8} />
                </mesh>
            ))}

            {/* Lane edge solid lines */}
            {[-1, 1].map(side => (
                <mesh
                    key={`lane-${side}`}
                    rotation-x={-Math.PI / 2}
                    position={[0, 0.005, side * (SLOT.LANE_WIDTH / 2 + 0.1)]}
                    receiveShadow
                >
                    <planeGeometry args={[totalWidth - 4, 0.08]} />
                    <meshStandardMaterial color="#fafafa" roughness={0.7} transparent opacity={0.5} />
                </mesh>
            ))}
        </group>
    )
}

export default GroundPlane

