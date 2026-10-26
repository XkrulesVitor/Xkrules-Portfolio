// Idiomas do site. Módulo FOLHA e de dados puros (sem React, sem imports): é importado pelo store, pelo
// conteúdo e pelos testes do node. O português é o idioma-fonte; o inglês espelha as mesmas chaves.

export const LOCALES = ['pt', 'en'] as const
export type Locale = (typeof LOCALES)[number]

/** Idioma de quem não escolheu nada e do servidor (a página pré-renderizada nasce em português). */
export const DEFAULT_LOCALE: Locale = 'pt'

export interface LocaleInfo {
  /** Valor de `<html lang>`. */
  htmlLang: string
  /** Rótulo curto do seletor de idioma do HUD. */
  label: string
  /** Nome do idioma escrito no próprio idioma (nome acessível do botão do seletor). */
  name: string
  /** Locale do `Intl` (relógio do SO, data do terminal, números). */
  intl: string
}

export const LOCALE_INFO: Readonly<Record<Locale, LocaleInfo>> = {
  pt: { htmlLang: 'pt-BR', label: 'PT', name: 'Português', intl: 'pt-BR' },
  en: { htmlLang: 'en', label: 'EN', name: 'English', intl: 'en-US' },
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}

/** Mapa com uma entrada por idioma: o compilador acusa idioma faltando. */
export type ByLocale<T> = Readonly<Record<Locale, T>>

type UnionToIntersection<U> = (U extends unknown ? (arg: U) => void : never) extends (arg: infer I) => void
  ? I
  : never
type IsUnion<T> = [T] extends [UnionToIntersection<T>] ? false : true

/**
 * Forma de um objeto de texto sem os literais do `as const`: todo texto vira `string`, número vira
 * `number`, e objetos, tuplas e arrays mantêm as MESMAS chaves e o mesmo comprimento de tupla. Uniões de
 * literais (ex.: `'ok' | 'warn'`) ficam como estão: são dados, não texto. A versão em inglês é escrita
 * com `satisfies Widened<typeof PT>`: chave faltando ou sobrando é erro de compilação.
 */
export type Widened<T> = [T] extends [string]
  ? IsUnion<T> extends true
    ? T
    : string
  : [T] extends [number]
    ? number
    : [T] extends [boolean]
      ? boolean
      : { [K in keyof T]: Widened<T[K]> }
