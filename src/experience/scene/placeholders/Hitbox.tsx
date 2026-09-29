import type { Vec3 } from './parts'

interface HitboxProps {
  position: Vec3
  size: Vec3
}

/** Área de raycast do hotspot: box simples e generosa, nunca desenhada (ARCHITECTURE §5). */
export function Hitbox({ position, size }: HitboxProps) {
  return (
    <mesh visible={false} position={[position[0], position[1], position[2]]}>
      <boxGeometry args={[size[0], size[1], size[2]]} />
    </mesh>
  )
}
