// Tipos de conteúdo. Dados puros: este módulo não importa React nem three.

export type HotspotId = 'chair' | 'desk' | 'printer' | 'shelf'

export type PanelKind = 'about' | 'os' | 'printer' | 'games'

export type PanelSide = 'left' | 'right' | 'none'

export interface HotspotDef {
  id: HotspotId
  label: string
  description: string
  /** Qual painel o Overlay monta quando o hotspot está em `focused`. */
  panel: PanelKind
  /** Chave do preset de câmera (experience/camera/presets.ts). Igual ao id. */
  preset: HotspotId
  /** Lado do painel DOM (`none` = sem painel lateral, ex.: SO no monitor). */
  side: PanelSide
}
