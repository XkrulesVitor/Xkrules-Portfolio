import { DESK_TOP_Y as TOP, LAYOUT, WALL_BACK_Z, WALL_LEFT_X } from '../layout'
import { MergedParts } from './MergedParts'
import { COLORS, box } from './parts'
import { ledMaterial, pcGlassMaterial, rgbMaterial, screenMaterial } from './materials'
import { NO_RAYCAST } from './raycast'

// Mesa em L (mundo). Tampo principal na parede -X, asa na parede -Z.
// Quem senta olha para -X: a direita dessa pessoa é -Z e a esquerda é +Z.
// A TV acima da asa é compartilhada com a estante e mora em scene/WallTv.tsx.
const X0 = WALL_LEFT_X + 0.13 // borda esquerda dos tampos
const Z0 = WALL_BACK_Z - 0.02 // borda de trás da asa

const MAIN = LAYOUT.monitorMain.center
const VERT = LAYOUT.monitorVertical.center
const [px, py, pz] = LAYOUT.pcTower

const DESK_PARTS = [
  // tampos (dividem só a aresta z = Z0 + 1.2)
  box([1.4, 0.08, 3.7], [X0 + 0.7, 0.84, Z0 + 1.2 + 1.85], COLORS.wood),
  box([3.0, 0.08, 1.2], [X0 + 1.5, 0.84, Z0 + 0.6], COLORS.wood),
  // pernas
  box([0.08, 0.8, 0.08], [X0 + 0.05, 0.4, Z0 + 4.85], COLORS.woodLight),
  box([0.08, 0.8, 0.08], [X0 + 1.35, 0.4, Z0 + 4.85], COLORS.woodLight),
  box([0.08, 0.8, 0.08], [X0 + 0.05, 0.4, Z0 + 0.05], COLORS.woodLight),
  box([0.08, 0.8, 0.08], [X0 + 2.95, 0.4, Z0 + 0.05], COLORS.woodLight),
  box([0.08, 0.8, 0.08], [X0 + 2.95, 0.4, Z0 + 1.15], COLORS.woodLight),
  box([0.08, 0.8, 0.08], [X0 + 1.35, 0.4, Z0 + 1.25], COLORS.woodLight),
  // monitor horizontal (maior): base, haste, corpo
  box([0.3, 0.03, 0.3], [MAIN[0] - 0.031, TOP + 0.015, MAIN[2]], COLORS.darker),
  box([0.05, 0.36, 0.05], [MAIN[0] - 0.1, 1.07, MAIN[2]], COLORS.darker),
  box([0.06, 0.82, 1.42], [MAIN[0] - 0.031, MAIN[1], MAIN[2]], COLORS.bezel),
  // monitor vertical (maior), à direita de quem senta
  box([0.3, 0.03, 0.3], [VERT[0] - 0.026, TOP + 0.015, VERT[2]], COLORS.darker),
  box([0.05, 0.3, 0.05], [VERT[0] - 0.076, 1.03, VERT[2]], COLORS.darker),
  box([0.05, 1.08, 0.62], [VERT[0] - 0.026, VERT[1], VERT[2]], COLORS.bezel),
  // teclado em frente ao monitor; mouse e mousepad à DIREITA de quem senta (-Z)
  box([0.22, 0.02, 0.62], [MAIN[0] + 0.57, TOP + 0.01, MAIN[2]], COLORS.dark),
  box([0.26, 0.004, 0.3], [MAIN[0] + 0.6, TOP + 0.002, MAIN[2] - 0.55], COLORS.darker),
  box([0.1, 0.03, 0.06], [MAIN[0] + 0.62, TOP + 0.015, MAIN[2] - 0.55], COLORS.dark),
  // PC gamer à ESQUERDA do monitor horizontal (+Z): gabinete e grade do topo
  box([0.46, 0.5, 0.24], [px, py + 0.25, pz], COLORS.dark),
  box([0.4, 0.01, 0.18], [px, py + 0.505, pz], COLORS.darker),
]

export function DeskPlaceholder() {
  return (
    <>
      <MergedParts name="desk_static" parts={DESK_PARTS} />
      {/* Telas: planos separados (Fase 3 troca o material por emissive animado). */}
      <mesh
        name="screen_monitor_main"
        position={[MAIN[0], MAIN[1], MAIN[2]]}
        rotation={[0, Math.PI / 2, 0]}
        material={screenMaterial}
        raycast={NO_RAYCAST}
      >
        <planeGeometry args={[LAYOUT.monitorMain.size[0], LAYOUT.monitorMain.size[1]]} />
      </mesh>
      <mesh
        name="screen_monitor_vertical"
        position={[VERT[0], VERT[1], VERT[2]]}
        rotation={[0, Math.PI / 2, 0]}
        material={screenMaterial}
        raycast={NO_RAYCAST}
      >
        <planeGeometry args={[LAYOUT.monitorVertical.size[0], LAYOUT.monitorVertical.size[1]]} />
      </mesh>
      {/* PC gamer: vidro lateral voltado para +Z (a câmera HOME vê), fan e fita RGB. */}
      <mesh name="pc_glass" position={[px, py + 0.25, pz + 0.121]} material={pcGlassMaterial} raycast={NO_RAYCAST}>
        <planeGeometry args={[0.4, 0.42]} />
      </mesh>
      <mesh name="pc_fan" position={[px + 0.06, py + 0.32, pz + 0.123]} material={ledMaterial} raycast={NO_RAYCAST}>
        <ringGeometry args={[0.055, 0.075, 24]} />
      </mesh>
      <mesh name="pc_rgb" position={[px + 0.19, py + 0.25, pz + 0.123]} material={rgbMaterial} raycast={NO_RAYCAST}>
        <planeGeometry args={[0.018, 0.42]} />
      </mesh>
      <mesh
        name="led_case"
        position={[px + 0.231, py + 0.3, pz]}
        rotation={[0, Math.PI / 2, 0]}
        material={ledMaterial}
        raycast={NO_RAYCAST}
      >
        <planeGeometry args={[0.02, 0.26]} />
      </mesh>
    </>
  )
}
