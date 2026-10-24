import { useEffect } from 'react'
import { useExperienceStore } from '@/store/useExperienceStore'

/**
 * Esc -> requestHome (sempre ativo; o store decide se aceita). Com um jogo na TV, o Esc só desliga o
 * jogo (volta para a vista Digital). Com o foco DENTRO do iframe do jogo o Esc fica com o jogo: a
 * página não recebe a tecla, e quem sai é o botão "Sair do jogo".
 */
export function useKeyboard(): void {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.repeat) return
      const s = useExperienceStore.getState()
      if (s.playing !== null) s.stopGame()
      else s.requestHome()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
