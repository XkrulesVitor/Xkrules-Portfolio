import type { ExperienceState } from './useExperienceStore'

export const selectMode = (s: ExperienceState) => s.mode
export const selectFocus = (s: ExperienceState) => s.focus
export const selectHovered = (s: ExperienceState) => s.hovered

export const selectIsFocused = (s: ExperienceState) => s.mode === 'focused'

/** Hover/click nos hotspots só são aceitos em idle. */
export const selectCanInteract = (s: ExperienceState) => s.mode === 'idle'

/** Guarda 5: painéis DOM só recebem pointer-events em focused. */
export const selectPanelsInteractive = (s: ExperienceState) => s.mode === 'focused'

/** BackButton: focused ou transitioning rumo a um hotspot. */
export const selectShowBack = (s: ExperienceState) =>
  s.mode === 'focused' || (s.mode === 'transitioning' && s.focus !== null)
