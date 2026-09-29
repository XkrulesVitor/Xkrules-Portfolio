import { LAYOUT, ROOM } from '../layout'
import { MergedParts } from './MergedParts'
import { COLORS, box } from './parts'

const W = ROOM.width
const D = ROOM.depth
const H = ROOM.wallHeight
const T = ROOM.wallThickness
const [bx, , bz] = LAYOUT.bed

// Ilha flutuante W x 0.4 x D (topo em y = 0), paredes em -X e -Z, tapete sob a cadeira e a cama.
// A cama é estática (sem hotspot) e vai para room-static.glb. Comprimento ao longo de X, na frente
// à direita; cabeceira no lado -X, voltada para o centro do quarto, para a câmera HOME ver o colchão.
const ROOM_PARTS = [
  box([W, 0.4, D], [0, -0.2, 0], COLORS.floor),
  box([W - 1.4, 0.8, D - 1.4], [0, -0.8, 0], COLORS.floorSide),
  box([W - 3.4, 0.7, D - 3.0], [0, -1.55, 0], COLORS.floorUnder),
  box([T, H, D], [-W / 2 + T / 2, H / 2, 0], COLORS.wallLeft),
  box([W, H, T], [0, H / 2, -D / 2 + T / 2], COLORS.wallRight),
  box([2.8, 0.02, 3.0], [LAYOUT.chair[0] + 0.15, 0.01, LAYOUT.chair[2]], COLORS.rug),
  // Cama
  box([2.0, 0.3, 1.5], [bx, 0.15, bz], COLORS.bedFrame),
  box([0.08, 0.95, 1.5], [bx - 1.04, 0.475, bz], COLORS.bedFrame),
  box([1.92, 0.18, 1.42], [bx + 0.02, 0.39, bz], COLORS.mattress),
  box([0.38, 0.12, 0.9], [bx - 0.7, 0.54, bz], COLORS.pillow),
  box([1.35, 0.05, 1.46], [bx + 0.3, 0.505, bz], COLORS.blanket),
  box([0.16, 0.06, 1.46], [bx - 0.34, 0.51, bz], COLORS.blanketFold),
]

export function RoomPlaceholder() {
  return <MergedParts name="room" parts={ROOM_PARTS} />
}
