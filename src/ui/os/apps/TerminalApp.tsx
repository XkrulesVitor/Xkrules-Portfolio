import { memo, useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { OS_TEXT } from '@/content/os'
import { WEB_PROJECTS } from '@/content/projects.web'
import type { WebProject } from '@/content/types'
import { fmt } from '../format'
import scope from '../scope.module.css'
import shared from '../shared.module.css'
import { complete, runCommand, type TermLine, type TermTone } from './terminalCommands'
import styles from './TerminalApp.module.css'

interface TerminalAppProps {
  projects?: readonly WebProject[]
  /** Abre a janela de um projeto (comando `open` e clique na lista de `projects`). */
  onOpenProject: (slug: string) => void
}

interface Entry {
  id: number
  line: TermLine
}

const TONE_CLASS: Record<TermTone, string> = {
  normal: styles.toneNormal,
  dim: styles.toneDim,
  ok: styles.toneOk,
  error: styles.toneError,
  accent: styles.toneAccent,
}

const WELCOME: readonly TermLine[] = OS_TEXT.terminal.welcome.map(
  (value, i): TermLine => ({ kind: 'text', text: value, tone: i === 0 ? 'accent' : 'dim' }),
)

function createEntries(lines: readonly TermLine[], from: number): Entry[] {
  return lines.map((line, i) => ({ id: from + i, line }))
}

function Prompt() {
  return <span className={styles.prompt}>{OS_TEXT.terminal.prompt}</span>
}

function Line({ line, onOpenProject }: { line: TermLine; onOpenProject: (slug: string) => void }) {
  switch (line.kind) {
    case 'input':
      return (
        <div className={styles.line}>
          <Prompt /> <span className={styles.typed}>{line.text}</span>
        </div>
      )
    case 'text':
      return <div className={`${styles.line} ${TONE_CLASS[line.tone ?? 'normal']}`}>{line.text}</div>
    case 'pair':
      return (
        <div className={`${styles.line} ${styles.pair}`}>
          <span className={styles.pairName}>{line.name}</span>
          <span className={styles.toneDim}>{line.text}</span>
        </div>
      )
    case 'link':
      return (
        <div className={styles.line}>
          <a className={styles.link} href={line.href} target="_blank" rel="noreferrer">
            {line.label}
          </a>{' '}
          <span className={styles.toneDim}>{line.href}</span>
          <span className={shared.srOnly}>{OS_TEXT.detail.newTab}</span>
        </div>
      )
    case 'project':
      return (
        <div className={`${styles.line} ${styles.pair}`}>
          <button type="button" className={styles.linkButton} onClick={() => onOpenProject(line.slug)}>
            {line.slug}
          </button>
          <span>
            {line.title}
            {line.year !== undefined ? <span className={styles.toneDim}> ({line.year})</span> : null}
          </span>
        </div>
      )
    case 'neofetch':
      return (
        <div className={styles.neofetch}>
          <pre className={styles.art} aria-hidden="true">
            {line.art.join('\n')}
          </pre>
          <dl className={styles.rows}>
            <div className={styles.rowHead}>
              <span className={styles.toneAccent}>{OS_TEXT.terminal.host}</span>
            </div>
            {line.rows.map((row) => (
              <div key={row.key} className={styles.row}>
                <dt className={styles.rowKey}>{row.key}</dt>
                <dd className={styles.rowValue}>{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )
  }
}

/**
 * Terminal do SO. Só interpreta uma lista fechada de comandos (terminalCommands.ts: nada de eval).
 * Histórico com ↑/↓, Tab completa comandos e slugs, Ctrl+L limpa. Clicar em qualquer lugar da
 * janela devolve o foco ao campo (sem atrapalhar a seleção de texto). Sem tratar Esc.
 */
export const TerminalApp = memo(function TerminalApp({
  projects = WEB_PROJECTS,
  onOpenProject,
}: TerminalAppProps) {
  const [entries, setEntries] = useState<Entry[]>(() => createEntries(WELCOME, 0))
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const nextId = useRef(WELCOME.length)
  const history = useRef<string[]>([])
  // -1 = digitando; 0.. = posição no histórico (0 = o comando mais recente).
  const cursor = useRef(-1)
  const draft = useRef('')

  // Foco no campo ao abrir (a Window não o rouba: só foca a si mesma se o foco estiver fora dela).
  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true })
  }, [])

  // Acompanha a saída nova: rola o próprio terminal para o fim.
  useEffect(() => {
    const scroller = scrollRef.current
    if (scroller) scroller.scrollTop = scroller.scrollHeight
  }, [entries])

  const append = (lines: readonly TermLine[]) => {
    const created = createEntries(lines, nextId.current)
    nextId.current += created.length
    setEntries((current) => [...current, ...created])
  }

  const submit = () => {
    const raw = value
    const command = raw.trim()
    cursor.current = -1
    draft.current = ''
    setValue('')
    if (!command) {
      append([{ kind: 'input', text: '' }])
      return
    }
    if (history.current[0] !== command) history.current.unshift(command)

    const result = runCommand(command, { projects, now: new Date() })
    if (result.clear) {
      setEntries([])
      return
    }
    append([{ kind: 'input', text: raw }, ...result.lines])
    if (result.open) onOpenProject(result.open)
  }

  const recall = (direction: 'older' | 'newer') => {
    const list = history.current
    if (list.length === 0) return
    if (direction === 'older') {
      if (cursor.current === -1) draft.current = value
      cursor.current = Math.min(cursor.current + 1, list.length - 1)
      setValue(list[cursor.current])
    } else {
      if (cursor.current === -1) return
      cursor.current -= 1
      setValue(cursor.current === -1 ? draft.current : list[cursor.current])
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      submit()
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      recall('older')
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      recall('newer')
    } else if (event.key === 'Tab' && !event.shiftKey && value.trim() !== '') {
      // Com a linha vazia o Tab segue o fluxo normal do foco (o terminal não prende o teclado).
      event.preventDefault()
      const result = complete(value, projects)
      if (result.value !== value) setValue(result.value)
      else if (result.candidates.length > 1) {
        append([
          { kind: 'input', text: value },
          { kind: 'text', text: fmt(OS_TEXT.terminal.candidates, { list: result.candidates.join('  ') }), tone: 'dim' },
        ])
      }
    } else if (event.key === 'l' && event.ctrlKey) {
      event.preventDefault()
      setEntries([])
    }
  }

  // Clique em qualquer ponto do terminal leva o foco ao campo, exceto ao selecionar texto ou clicar
  // em links e botões (que têm o seu próprio destino).
  const handleClick = () => {
    const selection = window.getSelection()
    if (selection && !selection.isCollapsed) return
    inputRef.current?.focus({ preventScroll: true })
  }

  return (
    // O clique só devolve o foco ao campo (que já é focável pelo teclado): não é um controle.
    <div className={`${scope.scope} ${styles.root}`} onClick={handleClick}>
      <div ref={scrollRef} className={styles.screen}>
        <div role="log" aria-live="polite" aria-label={OS_TEXT.terminal.outputLabel}>
          {entries.map(({ id, line }) => (
            <Line key={id} line={line} onOpenProject={onOpenProject} />
          ))}
        </div>
        <div className={`${styles.line} ${styles.inputLine}`}>
          <Prompt />
          <input
            ref={inputRef}
            className={styles.input}
            type="text"
            value={value}
            aria-label={OS_TEXT.terminal.inputLabel}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
      </div>
    </div>
  )
})
