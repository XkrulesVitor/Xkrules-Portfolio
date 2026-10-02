import { useEffect, useRef } from 'react'
import type { HotspotId } from '@/content/types'
import { useExperienceStore } from '@/store/useExperienceStore'
import { interactionTarget, type InteractionTarget } from './hotspotActivity'

/**
 * Chama `apply(active)` quando o alvo de interação do hotspot muda (e uma vez na montagem), sem
 * re-renderizar o componente e sem chamar durante `transitioning`. Para springs: o `apply` dispara
 * `spring.start(...)`.
 */
export function useInteractionEffect(id: HotspotId, apply: (active: boolean) => void): void {
  const applyRef = useRef(apply)
  useEffect(() => {
    applyRef.current = apply
  })

  useEffect(() => {
    const emit = (target: InteractionTarget) => {
      if (target !== null) applyRef.current(target)
    }
    emit(interactionTarget(useExperienceStore.getState(), id))
    return useExperienceStore.subscribe((s) => interactionTarget(s, id), emit)
  }, [id])
}
