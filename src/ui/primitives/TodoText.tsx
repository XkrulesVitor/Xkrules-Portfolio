import { UI_TEXT } from '@/content/site'

// Um único grupo de captura: no `split`, os marcadores caem nos índices ímpares.
const TODO_SPLIT = /(\[TODO:[^\]]*\])/

/**
 * Renderiza um texto de conteúdo destacando os marcadores `[TODO: ...]`. Conteúdo que falta
 * fica visível na UI (chip âmbar tracejado) em vez de passar por texto final.
 */
export function TodoText({ text }: { text: string }) {
  const parts = text.split(TODO_SPLIT)
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark
            key={i}
            title={UI_TEXT.panel.todo}
            className="rounded-sm border border-dashed border-todo/50 bg-todo/10 px-1 py-px font-mono text-[0.86em] text-todo"
          >
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  )
}
