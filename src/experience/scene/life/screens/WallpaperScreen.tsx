import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { damp } from 'maath/easing'
import { useExperienceStore } from '@/store/useExperienceStore'
import { useRoomRegistry } from '../../baked/RoomContext'
import { useReducedMotionRef } from '../useReducedMotion'
import {
  SCREEN_DAY_LEVEL,
  SCREEN_OFF_LEVEL,
  markScreenDirty,
  setScreenLevel,
  type CanvasScreen,
} from './canvasScreen'
import type { ScreenProps } from './screenProps'
import { useCanvasScreen } from './useCanvasScreen'
import { createWallpaperBase, paintWallpaper } from './wallpaperPaint'

/** O wallpaper é estático: 1024x576 sobra para um monitor visto de longe (e do SO por cima, de perto). */
const WIDTH = 1024
const HEIGHT = 576
/** Brilho extra com o hover da mesa (ARCHITECTURE §6.2: o monitor "acorda"). */
const HOVER_BOOST = 1.3
const FADE_SMOOTH = 0.25
/** O SO em DOM aparece em 0.3 s (MonitorScreen.module.css): a tela some um pouco antes. */
const OS_FADE_SMOOTH = 0.12

interface WallpaperState {
  base: HTMLCanvasElement | null
  paintedMinute: number
  level: number
}

/** Redesenha o wallpaper se o minuto mudou (relógio da barra de tarefas). */
function repaintIfMinuteChanged(screen: CanvasScreen, state: WallpaperState): void {
  const minute = Math.floor(Date.now() / 60_000)
  if (minute === state.paintedMinute || !state.base) return
  state.paintedMinute = minute
  paintWallpaper(screen, state.base, new Date())
  markScreenDirty(screen)
}

/**
 * Tela do monitor horizontal (`screen_monitor_main`) fora do SO: papel de parede no estilo do
 * XKrules OS (canvas desenhado uma vez; só o relógio refaz a cada minuto). Em `focused` + `desk`
 * (e no voo para a mesa) a tela escurece, para o SO em DOM (MonitorHtml) aparecer por cima sobre um
 * fundo escuro; ao sair, volta. De dia fica um pouco mais fraca. Não renderiza nada.
 */
export function WallpaperScreen({ material, flipY = false }: ScreenProps) {
  const registry = useRoomRegistry()
  const reduced = useReducedMotionRef()
  const screen = useCanvasScreen(material, WIDTH, HEIGHT, flipY)
  const holder = useRef<WallpaperState>({ base: null, paintedMinute: -1, level: 1 })

  useEffect(() => {
    const state = holder.current
    if (!screen) return
    state.base = createWallpaperBase(screen.width, screen.height)
    state.paintedMinute = -1
    return () => {
      state.base = null
    }
  }, [screen])

  useFrame((_, delta) => {
    if (!material || !screen) return
    const state = holder.current
    const s = useExperienceStore.getState()
    const osOn = s.focus === 'desk' && (s.mode === 'focused' || s.mode === 'transitioning')

    repaintIfMinuteChanged(screen, state)

    const target = osOn ? SCREEN_OFF_LEVEL : s.hovered === 'desk' ? HOVER_BOOST : 1
    const smooth = reduced.current ? 0.0001 : osOn ? OS_FADE_SMOOTH : FADE_SMOOTH
    damp(state, 'level', target, smooth, Math.min(delta, 0.1))

    const night = registry.nightMix.current
    setScreenLevel(material, state.level * (SCREEN_DAY_LEVEL + (1 - SCREEN_DAY_LEVEL) * night))
  })

  return null
}
