import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Object3D } from 'three'
import { useRoomNode } from '../baked/RoomContext'
import { handAngles, type HandAngles } from './clockMath'

/**
 * Relógio de parede com a hora real do usuário (nós `clock_hour`, `clock_minute`, `clock_second`).
 *
 * Eixos (descobertos pelos bounding boxes do glb): os três ponteiros têm o pivô no centro do relógio
 * (0.7, 2.93), apontam para +Y local (12 horas) e têm a espessura em Z; o relógio fica na parede do
 * fundo olhando para +Z. Visto de frente (+X à direita), o sentido horário é a rotação NEGATIVA em Z.
 *
 * O ponteiro dos segundos dá "tique": salta para o segundo novo, passa um pouco do ponto e assenta.
 * O relógio NÃO para com `prefers-reduced-motion` (é informação, não efeito).
 */

const angles: HandAngles = { hour: 0, minute: 0, second: 0 }

/** Escreve os três ângulos (helper de módulo; ver nota de imutabilidade em BakedRoom). */
function setHands(hour: Object3D, minute: Object3D, second: Object3D, nowMs: number, offsetMs: number) {
  handAngles(nowMs, offsetMs, angles)
  // Sentido horário visto de frente (+Z) = rotação NEGATIVA em Z.
  hour.rotation.z = -angles.hour
  minute.rotation.z = -angles.minute
  second.rotation.z = -angles.second
}

/** Diferença (ms) entre UTC e a hora local, para somar à `Date.now()` sem alocar `Date` por frame. */
function localOffsetMs(): number {
  return new Date().getTimezoneOffset() * 60_000
}

export function RoomClock() {
  const hour = useRoomNode('clock_hour')
  const minute = useRoomNode('clock_minute')
  const second = useRoomNode('clock_second')
  // O fuso pode mudar (horário de verão, viagem com a aba aberta): reavalia uma vez por minuto.
  const offset = useRef(localOffsetMs())

  useEffect(() => {
    offset.current = localOffsetMs()
    const id = window.setInterval(() => {
      offset.current = localOffsetMs()
    }, 60_000)
    return () => window.clearInterval(id)
  }, [])

  useFrame(() => {
    if (!hour || !minute || !second) return
    setHands(hour, minute, second, Date.now(), offset.current)
  })

  return null
}
