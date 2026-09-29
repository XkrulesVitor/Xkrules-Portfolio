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

// Paleta do grey-box, puxada para a referência (quarto aconchegante de fim de noite): piso de
// madeira, paredes claras levemente tingidas, borda da ilha escura. A cor final vem do bake (Fase 4).
export const COLORS = {
  floor: '#b8865a',
  floorSide: '#3a3350',
  floorUnder: '#2b2640',
  wallLeft: '#e8e2ef',
  wallRight: '#efe3e5',
  rug: '#8c83b3',
  wood: '#b08d6a',
  woodLight: '#c8a27a',
  white: '#ece8e1',
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
  bedFrame: '#8a6a4f',
  mattress: '#e9e4da',
  pillow: '#f6f3ec',
  blanket: '#4f6aa3',
  blanketFold: '#6a84bb',
  dice: '#f2efe8',
} as const
