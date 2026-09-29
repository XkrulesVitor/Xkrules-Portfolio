import type { HotspotDef, HotspotId, HotspotView, PanelSide, PresetKey } from './types'

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
    // Zona de jogos: aba Tabuleiro foca a estante (painel à esquerda); aba Digital foca a TV e o
    // console no rack (painel à direita). Os ids casam com GameKind.
    views: [
      { id: 'tabuleiro', preset: 'shelf', side: 'left' },
      { id: 'digital', preset: 'shelfDigital', side: 'right' },
    ],
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

/** Sub-vista ativa: a pedida, se existir no hotspot; senão a primeira; `null` se não houver vistas. */
export function resolveView(id: HotspotId, view: string | null | undefined): HotspotView | null {
  const views = getHotspot(id).views
  if (!views || views.length === 0) return null
  return views.find((v) => v.id === view) ?? views[0]
}

/** Preset de câmera e lado do painel efetivos para um hotspot numa sub-vista. */
export function resolveFocus(
  id: HotspotId,
  view: string | null | undefined,
): { preset: PresetKey; side: PanelSide } {
  const hotspot = getHotspot(id)
  const v = resolveView(id, view)
  return v ? { preset: v.preset, side: v.side } : { preset: hotspot.preset, side: hotspot.side }
}
