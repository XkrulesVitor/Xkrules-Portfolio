import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { damp } from 'maath/easing'
import { resolveView } from '@/content/hotspots'
import { SCREEN_TEXT } from '@/content/screens'
import { GAME_PROJECTS } from '@/content/projects.games'
import type { GameProject } from '@/content/types'
import { useExperienceStore, type ExperienceState } from '@/store/useExperienceStore'
import { useRoomRegistry } from '../../baked/RoomContext'
import { useReducedMotionRef } from '../useReducedMotion'
import {
  SCREEN_DAY_LEVEL,
  createThrottle,
  markScreenDirty,
  setScreenLevel,
  tickThrottle,
  type CanvasScreen,
} from './canvasScreen'
import {
  NEUTRAL_ACCENT,
  TV_HEIGHT,
  TV_WIDTH,
  createCenteredLogoState,
  createLogoState,
  createNoiseBuffer,
  createTubeOverlay,
  paintLogo,
  paintStatic,
  paintTitle,
  stepLogo,
  type LogoState,
  type NoiseBuffer,
  type TitleScreen,
} from './tvPaint'
import type { ScreenProps } from './screenProps'
import { useCanvasScreen } from './useCanvasScreen'

/** O que a TV mostra (ARCHITECTURE §6.5). */
type TvMode = 'logo' | 'static' | 'title'

/** Estática curta ao trocar de conteúdo (a TV "sintonizando"), em segundos. */
const BURST_TIME = 0.26
const HOVER_BOOST = 1.12
const FADE_SMOOTH = 0.25

const GAME_BY_SLUG: ReadonlyMap<string, GameProject> = new Map(GAME_PROJECTS.map((g) => [g.slug, g]))

/** Estado da TV no store: título só em `focused` + `shelf` + vista `digital`; estática no hover da zona. */
function tvModeOf(s: Pick<ExperienceState, 'mode' | 'focus' | 'view' | 'hovered'>): TvMode {
  if (s.mode === 'focused' && s.focus === 'shelf' && resolveView('shelf', s.view)?.id === 'digital') return 'title'
  if (s.hovered === 'shelf') return 'static'
  return 'logo'
}

/** "Contexto · engine · ano" do jogo; o ano só entra se o contexto ainda não o diz (ex.: "Game Jam CPG 2026"). */
function subtitleOf(game: GameProject): string {
  const parts = [game.context, game.engine].filter((part): part is string => Boolean(part))
  const year = game.year ? String(game.year) : null
  if (year && !parts.some((part) => part.includes(year))) parts.push(year)
  return parts.join(' · ')
}

function titleFor(slug: string | null): TitleScreen {
  const game = slug ? GAME_BY_SLUG.get(slug) : undefined
  if (!game) {
    return {
      title: SCREEN_TEXT.tv.zoneTitle,
      subtitle: SCREEN_TEXT.tv.zoneHint,
      accent: NEUTRAL_ACCENT,
      showStart: false,
    }
  }
  return { title: game.title, subtitle: subtitleOf(game), accent: game.accent ?? NEUTRAL_ACCENT, showStart: true }
}

interface TvState {
  mode: TvMode | null
  /** Slug do jogo destacado (só vale no modo `title`). */
  slug: string | null
  burst: number
  time: number
  level: number
  logo: LogoState
  noise: NoiseBuffer | null
  overlay: HTMLCanvasElement | null
  throttle: ReturnType<typeof createThrottle>
  /** `mode:slug` do último quadro desenhado (reduced-motion só redesenha quando muda). */
  paintedKey: string
  /** O logo estava parado no centro (reduced) ou solto (normal). */
  logoCentered: boolean
}

function createTvState(): TvState {
  return {
    mode: null,
    slug: null,
    burst: 0,
    time: 0,
    level: 1,
    logo: createLogoState(),
    noise: null,
    overlay: null,
    throttle: createThrottle(),
    paintedKey: '',
    logoCentered: false,
  }
}

/** Desenha um quadro da TV conforme o modo (e a estática do burst por cima da troca). */
function paintTv(screen: CanvasScreen, state: TvState, mode: TvMode, animated: boolean): void {
  const { ctx } = screen
  if (state.burst > 0 && state.noise) {
    paintStatic(ctx, state.noise, state.overlay, state.time)
  } else if (mode === 'static' && state.noise) {
    paintStatic(ctx, state.noise, state.overlay, state.time)
  } else if (mode === 'title') {
    paintTitle(ctx, titleFor(state.slug), state.overlay, state.time, animated)
  } else {
    paintLogo(ctx, state.logo, state.overlay)
  }
  markScreenDirty(screen)
}

/**
 * Tela da TV da zona de jogos (`screen_tv`, 16:9): logo "XKRULES" quicando quando ociosa (como o
 * `BouncingLogo` de Bruno Simon), estática retrô no hover da zona e, em `focused` + `shelf` + vista
 * `digital`, tela de título com o nome do jogo em `highlightBox` tingida pelo `accent` dele (tela
 * neutra da zona quando nenhum está destacado). Trocar de conteúdo dá um pico curto de estática. O
 * canvas atualiza a no máximo 15 Hz. `prefers-reduced-motion`: logo parado, estática congelada,
 * título sem piscar e sem pico (só redesenha quando o conteúdo muda). Não renderiza nada.
 */
export function TvScreen({ material, flipY = false }: ScreenProps) {
  const registry = useRoomRegistry()
  const reduced = useReducedMotionRef()
  const screen = useCanvasScreen(material, TV_WIDTH, TV_HEIGHT, flipY)
  const holder = useRef<TvState>(createTvState())

  // Overlay (scanlines + vinheta) e buffer de ruído: criados uma vez, junto da tela.
  useEffect(() => {
    const state = holder.current
    if (!screen) return
    state.overlay = createTubeOverlay(TV_WIDTH, TV_HEIGHT)
    state.noise = createNoiseBuffer()
    state.paintedKey = ''
    return () => {
      state.overlay = null
      state.noise = null
    }
  }, [screen])

  useFrame((_, delta) => {
    if (!material || !screen) return
    const state = holder.current
    const dt = Math.min(delta, 0.1)
    const s = useExperienceStore.getState()
    const mode = tvModeOf(s)
    const slug = mode === 'title' ? s.highlightBox : null
    const noMotion = reduced.current

    if (mode !== state.mode || slug !== state.slug) {
      // Primeira vez (state.mode null) não faz pico: a TV já nasce com o logo.
      state.burst = state.mode !== null && !noMotion ? BURST_TIME : 0
      state.mode = mode
      state.slug = slug
    }

    // Reduced-motion: o logo fica parado no centro; sai do reduced, volta a quicar.
    if (noMotion !== state.logoCentered) {
      state.logoCentered = noMotion
      state.logo = noMotion ? createCenteredLogoState() : createLogoState()
      state.paintedKey = ''
    }

    const elapsed = tickThrottle(state.throttle, delta)
    if (elapsed > 0) {
      state.time += elapsed
      state.burst = Math.max(0, state.burst - elapsed)
      if (noMotion) {
        const key = `${mode}:${slug ?? ''}`
        if (key !== state.paintedKey) {
          state.paintedKey = key
          paintTv(screen, state, mode, false)
        }
      } else {
        if (mode === 'logo' || state.burst > 0) stepLogo(state.logo, Math.min(elapsed, 0.25))
        paintTv(screen, state, mode, true)
      }
    }

    // Brilho: um pouco mais forte no hover da zona; de dia, mais fraco (sol lavando a tela).
    damp(state, 'level', s.hovered === 'shelf' ? HOVER_BOOST : 1, noMotion ? 0.0001 : FADE_SMOOTH, dt)
    const night = registry.nightMix.current
    setScreenLevel(material, state.level * (SCREEN_DAY_LEVEL + (1 - SCREEN_DAY_LEVEL) * night))
  })

  return null
}
