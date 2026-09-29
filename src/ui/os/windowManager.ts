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

/** Retângulo da janela em % do desktop. */
export interface WindowGeometry {
  readonly x: number
  readonly y: number
  readonly w: number
  readonly h: number
}

export interface OsWindow {
  readonly id: string
  readonly app: AppRef
  readonly geometry: WindowGeometry
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

// A coluna dupla de atalhos ocupa até ~18% da largura, então as janelas nascem à direita dela.
const BASE_GEOMETRY: Record<AppRef['kind'], WindowGeometry> = {
  projects: { x: 20, y: 8, w: 48, h: 68 },
  project: { x: 33, y: 11, w: 56, h: 70 },
}

const CASCADE_STEPS = 5
const CASCADE_PCT = 2.4

export function windowId(app: AppRef): string {
  return app.kind === 'projects' ? 'projects' : `project:${app.slug}`
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

/** Traz a janela para a frente e a restaura se estava minimizada. */
function activate(state: WmState, id: string): WmState {
  const target = state.windows.find((w) => w.id === id)
  if (!target) return state
  if (!target.minimized && target.z === state.zTop) return state
  const z = state.zTop + 1
  return {
    ...state,
    zTop: z,
    windows: state.windows.map((w) => (w.id === id ? { ...w, z, minimized: false } : w)),
  }
}

export function wmReducer(state: WmState, action: WmAction): WmState {
  switch (action.type) {
    case 'open': {
      const id = windowId(action.app)
      if (state.windows.some((w) => w.id === id)) return activate(state, id)
      const base = BASE_GEOMETRY[action.app.kind]
      const step = (state.opened % CASCADE_STEPS) * CASCADE_PCT
      const geometry = clampGeometry(base, base.x + step, base.y + step)
      const z = state.zTop + 1
      return {
        windows: [...state.windows, { id, app: action.app, geometry, z, minimized: false }],
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
      return {
        ...state,
        windows: state.windows.map((w) => (w.id === action.id ? { ...w, minimized: true } : w)),
      }
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
      if (!target) return state
      const geometry = clampGeometry(target.geometry, action.x, action.y)
      if (geometry === target.geometry) return state
      return {
        ...state,
        windows: state.windows.map((w) => (w.id === action.id ? { ...w, geometry } : w)),
      }
    }
  }
}
