/**
 * Ângulos dos ponteiros do relógio de parede (BACKLOG V.3). Puro (sem three nem React): os testes em
 * `__tests__/life.test.ts` o rodam com o Node. Ângulos em radianos, medidos no sentido HORÁRIO a
 * partir das 12 horas (o relógio converte para a rotação de cada nó).
 */

export const TWO_PI = Math.PI * 2
const DEG = Math.PI / 180

/** Quanto o ponteiro dos segundos passa do ponto no tique, a rapidez com que assenta e o balanço. */
export const TICK_OVERSHOOT = 2.6 * DEG
const TICK_DECAY = 11
const TICK_WOBBLE = 26

export interface HandAngles {
  hour: number
  minute: number
  second: number
}

/**
 * `nowMs` = `Date.now()`; `offsetMs` = `getTimezoneOffset() * 60_000` (UTC menos local). O ponteiro
 * das horas e o dos minutos andam contínuos; o dos segundos dá "tique": salta para o segundo novo,
 * passa um pouco do ponto (`TICK_OVERSHOOT`) e assenta em ~0.3 s.
 */
export function handAngles(nowMs: number, offsetMs: number, out: HandAngles = { hour: 0, minute: 0, second: 0 }): HandAngles {
  const local = nowMs - offsetMs
  const secondOfDay = (((local / 1000) % 86_400) + 86_400) % 86_400
  const wholeSecond = Math.floor(secondOfDay)
  const fraction = secondOfDay - wholeSecond

  const seconds = wholeSecond % 60
  const minutes = (wholeSecond / 60) % 60
  const hours = (wholeSecond / 3600) % 12

  out.hour = (hours / 12) * TWO_PI
  out.minute = (minutes / 60) * TWO_PI
  const overshoot = TICK_OVERSHOOT * Math.exp(-TICK_DECAY * fraction) * Math.cos(TICK_WOBBLE * fraction)
  out.second = (seconds / 60) * TWO_PI + overshoot
  return out
}
