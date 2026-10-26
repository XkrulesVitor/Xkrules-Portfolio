import type { MediaImage } from './types'

/**
 * Board games de DECORAÇÃO da estante (não são do dono do portfólio e não têm cartão no painel):
 * Root e Heat em pé na prateleira 2, Everdell deitado na prateleira 3 com a árvore de papelão montada.
 * Cada caixa do glb (`zone_games`, estática) tem um quadro `cover_decor_<id>` à frente, assado como o
 * resto do quarto; o `GameCovers` troca o material dele pela arte daqui (ARCHITECTURE §6.4).
 * As artes são a frente da caixa retificada a partir de fotos de produto (512 px no lado maior).
 */
export interface DecorCover {
  /** Nó `cover_decor_<id>` do `room.glb` (art/blender/props/games.py). */
  node: string
  /** Arte da capa (caminho em /public/media/decor). */
  image: MediaImage
}

export const DECOR_COVERS: readonly DecorCover[] = [
  {
    node: 'cover_decor_root',
    image: {
      src: '/media/decor/root.webp',
      alt: 'Capa de Root: um rato, um pássaro, um gato e um guaxinim de aventureiros na floresta outonal, sob o título em letras ornamentadas.',
      width: 512,
      height: 384,
    },
  },
  {
    node: 'cover_decor_heat',
    image: {
      src: '/media/decor/heat.webp',
      alt: 'Capa de Heat: Pedal to the Metal, com um carro de corrida verde número 3 cruzando a linha de chegada quadriculada.',
      width: 512,
      height: 512,
    },
  },
  {
    // Deitada na prateleira 3: o topo da arte aponta para o fundo da estante.
    node: 'cover_decor_everdell',
    image: {
      src: '/media/decor/everdell.webp',
      alt: 'Capa de Everdell: uma clareira dourada de floresta com um texugo de cajado e um camundongo diante de um riacho, e o título em letra cursiva.',
      width: 512,
      height: 512,
    },
  },
]
