// Detecção e persistência do idioma. Módulo FOLHA e quase puro (só importa o `content/i18n.ts`, também
// folha): importável pelo store e testado com `node --test`. As funções que tocam o navegador recebem
// as fontes (URL, storage, idioma do navegador) por argumento, para os testes injetarem as deles.
import { DEFAULT_LOCALE, LOCALE_INFO, LOCALES, type Locale } from '../content/i18n.ts'
import { LANG_QUERY_PARAM } from './constants.ts'

/** Chave do localStorage com o idioma que o visitante escolheu. */
export const LOCALE_STORAGE_KEY = 'portfolio3d:locale'

/** O mínimo de `Storage` que usamos (facilita injetar um falso nos testes). */
export interface KeyValueStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

/** `window.localStorage`, ou `null` fora do browser ou com o armazenamento bloqueado. */
export function getBrowserStorage(): KeyValueStorage | null {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage ?? null
  } catch {
    return null
  }
}

/**
 * Idioma de um texto solto: `pt`, `en`, `pt-BR`, `EN-us`... (só vale o prefixo antes do hífen).
 * Qualquer outra coisa, vazia ou ausente vira `null`.
 */
export function parseLocale(value: string | null | undefined): Locale | null {
  if (!value) return null
  const base = value.trim().toLowerCase().split(/[-_]/)[0]
  return LOCALES.find((locale) => locale === base) ?? null
}

/** Fontes do idioma, da mais forte para a mais fraca. Todas opcionais. */
export interface LocaleSources {
  /** `location.search` (com ou sem o `?`). */
  search?: string | null
  /** Valor salvo no localStorage. */
  stored?: string | null
  /** `navigator.language`. */
  language?: string | null
}

/**
 * Escolhe o idioma: `?lang=` na URL > o que o visitante salvou > idioma do navegador (começa com `pt`
 * é português; qualquer outro é inglês).
 */
export function pickLocale({ search, stored, language }: LocaleSources): Locale {
  const fromUrl = parseLocale(new URLSearchParams(search ?? '').get(LANG_QUERY_PARAM))
  if (fromUrl) return fromUrl
  const fromStorage = parseLocale(stored)
  if (fromStorage) return fromStorage
  return language?.trim().toLowerCase().startsWith('pt') ? 'pt' : 'en'
}

/** Lê o idioma salvo. Nunca lança: sem armazenamento, volta `null`. */
export function readStoredLocale(storage: KeyValueStorage | null = getBrowserStorage()): string | null {
  if (!storage) return null
  try {
    return storage.getItem(LOCALE_STORAGE_KEY)
  } catch {
    return null
  }
}

/** Salva a escolha. Nunca lança: a página funciona sem localStorage. */
export function writeStoredLocale(
  locale: Locale,
  storage: KeyValueStorage | null = getBrowserStorage(),
): void {
  if (!storage) return
  try {
    storage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    // Cota cheia, modo privado ou bloqueio: a escolha só vale nesta sessão.
  }
}

/** Idioma inicial. No navegador segue `pickLocale`; no servidor (e nos testes do node) é o padrão. */
export function detectInitialLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE
  return pickLocale({
    search: window.location?.search,
    stored: readStoredLocale(),
    language: typeof navigator === 'undefined' ? null : navigator.language,
  })
}

/** Põe o código do idioma em `<html lang>`. Fora do navegador não faz nada. */
export function applyDocumentLang(locale: Locale): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const lang = LOCALE_INFO[locale].htmlLang
  if (root && root.lang !== lang) root.lang = lang
}
