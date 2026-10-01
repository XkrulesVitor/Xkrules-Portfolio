import { useRef } from 'react'
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react'
import { OS_TEXT } from '@/content/os'
import { pointerDeltaPct } from './desktopPointer'
import type { ResizeEdges, WindowGeometry } from './windowManager'
import styles from './ResizeHandles.module.css'

type HandleName = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

const HANDLES: readonly { name: HandleName; edges: ResizeEdges }[] = [
  { name: 'n', edges: { top: true } },
  { name: 's', edges: { bottom: true } },
  { name: 'e', edges: { right: true } },
  { name: 'w', edges: { left: true } },
  { name: 'ne', edges: { top: true, right: true } },
  { name: 'nw', edges: { top: true, left: true } },
  { name: 'se', edges: { bottom: true, right: true } },
  { name: 'sw', edges: { bottom: true, left: true } },
]

interface ResizeSession {
  pointerId: number
  startX: number
  startY: number
  origin: WindowGeometry
}

interface ResizeHandleProps {
  name: HandleName
  edges: ResizeEdges
  geometry: WindowGeometry
  desktopRef: RefObject<HTMLElement | null>
  onResize: (edges: ResizeEdges, origin: WindowGeometry, dx: number, dy: number) => void
  onActiveChange: (active: boolean) => void
}

function ResizeHandle({ name, edges, geometry, desktopRef, onResize, onActiveChange }: ResizeHandleProps) {
  const sessionRef = useRef<ResizeSession | null>(null)

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || sessionRef.current) return
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      return
    }
    sessionRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin: geometry,
    }
    onActiveChange(true)
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const session = sessionRef.current
    const desktop = desktopRef.current
    if (!session || !desktop || session.pointerId !== event.pointerId) return
    const delta = pointerDeltaPct(desktop, event.clientX - session.startX, event.clientY - session.startY)
    if (delta) onResize(edges, session.origin, delta.dx, delta.dy)
  }

  const endResize = (event: ReactPointerEvent<HTMLDivElement>) => {
    const session = sessionRef.current
    if (!session || session.pointerId !== event.pointerId) return
    sessionRef.current = null
    onActiveChange(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  return (
    <div
      className={styles.handle}
      data-handle={name}
      title={OS_TEXT.window.resize}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endResize}
      onPointerCancel={endResize}
      onLostPointerCapture={endResize}
    />
  )
}

interface ResizeHandlesProps {
  geometry: WindowGeometry
  desktopRef: RefObject<HTMLElement | null>
  onResize: (edges: ResizeEdges, origin: WindowGeometry, dx: number, dy: number) => void
  onActiveChange: (active: boolean) => void
}

/**
 * Oito alças invisíveis (4 bordas e 4 cantos) em volta da janela. Cada uma segura o ponteiro
 * (setPointerCapture) e manda à janela o deslocamento TOTAL desde o início do gesto, em % do desktop;
 * o reducer (windowManager.ts) aplica tamanho mínimo e prende a janela à área de trabalho.
 * Decorativas para leitores de tela (o redimensionar é só de ponteiro).
 */
export function ResizeHandles(props: ResizeHandlesProps) {
  return (
    <div className={styles.handles} aria-hidden="true">
      {HANDLES.map((handle) => (
        <ResizeHandle key={handle.name} name={handle.name} edges={handle.edges} {...props} />
      ))}
    </div>
  )
}
