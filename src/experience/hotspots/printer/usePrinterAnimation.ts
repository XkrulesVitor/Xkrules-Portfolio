import { useEffect, useRef, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { damp } from 'maath/easing'
import { Box3, Vector3, type MeshBasicMaterial, type Object3D } from 'three'
import { useExperienceStore } from '@/store/useExperienceStore'
import { useRoomRegistry } from '../../scene/baked/RoomContext'
import type { EmissiveData } from '../../scene/baked/roomNodes'
import { isFocused, resolveInteraction } from '../../scene/life/hotspotActivity'
import { useReducedMotionRef } from '../../scene/life/useReducedMotion'

/**
 * Animação da impressora (ARCHITECTURE §6.3). Nós do glb (ASSET_PIPELINE §4) ou do placeholder:
 *
 * - `printer_axisZ`: a barra horizontal da impressora (eixo X, 0.82 m); SOBE e DESCE (é o "eixo Z"
 *   da impressora) acompanhando a altura da peça. Descoberto pelo bbox: x ±0.41, y -0.05..0.09.
 * - `printer_head`: filho do `printer_axisZ`, em (0, 0, 0.1); varre a barra em X. O bico fica em
 *   y = -0.125 e z = 0 do próprio nó (bbox y -0.125..0.105).
 * - `printer_bed`: a mesa (0.6 x 0.6) anda em Z, em direção ao bico (eixo Y da impressora).
 * - `printer_part`: a peça (pirâmide de 0.25 m), origem na base; a escala em Y é o progresso.
 *   Como fica em cima da mesa, acompanha o deslocamento dela.
 * - `printer_led`: LED do painel (emissivo; só o `gain`).
 *
 * Nada aqui usa estado do React no frame: refs e `damp`. Alturas e deslocamentos saem dos bounding
 * boxes dos próprios nós (no repouso), por isso a mesma lógica vale para o glb e para o placeholder.
 */

/** Altura mínima da peça ao (re)começar a imprimir, como fração da altura final. */
const PART_MIN = 0.2
/** Tempo (s) que a peça leva para "zerar" quando o foco chega, e depois para crescer até o fim. */
const PART_RESET_TIME = 0.55
const PART_RESET_SMOOTH = 0.25
const PART_GROW_SMOOTH = 3.2
const PART_RELEASE_SMOOTH = 0.9
/** Folga (m) do bico acima do topo da peça. */
const NOZZLE_CLEARANCE = 0.012
/** Alcance da varredura da cabeça (m) e margem até as pontas da barra. */
const HEAD_SWEEP = 0.17
const HEAD_MARGIN = 0.03
/** Vai-e-vem extra da mesa durante a impressão (m). */
const BED_WOBBLE = 0.03
const ACTIVITY_SMOOTH = 0.6

interface PrinterNodes {
  axisZ: Object3D
  head: Object3D
  bed: Object3D
  part: Object3D
  /** Opcional: só o glb tem LED emissivo próprio. */
  led: Object3D | null
}

interface PrinterRig {
  nodes: PrinterNodes
  /** Repouso (posições locais) */
  axisY: number
  headX: number
  bedZ: number
  partZ: number
  /** Altura da peça (m) com escala 1 e Y do mundo da base dela. */
  partHeight: number
  partBaseY: number
  /** Y do mundo da ponta do bico no repouso. */
  tipY: number
  /** Quanto a mesa precisa andar em Z para a peça ficar sob o bico. */
  bedShift: number
  /** Meia amplitude da varredura em X. */
  sweep: number
}

interface PrinterAnim {
  /** 0..1: quanto a "impressão" está ligada (hover ou foco). */
  activity: number
  /** Escala Y da peça (1 = peça pronta, como no bake). */
  part: number
  /** Há quanto tempo (s) a câmera está parada na impressora. */
  focusedFor: number
}

type FindNode = (name: string) => Object3D | null

const box = new Box3()
const size = new Vector3()
const tmp = new Vector3()

/** Monta o rig medindo os nós no repouso. `null` se faltar algum nó obrigatório. */
function buildRig(find: FindNode): PrinterRig | null {
  const axisZ = find('printer_axisZ')
  const head = find('printer_head')
  const bed = find('printer_bed')
  const part = find('printer_part')
  if (!axisZ || !head || !bed || !part) return null

  axisZ.updateWorldMatrix(true, true)
  part.updateWorldMatrix(true, true)
  const partBox = box.setFromObject(part)
  const partBaseY = partBox.min.y
  const partHeight = partBox.getSize(size).y
  const partWorld = part.getWorldPosition(tmp)
  const partZ = partWorld.z

  const headTipY = box.setFromObject(head).min.y
  const headWorld = head.getWorldPosition(tmp)
  const bedShift = headWorld.z - partZ

  const axisBox = box.setFromObject(axisZ)
  const axisHalf = axisBox.getSize(size).x / 2
  const headHalf = box.setFromObject(head).getSize(size).x / 2

  return {
    nodes: { axisZ, head, bed, part, led: find('printer_led') },
    axisY: axisZ.position.y,
    headX: head.position.x,
    bedZ: bed.position.z,
    partZ: part.position.z,
    partHeight,
    partBaseY,
    tipY: headTipY,
    bedShift,
    sweep: Math.min(HEAD_SWEEP, Math.max(0, axisHalf - headHalf - HEAD_MARGIN)),
  }
}

/** Escreve a pose da impressora (helper de módulo; ver nota de imutabilidade em BakedRoom). */
function applyPose(rig: PrinterRig, anim: PrinterAnim, time: number) {
  const { nodes } = rig
  const a = anim.activity

  // O bico desce até o topo da peça (que cresce) e volta ao repouso quando desliga.
  const topY = rig.partBaseY + rig.partHeight * anim.part + NOZZLE_CLEARANCE
  const gantryDy = (topY - rig.tipY) * a
  nodes.axisZ.position.y = rig.axisY + gantryDy

  nodes.head.position.x = rig.headX + Math.sin(time * 1.9) * rig.sweep * a

  const bedDz = (rig.bedShift + Math.sin(time * 0.95 + 0.6) * BED_WOBBLE) * a
  nodes.bed.position.z = rig.bedZ + bedDz
  nodes.part.position.z = rig.partZ + bedDz
  nodes.part.scale.y = anim.part
}

/** LED do painel: respira em repouso e pisca rápido imprimindo. Só mexe no `gain` do emissivo. */
function applyLed(led: Object3D | null, time: number, activity: number, reduced: boolean) {
  if (!led) return
  const material = (led as { material?: MeshBasicMaterial }).material
  const data = material?.userData as Partial<EmissiveData> | undefined
  if (!data || typeof data.gain !== 'number') return // grey-box: material compartilhado, sem EmissiveData
  if (reduced) {
    data.gain = 1
    return
  }
  const standby = 0.78 + 0.22 * Math.sin(time * 1.4)
  const blink = Math.sin(time * 14) > 0 ? 1 : 0.12
  data.gain = standby + (blink - standby) * activity
}

function restoreRig(rig: PrinterRig) {
  const { nodes } = rig
  nodes.axisZ.position.y = rig.axisY
  nodes.head.position.x = rig.headX
  nodes.bed.position.z = rig.bedZ
  nodes.part.position.z = rig.partZ
  nodes.part.scale.y = 1
  const data = (nodes.led as { material?: MeshBasicMaterial } | null)?.material?.userData as
    | Partial<EmissiveData>
    | undefined
  if (data && typeof data.gain === 'number') data.gain = 1
}

/**
 * Liga a animação da impressora. `baked`: os nós vêm do registro do glb; senão, são buscados por
 * nome dentro de `group` (o placeholder). A resolução é preguiçosa (no frame) para não criar estado.
 *
 * Alvo de "imprimindo": hover ou foco, congelado em `transitioning` (ver `hotspotActivity.ts`). A peça
 * "reinicia" (volta a 20%) quando a câmera para na impressora e cresce até a altura final; ao sair
 * do foco ela termina de assentar em 100%, como no bake. `prefers-reduced-motion`: pose de repouso.
 */
export function usePrinterAnimation(baked: boolean, group: RefObject<Object3D | null>): void {
  const registry = useRoomRegistry()
  const reduced = useReducedMotionRef()
  const rig = useRef<PrinterRig | null>(null)
  const animRef = useRef<PrinterAnim>({ activity: 0, part: 1, focusedFor: 0 })
  const wanted = useRef(false)

  useEffect(
    () => () => {
      if (rig.current) restoreRig(rig.current)
      rig.current = null
    },
    [],
  )

  useFrame((state, delta) => {
    if (!rig.current) {
      const find: FindNode = baked
        ? (name) => registry.getNodes()?.get(name) ?? null
        : (name) => group.current?.getObjectByName(name) ?? null
      rig.current = buildRig(find)
      if (!rig.current) return
    }

    const dt = Math.min(delta, 0.1)
    const anim = animRef.current
    const s = useExperienceStore.getState()
    const noMotion = reduced.current

    wanted.current = resolveInteraction(s, 'printer', wanted.current)
    const focused = !noMotion && isFocused(s, 'printer')
    anim.focusedFor = focused ? anim.focusedFor + dt : 0

    damp(anim, 'activity', wanted.current && !noMotion ? 1 : 0, ACTIVITY_SMOOTH, dt)

    const resetting = focused && anim.focusedFor < PART_RESET_TIME
    const partTarget = resetting ? PART_MIN : 1
    const partSmooth = focused ? (resetting ? PART_RESET_SMOOTH : PART_GROW_SMOOTH) : PART_RELEASE_SMOOTH
    damp(anim, 'part', partTarget, partSmooth, dt)

    applyPose(rig.current, anim, state.clock.elapsedTime)
    applyLed(rig.current.nodes.led, state.clock.elapsedTime, anim.activity, noMotion)
  })
}
