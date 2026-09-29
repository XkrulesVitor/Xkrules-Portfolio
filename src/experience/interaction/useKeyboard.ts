import { useEffect } from 'react'
import { useExperienceStore } from '@/store/useExperienceStore'

/** Esc -> requestHome (sempre ativo; o store decide se aceita). */
export function useKeyboard(): void {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.repeat) return
      useExperienceStore.getState().requestHome()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
