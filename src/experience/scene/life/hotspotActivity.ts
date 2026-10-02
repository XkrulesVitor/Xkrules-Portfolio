import type { HotspotId } from '@/content/types'
import type { ExperienceState } from '@/store/useExperienceStore'

/**
 * "Alvo de interação" de um hotspot para as animações da V.3 (ARCHITECTURE §5, BACKLOG V.3):
 * `true` com hover (só existe em `idle`, guarda 3 do store) ou com o hotspot em foco; `false` fora
 * disso; `null` durante `transitioning`, que quer dizer CONGELADO. Em `transitioning` o `hovered` é
 * zerado pelo store, então sem o congelamento a cadeira desvirava no clique e as caixas recuavam no
 * voo de ida. Congelar significa: nada de interação de hotspot começa ou termina no meio de um voo
 * (o que já estava em movimento só termina de assentar). Ao voltar para HOME o alvo se resolve na
 * chegada (`idle`).
 */
export type InteractionTarget = boolean | null

type InteractionState = Pick<ExperienceState, 'mode' | 'focus' | 'hovered'>

export function interactionTarget(s: InteractionState, id: HotspotId): InteractionTarget {
  if (s.mode === 'transitioning') return null
  return s.hovered === id || (s.mode === 'focused' && s.focus === id)
}

/** Resolve o alvo congelado: em `transitioning` mantém o valor anterior. */
export function resolveInteraction(s: InteractionState, id: HotspotId, previous: boolean): boolean {
  return interactionTarget(s, id) ?? previous
}

/** Hotspot realmente em foco (câmera parada nele). Não inclui o voo de ida nem o de volta. */
export function isFocused(s: Pick<ExperienceState, 'mode' | 'focus'>, id: HotspotId): boolean {
  return s.mode === 'focused' && s.focus === id
}
