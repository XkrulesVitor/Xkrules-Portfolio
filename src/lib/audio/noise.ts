// Geradores de ruído para o motor de áudio sintetizado. Módulo FOLHA (sem imports locais), para o
// `node --test` conseguir importá-lo direto. Os preenchimentos aceitam um `random` injetável, o que
// torna os testes determinísticos.

export type Random = () => number

/** Ruído branco uniforme em [-1, 1]. Já é periódico: serve como loop sem emenda. */
export function fillWhite(out: Float32Array, random: Random = Math.random): void {
  for (let i = 0; i < out.length; i++) out[i] = random() * 2 - 1
}

/** Raiz da média dos quadrados (nível "médio" do sinal). */
export function rms(data: Float32Array): number {
  if (data.length === 0) return 0
  let sum = 0
  for (let i = 0; i < data.length; i++) sum += data[i] * data[i]
  return Math.sqrt(sum / data.length)
}

/** Menor trecho do início/fim de um loop que é misturado para esconder a emenda. */
const LOOP_FADE_SAMPLES = 4096

/**
 * Ruído marrom (movimento browniano: integra o branco, com vazamento para não derivar), com
 * decaimento de ~6 dB por oitava: soa como "vento" grave. Termina onde começa: o final é uma
 * mistura com a continuação natural do sinal, então `out[n - 1] -> out[0]` não dá estalo no loop.
 * O resultado é normalizado para `targetRms`, para o nível não depender do sorteio.
 */
export function fillBrown(out: Float32Array, random: Random = Math.random, targetRms = 0.2): void {
  const n = out.length
  if (n === 0) return
  const fade = Math.min(LOOP_FADE_SAMPLES, Math.floor(n / 2))
  const raw = new Float32Array(n + fade)
  let last = 0
  for (let i = 0; i < raw.length; i++) {
    last = (last + 0.02 * (random() * 2 - 1)) / 1.02
    raw[i] = last
  }
  // Cabeça = mistura de raw[i] (que continua do começo) com raw[n + i] (a continuação do fim).
  // Em i = 0 vale raw[n], o sucessor exato de raw[n - 1]: a emenda fica contínua.
  for (let i = 0; i < n; i++) {
    if (i < fade) {
      const t = i / fade
      out[i] = raw[i] * t + raw[n + i] * (1 - t)
    } else {
      out[i] = raw[i]
    }
  }
  const level = rms(out)
  if (level > 0) {
    const k = targetRms / level
    for (let i = 0; i < n; i++) out[i] *= k
  }
}

/** Estalos médios por segundo do chiado de vinil e "poeira" (estalos minúsculos e densos). */
export const CRACKLE_POPS_PER_S = 9
export const CRACKLE_DUST_PER_S = 60

/**
 * Chiado de vinil: estalos esparsos de força muito desigual (poucos fortes, muitos fracos), cada um um
 * pulso que morre em poucos milissegundos, mais uma "poeira" de estalos minúsculos. Os estalos que
 * passam do fim voltam ao começo (módulo): o buffer é circular, então o loop não tem emenda. O pico
 * fica em [-1, 1]; quem toca escolhe o nível.
 */
export function fillCrackle(out: Float32Array, sampleRate: number, random: Random = Math.random): void {
  const n = out.length
  out.fill(0)
  if (n === 0) return
  const seconds = n / sampleRate
  const stamp = (amplitude: number, tau: number, omega: number) => {
    const start = Math.floor(random() * n)
    const length = Math.min(n, Math.ceil(tau * 6))
    const sign = random() < 0.5 ? -1 : 1
    for (let k = 0; k < length; k++) {
      out[(start + k) % n] += sign * amplitude * Math.exp(-k / tau) * Math.cos(omega * k)
    }
  }
  const pops = Math.max(1, Math.round(seconds * CRACKLE_POPS_PER_S))
  for (let i = 0; i < pops; i++) {
    const strength = random()
    stamp(0.03 + strength * strength * strength * 0.85, 2 + random() * 10, random() * Math.PI * 0.6)
  }
  const dust = Math.round(seconds * CRACKLE_DUST_PER_S)
  for (let i = 0; i < dust; i++) {
    const strength = random()
    stamp(strength * strength * 0.06, 1.5, 0)
  }
  for (let i = 0; i < n; i++) {
    if (out[i] > 1) out[i] = 1
    else if (out[i] < -1) out[i] = -1
  }
}

export type NoiseKind = 'white' | 'brown'

/** Buffer mono de chiado de vinil (loop circular). */
export function createCrackleBuffer(ctx: BaseAudioContext, seconds: number): AudioBuffer {
  const length = Math.max(1, Math.floor(ctx.sampleRate * seconds))
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  fillCrackle(buffer.getChannelData(0), ctx.sampleRate)
  return buffer
}

/** Cria um buffer mono de ruído no contexto (real ou offline). */
export function createNoiseBuffer(
  ctx: BaseAudioContext,
  kind: NoiseKind,
  seconds: number,
): AudioBuffer {
  const length = Math.max(1, Math.floor(ctx.sampleRate * seconds))
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  if (kind === 'white') fillWhite(data)
  else fillBrown(data)
  return buffer
}
