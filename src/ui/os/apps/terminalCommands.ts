// Motor de comandos do Terminal do SO: funções PURAS (sem React, sem DOM, sem eval). Recebe a linha
// digitada e devolve linhas de saída; quem tem efeito (abrir janela, limpar tela) é o componente,
// que lê `open` e `clear` do resultado. Textos em content/os.ts (no idioma do contexto); fatos do autor
// em about.ts e site.ts. O terminal responde no idioma ativo; o nome dos comandos é o mesmo nos dois.
import { LOCALE_INFO, type Locale } from '@/content/i18n'
import {
  COMPUTER_SHOWN_ITEMS,
  TERMINAL_ART,
  TERMINAL_COMMANDS,
  TERMINAL_IDENTITY,
  type OsText,
} from '@/content/os'
import { SITE } from '@/content/site'
import type { AboutContent, WebProject } from '@/content/types'
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
  /** Textos do SO no idioma ativo. */
  readonly os: OsText
  /** Conteúdo "Sobre" no idioma ativo (habilidades, formação). */
  readonly about: AboutContent
  readonly locale: Locale
}

const COMMAND_NAMES: readonly string[] = TERMINAL_COMMANDS.map((command) => command.name)

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

/** Grupo de habilidades de about.ts pelo rótulo (no idioma do contexto). */
function skillItems(ctx: TermContext, label: string): readonly string[] {
  return ctx.about.skills.find((group) => group.label === label)?.items ?? []
}

function stackSummary(ctx: TermContext): string {
  const computer = ctx.os.computer
  const items = skillItems(ctx, computer.skillGroups.cpu).slice(0, COMPUTER_SHOWN_ITEMS)
  return items.length > 0 ? items.join(', ') : fmt(computer.todo.group, { group: 'stack' })
}

function runHelp(ctx: TermContext): TermResult {
  return {
    lines: [
      text(ctx.os.terminal.helpTitle),
      ...TERMINAL_COMMANDS.map(
        (command): TermLine => ({
          kind: 'pair',
          name: command.usage,
          text: ctx.os.terminal.commandHelp[command.name],
        }),
      ),
    ],
  }
}

function runWhoami(ctx: TermContext): TermResult {
  return {
    lines: [
      text(TERMINAL_IDENTITY.user, 'accent'),
      text(SITE.author),
      text(ctx.about.headline, 'dim'),
      text(fmt(ctx.os.terminal.whoami.stack, { stack: stackSummary(ctx) }), 'dim'),
    ],
  }
}

function runProjects(ctx: TermContext): TermResult {
  const t = ctx.os.terminal.projects
  if (ctx.projects.length === 0) return { lines: [text(t.empty, 'dim')] }
  return {
    lines: [
      text(t.title),
      ...ctx.projects.map(
        (project): TermLine => ({
          kind: 'project',
          slug: project.slug,
          title: project.title,
          year: project.year,
        }),
      ),
      text(t.hint, 'dim'),
    ],
  }
}

function runOpen(args: readonly string[], ctx: TermContext): TermResult {
  const t = ctx.os.terminal.open
  const query = args.join(' ')
  if (!query) return { lines: [text(t.usage, 'dim')] }
  const project = resolveProject(query, ctx.projects)
  if (!project) {
    return {
      lines: [
        text(
          fmt(t.notFound, {
            slug: query,
            slugs: ctx.projects.map((p) => p.slug).join(', '),
          }),
          'error',
        ),
      ],
    }
  }
  return {
    lines: [text(fmt(t.opening, { title: project.title }), 'ok')],
    open: project.slug,
  }
}

function runLinks(ctx: TermContext): TermResult {
  const t = ctx.os.terminal.links
  return {
    lines: [
      text(t.title),
      ...SITE.links.map((link): TermLine => ({ kind: 'link', label: link.label, href: link.href })),
      { kind: 'link', label: t.source, href: SITE.sourceUrl },
    ],
  }
}

function runDate(ctx: TermContext): TermResult {
  const format = new Intl.DateTimeFormat(LOCALE_INFO[ctx.locale].intl, {
    dateStyle: 'full',
    timeStyle: 'medium',
  })
  return { lines: [text(format.format(ctx.now))] }
}

function runNeofetch(ctx: TermContext): TermResult {
  const labels = ctx.os.terminal.neofetch
  const computer = ctx.os.computer
  const gpu = skillItems(ctx, computer.skillGroups.gpu).join(', ')
  const rows: NeofetchRow[] = [
    { key: labels.os, value: labels.osValue },
    { key: labels.shell, value: labels.shellValue },
    { key: labels.stack, value: stackSummary(ctx) },
    { key: labels.gpu, value: gpu || fmt(computer.todo.group, { group: labels.gpu }) },
    { key: labels.projects, value: fmt(labels.projectsValue, { n: ctx.projects.length }) },
    { key: labels.education, value: ctx.about.headline },
  ]
  const github = SITE.links.find((link) => link.kind === 'github')
  if (github) rows.push({ key: labels.github, value: github.href.replace(/^https?:\/\//, '') })
  return { lines: [{ kind: 'neofetch', art: TERMINAL_ART, rows }] }
}

/** Interpreta uma linha de comando. Nunca lança e nunca avalia código: só um `switch` fechado. */
export function runCommand(raw: string, ctx: TermContext): TermResult {
  const parts = raw.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { lines: [] }
  const name = parts[0].toLowerCase()
  const args = parts.slice(1)

  switch (name) {
    case 'help':
      return runHelp(ctx)
    case 'whoami':
      return runWhoami(ctx)
    case 'projects':
      return runProjects(ctx)
    case 'open':
      return runOpen(args, ctx)
    case 'links':
      return runLinks(ctx)
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
          text(fmt(ctx.os.terminal.unknown, { cmd: parts[0] }), 'error'),
          ...(suggestion
            ? [text(fmt(ctx.os.terminal.suggestion, { cmd: suggestion }), 'dim')]
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
