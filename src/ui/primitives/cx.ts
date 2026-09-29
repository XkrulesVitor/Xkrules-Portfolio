/**
 * Junta classes ignorando valores falsos.
 * Não há tailwind-merge no projeto: as variantes dos primitivos não se sobrepõem, e `className`
 * externo só acrescenta (layout, margem), nunca troca cor ou tamanho.
 */
export function cx(...parts: ReadonlyArray<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}
