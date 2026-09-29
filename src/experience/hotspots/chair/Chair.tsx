import { useHotspot } from '../../interaction/useHotspot'
import { Hitbox } from '../../scene/placeholders/Hitbox'
import { ChairPlaceholder } from '../../scene/placeholders/ChairPlaceholder'

/** Hotspot `chair` (Sobre mim). Fase 3: `useChairSpring` gira `chair_root` no hover. */
export function Chair() {
  const { bind } = useHotspot('chair')
  return (
    <group name="chair_root" position={[-2.75, 0, -1.0]} {...bind}>
      <Hitbox position={[0, 0.6, 0]} size={[0.8, 1.3, 0.8]} />
      <ChairPlaceholder />
    </group>
  )
}
