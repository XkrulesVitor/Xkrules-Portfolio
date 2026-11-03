import { useId } from 'react'
import { motion } from 'motion/react'
import type { SkillGroup } from '@/content/types'
import { useContent } from '../../i18n/useLocale'
import { Reveal, Tag, TodoText } from '../../primitives'
import { PanelSection } from '../PanelSection'
import { STAGGER_LIST } from './stagger'

/** Um grupo: rótulo à esquerda e as tags à direita (empilhados em telas estreitas). O 1º grupo é a stack principal. */
function SkillRow({ group, primary }: { group: SkillGroup; primary: boolean }) {
  const labelId = useId()
  return (
    <div className="grid grid-cols-[7.25rem_1fr] items-baseline gap-x-3 gap-y-1.5 @max-3xl:grid-cols-1">
      <p id={labelId} className="text-xs leading-snug font-medium text-ink/70">
        {group.label}
      </p>
      <ul aria-labelledby={labelId} role="list" className="flex flex-wrap gap-1.5">
        {group.items.map((item) => (
          <li key={item}>
            <Tag tone={primary ? 'mint' : 'neutral'}>
              <TodoText text={item} />
            </Tag>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Seção "Habilidades": grupos de tecnologias em tags, densos mas legíveis. */
export function SkillsSection({ skills }: { skills: readonly SkillGroup[] }) {
  const t = useContent().ui.about
  if (skills.length === 0) return null

  return (
    <PanelSection title={t.skills}>
      <motion.div variants={STAGGER_LIST} className="flex flex-col gap-3.5">
        {skills.map((group, i) => (
          <Reveal key={group.label}>
            <SkillRow group={group} primary={i === 0} />
          </Reveal>
        ))}
      </motion.div>
    </PanelSection>
  )
}
