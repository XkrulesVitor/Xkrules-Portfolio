import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { CameraControls, CameraControlsImpl } from '@react-three/drei'
import { Box3, Vector3, type PerspectiveCamera } from 'three'
import { shallow } from 'zustand/shallow'
import { FOCUS_QUERY_PARAM, VIEW_QUERY_PARAM } from '@/lib/constants'
import { prefersReducedMotion } from '@/lib/device'
import { isHotspotId, resolveFocus } from '@/content/hotspots'
import type { HotspotId, PanelSide, PresetKey } from '@/content/types'
import type { Mode } from '@/store/useExperienceStore'
import { useExperienceStore } from '@/store/useExperienceStore'
import { directionFromPose } from './framing'
import { IdleDrift } from './idleDrift'
import { hasParallax, MouseParallax } from './parallax'
import {
  DEFAULT_SMOOTH_TIME,
  INTRO_SMOOTH_TIME,
  INTRO_START,
  OPEN_LIMITS,
  PRESETS,
  USER_SMOOTH_TIME,
  type CameraLimits,
  type CameraPreset,
} from './presets'
import { limitsFor, resolvePose, type ResolvedPose, type Viewport } from './resolvePose'

// Pan (truck) em HOME fica preso a esta caixa, para o usuário não "perder" a ilha. O alvo resolvido
// do HOME (que muda com o aspect) entra na caixa em `settleAt`.
const HOME_TARGET_BOUNDARY = new Box3(new Vector3(-1.8, 0.4, -2.6), new Vector3(2.4, 2, 1.8))

// Chegada: a promise de `setLookAt` só resolve no evento `rest` do camera-controls, e a cauda
// do amortecimento exponencial leva vários segundos depois de a câmera "parecer" parada
// (medido: intro visual ~2 s, `rest` ~9 s). Por isso a chegada é detectada por frame:
// distância ao preset abaixo de ARRIVE_EPS, com um teto de tempo como rede de segurança.
const ARRIVE_EPS = 0.06
const MAX_FLIGHT_FACTOR = 2.5 // x smoothTime (o SmoothDamp já está a ~2% do destino em ~2x)
const MIN_FLIGHT_MS = 400

/** Espera depois do último resize antes de refazer o enquadramento (o arrasto da borda dispara dezenas). */
const RESIZE_DEBOUNCE_MS = 150
/** Voo do reenquadramento por resize: curto, a pose muda pouco. */
const RESIZE_SMOOTH_TIME = 0.5
/** Teto do delta de tempo por frame (aba em segundo plano devolve saltos grandes). */
const MAX_DT = 0.1

interface FlyOptions {
  intro: boolean
  /** Deep-link lido na intro: pula o voo de introdução e depois foca o hotspot. */
  link: DeepLink | null
  /** Voos de intro/transição avisam o store ao chegar; troca de sub-vista e resize não mudam o modo. */
  notifyRest: boolean
  /** Sobrescreve o smoothTime do preset (reenquadramento por resize). */
  smoothTime?: number
  /** Mantém a direção de olhar ATUAL em vez da do preset (HOME em `idle`: não desfaz a órbita). */
  keepDirection?: boolean
}

interface Flight {
  token: number
  key: PresetKey
  preset: CameraPreset
  side: PanelSide
  opts: FlyOptions
  /** Pose resolvida do voo (destino da detecção de chegada). */
  position: Vector3
  target: Vector3
  startedAt: number
  maxMs: number
  onArrive: () => void
}

const tmpPos = new Vector3()
const tmpTarget = new Vector3()
const tmpBoundary = new Box3()
const tmpBoundaryPoint = new Vector3()

function applyLimits(controls: CameraControlsImpl, l: CameraLimits) {
  controls.minDistance = l.minDistance
  controls.maxDistance = l.maxDistance
  controls.minPolarAngle = l.minPolar
  controls.maxPolarAngle = l.maxPolar
  controls.minAzimuthAngle = l.minAzimuth
  controls.maxAzimuthAngle = l.maxAzimuth
}

interface DeepLink {
  focus: HotspotId
  view: string | null
}

function readDeepLink(): DeepLink | null {
  const params = new URLSearchParams(window.location.search)
  const focus = params.get(FOCUS_QUERY_PARAM)
  return isHotspotId(focus) ? { focus, view: params.get(VIEW_QUERY_PARAM) } : null
}

/** Preset de destino de um estado do store, com a sub-vista resolvida pelo registry. */
function presetKeyFor(mode: Mode, focus: HotspotId | null, view: string | null): PresetKey {
  if (mode === 'intro' || focus === null) return 'home'
  return resolveFocus(focus, view).preset
}

/** Lado do painel DOM que acompanha o preset (HOME e intro não têm painel). */
function sideFor(mode: Mode, focus: HotspotId | null, view: string | null): PanelSide {
  if (mode === 'intro' || focus === null) return 'none'
  return resolveFocus(focus, view).side
}

/** Estado "de repouso" depois de chegar no preset (`pose` = a pose resolvida do voo). */
function settleAt(controls: CameraControlsImpl, key: PresetKey, p: CameraPreset, pose: ResolvedPose) {
  applyLimits(controls, limitsFor(p, pose.distance))
  if (key === 'home') {
    // O alvo resolvido do HOME varia com o aspect: a caixa de pan o inclui para não "puxar" a câmera.
    tmpBoundary.copy(HOME_TARGET_BOUNDARY)
    tmpBoundary.expandByPoint(tmpBoundaryPoint.set(...pose.target))
    controls.setBoundary(tmpBoundary)
  }
  controls.smoothTime = p.userControl ? USER_SMOOTH_TIME : (p.smoothTime ?? DEFAULT_SMOOTH_TIME)
  controls.enabled = p.userControl
}

/**
 * Único componente que move a câmera (ARCHITECTURE §4): assina o store e reage a
 * `mode === 'intro' | 'transitioning'` com `setLookAt(..., true)`, e também à troca de sub-vista
 * em `focused` (voo "lateral" que não sai do foco, então o painel continua montado). É a única
 * fonte de `onCameraRest()`.
 *
 * Cada voo usa a pose resolvida por `resolvePose` (enquadramento responsivo: o conteúdo do preset
 * cabe inteiro fora do painel no aspect atual) e é refeito no resize. Em cima disso roda a "câmera
 * viva": deriva ociosa em HOME (`IdleDrift`) e parallax do mouse em hotspots (`MouseParallax`).
 */
export function CameraRig() {
  const controlsRef = useRef<CameraControlsImpl>(null)
  const flightRef = useRef<Flight | null>(null)
  const tokenRef = useRef(0)
  /** Preset em que a câmera está ou para onde está voando. */
  const currentKeyRef = useRef<PresetKey | null>(null)
  const reducedRef = useRef(false)
  const refitRef = useRef<(() => void) | null>(null)
  const drift = useMemo(() => new IdleDrift(), [])
  const parallax = useMemo(() => new MouseParallax(), [])

  const get = useThree((s) => s.get)
  const width = useThree((s) => s.size.width)
  const height = useThree((s) => s.size.height)

  useFrame((_, delta) => {
    const controls = controlsRef.current
    if (!controls) return

    // Detecção de chegada por frame (ver ARRIVE_EPS).
    const flight = flightRef.current
    if (flight) {
      // `receiveEndValue = false`: valor ATUAL, não o destino da transição (default do camera-controls).
      controls.getPosition(tmpPos, false)
      controls.getTarget(tmpTarget, false)
      const near =
        tmpPos.distanceTo(flight.position) < ARRIVE_EPS &&
        tmpTarget.distanceTo(flight.target) < ARRIVE_EPS
      const timedOut = performance.now() - flight.startedAt > flight.maxMs
      if (near || timedOut) {
        flightRef.current = null
        // Superado por outro voo: o novo cuida da chegada.
        if (flight.token === tokenRef.current) flight.onArrive()
      }
    }

    // Câmera viva. Só roda de repouso (sem voo) e sem `prefers-reduced-motion`.
    const dt = Math.min(delta, MAX_DT)
    const resting = flightRef.current === null && !reducedRef.current
    const mode = useExperienceStore.getState().mode
    drift.update(controls, dt, resting && mode === 'idle' && currentKeyRef.current === 'home')
    parallax.update(controls, dt, resting && mode === 'focused' && hasParallax(currentKeyRef.current))
  })

  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return
    const store = useExperienceStore
    // Contadores mutáveis compartilhados com o useFrame (não apontam para nós React).
    const tokens = tokenRef
    const flights = flightRef
    const currentKey = currentKeyRef

    const viewport = (): Viewport => {
      const { size, camera } = get()
      const fovDeg = (camera as PerspectiveCamera).fov ?? 35
      return { width: size.width, height: size.height, fovDeg }
    }

    /** Pose do preset no aspect atual. `keepDirection` troca a direção do preset pela atual. */
    const poseFor = (key: PresetKey, side: PanelSide, keepDirection?: boolean): ResolvedPose => {
      let direction: readonly [number, number, number] | undefined
      if (keepDirection) {
        controls.getPosition(tmpPos, true)
        controls.getTarget(tmpTarget, true)
        direction = directionFromPose([tmpPos.x, tmpPos.y, tmpPos.z], [tmpTarget.x, tmpTarget.y, tmpTarget.z])
      }
      return resolvePose(key, side, viewport(), direction)
    }

    const fly = (key: PresetKey, side: PanelSide, opts: FlyOptions) => {
      const token = ++tokens.current
      const reduced = prefersReducedMotion()
      const preset = PRESETS[key]
      const pose = poseFor(key, side, opts.keepDirection)
      currentKey.current = key

      // Bloqueia o input e libera os limites: eles só valem para o usuário, e um destino
      // fora dos limites do preset anterior não pode ser "puxado" no meio do voo.
      controls.enabled = false
      controls.setBoundary(undefined)
      applyLimits(controls, OPEN_LIMITS)

      const animate = !reduced && !opts.link
      let smoothTime =
        opts.smoothTime ?? (opts.intro ? INTRO_SMOOTH_TIME : (preset.smoothTime ?? DEFAULT_SMOOTH_TIME))
      if (reduced) smoothTime = 0
      controls.smoothTime = smoothTime

      // Parallax zerado no começo de qualquer voo; a deriva reinicia sozinha (voo = não elegível).
      parallax.release(controls)
      drift.noteInput()

      void controls.setLookAt(...pose.position, ...pose.target, animate)

      flights.current = {
        token,
        key,
        preset,
        side,
        opts,
        position: new Vector3(...pose.position),
        target: new Vector3(...pose.target),
        startedAt: performance.now(),
        maxMs: animate ? Math.max(MIN_FLIGHT_MS, smoothTime * MAX_FLIGHT_FACTOR * 1000) : 0,
        onArrive: () => {
          settleAt(controls, key, preset, pose)
          if (!opts.notifyRest) return
          store.getState().onCameraRest()
          if (opts.link) store.getState().requestFocus(opts.link.focus, opts.link.view)
        },
      }
    }

    /** Posiciona a câmera imediatamente (sem transição) e aplica limites/controle do preset. */
    const snapTo = (key: PresetKey, side: PanelSide) => {
      const p = PRESETS[key]
      const pose = poseFor(key, side)
      controls.setBoundary(undefined)
      applyLimits(controls, OPEN_LIMITS)
      void controls.setLookAt(...pose.position, ...pose.target, false)
      settleAt(controls, key, p, pose)
    }

    const react = (mode: Mode, focus: HotspotId | null, view: string | null) => {
      const side = sideFor(mode, focus, view)
      if (mode === 'intro' || mode === 'transitioning') {
        const link = mode === 'intro' ? readDeepLink() : null
        fly(presetKeyFor(mode, focus, view), side, {
          intro: mode === 'intro',
          link,
          notifyRest: true,
        })
        return
      }
      // Troca de sub-vista em foco (ex.: aba Digital da zona de jogos).
      if (mode === 'focused' && focus !== null) {
        const key = presetKeyFor(mode, focus, view)
        if (key !== currentKey.current) {
          fly(key, side, { intro: false, link: null, notifyRest: false })
        }
      }
    }

    // Resize: refaz o enquadramento da pose em que a câmera está (ou para onde voa). Nunca chama
    // `onCameraRest` por conta própria: um voo em andamento refaz com as MESMAS opções (e avisa o
    // store uma vez só, na chegada), e os demais casos usam `notifyRest: false`.
    refitRef.current = () => {
      const flight = flights.current
      if (flight) {
        fly(flight.key, flight.side, flight.opts)
        return
      }
      const s = store.getState()
      if (s.mode === 'focused' && s.focus !== null) {
        const key = presetKeyFor(s.mode, s.focus, s.view)
        fly(key, sideFor(s.mode, s.focus, s.view), {
          intro: false,
          link: null,
          notifyRest: false,
          smoothTime: RESIZE_SMOOTH_TIME,
        })
      } else if (s.mode === 'idle' && currentKey.current === 'home') {
        // Mantém a órbita do usuário: só a distância e o alvo seguem o novo aspect.
        fly('home', 'none', {
          intro: false,
          link: null,
          notifyRest: false,
          smoothTime: RESIZE_SMOOTH_TIME,
          keepDirection: true,
        })
      }
    }

    // Estado inicial (também cobre Fast Refresh com a cena já ativa).
    const initial = store.getState()
    if (initial.mode === 'loading' || initial.mode === 'intro') {
      controls.setBoundary(undefined)
      applyLimits(controls, OPEN_LIMITS)
      void controls.setLookAt(...INTRO_START.position, ...INTRO_START.target, false)
      controls.enabled = false
      if (initial.mode === 'intro') react('intro', null, null)
    } else {
      currentKey.current = presetKeyFor(initial.mode, initial.focus, initial.view)
      snapTo(currentKey.current, sideFor(initial.mode, initial.focus, initial.view))
      if (initial.mode === 'transitioning') react('transitioning', initial.focus, initial.view)
    }

    const unsubscribe = store.subscribe(
      (s) => [s.mode, s.focus, s.view] as const,
      ([mode, focus, view]) => react(mode, focus, view),
      { equalityFn: shallow },
    )

    // --- Câmera viva: entradas -------------------------------------------------------------
    // Input do usuário pausa a deriva. O camera-controls não emite `controlstart` na roda do
    // mouse (só scroll), então a roda é ouvida à parte.
    const onUserInput = () => drift.noteInput()
    controls.addEventListener('controlstart', onUserInput)
    controls.addEventListener('control', onUserInput)
    controls.addEventListener('controlend', onUserInput)
    window.addEventListener('wheel', onUserInput, { passive: true })

    // Ponteiro normalizado para o parallax (na janela, não no canvas: o overlay cobre parte dele).
    const onPointerMove = (e: PointerEvent) =>
      parallax.setPointer((e.clientX / window.innerWidth) * 2 - 1, 1 - (e.clientY / window.innerHeight) * 2)
    const onPointerLeave = () => parallax.clearPointer()
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onPointerLeave)

    // prefers-reduced-motion vale em tempo real: liga e desliga deriva e parallax.
    const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    reducedRef.current = motionQuery?.matches ?? false
    const onMotionChange = (e: MediaQueryListEvent) => {
      reducedRef.current = e.matches
    }
    motionQuery?.addEventListener('change', onMotionChange)

    return () => {
      tokens.current++
      flights.current = null
      refitRef.current = null
      unsubscribe()
      controls.removeEventListener('controlstart', onUserInput)
      controls.removeEventListener('control', onUserInput)
      controls.removeEventListener('controlend', onUserInput)
      window.removeEventListener('wheel', onUserInput)
      window.removeEventListener('pointermove', onPointerMove)
      document.documentElement.removeEventListener('pointerleave', onPointerLeave)
      motionQuery?.removeEventListener('change', onMotionChange)
      parallax.release(controls)
    }
  }, [get, drift, parallax])

  // Resize do canvas (= da janela): refaz o enquadramento depois que o redimensionamento assenta.
  const sizeRef = useRef({ width, height })
  useEffect(() => {
    if (sizeRef.current.width === width && sizeRef.current.height === height) return
    sizeRef.current = { width, height }
    const id = window.setTimeout(() => refitRef.current?.(), RESIZE_DEBOUNCE_MS)
    return () => window.clearTimeout(id)
  }, [width, height])

  return <CameraControls ref={controlsRef} makeDefault />
}
