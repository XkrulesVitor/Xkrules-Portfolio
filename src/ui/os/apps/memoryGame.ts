// Regras do Jogo da Memória 4x4: estado + reducer PUROS (sem React, sem DOM, sem Math.random e
// sem relógio: o embaralhamento e o "agora" entram como argumento). O componente (MemoryGameApp)
// só desenha o estado e chama o reducer.
import { OS_TEXT, type MemorySymbolId } from '@/content/os'

export const SYMBOL_IDS: readonly MemorySymbolId[] = OS_TEXT.memory.symbols.map((symbol) => symbol.id)
export const PAIR_COUNT = SYMBOL_IDS.length
export const CARD_COUNT = PAIR_COUNT * 2
/** Colunas do tabuleiro (4x4). */
export const COLUMNS = 4
/** Quanto tempo o par errado fica à vista antes de desvirar, em ms. */
export const MISS_DELAY_MS = 850

export type MemoryStatus = 'ready' | 'playing' | 'won'

export interface MemoryState {
  /** Símbolo de cada posição do tabuleiro (16 itens, cada símbolo duas vezes). */
  readonly deck: readonly MemorySymbolId[]
  /** Posições viradas e ainda sem resolver (0 a 2). Com 2, o tabuleiro trava até o `hide`. */
  readonly open: readonly number[]
  /** Posições dos pares já encontrados. */
  readonly matched: readonly boolean[]
  readonly moves: number
  readonly status: MemoryStatus
  /** Resultado da última jogada: alimenta a mensagem de status. */
  readonly last: 'none' | 'match' | 'miss'
  readonly lastSymbol: MemorySymbolId | null
  /** Instantes (ms) do primeiro flip e da vitória; `null` antes. */
  readonly startedAt: number | null
  readonly finishedAt: number | null
  /** Melhor resultado (menos jogadas) desde que a janela abriu. */
  readonly best: number | null
}

export type MemoryAction =
  | { readonly type: 'flip'; readonly index: number; readonly now: number }
  /** Desvira o par errado (disparado por um timer do componente). */
  | { readonly type: 'hide' }
  | { readonly type: 'restart'; readonly deck: readonly MemorySymbolId[] }

/** Baralho embaralhado (Fisher-Yates). `random` devolve [0, 1): na UI é Math.random; nos testes, fixo. */
export function shuffleDeck(random: () => number): MemorySymbolId[] {
  const deck = [...SYMBOL_IDS, ...SYMBOL_IDS]
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

export function createGame(deck: readonly MemorySymbolId[], best: number | null = null): MemoryState {
  return {
    deck,
    open: [],
    matched: deck.map(() => false),
    moves: 0,
    status: 'ready',
    last: 'none',
    lastSymbol: null,
    startedAt: null,
    finishedAt: null,
    best,
  }
}

/** Carta virada para cima (aberta agora ou já encontrada). */
export function isFaceUp(state: MemoryState, index: number): boolean {
  return state.matched[index] || state.open.includes(index)
}

/** Segundos de jogo: do primeiro flip até a vitória (ou até `now`, enquanto joga). */
export function elapsedSeconds(state: MemoryState, now: number): number {
  if (state.startedAt === null) return 0
  const end = state.finishedAt ?? now
  return Math.max(0, Math.floor((end - state.startedAt) / 1000))
}

export function memoryReducer(state: MemoryState, action: MemoryAction): MemoryState {
  switch (action.type) {
    case 'flip': {
      const { index, now } = action
      if (state.status === 'won' || index < 0 || index >= state.deck.length) return state
      // Tabuleiro travado (par errado à vista), carta já virada ou já encontrada: ignora.
      if (state.open.length >= 2 || state.matched[index] || state.open.includes(index)) return state

      const startedAt = state.startedAt ?? now
      const open = [...state.open, index]
      if (open.length === 1) {
        return { ...state, open, status: 'playing', startedAt, last: 'none', lastSymbol: null }
      }

      const [first, second] = open
      const moves = state.moves + 1
      if (state.deck[first] !== state.deck[second]) {
        return { ...state, open, moves, status: 'playing', startedAt, last: 'miss', lastSymbol: null }
      }

      const matched = state.matched.map((done, i) => done || i === first || i === second)
      const won = matched.every(Boolean)
      return {
        ...state,
        open: [],
        matched,
        moves,
        status: won ? 'won' : 'playing',
        last: 'match',
        lastSymbol: state.deck[first],
        startedAt,
        finishedAt: won ? now : null,
        best: won && (state.best === null || moves < state.best) ? moves : state.best,
      }
    }
    case 'hide':
      return state.open.length === 2 ? { ...state, open: [] } : state
    case 'restart':
      return createGame(action.deck, state.best)
  }
}

/** m:ss */
export function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}
