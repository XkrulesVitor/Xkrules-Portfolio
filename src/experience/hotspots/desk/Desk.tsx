import { useHotspot } from '../../interaction/useHotspot'
import { LAYOUT } from '../../scene/layout'
import { Hitbox } from '../../scene/placeholders/Hitbox'
import { DeskPlaceholder } from '../../scene/placeholders/DeskPlaceholder'
import { MonitorHtml } from './MonitorHtml'
import { Screens } from './Screens'

const [dx, , dz] = LAYOUT.desk.center
const [, , dd] = LAYOUT.desk.size

/**
 * Hotspot `desk` (Projetos Web): mesa reta, monitores e PC gamer.
 * Pontos de montagem fixos para as fases seguintes, para ninguém precisar editar este arquivo:
 * `Screens` (Fase 3: emissive e luzes do PC) e `MonitorHtml` (Fase 2.2: SO dentro do monitor).
 */
export function Desk() {
  const { bind } = useHotspot('desk')
  return (
    <group name="desk_root" {...bind}>
      {/* mesa + monitores + PC gamer. Vai até x = -2.6; o rack da TV começa em -2.55. */}
      <Hitbox position={[dx, 1.15, dz]} size={[1.5, 2.3, dd + 0.1]} />
      <DeskPlaceholder />
      <Screens />
      <MonitorHtml />
    </group>
  )
}
