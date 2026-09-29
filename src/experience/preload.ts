import { useGLTF } from '@react-three/drei'
import { PRELOAD_LIST } from '@/lib/constants'

// Preload de todos os .glb assim que o chunk da experiência carrega; o progresso aparece
// na LoadingScreen (useProgress). Lista vazia no grey-box.
PRELOAD_LIST.forEach((url) => useGLTF.preload(url))
