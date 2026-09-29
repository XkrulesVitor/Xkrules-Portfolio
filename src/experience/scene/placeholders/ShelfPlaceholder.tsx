import { MergedParts } from './MergedParts'
import { COLORS, box } from './parts'
import { screenMaterial } from './materials'
import { NO_RAYCAST } from './raycast'

// Estante 1.8 x 2.6 x 0.5 com origem no piso, centro da largura, no meio da profundidade; frente em +Z.
const SHELF_LEVELS = [0.03, 0.68, 1.33, 1.98, 2.58]

const FRAME_PARTS = [
  box([0.06, 2.6, 0.5], [-0.87, 1.3, 0], COLORS.woodLight),
  box([0.06, 2.6, 0.5], [0.87, 1.3, 0], COLORS.woodLight),
  box([1.8, 2.6, 0.04], [0, 1.3, -0.23], COLORS.wood),
  ...SHELF_LEVELS.map((y) => box([1.8, 0.05, 0.5], [0, y, 0], COLORS.woodLight)),
  // console + moldura da TV do console (prateleira 3)
  box([0.62, 0.45, 0.05], [-0.3, 1.6, -0.05], COLORS.bezel),
  box([0.3, 0.06, 0.25], [0.5, 1.385, 0.05], COLORS.dark),
  // fileira decorativa na prateleira 4 (estática)
  box([0.3, 0.4, 0.08], [-0.6, 2.225, 0.1], '#8e6bbf'),
  box([0.3, 0.4, 0.08], [-0.2, 2.225, 0.1], '#3fb8c9'),
  box([0.3, 0.4, 0.08], [0.2, 2.225, 0.1], '#e58bb2'),
  box([0.3, 0.4, 0.08], [0.6, 2.225, 0.1], '#f28f3b'),
]

export function ShelfPlaceholder() {
  return (
    <>
      <MergedParts name="shelf_frame" parts={FRAME_PARTS} />
      <mesh
        name="screen_console_tv"
        position={[-0.3, 1.6, -0.024]}
        material={screenMaterial}
        raycast={NO_RAYCAST}
      >
        <planeGeometry args={[0.54, 0.36]} />
      </mesh>
    </>
  )
}
