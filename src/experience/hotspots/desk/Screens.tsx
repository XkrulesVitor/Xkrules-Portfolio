import { LAYOUT } from '../../scene/layout'
import { ledMaterial, pcGlassMaterial, rgbMaterial, screenMaterial } from '../../scene/placeholders/materials'
import { NO_RAYCAST } from '../../scene/placeholders/raycast'

const MAIN = LAYOUT.monitorMain
const VERT = LAYOUT.monitorVertical
const [px, py, pz] = LAYOUT.pcTower

/**
 * Partes "vivas" da mesa (ARCHITECTURE §6.2): telas dos dois monitores e as luzes do PC gamer
 * (vidro lateral voltado para +Z, dois fans, fita RGB e LED frontal).
 * FASE 3 (dono: agente da Fase 3): damp de emissive nas telas com `useHotspot('desk').active`,
 * fans e fita RGB pulsando no hover, LED do gabinete com sin(t). Materiais por instância, sem
 * setState no useFrame. Os nomes dos nós seguem ASSET_PIPELINE §2.
 */
export function Screens() {
  return (
    <>
      <mesh
        name="screen_monitor_main"
        position={[MAIN.center[0], MAIN.center[1], MAIN.center[2]]}
        rotation={[0, Math.PI / 2, 0]}
        material={screenMaterial}
        raycast={NO_RAYCAST}
      >
        <planeGeometry args={[MAIN.size[0], MAIN.size[1]]} />
      </mesh>
      <mesh
        name="screen_monitor_vertical"
        position={[VERT.center[0], VERT.center[1], VERT.center[2]]}
        rotation={[0, Math.PI / 2, 0]}
        material={screenMaterial}
        raycast={NO_RAYCAST}
      >
        <planeGeometry args={[VERT.size[0], VERT.size[1]]} />
      </mesh>
      <mesh name="pc_glass" position={[px, py + 0.31, pz + 0.151]} material={pcGlassMaterial} raycast={NO_RAYCAST}>
        <planeGeometry args={[0.48, 0.54]} />
      </mesh>
      <mesh name="pc_fan_top" position={[px + 0.06, py + 0.44, pz + 0.153]} material={ledMaterial} raycast={NO_RAYCAST}>
        <ringGeometry args={[0.07, 0.095, 28]} />
      </mesh>
      <mesh name="pc_fan_bottom" position={[px + 0.06, py + 0.19, pz + 0.153]} material={ledMaterial} raycast={NO_RAYCAST}>
        <ringGeometry args={[0.07, 0.095, 28]} />
      </mesh>
      <mesh name="pc_rgb" position={[px + 0.23, py + 0.31, pz + 0.153]} material={rgbMaterial} raycast={NO_RAYCAST}>
        <planeGeometry args={[0.02, 0.54]} />
      </mesh>
      <mesh
        name="led_case"
        position={[px + 0.276, py + 0.36, pz]}
        rotation={[0, Math.PI / 2, 0]}
        material={ledMaterial}
        raycast={NO_RAYCAST}
      >
        <planeGeometry args={[0.02, 0.32]} />
      </mesh>
    </>
  )
}
