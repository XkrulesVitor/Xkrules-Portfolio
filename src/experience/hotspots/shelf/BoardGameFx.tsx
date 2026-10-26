import { ImperialFighterFx } from './fx/ImperialFighterFx'
import { VillageMeeplesFx } from './fx/VillageMeeplesFx'

/**
 * Efeitos das duas caixas de board game autorais (ARCHITECTURE §6.4): ao destacar um jogo no painel
 * (`store.highlightBox`), Conquista Galáctica solta um caça imperial que faz um rasante com lasers e
 * Aldeia Dorme faz meeples camponeses saltarem de trás da caixa e cochilarem sob uma lua. Cada um
 * toca uma vez por destaque (~3 s), sem luz real (matcap + brilhos emissivos), acompanha o tema
 * dia/noite e fica desmontado do render (`visible=false`) fora da animação. Funciona no quarto baked
 * (segue o nó `box_<slug>` do glb) e no grey-box (segue o mesh do `GameBox`). Sem animação com
 * `prefers-reduced-motion`.
 */
export function BoardGameFx() {
  return (
    <>
      <ImperialFighterFx />
      <VillageMeeplesFx />
    </>
  )
}
