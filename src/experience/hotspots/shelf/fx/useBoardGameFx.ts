import { useEffect, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type { Object3D } from 'three'
import { resolveView } from '@/content/hotspots'
import type { GameSlug } from '@/content/types'
import { useExperienceStore, type ExperienceState } from '@/store/useExperienceStore'
import { useRoomNode, useRoomRegistry } from '../../../scene/baked/RoomContext'
import { useReducedMotionRef } from '../../../scene/life/useReducedMotion'
import { BOX_HIGHLIGHT_OFFSET, GAME_BOX_NODES } from '../gameBoxNodes'
import { LAYOUT } from '../../../scene/layout'
import { easeOutCubic } from './fxTimeline'

/**
 * Gatilho e relógio dos efeitos das caixas de board game. Quando `store.highlightBox` PASSA a ser o
 * `slug` (hover/foco no cartão do painel), o efeito começa e roda `duration` segundos:
 *  - toca uma vez por destaque: um novo destaque que chegue com o efeito rodando é ignorado, e um
 *    destaque depois do fim toca de novo;
 *  - o efeito termina mesmo que o destaque saia no meio; só é cortado (some em ~0.2 s) se a câmera
 *    deixar a vista Tabuleiro (voltar para HOME, trocar de aba);
 *  - com `prefers-reduced-motion` nunca começa;
 *  - o relógio avança por `delta` (limitado), sem `setState`: tudo é ref/objeto mutável.
 */

/** Quadros longos (aba em segundo plano) não podem pular o efeito inteiro. */
const MAX_DELTA = 0.05
/** Tempo (s) do corte quando a câmera sai da vista Tabuleiro. */
const CUT_TIME = 0.2

/** Repouso do centro das caixas (mesmas contas do `Shelf.tsx` e de `art/blender/props/games.py`). */
const [SX, SY, SZ] = LAYOUT.shelf
const BOARD_CENTER_Y = SY + 0.705 + 0.36 / 2
export const BOX_REST = {
  aldeia_dorme: [SX - 0.62, BOARD_CENTER_Y, SZ + 0.08],
  conquista_galactica: [SX - 0.24, BOARD_CENTER_Y, SZ + 0.08],
} as const satisfies Partial<Record<GameSlug, readonly [number, number, number]>>

export type FxSlug = keyof typeof BOX_REST

export interface FxFrame {
  /** Segundos desde o destaque. */
  time: number
  /** Passo deste quadro (já limitado). */
  dt: number
  /** 1 = pleno; desce a 0 quando a câmera sai da vista (corte). */
  fade: number
  /** Mistura noite/dia atual: 1 = noite, 0 = dia. */
  night: number
  /** Quanto a caixa já saiu da prateleira (m, em +Z) em relação ao repouso. */
  boxDz: number
}

export interface FxHandlers {
  /** Começou (o grupo ainda está escondido: ligue o que precisar). */
  onStart: () => void
  /** Cada quadro enquanto roda. */
  onFrame: (frame: FxFrame) => void
  /** Terminou ou foi cortado: esconda tudo. */
  onEnd: () => void
}

interface Run {
  active: boolean
  time: number
  fade: number
  box: Object3D | null
}

function createRun(): Run {
  return { active: false, time: 0, fade: 1, box: null }
}

function beginRun(run: Run, box: Object3D | null): void {
  run.active = true
  run.time = 0
  run.fade = 1
  run.box = box
}

function endRun(run: Run): void {
  run.active = false
  run.box = null
}

function stepRun(run: Run, dt: number, inZone: boolean): void {
  run.time += dt
  if (!inZone) run.fade = Math.max(0, run.fade - dt / CUT_TIME)
}

function createFrame(): FxFrame {
  return { time: 0, dt: 0, fade: 1, night: 1, boxDz: 0 }
}

function fillFrame(frame: FxFrame, run: Run, dt: number, night: number, restZ: number): void {
  frame.time = run.time
  frame.dt = dt
  frame.fade = run.fade
  frame.night = night
  frame.boxDz = boxOffset(run, restZ)
}

/** A câmera está na vista Tabuleiro da zona de jogos (a única em que o `highlightBox` dessas caixas aparece). */
export function inBoardView(s: Pick<ExperienceState, 'mode' | 'focus' | 'view'>): boolean {
  return s.mode === 'focused' && s.focus === 'shelf' && resolveView('shelf', s.view)?.id !== 'digital'
}

/**
 * Deslocamento da caixa em Z: lido do nó vivo (glb) ou do mesh do grey-box, que o spring move. Se
 * o nó não existe, assume a subida típica do destaque.
 */
function boxOffset(run: Run, restZ: number): number {
  if (run.box) {
    const dz = run.box.position.z - restZ
    if (Math.abs(dz) < 0.5) return dz
  }
  return BOX_HIGHLIGHT_OFFSET * easeOutCubic(run.time / 0.4)
}

export function useBoardGameFx(slug: FxSlug, duration: number, handlers: FxHandlers): void {
  const reduced = useReducedMotionRef()
  const registry = useRoomRegistry()
  const scene = useThree((s) => s.scene)
  // Baked: o nó `box_<slug>` do glb. Grey-box: `useRoomNode` devolve null e o mesh do `GameBox` é achado por nome.
  const bakedBox = useRoomNode(GAME_BOX_NODES[slug].node)
  const [run] = useState(createRun)
  const [frame] = useState(createFrame)
  const handlersRef = useRef(handlers)
  const restZ = BOX_REST[slug][2]

  useEffect(() => {
    handlersRef.current = handlers
  })

  useEffect(
    () =>
      useExperienceStore.subscribe(
        (s) => s.highlightBox,
        (next, previous) => {
          if (next !== slug || previous === slug) return
          if (reduced.current || run.active) return
          beginRun(run, bakedBox ?? scene.getObjectByName(GAME_BOX_NODES[slug].node) ?? null)
          handlersRef.current.onStart()
        },
      ),
    [slug, bakedBox, scene, reduced, run],
  )

  useEffect(
    () => () => {
      // Desmontou no meio do efeito: sem mais quadros, só solta o nó.
      endRun(run)
    },
    [run],
  )

  useFrame((_, delta) => {
    if (!run.active) return
    const dt = Math.min(delta, MAX_DELTA)
    stepRun(run, dt, inBoardView(useExperienceStore.getState()))
    if (run.time >= duration || run.fade <= 0) {
      endRun(run)
      handlersRef.current.onEnd()
      return
    }
    fillFrame(frame, run, dt, registry.nightMix.current, restZ)
    handlersRef.current.onFrame(frame)
  })
}
