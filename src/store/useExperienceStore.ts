import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { HotspotId } from '../content/types'

export type { HotspotId }
export type Mode = 'loading' | 'intro' | 'idle' | 'transitioning' | 'focused'
export type Quality = 'high' | 'medium' | 'low'

export interface ExperienceState {
  mode: Mode
  /** Alvo atual (durante `transitioning` = destino; `null` = home). */
  focus: HotspotId | null
  hovered: HotspotId | null
  quality: Quality
  audioEnabled: boolean
  /** Único canal UI -> 3D além de `focus` (ARCHITECTURE §6.4). */
  highlightBox: string | null
  setMode(mode: Mode): void
  setHovered(id: HotspotId | null): void
  /**
   * idle | intro | transitioning(home) -> transitioning(focus = id).
   * Ignorado em loading, focused e transitioning rumo a outro hotspot (sem spam de câmera).
   */
  requestFocus(id: HotspotId): void
  /** focused | transitioning -> transitioning(focus = null). */
  requestHome(): void
  /** transitioning -> focused | idle; intro -> idle. Chamado APENAS pelo CameraRig. */
  onCameraRest(): void
  setQuality(quality: Quality): void
  toggleAudio(): void
  setHighlightBox(slug: string | null): void
}

export const useExperienceStore = create<ExperienceState>()(
  subscribeWithSelector((set, get) => ({
    mode: 'loading',
    focus: null,
    hovered: null,
    quality: 'high',
    audioEnabled: false,
    highlightBox: null,

    setMode: (mode) => {
      const s = get()
      // Sem hotspot alvo, `focused` não faz sentido.
      if (mode === 'focused' && s.focus === null) return
      set({
        mode,
        // Guarda 3: hovered só existe em idle.
        hovered: mode === 'idle' ? s.hovered : null,
        // Fora de focused/transitioning não há alvo.
        focus: mode === 'focused' || mode === 'transitioning' ? s.focus : null,
        highlightBox: mode === 'focused' ? s.highlightBox : null,
      })
    },

    setHovered: (id) => {
      const s = get()
      // Guarda 3: só reporta hover em idle (limpar com null é sempre permitido).
      if (id !== null && s.mode !== 'idle') return
      if (s.hovered === id) return
      set({ hovered: id })
    },

    requestFocus: (id) => {
      // Guarda 1: aceito em idle, durante a intro e durante o voo de VOLTA (focus null).
      // Um clique enquanto a câmera ainda volta para HOME não deve ser perdido; já um clique
      // durante o voo rumo a outro hotspot é ignorado (evita spam de câmera).
      const s = get()
      const canAccept =
        s.mode === 'idle' || s.mode === 'intro' || (s.mode === 'transitioning' && s.focus === null)
      if (!canAccept) return
      set({ mode: 'transitioning', focus: id, hovered: null })
    },

    requestHome: () => {
      const s = get()
      // Guarda 2: aceito em focused e transitioning (cancelar uma entrada).
      if (s.mode === 'focused') {
        set({ mode: 'transitioning', focus: null, hovered: null, highlightBox: null })
      } else if (s.mode === 'transitioning' && s.focus !== null) {
        set({ focus: null, hovered: null, highlightBox: null })
      }
    },

    onCameraRest: () => {
      const s = get()
      if (s.mode === 'transitioning') {
        set(s.focus ? { mode: 'focused' } : { mode: 'idle', hovered: null })
      } else if (s.mode === 'intro') {
        set({ mode: 'idle', focus: null })
      }
    },

    setQuality: (quality) => {
      if (get().quality !== quality) set({ quality })
    },

    toggleAudio: () => set((s) => ({ audioEnabled: !s.audioEnabled })),

    setHighlightBox: (slug) => {
      const s = get()
      // Só faz sentido com um hotspot em foco (painel aberto).
      if (slug !== null && s.mode !== 'focused') return
      if (s.highlightBox === slug) return
      set({ highlightBox: slug })
    },
  })),
)
