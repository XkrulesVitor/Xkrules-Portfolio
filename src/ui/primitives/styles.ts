/** Anel de foco visível (acento mint). Aplicado a todo controle interativo. */
export const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-mint'

/**
 * Estende a área de hover 3px para baixo. Sem isso, o hover que eleva o elemento 2px faz o
 * cursor sair da borda inferior, o elemento desce, o hover volta e o controle "treme".
 * O elemento precisa ser `relative`.
 */
export const LIFT_HITAREA =
  "after:absolute after:inset-x-0 after:top-full after:h-[3px] after:content-['']"
