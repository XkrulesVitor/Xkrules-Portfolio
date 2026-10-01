// Motor de comandos do Terminal do SO: funções PURAS (sem React, sem DOM, sem eval). Recebe a linha
// digitada e devolve linhas de saída; quem tem efeito (abrir janela, limpar tela) é o componente,
// que lê `open` e `clear` do resultado. Textos em content/os.ts; fatos do autor em about.ts e site.ts.
import { OS_TEXT } from '@/content/os'
import { ABOUT } from '@/content/about'
import { SITE } from '@/content/site'
import type { WebProject } from '@/content/types'
import { fmt } from '../format'

export type TermTone = 'normal' | 'dim' | 'ok' | 'error' | 'accent'

export interface NeofetchRow {
  key: string
  value: string
}

export type TermLine =
  /** Eco do que foi digitado, com o prompt. */
  | { kind: 'input'; text: string }
  | { kind: 'text'; text: string; tone?: TermTone }
  /** Nome em destaque + descrição, em duas colunas (help). */
  | { kind: 'pair'; name: string; text: string }
  /** Link externo (abre em nova aba). */
  | { kind: 'link'; label: string; href: string }
  /** Projeto: o clique abre a janela dele (equivale a `open <slug>`). */
  | { kind: 'project'; slug: string; title: string; year?: number }
  | { kind: 'neofetch'; art: readonly string[]; rows: readonly NeofetchRow[] }

export interface TermResult {
  readonly lines: readonly TermLine[]
  /** Apaga a tela (o comando `clear`). */
  readonly clear?: boolean
  /** Slug do projeto a abrir (o comando `open`). */
  readonly open?: string
}

export interface TermContext {
  readonly projects: readonly WebProject[]
  readonly now: Date
}

const COMMAND_NAMES: readonly string[] = OS_TEXT.terminal.commands.map((command) => command.name)

/** Minúsculas e sem acento: `Memória` casa com `memoria`. */
function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

const text = (value: string, tone?: TermTone): TermLine => ({ kind: 'text', text: value, tone })

/** Distância de edição (Levenshtein): sugere o comando certo para um erro de digitação. */
function editDistance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i]
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost)
    }
    previous = current
  }
  return previous[b.length]
}

function suggestCommand(name: string): string | null {
  let best: string | null = null
  let bestDistance = 3
  for (const candidate of COMMAND_NAMES) {
    const distance = editDistance(name, candidate)
    if (distance < bestDistance) {
      best = candidate
      bestDistance = distance
    }
  }
  return best
}

/** Resolve o argumento de `open`: slug ou título exatos (sem acento), depois prefixo único. */
function resolveProject(query: string, projects: readonly WebProject[]): WebProject | null {
  const q = normalize(query)
  if (!q) return null
  const exact = projects.find((p) => normalize(p.slug) === q || normalize(p.title) === q)
  if (exact) return exact
  const prefixed = projects.filter(
    (p) => normalize(p.slug).startsWith(q) || normalize(p.title).startsWith(q),
  )
  return prefixed.length === 1 ? prefixed[0] : null
}

/** Grupo de habilidades de about.ts pelo rótulo. */
function skillItems(label: string): readonly string[] {
  return ABOUT.skills.find((group) => group.label === label)?.items ?? []
}

function stackSummary(): string {
  const items = skillItems(OS_TEXT.computer.skillGroups.cpu).slice(0, OS_TEXT.computer.shownItems)
  return items.length > 0 ? items.join(', ') : fmt(OS_TEXT.computer.todo.group, { group: 'stack' })
}

function runHelp(): TermResult {
  return {
    lines: [
      text(OS_TEXT.terminal.helpTitle),
      ...OS_TEXT.terminal.commands.map(
        (command): TermLine => ({ kind: 'pair', name: command.usage, text: command.description }),
      ),
    ],
  }
}

function runWhoami(): TermResult {
  return {
    lines: [
      text(OS_TEXT.terminal.whoami.user, 'accent'),
      text(SITE.author),
      text(ABOUT.headline, 'dim'),
      text(fmt(OS_TEXT.terminal.whoami.stack, { stack: stackSummary() }), 'dim'),
    ],
  }
}

function runProjects(ctx: TermContext): TermResult {
  if (ctx.projects.length === 0) return { lines: [text(OS_TEXT.terminal.projects.empty, 'dim')] }
  return {
    lines: [
      text(OS_TEXT.terminal.projects.title),
      ...ctx.projects.map(
        (project): TermLine => ({
          kind: 'project',
          slug: project.slug,
          title: project.title,
          year: project.year,
        }),
      ),
      text(OS_TEXT.terminal.projects.hint, 'dim'),
    ],
  }
}

function runOpen(args: readonly string[], ctx: TermContext): TermResult {
  const query = args.join(' ')
  if (!query) return { lines: [text(OS_TEXT.terminal.open.usage, 'dim')] }
  const project = resolveProject(query, ctx.projects)
  if (!project) {
    return {
      lines: [
        text(
          fmt(OS_TEXT.terminal.open.notFound, {
            slug: query,
            slugs: ctx.projects.map((p) => p.slug).join(', '),
          }),
          'error',
        ),
      ],
    }
  }
  return {
    lines: [text(fmt(OS_TEXT.terminal.open.opening, { title: project.title }), 'ok')],
    open: project.slug,
  }
}

function runLinks(): TermResult {
  return {
    lines: [
      text(OS_TEXT.terminal.links.title),
      ...SITE.links.map((link): TermLine => ({ kind: 'link', label: link.label, href: link.href })),
      { kind: 'link', label: OS_TEXT.terminal.links.source, href: SITE.sourceUrl },
    ],
  }
}

const DATE_FORMAT = new Intl.DateTimeFormat(OS_TEXT.locale, {
  dateStyle: 'full',
  timeStyle: 'medium',
})

function runDate(ctx: TermContext): TermResult {
  return { lines: [text(DATE_FORMAT.format(ctx.now))] }
}

function runNeofetch(ctx: TermContext): TermResult {
  const labels = OS_TEXT.terminal.neofetch
  const gpu = skillItems(OS_TEXT.computer.skillGroups.gpu).join(', ')
  const rows: NeofetchRow[] = [
    { key: labels.os, value: labels.osValue },
    { key: labels.shell, value: labels.shellValue },
    { key: labels.stack, value: stackSummary() },
    { key: labels.gpu, value: gpu || fmt(OS_TEXT.computer.todo.group, { group: labels.gpu }) },
    { key: labels.projects, value: fmt(labels.projectsValue, { n: ctx.projects.length }) },
    { key: labels.education, value: ABOUT.headline },
  ]
  const github = SITE.links.find((link) => link.kind === 'github')
  if (github) rows.push({ key: labels.github, value: github.href.replace(/^https?:\/\//, '') })
  return { lines: [{ kind: 'neofetch', art: OS_TEXT.terminal.art, rows }] }
}

/** Interpreta uma linha de comando. Nunca lança e nunca avalia código: só um `switch` fechado. */
export function runCommand(raw: string, ctx: TermContext): TermResult {
  const parts = raw.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { lines: [] }
  const name = parts[0].toLowerCase()
  const args = parts.slice(1)

  switch (name) {
    case 'help':
      return runHelp()
    case 'whoami':
      return runWhoami()
    case 'projects':
      return runProjects(ctx)
    case 'open':
      return runOpen(args, ctx)
    case 'links':
      return runLinks()
    case 'date':
      return runDate(ctx)
    case 'clear':
      return { lines: [], clear: true }
    case 'neofetch':
      return runNeofetch(ctx)
    default: {
      const suggestion = suggestCommand(name)
      return {
        lines: [
          text(fmt(OS_TEXT.terminal.unknown, { cmd: parts[0] }), 'error'),
          ...(suggestion
            ? [text(fmt(OS_TEXT.terminal.suggestion, { cmd: suggestion }), 'dim')]
            : []),
        ],
      }
    }
  }
}

export interface Completion {
  /** Linha com a conclusão aplicada (igual à entrada quando não há o que completar). */
  readonly value: string
  /** Opções que ainda casam (mais de uma = ambíguo). */
  readonly candidates: readonly string[]
}

function commonPrefix(values: readonly string[]): string {
  if (values.length === 0) return ''
  let prefix = values[0]
  for (const value of values.slice(1)) {
    while (!value.startsWith(prefix)) prefix = prefix.slice(0, -1)
  }
  return prefix
}

/** Autocomplete do Tab: nome do comando na primeira palavra, slug de projeto depois de `open`. */
export function complete(input: string, projects: readonly WebProject[]): Completion {
  const trimmedStart = input.replace(/^\s+/, '')
  const hasSpace = /\s/.test(trimmedStart)

  if (!hasSpace) {
    const matches = COMMAND_NAMES.filter((cmd) => cmd.startsWith(trimmedStart.toLowerCase()))
    if (matches.length === 0) return { value: input, candidates: [] }
    if (matches.length === 1) return { value: `${matches[0]} `, candidates: matches }
    return { value: commonPrefix(matches), candidates: matches }
  }

  const [command, ...rest] = trimmedStart.split(/\s+/)
  if (command.toLowerCase() !== 'open') return { value: input, candidates: [] }
  const query = rest.join(' ')
  const q = normalize(query)
  const slugs = projects.map((p) => p.slug).filter((slug) => normalize(slug).startsWith(q))
  if (slugs.length === 0) return { value: input, candidates: [] }
  if (slugs.length === 1) return { value: `${command} ${slugs[0]}`, candidates: slugs }
  const prefix = commonPrefix(slugs)
  return { value: `${command} ${prefix.length > query.length ? prefix : query}`, candidates: slugs }
}
