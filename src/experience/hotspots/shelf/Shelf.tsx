import type { GameSlug } from '@/content/types'
import { useHotspot } from '../../interaction/useHotspot'
import { LAYOUT } from '../../scene/layout'
import { Hitbox } from '../../scene/placeholders/Hitbox'
import { ShelfPlaceholder } from '../../scene/placeholders/ShelfPlaceholder'
import type { Vec3 } from '../../scene/placeholders/parts'
import { GameBox } from './GameBox'

interface BoxSlot {
  /** Mesmo slug de content/projects.games.ts: é o que `store.highlightBox` recebe. */
  slug: GameSlug
  position: Vec3
  color: string
  size?: Vec3
}

const BOARD_BOX: Vec3 = [0.34, 0.46, 0.1]
const GAME_CASE: Vec3 = [0.12, 0.17, 0.02]

// Board games autorais = caixas na prateleira 2. Jogos digitais = capinhas ao lado do console (prateleira 3).
// As duas prateleiras interativas ficam juntas, na altura em que a câmera do hotspot foca.
const BOXES: readonly BoxSlot[] = [
  { slug: 'terra', position: [-0.62, 0.935, 0.08], color: '#57b894', size: BOARD_BOX },
  { slug: 'aldeia_dorme', position: [-0.24, 0.935, 0.08], color: '#3a3f8f', size: BOARD_BOX },
  { slug: 'porrilandia', position: [0.14, 1.44, 0.1], color: '#e4572e', size: GAME_CASE },
  { slug: 'peter', position: [0.3, 1.44, 0.1], color: '#4c8bf5', size: GAME_CASE },
  { slug: 'o_anel', position: [0.46, 1.44, 0.1], color: '#f2c14e', size: GAME_CASE },
]

/**
 * Hotspot `shelf` (Board games e game dev). Fica colado à direita da TV de parede, que ele
 * compartilha com a mesa (ARCHITECTURE §6.5). Fase 3: caixas com spring + `ShelfParticles`.
 */
export function Shelf() {
  const { bind } = useHotspot('shelf')
  return (
    <group name="shelf_root" position={[LAYOUT.shelf[0], LAYOUT.shelf[1], LAYOUT.shelf[2]]} {...bind}>
      {/* 1.9 de largura (x -0.88 a 1.02 no mundo): não invade a mesa (até -1.0) nem a impressora (desde 1.5). */}
      <Hitbox position={[0, 1.35, 0.05]} size={[1.9, 2.8, 0.7]} />
      <ShelfPlaceholder />
      {BOXES.map((b) => (
        <GameBox key={b.slug} slug={b.slug} position={b.position} color={b.color} size={b.size} />
      ))}
    </group>
  )
}
