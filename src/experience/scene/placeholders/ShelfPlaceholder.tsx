import { MergedParts } from './MergedParts'
import { COLORS, box, cyl } from './parts'

// Estante 1.8 x 2.6 x 0.5 com origem no piso, centro da largura, no meio da profundidade; frente em +Z.
// Fica colada à direita da TV de parede (scene/WallTv): o console da prateleira 3 está "ligado" nela.
// Topos das prateleiras: 0.055, 0.705, 1.355, 2.005 e 2.605.
// Aqui só entra o que é ESTÁTICO. As caixas dos projetos (interativas) são GameBox, em Shelf.tsx.
const SHELF_LEVELS = [0.03, 0.68, 1.33, 1.98, 2.58]

const FRAME_PARTS = [
  box([0.06, 2.6, 0.5], [-0.87, 1.3, 0], COLORS.woodLight),
  box([0.06, 2.6, 0.5], [0.87, 1.3, 0], COLORS.woodLight),
  box([1.8, 2.6, 0.04], [0, 1.3, -0.23], COLORS.wood),
  ...SHELF_LEVELS.map((y) => box([1.8, 0.05, 0.5], [0, y, 0], COLORS.woodLight)),
  // Prateleira 1: pilha de caixas deitadas + miniaturas.
  box([0.6, 0.09, 0.42], [-0.45, 0.1, 0], '#3d6e8f'),
  box([0.56, 0.09, 0.4], [-0.45, 0.19, 0], '#7a4f9a'),
  box([0.52, 0.09, 0.38], [-0.45, 0.28, 0], '#2f8f6f'),
  cyl(0.04, 0.1, [0.25, 0.105, 0.1], '#9aa3b5'),
  cyl(0.04, 0.1, [0.37, 0.105, 0.14], '#b58b6a'),
  cyl(0.04, 0.1, [0.49, 0.105, 0.08], '#6f8f5a'),
  // Prateleira 2: caixas comerciais de decoração (Root, Heat) ao lado dos board games autorais.
  box([0.34, 0.46, 0.1], [0.3, 0.935, 0.08], '#d9a441'),
  box([0.34, 0.46, 0.1], [0.66, 0.935, 0.08], '#c8412f'),
  // Prateleira 3: console (ligado na TV de parede), controle e dados.
  box([0.34, 0.07, 0.26], [-0.5, 1.39, 0.05], COLORS.dark),
  box([0.14, 0.035, 0.09], [-0.15, 1.3725, 0.12], COLORS.darker),
  box([0.05, 0.05, 0.05], [0.72, 1.38, 0.1], COLORS.dice),
  box([0.05, 0.05, 0.05], [0.64, 1.38, 0.16], '#d64545'),
  // Prateleira 4: fileira decorativa.
  box([0.3, 0.4, 0.08], [-0.6, 2.205, 0.1], '#8e6bbf'),
  box([0.3, 0.4, 0.08], [-0.2, 2.205, 0.1], '#3fb8c9'),
  box([0.3, 0.4, 0.08], [0.2, 2.205, 0.1], '#e58bb2'),
  box([0.3, 0.4, 0.08], [0.6, 2.205, 0.1], '#f28f3b'),
]

export function ShelfPlaceholder() {
  return <MergedParts name="shelf_frame" parts={FRAME_PARTS} />
}
