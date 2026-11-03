import { MapPinIcon } from '@phosphor-icons/react'
import { SITE } from '@/content/site'
import type { AboutContent } from '@/content/types'
import { useContent } from '../i18n/useLocale'
import { GlassCard, LinkButton, TodoText } from '../primitives'
import { AboutAvatar } from './about/AboutAvatar'
import { AwardsSection } from './about/AwardsSection'
import { SkillsSection } from './about/SkillsSection'
import { TimelineSection } from './about/TimelineSection'
import { PanelSection } from './PanelSection'
import { PanelShell } from './PanelShell'

interface AboutPanelProps {
  /** Conteúdo. Padrão: content/about.ts, no idioma ativo. */
  content?: AboutContent
  autoFocus?: boolean
}

/**
 * Painel do hotspot `chair`: quem eu sou. Cabeçalho com a foto, frase de abertura, bio, prêmios,
 * trajetória, habilidades e links. Data-driven (content/about.ts); `tagline`, `awards` e `timeline`
 * são opcionais e a seção some quando falta o dado.
 */
export function AboutPanel({ content: given, autoFocus }: AboutPanelProps) {
  const { ui, about, getHotspot } = useContent()
  const content = given ?? about
  const t = ui.about
  const sourceLink = { label: t.sourceCode, href: SITE.sourceUrl, kind: 'repo' } as const

  return (
    <PanelShell
      hotspotId="chair"
      eyebrow={getHotspot('chair').label}
      title={content.name}
      subtitle={content.headline}
      leading={<AboutAvatar content={content} />}
      autoFocus={autoFocus}
    >
      <PanelSection>
        {content.location ? (
          <p className="flex items-center gap-1.5 text-xs text-ink/70">
            <MapPinIcon size={14} weight="duotone" aria-hidden="true" className="text-accent-mint" />
            {content.location}
          </p>
        ) : null}
        {content.tagline ? (
          <GlassCard variant="inset" padding="md" className="overflow-hidden">
            <span
              aria-hidden="true"
              className="absolute inset-y-3 left-0 w-[3px] rounded-full bg-linear-to-b from-accent-mint to-accent-blue"
            />
            <p className="pl-2 text-[17px] leading-snug font-medium text-balance text-ink">
              <TodoText text={content.tagline} />
            </p>
          </GlassCard>
        ) : null}
      </PanelSection>

      <PanelSection>
        <div className="flex flex-col gap-3 text-sm leading-relaxed text-ink/85">
          {content.bio.map((paragraph, i) => (
            <p key={i}>
              <TodoText text={paragraph} />
            </p>
          ))}
        </div>
      </PanelSection>

      <AwardsSection awards={content.awards ?? []} />
      <TimelineSection timeline={content.timeline ?? []} />
      <SkillsSection skills={content.skills} />

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
