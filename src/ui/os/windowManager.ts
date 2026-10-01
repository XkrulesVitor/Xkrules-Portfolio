// Gerenciador de janelas do SO: estado + reducer puros (sem React, sem DOM, sem store global).
// Toda geometria é guardada em % do desktop (x/w sobre a largura, y/h sobre a altura). Assim o
// layout independe do tamanho renderizado e o arraste continua certo sob transform 3D do drei.
import { clamp } from '@/lib/math'

/** Altura da barra de tarefas em % da altura do desktop. O CSS lê este mesmo número. */
export const TASKBAR_HEIGHT_PCT = 7.5
/** Limite inferior (em % do desktop) que uma janela pode ocupar: logo acima da barra de tarefas. */
export const WORKSPACE_BOTTOM_PCT = 100 - TASKBAR_HEIGHT_PCT

export type AppRef =
  | { readonly kind: 'projects' }
  | { readonly kind: 'project'; readonly slug: string }
  | { readonly kind: 'computer' }
  | { readonly kind: 'terminal' }
  | { readonly kind: 'memory' }
  | { readonly kind: 'credits' }

export type AppKind = AppRef['kind']

/** Retângulo da janela em % do desktop. */
export interface WindowGeometry {
  readonly x: number
  readonly y: number
  readonly w: number
  readonly h: number
}

/** Tamanho mínimo de uma janela, em % do desktop. */
export interface WindowSize {
  readonly w: number
  readonly h: number
}

/** Bordas que um gesto de redimensionar move (canto = duas bordas). */
export interface ResizeEdges {
  readonly left?: boolean
  readonly right?: boolean
  readonly top?: boolean
  readonly bottom?: boolean
}

export interface OsWindow {
  readonly id: string
  readonly app: AppRef
  readonly geometry: WindowGeometry
  /** Geometria a que a janela volta ao restaurar. `null` quando não está maximizada. */
  readonly restore: WindowGeometry | null
  /** Ordem de empilhamento (maior = mais à frente). */
  readonly z: number
  readonly minimized: boolean
}

export interface WmState {
  /** Ordem de criação. O DOM nunca se reordena (reordenar quebraria o pointer capture do arraste). */
  readonly windows: readonly OsWindow[]
  readonly zTop: number
  /** Janelas abertas até agora: alimenta o deslocamento em cascata das novas. */
  readonly opened: number
}

export type WmAction =
  | { readonly type: 'open'; readonly app: AppRef }
  | { readonly type: 'focus'; readonly id: string }
  | { readonly type: 'minimize'; readonly id: string }
  | { readonly type: 'restore'; readonly id: string }
  | { readonly type: 'toggle'; readonly id: string }
  | { readonly type: 'close'; readonly id: string }
  | { readonly type: 'move'; readonly id: string; readonly x: number; readonly y: number }
  /**
   * Redimensiona a partir da geometria `origin` (a do início do gesto) deslocada de `dx`/`dy`
   * (% do desktop). O reducer aplica tamanho mínimo e prende a janela à área de trabalho.
   */
  | {
      readonly type: 'resize'
      readonly id: string
      readonly edges: ResizeEdges
      readonly origin: WindowGeometry
      readonly dx: number
      readonly dy: number
    }
  | { readonly type: 'maximize'; readonly id: string }
  /** Volta a janela maximizada ao tamanho e à posição de antes. */
  | { readonly type: 'unmaximize'; readonly id: string }
  | { readonly type: 'toggleMaximize'; readonly id: string }
  /** Recomeça do zero com os apps dados (usado ao religar o SO). */
  | { readonly type: 'reset'; readonly apps: readonly AppRef[] }

// A coluna de atalhos do sistema ocupa até ~11% da largura, então as janelas nascem à direita dela.
const BASE_GEOMETRY: Record<AppKind, WindowGeometry> = {
  projects: { x: 20, y: 8, w: 48, h: 68 },
  project: { x: 33, y: 11, w: 56, h: 70 },
  computer: { x: 24, y: 9, w: 46, h: 68 },
  terminal: { x: 22, y: 13, w: 52, h: 60 },
  memory: { x: 35, y: 4, w: 34, h: 83 },
  credits: { x: 30, y: 8, w: 44, h: 74 },
}

/** Menor tamanho que cada app aguenta sem quebrar o conteúdo (em % do desktop). */
const MIN_SIZE: Record<AppKind, WindowSize> = {
  projects: { w: 30, h: 32 },
  project: { w: 34, h: 36 },
  computer: { w: 32, h: 40 },
  terminal: { w: 28, h: 28 },
  memory: { w: 28, h: 56 },
  credits: { w: 30, h: 38 },
}

/** Janela maximizada: a área de trabalho inteira, acima da barra de tarefas. */
export const MAXIMIZED_GEOMETRY: WindowGeometry = { x: 0, y: 0, w: 100, h: WORKSPACE_BOTTOM_PCT }

const CASCADE_STEPS = 5
const CASCADE_PCT = 2.4

export function windowId(app: AppRef): string {
  return app.kind === 'project' ? `project:${app.slug}` : app.kind
}

export function minSizeOf(app: AppRef): WindowSize {
  return MIN_SIZE[app.kind]
}

export function isMaximized(win: OsWindow): boolean {
  return win.restore !== null
}

export function initWm(apps: readonly AppRef[] = []): WmState {
  return apps.reduce<WmState>(
    (state, app) => wmReducer(state, { type: 'open', app }),
    { windows: [], zTop: 0, opened: 0 },
  )
}

/** Janela ativa: a de maior `z` entre as não minimizadas. */
export function getActiveId(state: WmState): string | null {
  let active: OsWindow | null = null
  for (const win of state.windows) {
    if (!win.minimized && (active === null || win.z > active.z)) active = win
  }
  return active ? active.id : null
}

function clampGeometry(g: WindowGeometry, x: number, y: number): WindowGeometry {
  const nx = clamp(x, 0, Math.max(0, 100 - g.w))
  const ny = clamp(y, 0, Math.max(0, WORKSPACE_BOTTOM_PCT - g.h))
  return nx === g.x && ny === g.y ? g : { ...g, x: nx, y: ny }
}

/**
 * Nova geometria de um redimensionamento: a borda oposta à puxada fica parada, o tamanho nunca
 * passa de `min` e a janela nunca sai da área de trabalho (esquerda, direita, topo e acima da
 * barra de tarefas). Pura: a UI manda sempre a geometria do início do gesto + o deslocamento total.
 */
export function resizeGeometry(
  origin: WindowGeometry,
  edges: ResizeEdges,
  dx: number,
  dy: number,
  min: WindowSize,
): WindowGeometry {
  let { x, y, w, h } = origin
  const right = origin.x + origin.w
  const bottom = origin.y + origin.h

  if (edges.right) {
    w = clamp(origin.w + dx, min.w, 100 - origin.x)
  } else if (edges.left) {
    x = clamp(origin.x + dx, 0, right - min.w)
    w = right - x
  }
  if (edges.bottom) {
    h = clamp(origin.h + dy, min.h, WORKSPACE_BOTTOM_PCT - origin.y)
  } else if (edges.top) {
    y = clamp(origin.y + dy, 0, bottom - min.h)
    h = bottom - y
  }
  return { x, y, w, h }
}

function sameGeometry(a: WindowGeometry, b: WindowGeometry): boolean {
  return a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h
}

function updateWindow(
  state: WmState,
  id: string,
  update: (win: OsWindow) => OsWindow,
): WmState {
  return {
    ...state,
    windows: state.windows.map((w) => (w.id === id ? update(w) : w)),
  }
}

/** Traz a janela para a frente e a restaura se estava minimizada. */
function activate(state: WmState, id: string): WmState {
  const target = state.windows.find((w) => w.id === id)
  if (!target) return state
  if (!target.minimized && target.z === state.zTop) return state
  const z = state.zTop + 1
  return updateWindow({ ...state, zTop: z }, id, (w) => ({ ...w, z, minimized: false }))
}

function maximize(state: WmState, id: string): WmState {
  const target = state.windows.find((w) => w.id === id)
  if (!target) return state
  const brought = activate(state, id)
  if (isMaximized(target)) return brought
  return updateWindow(brought, id, (w) => ({
    ...w,
    restore: w.geometry,
    geometry: MAXIMIZED_GEOMETRY,
  }))
}

function unmaximize(state: WmState, id: string): WmState {
  const target = state.windows.find((w) => w.id === id)
  if (!target || target.restore === null) return state
  const back = target.restore
  return updateWindow(activate(state, id), id, (w) => ({ ...w, geometry: back, restore: null }))
}

export function wmReducer(state: WmState, action: WmAction): WmState {
  switch (action.type) {
    case 'open': {
      const id = windowId(action.app)
      // App já aberto: foca a janela existente (e a restaura se estava minimizada).
      if (state.windows.some((w) => w.id === id)) return activate(state, id)
      const base = BASE_GEOMETRY[action.app.kind]
      const step = (state.opened % CASCADE_STEPS) * CASCADE_PCT
      const geometry = clampGeometry(base, base.x + step, base.y + step)
      const z = state.zTop + 1
      return {
        windows: [
          ...state.windows,
          { id, app: action.app, geometry, restore: null, z, minimized: false },
        ],
        zTop: z,
        opened: state.opened + 1,
      }
    }
    case 'focus':
    case 'restore':
      return activate(state, action.id)
    case 'minimize': {
      const target = state.windows.find((w) => w.id === action.id)
      if (!target || target.minimized) return state
      return updateWindow(state, action.id, (w) => ({ ...w, minimized: true }))
    }
    case 'toggle': {
      const target = state.windows.find((w) => w.id === action.id)
      if (!target) return state
      if (target.minimized) return activate(state, action.id)
      // Botão da barra de tarefas: minimiza a ativa, traz para a frente as demais.
      return getActiveId(state) === action.id
        ? wmReducer(state, { type: 'minimize', id: action.id })
        : activate(state, action.id)
    }
    case 'close': {
      if (!state.windows.some((w) => w.id === action.id)) return state
      return { ...state, windows: state.windows.filter((w) => w.id !== action.id) }
    }
    case 'move': {
      const target = state.windows.find((w) => w.id === action.id)
      // Maximizada não se arrasta: primeiro restaura.
      if (!target || isMaximized(target)) return state
      const geometry = clampGeometry(target.geometry, action.x, action.y)
      if (geometry === target.geometry) return state
      return updateWindow(state, action.id, (w) => ({ ...w, geometry }))
    }
    case 'resize': {
      const target = state.windows.find((w) => w.id === action.id)
      if (!target || isMaximized(target)) return state
      const geometry = resizeGeometry(
        action.origin,
        action.edges,
        action.dx,
        action.dy,
        minSizeOf(target.app),
      )
      if (sameGeometry(geometry, target.geometry)) return state
      return updateWindow(state, action.id, (w) => ({ ...w, geometry }))
    }
    case 'maximize':
      return maximize(state, action.id)
    case 'unmaximize':
      return unmaximize(state, action.id)
    case 'toggleMaximize': {
      const target = state.windows.find((w) => w.id === action.id)
      if (!target) return state
      return isMaximized(target) ? unmaximize(state, action.id) : maximize(state, action.id)
    }
    case 'reset':
      return initWm(action.apps)
  }
}
