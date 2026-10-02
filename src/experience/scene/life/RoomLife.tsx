import { RoomClock } from './RoomClock'
import { RoomLeds } from './RoomLeds'
import { MugSteam } from './MugSteam'
import { CodeEditorScreen } from './screens/CodeEditorScreen'
import { TvScreen } from './screens/TvScreen'
import { useRoomScreenMaterial } from './screens/useRoomScreenMaterial'
import { WallpaperScreen } from './screens/WallpaperScreen'

/**
 * A "vida" do quarto baked (BACKLOG V.3): tudo o que roda em cima do bake e não pertence a um
 * hotspot. Não desenha geometria nova: anima os nós do `room.glb` (por `useRoomNode`) e troca o
 * material de `fx_mug_steam` e das telas `screen_*`.
 *
 * - relógio com a hora real (`RoomClock`), fumaça da caneca (`MugSteam`), LEDs pulsando e
 *   ventoinhas girando (`RoomLeds`): idle do quarto, rodam sempre;
 * - telas: papel de parede do monitor horizontal, editor de código do vertical, TV da zona de jogos
 *   (canvas a no máximo 15 Hz, ver `screens/canvasScreen.ts`).
 *
 * O que é de hotspot fica na pasta do hotspot: cadeira (`hotspots/chair`), impressora
 * (`hotspots/printer`), caixas e partículas (`hotspots/shelf`).
 */
export function RoomLife() {
  const monitorMain = useRoomScreenMaterial('screen_monitor_main')
  const monitorVertical = useRoomScreenMaterial('screen_monitor_vertical')
  const tv = useRoomScreenMaterial('screen_tv')

  return (
    <>
      <RoomClock />
      <MugSteam />
      <RoomLeds />
      <WallpaperScreen material={monitorMain} />
      <CodeEditorScreen material={monitorVertical} />
      <TvScreen material={tv} />
    </>
  )
}
