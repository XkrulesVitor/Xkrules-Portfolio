import type { Vec3 } from './placeholders/parts'

// Fonte única do layout do diorama (ARCHITECTURE §6.0). Mundo em metros, origem no centro do piso,
// +Y para cima. Paredes em -X (esquerda) e -Z (fundo); a câmera HOME olha da diagonal +X/+Z.
// Placeholders, hotspots e presets de câmera leem daqui: mudar o layout é mudar este arquivo.

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

export interface ScreenSpec {
  /** Centro do plano da tela, no mundo. */
  center: Vec3
  /** Normal da tela (para onde ela "olha"). */
  normal: Vec3
  /** Largura x altura do plano, em metros. */
  size: readonly [number, number]
}

export const LAYOUT = {
  /** Monitor horizontal: é nele que a câmera do hotspot `desk` mergulha. 16:9. */
  monitorMain: { center: [-3.619, 1.62, -0.5], normal: [1, 0, 0], size: [1.3, 0.73] } as ScreenSpec,
  /** Monitor vertical, à direita de quem está sentado (lado -Z). 9:16. */
  monitorVertical: { center: [-3.674, 1.72, -1.62], normal: [1, 0, 0], size: [0.56, 1.0] } as ScreenSpec,
  /** PC gamer em cima da mesa, à esquerda do monitor horizontal (lado +Z). Centro da base. */
  pcTower: [-3.7, DESK_TOP_Y, 0.5] as Vec3,
  /** TV de parede acima da asa da mesa, compartilhada por desk e shelf (§6.5). */
  wallTv: [-2.15, 2.3, WALL_BACK_Z + 0.03] as Vec3,
  /** Estante: origem no piso, centro da largura, meio da profundidade (0.5). */
  shelf: [0.07, 0, WALL_BACK_Z + 0.25] as Vec3,
  /** Bancada + impressora no canto direito do fundo: origem no centro do tampo. */
  printer: [2.9, 0.9, WALL_BACK_Z + 0.58] as Vec3,
  /** Cadeira: centro da base, alinhada ao monitor horizontal. */
  chair: [-2.05, 0, -0.5] as Vec3,
  /** Cama na frente, à direita, com o comprimento ao longo de X. Centro do estrado. */
  bed: [2.6, 0, 2.35] as Vec3,
} as const
