import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { damp } from 'maath/easing'
import { useExperienceStore } from '@/store/useExperienceStore'
import { useRoomRegistry } from '../../baked/RoomContext'
import { useReducedMotionRef } from '../useReducedMotion'
import {
  SCREEN_DAY_LEVEL,
  createThrottle,
  markScreenDirty,
  setScreenLevel,
  tickThrottle,
} from './canvasScreen'
import {
  EDITOR_HEIGHT,
  EDITOR_WIDTH,
  createEditorState,
  createStaticEditorState,
  paintEditor,
  stepEditor,
} from './editorPaint'
import type { ScreenProps } from './screenProps'
import { useCanvasScreen } from './useCanvasScreen'

const HOVER_BOOST = 1.25
const FADE_SMOOTH = 0.25

interface EditorScreenState {
  editor: ReturnType<typeof createEditorState>
  throttle: ReturnType<typeof createThrottle>
  level: number
  /** O quadro estático (reduced-motion) já foi desenhado. */
  staticPainted: boolean
}

/**
 * Tela do monitor vertical (`screen_monitor_vertical`, 9:16): editor de código escuro "digitando" e
 * rolando devagar, com cursor piscando. O canvas é redesenhado a no máximo 15 Hz (nada de redesenhar
 * todo frame). `prefers-reduced-motion`: um quadro estático (código completo, cursor aceso). Não
 * renderiza nada.
 */
export function CodeEditorScreen({ material, flipY = false }: ScreenProps) {
  const registry = useRoomRegistry()
  const reduced = useReducedMotionRef()
  const screen = useCanvasScreen(material, EDITOR_WIDTH, EDITOR_HEIGHT, flipY)
  const holder = useRef<EditorScreenState>({
    editor: createEditorState(),
    throttle: createThrottle(),
    level: 1,
    staticPainted: false,
  })

  useFrame((_, delta) => {
    if (!material || !screen) return
    const state = holder.current
    const dt = Math.min(delta, 0.1)

    if (reduced.current) {
      if (!state.staticPainted) {
        state.staticPainted = true
        state.editor = createStaticEditorState()
        paintEditor(screen.ctx, state.editor, false)
        markScreenDirty(screen)
      }
    } else {
      if (state.staticPainted) {
        state.staticPainted = false
        state.editor = createEditorState()
      }
      const elapsed = tickThrottle(state.throttle, delta)
      if (elapsed > 0) {
        stepEditor(state.editor, Math.min(elapsed, 0.25))
        paintEditor(screen.ctx, state.editor, true)
        markScreenDirty(screen)
      }
    }

    const s = useExperienceStore.getState()
    const target = s.hovered === 'desk' ? HOVER_BOOST : 1
    damp(state, 'level', target, reduced.current ? 0.0001 : FADE_SMOOTH, dt)
    const night = registry.nightMix.current
    setScreenLevel(material, state.level * (SCREEN_DAY_LEVEL + (1 - SCREEN_DAY_LEVEL) * night))
  })

  return null
}
