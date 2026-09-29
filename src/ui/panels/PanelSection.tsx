import { useId, type ReactNode } from 'react'
import { cx, Reveal } from '../primitives'

interface PanelSectionProps {
  /** Rótulo em caixa alta da seção. */
  title?: string
  /** Elemento à direita do rótulo (contador, ação). */
  action?: ReactNode
  className?: string
  children: ReactNode
}

/** Seção de um painel: entra em stagger (`Reveal`) e, com `title`, vira uma região nomeada. */
export function PanelSection({ title, action, className, children }: PanelSectionProps) {
  const headingId = useId()
  return (
    <Reveal>
      <section
        aria-labelledby={title ? headingId : undefined}
        className={cx('flex flex-col gap-3', className)}
      >
        {title ? (
          <div className="flex items-center justify-between gap-3">
            <h3 id={headingId} className="label-caps">
              {title}
            </h3>
            {action}
          </div>
        ) : null}
        {children}
      </section>
    </Reveal>
  )
}
