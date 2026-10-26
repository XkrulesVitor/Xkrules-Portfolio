import type { OsGlyphKey } from '@/content/os'
import type { MediaImage } from '@/content/types'
import type { CssVars } from './cssVars'
import { AppGlyph } from './OsGlyph'
import styles from './DesktopIcon.module.css'

interface DesktopIconProps {
  label: string
  glyph: OsGlyphKey
  /** Ícone real do projeto: ocupa o ladrilho inteiro no lugar do glifo e do fundo colorido. */
  icon?: MediaImage
  /** Cor de destaque do projeto (hex). Só vale com tone="accent". */
  accent?: string
  /** `accent`: ladrilho colorido (projeto). `glass`: ladrilho de vidro (atalho do sistema). */
  tone?: 'accent' | 'glass'
  onOpen: () => void
}

/** Atalho da área de trabalho. Um clique (ou Enter) abre: funciona igual no toque e no teclado. */
export function DesktopIcon({ label, glyph, icon, accent, tone = 'accent', onOpen }: DesktopIconProps) {
  const style: CssVars | undefined = accent ? { '--accent': accent } : undefined
  const tileClass = icon ? styles.tileIcon : tone === 'glass' ? styles.tileGlass : styles.tile

  return (
    <li className={styles.item}>
      <button type="button" className={styles.icon} style={style} onClick={onOpen}>
        <span className={tileClass} aria-hidden="true">
          <AppGlyph name={glyph} icon={icon} />
        </span>
        <span className={styles.label}>{label}</span>
      </button>
    </li>
  )
}
