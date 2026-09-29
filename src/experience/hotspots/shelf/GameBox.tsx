import { solidMaterial } from '../../scene/placeholders/materials'
import { NO_RAYCAST } from '../../scene/placeholders/raycast'
import type { Vec3 } from '../../scene/placeholders/parts'

interface GameBoxProps {
  /** Mesmo slug de content/projects.games.ts (nó `box_<slug>`). */
  slug: string
  position: Vec3
  color: string
  size?: Vec3
}

/** Caixa de jogo. Fase 3: spring em z (hover) e `store.highlightBox`. */
export function GameBox({ slug, position, color, size = [0.3, 0.42, 0.08] }: GameBoxProps) {
  return (
    <mesh
      name={`box_${slug}`}
      position={[position[0], position[1], position[2]]}
      material={solidMaterial(color)}
      raycast={NO_RAYCAST}
    >
      <boxGeometry args={[size[0], size[1], size[2]]} />
    </mesh>
  )
}
