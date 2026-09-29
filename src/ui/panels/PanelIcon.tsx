import type { Icon as PhosphorIcon } from '@phosphor-icons/react'

/** Ícone em ladrilho de vidro, à esquerda do título dos painéis. Decorativo. */
export function PanelIcon({ icon: Icon }: { icon: PhosphorIcon }) {
  return (
    <span
      aria-hidden="true"
      className="grid size-14 shrink-0 place-items-center rounded-2xl border border-[var(--glass-border-strong)] bg-linear-to-br from-accent-mint/25 to-accent-blue/20 text-accent-mint shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_8px_20px_-10px_rgb(0_0_0/0.6)]"
    >
      <Icon size={28} weight="duotone" />
    </span>
  )
}
