import type { Material, Mesh, MeshBasicMaterial } from 'three'
import { useRoomNode } from '../../baked/RoomContext'

/**
 * Material da tela `screen_*` do glb (um `MeshBasicMaterial` por nó, criado pelo `buildRoom`).
 * `null` enquanto o glb não chegou ou se o nó não tiver o material esperado.
 */
export function useRoomScreenMaterial(name: string): MeshBasicMaterial | null {
  const node = useRoomNode(name)
  const material: Material | Material[] | undefined = (node as Mesh | null)?.material
  if (!material || Array.isArray(material)) return null
  return (material as MeshBasicMaterial).isMeshBasicMaterial ? (material as MeshBasicMaterial) : null
}
