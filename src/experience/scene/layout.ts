import type { Vec3 } from './placeholders/parts'

// Fonte única do layout do diorama (ARCHITECTURE §6.0). Mundo em metros, origem no centro do piso,
// +Y para cima. Paredes em -X (esquerda) e -Z (fundo); a câmera HOME olha da diagonal +X/+Z.
// Placeholders, hitboxes e presets de câmera leem daqui: mudar o layout é mudar este arquivo.

export const ROOM = {
  width: 8.6,
  depth: 7.0,
  wallHeight: 3.2,
  wallThickness: 0.12,
} as const

/** Face interna da parede esquerda (x) e da parede do fundo (z). */
export const WALL_LEFT_X = -ROOM.width / 2 + ROOM.wallThickness
export const WALL_BACK_Z = -ROOM.depth / 2 + ROOM.wallThickness
/** Bordas abertas do piso (sem parede): direita (+x) e frente (+z). */
export const EDGE_RIGHT_X = ROOM.width / 2
export const EDGE_FRONT_Z = ROOM.depth / 2

/** Altura do tampo da mesa. */
export const DESK_TOP_Y = 0.88
/** Altura do tampo do rack da TV. */
export const RACK_TOP_Y = 0.5

export interface ScreenSpec {
  /** Centro do plano da tela, no mundo. */
  center: Vec3
  /** Normal da tela (para onde ela "olha"). */
  normal: Vec3
  /** Largura x altura do plano, em metros. */
  size: readonly [number, number]
}

export interface BoxSpec {
  /** Centro da caixa, no mundo. */
  center: Vec3
  /** Largura (x), altura (y) e profundidade (z). */
  size: Vec3
}

export const LAYOUT = {
  /** Mesa reta na parede esquerda, do canto do fundo para a frente. Tampo em DESK_TOP_Y. */
  desk: { center: [-3.35, DESK_TOP_Y - 0.04, -1.4], size: [1.4, 0.08, 3.8] } as BoxSpec,
  /** Monitor horizontal: é nele que a câmera do hotspot `desk` mergulha. 16:9. */
  monitorMain: { center: [-3.619, 1.62, -1.45], normal: [1, 0, 0], size: [1.3, 0.73] } as ScreenSpec,
  /** Monitor vertical, à direita de quem está sentado (lado -Z). 9:16. */
  monitorVertical: { center: [-3.674, 1.72, -2.62], normal: [1, 0, 0], size: [0.56, 1.0] } as ScreenSpec,
  /** PC gamer (torre grande) à esquerda do monitor horizontal (lado +Z). Centro da base. */
  pcTower: [-3.72, DESK_TOP_Y, -0.35] as Vec3,
  /** Rack baixo da TV na parede do fundo: console e jogos digitais ficam no tampo. */
  rack: { center: [-1.6, RACK_TOP_Y / 2, WALL_BACK_Z + 0.245], size: [1.9, RACK_TOP_Y, 0.45] } as BoxSpec,
  /** TV na parede, acima do rack. Tela da zona de jogos (§6.5). */
  tv: { center: [-1.6, 1.3, WALL_BACK_Z + 0.061], normal: [0, 0, 1], size: [1.68, 0.94] } as ScreenSpec,
  /** Estante de board games: origem no piso, centro da largura, meio da profundidade (0.5). */
  shelf: [0.7, 0, WALL_BACK_Z + 0.25] as Vec3,
  /** Bancada + impressora no canto direito do fundo: origem no centro do tampo. */
  printer: [3.0, 0.9, WALL_BACK_Z + 0.58] as Vec3,
  /** Cadeira: centro da base, alinhada ao monitor horizontal. */
  chair: [-2.2, 0, -1.45] as Vec3,
  /**
   * Cama de casal na frente, à direita: comprimento ao longo de X e cabeceira em +X, encostada na
   * borda direita (a "parede invisível"). Centro do estrado.
   */
  bed: [3.12, 0, 2.35] as Vec3,
} as const
