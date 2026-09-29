import { useEffect, useMemo } from 'react'
import type { ThreeElements } from '@react-three/fiber'
import { BoxGeometry, BufferAttribute, BufferGeometry, Color, CylinderGeometry } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { clayMaterial } from './materials'
import type { Part } from './parts'
import { NO_RAYCAST } from './raycast'

function buildGeometry(parts: readonly Part[]): BufferGeometry {
  const color = new Color()
  const pieces = parts.map((part) => {
    const g =
      part.kind === 'box'
        ? new BoxGeometry(part.size[0], part.size[1], part.size[2])
        : new CylinderGeometry(part.radius, part.radius, part.height, 20)
    g.translate(part.position[0], part.position[1], part.position[2])
    color.set(part.color)
    const count = g.getAttribute('position').count
    const rgb = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      rgb[i * 3] = color.r
      rgb[i * 3 + 1] = color.g
      rgb[i * 3 + 2] = color.b
    }
    g.setAttribute('color', new BufferAttribute(rgb, 3))
    return g
  })
  const merged = mergeGeometries(pieces, false)
  pieces.forEach((g) => g.dispose())
  if (!merged) throw new Error('mergeGeometries falhou (atributos incompatíveis)')
  return merged
}

type MergedPartsProps = Omit<ThreeElements['mesh'], 'geometry' | 'material'> & {
  /** Lista ESTÁVEL (constante de módulo ou memoizada): mudar recria a geometria. */
  parts: readonly Part[]
}

/** Uma malha (1 draw call) a partir de várias primitivas coloridas. Sem raycast. */
export function MergedParts({ parts, ...props }: MergedPartsProps) {
  const geometry = useMemo(() => buildGeometry(parts), [parts])
  useEffect(() => () => geometry.dispose(), [geometry])
  return <mesh raycast={NO_RAYCAST} {...props} geometry={geometry} material={clayMaterial} />
}
