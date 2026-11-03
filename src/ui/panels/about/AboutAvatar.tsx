import type { AboutContent } from '@/content/types'
import { SmartImage } from '../../primitives'

/** Iniciais do nome, sem o apelido entre aspas: 'Vitor "XKrules" Noronha' -> 'VN'. */
function initials(name: string): string {
  const words = name
    .replace(/["“”][^"“”]*["“”]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
  if (words.length === 0) return ''
  const first = words[0][0]
  const last = words.length > 1 ? words[words.length - 1][0] : ''
  return (first + last).toUpperCase()
}

/**
 * Foto de 96 px num anel em gradiente menta e azul, com um vão escuro entre o anel e a foto.
 * Sem foto, mostra as iniciais sobre o mesmo gradiente.
 */
export function AboutAvatar({ content }: { content: AboutContent }) {
  return (
    <div className="relative size-24 shrink-0 rounded-full bg-linear-to-br from-accent-mint to-accent-blue p-[3px] shadow-[0_0_30px_-8px_var(--color-accent-mint),0_10px_24px_-12px_rgb(0_0_0/0.7)]">
      <div className="size-full rounded-full bg-bg-canvas p-[3px]">
        <div className="relative grid size-full place-items-center overflow-hidden rounded-full bg-linear-to-br from-accent-mint/30 to-accent-blue/30 text-2xl font-semibold tracking-tight text-ink">
          {content.avatar ? (
            <SmartImage image={content.avatar} sizes="96px" priority />
          ) : (
            <span aria-hidden="true">{initials(content.name)}</span>
          )}
        </div>
      </div>
    </div>
  )
}
