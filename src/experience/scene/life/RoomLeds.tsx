import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { damp } from 'maath/easing'
import type { Mesh, MeshBasicMaterial, Object3D } from 'three'
import type { HotspotId } from '@/content/types'
import { useExperienceStore } from '@/store/useExperienceStore'
import { useRoomNodes } from '../baked/RoomContext'
import type { EmissiveData } from '../baked/roomNodes'
import { resolveInteraction } from './hotspotActivity'
import { useReducedMotionRef } from './useReducedMotion'

/**
 * LEDs e ventoinhas do quarto (BACKLOG V.3). Cada emissivo do glb tem um `MeshBasicMaterial` com
 * `userData: EmissiveData`; aqui só o `gain` muda (o `BakedRoom` reescreve a `color` todo frame a
 * partir dele e do tema). Cada nó pulsa com fase própria (como o `GoogleLeds` de Bruno Simon). Com o
 * hotspot da zona em hover/foco, o pulso fica mais forte e as ventoinhas aceleram.
 *
 * Os eixos das ventoinhas (`pc_fan_top`, `pc_fan_bottom`) vêm do bbox do glb: discos de 0.13 m com a
 * espessura em Z local (±0.013), pivô no centro; o vidro do PC olha para +Z, então giram em Z.
 */

interface LedSpec {
  node: string
  /** Hotspot cuja interação reforça o pulso (hover/foco). */
  zone?: HotspotId
  /** Amplitude do pulso em repouso (fração do brilho). */
  amplitude: number
  /** Frequência (Hz). */
  hz: number
  /** Ligado em oposição de fase ao vizinho (cidade da janela: a luz "pisca" de leve). */
  invert?: boolean
}

const LED_SPECS: readonly LedSpec[] = [
  // Mesa e PC.
  { node: 'pc_rgb', zone: 'desk', amplitude: 0.26, hz: 0.5 },
  { node: 'led_case', zone: 'desk', amplitude: 0.34, hz: 0.85 },
  { node: 'pc_fan_top', zone: 'desk', amplitude: 0.2, hz: 0.45 },
  { node: 'pc_fan_bottom', zone: 'desk', amplitude: 0.2, hz: 0.38 },
  { node: 'emit_lightbar', zone: 'desk', amplitude: 0.04, hz: 0.2 },
  { node: 'emit_ledshelf', zone: 'desk', amplitude: 0.14, hz: 0.4 },
  // Zona de jogos.
  { node: 'tv_backlight', zone: 'shelf', amplitude: 0.16, hz: 0.35 },
  { node: 'led_console', zone: 'shelf', amplitude: 0.34, hz: 0.75 },
  { node: 'emit_shelf_led', zone: 'shelf', amplitude: 0.12, hz: 0.3 },
  // Maker.
  { node: 'emit_maker_light', zone: 'printer', amplitude: 0.08, hz: 0.25 },
  // Quarto.
  { node: 'emit_fairy', amplitude: 0.2, hz: 0.6 },
  { node: 'emit_ac_led', amplitude: 0.5, hz: 0.22 },
  { node: 'emit_window_city', amplitude: 0.05, hz: 0.17 },
  { node: 'emit_window_city_cool', amplitude: 0.05, hz: 0.17, invert: true },
]

const LED_NAMES: readonly string[] = LED_SPECS.map((s) => s.node)

/** Ventoinhas do gabinete: velocidade de repouso e com a mesa em hover/foco (rad/s). */
const FANS = [
  { node: 'pc_fan_top', idle: 3.6, boosted: 11, direction: 1 },
  { node: 'pc_fan_bottom', idle: 3.1, boosted: 9.5, direction: 1 },
] as const
const FAN_NAMES: readonly string[] = FANS.map((f) => f.node)
const FAN_SMOOTH = 0.7

/** Quão forte o pulso fica com o hotspot ativo (multiplica a amplitude) e quanto o brilho sobe. */
const ACTIVE_AMPLITUDE_GAIN = 1.4
const ACTIVE_BRIGHTNESS = 0.14
const ZONE_SMOOTH = 0.45
/** Limites do `gain`: o LED nunca apaga de vez nem estoura o Bloom. */
const MIN_GAIN = 0.3
const MAX_GAIN = 1.6

interface Led {
  data: EmissiveData
  spec: LedSpec
  phase: number
}

interface ZoneActivity {
  desk: number
  shelf: number
  printer: number
}

interface FanRuntime {
  node: Object3D
  spec: (typeof FANS)[number]
  speed: number
}

/** Fase estável por nó: índice espalhado pela razão áurea (sem dois LEDs em sincronia). */
const GOLDEN_ANGLE = 2.399963

function emissiveDataOf(node: Object3D): EmissiveData | null {
  const material = (node as Mesh).material as MeshBasicMaterial | undefined
  const data = material?.userData as Partial<EmissiveData> | undefined
  return data && typeof data.gain === 'number' ? (data as EmissiveData) : null
}

/** Escreve o `gain` de cada LED (helper de módulo; ver nota de imutabilidade em BakedRoom). */
function applyLedGains(leds: readonly Led[], time: number, zones: ZoneActivity, still: boolean) {
  for (const led of leds) {
    if (still) {
      led.data.gain = 1
      continue
    }
    const zone = led.spec.zone ? zones[led.spec.zone as keyof ZoneActivity] : 0
    const amplitude = led.spec.amplitude * (1 + ACTIVE_AMPLITUDE_GAIN * zone)
    const wave = Math.sin(time * led.spec.hz * Math.PI * 2 + led.phase) * (led.spec.invert ? -1 : 1)
    const gain = 1 + ACTIVE_BRIGHTNESS * zone + amplitude * wave
    led.data.gain = Math.min(MAX_GAIN, Math.max(MIN_GAIN, gain))
  }
}

function spinFans(fans: readonly FanRuntime[], dt: number) {
  for (const fan of fans) fan.node.rotation.z += fan.speed * dt
}

export function RoomLeds() {
  const ledNodes = useRoomNodes(LED_NAMES)
  const fanNodes = useRoomNodes(FAN_NAMES)
  const reduced = useReducedMotionRef()

  const leds = useMemo<Led[]>(
    () =>
      ledNodes.flatMap((node, index) => {
        const data = emissiveDataOf(node)
        const spec = LED_SPECS.find((s) => s.node === node.name)
        return data && spec ? [{ data, spec, phase: index * GOLDEN_ANGLE }] : []
      }),
    [ledNodes],
  )

  const fans = useMemo<FanRuntime[]>(
    () =>
      fanNodes.flatMap((node) => {
        const spec = FANS.find((f) => f.node === node.name)
        return spec ? [{ node, spec, speed: 0 }] : []
      }),
    [fanNodes],
  )

  const zonesRef = useRef<ZoneActivity>({ desk: 0, shelf: 0, printer: 0 })
  const frozenRef = useRef<Record<HotspotId, boolean>>({ chair: false, desk: false, printer: false, shelf: false })

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1)
    const s = useExperienceStore.getState()
    const still = reduced.current
    const zones = zonesRef.current
    const frozen = frozenRef.current

    // Alvo de cada zona (congelado em `transitioning`) e o damp até ele.
    frozen.desk = resolveInteraction(s, 'desk', frozen.desk)
    frozen.shelf = resolveInteraction(s, 'shelf', frozen.shelf)
    frozen.printer = resolveInteraction(s, 'printer', frozen.printer)
    damp(zones, 'desk', frozen.desk && !still ? 1 : 0, ZONE_SMOOTH, dt)
    damp(zones, 'shelf', frozen.shelf && !still ? 1 : 0, ZONE_SMOOTH, dt)
    damp(zones, 'printer', frozen.printer && !still ? 1 : 0, ZONE_SMOOTH, dt)

    applyLedGains(leds, state.clock.elapsedTime, zones, still)

    // Ventoinhas: giram sempre (idle do quarto), mais rápido com a mesa ativa; paradas em reduced-motion.
    for (const fan of fans) {
      const { spec } = fan
      const target = still ? 0 : (spec.idle + (spec.boosted - spec.idle) * zones.desk) * spec.direction
      damp(fan, 'speed', target, FAN_SMOOTH, dt)
    }
    spinFans(fans, dt)
  })

  return null
}
