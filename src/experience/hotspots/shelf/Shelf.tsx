import { useHotspot } from '../../interaction/useHotspot'
import { Hitbox } from '../../scene/placeholders/Hitbox'
import { ShelfPlaceholder } from '../../scene/placeholders/ShelfPlaceholder'
import type { Vec3 } from '../../scene/placeholders/parts'
import { GameBox } from './GameBox'

interface BoxSlot {
  slug: string
  position: Vec3
  color: string
}

// Prateleira 1 (piso em y = 0.055) e 2 (piso em y = 0.705); 4 caixas em cada.
const BOXES: readonly BoxSlot[] = [
  { slug: 'porrilandia', position: [-0.6, 0.265, 0.1], color: '#e4572e' },
  { slug: 'terra', position: [-0.2, 0.265, 0.1], color: '#4c8bf5' },
  { slug: 'aldeia_dorme', position: [0.2, 0.265, 0.1], color: '#f2c14e' },
  { slug: 'peter', position: [0.6, 0.265, 0.1], color: '#57b894' },
  { slug: 'o_anel', position: [-0.6, 0.915, 0.1], color: '#b5651d' },
  { slug: 'extra_1', position: [-0.2, 0.915, 0.1], color: '#8e6bbf' },
  { slug: 'extra_2', position: [0.2, 0.915, 0.1], color: '#3fb8c9' },
  { slug: 'extra_3', position: [0.6, 0.915, 0.1], color: '#e58bb2' },
]

/** Hotspot `shelf` (Board games e game dev). Fase 3: caixas com spring + `ShelfParticles`. */
export function Shelf() {
  const { bind } = useHotspot('shelf')
  return (
    <group name="shelf_root" position={[4.0, 0, -3.6]} {...bind}>
      <Hitbox position={[0, 1.35, 0.05]} size={[1.95, 2.8, 0.7]} />
      <ShelfPlaceholder />
      {BOXES.map((b) => (
        <GameBox key={b.slug} slug={b.slug} position={b.position} color={b.color} />
      ))}
    </group>
  )
}
