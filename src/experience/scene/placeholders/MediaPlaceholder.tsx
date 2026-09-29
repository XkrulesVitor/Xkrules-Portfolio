import { LAYOUT, RACK_TOP_Y } from '../layout'
import { MergedParts } from './MergedParts'
import { COLORS, box } from './parts'

// Rack baixo da TV (mundo), na parede do fundo, como o da referência: corpo branco com frente de
// madeira, console e controle no tampo. Estático; as capinhas dos jogos digitais são GameBox
// (interativas) e a TV é scene/WallTv.tsx.
const [rx, , rz] = LAYOUT.rack.center
const [rw, rh, rd] = LAYOUT.rack.size
const FRONT = rz + rd / 2

const RACK_PARTS = [
  box([rw, rh, rd], [rx, rh / 2, rz], COLORS.white),
  // duas portas de madeira na frente e o vão aberto do meio
  box([0.62, rh - 0.12, 0.01], [rx - 0.6, rh / 2, FRONT + 0.005], COLORS.woodLight),
  box([0.62, rh - 0.12, 0.01], [rx + 0.6, rh / 2, FRONT + 0.005], COLORS.woodLight),
  box([0.5, 0.14, 0.02], [rx, 0.2, FRONT - 0.01], COLORS.darker),
  // console deitado (à esquerda) e controle no tampo
  box([0.3, 0.08, 0.22], [rx - 0.55, RACK_TOP_Y + 0.04, rz - 0.02], COLORS.dark),
  box([0.02, 0.012, 0.12], [rx - 0.4, RACK_TOP_Y + 0.066, rz + 0.07], '#7ff5d0'),
  box([0.14, 0.035, 0.09], [rx - 0.15, RACK_TOP_Y + 0.018, rz + 0.12], COLORS.darker),
]

export function MediaPlaceholder() {
  return <MergedParts name="media_rack" parts={RACK_PARTS} />
}
