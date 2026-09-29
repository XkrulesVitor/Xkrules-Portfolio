import { useHotspot } from '../../interaction/useHotspot'
import { Hitbox } from '../../scene/placeholders/Hitbox'
import { PrinterPlaceholder } from '../../scene/placeholders/PrinterPlaceholder'

/** Hotspot `printer` (Reino de Amestris). Fase 3: `usePrinterAnimation` nos eixos. */
export function Printer() {
  const { bind } = useHotspot('printer')
  return (
    <group name="printer_group" position={[1.75, 0.9, -3.4]} {...bind}>
      <Hitbox position={[0, 0.2, 0]} size={[2.8, 2.2, 1.3]} />
      <PrinterPlaceholder />
    </group>
  )
}
