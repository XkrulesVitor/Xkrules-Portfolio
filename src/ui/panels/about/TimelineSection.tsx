import { motion } from 'motion/react'
import type { AboutTimelineItem } from '@/content/types'
import { useContent } from '../../i18n/useLocale'
import { cx, Reveal, TodoText } from '../../primitives'
import { PanelSection } from '../PanelSection'
import { STAGGER_LIST } from './stagger'

/** Ponto da linha do tempo. O primeiro item (o mais recente) acende em menta. */
function Dot({ current }: { current: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        'absolute top-[5px] left-0 size-[11px] rounded-full border-2',
        current
          ? 'border-accent-mint bg-accent-mint shadow-[0_0_10px_var(--color-accent-mint)]'
          : 'border-accent-blue/60 bg-bg-canvas',
      )}
    />
  )
}

function TimelineEntry({ item, current }: { item: AboutTimelineItem; current: boolean }) {
  return (
    <li>
      {/* O ponto fica dentro do Reveal para subir junto com o texto. */}
      <Reveal className="relative pl-7">
        <Dot current={current} />
        <h4 className="text-sm leading-snug font-semibold text-ink">
          <TodoText text={item.role} />
        </h4>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
          <span className="text-ink/75">{item.place}</span>
          <span aria-hidden="true" className="size-[3px] rounded-full bg-ink/30" />
          <span className="font-medium text-accent-blue tabular-nums">{item.period}</span>
        </p>
        {item.detail ? (
          <p className="mt-1.5 text-xs leading-relaxed text-ink/70">
            <TodoText text={item.detail} />
          </p>
        ) : null}
      </Reveal>
    </li>
  )
}

/** Seção "Trajetória": linha do tempo vertical, do mais recente para o mais antigo. */
export function TimelineSection({ timeline }: { timeline: readonly AboutTimelineItem[] }) {
  const t = useContent().ui.about
  if (timeline.length === 0) return null

  return (
    <PanelSection title={t.timeline}>
      <div className="relative">
        {/* Trilho: some no fim, sugerindo que a história continua. O centro dos pontos fica em 5,5 px. */}
        <span
          aria-hidden="true"
          className="absolute top-2 bottom-1 left-[5px] w-px bg-linear-to-b from-accent-mint/60 via-accent-blue/30 to-transparent"
        />
        <motion.ol variants={STAGGER_LIST} role="list" className="flex flex-col gap-5">
          {timeline.map((item, i) => (
            <TimelineEntry key={item.role + item.period} item={item} current={i === 0} />
          ))}
        </motion.ol>
      </div>
    </PanelSection>
  )
}
