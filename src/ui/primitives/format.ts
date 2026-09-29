/** Preenche modelos de UI_TEXT como 'Slide {n} de {total}'. Chave ausente permanece como está. */
export function fmt(template: string, values: Readonly<Record<string, string | number>>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  )
}
