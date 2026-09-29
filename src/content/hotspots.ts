import type { HotspotDef, HotspotId } from './types'

export const HOTSPOTS: readonly HotspotDef[] = [
  {
    id: 'chair',
    label: 'Sobre mim',
    description: 'Quem eu sou, o que eu faço e como me encontrar.',
    panel: 'about',
    preset: 'chair',
    side: 'right',
  },
  {
    id: 'desk',
    label: 'Projetos Web',
    description: 'Projetos de desenvolvimento web, dentro do monitor.',
    panel: 'os',
    preset: 'desk',
    side: 'none',
  },
  {
    id: 'printer',
    label: 'Reino de Amestris',
    description: 'Impressão 3D e manufatura digital.',
    panel: 'printer',
    preset: 'printer',
    side: 'right',
  },
  {
    id: 'shelf',
    label: 'Board games e game dev',
    description: 'Jogos de tabuleiro e jogos digitais que eu criei.',
    panel: 'games',
    preset: 'shelf',
    side: 'left',
  },
]

export const HOTSPOT_IDS: readonly HotspotId[] = HOTSPOTS.map((h) => h.id)

export function isHotspotId(value: string | null | undefined): value is HotspotId {
  return value != null && (HOTSPOT_IDS as readonly string[]).includes(value)
}

export function getHotspot(id: HotspotId): HotspotDef {
  const found = HOTSPOTS.find((h) => h.id === id)
  if (!found) throw new Error(`Hotspot desconhecido: ${id}`)
  return found
}
