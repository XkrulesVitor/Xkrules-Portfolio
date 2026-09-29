import {
  ArrowSquareOutIcon,
  CodeIcon,
  EnvelopeSimpleIcon,
  GameControllerIcon,
  GithubLogoIcon,
  GlobeIcon,
  InstagramLogoIcon,
  LinkIcon,
  LinkedinLogoIcon,
  RocketLaunchIcon,
  StorefrontIcon,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react'
import { motion, type HTMLMotionProps } from 'motion/react'
import { UI_TEXT } from '@/content/site'
import type { ExternalLink, LinkKind } from '@/content/types'
import { cx } from './cx'
import { usePress } from './motion'
import { FOCUS_RING, LIFT_HITAREA } from './styles'

export type LinkButtonVariant = 'glass' | 'accent' | 'ghost'
export type LinkButtonSize = 'sm' | 'md'

export interface LinkButtonProps
  extends Omit<HTMLMotionProps<'a'>, 'children' | 'href' | 'target' | 'rel'> {
  link: ExternalLink
  variant?: LinkButtonVariant
  size?: LinkButtonSize
}

/** Ícone por kind (ExternalLink em content/types.ts). */
export const LINK_ICONS: Record<LinkKind, PhosphorIcon> = {
  github: GithubLogoIcon,
  linkedin: LinkedinLogoIcon,
  instagram: InstagramLogoIcon,
  itch: GameControllerIcon,
  site: GlobeIcon,
  store: StorefrontIcon,
  repo: CodeIcon,
  live: RocketLaunchIcon,
  email: EnvelopeSimpleIcon,
  other: LinkIcon,
}

const VARIANT: Record<LinkButtonVariant, string> = {
  glass:
    'border border-[var(--glass-border)] bg-[var(--glass-bg)] text-ink/90 hover:border-[var(--glass-border-strong)] hover:bg-[var(--glass-bg-hover)] hover:text-ink',
  accent:
    'border border-accent-mint/35 bg-accent-mint/10 text-accent-mint hover:border-accent-mint/60 hover:bg-accent-mint/20',
  ghost: 'border border-transparent text-ink/85 hover:bg-[var(--glass-bg-hover)] hover:text-ink',
}

const SIZE: Record<LinkButtonSize, string> = {
  sm: 'min-h-8 gap-1.5 px-3 text-xs pointer-coarse:min-h-10',
  md: 'min-h-10 gap-2 px-4 text-sm pointer-coarse:min-h-11',
}

/**
 * Link externo em pílula de vidro. Abre em nova aba (target=_blank com rel="noopener noreferrer")
 * e avisa leitores de tela. Links mailto: abrem o cliente de e-mail, sem nova aba.
 */
export function LinkButton({
  link,
  variant = 'glass',
  size = 'md',
  className,
  ...props
}: LinkButtonProps) {
  const press = usePress()
  const Icon = LINK_ICONS[link.kind]
  const opensNewTab = !link.href.startsWith('mailto:')
  const compact = size === 'sm'

  return (
    <motion.a
      href={link.href}
      target={opensNewTab ? '_blank' : undefined}
      rel={opensNewTab ? 'noopener noreferrer' : undefined}
      {...press}
      {...props}
      className={cx(
        'relative inline-flex max-w-full cursor-pointer items-center justify-center rounded-full font-medium select-none',
        'transition-colors duration-200 ease-glass',
        FOCUS_RING,
        LIFT_HITAREA,
        VARIANT[variant],
        SIZE[size],
        className,
      )}
    >
      <Icon
        size={compact ? 16 : 18}
        weight={compact ? 'regular' : 'duotone'}
        aria-hidden="true"
        className="shrink-0"
      />
      <span className="truncate">{link.label}</span>
      {opensNewTab ? (
        <>
          <ArrowSquareOutIcon
            size={compact ? 12 : 14}
            weight="regular"
            aria-hidden="true"
            className="shrink-0 opacity-60"
          />
          <span className="sr-only">, {UI_TEXT.link.newTab}</span>
        </>
      ) : null}
    </motion.a>
  )
}
