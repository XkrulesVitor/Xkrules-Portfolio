import { useEffect, useState } from 'react'
import { useThree } from '@react-three/fiber'
import type { MeshBasicMaterial } from 'three'
import {
  attachScreenMap,
  createCanvasScreen,
  detachScreenMap,
  disposeCanvasScreen,
  type CanvasScreen,
} from './canvasScreen'

/** Anisotropia das telas: não precisa do máximo da GPU (são planos pequenos, vistos de frente). */
const MAX_SCREEN_ANISOTROPY = 8

/**
 * Cria o canvas + textura de uma tela e os liga ao `material` dela (troca o `map` uma vez e
 * devolve o plano ao estado escuro ao desmontar). Texturas e canvases são criados uma vez e
 * descartados no unmount. `null` enquanto o material não chegou (o glb ainda não carregou).
 * `flipY`: só para os planos do grey-box (a UV do glb tem v = 0 no topo).
 */
export function useCanvasScreen(
  material: MeshBasicMaterial | null,
  width: number,
  height: number,
  flipY = false,
): CanvasScreen | null {
  const gl = useThree((s) => s.gl)
  const [screen] = useState(() =>
    createCanvasScreen(width, height, Math.min(MAX_SCREEN_ANISOTROPY, gl.capabilities.getMaxAnisotropy()), flipY),
  )

  useEffect(() => {
    if (!screen || !material) return
    attachScreenMap(material, screen)
    return () => detachScreenMap(material)
  }, [screen, material])

  useEffect(
    () => () => {
      if (screen) disposeCanvasScreen(screen)
    },
    [screen],
  )

  return screen
}
