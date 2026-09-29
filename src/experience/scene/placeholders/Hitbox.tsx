import type { Vec3 } from './parts'

interface HitboxProps {
  position: Vec3
  size: Vec3
  /** Sub-vista aberta ao clicar nesta hitbox (ex.: 'digital' no rack da TV). Ver useHotspot. */
  view?: string
}

/** Área de raycast do hotspot: box simples e generosa, nunca desenhada (ARCHITECTURE §5). */
export function Hitbox({ position, size, view }: HitboxProps) {
  return (
    <mesh
      visible={false}
      position={[position[0], position[1], position[2]]}
      userData={view ? { view } : undefined}
    >
      <boxGeometry args={[size[0], size[1], size[2]]} />
    </mesh>
  )
}
