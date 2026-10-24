import { useEffect, useId, useState, type CSSProperties, type ReactNode } from 'react'
import {
  CalendarBlankIcon,
  CaretDownIcon,
  ClockIcon,
  CpuIcon,
  DiceFiveIcon,
  GameControllerIcon,
  TrophyIcon,
  UsersThreeIcon,
} from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'motion/react'
import { UI_TEXT } from '@/content/site'
import type { GameProject } from '@/content/types'
import { useExperienceStore } from '@/store/useExperienceStore'
import { cx, EASE, FOCUS_RING, GlassCard, LinkButton, SmartImage, Tag, TodoText, useReduceMotion } from '../primitives'

// Capa sem imagem: gradiente na cor do jogo, sobre o navy do fundo.
const COVER_BACKGROUND =
  'linear-gradient(145deg, color-mix(in srgb, var(--card-accent) 72%, #0b1020), color-mix(in srgb, var(--card-accent) 24%, #0b1020))'

/** Capa quadrada (a mesma arte da caixa no quarto 3D); sem capa, gradiente com o ícone da categoria. */
function Cover({ game }: { game: GameProject }) {
  const image = game.cover ?? game.images[0]
  const Icon = game.kind === 'tabuleiro' ? DiceFiveIcon : GameControllerIcon
  return (
    <div
      aria-hidden={image ? undefined : true}
      className="relative grid size-[84px] shrink-0 place-items-center overflow-hidden rounded-xl border border-[color-mix(in_srgb,var(--card-accent)_45%,rgb(255_255_255/0.15))] text-ink/90 shadow-[inset_0_1px_0_rgb(255_255_255/0.2),0_10px_22px_-12px_color-mix(in_srgb,var(--card-accent)_70%,transparent)]"
      style={image ? undefined : { backgroundImage: COVER_BACKGROUND }}
    >
      {image ? <SmartImage image={image} sizes="84px" /> : <Icon size={34} weight="duotone" aria-hidden="true" />}
    </div>
  )
}

/** Etiqueta com o nome do dado só para leitores de tela ("Ano: 2025"); o texto visível é o valor. */
function Meta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <span className="sr-only">{label}: </span>
      {children}
    </>
  )
}

/**
 * Cartão de um jogo: capa, título, gênero, etiquetas (prêmio, contexto, ano, ferramenta, jogadores e
 * duração), o primeiro parágrafo e, atrás do "Ler mais", o resto da descrição. Hover (mouse) ou foco
 * (teclado) destacam a caixa correspondente no quarto via `store.highlightBox` (ARCHITECTURE §6.4);
 * sair, perder o foco ou desmontar limpa o destaque. O cartão é focável de propósito: sem isso, quem
 * usa teclado nunca veria o destaque de jogos sem link.
 */
export function GameCard({ game }: { game: GameProject }) {
  const t = UI_TEXT.games
  const titleId = useId()
  const detailsId = useId()
  const reduce = useReduceMotion()
  const [expanded, setExpanded] = useState(false)
  const slug = game.slug
  const accent = game.accent ?? 'var(--color-accent-mint)'
  const details = game.details ?? []

  useEffect(
    () => () => {
      // Sai da tela ainda destacado (troca de aba): solta o destaque.
      const store = useExperienceStore.getState()
      if (store.highlightBox === slug) store.setHighlightBox(null)
    },
    [slug],
  )

  const highlight = (on: boolean) => useExperienceStore.getState().setHighlightBox(on ? slug : null)

  const style = {
    '--card-accent': accent,
    '--glass-hover-border': 'color-mix(in srgb, var(--card-accent) 65%, white)',
  } as CSSProperties

  return (
    <GlassCard
      variant="inset"
      padding="md"
      interactive
      role="group"
      aria-labelledby={titleId}
      tabIndex={0}
      style={style}
      // onHoverStart/End só disparam com mouse ou caneta (toque não tem hover).
      onHoverStart={() => highlight(true)}
      onHoverEnd={() => highlight(false)}
      onFocus={() => highlight(true)}
      onBlur={(e) => {
        // Foco indo para outro controle do mesmo cartão não solta o destaque.
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) highlight(false)
      }}
    >
      <div className="flex gap-3.5">
        <Cover game={game} />
        <div className="flex min-h-[84px] min-w-0 flex-1 flex-col justify-center">
          <h4 id={titleId} className="text-[15px] leading-snug font-semibold text-ink">
            {game.title}
          </h4>
          {game.genre ? <p className="mt-0.5 text-xs leading-snug text-ink/65">{game.genre}</p> : null}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {game.award ? (
              <Tag tone="gold" size="sm" icon={TrophyIcon}>
                <Meta label={t.meta.award}>{game.award}</Meta>
              </Tag>
            ) : null}
            {game.context ? (
              <Tag tone="blue" size="sm">
                {game.context}
              </Tag>
            ) : null}
            {game.year !== undefined ? (
              <Tag size="sm" icon={CalendarBlankIcon}>
                <Meta label={t.meta.year}>{game.year}</Meta>
              </Tag>
            ) : null}
            {game.engine ? (
              <Tag size="sm" icon={CpuIcon}>
                <Meta label={t.meta.engine}>{game.engine}</Meta>
              </Tag>
            ) : null}
            {game.players ? (
              <Tag size="sm" icon={UsersThreeIcon}>
                <Meta label={t.meta.players}>{game.players}</Meta>
              </Tag>
            ) : null}
            {game.playTime ? (
              <Tag size="sm" icon={ClockIcon}>
                <Meta label={t.meta.playTime}>{game.playTime}</Meta>
              </Tag>
            ) : null}
          </div>
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-ink/80">
        <TodoText text={game.summary} />
      </p>
      <AnimatePresence initial={false}>
        {expanded && details.length > 0 ? (
          <motion.div
            key="details"
            id={detailsId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.3, ease: EASE }}
            className="overflow-hidden"
          >
            {details.map((paragraph) => (
              <p key={paragraph} className="mt-2.5 text-sm leading-relaxed text-ink/80">
                <TodoText text={paragraph} />
              </p>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {game.links.length > 0 || details.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {game.links.map((link) => (
            <LinkButton key={link.href} link={link} size="sm" />
          ))}
          {details.length > 0 ? (
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={expanded ? detailsId : undefined}
              onClick={() => setExpanded((v) => !v)}
              className={cx(
                'ml-auto inline-flex min-h-8 cursor-pointer items-center gap-1 rounded-full px-2.5 text-xs font-medium text-ink/75 transition-colors duration-200 ease-glass hover:bg-[var(--glass-bg-hover)] hover:text-ink pointer-coarse:min-h-10',
                FOCUS_RING,
              )}
            >
              {expanded ? t.readLess : t.readMore}
              <CaretDownIcon
                size={12}
                weight="bold"
                aria-hidden="true"
                className={cx('transition-transform duration-300 ease-glass', expanded && 'rotate-180')}
              />
            </button>
          ) : null}
        </div>
      ) : null}
    </GlassCard>
  )
}
