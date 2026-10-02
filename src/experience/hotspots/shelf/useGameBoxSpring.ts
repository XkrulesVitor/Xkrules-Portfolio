import { useEffect, useMemo, useRef, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { SpringValue } from '@react-spring/three'
import type { Object3D } from 'three'
import { useExperienceStore } from '@/store/useExperienceStore'
import { interactionTarget } from '../../scene/life/hotspotActivity'
import { useReducedMotionRef } from '../../scene/life/useReducedMotion'
import { BOX_HIGHLIGHT_OFFSET, BOX_HOVER_OFFSET, GAME_BOX_NODES } from './gameBoxNodes'
import type { GameSlug } from '@/content/types'

/** Mola das caixas: assenta rápido, com um leve repique (menos elástica que a cadeira). */
const BOX_SPRING = { tension: 210, friction: 15 } as const

type BoxTarget = Object3D | RefObject<Object3D | null> | null

function resolve(target: BoxTarget): Object3D | null {
  if (!target) return null
  return 'current' in target ? target.current : target
}

/** Posição de repouso, capturada na primeira vez que o nó aparece. */
interface Rest {
  node: Object3D
  x: number
  y: number
  z: number
}

function captureRest(node: Object3D): Rest {
  return { node, x: node.position.x, y: node.position.y, z: node.position.z }
}

function moveAlong(rest: Rest, front: readonly [number, number, number], offset: number) {
  rest.node.position.set(rest.x + front[0] * offset, rest.y + front[1] * offset, rest.z + front[2] * offset)
}

function restore(rest: Rest) {
  rest.node.position.set(rest.x, rest.y, rest.z)
}

/**
 * Quanto a caixa deve estar projetada: `null` durante `transitioning` (congelado, ver
 * `hotspotActivity.ts`), 0 em repouso, `BOX_HOVER_OFFSET` com a zona de jogos em hover/foco e
 * `BOX_HIGHLIGHT_OFFSET` na caixa que o painel destaca (`store.highlightBox`).
 */
function boxOffset(slug: GameSlug): number | null {
  const s = useExperienceStore.getState()
  const target = interactionTarget(s, 'shelf')
  if (target === null) return null
  if (!target) return 0
  return s.highlightBox === slug ? BOX_HIGHLIGHT_OFFSET : BOX_HOVER_OFFSET
}

/**
 * Spring que projeta a caixa do jogo para fora da prateleira, na direção da frente dela
 * (ARCHITECTURE §6.4). `target` é o nó `box_<slug>` do glb (baked) ou o mesh do `GameBox` (grey-box).
 * Lê o store por frame (sem re-render): só reage ao `highlightBox` e ao hover/foco da zona, e não
 * se mexe durante `transitioning`. `prefers-reduced-motion`: troca imediata, sem repique.
 */
export function useGameBoxSpring(slug: GameSlug, target: BoxTarget): void {
  const reduced = useReducedMotionRef()
  const spring = useMemo(() => new SpringValue(0, { config: BOX_SPRING }), [])
  const rest = useRef<Rest | null>(null)
  const lastOffset = useRef(0)

  useEffect(
    () => () => {
      spring.stop()
      if (rest.current) restore(rest.current)
      rest.current = null
    },
    [spring],
  )

  useFrame(() => {
    const node = resolve(target)
    if (!node) return
    if (rest.current?.node !== node) rest.current = captureRest(node)

    const wanted = boxOffset(slug)
    if (wanted !== null && wanted !== lastOffset.current) {
      lastOffset.current = wanted
      void spring.start({ to: wanted, immediate: reduced.current })
    }
    moveAlong(rest.current, GAME_BOX_NODES[slug].front, spring.get())
  })
}
