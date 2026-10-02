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

export type NoiseKind = 'white' | 'brown'

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
