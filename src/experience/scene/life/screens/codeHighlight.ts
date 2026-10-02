/**
 * Tokenizador mínimo (TypeScript/JSX) só para colorir o editor do monitor vertical. Não é um parser:
 * reconhece comentário, string, número, palavra-chave, chamada de função, componente/tipo
 * (Capitalizado), tag JSX e pontuação, o bastante para "parecer um tema escuro de editor".
 */
export type TokenKind = 'plain' | 'keyword' | 'string' | 'number' | 'comment' | 'function' | 'type' | 'tag' | 'punct'

export interface Token {
  text: string
  kind: TokenKind
  /** Coluna (em caracteres) onde o token começa na linha. */
  col: number
}

const KEYWORDS = new Set([
  'import',
  'export',
  'from',
  'function',
  'const',
  'let',
  'return',
  'if',
  'else',
  'new',
  'true',
  'false',
  'null',
  'undefined',
  'type',
  'interface',
  'as',
  'default',
])

// Ordem importa: comentário e string antes dos demais.
const PATTERN =
  /(\/\/.*$)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`)|(\b\d+(?:\.\d+)?\b)|(<\/?[A-Za-z][\w.]*)|([A-Za-z_$][\w$]*)|(\s+)|(.)/g

export function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = []
  for (const match of line.matchAll(PATTERN)) {
    const [text, comment, string, number, tag, word, space] = match
    const col = match.index ?? 0
    let kind: TokenKind = 'punct'
    if (comment) kind = 'comment'
    else if (string) kind = 'string'
    else if (number) kind = 'number'
    else if (tag) kind = 'tag'
    else if (word) {
      const next = line.charAt(col + text.length)
      if (KEYWORDS.has(word)) kind = 'keyword'
      else if (next === '(') kind = 'function'
      else if (/^[A-Z]/.test(word)) kind = 'type'
      else kind = 'plain'
    } else if (space) kind = 'plain'
    tokens.push({ text, kind, col })
  }
  return tokens
}

export function tokenizeLines(lines: readonly string[]): Token[][] {
  return lines.map(tokenizeLine)
}
