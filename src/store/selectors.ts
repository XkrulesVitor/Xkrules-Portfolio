import type { ExperienceState, HotspotId } from './useExperienceStore'

export const selectMode = (s: ExperienceState) => s.mode
export const selectFocus = (s: ExperienceState) => s.focus
export const selectHovered = (s: ExperienceState) => s.hovered
/**
 * O ponteiro está neste ponto interativo? Um hotspot com sub-vistas (`view`) só reage à sua: na zona de
 * jogos o marcador da estante não abre com o ponteiro no rack. Com `view` null, vale o hotspot inteiro.
 */
export const selectHoverOn = (
  s: Pick<ExperienceState, 'hovered' | 'hoveredView'>,
  id: HotspotId,
  view: string | null,
) => s.hovered === id && (view === null || s.hoveredView === null || s.hoveredView === view)
export const selectMuted = (s: ExperienceState) => s.muted
export const selectVolumes = (s: ExperienceState) => s.volumes
export const selectLocale = (s: ExperienceState) => s.locale

export const selectIsFocused = (s: ExperienceState) => s.mode === 'focused'

/** Hover/click nos hotspots só são aceitos em idle. */
export const selectCanInteract = (s: ExperienceState) => s.mode === 'idle'

/** Guarda 5: painéis DOM só recebem pointer-events em focused. */
export const selectPanelsInteractive = (s: ExperienceState) => s.mode === 'focused'

/** BackButton: focused ou transitioning rumo a um hotspot. */
export const selectShowBack = (s: ExperienceState) =>
  s.mode === 'focused' || (s.mode === 'transitioning' && s.focus !== null)
