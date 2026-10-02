import { useEffect, useState } from 'react'
import { MeshBasicMaterial } from 'three'
import { LAYOUT } from '../../scene/layout'
import { SCREEN_OFF_COLOR } from '../../scene/baked/roomNodes'
import { CodeEditorScreen } from '../../scene/life/screens/CodeEditorScreen'
import { WallpaperScreen } from '../../scene/life/screens/WallpaperScreen'
import { ledMaterial, pcGlassMaterial, rgbMaterial } from '../../scene/placeholders/materials'
import { NO_RAYCAST } from '../../scene/placeholders/raycast'

const MAIN = LAYOUT.monitorMain
const VERT = LAYOUT.monitorVertical
const [px, py, pz] = LAYOUT.pcTower

/** Tela do grey-box: material próprio (cada tela troca o `map` do seu), escuro até ligar. */
function useScreenPlaneMaterial(): MeshBasicMaterial {
  const [material] = useState(() => new MeshBasicMaterial({ color: SCREEN_OFF_COLOR, toneMapped: false }))
  useEffect(() => () => material.dispose(), [material])
  return material
}

/**
 * Partes "vivas" da mesa no GREY-BOX (ARCHITECTURE §6.2): telas dos dois monitores e as luzes do PC
 * gamer (vidro lateral voltado para +Z, dois fans, fita RGB e LED frontal). No quarto baked o glb
 * desenha tudo isto e o `RoomLife` anima os nós.
 * V.3: as telas ganham o mesmo conteúdo do baked (papel de parede do SO no monitor horizontal,
 * editor de código no vertical), com `flipY` porque o `PlaneGeometry` tem v = 1 no topo. Os LEDs e
 * as ventoinhas do PC ficam estáticos no grey-box (materiais compartilhados, sem `EmissiveData`).
 */
export function Screens() {
  const mainMaterial = useScreenPlaneMaterial()
  const verticalMaterial = useScreenPlaneMaterial()
  return (
    <>
      <WallpaperScreen material={mainMaterial} flipY />
      <CodeEditorScreen material={verticalMaterial} flipY />
      <mesh
        name="screen_monitor_main"
        position={[MAIN.center[0], MAIN.center[1], MAIN.center[2]]}
        rotation={[0, Math.PI / 2, 0]}
        material={mainMaterial}
        raycast={NO_RAYCAST}
      >
        <planeGeometry args={[MAIN.size[0], MAIN.size[1]]} />
      </mesh>
      <mesh
        name="screen_monitor_vertical"
        position={[VERT.center[0], VERT.center[1], VERT.center[2]]}
        rotation={[0, Math.PI / 2, 0]}
        material={verticalMaterial}
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
