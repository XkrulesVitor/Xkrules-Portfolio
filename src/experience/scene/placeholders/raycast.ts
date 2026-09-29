import type { Object3D } from 'three'

/** Geometria detalhada não recebe raycast: só a hitbox do hotspot (ARCHITECTURE §5). */
export const NO_RAYCAST: Object3D['raycast'] = () => {}
