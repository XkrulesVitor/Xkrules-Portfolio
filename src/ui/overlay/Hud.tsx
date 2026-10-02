import { MoonIcon, SpeakerHighIcon, SpeakerSlashIcon, SunIcon } from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'motion/react'
import { getHotspot } from '@/content/hotspots'
import { SITE, UI_TEXT } from '@/content/site'
import { audio } from '@/lib/audio'
import { selectHovered, selectMode, selectMuted } from '@/store/selectors'
import { useExperienceStore } from '@/store/useExperienceStore'

/** Classes comuns dos botões de pílula do topo-direita (tema e som). */
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
  const text = UI_TEXT.hud.theme
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

/**
 * Botão de som, ao lado do de tema. Começa MUDO. Mesma convenção do tema: texto, ícone e aria-label
 * descrevem a AÇÃO (mudo: oferece ligar, com alto-falante; ligado: oferece silenciar, com o alto-falante
 * cortado). O primeiro clique, que é o gesto do usuário, cria o AudioContext (`audio.unlock`); o
 * `AudioDirector` (experience) replica `muted` do store no motor.
 */
function SoundButton() {
  const muted = useExperienceStore(selectMuted)
  const Icon = muted ? SpeakerHighIcon : SpeakerSlashIcon
  const text = UI_TEXT.hud.sound

  const onClick = () => {
    // Ligar exige um gesto: o AudioContext só pode nascer aqui, dentro do clique.
    // Sem Web Audio no browser, o botão simplesmente não liga (continua mudo).
    if (useExperienceStore.getState().muted && !audio.unlock()) return
    useExperienceStore.getState().toggleMuted()
  }

  return (
    <motion.button
      type="button"
      aria-label={muted ? text.toOnAria : text.toOffAria}
      onClick={onClick}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={PILL_BUTTON}
    >
      <Icon size={18} weight="duotone" aria-hidden="true" />
      <span>{muted ? text.toOn : text.toOff}</span>
    </motion.button>
  )
}

/** Marca (topo-esquerda), botões de som e tema (topo-direita) e dica/rótulo do hotspot (base). Só em idle. */
export function Hud() {
  const mode = useExperienceStore(selectMode)
  const hovered = useExperienceStore(selectHovered)
  const idle = mode === 'idle'
  const hint = hovered ? getHotspot(hovered).label : UI_TEXT.hud.hintIdle

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
            <SoundButton />
            <ThemeButton />
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
