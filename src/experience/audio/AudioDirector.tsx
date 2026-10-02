import { useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { damp } from 'maath/easing'
import { Vector3 } from 'three'
import { audio, ambientLevel, fanLevel, staticLevel, type AudioDebugState } from '@/lib/audio'
import { useExperienceStore } from '@/store/useExperienceStore'
import { LAYOUT, ROOM } from '../scene/layout'

// Pontos do quarto que mandam no som. Tudo vem do layout.ts: mover um móvel move o som junto.
const PC = new Vector3(...LAYOUT.pcTower)
const ROOM_CENTER = new Vector3(0, ROOM.wallHeight / 2, 0)
const TV = new Vector3(...LAYOUT.tv.center)

/** Suavização (s) dos volumes por distância: a câmera voa, o som desliza junto sem degraus. */
const LEVEL_SMOOTH_TIME = 0.3
/** Teto do delta de tempo por frame (aba em segundo plano devolve saltos grandes). */
const MAX_DT = 0.1
/** Estática repetida mais perto que isto (ms) é ignorada: o hover do mouse "treme" na borda. */
const STATIC_COOLDOWN_MS = 900

/** Volumes suavizados (0..1). Objeto de módulo: o `useFrame` só muta campos, nunca aloca. */
const levels = { fan: 0, ambient: 0 }
/** Última leitura para depuração (`window.__audio`): distâncias e alvos. Mutado no frame. */
const probe = { dPc: 0, dRoom: 0, fanTarget: 0, ambientTarget: 0 }

interface AudioDebugHandle {
  /** Estado do motor + volumes/distâncias do 3D. */
  debug(): AudioDebugState & { levels: typeof levels; probe: typeof probe }
  /** Renderiza cada voz offline e devolve pico/RMS em dBFS contra o alvo (calibragem). */
  measure(): Promise<Record<string, { peakDb: number; rmsDb: number; targetDb: number }>>
  /** Atalhos para ouvir/inspecionar sem mexer na UI. */
  engine: typeof audio
}

declare global {
  interface Window {
    /** Só em dev: lê o estado do áudio (`__audio.debug()`), mede as vozes (`__audio.measure()`). */
    __audio?: AudioDebugHandle
  }
}

/**
 * Áudio do quarto no lado 3D (sem DOM). Dois trabalhos:
 * - por frame (refs, sem setState): ajusta o volume do zumbido pela distância da câmera ao PC e o do
 *   ambiente pela distância ao centro do quarto. Fora de áudio ligado, não gasta nada;
 * - por evento (assinaturas do store): estática da TV no hover da zona de jogos e ao trocar de
 *   sub-vista dentro dela. Também replica `muted` do store no motor.
 * Só LÊ a câmera; quem a move é o `CameraRig`.
 */
export function AudioDirector() {
  const camera = useThree((s) => s.camera)

  // Mudo do store -> motor. `fireImmediately` aplica o estado inicial (mudo).
  useEffect(
    () =>
      useExperienceStore.subscribe((s) => s.muted, (muted) => audio.setMuted(muted), {
        fireImmediately: true,
      }),
    [],
  )

  // Estática da TV: hover na zona de jogos e troca de vista dentro dela.
  useEffect(() => {
    let lastAt = -Infinity
    const trigger = () => {
      const now = performance.now()
      if (now - lastAt < STATIC_COOLDOWN_MS) return
      lastAt = now
      audio.tvStatic(staticLevel(camera.position.distanceTo(TV)))
    }
    const stopHover = useExperienceStore.subscribe(
      (s) => s.hovered,
      (hovered) => {
        if (hovered === 'shelf') trigger()
      },
    )
    const stopView = useExperienceStore.subscribe(
      (s) => s.view,
      () => {
        const s = useExperienceStore.getState()
        // `setView` só vale em focused; a vista que muda ao ENTRAR (requestFocus) não conta.
        if (s.mode === 'focused' && s.focus === 'shelf') trigger()
      },
    )
    return () => {
      stopHover()
      stopView()
    }
  }, [camera])

  // Volumes por distância.
  useFrame((_, delta) => {
    if (!audio.audible) return
    const dt = Math.min(delta, MAX_DT)
    const p = camera.position
    probe.dPc = p.distanceTo(PC)
    probe.dRoom = p.distanceTo(ROOM_CENTER)
    probe.fanTarget = fanLevel(probe.dPc)
    probe.ambientTarget = ambientLevel(probe.dRoom)
    damp(levels, 'fan', probe.fanTarget, LEVEL_SMOOTH_TIME, dt)
    damp(levels, 'ambient', probe.ambientTarget, LEVEL_SMOOTH_TIME, dt)
    audio.setFanLevel(levels.fan)
    audio.setAmbientLevel(levels.ambient)
  })

  // Depuração só em dev.
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return
    window.__audio = {
      engine: audio,
      debug: () => ({ ...audio.getDebug(), levels: { ...levels }, probe: { ...probe } }),
      measure: async () => (await import('@/lib/audio/measure')).measureVoices(),
    }
    return () => {
      delete window.__audio
    }
  }, [])

  return null
}
