import { useRef } from 'react'
import type { Group } from 'three'
import { useHotspot } from '../../interaction/useHotspot'
import { useRoomNode } from '../../scene/baked/RoomContext'
import { useSceneMode } from '../../scene/baked/useSceneMode'
import { LAYOUT } from '../../scene/layout'
import { Hitbox } from '../../scene/placeholders/Hitbox'
import { ChairPlaceholder } from '../../scene/placeholders/ChairPlaceholder'
import { useChairSpring } from './useChairSpring'

/**
 * Hotspot `chair` (Sobre mim). No grey-box desenha o placeholder num grupo giratório
 * (`chair_swivel`); no quarto baked só traz a hitbox: o glb já desenha a cadeira e o
 * `useChairSpring` gira o nó `chair_root` dele (V.3). A hitbox nunca gira.
 */
export function Chair() {
  const { bind } = useHotspot('chair')
  const baked = useSceneMode() === 'baked'
  const swivel = useRef<Group>(null)
  const bakedNode = useRoomNode('chair_root')
  useChairSpring(baked ? bakedNode : swivel)

  return (
    <group
      name={baked ? 'chair_hotspot' : 'chair_root'}
      position={[LAYOUT.chair[0], LAYOUT.chair[1], LAYOUT.chair[2]]}
      {...bind}
    >
      <Hitbox position={[0, 0.6, 0]} size={[0.8, 1.3, 0.8]} />
      {baked ? null : (
        <group ref={swivel} name="chair_swivel">
          <ChairPlaceholder />
        </group>
      )}
    </group>
  )
}
