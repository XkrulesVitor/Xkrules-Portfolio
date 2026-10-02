import { useHotspot } from '../../interaction/useHotspot'
import { useSceneMode } from '../../scene/baked/useSceneMode'
import { LAYOUT } from '../../scene/layout'
import { Hitbox } from '../../scene/placeholders/Hitbox'
import { DeskPlaceholder } from '../../scene/placeholders/DeskPlaceholder'
import { MonitorHtml } from './MonitorHtml'
import { Screens } from './Screens'

const [dx, , dz] = LAYOUT.desk.center
const [, , dd] = LAYOUT.desk.size

/**
 * Hotspot `desk` (Projetos Web): mesa reta, monitores e PC gamer.
 * No grey-box desenha `DeskPlaceholder` + `Screens` (Fase 3: emissive e luzes do PC); no quarto
 * baked o glb desenha tudo (mesa, monitores `screen_*`, PC `pc_*`) e este grupo só traz a hitbox e o
 * `MonitorHtml` (Fase 2.2: SO dentro do monitor, no mesmo lugar nos dois modos).
 */
export function Desk() {
  const { bind } = useHotspot('desk')
  const baked = useSceneMode() === 'baked'
  return (
    <group name="desk_root" {...bind}>
      {/* mesa + monitores + PC gamer. Vai até x = -2.6; o rack da TV começa em -2.55. */}
      <Hitbox position={[dx, 1.15, dz]} size={[1.5, 2.3, dd + 0.1]} />
      {baked ? null : (
        <>
          <DeskPlaceholder />
          <Screens />
        </>
      )}
      <MonitorHtml />
    </group>
  )
}
