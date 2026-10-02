import { useEffect, useMemo, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { SpringValue } from '@react-spring/three'
import type { Object3D } from 'three'
import { useInteractionEffect } from '../../scene/life/useInteractionEffect'
import { useReducedMotionRef } from '../../scene/life/useReducedMotion'

/** Giro do hover (ARCHITECTURE §6.1): ~190°, um pouco além de meia volta, e a mola assenta. */
export const CHAIR_SPIN = Math.PI * 1.05
/** Mola elástica da cadeira (tension/friction da ARCHITECTURE §6.1). */
const CHAIR_SPRING = { tension: 120, friction: 14 } as const
/** Balanço ocioso: bem mais contido que o `TopChair` de Bruno Simon (0.5 rad). */
const SWAY_AMPLITUDE = 0.08
const SWAY_SPEED = 0.55

type ChairTarget = Object3D | RefObject<Object3D | null> | null

function resolve(target: ChairTarget): Object3D | null {
  if (!target) return null
  return 'current' in target ? target.current : target
}

/** Escreve a rotação no nó (helper de módulo: o lint de imutabilidade não deixa mexer no nó dentro do componente). */
function setChairRotation(node: Object3D, spin: number, sway: number) {
  node.rotation.y = spin + sway
}

/**
 * Giro elástico da cadeira no hover (e no foco), somado a um balanço idle `sin(t)`.
 * `target` é o nó `chair_root` do glb (baked) ou o grupo do placeholder (grey-box); o pivô de ambos
 * está no centro da base e o giro é em torno de Y, com o encosto em +X e o assento voltado para -X.
 *
 * O alvo do giro vem de `useInteractionEffect`: não muda durante `transitioning`. Em
 * `prefers-reduced-motion` o giro vira troca imediata e o balanço some.
 */
export function useChairSpring(target: ChairTarget): void {
  const reduced = useReducedMotionRef()
  const spin = useMemo(() => new SpringValue(0, { config: CHAIR_SPRING }), [])

  useEffect(() => () => void spin.stop(), [spin])

  useInteractionEffect('chair', (active) => {
    void spin.start({ to: active ? CHAIR_SPIN : 0, immediate: reduced.current })
  })

  useFrame((state) => {
    const node = resolve(target)
    if (!node) return
    const sway = reduced.current ? 0 : Math.sin(state.clock.elapsedTime * SWAY_SPEED) * SWAY_AMPLITUDE
    setChairRotation(node, spin.get(), sway)
  })
}
