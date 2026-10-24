import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { useExperienceStore } from '@/store/useExperienceStore'

/**
 * Com um jogo rodando na TV (`store.playing`), o quarto passa a renderizar SOB DEMANDA: a câmera fica
 * parada de frente para a tela e o iframe do jogo cobre a TV, então redesenhar o quarto a 60 fps só
 * disputaria GPU com o jogo. O voo até a TV continua animado (o `CameraControls` do drei invalida a
 * cada passo da transição), e o resize também redesenha. Sem jogo, volta ao `always`. Não desenha nada.
 */
export function ScenePause() {
  const setFrameloop = useThree((s) => s.setFrameloop)

  useEffect(
    () =>
      useExperienceStore.subscribe(
        (s) => s.playing !== null,
        (playing) => setFrameloop(playing ? 'demand' : 'always'),
        { fireImmediately: true },
      ),
    [setFrameloop],
  )

  // Desmontou com jogo ligado (Fast Refresh): o quarto não pode ficar congelado.
  useEffect(() => () => setFrameloop('always'), [setFrameloop])

  return null
}
