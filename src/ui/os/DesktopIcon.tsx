import type { OsGlyphKey } from '@/content/os'
import type { CssVars } from './cssVars'
import { OsGlyph } from './OsGlyph'
import styles from './DesktopIcon.module.css'

interface DesktopIconProps {
  label: string
  glyph: OsGlyphKey
  /** Cor de destaque do projeto (hex). Só vale com tone="accent". */
  accent?: string
  /** `accent`: ladrilho colorido (projeto). `glass`: ladrilho de vidro (atalho do sistema). */
  tone?: 'accent' | 'glass'
  onOpen: () => void
}

/** Atalho da área de trabalho. Um clique (ou Enter) abre: funciona igual no toque e no teclado. */
export function DesktopIcon({ label, glyph, accent, tone = 'accent', onOpen }: DesktopIconProps) {
  const style: CssVars | undefined = accent ? { '--accent': accent } : undefined

  return (
    <li className={styles.item}>
      <button type="button" className={styles.icon} style={style} onClick={onOpen}>
        <span className={tone === 'glass' ? styles.tileGlass : styles.tile} aria-hidden="true">
          <OsGlyph name={glyph} />
        </span>
        <span className={styles.label}>{label}</span>
      </button>
    </li>
  )
}
