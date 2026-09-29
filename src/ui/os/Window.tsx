import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, ReactNode, RefObject } from 'react'
import { motion, useIsPresent } from 'motion/react'
import { MinusIcon, XIcon } from '@phosphor-icons/react'
import { OS_TEXT, type OsGlyphKey } from '@/content/os'
import type { CssVars } from './cssVars'
import { OsGlyph } from './OsGlyph'
import { useOsMotion } from './useOsMotion'
import { TASKBAR_HEIGHT_PCT, type WindowGeometry } from './windowManager'
import styles from './Window.module.css'

interface WindowProps {
  id: string
  title: string
  glyph: OsGlyphKey
  /** Cor de destaque do projeto (hex). Sem ela vale o mint do SO. */
  accent?: string
  /** Retângulo em % do desktop. */
  geometry: WindowGeometry
  z: number
  minimized: boolean
  active: boolean
  /** Raiz do Desktop: o arraste mede o tamanho RENDERIZADO dela (ver handlePointerMove). */
  desktopRef: RefObject<HTMLElement | null>
  onFocus: (id: string) => void
  onMinimize: (id: string) => void
  onClose: (id: string) => void
  onMove: (id: string, x: number, y: number) => void
  children: ReactNode
}

interface DragSession {
  pointerId: number
  startX: number
  startY: number
  originX: number
  originY: number
}

const TASKBAR_CENTER_PCT = 100 - TASKBAR_HEIGHT_PCT / 2

// Os botões da barra de título não iniciam arraste.
const stopPropagation = (event: ReactPointerEvent<HTMLElement>) => event.stopPropagation()

/**
 * Janela do SO. O posicionador (div) só cuida de posição e empilhamento, em % do desktop (cqw/cqh
 * do container do Desktop); a animação (escala, opacidade e deslocamento vertical) roda na seção
 * interna, então as duas coisas nunca disputam o mesmo `transform`.
 */
export function Window({
  id,
  title,
  glyph,
  accent,
  geometry,
  z,
  minimized,
  active,
  desktopRef,
  onFocus,
  onMinimize,
  onClose,
  onMove,
  children,
}: WindowProps) {
  const { reduced, duration, ease } = useOsMotion()
  // Durante a animação de saída a janela ainda está no DOM: já a tira da árvore de acessibilidade.
  const isPresent = useIsPresent()
  const hidden = minimized || !isPresent
  const sectionRef = useRef<HTMLElement>(null)
  const dragRef = useRef<DragSession | null>(null)
  const [dragging, setDragging] = useState(false)

  // Janela nova recebe o foco (teclado): senão ele ficaria no atalho, atrás dela.
  useEffect(() => {
    sectionRef.current?.focus({ preventScroll: true })
  }, [])

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    // Só botão principal (mouse), toque ou caneta; e uma sessão de arraste por vez.
    if (event.button !== 0 || dragRef.current) return
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      return
    }
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: geometry.x,
      originY: geometry.y,
    }
    setDragging(true)
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    const desktop = desktopRef.current
    if (!drag || !desktop || drag.pointerId !== event.pointerId) return
    // O delta em pixels da tela é convertido pelo tamanho RENDERIZADO do desktop. Com o drei
    // aplicando matrix3d/scale num ancestral, getBoundingClientRect() já devolve a caixa escalada,
    // e (delta / largura renderizada) continua sendo a fração certa do desktop.
    const rect = desktop.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return
    const x = drag.originX + ((event.clientX - drag.startX) / rect.width) * 100
    const y = drag.originY + ((event.clientY - drag.startY) / rect.height) * 100
    onMove(id, x, y)
  }

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    dragRef.current = null
    setDragging(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  // Minimizar: desce em direção à barra de tarefas. `y` em % da altura da própria janela.
  const minimizeY = `${((TASKBAR_CENTER_PCT - geometry.y - geometry.h / 2) / geometry.h) * 100}%`

  // % do desktop = cqw/cqh do container do Desktop (a camada das janelas tem tamanho zero).
  const positionStyle: CssVars = {
    left: `${geometry.x}cqw`,
    top: `${geometry.y}cqh`,
    width: `${geometry.w}cqw`,
    height: `${geometry.h}cqh`,
    zIndex: z,
    ...(accent ? { '--accent': accent } : null),
  }

  return (
    <div
      className={styles.positioner}
      style={positionStyle}
      data-state={!isPresent ? 'closing' : minimized ? 'minimized' : 'open'}
      data-minimized={minimized}
      data-active={active && !hidden}
      aria-hidden={hidden || undefined}
      inert={hidden}
      onPointerDownCapture={() => onFocus(id)}
    >
      <motion.section
        ref={sectionRef}
        role="dialog"
        aria-label={title}
        tabIndex={-1}
        className={styles.window}
        initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: '4%' }}
        animate={
          minimized
            ? reduced
              ? { opacity: 0 }
              : { opacity: 0, scale: 0.35, y: minimizeY }
            : { opacity: 1, scale: 1, y: '0%' }
        }
        exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: '3%' }}
        transition={{ duration, ease }}
      >
        <div
          className={styles.titlebar}
          data-dragging={dragging}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onLostPointerCapture={endDrag}
        >
          <span className={styles.titleGlyph} aria-hidden="true">
            <OsGlyph name={glyph} />
          </span>
          <span className={styles.title}>{title}</span>
          <div className={styles.controls} onPointerDown={stopPropagation}>
            <button
              type="button"
              className={styles.control}
              aria-label={OS_TEXT.window.minimize}
              title={OS_TEXT.window.minimize}
              onClick={() => onMinimize(id)}
            >
              <MinusIcon weight="regular" aria-hidden="true" />
            </button>
            <button
              type="button"
              className={`${styles.control} ${styles.controlClose}`}
              aria-label={OS_TEXT.window.close}
              title={OS_TEXT.window.close}
              onClick={() => onClose(id)}
            >
              <XIcon weight="regular" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className={styles.body}>{children}</div>
      </motion.section>
    </div>
  )
}
