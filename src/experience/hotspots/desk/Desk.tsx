import { useHotspot } from '../../interaction/useHotspot'
import { Hitbox } from '../../scene/placeholders/Hitbox'
import { DeskPlaceholder } from '../../scene/placeholders/DeskPlaceholder'

/** Hotspot `desk` (Projetos Web). Fase 2: `MonitorHtml`; Fase 3: emissive das telas. */
export function Desk() {
  const { bind } = useHotspot('desk')
  return (
    <group name="desk_root" {...bind}>
      {/* mesa principal + monitores */}
      <Hitbox position={[-4.05, 1.05, -0.85]} size={[1.5, 2.1, 3.9]} />
      {/* asa da mesa + TV de parede (scene/WallTv) + gabinete. Termina em x = -1.7, antes da estante. */}
      <Hitbox position={[-3.25, 1.5, -3.3]} size={[3.1, 3.0, 1.3]} />
      <DeskPlaceholder />
    </group>
  )
}
