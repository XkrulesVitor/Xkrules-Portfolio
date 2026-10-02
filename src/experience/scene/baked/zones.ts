import type { HotspotId } from '@/content/types'

/**
 * Hotspot -> nós do `room.glb` que o contorno (Outline) destaca no hover. Os nomes seguem
 * ASSET_PIPELINE §4. O `Outline` seleciona só os objetos listados (não os filhos), então a
 * hierarquia é enumerada: `printer_head` é filho de `printer_axisZ` e entra por nome.
 */
export const HOTSPOT_OUTLINE_NODES: Readonly<Record<HotspotId, readonly string[]>> = {
  chair: ['chair_root'],
  desk: ['zone_desk', 'screen_monitor_main', 'screen_monitor_vertical'],
  printer: [
    'zone_maker',
    'printer_root',
    'printer_axisZ',
    'printer_head',
    'printer_bed',
    'printer_part',
  ],
  shelf: [
    'zone_games',
    'screen_tv',
    'box_terra',
    'box_aldeia_dorme',
    'box_porrilandia',
    'box_peter',
    'box_o_anel',
    'box_racco',
    'box_memory_game',
  ],
}

/**
 * Luzes de zona (lightmap): qual hotspot "acende" qual canal. Hover ou foco na mesa sobe a mesa
 * (G) e o PC (B); na zona de jogos sobe a TV (R). O resto volta ao base.
 */
export const ZONE_LIGHT_HOTSPOT = {
  tv: 'shelf',
  desk: 'desk',
  pc: 'desk',
} as const satisfies Record<'tv' | 'desk' | 'pc', HotspotId>
