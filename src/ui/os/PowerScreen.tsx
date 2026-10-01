import { useEffect, useRef, useState } from 'react'
import { PowerIcon } from '@phosphor-icons/react'
import { OS_TEXT } from '@/content/os'
import styles from './PowerScreen.module.css'

/** Fases em que o SO não mostra a área de trabalho. `on` (ligado) não passa por aqui. */
export type PowerPhase = 'shutdown' | 'off' | 'boot'

/** Intervalo entre linhas e pausa depois da última, em ms. */
const LINE_MS = { shutdown: 420, boot: 340 } as const
const HOLD_MS = { shutdown: 650, boot: 520 } as const

interface SequenceProps {
  kind: 'shutdown' | 'boot'
  lines: readonly string[]
  label: string
  onDone: () => void
}

/**
 * Linhas de console que aparecem uma a uma e, depois da última, chamam `onDone`. Um clique em
 * qualquer ponto pula direto para o fim. O componente é montado com `key` por fase: o contador
 * recomeça sozinho e não há setState síncrono em efeito.
 */
function Sequence({ kind, lines, label, onDone }: SequenceProps) {
  const [shown, setShown] = useState(1)
  const finished = shown >= lines.length

  useEffect(() => {
    if (finished) return
    const id = window.setTimeout(() => setShown((n) => n + 1), LINE_MS[kind])
    return () => window.clearTimeout(id)
  }, [finished, shown, kind])

  useEffect(() => {
    if (!finished) return
    const id = window.setTimeout(onDone, HOLD_MS[kind])
    return () => window.clearTimeout(id)
  }, [finished, kind, onDone])

  return (
    <div
      className={styles.sequence}
      data-kind={kind}
      role="status"
      aria-label={label}
      onClick={() => setShown(lines.length)}
    >
      <ol className={styles.lines}>
        {lines.slice(0, shown).map((line, i) => (
          <li key={i} className={styles.line} data-last={i === shown - 1 && !finished}>
            <span className={styles.chevron} aria-hidden="true">
              &gt;
            </span>
            {line}
          </li>
        ))}
      </ol>
    </div>
  )
}

interface PowerScreenProps {
  phase: PowerPhase
  /** Fim da sequência de desligar: a tela passa a `off`. */
  onShutdownDone: () => void
  /** Clique no botão de energia da tela apagada: começa o boot. */
  onPowerOn: () => void
  /** Fim do boot: volta para a área de trabalho. */
  onBootDone: () => void
}

/**
 * Tela preta do SO desligado: sequência de desligamento, botão de energia e boot curto. Cobre o
 * desktop inteiro (z-index acima da barra de tarefas) e não altera nada fora do SO.
 */
export function PowerScreen({ phase, onShutdownDone, onPowerOn, onBootDone }: PowerScreenProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Tela apagada: o foco vai para o botão de energia (teclado liga com Enter ou Espaço).
  useEffect(() => {
    if (phase === 'off') buttonRef.current?.focus({ preventScroll: true })
  }, [phase])

  return (
    <div className={styles.screen} data-phase={phase}>
      {phase === 'shutdown' ? (
        <Sequence
          key="shutdown"
          kind="shutdown"
          lines={OS_TEXT.power.shutdownLines}
          label={OS_TEXT.power.shutdownLabel}
          onDone={onShutdownDone}
        />
      ) : null}
      {phase === 'boot' ? (
        <Sequence
          key="boot"
          kind="boot"
          lines={OS_TEXT.power.bootLines}
          label={OS_TEXT.power.bootLabel}
          onDone={onBootDone}
        />
      ) : null}
      {phase === 'off' ? (
        <div className={styles.off} role="status" aria-label={OS_TEXT.power.offLabel}>
          <button
            ref={buttonRef}
            type="button"
            className={styles.powerButton}
            aria-label={OS_TEXT.power.button}
            onClick={onPowerOn}
          >
            <span className={styles.powerGlyph} aria-hidden="true">
              <PowerIcon weight="bold" />
            </span>
          </button>
          <p className={styles.hint}>{OS_TEXT.power.buttonHint}</p>
        </div>
      ) : null}
    </div>
  )
}
