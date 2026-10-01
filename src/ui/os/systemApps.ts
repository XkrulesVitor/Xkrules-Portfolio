import { OS_TEXT, type OsGlyphKey } from '@/content/os'
import type { AppRef } from './windowManager'

export interface SystemApp {
  readonly app: AppRef
  readonly title: string
  readonly glyph: OsGlyphKey
}

/**
 * Apps do sistema, na ordem em que aparecem na área de trabalho (coluna da esquerda) e no menu
 * iniciar. Os atalhos dos projetos web vêm de projects.web.ts, não daqui.
 */
export const SYSTEM_APPS: readonly SystemApp[] = [
  { app: { kind: 'projects' }, title: OS_TEXT.projects.title, glyph: 'folder' },
  { app: { kind: 'computer' }, title: OS_TEXT.apps.computer.title, glyph: 'computer' },
  { app: { kind: 'terminal' }, title: OS_TEXT.apps.terminal.title, glyph: 'terminal' },
  { app: { kind: 'memory' }, title: OS_TEXT.apps.memory.title, glyph: 'puzzle' },
  { app: { kind: 'credits' }, title: OS_TEXT.apps.credits.title, glyph: 'heart' },
]
