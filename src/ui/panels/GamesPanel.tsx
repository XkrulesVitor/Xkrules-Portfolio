import { useEffect } from 'react'
import { DiceFiveIcon, GameControllerIcon, HandPointingIcon } from '@phosphor-icons/react'
import { motion, type Variants } from 'motion/react'
import { getHotspot } from '@/content/hotspots'
import { GAME_PROJECTS } from '@/content/projects.games'
import { UI_TEXT } from '@/content/site'
import type { GameKind, GameProject } from '@/content/types'
import { useExperienceStore } from '@/store/useExperienceStore'
import { Reveal, STAGGER, Tabs, type TabItem } from '../primitives'
import { GameCard } from './GameCard'
import { PanelIcon } from './PanelIcon'
import { PanelSection } from './PanelSection'
import { PanelShell } from './PanelShell'

// Ordem e ícone das abas. O rótulo vem de UI_TEXT.games[kind].
const KINDS: readonly { kind: GameKind; icon: typeof DiceFiveIcon }[] = [
  { kind: 'tabuleiro', icon: DiceFiveIcon },
  { kind: 'digital', icon: GameControllerIcon },
]

// Stagger dos cartões quando uma aba abre.
const LIST: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: STAGGER } },
}

function GameList({ kind, games }: { kind: GameKind; games: readonly GameProject[] }) {
  const t = UI_TEXT.games
  if (games.length === 0) return <p className="text-sm text-ink/75">{t.emptyTab}</p>
  return (
    <motion.ul
      aria-label={t.listLabel[kind]}
      variants={LIST}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-3"
    >
      {games.map((game) => (
        <li key={game.slug}>
          <Reveal>
            <GameCard game={game} />
          </Reveal>
        </li>
      ))}
    </motion.ul>
  )
}

interface GamesPanelProps {
  /** Jogos. Padrão: content/projects.games.ts. */
  games?: readonly GameProject[]
  /** Aba aberta ao montar. Padrão: tabuleiro. */
  defaultKind?: GameKind
  autoFocus?: boolean
}

/**
 * Painel do hotspot `shelf`: abas Tabuleiro e Digital / Game Jams. Hover ou foco num jogo destaca
 * a caixa dele na estante (`store.highlightBox`, ARCHITECTURE §6.4).
 */
export function GamesPanel({ games = GAME_PROJECTS, defaultKind = 'tabuleiro', autoFocus }: GamesPanelProps) {
  const t = UI_TEXT.games

  // Ao fechar o painel, nenhum destaque pode ficar preso na cena.
  useEffect(() => () => useExperienceStore.getState().setHighlightBox(null), [])

  const items: TabItem[] = KINDS.map(({ kind, icon }) => {
    const list = games.filter((game) => game.kind === kind)
    return {
      id: kind,
      label: t[kind],
      icon,
      count: list.length,
      content: <GameList kind={kind} games={list} />,
    }
  })

  return (
    <PanelShell
      hotspotId="shelf"
      eyebrow={t.eyebrow}
      subtitle={getHotspot('shelf').description}
      leading={<PanelIcon icon={GameControllerIcon} />}
      autoFocus={autoFocus}
    >
      <PanelSection>
        <p className="flex items-center gap-2 text-xs leading-snug text-ink/70 pointer-coarse:hidden">
          <HandPointingIcon size={16} weight="duotone" aria-hidden="true" className="shrink-0" />
          {t.hint}
        </p>
        <Tabs label={t.tabsLabel} items={items} defaultValue={defaultKind} />
      </PanelSection>
    </PanelShell>
  )
}
