import { useEffect, useState } from 'react'
import { MeshBasicMaterial } from 'three'
import { SCREEN_OFF_COLOR } from './baked/roomNodes'
import { LAYOUT } from './layout'
import { TvScreen } from './life/screens/TvScreen'
import { MergedParts } from './placeholders/MergedParts'
import { COLORS, box } from './placeholders/parts'
import { NO_RAYCAST } from './placeholders/raycast'

// Centro da TELA em scene/layout.ts (LAYOUT.tv); a moldura fica 3 cm atrás, encostada na parede.
const [tx, ty, tz] = LAYOUT.tv.center
const [tw, th] = LAYOUT.tv.size
const BEZEL_PARTS = [box([tw + 0.08, th + 0.08, 0.06], [0, 0, -0.031], COLORS.bezel)]

/**
 * TV da ZONA DE JOGOS do GREY-BOX, na parede acima do rack com o console (ARCHITECTURE §6.5). No
 * quarto baked o glb desenha a TV (`screen_tv`) e o `RoomLife` liga o `TvScreen` ao material dela.
 * V.3: aqui o `TvScreen` segue o store, igual ao baked —
 * - `hovered === 'shelf'`: estática retrô;
 * - `focused` + `focus === 'shelf'` + vista `digital`: tela de título tingida pela cor do jogo em
 *   `highlightBox` (accent de content/projects.games.ts), ou a tela neutra da zona;
 * - senão: o logo XKRULES quicando.
 * `flipY` porque o `PlaneGeometry` tem v = 1 no topo. Sem hitbox própria: o clique na TV cai na
 * hitbox `digital` do rack (hotspots/shelf/Shelf.tsx).
 */
export function WallTv() {
  const [material] = useState(() => new MeshBasicMaterial({ color: SCREEN_OFF_COLOR, toneMapped: false }))
  useEffect(() => () => material.dispose(), [material])

  return (
    <group name="wall_tv" position={[tx, ty, tz]}>
      <MergedParts name="tv_bezel" parts={BEZEL_PARTS} />
      <mesh name="screen_tv" material={material} raycast={NO_RAYCAST}>
        <planeGeometry args={[tw, th]} />
      </mesh>
      <TvScreen material={material} flipY />
    </group>
  )
}
