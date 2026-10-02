import type { GameSlug } from '@/content/types'
import { useRoomNode } from '../../scene/baked/RoomContext'
import { GAME_BOX_NODES, GAME_SLUGS } from './gameBoxNodes'
import { useGameBoxSpring } from './useGameBoxSpring'

/** Uma caixa do glb: acha o nó `box_<slug>` e liga o spring. Não desenha nada. */
function BakedGameBox({ slug }: { slug: GameSlug }) {
  const node = useRoomNode(GAME_BOX_NODES[slug].node)
  useGameBoxSpring(slug, node)
  return null
}

/**
 * As 7 caixas de jogos do quarto baked (ARCHITECTURE §6.4): cada nó `box_*` do glb é movido em
 * runtime (spring para fora da prateleira no hover da zona, maior na caixa do `highlightBox`).
 * São nós vivos do glb: o contorno e a hitbox do hotspot não mudam.
 */
export function BakedGameBoxes() {
  return (
    <>
      {GAME_SLUGS.map((slug) => (
        <BakedGameBox key={slug} slug={slug} />
      ))}
    </>
  )
}
