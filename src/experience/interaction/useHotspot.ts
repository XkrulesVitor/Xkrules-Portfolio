import { useMemo } from 'react'
import { useCursor } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import type { HotspotId } from '@/content/types'
import { useExperienceStore } from '@/store/useExperienceStore'

export interface HotspotBind {
  onPointerOver: (e: ThreeEvent<PointerEvent>) => void
  onPointerOut: (e: ThreeEvent<PointerEvent>) => void
  onClick: (e: ThreeEvent<MouseEvent>) => void
}

export interface HotspotState {
  hovered: boolean
  focused: boolean
  /** hovered || focused: usado para animações "ligadas". */
  active: boolean
  /** Espalhar em um <group {...bind}> que envolve hitbox + geometria. */
  bind: HotspotBind
}

/**
 * Hook único de hotspot (ARCHITECTURE §5). Hover e click só valem em `mode === 'idle'`;
 * em touch o hover é ignorado (o primeiro toque já é o click).
 */
export function useHotspot(id: HotspotId): HotspotState {
  const hovered = useExperienceStore((s) => s.hovered === id)
  const focused = useExperienceStore((s) => s.mode === 'focused' && s.focus === id)

  // Cursor derivado do store: some sozinho quando o hover é limpo (ex.: ao clicar).
  useCursor(hovered)

  const bind = useMemo<HotspotBind>(
    () => ({
      onPointerOver: (e) => {
        e.stopPropagation()
        if (e.pointerType === 'touch') return
        useExperienceStore.getState().setHovered(id) // a guarda de idle vive no store
      },
      onPointerOut: () => {
        const s = useExperienceStore.getState()
        if (s.hovered === id) s.setHovered(null)
      },
      onClick: (e) => {
        e.stopPropagation()
        // A hitbox clicada pode pedir uma sub-vista (Hitbox `view` -> userData.view).
        const view = e.object.userData?.view
        useExperienceStore.getState().requestFocus(id, typeof view === 'string' ? view : null)
      },
    }),
    [id],
  )

  return { hovered, focused, active: hovered || focused, bind }
}
