import { useGLTF, useTexture } from '@react-three/drei'
import { PRELOAD_LIST } from '@/lib/constants'
import { BAKED_TEXTURE_URLS } from './scene/baked/assets'
import { isGreyboxForced } from './scene/baked/useSceneMode'

// Preload de todos os .glb e das texturas do bake assim que o chunk da experiência carrega; o
// progresso aparece na LoadingScreen (useProgress). Com `?greybox` não há nada a carregar.
// Os argumentos casam com o `useGLTF(url, false)` e o `useTexture(BAKED_TEXTURES)` do BakedRoom
// (mesma chave de cache do useLoader).
if (!isGreyboxForced()) {
  PRELOAD_LIST.forEach((url) => useGLTF.preload(url, false))
  useTexture.preload(BAKED_TEXTURE_URLS)
}
