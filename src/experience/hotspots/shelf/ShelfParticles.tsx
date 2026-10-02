import { Sparkles } from '@react-three/drei'
import { a, useSpring } from '@react-spring/three'
import { resolveView } from '@/content/hotspots'
import { useExperienceStore } from '@/store/useExperienceStore'
import { LAYOUT, RACK_TOP_Y } from '../../scene/layout'
import type { Vec3 } from '../../scene/placeholders/parts'
import { useReducedMotion } from '../../scene/life/useReducedMotion'

interface SparkleRegion {
  center: Vec3
  /** Extensão da caixa onde as partículas nascem (largura, altura, profundidade). */
  size: Vec3
  count: number
  color: string
}

const [sx, , sz] = LAYOUT.shelf
const [rx, , rz] = LAYOUT.rack.center
const [tvX, tvY] = LAYOUT.tv.center

/**
 * Onde as partículas aparecem em cada sub-vista (ARCHITECTURE §6.4). Posições do mundo derivadas
 * do `layout.ts`. Cada região tem no máximo 80 partículas (uma só montada por vez).
 * - `tabuleiro`: as prateleiras 2 e 3 da estante, em tom âmbar.
 * - `digital`: o rack e a TV, em rosa (a luz da TV).
 */
const REGIONS: Readonly<Record<'tabuleiro' | 'digital', SparkleRegion>> = {
  tabuleiro: { center: [sx, 1.35, sz + 0.12], size: [1.7, 1.3, 0.5], count: 64, color: '#ffd9a0' },
  digital: {
    center: [rx, (RACK_TOP_Y + tvY + 0.47) / 2, rz + 0.15],
    size: [tvX - rx + 2.0, tvY + 0.47 - RACK_TOP_Y + 0.2, 0.5],
    count: 72,
    color: '#ff9cc8',
  },
}

/** Vista ativa quando a zona de jogos está em foco (câmera parada); `null` fora disso. */
function useActiveSparkleView(): keyof typeof REGIONS | null {
  return useExperienceStore((s) => {
    if (s.mode !== 'focused' || s.focus !== 'shelf') return null
    return resolveView('shelf', s.view)?.id === 'digital' ? 'digital' : 'tabuleiro'
  })
}

function Region({ region }: { region: SparkleRegion }) {
  // Entrada: a nuvem "abre" (escala 0.4 -> 1) em vez de aparecer de uma vez.
  const { s } = useSpring({ from: { s: 0.4 }, to: { s: 1 }, config: { tension: 90, friction: 18 } })
  return (
    <a.group position={[region.center[0], region.center[1], region.center[2]]} scale={s}>
      <Sparkles count={region.count} scale={[region.size[0], region.size[1], region.size[2]]} size={2.4} speed={0.35} opacity={0.9} noise={0.8} color={region.color} />
    </a.group>
  )
}

/**
 * Partículas da zona de jogos (drei `Sparkles`, ≤ 80), só com `focused` + `shelf` e na vista ativa:
 * estante em `tabuleiro`, rack e TV em `digital`. Trocar de aba troca a região (a anterior
 * desmonta). Sai tudo ao voltar para HOME. `prefers-reduced-motion` não monta partículas.
 */
export function ShelfParticles() {
  const view = useActiveSparkleView()
  const reduced = useReducedMotion()
  if (!view || reduced) return null
  return <Region key={view} region={REGIONS[view]} />
}
