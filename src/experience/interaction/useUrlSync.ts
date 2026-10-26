import { useEffect } from 'react'
import type { Locale } from '@/content/i18n'
import { FOCUS_QUERY_PARAM, LANG_QUERY_PARAM, VIEW_QUERY_PARAM } from '@/lib/constants'
import { useExperienceStore } from '@/store/useExperienceStore'

/** Troca a URL (sem recarregar nem empilhar histórico) se `update` mudou algum parâmetro. */
function replaceSearchParams(update: (params: URLSearchParams) => void) {
  const url = new URL(window.location.href)
  update(url.searchParams)
  const next = `${url.pathname}${url.search}${url.hash}`
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`
  if (next !== current) window.history.replaceState(window.history.state, '', next)
}

function writeFocusParam(id: string | null, view: string | null = null) {
  replaceSearchParams((params) => {
    if (id) params.set(FOCUS_QUERY_PARAM, id)
    else params.delete(FOCUS_QUERY_PARAM)
    if (id && view) params.set(VIEW_QUERY_PARAM, view)
    else params.delete(VIEW_QUERY_PARAM)
  })
}

function writeLangParam(locale: Locale) {
  replaceSearchParams((params) => params.set(LANG_QUERY_PARAM, locale))
}

/**
 * Sincroniza a URL com o store via history.replaceState:
 * - `?focus=<id>&view=<vista>` (deep-link, ARCHITECTURE §3): em `focused` grava o hotspot e a sub-vista;
 *   ao voltar para home, remove. A leitura na carga é feita pelo CameraRig (que pula o voo de introdução).
 * - `?lang=pt|en`: o idioma ativo, sempre presente (gravado já na montagem e a cada troca). Um link copiado
 *   abre no mesmo idioma; sem ele, vale o idioma salvo e depois o do navegador (`lib/locale.ts`).
 */
export function useUrlSync(): void {
  useEffect(() => {
    const unsubscribeFocus = useExperienceStore.subscribe(
      (s) => [s.mode, s.focus, s.view] as const,
      ([mode, focus, view]) => {
        if (mode === 'focused' && focus) writeFocusParam(focus, view)
        else if (mode === 'idle' || (mode === 'transitioning' && focus === null)) writeFocusParam(null)
      },
      { equalityFn: (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2] },
    )
    const unsubscribeLang = useExperienceStore.subscribe((s) => s.locale, writeLangParam, {
      fireImmediately: true,
    })
    return () => {
      unsubscribeFocus()
      unsubscribeLang()
    }
  }, [])
}
