import { OS_TEXT } from '@/content/os'
import shared from './shared.module.css'

// Um único grupo de captura: no `split`, os marcadores caem nos índices ímpares.
const TODO_SPLIT = /(\[TODO:[^\]]*\])/

/**
 * Texto de conteúdo com os marcadores `[TODO: ...]` destacados. Conteúdo que falta fica visível no
 * SO (chip âmbar tracejado) em vez de passar por texto final. Medidas em px de design (--px): o
 * `TodoText` das primitivas usa rem e não escalaria com o monitor.
 */
export function OsTodoText({ text }: { text: string }) {
  const parts = text.split(TODO_SPLIT)
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} title={OS_TEXT.todoHint} className={shared.todo}>
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  )
}
