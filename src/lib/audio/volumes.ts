// Categorias de som que o visitante controla (Música, Ambiente, Efeitos), a curva de ganho dos buses
// e a preferência salva no navegador. Módulo FOLHA e puro (sem Web Audio, sem imports locais):
// importável pelo store e testado com `node --test`.

export const SOUND_CATEGORIES = ['music', 'ambient', 'effects'] as const
export type SoundCategory = (typeof SOUND_CATEGORIES)[number]
export type Volumes = Record<SoundCategory, number>

/**
 * Volumes de quem ainda não mexeu em nada. É também a REFERÊNCIA da mixagem: neste valor o bus da
 * categoria tem ganho 1, e as vozes (`mix.ts`) foram calibradas para soarem certas aqui. A música
 * entra bem baixinha de propósito.
 */
export const DEFAULT_VOLUMES: Readonly<Volumes> = { music: 0.35, ambient: 0.5, effects: 0.8 }

/** Limita a 0..1; entrada inválida (NaN) vira 0, nunca um volume alto por acidente. */
export function clampVolume(value: number): number {
  if (!(value > 0)) return 0
  return value > 1 ? 1 : value
}

/** Arredonda em passos de 1% (o que o slider mostra e o que vai para o localStorage). */
export function normalizeVolume(value: number): number {
  return Math.round(clampVolume(value) * 100) / 100
}

/**
 * Ganho do bus de uma categoria para um volume 0..1. Curva quadrática ("taper" de áudio) normalizada
 * no volume padrão: no padrão vale 1, abaixo cai com o quadrado e 0 é silêncio exato. Acima do
 * padrão sobe com o quadrado (o teto é folga para quem quer mais alto; o limitador do master cuida
 * dos picos).
 */
export function busGain(category: SoundCategory, volume: number): number {
  const ratio = clampVolume(volume) / DEFAULT_VOLUMES[category]
  return ratio * ratio
}

/** Preferência salva. Campo ausente = o visitante nunca escolheu aquilo. */
export interface SoundPrefs {
  muted?: boolean
  volumes?: Partial<Volumes>
}

export const SOUND_PREFS_KEY = 'portfolio3d:sound:v1'

/** O mínimo de `Storage` que usamos (facilita injetar um falso nos testes). */
export interface KeyValueStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

/** `window.localStorage`, ou `null` fora do browser ou com o armazenamento bloqueado. */
export function getBrowserStorage(): KeyValueStorage | null {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage ?? null
  } catch {
    return null
  }
}

/** Lê o texto salvo e devolve só o que é válido (JSON quebrado ou campos estranhos viram "nada"). */
export function parseSoundPrefs(raw: string | null | undefined): SoundPrefs {
  if (!raw) return {}
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return {}
  }
  if (typeof data !== 'object' || data === null) return {}
  const record = data as Record<string, unknown>
  const prefs: SoundPrefs = {}
  if (typeof record.muted === 'boolean') prefs.muted = record.muted
  if (typeof record.volumes === 'object' && record.volumes !== null) {
    const source = record.volumes as Record<string, unknown>
    const volumes: Partial<Volumes> = {}
    for (const category of SOUND_CATEGORIES) {
      const value = source[category]
      if (typeof value === 'number' && Number.isFinite(value)) volumes[category] = normalizeVolume(value)
    }
    if (Object.keys(volumes).length > 0) prefs.volumes = volumes
  }
  return prefs
}

export function serializeSoundPrefs(prefs: SoundPrefs): string {
  return JSON.stringify(prefs)
}

/** Lê a preferência do navegador. Nunca lança: sem armazenamento, volta `{}`. */
export function readSoundPrefs(storage: KeyValueStorage | null = getBrowserStorage()): SoundPrefs {
  if (!storage) return {}
  try {
    return parseSoundPrefs(storage.getItem(SOUND_PREFS_KEY))
  } catch {
    return {}
  }
}

/** Salva a preferência. Nunca lança: a página funciona sem localStorage. */
export function writeSoundPrefs(
  prefs: SoundPrefs,
  storage: KeyValueStorage | null = getBrowserStorage(),
): void {
  if (!storage) return
  try {
    storage.setItem(SOUND_PREFS_KEY, serializeSoundPrefs(prefs))
  } catch {
    // Cota cheia, modo privado ou bloqueio: a preferência só vale nesta sessão.
  }
}

/** Só os volumes que o visitante mudou em relação ao padrão (o resto segue o padrão atual do site). */
export function changedVolumes(volumes: Volumes): Partial<Volumes> {
  const changed: Partial<Volumes> = {}
  for (const category of SOUND_CATEGORIES) {
    if (volumes[category] !== DEFAULT_VOLUMES[category]) changed[category] = volumes[category]
  }
  return changed
}

/** Estado inicial do som no store a partir do que estava salvo. */
export interface InitialSound {
  muted: boolean
  /** O visitante já escolheu ligar ou silenciar (salvo): o "Entrar" não liga o som por ele. */
  soundChosen: boolean
  volumes: Volumes
}

export function initialSound(prefs: SoundPrefs): InitialSound {
  return {
    muted: prefs.muted ?? true,
    soundChosen: prefs.muted !== undefined,
    volumes: { ...DEFAULT_VOLUMES, ...prefs.volumes },
  }
}
