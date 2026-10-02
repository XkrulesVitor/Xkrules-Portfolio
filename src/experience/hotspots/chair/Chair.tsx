import { useHotspot } from '../../interaction/useHotspot'
import { useSceneMode } from '../../scene/baked/useSceneMode'
import { LAYOUT } from '../../scene/layout'
import { Hitbox } from '../../scene/placeholders/Hitbox'
import { ChairPlaceholder } from '../../scene/placeholders/ChairPlaceholder'

/**
 * Hotspot `chair` (Sobre mim). No grey-box desenha o placeholder (grupo `chair_root`); no quarto
 * baked só traz a hitbox: o glb já desenha a cadeira e a V.3 gira o nó `chair_root` dele por
 * `useRoomNode`. Fase 3/V.3: `useChairSpring` no hover.
 */
export function Chair() {
  const { bind } = useHotspot('chair')
  const baked = useSceneMode() === 'baked'
  return (
    <group
      name={baked ? 'chair_hotspot' : 'chair_root'}
      position={[LAYOUT.chair[0], LAYOUT.chair[1], LAYOUT.chair[2]]}
      {...bind}
    >
      <Hitbox position={[0, 0.6, 0]} size={[0.8, 1.3, 0.8]} />
      {baked ? null : <ChairPlaceholder />}
    </group>
  )
}
