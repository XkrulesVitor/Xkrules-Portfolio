import { useSyncExternalStore } from 'react'
import { DEFAULT_LOCALE, type Locale } from '@/content/i18n'
import { contentFor, type LocalizedContent } from '@/content/locales'
import type { OsText } from '@/content/os'
import type { UiText } from '@/content/site'
import { useExperienceStore } from '@/store/useExperienceStore'

// Os textos de toda a interface passam por aqui: o locale vem do store e cada hook devolve o conteúdo
// daquele idioma (`content/locales.ts`). Componentes não importam `UI_TEXT` nem `OS_TEXT` direto: esses
// nomes valem o português, para o server component (`app/page.tsx`) e o canvas.

const subscribe = (onChange: () => void) => useExperienceStore.subscribe((s) => s.locale, onChange)
const getLocale = (): Locale => useExperienceStore.getState().locale
// O HTML do servidor (e o do fallback da tela de loading) é sempre em português. Na hidratação o React
// usa este valor, para o primeiro render bater com o HTML, e logo depois troca para o idioma detectado.
const getServerLocale = (): Locale => DEFAULT_LOCALE

/** Idioma ativo. Re-renderiza quando o visitante troca de idioma. */
export function useLocale(): Locale {
  return useSyncExternalStore(subscribe, getLocale, getServerLocale)
}

/** Todo o conteúdo no idioma ativo (a referência de cada idioma é estável). */
export function useContent(): LocalizedContent {
  return contentFor(useLocale())
}

/** Strings de interface (HUD, painéis, primitivas, jogo na TV) no idioma ativo. */
export function useUiText(): UiText {
  return useContent().ui
}

/** Strings do XkrulesOS no idioma ativo. */
export function useOsText(): OsText {
  return useContent().os
}
