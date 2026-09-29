import { MeshBasicMaterial, MeshStandardMaterial } from 'three'

// Materiais compartilhados (ARCHITECTURE §7). Provisórios: o room real usará MeshBasicMaterial + atlas baked.

/** Material do grey-box: a cor vem do vertex color de cada primitiva. */
export const clayMaterial = new MeshStandardMaterial({
  vertexColors: true,
  roughness: 0.92,
  metalness: 0,
})

/** Telas apagadas. */
export const screenMaterial = new MeshBasicMaterial({ color: '#050507' })

/** LED "ligado": toneMapped=false para estourar no Bloom (Fase 3). */
export const ledMaterial = new MeshBasicMaterial({ color: '#7ff5d0', toneMapped: false })

const solidCache = new Map<string, MeshStandardMaterial>()

/** Cor sólida cacheada (caixas de jogo, etc.). */
export function solidMaterial(color: string): MeshStandardMaterial {
  let m = solidCache.get(color)
  if (!m) {
    m = new MeshStandardMaterial({ color, roughness: 0.85, metalness: 0 })
    solidCache.set(color, m)
  }
  return m
}
