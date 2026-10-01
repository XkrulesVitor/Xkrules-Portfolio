import { memo, useEffect, useReducer, useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent } from 'react'
import {
  ArrowCounterClockwiseIcon,
  ArrowUpRightIcon,
  CodeIcon,
  CoffeeIcon,
  CardsIcon,
  CubeIcon,
  DiceFiveIcon,
  GameControllerIcon,
  GithubLogoIcon,
  GlobeIcon,
  PrinterIcon,
  RocketLaunchIcon,
  SparkleIcon,
  TimerIcon,
  TrophyIcon,
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import { OS_TEXT, type MemorySymbolId } from '@/content/os'
import type { WebProject } from '@/content/types'
import { fmt } from '../format'
import scope from '../scope.module.css'
import shared from '../shared.module.css'
import {
  CARD_COUNT,
  COLUMNS,
  MISS_DELAY_MS,
  createGame,
  elapsedSeconds,
  formatTime,
  isFaceUp,
  memoryReducer,
  shuffleDeck,
  type MemoryState,
} from './memoryGame'
import styles from './MemoryGameApp.module.css'

const TEXT = OS_TEXT.memory

/** Glifo e cor de cada símbolo (a cor é só apresentação). */
const SYMBOLS: Record<MemorySymbolId, { Glyph: Icon; color: string }> = {
  controller: { Glyph: GameControllerIcon, color: '#b583ff' },
  cube: { Glyph: CubeIcon, color: '#6aa8ff' },
  printer: { Glyph: PrinterIcon, color: '#ffa94d' },
  dice: { Glyph: DiceFiveIcon, color: '#ff6b81' },
  code: { Glyph: CodeIcon, color: '#7ff5d0' },
  mug: { Glyph: CoffeeIcon, color: '#ffd166' },
  rocket: { Glyph: RocketLaunchIcon, color: '#4dd8ee' },
  cards: { Glyph: CardsIcon, color: '#f78fd0' },
}

const SYMBOL_NAMES: Record<MemorySymbolId, string> = Object.fromEntries(
  TEXT.symbols.map((symbol) => [symbol.id, symbol.name]),
) as Record<MemorySymbolId, string>

/** Posição vizinha ao andar com as setas; fica parado na borda do tabuleiro. */
function neighbour(index: number, key: string): number {
  const col = index % COLUMNS
  switch (key) {
    case 'ArrowRight':
      return col < COLUMNS - 1 ? index + 1 : index
    case 'ArrowLeft':
      return col > 0 ? index - 1 : index
    case 'ArrowDown':
      return index + COLUMNS < CARD_COUNT ? index + COLUMNS : index
    case 'ArrowUp':
      return index - COLUMNS >= 0 ? index - COLUMNS : index
    case 'Home':
      return index - col
    case 'End':
      return index - col + COLUMNS - 1
    default:
      return index
  }
}

function statusMessage(state: MemoryState, time: string): string {
  if (state.status === 'won') return fmt(TEXT.status.won, { moves: state.moves, time })
  if (state.last === 'match' && state.lastSymbol) {
    return fmt(TEXT.status.match, { name: SYMBOL_NAMES[state.lastSymbol] })
  }
  if (state.last === 'miss') return TEXT.status.miss
  return TEXT.status.start
}

export interface MemoryGameAppProps {
  /** Projeto `memory-game` de projects.web.ts: liga o jogo à versão completa. */
  project?: WebProject
  /** Abre a janela do projeto no SO. */
  onOpenProject?: (slug: string) => void
}

/**
 * Jogo da Memória 4x4 dentro do SO. Cartas com glifos Phosphor que viram em 3D (sem movimento
 * para quem pediu menos), contador de jogadas e de tempo, vitória, reiniciar e jogável só pelo
 * teclado (setas andam, Enter ou Espaço viram). As regras ficam em memoryGame.ts (reducer puro).
 */
export const MemoryGameApp = memo(function MemoryGameApp({ project, onOpenProject }: MemoryGameAppProps) {
  // Inicializador do reducer: roda uma vez, só no cliente (a janela nunca vem do servidor).
  const [state, dispatch] = useReducer(memoryReducer, undefined, () => createGame(shuffleDeck(Math.random)))
  // Relógio do tempo de jogo: o intervalo só roda durante a partida; o render nunca lê Date.now().
  const [now, setNow] = useState(0)
  const [focusIndex, setFocusIndex] = useState(0)
  const [side, setSide] = useState(0)
  const stageRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([])
  const againRef = useRef<HTMLButtonElement>(null)

  const playing = state.status === 'playing'
  const won = state.status === 'won'
  const locked = state.open.length === 2

  // O tabuleiro é o maior quadrado que cabe na área livre. Mede em px de LAYOUT (clientWidth), que
  // não sofrem o transform 3D do monitor, e acompanha o resize da janela.
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const observer = new ResizeObserver(() => {
      setSide(Math.floor(Math.min(stage.clientWidth, stage.clientHeight)))
    })
    observer.observe(stage)
    return () => observer.disconnect()
  }, [])

  // Cronômetro: atualiza `now` quatro vezes por segundo enquanto a partida está em andamento.
  useEffect(() => {
    if (!playing) return
    const id = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [playing])

  // Par errado: fica à vista um instante e desvira sozinho.
  useEffect(() => {
    if (!locked) return
    const id = window.setTimeout(() => dispatch({ type: 'hide' }), MISS_DELAY_MS)
    return () => window.clearTimeout(id)
  }, [locked])

  // Vitória: o foco vai para "Jogar de novo" (o teclado não fica perdido no tabuleiro).
  useEffect(() => {
    if (won) againRef.current?.focus({ preventScroll: true })
  }, [won])

  const flip = (index: number) => dispatch({ type: 'flip', index, now: Date.now() })

  const restart = () => {
    dispatch({ type: 'restart', deck: shuffleDeck(Math.random) })
    setNow(0)
    setFocusIndex(0)
    cardRefs.current[0]?.focus({ preventScroll: true })
  }

  const handleCardKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const next = neighbour(index, event.key)
    setFocusIndex(next)
    cardRefs.current[next]?.focus({ preventScroll: true })
  }

  const seconds = elapsedSeconds(state, now)
  const time = formatTime(seconds)
  const bestLabel = state.best === null ? TEXT.bestNone : String(state.best)

  const fullUrl = project?.liveUrl ?? project?.repoUrl
  const FullGlyph = project?.liveUrl ? GlobeIcon : GithubLogoIcon
  const boardStyle: CSSProperties = side > 0 ? { width: side, height: side } : {}

  return (
    <div className={`${scope.scope} ${styles.root}`}>
      <header className={styles.header}>
        <div className={styles.titles}>
          <h2 className={styles.title}>{TEXT.heading}</h2>
          <p className={styles.hint}>{TEXT.hint}</p>
        </div>
        <button type="button" className={styles.restart} onClick={restart}>
          <span className={styles.restartGlyph} aria-hidden="true">
            <ArrowCounterClockwiseIcon weight="bold" />
          </span>
          {TEXT.restart}
        </button>
      </header>

      <dl className={styles.stats} aria-label={TEXT.stats}>
        <div className={styles.stat}>
          <dt>{TEXT.moves}</dt>
          <dd>{state.moves}</dd>
        </div>
        <div className={styles.stat}>
          <dt>
            <span className={styles.statGlyph} aria-hidden="true">
              <TimerIcon weight="duotone" />
            </span>
            {TEXT.time}
          </dt>
          <dd>{time}</dd>
        </div>
        <div className={styles.stat}>
          <dt>
            <span className={styles.statGlyph} aria-hidden="true">
              <TrophyIcon weight="duotone" />
            </span>
            {TEXT.best}
          </dt>
          <dd>{bestLabel}</dd>
        </div>
      </dl>

      <div ref={stageRef} className={styles.stage}>
        <div className={styles.board} style={boardStyle} role="group" aria-label={TEXT.boardLabel}>
          {state.deck.map((symbol, index) => {
            const faceUp = isFaceUp(state, index)
            const matched = state.matched[index]
            const { Glyph, color } = SYMBOLS[symbol]
            const label = !faceUp
              ? fmt(TEXT.card.hidden, { n: index + 1, total: CARD_COUNT })
              : fmt(matched ? TEXT.card.matched : TEXT.card.shown, {
                  n: index + 1,
                  total: CARD_COUNT,
                  name: SYMBOL_NAMES[symbol],
                })
            return (
              <button
                key={index}
                ref={(el) => {
                  cardRefs.current[index] = el
                }}
                type="button"
                className={styles.card}
                style={{ '--symbol': color } as CSSProperties}
                data-faceup={faceUp}
                data-matched={matched}
                data-miss={locked && state.open.includes(index)}
                aria-label={label}
                aria-disabled={matched || won || undefined}
                tabIndex={focusIndex === index ? 0 : -1}
                onFocus={() => setFocusIndex(index)}
                onKeyDown={(event) => handleCardKeyDown(event, index)}
                onClick={() => flip(index)}
              >
                <span className={styles.inner}>
                  <span className={styles.back} aria-hidden="true">
                    <SparkleIcon weight="duotone" />
                  </span>
                  <span className={styles.front} aria-hidden="true">
                    <Glyph weight="duotone" />
                  </span>
                </span>
              </button>
            )
          })}

          {won ? (
            <div className={styles.win} role="group" aria-label={TEXT.win.title}>
              <span className={styles.winGlyph} aria-hidden="true">
                <TrophyIcon weight="duotone" />
              </span>
              <p className={styles.winTitle}>{TEXT.win.title}</p>
              <p className={styles.winSummary}>{fmt(TEXT.win.summary, { moves: state.moves, time })}</p>
              <button ref={againRef} type="button" className={shared.action} onClick={restart}>
                <span className={shared.actionGlyph} aria-hidden="true">
                  <ArrowCounterClockwiseIcon weight="bold" />
                </span>
                {TEXT.win.again}
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <footer className={styles.footer}>
        <p className={styles.status} role="status">
          {statusMessage(state, time)}
        </p>
        {project ? (
          <div className={styles.links}>
            {fullUrl ? (
              <a className={shared.actionQuiet} href={fullUrl} target="_blank" rel="noreferrer">
                <span className={shared.actionGlyph} aria-hidden="true">
                  <FullGlyph weight="regular" />
                </span>
                {project.liveUrl ? TEXT.project.full : TEXT.project.fullRepo}
                <span className={shared.srOnly}>{OS_TEXT.detail.newTab}</span>
                <span className={shared.actionArrow} aria-hidden="true">
                  <ArrowUpRightIcon weight="regular" />
                </span>
              </a>
            ) : null}
            {onOpenProject ? (
              <button
                type="button"
                className={shared.actionQuiet}
                onClick={() => onOpenProject(project.slug)}
              >
                {TEXT.project.details}
              </button>
            ) : null}
          </div>
        ) : null}
      </footer>
    </div>
  )
})
