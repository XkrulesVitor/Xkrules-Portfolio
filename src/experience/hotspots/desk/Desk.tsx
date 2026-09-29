import { useHotspot } from '../../interaction/useHotspot'
import { Hitbox } from '../../scene/placeholders/Hitbox'
import { DeskPlaceholder } from '../../scene/placeholders/DeskPlaceholder'

/** Hotspot `desk` (Projetos Web). Fase 2: `MonitorHtml`; Fase 3: emissive das telas. */
export function Desk() {
  const { bind } = useHotspot('desk')
  return (
    <group name="desk_root" {...bind}>
      {/* mesa principal + monitores + PC gamer */}
      <Hitbox position={[-3.35, 1.15, -0.35]} size={[1.5, 2.3, 3.8]} />
      {/* asa da mesa + TV de parede (scene/WallTv). Termina em x = -1.0, antes da estante. */}
      <Hitbox position={[-2.55, 1.5, -2.8]} size={[3.1, 3.0, 1.3]} />
      <DeskPlaceholder />
    </group>
  )
}
