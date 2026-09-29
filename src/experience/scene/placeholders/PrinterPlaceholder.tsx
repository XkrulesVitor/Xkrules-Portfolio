import { MergedParts } from './MergedParts'
import { COLORS, box } from './parts'
import { ledMaterial } from './materials'
import { NO_RAYCAST } from './raycast'

// Bancada + impressora com origem no centro do tampo da bancada (y = 0 é a superfície).
const STATIC_PARTS = [
  // bancada
  box([2.4, 0.08, 1.1], [0, -0.04, 0], COLORS.wood),
  box([0.08, 0.82, 0.08], [-1.1, -0.49, -0.48], COLORS.woodLight),
  box([0.08, 0.82, 0.08], [1.1, -0.49, -0.48], COLORS.woodLight),
  box([0.08, 0.82, 0.08], [-1.1, -0.49, 0.48], COLORS.woodLight),
  box([0.08, 0.82, 0.08], [1.1, -0.49, 0.48], COLORS.woodLight),
  // impressora: base, colunas, viga superior
  box([0.9, 0.14, 0.8], [0, 0.07, 0], COLORS.printerBase),
  box([0.08, 1.0, 0.08], [-0.4, 0.64, -0.3], COLORS.metal),
  box([0.08, 1.0, 0.08], [0.4, 0.64, -0.3], COLORS.metal),
  box([0.9, 0.08, 0.12], [0, 1.18, -0.3], COLORS.metal),
]
const BED_PARTS = [box([0.6, 0.03, 0.6], [0, 0.155, 0.1], COLORS.darker)]
const AXIS_Z_PARTS = [box([0.8, 0.06, 0.1], [0, 0, 0], COLORS.metalDark)]
const HEAD_PARTS = [
  box([0.16, 0.14, 0.14], [0, 0, 0], COLORS.accent),
  box([0.03, 0.06, 0.03], [0, -0.1, 0], COLORS.darker),
]
// Origem na base: a escala Y (Fase 3) cresce de baixo para cima.
const PART_PARTS = [box([0.2, 0.25, 0.2], [0, 0.125, 0], COLORS.part)]

export function PrinterPlaceholder() {
  return (
    <>
      <MergedParts name="printer_root" parts={STATIC_PARTS} />
      <MergedParts name="printer_bed" parts={BED_PARTS} />
      <group name="printer_axisZ" position={[0, 0.7, -0.3]}>
        <MergedParts parts={AXIS_Z_PARTS} />
        <group name="printer_head" position={[0, 0, 0.1]}>
          <MergedParts parts={HEAD_PARTS} />
        </group>
      </group>
      <group name="printer_part" position={[0, 0.17, 0.1]}>
        <MergedParts parts={PART_PARTS} />
      </group>
      <mesh
        name="printer_led"
        position={[0.36, 0.07, 0.401]}
        material={ledMaterial}
        raycast={NO_RAYCAST}
      >
        <planeGeometry args={[0.05, 0.05]} />
      </mesh>
    </>
  )
}
