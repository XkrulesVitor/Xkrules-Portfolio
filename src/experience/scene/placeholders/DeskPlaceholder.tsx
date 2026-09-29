import { MergedParts } from './MergedParts'
import { COLORS, box } from './parts'
import { ledMaterial, screenMaterial } from './materials'
import { NO_RAYCAST } from './raycast'

// Mesa em L (coordenadas de mundo). Tampo principal encostado na parede -X, asa na parede -Z.
// Tampo: y = 0.88. Monitor principal em (-4.35, _, -1.0) com a tela voltada para +X.
const TOP = 0.88

const DESK_PARTS = [
  // tampos (não se sobrepõem: dividem só a aresta z = -2.7)
  box([1.4, 0.08, 3.7], [-4.05, 0.84, -0.85], COLORS.wood),
  box([3.0, 0.08, 1.2], [-3.25, 0.84, -3.3], COLORS.wood),
  // pernas
  box([0.08, 0.8, 0.08], [-4.7, 0.4, 0.95], COLORS.woodLight),
  box([0.08, 0.8, 0.08], [-3.4, 0.4, 0.95], COLORS.woodLight),
  box([0.08, 0.8, 0.08], [-4.7, 0.4, -3.85], COLORS.woodLight),
  box([0.08, 0.8, 0.08], [-1.8, 0.4, -3.85], COLORS.woodLight),
  box([0.08, 0.8, 0.08], [-1.8, 0.4, -2.75], COLORS.woodLight),
  box([0.08, 0.8, 0.08], [-3.4, 0.4, -2.65], COLORS.woodLight),
  // monitor principal: base, haste, corpo
  box([0.3, 0.03, 0.3], [-4.35, TOP + 0.015, -1.0], COLORS.darker),
  box([0.05, 0.34, 0.05], [-4.42, TOP + 0.2, -1.0], COLORS.darker),
  box([0.06, 0.72, 1.22], [-4.35, 1.56, -1.0], COLORS.bezel),
  // monitor vertical
  box([0.3, 0.03, 0.3], [-4.4, TOP + 0.015, -2.0], COLORS.darker),
  box([0.05, 0.34, 0.05], [-4.45, TOP + 0.2, -2.0], COLORS.darker),
  box([0.05, 0.95, 0.55], [-4.4, 1.6, -2.0], COLORS.bezel),
  // TV na parede -Z, acima da asa
  box([1.7, 1.0, 0.06], [-3.25, 2.3, -3.85], COLORS.bezel),
  // teclado + mouse
  box([0.22, 0.02, 0.6], [-3.75, TOP + 0.01, -1.0], COLORS.dark),
  box([0.06, 0.03, 0.1], [-3.75, TOP + 0.015, -0.45], COLORS.dark),
  // gabinete
  box([0.28, 0.5, 0.5], [-2.2, TOP + 0.25, -3.35], COLORS.dark),
]

export function DeskPlaceholder() {
  return (
    <>
      <MergedParts name="desk_static" parts={DESK_PARTS} />
      {/* Telas: planos separados (Fase 3 troca o material por emissive animado). */}
      <mesh
        name="screen_monitor_main"
        position={[-4.319, 1.56, -1.0]}
        rotation={[0, Math.PI / 2, 0]}
        material={screenMaterial}
        raycast={NO_RAYCAST}
      >
        <planeGeometry args={[1.12, 0.64]} />
      </mesh>
      <mesh
        name="screen_monitor_vertical"
        position={[-4.374, 1.6, -2.0]}
        rotation={[0, Math.PI / 2, 0]}
        material={screenMaterial}
        raycast={NO_RAYCAST}
      >
        <planeGeometry args={[0.5, 0.88]} />
      </mesh>
      <mesh
        name="screen_tv"
        position={[-3.25, 2.3, -3.819]}
        material={screenMaterial}
        raycast={NO_RAYCAST}
      >
        <planeGeometry args={[1.6, 0.9]} />
      </mesh>
      <mesh
        name="led_case"
        position={[-2.2, 1.3, -3.099]}
        material={ledMaterial}
        raycast={NO_RAYCAST}
      >
        <planeGeometry args={[0.04, 0.04]} />
      </mesh>
    </>
  )
}
