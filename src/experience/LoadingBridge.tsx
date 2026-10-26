import { useEffect, useState } from 'react'
import { useProgress } from '@react-three/drei'
import { audio } from '@/lib/audio'
import { useExperienceStore } from '@/store/useExperienceStore'
import { LoadingScreen } from '@/ui/overlay/LoadingScreen'

// Tempo mínimo de exibição, para evitar um flash quando não há assets para carregar.
const MIN_DISPLAY_MS = 800

/**
 * Clique (ou Enter) em "Entrar". É um gesto do usuário, então é aqui que o AudioContext nasce: o
 * visitante entra COM som (música lo-fi baixinha), a não ser que já tenha escolhido mudo antes (a
 * escolha salva vale). Sem Web Audio, segue mudo.
 */
function enter(): void {
  const s = useExperienceStore.getState()
  if (audio.unlock()) s.enterWithSound()
  s.setMode('intro')
}

/**
 * Ponte entre `useProgress` (drei) e a LoadingScreen 2D. Existe porque `src/ui/**` não pode
 * importar `@react-three/*`: quem lê o progresso é o lado 3D e entrega números prontos.
 */
export function LoadingBridge() {
  const { progress, active, total } = useProgress()
  const mode = useExperienceStore((s) => s.mode)
  const [minElapsed, setMinElapsed] = useState(false)

  useEffect(() => {
    const id = window.setTimeout(() => setMinElapsed(true), MIN_DISPLAY_MS)
    return () => window.clearTimeout(id)
  }, [])

  // Sem nenhum asset na fila (grey-box), `progress` fica em 0 e `active` em false.
  const loaded = progress >= 100 || (!active && total === 0)
  const ready = loaded && minElapsed

  return (
    <LoadingScreen
      visible={mode === 'loading'}
      progress={ready ? 100 : progress}
      ready={ready}
      onEnter={enter}
    />
  )
}
