import type { ComponentType } from 'react'
import { AnimatePresence, MotionConfig } from 'motion/react'
import { getHotspot } from '@/content/hotspots'
import type { PanelKind } from '@/content/types'
import { selectFocus, selectMode } from '@/store/selectors'
import { useExperienceStore } from '@/store/useExperienceStore'
import { AboutPanel } from '../panels/AboutPanel'
import { GamesPanel } from '../panels/GamesPanel'
import { PrinterPanel } from '../panels/PrinterPanel'
import { BackButton } from './BackButton'
import { Hud } from './Hud'

// `os` (desk) não tem painel lateral: a UI vive dentro do monitor (Fase 2).
const PANELS: Partial<Record<PanelKind, ComponentType>> = {
  about: AboutPanel,
  printer: PrinterPanel,
  games: GamesPanel,
}

/**
 * DOM 2D por cima do Canvas. Sempre `pointer-events: none`; só os filhos interativos
 * recebem `auto` (e os painéis apenas em `focused`).
 *
 * `MotionConfig reducedMotion="user"`: com `prefers-reduced-motion`, TODA animação do motion aqui
 * dentro (HUD, botão Voltar, painéis) perde os deslocamentos e escalas e fica só nos esmaecimentos.
 */
export function Overlay() {
  const mode = useExperienceStore(selectMode)
  const focus = useExperienceStore(selectFocus)

  const hotspot = mode === 'focused' && focus ? getHotspot(focus) : null
  const Panel = hotspot ? PANELS[hotspot.panel] : undefined

  return (
    <MotionConfig reducedMotion="user">
      <div className="pointer-events-none fixed inset-0 z-10 overflow-hidden">
        <Hud />
        <BackButton />
        <AnimatePresence mode="wait">
          {hotspot && Panel ? <Panel key={hotspot.id} /> : null}
        </AnimatePresence>
      </div>
    </MotionConfig>
  )
}
