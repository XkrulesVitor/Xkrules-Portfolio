import { MapPinIcon } from '@phosphor-icons/react'
import { ABOUT } from '@/content/about'
import { getHotspot } from '@/content/hotspots'
import { SITE, UI_TEXT } from '@/content/site'
import type { AboutContent } from '@/content/types'
import { LinkButton, SmartImage, Tag, TodoText } from '../primitives'
import { PanelSection } from './PanelSection'
import { PanelShell } from './PanelShell'

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

function Avatar({ content }: { content: AboutContent }) {
  return (
    <div className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-full border border-[var(--glass-border-strong)] bg-linear-to-br from-accent-mint/30 to-accent-blue/30 text-lg font-semibold tracking-tight text-ink shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_8px_20px_-10px_rgb(0_0_0/0.6)]">
      {content.avatar ? (
        <SmartImage image={content.avatar} sizes="56px" priority />
      ) : (
        <span aria-hidden="true">{initials(content.name)}</span>
      )}
    </div>
  )
}

interface AboutPanelProps {
  /** Conteúdo. Padrão: content/about.ts. */
  content?: AboutContent
  autoFocus?: boolean
}

/** Painel do hotspot `chair`: quem eu sou, habilidades e links. Data-driven (content/about.ts). */
export function AboutPanel({ content = ABOUT, autoFocus }: AboutPanelProps) {
  const t = UI_TEXT.about
  const sourceLink = { label: t.sourceCode, href: SITE.sourceUrl, kind: 'repo' } as const

  return (
    <PanelShell
      hotspotId="chair"
      eyebrow={getHotspot('chair').label}
      title={content.name}
      subtitle={content.headline}
      leading={<Avatar content={content} />}
      autoFocus={autoFocus}
    >
      <PanelSection>
        {content.location ? (
          <p className="flex items-center gap-1.5 text-xs text-ink/70">
            <MapPinIcon size={14} weight="duotone" aria-hidden="true" />
            {content.location}
          </p>
        ) : null}
        <div className="flex flex-col gap-3 text-sm leading-relaxed text-ink/85">
          {content.bio.map((paragraph, i) => (
            <p key={i}>
              <TodoText text={paragraph} />
            </p>
          ))}
        </div>
      </PanelSection>

      <PanelSection title={t.skills}>
        <div className="flex flex-col gap-4">
          {content.skills.map((group) => (
            <div key={group.label} className="flex flex-col gap-2">
              <p className="text-xs font-medium text-ink/75">{group.label}</p>
              <ul className="flex flex-wrap gap-1.5">
                {group.items.map((item) => (
                  <li key={item}>
                    <Tag>
                      <TodoText text={item} />
                    </Tag>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </PanelSection>

      <PanelSection title={t.links}>
        {content.links.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {content.links.map((link) => (
              <LinkButton key={link.href} link={link} />
            ))}
          </div>
        ) : null}
        <LinkButton link={sourceLink} variant="accent" className="w-full" />
      </PanelSection>
    </PanelShell>
  )
}
