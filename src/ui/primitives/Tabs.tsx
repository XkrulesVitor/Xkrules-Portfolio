import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import type { Icon as PhosphorIcon } from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'motion/react'
import { cx } from './cx'
import { EASE, usePress, useReduceMotion } from './motion'
import { FOCUS_RING } from './styles'

export interface TabItem {
  id: string
  label: string
  icon?: PhosphorIcon
  /** Contador ao lado do rótulo (ex.: quantos itens a aba tem). */
  count?: number
  content: ReactNode
}

interface TabsProps {
  /** Nome acessível da lista de abas. */
  label: string
  items: readonly TabItem[]
  /** Modo controlado. Sem `value`, o componente guarda a aba ativa. */
  value?: string
  defaultValue?: string
  onValueChange?: (id: string) => void
  className?: string
}

/**
 * Abas em controle segmentado de vidro (padrão WAI-ARIA tablist): setas, Home e End movem o foco
 * e ativam a aba (roving tabindex). Só o painel ativo é montado, com crossfade curto.
 */
export function Tabs({ label, items, value, defaultValue, onValueChange, className }: TabsProps) {
  const uid = useId()
  const reduce = useReduceMotion()
  const press = usePress({ lift: false })
  const [inner, setInner] = useState(defaultValue ?? items[0]?.id ?? '')
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  const activeId = value ?? inner
  const found = items.findIndex((item) => item.id === activeId)
  const activeIndex = found < 0 ? 0 : found
  const active = items[activeIndex]

  const select = (id: string) => {
    if (value === undefined) setInner(id)
    onValueChange?.(id)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const last = items.length - 1
    let next = -1
    if (e.key === 'ArrowRight') next = activeIndex >= last ? 0 : activeIndex + 1
    else if (e.key === 'ArrowLeft') next = activeIndex <= 0 ? last : activeIndex - 1
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = last
    if (next < 0 || items.length === 0) return
    e.preventDefault()
    select(items[next].id)
    tabRefs.current[next]?.focus()
  }

  const tabDomId = (id: string) => uid + '-tab-' + id
  const panelDomId = (id: string) => uid + '-panel-' + id
  const pillId = uid + '-pill'

  return (
    <div className={cx('@container/tabs', className)}>
      <div
        role="tablist"
        aria-label={label}
        onKeyDown={onKeyDown}
        className="relative flex gap-1 rounded-full border border-[var(--glass-border)] bg-white/[0.04] p-1"
      >
        {items.map((item, i) => {
          const selected = i === activeIndex
          const Icon = item.icon
          return (
            <motion.button
              key={item.id}
              ref={(el) => {
                tabRefs.current[i] = el
              }}
              type="button"
              role="tab"
              id={tabDomId(item.id)}
              aria-selected={selected}
              aria-controls={selected ? panelDomId(item.id) : undefined}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(item.id)}
              {...press}
              className={cx(
                'relative flex min-h-9 min-w-0 flex-auto cursor-pointer items-center justify-center rounded-full px-2.5 py-1.5 text-sm font-medium whitespace-nowrap select-none pointer-coarse:min-h-11',
                'transition-colors duration-200 ease-glass',
                selected ? 'text-ink' : 'text-ink/65 hover:text-ink',
                FOCUS_RING,
              )}
            >
              {selected ? (
                <motion.span
                  layoutId={pillId}
                  aria-hidden="true"
                  transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 36 }}
                  className="absolute inset-0 rounded-full border border-white/20 bg-white/[0.12] shadow-[inset_0_1px_0_rgb(255_255_255/0.2),0_6px_16px_-8px_rgb(0_0_0/0.6)]"
                />
              ) : null}
              <span className="relative flex min-w-0 items-center justify-center gap-1.5">
                {Icon ? (
                  <Icon
                    size={16}
                    weight={selected ? 'duotone' : 'regular'}
                    aria-hidden="true"
                    className="shrink-0 @max-[23rem]/tabs:hidden"
                  />
                ) : null}
                <span className="truncate">{item.label}</span>
                {item.count !== undefined ? (
                  <span className="shrink-0 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] leading-none text-ink/80 tabular-nums">
                    {item.count}
                  </span>
                ) : null}
              </span>
            </motion.button>
          )
        })}
      </div>

      {/* initial={false}: a aba que já está aberta não anima a entrada (o pai cuida disso). */}
      <AnimatePresence mode="wait" initial={false}>
        {active ? (
          <motion.div
            key={active.id}
            role="tabpanel"
            id={panelDomId(active.id)}
            aria-labelledby={tabDomId(active.id)}
            initial={{ opacity: 0, y: reduce ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduce ? 0 : -4 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="mt-4"
          >
            {active.content}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
