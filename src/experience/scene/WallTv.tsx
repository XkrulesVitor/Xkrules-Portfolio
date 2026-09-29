import { MergedParts } from './placeholders/MergedParts'
import { COLORS, box } from './placeholders/parts'
import { screenMaterial } from './placeholders/materials'
import { NO_RAYCAST } from './placeholders/raycast'

/** Centro da TV de parede (mundo). A estante fica colada à direita dela (Shelf.tsx). */
// x = -2.85: a borda direita (-2.0) fica fora da sombra visual da estante na câmera HOME (azimute 45°).
export const WALL_TV_CENTER = [-2.85, 2.3, -3.85] as const

const BEZEL_PARTS = [box([1.7, 1.0, 0.06], [0, 0, 0], COLORS.bezel)]

/**
 * TV de parede COMPARTILHADA pelas zonas `desk` e `shelf` (ARCHITECTURE §6.5).
 * Fase 3: o material de `screen_tv` segue o store:
 * - desk em hover/foco: acende junto com os monitores (wallpaper emissivo);
 * - shelf em hover/foco: estática retrô (o console da estante está "ligado" nela);
 * - senão: apagada.
 * Não tem hitbox própria. O hover na TV cai na hitbox da mesa (Desk.tsx).
 */
export function WallTv() {
  return (
    <group name="wall_tv" position={[WALL_TV_CENTER[0], WALL_TV_CENTER[1], WALL_TV_CENTER[2]]}>
      <MergedParts name="tv_bezel" parts={BEZEL_PARTS} />
      <mesh
        name="screen_tv"
        position={[0, 0, 0.031]}
        material={screenMaterial}
        raycast={NO_RAYCAST}
      >
        <planeGeometry args={[1.6, 0.9]} />
      </mesh>
    </group>
  )
}
