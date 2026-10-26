import { Suspense } from 'react'
import type { GameSlug } from '@/content/types'
import { useHotspot } from '../../interaction/useHotspot'
import { useSceneMode } from '../../scene/baked/useSceneMode'
import { LAYOUT, RACK_TOP_Y } from '../../scene/layout'
import { Hitbox } from '../../scene/placeholders/Hitbox'
import { MediaPlaceholder } from '../../scene/placeholders/MediaPlaceholder'
import { ShelfPlaceholder } from '../../scene/placeholders/ShelfPlaceholder'
import type { Vec3 } from '../../scene/placeholders/parts'
import { BakedGameBoxes } from './BakedGameBoxes'
import { BoardGameFx } from './BoardGameFx'
import { GameBox } from './GameBox'
import { GameCovers } from './GameCovers'
import { ShelfParticles } from './ShelfParticles'
import { TvGameHtml } from './TvGameHtml'

interface BoxSlot {
  /** Mesmo slug de content/projects.games.ts: é o que `store.highlightBox` recebe. */
  slug: GameSlug
  /** No MUNDO (esta zona fica na origem). */
  position: Vec3
  color: string
  size?: Vec3
}

// Mesmas medidas e posições das caixas do glb (art/blender/props/games.py): as capas são quadradas.
const BOARD_BOX: Vec3 = [0.36, 0.36, 0.1]
const GAME_CASE: Vec3 = [0.13, 0.13, 0.02]

const [sx, sy, sz] = LAYOUT.shelf
const [rx, , rz] = LAYOUT.rack.center
const [rw, , rd] = LAYOUT.rack.size

const BOARD_Y = sy + 0.705 + BOARD_BOX[1] / 2
const CASE_Y = RACK_TOP_Y + GAME_CASE[1] / 2
const onRack = (k: number): Vec3 => [rx + 0.12 + k * 0.14, CASE_Y, rz + 0.02]

// Board games autorais = caixas na prateleira 2 da estante (altura em que a câmera foca).
// Jogos digitais = estojos de pé no tampo do rack, ao lado do console, embaixo da TV, na ordem do painel.
const BOXES: readonly BoxSlot[] = [
  { slug: 'aldeia_dorme', position: [sx - 0.62, BOARD_Y, sz + 0.08], color: '#b59b7a', size: BOARD_BOX },
  { slug: 'conquista_galactica', position: [sx - 0.24, BOARD_Y, sz + 0.08], color: '#151a30', size: BOARD_BOX },
  { slug: 'porriland', position: onRack(0), color: '#1d8fd8', size: GAME_CASE },
  { slug: 'piter', position: onRack(1), color: '#9a5b2e', size: GAME_CASE },
  { slug: 'memory_game', position: onRack(2), color: '#5b2bd1', size: GAME_CASE },
  { slug: 'o_anel', position: onRack(3), color: '#a8380f', size: GAME_CASE },
  { slug: 'racco', position: onRack(4), color: '#2c5552', size: GAME_CASE },
  { slug: 'duel_arena', position: onRack(5), color: '#3a4a5c', size: GAME_CASE },
]

/**
 * Hotspot `shelf`: a ZONA DE JOGOS inteira (ARCHITECTURE §6.4). Duas hitboxes, cada uma abre uma
 * sub-vista: a estante abre `tabuleiro` (câmera na estante, painel à esquerda) e o rack + TV abre
 * `digital` (câmera na TV e no console, painel à direita). O hover é um só para a zona.
 * No grey-box desenha estante, rack, TV e `GameBox`; no quarto baked o glb desenha tudo (estante,
 * rack, TV `screen_tv` e os nós `box_*`) e aqui ficam só as hitboxes, as partículas e as artes das
 * capas (`GameCovers`, nos quadros `cover_*`).
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
        <>
          <BakedGameBoxes />
          <Suspense fallback={null}>
            <GameCovers />
          </Suspense>
        </>
      ) : (
        <>
          <MediaPlaceholder />
          {BOXES.map((b) => (
            <GameBox key={b.slug} slug={b.slug} position={b.position} color={b.color} size={b.size} />
          ))}
        </>
      )}
      <ShelfParticles />
      <BoardGameFx />
      <TvGameHtml />
    </group>
  )
}
