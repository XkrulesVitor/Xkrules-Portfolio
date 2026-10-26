import { memo, useId } from 'react'
import type { CSSProperties } from 'react'
import { ArrowUpRightIcon } from '@phosphor-icons/react'
import { COMPUTER_SHOWN_ITEMS, COMPUTER_SPEC_IDS, type ComputerSpecId, type OsText } from '@/content/os'
import { SITE } from '@/content/site'
import type { AboutContent } from '@/content/types'
import { useContent } from '../../i18n/useLocale'
import { fmt } from '../format'
import { OsGlyph } from '../OsGlyph'
import { OsTodoText } from '../OsTodoText'
import scope from '../scope.module.css'
import shared from '../shared.module.css'
import styles from './ThisComputerApp.module.css'

interface SpecRow {
  id: ComputerSpecId
  label: string
  note: string
  /** Pode conter marcadores [TODO: ...] (destacados pelo OsTodoText). */
  value: string
  /** Complemento em tom mais baixo, abaixo do valor. */
  detail?: string
  href?: string
}

/** Itens de um grupo de habilidades de about.ts; vazio quando o grupo não existe mais. */
function groupItems(about: AboutContent, label: string): readonly string[] {
  return about.skills.find((group) => group.label === label)?.items ?? []
}

/** Valor da linha vindo de um grupo de habilidades; sem o grupo, um [TODO] explícito. */
function groupValue(about: AboutContent, TEXT: OsText['computer'], label: string, limit?: number): string {
  const items = groupItems(about, label)
  if (items.length === 0) return fmt(TEXT.todo.group, { group: label })
  const shown = limit === undefined ? items : items.slice(0, limit)
  const rest = items.length - shown.length
  const joined = shown.join(' · ')
  return rest > 0 ? `${joined} ${fmt(TEXT.more, { n: rest })}` : joined
}

/**
 * Monta a tabela só com fatos de about.ts e site.ts (e o nome do SO). O que falta vira [TODO: ...]
 * explícito: nada de texto inventado. A "piada" é só a metáfora de cada linha (campo `note`).
 */
function buildRows(os: OsText, about: AboutContent): SpecRow[] {
  const TEXT = os.computer
  const cpuItems = groupItems(about, TEXT.skillGroups.cpu)
  const primaryLink = SITE.links[0]

  const values: Record<ComputerSpecId, Omit<SpecRow, 'id' | 'label' | 'note'>> = {
    device: { value: SITE.author },
    system: { value: os.name },
    cpu: {
      value: groupValue(about, TEXT, TEXT.skillGroups.cpu, COMPUTER_SHOWN_ITEMS),
      detail: cpuItems.length > 0 ? fmt(TEXT.cores, { n: cpuItems.length }) : undefined,
    },
    gpu: { value: groupValue(about, TEXT, TEXT.skillGroups.gpu), detail: TEXT.gpuNote },
    // about.ts não traz anos de experiência: fica pendente, à vista.
    memory: { value: TEXT.todo.memory },
    storage: { value: about.headline },
    workshop: { value: groupValue(about, TEXT, TEXT.skillGroups.workshop) },
    peripherals: { value: groupValue(about, TEXT, TEXT.skillGroups.peripherals) },
    lab: { value: groupValue(about, TEXT, TEXT.skillGroups.lab) },
    network: primaryLink
      ? { value: primaryLink.label, href: primaryLink.href }
      : { value: TEXT.todo.links },
    location: { value: about.location ?? TEXT.todo.location },
  }

  return COMPUTER_SPEC_IDS.map((id) => ({ id, ...TEXT.specs[id], ...values[id] }))
}

/**
 * Este Computador: a ficha técnica do autor em tom de brincadeira (processador = stack principal,
 * memória = anos de experiência...). Só fatos de about.ts e site.ts; o que falta é [TODO] visível.
 */
export const ThisComputerApp = memo(function ThisComputerApp() {
  const { os, about } = useContent()
  const TEXT = os.computer
  const rows = buildRows(os, about)
  const cores = groupItems(about, TEXT.skillGroups.cpu)
  const specsId = useId()
  const coresId = useId()

  return (
    <div className={`${scope.scope} ${styles.root}`}>
      <header className={styles.header}>
        <span className={styles.tile} aria-hidden="true">
          <OsGlyph name="computer" />
        </span>
        <div className={styles.who}>
          <p className={styles.eyebrow}>{TEXT.eyebrow}</p>
          <h2 className={styles.name}>{SITE.author}</h2>
          <p className={styles.os}>{os.name}</p>
        </div>
      </header>

      <section aria-labelledby={specsId}>
        <h3 id={specsId} className={styles.sectionLabel}>
          {TEXT.heading}
        </h3>
        <p className={styles.intro}>{TEXT.intro}</p>
        <dl className={styles.table} aria-label={TEXT.table}>
          {rows.map((row) => (
            <div key={row.id} className={styles.row}>
              <dt className={styles.label}>
                {row.label}
                <span className={styles.note}>{row.note}</span>
              </dt>
              <dd className={styles.value}>
                {row.href ? (
                  <a className={styles.link} href={row.href} target="_blank" rel="noreferrer">
                    {row.value}
                    <span className={styles.linkArrow} aria-hidden="true">
                      <ArrowUpRightIcon weight="regular" />
                    </span>
                    <span className={shared.srOnly}>{os.detail.newTab}</span>
                  </a>
                ) : (
                  <OsTodoText text={row.value} />
                )}
                {row.detail ? <span className={styles.detail}>{row.detail}</span> : null}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {cores.length > 0 ? (
        <section aria-labelledby={coresId} className={styles.coresSection}>
          <h3 id={coresId} className={styles.sectionLabel}>
            {TEXT.coresHeading}
          </h3>
          <p className={styles.intro}>{TEXT.coresHint}</p>
          <ul className={styles.cores} role="list">
            {cores.map((core, i) => (
              <li key={core} className={styles.core} style={{ '--i': i } as CSSProperties}>
                <span className={styles.meter} aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
                {core}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
})
