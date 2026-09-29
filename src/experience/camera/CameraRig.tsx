import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CameraControls, CameraControlsImpl } from '@react-three/drei'
import { Box3, Vector3 } from 'three'
import { shallow } from 'zustand/shallow'
import { FOCUS_QUERY_PARAM, VIEW_QUERY_PARAM } from '@/lib/constants'
import { prefersReducedMotion } from '@/lib/device'
import { isHotspotId, resolveFocus } from '@/content/hotspots'
import type { HotspotId, PresetKey } from '@/content/types'
import type { Mode } from '@/store/useExperienceStore'
import { useExperienceStore } from '@/store/useExperienceStore'
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

// Pan (truck) em HOME fica preso a esta caixa, para o usuário não "perder" a ilha.
const HOME_TARGET_BOUNDARY = new Box3(new Vector3(-1.8, 0.4, -2.6), new Vector3(2.4, 2, 1.8))

// Chegada: a promise de `setLookAt` só resolve no evento `rest` do camera-controls, e a cauda
// do amortecimento exponencial leva vários segundos depois de a câmera "parecer" parada
// (medido: intro visual ~2 s, `rest` ~9 s). Por isso a chegada é detectada por frame:
// distância ao preset abaixo de ARRIVE_EPS, com um teto de tempo como rede de segurança.
const ARRIVE_EPS = 0.06
const MAX_FLIGHT_FACTOR = 2.5 // x smoothTime (o SmoothDamp já está a ~2% do destino em ~2x)
const MIN_FLIGHT_MS = 400

interface Flight {
  token: number
  key: PresetKey
  preset: CameraPreset
  startedAt: number
  maxMs: number
  onArrive: () => void
}

const tmpPos = new Vector3()
const tmpTarget = new Vector3()
const presetPos = new Vector3()
const presetTarget = new Vector3()

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

/** Posiciona a câmera imediatamente (sem transição) e aplica limites/controle do preset. */
function snapTo(controls: CameraControlsImpl, key: PresetKey) {
  const p = PRESETS[key]
  controls.setBoundary(undefined)
  applyLimits(controls, OPEN_LIMITS)
  void controls.setLookAt(...p.position, ...p.target, false)
  settleAt(controls, key, p)
}

/** Estado "de repouso" depois de chegar no preset. */
function settleAt(controls: CameraControlsImpl, key: PresetKey, p: CameraPreset) {
  applyLimits(controls, p.limits)
  if (key === 'home') controls.setBoundary(HOME_TARGET_BOUNDARY)
  controls.smoothTime = p.userControl ? USER_SMOOTH_TIME : (p.smoothTime ?? DEFAULT_SMOOTH_TIME)
  controls.enabled = p.userControl
}

/**
 * Único componente que move a câmera (ARCHITECTURE §4): assina o store e reage a
 * `mode === 'intro' | 'transitioning'` com `setLookAt(..., true)`, e também à troca de sub-vista
 * em `focused` (voo "lateral" que não sai do foco, então o painel continua montado). É a única
 * fonte de `onCameraRest()`.
 */
export function CameraRig() {
  const controlsRef = useRef<CameraControlsImpl>(null)
  const flightRef = useRef<Flight | null>(null)
  const tokenRef = useRef(0)

  // Detecção de chegada por frame (ver ARRIVE_EPS).
  useFrame(() => {
    const flight = flightRef.current
    const controls = controlsRef.current
    if (!flight || !controls) return
    // `receiveEndValue = false`: valor ATUAL, não o destino da transição (default do camera-controls).
    controls.getPosition(tmpPos, false)
    controls.getTarget(tmpTarget, false)
    presetPos.set(...flight.preset.position)
    presetTarget.set(...flight.preset.target)
    const near =
      tmpPos.distanceTo(presetPos) < ARRIVE_EPS && tmpTarget.distanceTo(presetTarget) < ARRIVE_EPS
    const timedOut = performance.now() - flight.startedAt > flight.maxMs
    if (!near && !timedOut) return
    flightRef.current = null
    if (flight.token !== tokenRef.current) return // superado por outro voo
    flight.onArrive()
  })

  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return
    const store = useExperienceStore
    // Contadores mutáveis compartilhados com o useFrame (não apontam para nós React).
    const tokens = tokenRef
    const flights = flightRef
    /** Preset em que a câmera está ou para onde está voando. */
    let currentKey: PresetKey | null = null

    interface FlyOptions {
      intro: boolean
      /** Deep-link lido na intro: pula o voo de introdução e depois foca o hotspot. */
      link: DeepLink | null
      /** Voos de intro/transição avisam o store ao chegar; troca de sub-vista não muda o modo. */
      notifyRest: boolean
    }

    const fly = (key: PresetKey, opts: FlyOptions) => {
      const token = ++tokens.current
      const reduced = prefersReducedMotion()
      const preset = PRESETS[key]
      currentKey = key

      // Bloqueia o input e libera os limites: eles só valem para o usuário, e um destino
      // fora dos limites do preset anterior não pode ser "puxado" no meio do voo.
      controls.enabled = false
      controls.setBoundary(undefined)
      applyLimits(controls, OPEN_LIMITS)

      const animate = !reduced && !opts.link
      let smoothTime = opts.intro ? INTRO_SMOOTH_TIME : (preset.smoothTime ?? DEFAULT_SMOOTH_TIME)
      if (reduced) smoothTime = 0
      controls.smoothTime = smoothTime

      void controls.setLookAt(...preset.position, ...preset.target, animate)

      flights.current = {
        token,
        key,
        preset,
        startedAt: performance.now(),
        maxMs: animate ? Math.max(MIN_FLIGHT_MS, smoothTime * MAX_FLIGHT_FACTOR * 1000) : 0,
        onArrive: () => {
          settleAt(controls, key, preset)
          if (!opts.notifyRest) return
          store.getState().onCameraRest()
          if (opts.link) store.getState().requestFocus(opts.link.focus, opts.link.view)
        },
      }
    }

    const react = (mode: Mode, focus: HotspotId | null, view: string | null) => {
      if (mode === 'intro' || mode === 'transitioning') {
        const link = mode === 'intro' ? readDeepLink() : null
        fly(presetKeyFor(mode, focus, view), { intro: mode === 'intro', link, notifyRest: true })
        return
      }
      // Troca de sub-vista em foco (ex.: aba Digital da zona de jogos).
      if (mode === 'focused' && focus !== null) {
        const key = presetKeyFor(mode, focus, view)
        if (key !== currentKey) fly(key, { intro: false, link: null, notifyRest: false })
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
      currentKey = presetKeyFor(initial.mode, initial.focus, initial.view)
      snapTo(controls, currentKey)
      if (initial.mode === 'transitioning') react('transitioning', initial.focus, initial.view)
    }

    const unsubscribe = store.subscribe(
      (s) => [s.mode, s.focus, s.view] as const,
      ([mode, focus, view]) => react(mode, focus, view),
      { equalityFn: shallow },
    )

    return () => {
      tokens.current++
      flights.current = null
      unsubscribe()
    }
  }, [])

  return <CameraControls ref={controlsRef} makeDefault />
}
