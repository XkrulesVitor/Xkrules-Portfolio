import { StarIcon, TrophyIcon } from '@phosphor-icons/react'
import { motion } from 'motion/react'
import type { AboutAward } from '@/content/types'
import { useContent } from '../../i18n/useLocale'
import { fmt, GlassCard, Reveal, Tag, TodoText } from '../../primitives'
import { PanelSection } from '../PanelSection'
import { STAGGER_LIST } from './stagger'

// Borda, brilho e fundo dourados do prêmio em destaque. Vão por `style` porque a cor da borda do
// GlassCard é fixa (as classes de cor do cartão não se sobrepõem de forma previsível).
const FEATURED_STYLE = {
  borderColor: 'color-mix(in srgb, var(--color-accent-gold) 50%, transparent)',
  backgroundImage:
    'radial-gradient(120% 90% at 0% 0%, rgb(246 196 83 / 0.22), transparent 62%), linear-gradient(135deg, rgb(246 196 83 / 0.07), transparent 55%)',
  boxShadow:
    '0 0 38px -14px rgb(246 196 83 / 0.6), inset 0 1px 0 rgb(255 255 255 / 0.14)',
} as const

/** O primeiro prêmio da lista, em destaque: medalha grande, selo e o detalhe por extenso. */
function FeaturedAward({ award }: { award: AboutAward }) {
  const t = useContent().ui.about
  return (
    <GlassCard variant="inset" padding="md" className="overflow-hidden" style={FEATURED_STYLE}>
      <div className="flex items-start gap-3.5">
        <span
          aria-hidden="true"
          className="grid size-14 shrink-0 place-items-center rounded-2xl border border-accent-gold/50 bg-linear-to-br from-accent-gold/40 to-accent-gold/10 text-accent-gold shadow-[0_10px_24px_-10px_rgb(246_196_83/0.75),inset_0_1px_0_rgb(255_255_255/0.3)]"
        >
          <TrophyIcon size={30} weight="duotone" />
        </span>
        <div className="min-w-0 flex-1">
          <Tag tone="gold" size="sm" icon={StarIcon}>
            {t.featuredAward}
          </Tag>
          <h4 className="mt-2 text-[17px] leading-snug font-semibold text-balance text-ink">
            <TodoText text={award.title} />
          </h4>
          <p className="mt-1 text-xs font-medium text-accent-gold">{award.issuer}</p>
        </div>
      </div>
      {award.detail ? (
        <p className="mt-3 text-sm leading-relaxed text-ink/85">
          <TodoText text={award.detail} />
        </p>
      ) : null}
    </GlassCard>
  )
}

/** Prêmio da lista: cartão compacto com troféu dourado, título, quem concedeu e o detalhe. */
function AwardRow({ award }: { award: AboutAward }) {
  return (
    <GlassCard variant="inset" padding="sm" className="flex items-start gap-3">
      <span
        aria-hidden="true"
        className="grid size-9 shrink-0 place-items-center rounded-xl border border-accent-gold/30 bg-accent-gold/10 text-accent-gold"
      >
        <TrophyIcon size={18} weight="duotone" />
      </span>
      <div className="min-w-0">
        <h4 className="text-sm leading-snug font-semibold text-ink">
          <TodoText text={award.title} />
        </h4>
        <p className="mt-0.5 text-xs font-medium text-accent-gold/90">{award.issuer}</p>
        {award.detail ? (
          <p className="mt-1.5 text-xs leading-relaxed text-ink/75">
            <TodoText text={award.detail} />
          </p>
        ) : null}
      </div>
    </GlassCard>
  )
}

/** Seção "Prêmios": o primeiro da lista em destaque, os demais em cartões compactos (mais recente primeiro). */
export function AwardsSection({ awards }: { awards: readonly AboutAward[] }) {
  const t = useContent().ui.about
  if (awards.length === 0) return null
  const [featured, ...rest] = awards

  return (
    <PanelSection
      title={t.awards}
      action={
        <Tag tone="gold" size="sm" icon={TrophyIcon}>
          {fmt(t.awardsCount, { n: awards.length })}
        </Tag>
      }
    >
      <motion.ul variants={STAGGER_LIST} role="list" className="flex flex-col gap-2.5">
        <li>
          <Reveal>
            <FeaturedAward award={featured} />
          </Reveal>
        </li>
        {rest.map((award) => (
          <li key={award.title + award.issuer}>
            <Reveal>
              <AwardRow award={award} />
            </Reveal>
          </li>
        ))}
      </motion.ul>
    </PanelSection>
  )
}
