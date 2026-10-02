import { Color } from 'three'

/**
 * Fundo do Canvas no grey-box COM composer. Sem composer, o Canvas aplica ACES nos materiais e a cor
 * de fundo (clear color) sai crua. Com composer, o ACES vira o efeito `ToneMapping` sobre o quadro
 * INTEIRO, fundo incluso: o azul-marinho `#0b1020` seria esmagado para quase preto. Para o fundo sair
 * igual, o composer recebe a cor cuja saída pelo ACES é a cor desejada (inversa numérica do ACES do
 * three, `ACESFilmicToneMapping` com exposição 1).
 */

type Rgb = [number, number, number]

function rrtAndOdtFit(v: number): number {
  const a = v * (v + 0.0245786) - 0.000090537
  const b = v * (0.983729 * v + 0.432951) + 0.238081
  return a / b
}

/** ACES filmic do three (r186), entrada e saída em sRGB linear, exposição 1. */
export function acesFilmic([r, g, b]: Rgb): Rgb {
  const k = 1 / 0.6
  const ir = k * r
  const ig = k * g
  const ib = k * b
  // sRGB => XYZ => D65_2_D60 => AP1 => RRT_SAT
  const x = rrtAndOdtFit(0.59719 * ir + 0.35458 * ig + 0.04823 * ib)
  const y = rrtAndOdtFit(0.076 * ir + 0.90834 * ig + 0.01566 * ib)
  const z = rrtAndOdtFit(0.0284 * ir + 0.13383 * ig + 0.83777 * ib)
  // ODT_SAT => XYZ => D60_2_D65 => sRGB
  const clamp = (n: number) => Math.min(1, Math.max(0, n))
  return [
    clamp(1.60475 * x - 0.53108 * y - 0.07367 * z),
    clamp(-0.10208 * x + 1.10813 * y - 0.00605 * z),
    clamp(-0.00327 * x - 0.07276 * y + 1.07602 * z),
  ]
}

/** Inversa numérica: acha `x` com `acesFilmic(x) ≈ target` (ponto fixo amortecido por canal). */
export function inverseAcesFilmic(target: Rgb): Rgb {
  const x: Rgb = [target[0], target[1], target[2]]
  for (let i = 0; i < 400; i++) {
    const y = acesFilmic(x)
    for (let c = 0; c < 3; c++) {
      if (target[c] <= 0 || y[c] <= 1e-9) continue
      // passo multiplicativo amortecido: converge porque o ACES é crescente nos valores baixos
      x[c] *= Math.pow(target[c] / y[c], 0.5)
    }
  }
  return x
}

/** `#0b1020` (fundo do Canvas) pré-compensado para atravessar o ACES do composer sem mudar. */
export function acesCompensatedBackground(hex: string): Color {
  const target = new Color(hex)
  const [r, g, b] = inverseAcesFilmic([target.r, target.g, target.b])
  return new Color().setRGB(r, g, b)
}
