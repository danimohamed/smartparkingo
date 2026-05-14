/**
 * parking3d/constants.js
 * Shared constants for the 3D parking scene — colors, layout math, labels.
 */
import * as THREE from 'three'

/* ── Status colors (THREE.Color instances for InstancedMesh) ── */
export const STATUS_COLORS = {
    AVAILABLE:   new THREE.Color(0x10b981),   // emerald-500
    OCCUPIED:    new THREE.Color(0xef4444),   // red-500
    RESERVED:    new THREE.Color(0xf59e0b),   // amber-500
    MAINTENANCE: new THREE.Color(0x6b7280),   // gray-500
}

export const STATUS_EMISSIVE = {
    AVAILABLE:   new THREE.Color(0x10b981).multiplyScalar(0.15),
    OCCUPIED:    new THREE.Color(0xef4444).multiplyScalar(0.08),
    RESERVED:    new THREE.Color(0xf59e0b).multiplyScalar(0.1),
    MAINTENANCE: new THREE.Color(0x6b7280).multiplyScalar(0.02),
}

/* ── Slot geometry sizing (meters) ─────────────────────────── */
export const SLOT = {
    WIDTH:   2.5,
    DEPTH:   5.0,
    HEIGHT:  0.08,
    GAP:     0.3,
    LANE_WIDTH: 6.0,
}

/* ── Floor row prefixes ─────────────────────────────────────── */
export const ROW_TOP_PREFIXES = ['A', 'B', 'C']
export const ROW_BOT_PREFIXES = ['D', 'E']

/* ── Car placeholder sizing ─────────────────────────────────── */
export const CAR = {
    WIDTH:  1.8,
    HEIGHT: 1.2,
    DEPTH:  4.0,
}

/* ── Hover / selected highlight color ───────────────────────── */
export const HIGHLIGHT_COLOR = new THREE.Color(0x3b82f6) // blue-500

