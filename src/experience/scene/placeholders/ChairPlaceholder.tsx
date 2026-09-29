import { MergedParts } from './MergedParts'
import { COLORS, box, cyl } from './parts'

// Cadeira com origem no centro da base (o giro do hover é em torno de `chair_root`).
// Em rotação 0 o encosto fica em +X local (de costas para a câmera HOME) e o assento "olha" para -X (a mesa).
const CHAIR_PARTS = [
  cyl(0.3, 0.05, [0, 0.05, 0], COLORS.darker),
  cyl(0.04, 0.42, [0, 0.29, 0], COLORS.metalDark),
  box([0.5, 0.08, 0.5], [0, 0.54, 0], COLORS.chairSeat),
  box([0.06, 0.6, 0.46], [0.22, 0.87, 0], COLORS.chair),
]

export function ChairPlaceholder() {
  return <MergedParts name="chair_character" parts={CHAIR_PARTS} />
}
