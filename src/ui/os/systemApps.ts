import type { OsGlyphKey, OsText } from '@/content/os'
import type { AppRef } from './windowManager'

export interface SystemApp {
  readonly app: AppRef
  /** Título no idioma do SO (o texto vem de `useOsText()`). */
  readonly title: (os: OsText) => string
  readonly glyph: OsGlyphKey
}

/**
 * Apps do sistema, na ordem em que aparecem na área de trabalho (coluna da esquerda) e no menu
 * iniciar. Os atalhos dos projetos web vêm de projects.web.ts, não daqui.
 */
export const SYSTEM_APPS: readonly SystemApp[] = [
  { app: { kind: 'projects' }, title: (os) => os.projects.title, glyph: 'folder' },
  { app: { kind: 'computer' }, title: (os) => os.apps.computer.title, glyph: 'computer' },
  { app: { kind: 'terminal' }, title: (os) => os.apps.terminal.title, glyph: 'terminal' },
  { app: { kind: 'credits' }, title: (os) => os.apps.credits.title, glyph: 'heart' },
]
