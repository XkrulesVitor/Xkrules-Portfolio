import { useEffect } from 'react'
import { FOCUS_QUERY_PARAM } from '@/lib/constants'
import { useExperienceStore } from '@/store/useExperienceStore'

function writeFocusParam(id: string | null) {
  const url = new URL(window.location.href)
  if (id) url.searchParams.set(FOCUS_QUERY_PARAM, id)
  else url.searchParams.delete(FOCUS_QUERY_PARAM)
  const next = `${url.pathname}${url.search}${url.hash}`
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`
  if (next !== current) window.history.replaceState(window.history.state, '', next)
}

/**
 * Sincroniza `?focus=<id>` (deep-link, ARCHITECTURE §3) via history.replaceState:
 * em `focused` grava o id; ao voltar para home, remove. A leitura na carga é feita pelo
 * CameraRig (que pula o voo de introdução).
 */
export function useUrlSync(): void {
  useEffect(() => {
    return useExperienceStore.subscribe(
      (s) => [s.mode, s.focus] as const,
      ([mode, focus]) => {
        if (mode === 'focused' && focus) writeFocusParam(focus)
        else if (mode === 'idle' || (mode === 'transitioning' && focus === null)) writeFocusParam(null)
      },
      { equalityFn: (a, b) => a[0] === b[0] && a[1] === b[1] },
    )
  }, [])
}
