import type { CSSProperties } from 'react'

/** `style` que aceita custom properties (`--accent`, `--taskbar-h`...) sem cast. */
export type CssVars = CSSProperties & { [K in `--${string}`]?: string | number }
