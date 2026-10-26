import { useLayoutEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { SRGBColorSpace, type Mesh, type Object3D, type Texture } from 'three'
import { COVER_URLS, DECOR_COVER_ENTRIES, GAME_COVERS } from '../../scene/baked/assets'
import { BakedMaterial } from '../../scene/baked/BakedMaterial'
import { createCoverMaterial } from '../../scene/baked/CoverMaterial'
import { useRoomNode } from '../../scene/baked/RoomContext'
import { GAME_BOX_NODES } from './gameBoxNodes'

/** Anisotropia das capas: vistas de lado na vista Digital, mas são pequenas. */
const MAX_COVER_ANISOTROPY = 8

function isMesh(object: Object3D): object is Mesh {
  return (object as Mesh).isMesh === true
}

/** Capa é cor (sRGB) e mantém o `flipY` padrão da imagem: a UV do shader tem v = 0 embaixo. */
function configureCover(texture: Texture, anisotropy: number) {
  if (texture.userData.coverConfigured) return
  texture.userData.coverConfigured = true
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = anisotropy
  texture.needsUpdate = true
}

/** Troca o material do quadro pelo da capa; devolve a limpeza (volta ao bake e descarta o material). */
function applyCover(mesh: Mesh, art: Texture): () => void {
  const baked = mesh.material
  if (!(baked instanceof BakedMaterial)) return () => {}
  const material = createCoverMaterial(baked, mesh.geometry, art)
  mesh.material = material
  return () => {
    mesh.material = baked
    material.dispose()
  }
}

function CoverArt({ nodeName, art }: { nodeName: string; art: Texture }) {
  const node = useRoomNode(nodeName)
  useLayoutEffect(() => {
    if (!node || !isMesh(node)) return
    return applyCover(node, art)
  }, [node, art])
  return null
}

/**
 * Nó do quadro de cada capa, na MESMA ordem de `COVER_URLS` (assets.ts): primeiro os jogos (o quadro é
 * filho da caixa e anda junto no spring), depois a decoração (quadros soltos sobre caixas estáticas).
 */
const COVER_NODE_NAMES: readonly string[] = [
  ...GAME_COVERS.map((cover) => GAME_BOX_NODES[cover.slug].cover),
  ...DECOR_COVER_ENTRIES.map((decor) => decor.node),
]

/**
 * Artes das capas no quarto baked (ARCHITECTURE §6.4): cada `cover_<slug>` do glb (filho da caixa,
 * então anda junto no spring) recebe o `CoverMaterial` com a capa de content/projects.games.ts, e cada
 * `cover_decor_<id>` (Root, Heat e Everdell, caixas decorativas da estante) recebe a de content/decor.ts.
 * As texturas vêm pré-carregadas na tela de loading (`preload.ts`). Sem a capa ou sem o nó, o quadro
 * fica com o bake (cinza iluminado). Não desenha nada.
 */
export function GameCovers() {
  const gl = useThree((s) => s.gl)
  const textures = useTexture(COVER_URLS)

  useLayoutEffect(() => {
    const anisotropy = Math.min(MAX_COVER_ANISOTROPY, gl.capabilities.getMaxAnisotropy())
    textures.forEach((texture) => configureCover(texture, anisotropy))
  }, [gl, textures])

  return (
    <>
      {COVER_NODE_NAMES.map((nodeName, i) => (
        <CoverArt key={nodeName} nodeName={nodeName} art={textures[i]} />
      ))}
    </>
  )
}
