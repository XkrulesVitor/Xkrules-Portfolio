export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  if (inMax === inMin) return outMin
  const t = (value - inMin) / (inMax - inMin)
  return outMin + t * (outMax - outMin)
}

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180
}
