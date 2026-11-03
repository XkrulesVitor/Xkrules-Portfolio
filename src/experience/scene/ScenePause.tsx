import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { useExperienceStore } from '@/store/useExperienceStore'

/**
 * Com um jogo rodando na TV (`store.playing`), o quarto passa a renderizar SOB DEMANDA: a câmera fica
 * parada de frente para a tela e o jogo cobre a TV, então redesenhar o quarto a 60 fps só disputaria
 * GPU com ele. O voo que nasce em `focused` continua animado (o `CameraControls` do drei invalida a
 * cada passo da transição), e o resize também redesenha. Sem jogo, volta ao `always`. No voo direto até
 * a TV (`transitioning`) o quarto segue em `always`: a chegada depende de um quadro. Não desenha nada.
 */
export function ScenePause() {
  const setFrameloop = useThree((s) => s.setFrameloop)

  useEffect(
    () =>
      useExperienceStore.subscribe(
        (s) => s.mode === 'focused' && s.playing !== null,
        (playing) => setFrameloop(playing ? 'demand' : 'always'),
        { fireImmediately: true },
      ),
    [setFrameloop],
  )

  // Desmontou com jogo ligado (Fast Refresh): o quarto não pode ficar congelado.
  useEffect(() => () => setFrameloop('always'), [setFrameloop])

  return null
}
