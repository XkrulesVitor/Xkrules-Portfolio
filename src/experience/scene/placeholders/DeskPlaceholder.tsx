import { DESK_TOP_Y as TOP, LAYOUT } from '../layout'
import { MergedParts } from './MergedParts'
import { COLORS, box } from './parts'

// Mesa reta na parede -X (mundo), do canto do fundo para a frente. Só a parte ESTÁTICA: as telas,
// o vidro, o fan e a fita RGB do PC gamer ficam em hotspots/desk/Screens.tsx (Fase 3 anima).
// Quem senta olha para -X: a direita dessa pessoa é -Z e a esquerda é +Z.
const [dx, , dz] = LAYOUT.desk.center
const [dw, , dd] = LAYOUT.desk.size
const X0 = dx - dw / 2 // borda de trás (encostada na parede)
const X1 = dx + dw / 2 // borda da frente (lado da cadeira)
const Z0 = dz - dd / 2 // ponta do fundo
const Z1 = dz + dd / 2 // ponta da frente

const MAIN = LAYOUT.monitorMain.center
const VERT = LAYOUT.monitorVertical.center
const [px, py, pz] = LAYOUT.pcTower

const DESK_PARTS = [
  // tampo e pernas
  box([dw, 0.08, dd], [dx, TOP - 0.04, dz], COLORS.wood),
  box([0.08, 0.8, 0.08], [X0 + 0.05, 0.4, Z0 + 0.05], COLORS.woodLight),
  box([0.08, 0.8, 0.08], [X1 - 0.05, 0.4, Z0 + 0.05], COLORS.woodLight),
  box([0.08, 0.8, 0.08], [X0 + 0.05, 0.4, Z1 - 0.05], COLORS.woodLight),
  box([0.08, 0.8, 0.08], [X1 - 0.05, 0.4, Z1 - 0.05], COLORS.woodLight),

  // monitor horizontal: base, haste, corpo
  box([0.3, 0.03, 0.3], [MAIN[0] - 0.031, TOP + 0.015, MAIN[2]], COLORS.darker),
  box([0.05, 0.36, 0.05], [MAIN[0] - 0.1, 1.07, MAIN[2]], COLORS.darker),
  box([0.06, 0.82, 1.42], [MAIN[0] - 0.031, MAIN[1], MAIN[2]], COLORS.bezel),
  // monitor vertical, à direita de quem senta (-Z)
  box([0.3, 0.03, 0.3], [VERT[0] - 0.026, TOP + 0.015, VERT[2]], COLORS.darker),
  box([0.05, 0.3, 0.05], [VERT[0] - 0.076, 1.03, VERT[2]], COLORS.darker),
  box([0.05, 1.08, 0.62], [VERT[0] - 0.026, VERT[1], VERT[2]], COLORS.bezel),
  // teclado em frente ao monitor; mousepad e mouse à DIREITA de quem senta (-Z)
  box([0.22, 0.02, 0.62], [MAIN[0] + 0.57, TOP + 0.01, MAIN[2]], COLORS.dark),
  box([0.26, 0.004, 0.3], [MAIN[0] + 0.6, TOP + 0.002, MAIN[2] - 0.55], COLORS.darker),
  box([0.1, 0.03, 0.06], [MAIN[0] + 0.62, TOP + 0.015, MAIN[2] - 0.55], COLORS.dark),
  // PC gamer (torre grande) à ESQUERDA do monitor horizontal (+Z): gabinete e grade do topo
  box([0.55, 0.62, 0.3], [px, py + 0.31, pz], COLORS.dark),
  box([0.48, 0.01, 0.22], [px, py + 0.625, pz], COLORS.darker),
]

export function DeskPlaceholder() {
  return <MergedParts name="desk_static" parts={DESK_PARTS} />
}
