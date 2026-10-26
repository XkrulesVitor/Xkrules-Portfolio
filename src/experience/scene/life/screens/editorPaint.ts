import { LOCALES, type Locale } from '@/content/i18n'
import { EDITOR_CODE_BY_LOCALE, SCREEN_TEXT_BY_LOCALE } from '@/content/screens'
import { withAlpha } from './canvasScreen'
import { tokenizeLines, type Token, type TokenKind } from './codeHighlight'

/**
 * Editor de código do monitor vertical (9:16): tema escuro nas cores do XKrules OS, aba com o nome do
 * arquivo, calha com números de linha, código que vai sendo "digitado" (a calha rola sozinha para o
 * cursor ficar na parte de baixo), cursor piscando e barra de status.
 */

export const EDITOR_WIDTH = 504
export const EDITOR_HEIGHT = 896

const BG = '#0b1020'
const GUTTER_BG = '#090d1a'
const TAB_BG = '#0f1630'
const MINT = '#7ff5d0'
const COLORS: Readonly<Record<TokenKind, string>> = {
  plain: '#cdd6f4',
  keyword: '#b583ff',
  string: '#7ff5d0',
  number: '#f2c14e',
  comment: '#5d6b98',
  function: '#6aa8ff',
  type: '#f78fd0',
  tag: '#6aa8ff',
  punct: '#8d9ac4',
}

const FONT_PX = 16
const LINE_H = 24
const TAB_H = 40
const STATUS_H = 30
const GUTTER_W = 56
const PAD_X = 12
const FONT_MONO = `${FONT_PX}px ui-monospace, "Cascadia Mono", "Segoe UI Mono", Menlo, Consolas, monospace`
const FONT_UI = '600 14px system-ui, "Segoe UI", sans-serif'

/** Digitação: caracteres por segundo, pausa depois de cada quebra de linha e espera ao terminar. */
const TYPE_CPS = 20
const NEWLINE_PAUSE = 0.28
const HOLD_AFTER_DONE = 4
const CURSOR_BLINK_HZ = 1.1
/** Fração da altura útil em que o cursor fica (a rolagem o mantém ali). */
const CURSOR_ANCHOR = 0.72

/** O código de um idioma, já tokenizado (só os comentários mudam entre os idiomas). */
interface CodeLayout {
  lines: readonly string[]
  tokens: readonly (readonly Token[])[]
  /** Índice do primeiro caractere de cada linha no texto inteiro (linhas separadas por `\n`). */
  lineStart: readonly number[]
  totalChars: number
}

function buildLayout(lines: readonly string[]): CodeLayout {
  const lineStart: number[] = []
  let at = 0
  for (const line of lines) {
    lineStart.push(at)
    at += line.length + 1
  }
  return { lines, tokens: tokenizeLines(lines), lineStart, totalChars: at }
}

/** Um layout por idioma, calculado uma vez no carregamento do módulo. */
const LAYOUTS = Object.fromEntries(
  LOCALES.map((locale): [Locale, CodeLayout] => [locale, buildLayout(EDITOR_CODE_BY_LOCALE[locale])]),
) as Record<Locale, CodeLayout>

export interface EditorState {
  /** Idioma do código e dos textos da moldura (aba, status). Trocar só muda o que é desenhado. */
  locale: Locale
  /** Caracteres já digitados (inteiro). */
  chars: number
  /** Tempo (s) até o próximo caractere. */
  nextIn: number
  /** Espera (s) depois de terminar, antes de recomeçar. */
  hold: number
  /** Rolagem atual (px) */
  scroll: number
  /** Largura de um caractere monoespaçado (medida no 1º desenho). */
  charW: number
  /** Relógio local do cursor (s). */
  time: number
}

export function createEditorState(locale: Locale = 'pt'): EditorState {
  return { locale, chars: 0, nextIn: 1 / TYPE_CPS, hold: 0, scroll: 0, charW: 0, time: 0 }
}

/** Estado do editor "já digitado" (modo reduced-motion: quadro estático). */
export function createStaticEditorState(locale: Locale = 'pt'): EditorState {
  const state = createEditorState(locale)
  state.chars = LAYOUTS[locale].totalChars
  return state
}

/** Avança digitação, rolagem e cursor em `dt` segundos. */
export function stepEditor(state: EditorState, dt: number): void {
  const totalChars = LAYOUTS[state.locale].totalChars
  state.time += dt
  if (state.chars >= totalChars) {
    state.hold += dt
    if (state.hold >= HOLD_AFTER_DONE) {
      state.chars = 0
      state.hold = 0
      state.scroll = 0
      state.nextIn = 1 / TYPE_CPS
    }
    return
  }
  state.nextIn -= dt
  while (state.nextIn <= 0 && state.chars < totalChars) {
    const typed = state.chars
    state.chars += 1
    // `chars` já conta o caractere recém-digitado; pausa depois de uma quebra de linha.
    state.nextIn += isNewlineAt(LAYOUTS[state.locale], typed) ? NEWLINE_PAUSE : 1 / TYPE_CPS
  }
}

/** O caractere de índice `index` do texto inteiro é uma quebra de linha? */
function isNewlineAt(layout: CodeLayout, index: number): boolean {
  // Uma linha termina no índice lineStart[i] + length(i).
  const line = lineOf(layout, index)
  return index === layout.lineStart[line] + layout.lines[line].length
}

/** Linha que contém o caractere de índice `index` (busca binária). */
function lineOf(layout: CodeLayout, index: number): number {
  let lo = 0
  let hi = layout.lineStart.length - 1
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    if (layout.lineStart[mid] <= index) lo = mid
    else hi = mid - 1
  }
  return lo
}

/** Linha e coluna (0-based) do cursor, dado quantos caracteres já foram digitados. */
function cursorPosition(layout: CodeLayout, chars: number): { line: number; col: number } {
  const clamped = Math.min(chars, layout.totalChars - 1)
  const line = lineOf(layout, clamped)
  const col = Math.min(chars - layout.lineStart[line], layout.lines[line].length)
  return { line, col }
}

const textTop = TAB_H
const textHeight = EDITOR_HEIGHT - TAB_H - STATUS_H

export function paintEditor(ctx: CanvasRenderingContext2D, state: EditorState, animated: boolean): void {
  const layout = LAYOUTS[state.locale]
  const text = SCREEN_TEXT_BY_LOCALE[state.locale].editor
  if (state.charW === 0) {
    ctx.font = FONT_MONO
    state.charW = ctx.measureText('M').width
  }
  const { charW } = state
  const { line: curLine, col: curCol } = cursorPosition(layout, state.chars)

  // Rolagem: o cursor fica na parte baixa da área útil.
  const cursorY = curLine * LINE_H
  const targetScroll = Math.max(0, cursorY - textHeight * CURSOR_ANCHOR)
  state.scroll += (targetScroll - state.scroll) * (animated ? 0.28 : 1)
  const scroll = Math.round(state.scroll)

  // Fundo, calha e abas.
  ctx.fillStyle = BG
  ctx.fillRect(0, 0, EDITOR_WIDTH, EDITOR_HEIGHT)
  ctx.fillStyle = GUTTER_BG
  ctx.fillRect(0, textTop, GUTTER_W, textHeight)

  // Linhas visíveis (recorte para a rolagem não vazar nas abas e na barra de status).
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, textTop, EDITOR_WIDTH, textHeight)
  ctx.clip()
  ctx.font = FONT_MONO
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'

  const first = Math.max(0, Math.floor(scroll / LINE_H))
  const last = Math.min(curLine, Math.ceil((scroll + textHeight) / LINE_H))
  for (let i = first; i <= last; i++) {
    const y = textTop + i * LINE_H - scroll + LINE_H / 2
    if (i === curLine) {
      ctx.fillStyle = 'rgba(127, 245, 208, 0.07)'
      ctx.fillRect(GUTTER_W, y - LINE_H / 2, EDITOR_WIDTH - GUTTER_W, LINE_H)
    }
    ctx.fillStyle = i === curLine ? withAlpha(MINT, 0.9) : '#4a5680'
    ctx.textAlign = 'right'
    ctx.fillText(String(i + 1), GUTTER_W - 12, y)
    ctx.textAlign = 'left'

    const visibleChars = i === curLine ? curCol : layout.lines[i].length
    for (const token of layout.tokens[i]) {
      if (token.col >= visibleChars) break
      const text = token.col + token.text.length > visibleChars ? token.text.slice(0, visibleChars - token.col) : token.text
      if (text.trim() === '') continue
      ctx.fillStyle = COLORS[token.kind]
      ctx.fillText(text, GUTTER_W + PAD_X + token.col * charW, y)
    }
  }

  // Cursor (barra) piscando; sem animação fica aceso.
  const cursorOn = !animated || Math.floor(state.time * CURSOR_BLINK_HZ * 2) % 2 === 0
  if (cursorOn) {
    const cx = GUTTER_W + PAD_X + curCol * charW
    const cy = textTop + curLine * LINE_H - scroll
    ctx.fillStyle = MINT
    ctx.fillRect(cx, cy + 4, 2, LINE_H - 8)
  }
  ctx.restore()

  // Abas (por cima da rolagem).
  ctx.fillStyle = TAB_BG
  ctx.fillRect(0, 0, EDITOR_WIDTH, TAB_H)
  ctx.fillStyle = BG
  ctx.fillRect(10, 8, 168, TAB_H - 8)
  ctx.fillStyle = MINT
  ctx.fillRect(10, 8, 168, 2)
  ctx.font = FONT_UI
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  ctx.fillStyle = '#e8ecff'
  ctx.fillText(text.fileName, 24, TAB_H / 2 + 4)
  ctx.fillStyle = '#4a5680'
  ctx.fillText(text.siblingTab, 196, TAB_H / 2 + 4)

  // Barra de status.
  ctx.fillStyle = '#10183a'
  ctx.fillRect(0, EDITOR_HEIGHT - STATUS_H, EDITOR_WIDTH, STATUS_H)
  ctx.fillStyle = withAlpha(MINT, 0.85)
  ctx.font = '500 13px system-ui, "Segoe UI", sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(
    text.status.replace('{line}', String(curLine + 1)).replace('{col}', String(curCol + 1)),
    14,
    EDITOR_HEIGHT - STATUS_H / 2,
  )
  ctx.textAlign = 'right'
  ctx.fillStyle = '#7f8bb5'
  ctx.fillText(text.language, EDITOR_WIDTH - 14, EDITOR_HEIGHT - STATUS_H / 2)
}
