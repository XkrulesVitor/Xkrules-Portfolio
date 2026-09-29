import { useEffect } from 'react'
import { FOCUS_QUERY_PARAM, VIEW_QUERY_PARAM } from '@/lib/constants'
import { useExperienceStore } from '@/store/useExperienceStore'

function writeFocusParam(id: string | null, view: string | null = null) {
  const url = new URL(window.location.href)
  if (id) url.searchParams.set(FOCUS_QUERY_PARAM, id)
  else url.searchParams.delete(FOCUS_QUERY_PARAM)
  if (id && view) url.searchParams.set(VIEW_QUERY_PARAM, view)
  else url.searchParams.delete(VIEW_QUERY_PARAM)
  const next = `${url.pathname}${url.search}${url.hash}`
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`
  if (next !== current) window.history.replaceState(window.history.state, '', next)
}

/**
 * Sincroniza `?focus=<id>&view=<vista>` (deep-link, ARCHITECTURE §3) via history.replaceState:
 * em `focused` grava o hotspot e a sub-vista; ao voltar para home, remove. A leitura na carga é
 * feita pelo CameraRig (que pula o voo de introdução).
 */
export function useUrlSync(): void {
  useEffect(() => {
    return useExperienceStore.subscribe(
      (s) => [s.mode, s.focus, s.view] as const,
      ([mode, focus, view]) => {
        if (mode === 'focused' && focus) writeFocusParam(focus, view)
        else if (mode === 'idle' || (mode === 'transitioning' && focus === null)) writeFocusParam(null)
      },
      { equalityFn: (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2] },
    )
  }, [])
}
