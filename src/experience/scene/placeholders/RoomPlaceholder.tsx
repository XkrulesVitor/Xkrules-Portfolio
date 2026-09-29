import { MergedParts } from './MergedParts'
import { COLORS, box } from './parts'

// Ilha flutuante 10 x 0.4 x 8 (topo em y = 0), duas paredes de fundo (-X e -Z), um tapete e a cama.
// Camera HOME olha da diagonal +X/+Z, então as paredes ficam ao fundo.
const ROOM_PARTS = [
  box([10, 0.4, 8], [0, -0.2, 0], COLORS.floor),
  box([8.4, 0.8, 6.4], [0, -0.8, 0], COLORS.floorSide),
  box([6, 0.7, 4.6], [0, -1.55, 0], COLORS.floorUnder),
  box([0.12, 3.4, 8], [-4.94, 1.7, 0], COLORS.wallLeft),
  box([10, 3.4, 0.12], [0, 1.7, -3.94], COLORS.wallRight),
  box([3.2, 0.02, 3.4], [-2.6, 0.01, -1.0], COLORS.rug),
  // Cama (estática, sem hotspot; vai para room-static.glb). Cabeceira na parede -Z, canto direito.
  box([1.5, 0.3, 2.0], [4.05, 0.15, -2.8], COLORS.bedFrame),
  box([1.5, 0.95, 0.08], [4.05, 0.475, -3.84], COLORS.bedFrame),
  box([1.42, 0.18, 1.9], [4.05, 0.39, -2.82], COLORS.mattress),
  box([0.9, 0.12, 0.38], [4.05, 0.54, -3.52], COLORS.pillow),
  box([1.46, 0.05, 1.35], [4.05, 0.505, -2.52], COLORS.blanket),
  box([1.46, 0.06, 0.16], [4.05, 0.51, -3.12], COLORS.blanketFold),
]

export function RoomPlaceholder() {
  return <MergedParts name="room" parts={ROOM_PARTS} />
}
