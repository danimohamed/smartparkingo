'use client'
import { SLOT } from './constants'

/**
 * 3D Entry and Exit markers — simple pillars with colored tops.
 */
const EntryExitMarkers = ({ slotCount = 10 }) => {
    const halfWidth = (slotCount * (SLOT.WIDTH + SLOT.GAP)) / 2 + 3

    return (
        <group>
            {/* Entry pillar — left side */}
            <group position={[-halfWidth, 0, 0]}>
                <mesh position={[0, 1, 0]} castShadow>
                    <boxGeometry args={[0.3, 2, 0.3]} />
                    <meshStandardMaterial color="#1e40af" roughness={0.5} />
                </mesh>
                <mesh position={[0, 2.2, 0]}>
                    <boxGeometry args={[0.5, 0.3, 0.5]} />
                    <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.3} />
                </mesh>
            </group>

            {/* Exit pillar — right side */}
            <group position={[halfWidth, 0, 0]}>
                <mesh position={[0, 1, 0]} castShadow>
                    <boxGeometry args={[0.3, 2, 0.3]} />
                    <meshStandardMaterial color="#92400e" roughness={0.5} />
                </mesh>
                <mesh position={[0, 2.2, 0]}>
                    <boxGeometry args={[0.5, 0.3, 0.5]} />
                    <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.3} />
                </mesh>
            </group>

            {/* Entry barrier arm */}
            <mesh position={[-halfWidth + 1.5, 1.6, 0]} castShadow>
                <boxGeometry args={[3, 0.08, 0.15]} />
                <meshStandardMaterial color="#fbbf24" roughness={0.4} />
            </mesh>

            {/* Exit barrier arm */}
            <mesh position={[halfWidth - 1.5, 1.6, 0]} castShadow>
                <boxGeometry args={[3, 0.08, 0.15]} />
                <meshStandardMaterial color="#fbbf24" roughness={0.4} />
            </mesh>
        </group>
    )
}

export default EntryExitMarkers

