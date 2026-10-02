import { useEffect, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { AdaptiveDpr, PerformanceMonitor } from '@react-three/drei'
import {
  Bloom,
  DepthOfField,
  EffectComposer,
  Noise,
  Outline,
  SMAA,
  ToneMapping,
  Vignette,
} from '@react-three/postprocessing'
import { damp } from 'maath/easing'
import { BlendFunction, ToneMappingMode, type BloomEffect, type DepthOfFieldEffect } from 'postprocessing'
import { Vector3 } from 'three'
import { useExperienceStore, type Quality } from '@/store/useExperienceStore'
import { PRESETS } from '../camera/presets'
import { useRoomNodes, useRoomRegistry } from './baked/RoomContext'
import { useSceneMode } from './baked/useSceneMode'
import { HOTSPOT_OUTLINE_NODES } from './baked/zones'
import { LAYOUT } from './layout'

/**
 * Pós-processamento e qualidade (ARCHITECTURE §7, BACKLOG V.2).
 *
 * - `quality` (store): `high` = pós completo com DoF e dpr até 2; `medium` = sem DoF e dpr até 1.5;
 *   `low` = sem composer e dpr 1. O `PerformanceMonitor` desce/sobe o nível por fps medido; o dpr
 *   acompanha o nível (`AdaptiveDpr` cuida do resto se algo chamar `performance.regress()`).
 * - Cadeia do composer: Outline (hover) -> DoF (só em foco na cadeira) -> Bloom -> [ToneMapping só
 *   no grey-box] -> Vignette -> Noise -> SMAA. O quarto baked NÃO leva tone mapping: o AgX já está
 *   nas texturas. O EffectComposer desliga o `gl.toneMapping` do Canvas (ACES), então o grey-box,
 *   que dependia dele, recebe o mesmo ACES como efeito para continuar idêntico.
 * - Sem MSAA (`multisampling=0`): o antialias é do SMAA, mais barato junto do Bloom. O Outline exige
 *   `autoClear={false}` no composer.
 */

/** dpr por nível: [mín, máx] é limitado ao pixel ratio do monitor (nunca supersampla em tela 1x). */
const QUALITY_DPR: Record<Quality, [number, number]> = {
  high: [1, 2],
  medium: [1, 1.5],
  low: [1, 1],
}

const DEMOTE: Record<Quality, Quality> = { high: 'medium', medium: 'low', low: 'low' }
const PROMOTE: Record<Quality, Quality> = { low: 'medium', medium: 'high', high: 'high' }

/** Quantas vezes o monitor pode alternar subir/descer antes de parar de medir (evita ficar oscilando). */
const MAX_FLIPFLOPS = 4

/** Hotspot sem seleção: mesma referência sempre (o `Outline` só re-sincroniza quando a lista muda). */
const NO_NODES: readonly string[] = []

/**
 * Contorno do hover, claro e discreto. À noite soma luz (SCREEN, creme); de dia as paredes são
 * claras demais para isso, então o contorno vira uma linha índigo por alpha (ALPHA, "para contornos escuros").
 */
const OUTLINE_NIGHT = { color: '#fff1d6', blend: BlendFunction.SCREEN, strength: 2 }
const OUTLINE_DAY = { color: '#2d3270', blend: BlendFunction.ALPHA, strength: 2.5 }

/**
 * Limiar do Bloom (luminância linear). À noite 0.85: só os emissivos (cor x força até 1.6) passam;
 * de dia 1.05, acima de qualquer pixel do bake (<= 1), porque a mancha de sol no piso e as paredes
 * claras chegam perto de 1 e estourariam.
 */
const BLOOM_THRESHOLD_NIGHT = 0.85
const BLOOM_THRESHOLD_DAY = 1.05

/** Tempo (s) do bokeh aparecer e sumir; e quanto a DoF continua montada depois de sair do foco. */
const DOF_FADE_TIME = 0.35
const DOF_LINGER_MS = 700
/** Alcance (m) do foco da DoF: a cadeira (~1 m de profundidade) fica nítida e o fundo do quarto, não. */
const DOF_FOCUS_RANGE = 1.6
/** Ponto a manter em foco: o meio da cadeira. */
const CHAIR_FOCUS_POINT = new Vector3(LAYOUT.chair[0], LAYOUT.chair[1] + 0.7, LAYOUT.chair[2])

/** `PerformanceMonitor` + dpr por nível. Não renderiza nada. */
function QualityManager() {
  const quality = useExperienceStore((s) => s.quality)
  const setDpr = useThree((s) => s.setDpr)

  useEffect(() => {
    setDpr(QUALITY_DPR[quality])
  }, [quality, setDpr])

  return (
    <>
      <PerformanceMonitor
        flipflops={MAX_FLIPFLOPS}
        onDecline={() => {
          const s = useExperienceStore.getState()
          s.setQuality(DEMOTE[s.quality])
        }}
        onIncline={() => {
          const s = useExperienceStore.getState()
          s.setQuality(PROMOTE[s.quality])
        }}
      />
      <AdaptiveDpr pixelated />
    </>
  )
}

/**
 * DoF só com a câmera parada na cadeira (`focused` + `chair`, preset `chair.dof`). Monta ao começar
 * o voo (o compile do shader some no meio do movimento) e o bokeh só sobe quando `focused`; ao
 * sair, o bokeh desce e a DoF desmonta depois (sem pop). O foco acompanha a distância real
 * câmera -> cadeira (o enquadramento responsivo muda a pose por aspect).
 */
function ChairDepthOfField() {
  const effect = useRef<DepthOfFieldEffect>(null)
  const camera = useThree((s) => s.camera)
  const [state] = useState(() => ({ bokeh: 0 }))
  const { bokehScale } = PRESETS.chair.dof ?? { bokehScale: 3 }

  useFrame((_, delta) => {
    const dof = effect.current
    if (!dof) return
    const s = useExperienceStore.getState()
    const inFocus = s.mode === 'focused' && s.focus === 'chair'
    damp(state, 'bokeh', inFocus ? bokehScale : 0, DOF_FADE_TIME, Math.min(delta, 0.1))
    dof.bokehScale = state.bokeh
    dof.cocMaterial.focusDistance = camera.position.distanceTo(CHAIR_FOCUS_POINT)
  })

  return <DepthOfField ref={effect} focusRange={DOF_FOCUS_RANGE} bokehScale={0} resolutionScale={0.5} />
}

/** Bloom com limiar que acompanha o tema (o `uNightMix` já suavizado, publicado pelo BakedRoom). */
function ThemedBloom() {
  const bloom = useRef<BloomEffect>(null)
  const registry = useRoomRegistry()

  useFrame(() => {
    const effect = bloom.current
    if (!effect) return
    const night = registry.nightMix.current
    effect.luminanceMaterial.threshold = BLOOM_THRESHOLD_DAY + (BLOOM_THRESHOLD_NIGHT - BLOOM_THRESHOLD_DAY) * night
  })

  return <Bloom ref={bloom} mipmapBlur intensity={0.8} luminanceSmoothing={0.12} radius={0.75} levels={5} />
}

/** Câmera indo para a cadeira, parada nela, ou saindo dela (`lingering`). */
function useChairDofMounted(): boolean {
  const heading = useExperienceStore((s) => s.focus === 'chair' && (s.mode === 'focused' || s.mode === 'transitioning'))
  const [lingering, setLingering] = useState(false)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const unsubscribe = useExperienceStore.subscribe(
      (s) => s.focus === 'chair' && (s.mode === 'focused' || s.mode === 'transitioning'),
      (on) => {
        clearTimeout(timer)
        if (on) {
          setLingering(false)
        } else {
          setLingering(true)
          timer = setTimeout(() => setLingering(false), DOF_LINGER_MS)
        }
      },
    )
    return () => {
      unsubscribe()
      clearTimeout(timer)
    }
  }, [])

  return heading || lingering
}

interface ComposerProps {
  /** Grey-box: o composer tem de refazer o ACES que o Canvas aplicava (e o baked não leva tone mapping). */
  greybox: boolean
  /** `quality === 'high'`. */
  withDof: boolean
}

function Composer({ greybox, withDof }: ComposerProps) {
  const dofMounted = useChairDofMounted()
  const outline = useExperienceStore((s) => (s.theme === 'night' ? OUTLINE_NIGHT : OUTLINE_DAY))

  // Contorno: só no hover em idle. `hovered` já é sempre null fora de idle (guarda 3), mas o `mode`
  // entra por clareza. No grey-box não há nós do glb: a lista fica vazia e nada é contornado.
  const outlined = useExperienceStore((s) => (s.mode === 'idle' && s.hovered ? s.hovered : null))
  const selection = useRoomNodes(outlined ? HOTSPOT_OUTLINE_NODES[outlined] : NO_NODES)

  return (
    <EffectComposer multisampling={0} autoClear={false}>
      <Outline
        selection={selection}
        visibleEdgeColor={outline.color}
        hiddenEdgeColor={outline.color}
        edgeStrength={outline.strength}
        blur={false}
        xRay={false}
        blendFunction={outline.blend}
      />
      {withDof && dofMounted ? <ChairDepthOfField /> : null}
      <ThemedBloom />
      {greybox ? <ToneMapping mode={ToneMappingMode.ACES_FILMIC} /> : null}
      <Vignette eskil={false} offset={0.3} darkness={0.5} />
      <Noise blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.08} />
      <SMAA />
    </EffectComposer>
  )
}

export function Effects() {
  const quality = useExperienceStore((s) => s.quality)
  const greybox = useSceneMode() === 'greybox'

  return (
    <>
      <QualityManager />
      {quality === 'low' ? null : <Composer greybox={greybox} withDof={quality === 'high'} />}
    </>
  )
}
