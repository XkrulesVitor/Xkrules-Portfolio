import { CubeIcon, PrinterIcon } from '@phosphor-icons/react'
import { PRINT_SHOWCASE } from '@/content/projects.print'
import { UI_TEXT } from '@/content/site'
import type { PrintProject, PrintShowcase } from '@/content/types'
import { Carousel, fmt, GlassCard, LinkButton, SmartImage, Tag, TodoText } from '../primitives'
import { PanelIcon } from './PanelIcon'
import { PanelSection } from './PanelSection'
import { PanelShell } from './PanelShell'

const NUMBER = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })

interface Spec {
  key: string
  label: string
  value: string
}

/** Parâmetros de fatiamento presentes na peça, já formatados (pt-BR) e com unidade. */
function slicerSpecs(slicer: PrintProject['slicer']): Spec[] {
  if (!slicer) return []
  const t = UI_TEXT.printer
  const specs: Spec[] = []
  if (slicer.printer) specs.push({ key: 'printer', label: t.spec.printer, value: slicer.printer })
  if (slicer.layerHeightMm !== undefined) {
    const value = fmt(t.unit.layerHeight, { value: NUMBER.format(slicer.layerHeightMm) })
    specs.push({ key: 'layer', label: t.spec.layerHeight, value })
  }
  if (slicer.infillPercent !== undefined) {
    const value = fmt(t.unit.infill, { value: NUMBER.format(slicer.infillPercent) })
    specs.push({ key: 'infill', label: t.spec.infill, value })
  }
  if (slicer.supports) specs.push({ key: 'supports', label: t.spec.supports, value: slicer.supports })
  if (slicer.printTimeH !== undefined) {
    const value = fmt(t.unit.printTime, { value: NUMBER.format(slicer.printTimeH) })
    specs.push({ key: 'time', label: t.spec.printTime, value })
  }
  return specs
}

function PieceSlide({ piece }: { piece: PrintProject }) {
  const t = UI_TEXT.printer
  const cover = piece.images[0]
  const specs = slicerSpecs(piece.slicer)

  return (
    <GlassCard variant="inset" padding="none" className="h-full overflow-hidden">
      <div className="relative aspect-[4/3] w-full bg-white/[0.04]">
        {cover ? (
          <SmartImage image={cover} sizes="(min-width: 768px) 400px, 90vw" />
        ) : (
          <div className="grid h-full w-full place-items-center text-accent-mint/70">
            <CubeIcon size={40} weight="duotone" aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2.5 p-4">
        <div className="flex items-start justify-between gap-3">
          <h4 className="text-base leading-snug font-semibold text-ink">{piece.title}</h4>
          <Tag tone="mint" size="sm" className="mt-0.5">
            {t.material[piece.material]}
          </Tag>
        </div>
        <p className="text-sm leading-relaxed text-ink/80">
          <TodoText text={piece.summary} />
        </p>
        {specs.length > 0 ? (
          <div className="mt-1 border-t border-white/10 pt-3">
            <p className="label-caps">{t.specs}</p>
            <dl className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2.5">
              {specs.map((spec) => (
                <div key={spec.key} className="min-w-0">
                  <dt className="text-xs text-ink/65">{spec.label}</dt>
                  <dd className="mt-0.5 text-sm font-medium text-ink">{spec.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}
      </div>
    </GlassCard>
  )
}

/**
 * Estado vazio da vitrine: mesma proporção dos slides, com "camadas de impressão"
 * (linhas horizontais que somem para cima) e uma varredura de brilho lenta.
 */
function EmptyShowcase() {
  const t = UI_TEXT.printer
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-dashed border-[var(--glass-border-strong)] bg-white/[0.03]">
      <div
        aria-hidden="true"
        className="absolute inset-0 [background-image:repeating-linear-gradient(to_bottom,rgb(255_255_255/0.06)_0_1px,transparent_1px_7px)] [mask-image:linear-gradient(to_top,#000,transparent_88%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-3/5 bg-[radial-gradient(60%_100%_at_50%_100%,rgb(127_245_208/0.2),transparent)]"
      />
      <div
        aria-hidden="true"
        className="animate-glass-shimmer absolute inset-y-0 left-0 w-1/3 bg-linear-to-r from-transparent via-white/[0.07] to-transparent motion-reduce:animate-none"
      />
      <div className="relative flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
        <span
          aria-hidden="true"
          className="grid size-14 place-items-center rounded-2xl border border-[var(--glass-border)] bg-white/[0.06] text-accent-mint shadow-[inset_0_1px_0_rgb(255_255_255/0.14)]"
        >
          <CubeIcon size={28} weight="duotone" />
        </span>
        <p className="text-base font-semibold text-ink">{t.emptyTitle}</p>
        <p className="max-w-[28ch] text-sm leading-relaxed text-ink/75">{t.emptyBody}</p>
      </div>
    </div>
  )
}

interface PrinterPanelProps {
  /** Conteúdo. Padrão: content/projects.print.ts. */
  showcase?: PrintShowcase
  autoFocus?: boolean
}

/** Painel do hotspot `printer` (Reino de Amestris): descrição, vitrine de peças e links. */
export function PrinterPanel({ showcase = PRINT_SHOWCASE, autoFocus }: PrinterPanelProps) {
  const t = UI_TEXT.printer
  const pieces = showcase.projects

  return (
    <PanelShell
      hotspotId="printer"
      eyebrow={t.eyebrow}
      title={showcase.brand}
      subtitle={showcase.tagline}
      leading={<PanelIcon icon={PrinterIcon} />}
      autoFocus={autoFocus}
    >
      <PanelSection>
        <div className="flex flex-col gap-3 text-sm leading-relaxed text-ink/85">
          {showcase.description.map((paragraph, i) => (
            <p key={i}>
              <TodoText text={paragraph} />
            </p>
          ))}
        </div>
      </PanelSection>

      <PanelSection
        title={t.gallery}
        action={
          pieces.length > 0 ? (
            <Tag tone="mint" size="sm">
              {pieces.length}
            </Tag>
          ) : null
        }
      >
        {pieces.length > 0 ? (
          <Carousel
            label={t.galleryLabel}
            peek={pieces.length > 1}
            labels={{ prev: t.prev, next: t.next, slide: t.slide, goTo: t.goTo }}
          >
            {pieces.map((piece) => (
              <PieceSlide key={piece.slug} piece={piece} />
            ))}
          </Carousel>
        ) : (
          <EmptyShowcase />
        )}
      </PanelSection>

      {showcase.links.length > 0 ? (
        <PanelSection title={t.links}>
          <div className="flex flex-wrap gap-2">
            {showcase.links.map((link) => (
              <LinkButton key={link.href} link={link} />
            ))}
          </div>
        </PanelSection>
      ) : null}
    </PanelShell>
  )
}
