import { useHotspot } from '../../interaction/useHotspot'
import { useSceneMode } from '../../scene/baked/useSceneMode'
import { LAYOUT } from '../../scene/layout'
import { Hitbox } from '../../scene/placeholders/Hitbox'
import { PrinterPlaceholder } from '../../scene/placeholders/PrinterPlaceholder'

/**
 * Hotspot `printer` (Reino de Amestris). No quarto baked só traz a hitbox (o glb desenha a bancada
 * e os nós `printer_*`, que a V.3 anima por `useRoomNode`); o placeholder é do grey-box.
 */
export function Printer() {
  const { bind } = useHotspot('printer')
  const baked = useSceneMode() === 'baked'
  return (
    <group name="printer_group" position={[LAYOUT.printer[0], LAYOUT.printer[1], LAYOUT.printer[2]]} {...bind}>
      <Hitbox position={[0, 0.2, 0]} size={[2.6, 2.2, 1.3]} />
      {baked ? null : <PrinterPlaceholder />}
    </group>
  )
}
