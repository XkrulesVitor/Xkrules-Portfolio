import type { GameSlug } from '@/content/types'
import { useHotspot } from '../../interaction/useHotspot'
import { useSceneMode } from '../../scene/baked/useSceneMode'
import { LAYOUT, RACK_TOP_Y } from '../../scene/layout'
import { Hitbox } from '../../scene/placeholders/Hitbox'
import { MediaPlaceholder } from '../../scene/placeholders/MediaPlaceholder'
import { ShelfPlaceholder } from '../../scene/placeholders/ShelfPlaceholder'
import type { Vec3 } from '../../scene/placeholders/parts'
import { BakedGameBoxes } from './BakedGameBoxes'
import { GameBox } from './GameBox'
import { ShelfParticles } from './ShelfParticles'

interface BoxSlot {
  /** Mesmo slug de content/projects.games.ts: é o que `store.highlightBox` recebe. */
  slug: GameSlug
  /** No MUNDO (esta zona fica na origem). */
  position: Vec3
  color: string
  size?: Vec3
}

const BOARD_BOX: Vec3 = [0.34, 0.46, 0.1]
const GAME_CASE: Vec3 = [0.12, 0.17, 0.02]

const [sx, sy, sz] = LAYOUT.shelf
const [rx, , rz] = LAYOUT.rack.center
const [rw, , rd] = LAYOUT.rack.size

// Board games autorais = caixas na prateleira 2 da estante (altura em que a câmera foca).
// Jogos digitais = capinhas de pé no tampo do rack, ao lado do console, embaixo da TV.
const BOXES: readonly BoxSlot[] = [
  { slug: 'terra', position: [sx - 0.62, sy + 0.935, sz + 0.08], color: '#57b894', size: BOARD_BOX },
  { slug: 'aldeia_dorme', position: [sx - 0.24, sy + 0.935, sz + 0.08], color: '#3a3f8f', size: BOARD_BOX },
  { slug: 'porrilandia', position: [rx + 0.25, RACK_TOP_Y + 0.085, rz + 0.02], color: '#e4572e', size: GAME_CASE },
  { slug: 'peter', position: [rx + 0.38, RACK_TOP_Y + 0.085, rz + 0.02], color: '#4c8bf5', size: GAME_CASE },
  { slug: 'o_anel', position: [rx + 0.51, RACK_TOP_Y + 0.085, rz + 0.02], color: '#f2c14e', size: GAME_CASE },
  { slug: 'racco', position: [rx + 0.64, RACK_TOP_Y + 0.085, rz + 0.02], color: '#10b981', size: GAME_CASE },
  { slug: 'memory_game', position: [rx + 0.77, RACK_TOP_Y + 0.085, rz + 0.02], color: '#a855f7', size: GAME_CASE },
]

/**
 * Hotspot `shelf`: a ZONA DE JOGOS inteira (ARCHITECTURE §6.4). Duas hitboxes, cada uma abre uma
 * sub-vista: a estante abre `tabuleiro` (câmera na estante, painel à esquerda) e o rack + TV abre
 * `digital` (câmera na TV e no console, painel à direita). O hover é um só para a zona.
 * No grey-box desenha estante, rack, TV e `GameBox`; no quarto baked o glb desenha tudo (estante,
 * rack, TV `screen_tv` e os nós `box_*`) e aqui ficam só as hitboxes e as partículas.
 * V.3: as caixas têm spring (hover da zona e `highlightBox`) nos dois modos (`BakedGameBoxes` move
 * os nós `box_*` do glb; no grey-box o `GameBox` se move sozinho) e as partículas entram em foco.
 */
export function Shelf() {
  const { bind } = useHotspot('shelf')
  const baked = useSceneMode() === 'baked'
  return (
    <group name="games_zone" {...bind}>
      <group name="shelf_root" position={[sx, sy, sz]}>
        {/* 1.9 de largura (x -0.25 a 1.65 no mundo): não invade o rack (até -0.62) nem a impressora (desde 1.7). */}
        <Hitbox position={[0, 1.35, 0.05]} size={[1.9, 2.8, 0.7]} view="tabuleiro" />
        {baked ? null : <ShelfPlaceholder />}
      </group>
      {/* Rack + TV: da parede até a frente do rack, do piso até o topo da TV. */}
      <Hitbox position={[rx, 0.95, rz + 0.03]} size={[rw + 0.06, 1.95, rd + 0.15]} view="digital" />
      {baked ? (
        <BakedGameBoxes />
      ) : (
        <>
          <MediaPlaceholder />
          {BOXES.map((b) => (
            <GameBox key={b.slug} slug={b.slug} position={b.position} color={b.color} size={b.size} />
          ))}
        </>
      )}
      <ShelfParticles />
    </group>
  )
}
