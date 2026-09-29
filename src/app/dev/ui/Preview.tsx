'use client'

import './rafShim' // precisa vir antes do motion (ver o arquivo)
import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CheckIcon,
  DiceFiveIcon,
  GameControllerIcon,
  GlobeIcon,
  XIcon,
} from '@phosphor-icons/react'
import { AnimatePresence, MotionConfig } from 'motion/react'
import { useExperienceStore } from '@/store/useExperienceStore'
import { Overlay } from '@/ui/overlay/Overlay'
import { AboutPanel } from '@/ui/panels/AboutPanel'
import { GamesPanel } from '@/ui/panels/GamesPanel'
import { PrinterPanel } from '@/ui/panels/PrinterPanel'
import {
  Carousel,
  cx,
  GlassCard,
  IconButton,
  Kbd,
  LinkButton,
  SmartImage,
  Tabs,
  Tag,
  TodoText,
} from '@/ui/primitives'
import { SceneBackdrop, type BackdropKind } from './SceneBackdrop'
import { SAMPLE_ABOUT, SAMPLE_COVERS, SAMPLE_GAMES, SAMPLE_LINKS, SAMPLE_PRINT } from './sampleData'

// Só em dev: ?reduced simula `prefers-reduced-motion: reduce`. Roda ao carregar o módulo, antes de
// qualquer render, porque o motion lê a preferência uma única vez, no primeiro `useReducedMotion`.
if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('reduced')) {
  const realMatchMedia = window.matchMedia.bind(window)
  window.matchMedia = (query: string): MediaQueryList => {
    if (!query.includes('prefers-reduced-motion')) return realMatchMedia(query)
    const fake = {
      matches: true,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }
    return fake as unknown as MediaQueryList
  }
}

type PanelChoice = 'all' | 'about' | 'printer' | 'games'
const PANEL_CHOICES: readonly { id: PanelChoice; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'about', label: 'Sobre' },
  { id: 'printer', label: 'Impressora' },
  { id: 'games', label: 'Games' },
]

interface Flags {
  still: boolean
  skip: boolean
  reduced: boolean
  zoom: number
  bg: BackdropKind
  panel: PanelChoice
}

function readFlags(): Flags {
  const q = new URLSearchParams(window.location.search)
  const zoom = Number(q.get('zoom'))
  return {
    still: q.has('still'),
    skip: q.has('skip'),
    reduced: q.has('reduced'),
    zoom: [0.5, 0.75, 1].includes(zoom) ? zoom : 0.75,
    bg: q.get('bg') === 'navy' ? 'navy' : 'scene',
    panel: PANEL_CHOICES.find((choice) => choice.id === q.get('panel'))?.id ?? 'all',
  }
}

const noopSubscribe = () => () => undefined
/** false no servidor e na hidratação, true depois. As molduras só renderizam no cliente. */
function useHydrated() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false)
}

// ---------------------------------------------------------------------------
// Estrutura da página
// ---------------------------------------------------------------------------

function Section({ id, title, note, children }: { id: string; title: string; note?: string; children: ReactNode }) {
  return (
    <section id={id} className="mt-14 scroll-mt-6">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {note ? <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-ink/70">{note}</p> : null}
      <div className="mt-6">{children}</div>
    </section>
  )
}

/** Bloco de demonstração: o interior imita o que os painéis têm (vidro fumê sobre a cena). */
function Demo({ title, note, className, children }: { title: string; note?: string; className?: string; children: ReactNode }) {
  return (
    <div className={cx('flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5', className)}>
      <div>
        <p className="label-caps">{title}</p>
        {note ? <p className="mt-1.5 text-xs leading-relaxed text-ink/70">{note}</p> : null}
      </div>
      {children}
    </div>
  )
}

function Row({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('flex flex-wrap items-center gap-2', className)}>{children}</div>
}

function Toggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cx(
        'cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-mint',
        active
          ? 'border-accent-mint/50 bg-accent-mint/15 text-accent-mint'
          : 'border-[var(--glass-border)] text-ink/75 hover:bg-white/10 hover:text-ink',
      )}
    >
      {children}
    </button>
  )
}

interface FrameProps {
  label: string
  width: number
  height: number
  zoom: number
  backdrop: BackdropKind
  footer?: ReactNode
  children: ReactNode
}

/** Moldura `position: relative` do tamanho de uma tela. O painel se posiciona dentro dela. */
function Frame({ label, width, height, zoom, backdrop, footer, children }: FrameProps) {
  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="label-caps">
        {label} · {width}×{height}
      </figcaption>
      <div style={{ width: width * zoom, height: height * zoom }} className="shrink-0">
        <div
          style={{ width, height, transform: 'scale(' + zoom + ')', transformOrigin: 'top left' }}
          className="relative isolate overflow-hidden rounded-xl border border-white/10"
        >
          <SceneBackdrop kind={backdrop} />
          {children}
        </div>
      </div>
      {footer}
    </figure>
  )
}

function HighlightReadout() {
  const highlightBox = useExperienceStore((s) => s.highlightBox)
  return (
    <p className="font-mono text-xs text-ink/70">
      store.highlightBox = <span className="text-accent-mint">{String(highlightBox)}</span>
    </p>
  )
}

// ---------------------------------------------------------------------------
// Primitivas
// ---------------------------------------------------------------------------

function CoverSlide({ src, alt }: { src: string; alt: string }) {
  return (
    <GlassCard variant="inset" padding="none" className="overflow-hidden">
      <div className="relative aspect-[4/3] w-full">
        <SmartImage image={{ src, alt }} sizes="400px" />
      </div>
    </GlassCard>
  )
}

const SWATCHES = [
  { name: 'bg-canvas', value: '#0b1020', className: 'bg-bg-canvas' },
  { name: 'ink', value: '#eaf0ff', className: 'bg-ink' },
  { name: 'accent-mint', value: '#7ff5d0', className: 'bg-accent-mint' },
  { name: 'accent-blue', value: '#6aa8ff', className: 'bg-accent-blue' },
  { name: 'wood', value: '#a8704a', className: 'bg-wood' },
  { name: 'todo', value: '#ffc95c', className: 'bg-todo' },
] as const

function Primitives({ bg }: { bg: BackdropKind }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Demo
        className="lg:col-span-2"
        title="GlassCard"
        note="surface (fill 6% + blur 18px), smoked (sobre tinta navy), inset (sem blur, para dentro de outro vidro) e interactive (hover eleva 2px, borda realça). O fundo segue o controle acima."
      >
        <div className="relative isolate overflow-hidden rounded-xl">
          <SceneBackdrop kind={bg} />
          <div className="relative grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
            <GlassCard variant="surface">
              <p className="label-caps">surface</p>
              <p className="mt-2 text-sm text-ink">Sobre fundo claro o texto perde contraste. Use sobre áreas escuras.</p>
            </GlassCard>
            <GlassCard variant="smoked">
              <p className="label-caps">smoked</p>
              <p className="mt-2 text-sm text-ink">Tinta navy sob o vidro: legível também sobre as paredes claras da cena.</p>
            </GlassCard>
            <GlassCard variant="smoked" interactive tabIndex={0}>
              <p className="label-caps">smoked + interactive</p>
              <p className="mt-2 text-sm text-ink">Passe o mouse ou foque com Tab.</p>
            </GlassCard>
            <GlassCard variant="smoked" padding="lg">
              <p className="label-caps">aninhado</p>
              <GlassCard variant="inset" padding="sm" className="mt-3">
                <p className="text-sm text-ink">inset dentro de smoked</p>
              </GlassCard>
            </GlassCard>
          </div>
        </div>
      </Demo>

      <Demo title="Tabs" note="tablist com setas, Home e End (foque uma aba). Foco visível em mint. Só o painel ativo é montado.">
        <Tabs
          label="Exemplo de abas"
          items={[
            { id: 'a', label: 'Tabuleiro', icon: DiceFiveIcon, count: 2, content: <p className="text-sm text-ink/85">Conteúdo da primeira aba.</p> },
            { id: 'b', label: 'Digital / Game Jams', icon: GameControllerIcon, count: 3, content: <p className="text-sm text-ink/85">Conteúdo da segunda aba.</p> },
            { id: 'c', label: 'Sem ícone', content: <p className="text-sm text-ink/85">Terceira aba, sem ícone nem contador.</p> },
          ]}
        />
      </Demo>

      <Demo title="IconButton" note="Ícones Phosphor, peso regular em controles pequenos. aria-disabled apaga o botão sem tirar o foco dele; disabled tira.">
        <Row>
          <IconButton label="Anterior (glass, sm)" icon={CaretLeftIcon} size="sm" />
          <IconButton label="Próximo (glass, md)" icon={CaretRightIcon} />
          <IconButton label="Fechar (ghost, sm)" icon={XIcon} variant="ghost" size="sm" />
          <IconButton label="Confirmar (ghost, md)" icon={CheckIcon} variant="ghost" />
          <IconButton label="Inativo (aria-disabled)" icon={ArrowLeftIcon} aria-disabled />
          <IconButton label="Inativo (disabled)" icon={ArrowRightIcon} disabled />
        </Row>
      </Demo>
      <PrimitivesMore />
      <PrimitivesLast />
    </div>
  )
}

function PrimitivesMore() {
  return (
    <>
      <Demo title="Carousel" note="scroll-snap nativo. Setas, pontos e teclado: foque o trilho (Tab) e use as setas, Home e End. O fim do trilho apaga a seta.">
        <Carousel label="Exemplo de carrossel">
          {SAMPLE_COVERS.map((src, i) => (
            <CoverSlide key={i} src={src} alt={'Capa de exemplo ' + (i + 1)} />
          ))}
        </Carousel>
      </Demo>

      <Demo title="Carousel · peek" note="Com peek, o próximo slide aparece pela borda. Abaixo, um carrossel de um slide só (sem controles).">
        <Carousel label="Exemplo com espiada" peek>
          {SAMPLE_COVERS.map((src, i) => (
            <CoverSlide key={i} src={src} alt={'Capa de exemplo ' + (i + 1)} />
          ))}
        </Carousel>
        <Carousel label="Exemplo com um slide">
          <CoverSlide src={SAMPLE_COVERS[0]} alt="Capa de exemplo" />
        </Carousel>
      </Demo>

      <Demo title="Kbd" note="Tecla em vidro, para dicas de teclado.">
        <Row>
          <Kbd>Esc</Kbd>
          <Kbd>←</Kbd>
          <Kbd>→</Kbd>
          <Kbd>Home</Kbd>
          <Kbd>End</Kbd>
          <span className="inline-flex items-center gap-1 text-sm text-ink/80">
            <Kbd>Ctrl</Kbd>+<Kbd>K</Kbd>
          </span>
        </Row>
      </Demo>

      <Demo title="Tag" note="neutral, mint e blue; tamanhos md e sm; com ícone; e com marcador [TODO: ...] destacado.">
        <Row>
          <Tag>Next.js</Tag>
          <Tag tone="mint">Resina</Tag>
          <Tag tone="blue">Game Jam CrazyGames</Tag>
          <Tag size="sm" icon={GlobeIcon}>
            2026
          </Tag>
          <Tag size="sm" tone="mint">
            sm
          </Tag>
          <Tag>
            <TodoText text="Modelagem 3D [TODO: software]" />
          </Tag>
        </Row>
      </Demo>
    </>
  )
}

function PrimitivesLast() {
  return (
    <>
      <Demo
        className="lg:col-span-2"
        title="LinkButton"
        note="Ícone por kind (github, linkedin, instagram, itch, site, store, repo, live, email, other). Abre em nova aba com rel noopener noreferrer; mailto: não abre aba."
      >
        <Row>
          {SAMPLE_LINKS.map((link) => (
            <LinkButton key={link.kind} link={link} />
          ))}
        </Row>
        <Row>
          <LinkButton link={SAMPLE_LINKS[6]} variant="accent" />
          <LinkButton link={SAMPLE_LINKS[0]} variant="ghost" />
          <LinkButton link={SAMPLE_LINKS[0]} size="sm" />
          <LinkButton link={SAMPLE_LINKS[7]} size="sm" variant="accent" />
          <div className="w-56">
            <LinkButton
              link={{ label: 'Um rótulo bem comprido para testar o truncamento do botão', href: 'https://example.com', kind: 'other' }}
              className="w-full"
            />
          </div>
        </Row>
      </Demo>

      <Demo title="TodoText" note="Conteúdo que falta fica visível: [TODO: ...] vira um chip âmbar tracejado.">
        <p className="text-sm leading-relaxed text-ink/85">
          <TodoText text="Estou no 3º [TODO: ano ou período] de Engenharia de Software. Resumo: [TODO: descrever]." />
        </p>
      </Demo>

      <Demo title="Tokens" note="Cores de acento e do fundo (globals.css, @theme).">
        <div className="flex flex-wrap gap-3">
          {SWATCHES.map((swatch) => (
            <div key={swatch.name} className="flex items-center gap-2">
              <span className={cx('size-6 rounded-md border border-white/20', swatch.className)} />
              <span className="font-mono text-[11px] leading-tight text-ink/75">
                {swatch.name}
                <br />
                {swatch.value}
              </span>
            </div>
          ))}
        </div>
      </Demo>
    </>
  )
}

// ---------------------------------------------------------------------------
// Painéis
// ---------------------------------------------------------------------------

const DESKTOP = { w: 1280, h: 720 }
const TABLET = { w: 900, h: 620 }
const MOBILE = { w: 390, h: 844 }

interface PanelFrameProps {
  label: string
  size: { w: number; h: number }
  zoom: number
  backdrop: BackdropKind
  still: boolean
  footer?: ReactNode
  /** Um único painel com `key` (o AnimatePresence precisa dela). */
  children: ReactNode
}

function PanelFrame({ label, size, zoom, backdrop, still, footer, children }: PanelFrameProps) {
  return (
    <Frame label={label} width={size.w} height={size.h} zoom={zoom} backdrop={backdrop} footer={footer}>
      {/* initial={!still}: com ?still o painel já nasce no estado final (útil com o browser oculto). */}
      <AnimatePresence initial={!still}>{children}</AnimatePresence>
    </Frame>
  )
}

interface FramesProps {
  zoom: number
  backdrop: BackdropKind
  still: boolean
  run: number
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="mb-4 text-base font-semibold">{title}</h3>
      <div className="flex flex-wrap items-start gap-8">{children}</div>
    </div>
  )
}

function AboutFrames({ run, ...common }: FramesProps) {
  return (
    <Group title="AboutPanel · chair (lado direito)">
      <PanelFrame {...common} label="Conteúdo real" size={DESKTOP}>
        <AboutPanel key={'about-' + run} autoFocus={false} />
      </PanelFrame>
      <PanelFrame {...common} label="Conteúdo real · mobile" size={MOBILE}>
        <AboutPanel key={'about-m-' + run} autoFocus={false} />
      </PanelFrame>
      <PanelFrame {...common} label="Exemplo: avatar, cidade e todos os links" size={DESKTOP}>
        <AboutPanel key={'about-s-' + run} content={SAMPLE_ABOUT} autoFocus={false} />
      </PanelFrame>
    </Group>
  )
}

function PrinterFrames({ run, ...common }: FramesProps) {
  return (
    <Group title="PrinterPanel · printer (lado direito)">
      <PanelFrame {...common} label="Conteúdo real (vitrine vazia)" size={DESKTOP}>
        <PrinterPanel key={'printer-' + run} autoFocus={false} />
      </PanelFrame>
      <PanelFrame {...common} label="Conteúdo real · mobile" size={MOBILE}>
        <PrinterPanel key={'printer-m-' + run} autoFocus={false} />
      </PanelFrame>
      <PanelFrame {...common} label="Exemplo: carrossel, specs e links" size={DESKTOP}>
        <PrinterPanel key={'printer-s-' + run} showcase={SAMPLE_PRINT} autoFocus={false} />
      </PanelFrame>
      <PanelFrame {...common} label="Exemplo · mobile" size={MOBILE}>
        <PrinterPanel key={'printer-sm-' + run} showcase={SAMPLE_PRINT} autoFocus={false} />
      </PanelFrame>
    </Group>
  )
}

function GamesFrames({ run, ...common }: FramesProps) {
  return (
    <Group title="GamesPanel · shelf (lado esquerdo)">
      <PanelFrame {...common} label="Conteúdo real · aba Tabuleiro" size={DESKTOP} footer={<HighlightReadout />}>
        <GamesPanel key={'games-' + run} autoFocus={false} />
      </PanelFrame>
      <PanelFrame {...common} label="Conteúdo real · aba Digital" size={DESKTOP}>
        <GamesPanel key={'games-d-' + run} defaultKind="digital" autoFocus={false} />
      </PanelFrame>
      <PanelFrame {...common} label="Conteúdo real · mobile · aba Digital" size={MOBILE}>
        <GamesPanel key={'games-m-' + run} defaultKind="digital" autoFocus={false} />
      </PanelFrame>
      <PanelFrame {...common} label="Exemplo: capa, links e texto longo · aba Digital" size={DESKTOP}>
        <GamesPanel key={'games-s-' + run} games={SAMPLE_GAMES} defaultKind="digital" autoFocus={false} />
      </PanelFrame>
    </Group>
  )
}

function Panels({ choice, ...frames }: FramesProps & { choice: PanelChoice }) {
  return (
    <div className="flex flex-col gap-12">
      {choice === 'all' || choice === 'about' ? <AboutFrames {...frames} /> : null}
      {choice === 'all' || choice === 'printer' ? <PrinterFrames {...frames} /> : null}
      {choice === 'all' || choice === 'games' ? <GamesFrames {...frames} /> : null}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Overlay real (integração)
// ---------------------------------------------------------------------------

type OverlayFocus = 'chair' | 'printer' | 'shelf' | 'desk' | 'idle'
const OVERLAY_FOCUS: readonly { id: OverlayFocus; label: string }[] = [
  { id: 'chair', label: 'chair' },
  { id: 'printer', label: 'printer' },
  { id: 'shelf', label: 'shelf' },
  { id: 'desk', label: 'desk (sem painel)' },
  { id: 'idle', label: 'idle (HUD)' },
]

/**
 * O Overlay verdadeiro (Hud, BackButton e o roteamento de painéis pelo store) dentro de molduras.
 * A moldura tem `transform`, que vira o bloco de contenção do `fixed inset-0` do Overlay: ele
 * ocupa a moldura, não a janela. Sem Canvas: o foco é escolhido direto no store.
 */
function OverlayFrames({ zoom, backdrop }: { zoom: number; backdrop: BackdropKind }) {
  return (
    <div className="flex flex-wrap items-start gap-8">
      <Frame label="Overlay real" width={DESKTOP.w} height={DESKTOP.h} zoom={zoom} backdrop={backdrop}>
        <Overlay />
      </Frame>
      <Frame label="Overlay real · tablet (BackButton sobre o painel)" width={TABLET.w} height={TABLET.h} zoom={zoom} backdrop={backdrop}>
        <Overlay />
      </Frame>
      <Frame label="Overlay real · mobile" width={MOBILE.w} height={MOBILE.h} zoom={zoom} backdrop={backdrop}>
        <Overlay />
      </Frame>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------

function PreviewBody() {
  const [flags] = useState(readFlags)
  const [zoom, setZoom] = useState(flags.zoom)
  const [bg, setBg] = useState<BackdropKind>(flags.bg)
  const [choice, setChoice] = useState<PanelChoice>(flags.panel)
  const [run, setRun] = useState(0)

  const [overlayFocus, setOverlayFocus] = useState<OverlayFocus>('shelf')

  // Guarda o store e o restaura ao sair da página.
  useEffect(() => {
    const before = useExperienceStore.getState()
    const snapshot = { mode: before.mode, focus: before.focus, highlightBox: before.highlightBox }
    return () => useExperienceStore.setState(snapshot)
  }, [])

  // O GamesPanel só destaca caixas com o store em `focused` (guarda do setHighlightBox), e o
  // Overlay real escolhe o painel por `focus`. Um único store, então um único foco por vez.
  useEffect(() => {
    if (overlayFocus === 'idle') {
      useExperienceStore.setState({ mode: 'idle', focus: null, highlightBox: null })
    } else {
      useExperienceStore.setState({ mode: 'focused', focus: overlayFocus })
    }
  }, [overlayFocus])

  return (
    <MotionConfig skipAnimations={flags.skip}>
      <main className="mx-auto max-w-[1500px] px-6 py-10">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight">UI · primitivas e painéis</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink/70">
            Fase 1 (BACKLOG 1.1 a 1.3), sem Canvas. Os painéis rodam dentro de molduras do tamanho de uma tela: o layout
            responde ao container, então a moldura de 390×844 vira bottom-sheet de verdade.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-3">
            <div className="flex items-center gap-2">
              <span className="label-caps">Fundo</span>
              <Toggle active={bg === 'scene'} onClick={() => setBg('scene')}>
                Cena clara
              </Toggle>
              <Toggle active={bg === 'navy'} onClick={() => setBg('navy')}>
                Navy
              </Toggle>
            </div>
            <div className="flex items-center gap-2">
              <span className="label-caps">Zoom</span>
              {[0.5, 0.75, 1].map((value) => (
                <Toggle key={value} active={zoom === value} onClick={() => setZoom(value)}>
                  {Math.round(value * 100)}%
                </Toggle>
              ))}
            </div>
            <div className="flex items-center gap-2">
            <span className="label-caps">Painéis</span>
            {PANEL_CHOICES.map((option) => (
              <Toggle key={option.id} active={choice === option.id} onClick={() => setChoice(option.id)}>
                {option.label}
              </Toggle>
            ))}
          </div>
          <Toggle active={false} onClick={() => setRun((r) => r + 1)}>
              Reiniciar painéis
            </Toggle>
            <p className="font-mono text-xs text-ink/60">
              still={String(flags.still)} · skip={String(flags.skip)} · reduced={String(flags.reduced)}
            </p>
          </div>
          <nav aria-label="Seções" className="mt-4 flex gap-4 text-sm text-accent-blue">
            <a href="#primitives" className="underline-offset-4 hover:underline">
              Primitivas
            </a>
            <a href="#panels" className="underline-offset-4 hover:underline">
              Painéis
            </a>
            <a href="#overlay" className="underline-offset-4 hover:underline">
              Overlay real
            </a>
          </nav>
        </header>

        <Section id="primitives" title="Primitivas (1.1)">
          <Primitives bg={bg} />
        </Section>

        <Section
          id="panels"
          title="Painéis (1.3)"
          note="Cada painel aparece com o conteúdo real e, quando ajuda, com dados de exemplo (só desta página). Passe o mouse ou foque um jogo para ver store.highlightBox mudar."
        >
          <Panels zoom={zoom} backdrop={bg} still={flags.still} run={run} choice={choice} />
        </Section>

        <Section
          id="overlay"
          title="Overlay real (integração)"
          note="O Overlay do app, com o painel escolhido pelo store. Sem Canvas: o foco vai direto para o store. Trocar de foco exercita o AnimatePresence do Overlay (saída, depois entrada)."
        >
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="label-caps mr-2">store.focus</span>
            {OVERLAY_FOCUS.map((option) => (
              <Toggle key={option.id} active={overlayFocus === option.id} onClick={() => setOverlayFocus(option.id)}>
                {option.label}
              </Toggle>
            ))}
          </div>
          <OverlayFrames zoom={zoom} backdrop={bg} />
        </Section>
      </main>
    </MotionConfig>
  )
}

export function Preview() {
  const hydrated = useHydrated()
  if (!hydrated) return <p className="p-8 text-sm text-ink/70">Carregando a pré-visualização...</p>
  return <PreviewBody />
}
