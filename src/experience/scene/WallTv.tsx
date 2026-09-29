import { LAYOUT } from './layout'
import { MergedParts } from './placeholders/MergedParts'
import { COLORS, box } from './placeholders/parts'
import { screenMaterial } from './placeholders/materials'
import { NO_RAYCAST } from './placeholders/raycast'

// Centro da TELA em scene/layout.ts (LAYOUT.tv); a moldura fica 3 cm atrás, encostada na parede.
const [tx, ty, tz] = LAYOUT.tv.center
const [tw, th] = LAYOUT.tv.size
const BEZEL_PARTS = [box([tw + 0.08, th + 0.08, 0.06], [0, 0, -0.031], COLORS.bezel)]

/**
 * TV da ZONA DE JOGOS, na parede acima do rack com o console (ARCHITECTURE §6.5). Não é mais da
 * mesa: o hover da mesa não mexe nela.
 * FASE 3 (dono: agente da Fase 3): o material de `screen_tv` segue o store —
 * - `hovered === 'shelf'`: estática retrô (shader com uTime);
 * - `focused` + `focus === 'shelf'` + vista `digital`: tela "ligada" no console, tingida pela cor do
 *   jogo em `highlightBox` (accent de content/projects.games.ts) ou uma tela de título neutra;
 * - senão: apagada. Fita de LED rosa atrás da TV (emissiva, para o Bloom).
 * Sem hitbox própria: o clique na TV cai na hitbox `digital` do rack (hotspots/shelf/Shelf.tsx).
 */
export function WallTv() {
  return (
    <group name="wall_tv" position={[tx, ty, tz]}>
      <MergedParts name="tv_bezel" parts={BEZEL_PARTS} />
      <mesh name="screen_tv" material={screenMaterial} raycast={NO_RAYCAST}>
        <planeGeometry args={[tw, th]} />
      </mesh>
    </group>
  )
}
