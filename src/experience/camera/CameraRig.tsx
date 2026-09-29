import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CameraControls, CameraControlsImpl } from '@react-three/drei'
import { Box3, Vector3 } from 'three'
import { shallow } from 'zustand/shallow'
import { FOCUS_QUERY_PARAM } from '@/lib/constants'
import { prefersReducedMotion } from '@/lib/device'
import { isHotspotId } from '@/content/hotspots'
import type { Mode } from '@/store/useExperienceStore'
import { useExperienceStore } from '@/store/useExperienceStore'
import type { HotspotId } from '@/content/types'
import {
  DEFAULT_SMOOTH_TIME,
  INTRO_SMOOTH_TIME,
  INTRO_START,
  OPEN_LIMITS,
  PRESETS,
  USER_SMOOTH_TIME,
  type CameraLimits,
  type CameraPreset,
  type PresetKey,
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

function readDeepLink(): HotspotId | null {
  const value = new URLSearchParams(window.location.search).get(FOCUS_QUERY_PARAM)
  return isHotspotId(value) ? value : null
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
 * `mode === 'intro' | 'transitioning'` com `setLookAt(..., true)`. É também a única
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

    const run = (mode: Mode, focus: HotspotId | null) => {
      if (mode !== 'intro' && mode !== 'transitioning') return
      const token = ++tokens.current
      const reduced = prefersReducedMotion()

      const key: PresetKey = mode === 'intro' ? 'home' : (focus ?? 'home')
      const preset = PRESETS[key]
      const link = mode === 'intro' ? readDeepLink() : null

      // Bloqueia o input e libera os limites: eles só valem para o usuário, e um destino
      // fora dos limites do preset anterior não pode ser "puxado" no meio do voo.
      controls.enabled = false
      controls.setBoundary(undefined)
      applyLimits(controls, OPEN_LIMITS)

      // Deep-link: pula o voo de introdução (teleporta para HOME, depois voa ao hotspot).
      const animate = !reduced && !link
      let smoothTime =
        mode === 'intro' ? INTRO_SMOOTH_TIME : (preset.smoothTime ?? DEFAULT_SMOOTH_TIME)
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
          store.getState().onCameraRest()
          if (link) store.getState().requestFocus(link)
        },
      }
    }

    // Estado inicial (também cobre Fast Refresh com a cena já ativa).
    const initial = store.getState()
    if (initial.mode === 'loading' || initial.mode === 'intro') {
      controls.setBoundary(undefined)
      applyLimits(controls, OPEN_LIMITS)
      void controls.setLookAt(...INTRO_START.position, ...INTRO_START.target, false)
      controls.enabled = false
      if (initial.mode === 'intro') run('intro', null)
    } else {
      snapTo(controls, initial.focus ?? 'home')
      if (initial.mode === 'transitioning') run('transitioning', initial.focus)
    }

    const unsubscribe = store.subscribe(
      (s) => [s.mode, s.focus] as const,
      ([mode, focus]) => run(mode, focus),
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
