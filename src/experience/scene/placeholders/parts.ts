// Descrição declarativa de primitivas do grey-box. Cada lista vira UMA malha (merge de
// geometrias com vertex color), então cada hotspot custa poucos draw calls.

export type Vec3 = readonly [number, number, number]

export type Part =
  | { kind: 'box'; size: Vec3; position: Vec3; color: string }
  | { kind: 'cyl'; radius: number; height: number; position: Vec3; color: string }

export const box = (size: Vec3, position: Vec3, color: string): Part => ({
  kind: 'box',
  size,
  position,
  color,
})

export const cyl = (radius: number, height: number, position: Vec3, color: string): Part => ({
  kind: 'cyl',
  radius,
  height,
  position,
  color,
})

// Paleta clay/neutra do grey-box.
export const COLORS = {
  floor: '#d9d0c1',
  floorSide: '#a89b88',
  floorUnder: '#8f8373',
  wallLeft: '#ece6db',
  wallRight: '#e4ddd0',
  rug: '#b7c2cf',
  wood: '#b08d6a',
  woodLight: '#c8a27a',
  dark: '#2f3542',
  darker: '#1f232c',
  bezel: '#20242c',
  metal: '#c9ced6',
  metalDark: '#8b93a1',
  chair: '#4a5568',
  chairSeat: '#5f7190',
  printerBase: '#3f4652',
  accent: '#ef6c3b',
  part: '#ff9f6b',
} as const
