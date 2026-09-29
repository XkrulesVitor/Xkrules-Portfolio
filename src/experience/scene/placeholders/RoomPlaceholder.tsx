import { LAYOUT, ROOM } from '../layout'
import { MergedParts } from './MergedParts'
import { COLORS, box } from './parts'

const W = ROOM.width
const D = ROOM.depth
const H = ROOM.wallHeight
const T = ROOM.wallThickness
const [bx, , bz] = LAYOUT.bed

// Ilha flutuante W x 0.4 x D (topo em y = 0), paredes em -X e -Z e tapete sob a cadeira.
// Cama de casal estática (sem hotspot, vai para room-static.glb): comprimento ao longo de X,
// cabeceira em +X encostada na borda direita (a "parede invisível"), pés voltados para o quarto.
const ROOM_PARTS = [
  box([W, 0.4, D], [0, -0.2, 0], COLORS.floor),
  box([W - 1.4, 0.8, D - 1.4], [0, -0.8, 0], COLORS.floorSide),
  box([W - 3.4, 0.7, D - 3.0], [0, -1.55, 0], COLORS.floorUnder),
  box([T, H, D], [-W / 2 + T / 2, H / 2, 0], COLORS.wallLeft),
  box([W, H, T], [0, H / 2, -D / 2 + T / 2], COLORS.wallRight),
  box([2.8, 0.02, 3.0], [LAYOUT.chair[0] + 0.15, 0.01, LAYOUT.chair[2]], COLORS.rug),
  // Cama: estrado, cabeceira (+X), colchão, dois travesseiros, cobertor e dobra
  box([2.2, 0.3, 1.8], [bx, 0.15, bz], COLORS.bedFrame),
  box([0.08, 0.85, 1.8], [bx + 1.14, 0.425, bz], COLORS.bedFrame),
  box([2.12, 0.2, 1.72], [bx - 0.02, 0.4, bz], COLORS.mattress),
  box([0.36, 0.12, 0.72], [bx + 0.78, 0.56, bz - 0.42], COLORS.pillow),
  box([0.36, 0.12, 0.72], [bx + 0.78, 0.56, bz + 0.42], COLORS.pillow),
  box([1.55, 0.05, 1.76], [bx - 0.325, 0.515, bz], COLORS.blanket),
  box([0.16, 0.06, 1.76], [bx + 0.39, 0.52, bz], COLORS.blanketFold),
]

export function RoomPlaceholder() {
  return <MergedParts name="room" parts={ROOM_PARTS} />
}
