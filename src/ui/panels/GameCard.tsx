import { useEffect, useId, type CSSProperties } from 'react'
import { CalendarBlankIcon, CpuIcon, DiceFiveIcon, GameControllerIcon } from '@phosphor-icons/react'
import type { GameProject } from '@/content/types'
import { useExperienceStore } from '@/store/useExperienceStore'
import { GlassCard, LinkButton, SmartImage, Tag, TodoText } from '../primitives'

// Capa sem imagem: gradiente na cor do jogo (a mesma da caixa 3D), sobre o navy do fundo.
const COVER_BACKGROUND =
  'linear-gradient(145deg, color-mix(in srgb, var(--card-accent) 72%, #0b1020), color-mix(in srgb, var(--card-accent) 24%, #0b1020))'

function Cover({ game }: { game: GameProject }) {
  const image = game.images[0]
  const Icon = game.kind === 'tabuleiro' ? DiceFiveIcon : GameControllerIcon
  return (
    <div
      aria-hidden={image ? undefined : true}
      className="relative grid size-[68px] shrink-0 place-items-center overflow-hidden rounded-xl border border-white/15 text-ink/90 shadow-[inset_0_1px_0_rgb(255_255_255/0.2)]"
      style={image ? undefined : { backgroundImage: COVER_BACKGROUND }}
    >
      {image ? (
        <SmartImage image={image} sizes="68px" />
      ) : (
        <Icon size={30} weight="duotone" aria-hidden="true" />
      )}
    </div>
  )
}

/**
 * Cartão de um jogo. Hover (mouse) ou foco (teclado) destacam a caixa correspondente na estante 3D
 * via `store.highlightBox` (ARCHITECTURE §6.4); sair, perder o foco ou desmontar limpa o destaque.
 * O cartão é focável de propósito: sem isso, quem usa teclado nunca veria o destaque de jogos sem link.
 */
export function GameCard({ game }: { game: GameProject }) {
  const titleId = useId()
  const slug = game.slug
  const accent = game.accent ?? 'var(--color-accent-mint)'

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
        <div className="flex min-h-[68px] min-w-0 flex-1 flex-col justify-center">
          <h4 id={titleId} className="text-[15px] leading-snug font-semibold text-ink">
            {game.title}
          </h4>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {game.context ? (
              <Tag tone="blue" size="sm">
                {game.context}
              </Tag>
            ) : null}
            {game.year !== undefined ? (
              <Tag size="sm" icon={CalendarBlankIcon}>
                {game.year}
              </Tag>
            ) : null}
            {game.engine ? (
              <Tag size="sm" icon={CpuIcon}>
                {game.engine}
              </Tag>
            ) : null}
          </div>
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-ink/80">
        <TodoText text={game.summary} />
      </p>
      {game.links.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {game.links.map((link) => (
            <LinkButton key={link.href} link={link} size="sm" />
          ))}
        </div>
      ) : null}
    </GlassCard>
  )
}
