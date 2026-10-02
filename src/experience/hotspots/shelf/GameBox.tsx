import { useRef } from 'react'
import type { Mesh } from 'three'
import type { GameSlug } from '@/content/types'
import { solidMaterial } from '../../scene/placeholders/materials'
import { NO_RAYCAST } from '../../scene/placeholders/raycast'
import type { Vec3 } from '../../scene/placeholders/parts'
import { useGameBoxSpring } from './useGameBoxSpring'

interface GameBoxProps {
  /** Mesmo slug de content/projects.games.ts (nó `box_<slug>`). */
  slug: GameSlug
  position: Vec3
  color: string
  size?: Vec3
}

/**
 * Caixa de jogo do grey-box: spring em direção à frente (+Z) no hover da zona de jogos e spring
 * maior na caixa do `store.highlightBox` (a mesma lógica das caixas do glb).
 */
export function GameBox({ slug, position, color, size = [0.3, 0.42, 0.08] }: GameBoxProps) {
  const mesh = useRef<Mesh>(null)
  useGameBoxSpring(slug, mesh)

  return (
    <mesh
      ref={mesh}
      name={`box_${slug}`}
      position={[position[0], position[1], position[2]]}
      material={solidMaterial(color)}
      raycast={NO_RAYCAST}
    >
      <boxGeometry args={[size[0], size[1], size[2]]} />
    </mesh>
  )
}
