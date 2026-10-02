import type { GameSlug } from '@/content/types'

/** Direção (mundo) para onde a caixa se projeta ao sair da prateleira. */
export type Direction = readonly [x: number, y: number, z: number]

export interface GameBoxNode {
  /** Nó do `room.glb` (ASSET_PIPELINE §4). */
  node: string
  /** Frente da caixa, no mundo. */
  front: Direction
}

/**
 * A frente de todas as caixas é +Z: nenhum nó `box_*` tem rotação no glb, a dimensão fina de cada um
 * é o Z local (board games: -0.05..+0.0545; capinhas: -0.01..+0.0145) e as costas encostam na
 * parede do fundo (z = -3.38) ou no fundo da estante. Se uma caixa for girada no Blender, ajuste a
 * `front` dela aqui.
 */
const FRONT: Direction = [0, 0, 1]

/** `GameSlug` -> nó do glb. O `satisfies` obriga a cobrir todos os slugs de `content/types.ts`. */
export const GAME_BOX_NODES = {
  terra: { node: 'box_terra', front: FRONT },
  aldeia_dorme: { node: 'box_aldeia_dorme', front: FRONT },
  porrilandia: { node: 'box_porrilandia', front: FRONT },
  peter: { node: 'box_peter', front: FRONT },
  o_anel: { node: 'box_o_anel', front: FRONT },
  racco: { node: 'box_racco', front: FRONT },
  memory_game: { node: 'box_memory_game', front: FRONT },
} as const satisfies Record<GameSlug, GameBoxNode>

export const GAME_SLUGS = Object.keys(GAME_BOX_NODES) as readonly GameSlug[]

/** Projeção (m) com a zona de jogos em hover/foco e na caixa destacada pelo painel (`highlightBox`). */
export const BOX_HOVER_OFFSET = 0.06
export const BOX_HIGHLIGHT_OFFSET = 0.15
