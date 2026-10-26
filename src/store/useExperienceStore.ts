import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { isLocale, type Locale } from '../content/i18n.ts'
import type { GameKind, HotspotId, PcApp } from '../content/types'
import { applyDocumentLang, detectInitialLocale, writeStoredLocale } from '../lib/locale.ts'
import {
  changedVolumes,
  initialSound,
  normalizeVolume,
  readSoundPrefs,
  writeSoundPrefs,
  type SoundCategory,
  type Volumes,
} from '../lib/audio/volumes.ts'

export type { HotspotId }

/**
 * Vista da zona de jogos com a TV (id do registry em content/hotspots.ts, que casa com GameKind). Literal
 * aqui porque o store roda nos testes do node sem resolver imports de runtime sem extensão.
 */
const TV_VIEW: GameKind = 'digital'
export type Mode = 'loading' | 'intro' | 'idle' | 'transitioning' | 'focused'
export type Quality = 'high' | 'medium' | 'low'
/** Tema do quarto: `night` (padrão) ou `day`. O `BakedMaterial` mistura os dois bakes por `uNightMix`. */
export type Theme = 'night' | 'day'

export interface ExperienceState {
  mode: Mode
  /** Alvo atual (durante `transitioning` = destino; `null` = home). */
  focus: HotspotId | null
  /**
   * Sub-vista do hotspot em foco (ARCHITECTURE §5). `null` = a vista padrão (a primeira do registry).
   * Só existe junto com `focus`; trocar a vista em `focused` move a câmera sem sair do foco.
   */
  view: string | null
  hovered: HotspotId | null
  quality: Quality
  /** Tema dia/noite (ARCHITECTURE §12.3). O 3D faz damp de `uNightMix` até o alvo, sem setState no frame. */
  theme: Theme
  /**
   * Mudo geral (ARCHITECTURE §12 / V.5). Começa `true` e o AudioContext só nasce num gesto do usuário:
   * o clique em "Entrar" (que liga o som, se o visitante nunca escolheu) ou o menu de som do HUD. A
   * escolha fica salva no localStorage. O áudio (`lib/audio`) segue este valor.
   */
  muted: boolean
  /**
   * O visitante já escolheu ligar ou silenciar (salvo de uma visita anterior ou nesta sessão). Sem
   * escolha, o "Entrar" liga o som sozinho; com escolha, ela é respeitada.
   */
  soundChosen: boolean
  /** Volume de cada categoria (0..1), salvo no localStorage. A curva de ganho está em `lib/audio/volumes.ts`. */
  volumes: Volumes
  /**
   * Idioma da interface (`pt` | `en`). No navegador começa em `?lang=` > localStorage > idioma do
   * navegador (`lib/locale.ts`); no servidor é `pt`. Quem lê em React usa `ui/i18n/useLocale`, que
   * devolve `pt` na hidratação (o HTML do servidor é em português) e troca logo depois; o 3D lê
   * `getState().locale` no frame, sem assinar.
   */
  locale: Locale
  /** Único canal UI -> 3D além de `focus` (ARCHITECTURE §6.4). */
  highlightBox: string | null
  /**
   * Jogo (slug) rodando na TV da zona de jogos, ou `null` (ARCHITECTURE §6.6). Só existe em `focused`
   * + `shelf` + vista `digital`; a câmera vai para o preset `shelfTv` e o painel some. Sai em
   * `stopGame`, em qualquer troca de vista e ao voltar para HOME.
   */
  playing: string | null
  /**
   * Último pedido para abrir um app do XkrulesOS no monitor (`openOnPc`). O `id` cresce a cada
   * pedido: o Desktop abre a janela uma vez por id. Não é limpo (o Desktop guarda o último atendido).
   */
  pcLaunch: { app: PcApp; id: number } | null
  setMode(mode: Mode): void
  setHovered(id: HotspotId | null): void
  /**
   * idle | intro | transitioning(home) -> transitioning(focus = id, view).
   * Ignorado em loading, focused e transitioning rumo a outro hotspot (sem spam de câmera).
   */
  requestFocus(id: HotspotId, view?: string | null): void
  /** Troca a sub-vista do hotspot em foco. Só em `focused`; limpa o highlightBox. */
  setView(view: string | null): void
  /** focused | transitioning -> transitioning(focus = null). */
  requestHome(): void
  /** transitioning -> focused | idle; intro -> idle. Chamado APENAS pelo CameraRig. */
  onCameraRest(): void
  setQuality(quality: Quality): void
  toggleTheme(): void
  toggleMuted(): void
  /** Volume de uma categoria de som (limitado a 0..1, em passos de 1%). Persistido. */
  setVolume(category: SoundCategory, value: number): void
  /** Chamado no clique em "Entrar": liga o som se o visitante nunca escolheu (sem gravar a escolha). */
  enterWithSound(): void
  /** Troca o idioma: grava no localStorage e atualiza `<html lang>`. Idioma inválido é ignorado. */
  setLocale(locale: Locale): void
  setHighlightBox(slug: string | null): void
  /** Liga o jogo na TV. Só em `focused` + `shelf` + vista `digital`. */
  startGame(slug: string): void
  /** Desliga o jogo da TV (a câmera volta para a vista Digital, com o painel). */
  stopGame(): void
  /**
   * Abre um app do XkrulesOS: de `idle` ou de `focused` em qualquer hotspot, a câmera voa direto para
   * a mesa (`transitioning` -> `desk`) e a janela abre no monitor. Já com a mesa em foco, só abre.
   */
  openOnPc(app: PcApp): void
}

/** Grava a escolha de som. O mudo só entra se o visitante o escolheu; dos volumes, só o que mudou. */
function persistSound(s: Pick<ExperienceState, 'muted' | 'soundChosen' | 'volumes'>): void {
  const volumes = changedVolumes(s.volumes)
  writeSoundPrefs({
    ...(s.soundChosen ? { muted: s.muted } : {}),
    ...(Object.keys(volumes).length > 0 ? { volumes } : {}),
  })
}

// Preferência salva (só no browser: no servidor e nos testes do node volta o padrão).
const sound = initialSound(readSoundPrefs())

export const useExperienceStore = create<ExperienceState>()(
  subscribeWithSelector((set, get) => ({
    mode: 'loading',
    focus: null,
    view: null,
    hovered: null,
    quality: 'high',
    theme: 'night',
    muted: sound.muted,
    soundChosen: sound.soundChosen,
    volumes: sound.volumes,
    locale: detectInitialLocale(),
    highlightBox: null,
    playing: null,
    pcLaunch: null,

    setMode: (mode) => {
      const s = get()
      // Sem hotspot alvo, `focused` não faz sentido.
      if (mode === 'focused' && s.focus === null) return
      set({
        mode,
        // Guarda 3: hovered só existe em idle.
        hovered: mode === 'idle' ? s.hovered : null,
        // Fora de focused/transitioning não há alvo (nem sub-vista).
        focus: mode === 'focused' || mode === 'transitioning' ? s.focus : null,
        view: mode === 'focused' || mode === 'transitioning' ? s.view : null,
        highlightBox: mode === 'focused' ? s.highlightBox : null,
        playing: mode === 'focused' ? s.playing : null,
      })
    },

    setHovered: (id) => {
      const s = get()
      // Guarda 3: só reporta hover em idle (limpar com null é sempre permitido).
      if (id !== null && s.mode !== 'idle') return
      if (s.hovered === id) return
      set({ hovered: id })
    },

    requestFocus: (id, view = null) => {
      // Guarda 1: aceito em idle, durante a intro e durante o voo de VOLTA (focus null).
      // Um clique enquanto a câmera ainda volta para HOME não deve ser perdido; já um clique
      // durante o voo rumo a outro hotspot é ignorado (evita spam de câmera).
      const s = get()
      const canAccept =
        s.mode === 'idle' || s.mode === 'intro' || (s.mode === 'transitioning' && s.focus === null)
      if (!canAccept) return
      set({ mode: 'transitioning', focus: id, view, hovered: null, playing: null })
    },

    setView: (view) => {
      const s = get()
      if (s.mode !== 'focused' || s.focus === null || s.view === view) return
      set({ view, highlightBox: null, playing: null })
    },

    requestHome: () => {
      const s = get()
      // Guarda 2: aceito em focused e transitioning (cancelar uma entrada).
      if (s.mode === 'focused') {
        set({ mode: 'transitioning', focus: null, view: null, hovered: null, highlightBox: null, playing: null })
      } else if (s.mode === 'transitioning' && s.focus !== null) {
        set({ focus: null, view: null, hovered: null, highlightBox: null, playing: null })
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

    toggleTheme: () => set((s) => ({ theme: s.theme === 'night' ? 'day' : 'night' })),

    toggleMuted: () => {
      const s = get()
      const next = { muted: !s.muted, soundChosen: true }
      set(next)
      persistSound({ ...next, volumes: s.volumes })
    },

    setVolume: (category, value) => {
      const s = get()
      const v = normalizeVolume(value)
      if (s.volumes[category] === v) return
      const volumes = { ...s.volumes, [category]: v }
      set({ volumes })
      persistSound({ muted: s.muted, soundChosen: s.soundChosen, volumes })
    },

    enterWithSound: () => {
      const s = get()
      if (s.soundChosen || !s.muted) return
      set({ muted: false })
    },

    setLocale: (locale) => {
      if (!isLocale(locale)) return
      // Clicar no idioma que já está ativo também vale como escolha: fica salva para as próximas visitas.
      writeStoredLocale(locale)
      applyDocumentLang(locale)
      if (get().locale !== locale) set({ locale })
    },

    setHighlightBox: (slug) => {
      const s = get()
      // Só faz sentido com um hotspot em foco (painel aberto).
      if (slug !== null && s.mode !== 'focused') return
      if (s.highlightBox === slug) return
      set({ highlightBox: slug })
    },

    startGame: (slug) => {
      const s = get()
      const onTvView = s.mode === 'focused' && s.focus === 'shelf' && s.view === TV_VIEW
      if (!onTvView || s.playing === slug) return
      // O painel sai de cena durante o jogo: nenhum destaque fica preso no rack.
      set({ playing: slug, highlightBox: null })
    },

    stopGame: () => {
      if (get().playing === null) return
      set({ playing: null, highlightBox: null })
    },

    openOnPc: (app) => {
      const s = get()
      const pcLaunch = { app, id: (s.pcLaunch?.id ?? 0) + 1 }
      if (s.mode === 'focused' && s.focus === 'desk') {
        set({ pcLaunch })
      } else if (s.mode === 'focused' || s.mode === 'idle') {
        // Exceção deliberada à guarda 1: o pedido vem de um botão, não de um clique na cena.
        set({
          mode: 'transitioning',
          focus: 'desk',
          view: null,
          hovered: null,
          highlightBox: null,
          playing: null,
          pcLaunch,
        })
      }
    },
  })),
)
