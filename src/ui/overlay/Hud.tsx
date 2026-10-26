import { MoonIcon, SunIcon } from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'motion/react'
import { SITE } from '@/content/site'
import { selectHovered, selectMode } from '@/store/selectors'
import { useExperienceStore } from '@/store/useExperienceStore'
import { useContent, useUiText } from '../i18n/useLocale'
import { LanguageSwitch } from './LanguageSwitch'
import { SoundMenu } from './SoundMenu'

/** Classes comuns dos botões de pílula do topo-direita (tema e som, este dentro do SoundMenu; o seletor de idioma tem as dele). */
const PILL_BUTTON =
  'pointer-events-auto flex cursor-pointer items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)] py-2 pr-4 pl-3 text-sm font-medium text-ink backdrop-blur-[var(--glass-blur)] transition-colors select-none hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-mint'

/**
 * Botão de tema. O texto e o aria-label descrevem a AÇÃO: de noite oferece o dia
 * (ícone de sol) e vice-versa. O 3D faz o damp do `uNightMix`; aqui só se alterna o store.
 */
function ThemeButton() {
  const theme = useExperienceStore((s) => s.theme)
  const toDay = theme === 'night'
  const Icon = toDay ? SunIcon : MoonIcon
  const text = useUiText().hud.theme
  const label = toDay ? text.toDay : text.toNight

  return (
    <motion.button
      type="button"
      aria-label={toDay ? text.toDayAria : text.toNightAria}
      onClick={() => useExperienceStore.getState().toggleTheme()}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={PILL_BUTTON}
    >
      <Icon size={18} weight="duotone" aria-hidden="true" />
      <span>{label}</span>
    </motion.button>
  )
}

/** Marca (topo-esquerda), som, tema e idioma (topo-direita) e dica/rótulo do hotspot (base). Só em idle. */
export function Hud() {
  const mode = useExperienceStore(selectMode)
  const hovered = useExperienceStore(selectHovered)
  const { ui, getHotspot } = useContent()
  const idle = mode === 'idle'
  const hint = hovered ? getHotspot(hovered).label : ui.hud.hintIdle

  return (
    <AnimatePresence>
      {idle ? (
        <>
          <motion.div
            key="brand"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute top-5 left-6 text-sm font-medium tracking-wide text-ink/90 select-none"
          >
            {SITE.shortTitle}
          </motion.div>
          {/* Contêiner só para o layout: os botões recebem o ponteiro, o resto do HUD não. */}
          <div key="controls" className="absolute top-5 right-6 flex items-center gap-2">
            <SoundMenu triggerClassName={PILL_BUTTON} />
            <ThemeButton />
            <LanguageSwitch />
          </div>
          <motion.div
            key="hint"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-2 text-center text-xs text-ink/80 backdrop-blur-[var(--glass-blur)] select-none"
          >
            {hint}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  )
}
