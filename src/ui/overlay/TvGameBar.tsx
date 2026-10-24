import { CornersOutIcon, GameControllerIcon } from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'motion/react'
import { GAME_PROJECTS } from '@/content/projects.games'
import { UI_TEXT } from '@/content/site'
import { useExperienceStore } from '@/store/useExperienceStore'
import { cx, EASE, fmt, FOCUS_RING, LinkButton, usePress } from '../primitives'
import { TV_GAME_FRAME_ID } from '../tv/TvGameScreen'

/** Põe o iframe do jogo em tela cheia (top layer: as transformações 3D do Html não valem lá). */
function enterFullscreen() {
  const frame = document.getElementById(TV_GAME_FRAME_ID)
  void frame?.requestFullscreen?.().catch(() => {})
}

/**
 * Barra de controles do jogo na TV, embaixo, na faixa que o preset `shelfTv` deixa livre: nome do
 * jogo, "Tela cheia" e o link do itch.io. Só com o jogo ligado e a câmera em foco.
 */
export function TvGameBar() {
  const t = UI_TEXT.tvGame
  const game = useExperienceStore((s) =>
    s.mode === 'focused' && s.playing ? GAME_PROJECTS.find((g) => g.slug === s.playing) : undefined,
  )
  const press = usePress({ lift: false })
  const itch = game?.links.find((link) => link.kind === 'itch')

  return (
    <AnimatePresence>
      {game ? (
        <motion.div
          key="tv-game-bar"
          role="toolbar"
          aria-label={t.controlsLabel}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.25, ease: EASE }}
          className="pointer-events-auto absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)] py-1.5 pr-1.5 pl-4 text-sm text-ink backdrop-blur-[var(--glass-blur)]"
        >
          <span className="flex items-center gap-2 pr-2 font-medium whitespace-nowrap">
            <GameControllerIcon size={16} weight="duotone" aria-hidden="true" className="text-accent-mint" />
            {game.title}
          </span>
          <motion.button
            type="button"
            aria-label={fmt(t.fullscreenAria, { title: game.title })}
            onClick={enterFullscreen}
            {...press}
            className={cx(
              'inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 text-xs font-medium text-ink/90 transition-colors duration-200 ease-glass hover:border-[var(--glass-border-strong)] hover:bg-[var(--glass-bg-hover)] hover:text-ink',
              FOCUS_RING,
            )}
          >
            <CornersOutIcon size={16} aria-hidden="true" />
            {t.fullscreen}
          </motion.button>
          {itch ? <LinkButton link={{ ...itch, label: t.openItch }} size="sm" /> : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
