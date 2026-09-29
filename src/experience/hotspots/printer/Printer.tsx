import { useHotspot } from '../../interaction/useHotspot'
import { LAYOUT } from '../../scene/layout'
import { Hitbox } from '../../scene/placeholders/Hitbox'
import { PrinterPlaceholder } from '../../scene/placeholders/PrinterPlaceholder'

/** Hotspot `printer` (Reino de Amestris). Fase 3: `usePrinterAnimation` nos eixos. */
export function Printer() {
  const { bind } = useHotspot('printer')
  return (
    <group name="printer_group" position={[LAYOUT.printer[0], LAYOUT.printer[1], LAYOUT.printer[2]]} {...bind}>
      <Hitbox position={[0, 0.2, 0]} size={[2.6, 2.2, 1.3]} />
      <PrinterPlaceholder />
    </group>
  )
}
