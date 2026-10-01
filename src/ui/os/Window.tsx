import { useEffect, useRef, useState } from 'react'
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent, ReactNode, RefObject } from 'react'
import { motion, useIsPresent } from 'motion/react'
import { CopyIcon, MinusIcon, SquareIcon, XIcon } from '@phosphor-icons/react'
import { OS_TEXT, type OsGlyphKey } from '@/content/os'
import type { CssVars } from './cssVars'
import { pointerDeltaPct } from './desktopPointer'
import { OsGlyph } from './OsGlyph'
import { ResizeHandles } from './ResizeHandles'
import { useOsMotion } from './useOsMotion'
import { TASKBAR_HEIGHT_PCT, type ResizeEdges, type WindowGeometry } from './windowManager'
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
  maximized: boolean
  active: boolean
  /**
   * O corpo vira uma coluna de altura definida e sem rolagem própria: o app preenche a janela e
   * decide o que rola (terminal, jogo). Sem isto o corpo rola e o app tem a altura do conteúdo.
   */
  fill?: boolean
  /** Raiz do Desktop: o arraste e o resize medem o tamanho RENDERIZADO dela (ver pointerDeltaPct). */
  desktopRef: RefObject<HTMLElement | null>
  onFocus: (id: string) => void
  onMinimize: (id: string) => void
  onToggleMaximize: (id: string) => void
  onClose: (id: string) => void
  onMove: (id: string, x: number, y: number) => void
  onResize: (id: string, edges: ResizeEdges, origin: WindowGeometry, dx: number, dy: number) => void
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

// Os botões da barra de título não iniciam arraste nem contam como duplo clique da barra.
const stopPropagation = (event: ReactPointerEvent<HTMLElement> | ReactMouseEvent<HTMLElement>) =>
  event.stopPropagation()

/**
 * Janela do SO. O posicionador (div) só cuida de posição e empilhamento, em % do desktop (cqw/cqh
 * do container do Desktop); a animação (escala, opacidade e deslocamento vertical) roda na seção
 * interna, então as duas coisas nunca disputam o mesmo `transform`. As alças de resize ficam no
 * posicionador, por fora da seção (que corta o excesso).
 */
export function Window({
  id,
  title,
  glyph,
  accent,
  geometry,
  z,
  minimized,
  maximized,
  active,
  fill = false,
  desktopRef,
  onFocus,
  onMinimize,
  onToggleMaximize,
  onClose,
  onMove,
  onResize,
  children,
}: WindowProps) {
  const { reduced, duration, ease } = useOsMotion()
  // Durante a animação de saída a janela ainda está no DOM: já a tira da árvore de acessibilidade.
  const isPresent = useIsPresent()
  const hidden = minimized || !isPresent
  const sectionRef = useRef<HTMLElement>(null)
  const dragRef = useRef<DragSession | null>(null)
  const [dragging, setDragging] = useState(false)
  const [resizing, setResizing] = useState(false)

  // Janela nova recebe o foco (teclado): senão ele ficaria no atalho, atrás dela. Um app que já
  // pegou o foco por conta própria (o campo do terminal) não o perde.
  useEffect(() => {
    const section = sectionRef.current
    if (section && !section.contains(document.activeElement)) section.focus({ preventScroll: true })
  }, [])

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    // Maximizada não se arrasta. Só botão principal (mouse), toque ou caneta; uma sessão por vez.
    if (maximized || event.button !== 0 || dragRef.current) return
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
    const delta = pointerDeltaPct(desktop, event.clientX - drag.startX, event.clientY - drag.startY)
    if (delta) onMove(id, drag.originX + delta.dx, drag.originY + delta.dy)
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

  const maximizeLabel = maximized ? OS_TEXT.window.restore : OS_TEXT.window.maximize

  return (
    <div
      className={styles.positioner}
      style={positionStyle}
      data-state={!isPresent ? 'closing' : minimized ? 'minimized' : 'open'}
      data-minimized={minimized}
      data-maximized={maximized}
      // Durante arraste e resize a geometria segue o ponteiro sem transição; maximizar e restaurar animam.
      data-interacting={dragging || resizing}
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
          data-maximized={maximized}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onLostPointerCapture={endDrag}
          onDoubleClick={() => onToggleMaximize(id)}
        >
          <span className={styles.titleGlyph} aria-hidden="true">
            <OsGlyph name={glyph} />
          </span>
          <span className={styles.title}>{title}</span>
          <div
            className={styles.controls}
            onPointerDown={stopPropagation}
            onDoubleClick={stopPropagation}
          >
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
              className={styles.control}
              aria-label={maximizeLabel}
              title={maximizeLabel}
              onClick={() => onToggleMaximize(id)}
            >
              {maximized ? (
                <CopyIcon weight="regular" aria-hidden="true" />
              ) : (
                <SquareIcon weight="regular" aria-hidden="true" />
              )}
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
        <div className={styles.body} data-fill={fill}>
          {children}
        </div>
        {/* Marca do canto de redimensionar (só visual). */}
        {maximized ? null : <span className={styles.grip} aria-hidden="true" />}
      </motion.section>
      {maximized ? null : (
        <ResizeHandles
          geometry={geometry}
          desktopRef={desktopRef}
          onResize={(edges, origin, dx, dy) => onResize(id, edges, origin, dx, dy)}
          onActiveChange={setResizing}
        />
      )}
    </div>
  )
}
