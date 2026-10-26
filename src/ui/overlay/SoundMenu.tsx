import { useEffect, useId, useRef, useState, type FocusEvent } from 'react'
import {
  CursorClickIcon,
  MusicNotesIcon,
  SpeakerHighIcon,
  SpeakerSlashIcon,
  WindIcon,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'motion/react'
import { SOUND_CATEGORIES, audio, type SoundCategory } from '@/lib/audio'
import { selectMuted, selectVolumes } from '@/store/selectors'
import { useExperienceStore } from '@/store/useExperienceStore'
import { useUiText } from '../i18n/useLocale'
import { EASE, FOCUS_RING, GlassCard, fmt } from '../primitives'

const CATEGORY_ICON: Record<SoundCategory, PhosphorIcon> = {
  music: MusicNotesIcon,
  ambient: WindIcon,
  effects: CursorClickIcon,
}

/** Ligar exige um gesto do usuário: o AudioContext só pode nascer dentro do clique. Sem Web Audio, segue mudo. */
function toggleMuted(): void {
  const s = useExperienceStore.getState()
  if (s.muted && !audio.unlock()) return
  s.toggleMuted()
}

interface VolumeSliderProps {
  category: SoundCategory
  value: number
}

/** Slider nativo (`input range`): teclado (setas, Home, End, PageUp/Down), leitor de tela e toque já vêm de graça. */
function VolumeSlider({ category, value }: VolumeSliderProps) {
  const uid = useId()
  const text = useUiText().hud.sound
  const { label, hint } = text.categories[category]
  const Icon = CATEGORY_ICON[category]
  const percent = fmt(text.volumeValue, { value: Math.round(value * 100) })

  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <label htmlFor={uid} className="flex items-center gap-2 font-medium text-ink">
          <Icon size={18} weight="duotone" aria-hidden="true" />
          {label}
        </label>
        <span aria-hidden="true" className="text-ink/70 tabular-nums">
          {percent}
        </span>
      </div>
      <input
        id={uid}
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        aria-describedby={`${uid}-hint`}
        aria-valuetext={percent}
        onChange={(event) => useExperienceStore.getState().setVolume(category, Number(event.target.value))}
        className={`mt-1.5 h-5 w-full cursor-pointer accent-accent-mint ${FOCUS_RING}`}
      />
      <p id={`${uid}-hint`} className="text-xs leading-5 text-ink/60">
        {hint}
      </p>
    </div>
  )
}

interface SoundMenuProps {
  /** Classes do botão (as pílulas do HUD), para ele combinar com o botão de tema ao lado. */
  triggerClassName: string
}

/**
 * Som do quarto: o botão do HUD abre um popover de vidro com o mudo geral e um slider por categoria
 * (Música, Ambiente, Efeitos). Padrão "disclosure": `aria-expanded` no botão, painel logo depois no
 * DOM. Fecha com Esc (o foco volta ao botão), clique fora ou quando o foco sai dele. Abrir leva o foco
 * ao mudo geral. As escolhas ficam no store (e no localStorage); o `AudioDirector` as aplica ao motor.
 */
export function SoundMenu({ triggerClassName }: SoundMenuProps) {
  const muted = useExperienceStore(selectMuted)
  const volumes = useExperienceStore(selectVolumes)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const muteRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()
  const text = useUiText().hud.sound

  const TriggerIcon = muted ? SpeakerSlashIcon : SpeakerHighIcon
  const MuteIcon = muted ? SpeakerHighIcon : SpeakerSlashIcon

  useEffect(() => {
    if (!open) return
    muteRef.current?.focus({ preventScroll: true })
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      // Só fecha o menu: o Esc global (voltar para a visão geral) não deve nem ver esta tecla.
      event.stopPropagation()
      setOpen(false)
      triggerRef.current?.focus()
    }
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && rootRef.current?.contains(event.target)) return
      setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown, true)
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      document.removeEventListener('pointerdown', onPointerDown, true)
    }
  }, [open])

  // Tab para fora do menu o fecha. (Clicar fora, onde o foco vira `null`, é com o pointerdown.)
  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) {
      setOpen(false)
    }
  }

  return (
    <div ref={rootRef} onBlur={onBlur} className="relative">
      <motion.button
        ref={triggerRef}
        type="button"
        aria-label={fmt(text.triggerAria, { state: muted ? text.stateOff : text.stateOn })}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((value) => !value)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className={triggerClassName}
      >
        <TriggerIcon size={18} weight="duotone" aria-hidden="true" />
        <span>{muted ? text.off : text.on}</span>
      </motion.button>

      <AnimatePresence>
        {open ? (
          <motion.div
            key="panel"
            id={panelId}
            role="group"
            aria-label={text.menuLabel}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: EASE }}
            className="pointer-events-auto absolute top-full right-0 z-30 mt-2 w-[min(320px,calc(100vw-3rem))]"
          >
            <GlassCard variant="smoked" padding="md" className="space-y-4">
              <p className="label-caps">{text.title}</p>

              <button
                ref={muteRef}
                type="button"
                onClick={toggleMuted}
                className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-2 text-sm font-medium text-ink transition-colors select-none hover:bg-white/15 ${FOCUS_RING}`}
              >
                <MuteIcon size={18} weight="duotone" aria-hidden="true" />
                {muted ? text.toOn : text.toOff}
              </button>

              {/* Apagados com o som geral mudo: ainda ajustáveis, mas dá para ver que não tocam. */}
              <div className={`space-y-3 transition-opacity duration-200 ${muted ? 'opacity-50' : ''}`}>
                {SOUND_CATEGORIES.map((category) => (
                  <VolumeSlider key={category} category={category} value={volumes[category]} />
                ))}
              </div>

              <p className="border-t border-[var(--glass-border)] pt-3 text-xs leading-5 text-ink/60">
                {text.gamesNote}
              </p>
            </GlassCard>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
