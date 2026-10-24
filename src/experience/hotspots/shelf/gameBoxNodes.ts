import type { GameSlug } from '@/content/types'

/** Direção (mundo) para onde a caixa se projeta ao sair da prateleira. */
export type Direction = readonly [x: number, y: number, z: number]

export interface GameBoxNode {
  /** Nó da caixa no `room.glb` (ASSET_PIPELINE §4). */
  node: string
  /** Quadro da capa: filho de `node` no glb (anda junto no spring); recebe a arte no runtime. */
  cover: string
  /** Frente da caixa, no mundo. */
  front: Direction
}

/**
 * A frente de todas as caixas é +Z: nenhum nó `box_*` tem rotação no glb, a dimensão fina de cada um
 * é o Z local (board games: 10 cm; estojos: 2 cm) e as costas encostam no fundo da estante ou ficam
 * rente à parede, no tampo do rack. Se uma caixa for girada no Blender, ajuste a `front` dela aqui.
 */
const FRONT: Direction = [0, 0, 1]

const node = (slug: GameSlug): GameBoxNode => ({ node: `box_${slug}`, cover: `cover_${slug}`, front: FRONT })

/** `GameSlug` -> nós do glb. O `satisfies` obriga a cobrir todos os slugs de `content/types.ts`. */
export const GAME_BOX_NODES = {
  aldeia_dorme: node('aldeia_dorme'),
  conquista_galactica: node('conquista_galactica'),
  porriland: node('porriland'),
  piter: node('piter'),
  memory_game: node('memory_game'),
  o_anel: node('o_anel'),
  racco: node('racco'),
  duel_arena: node('duel_arena'),
} as const satisfies Record<GameSlug, GameBoxNode>

export const GAME_SLUGS = Object.keys(GAME_BOX_NODES) as readonly GameSlug[]

/** Projeção (m) com a zona de jogos em hover/foco e na caixa destacada pelo painel (`highlightBox`). */
export const BOX_HOVER_OFFSET = 0.06
export const BOX_HIGHLIGHT_OFFSET = 0.15
