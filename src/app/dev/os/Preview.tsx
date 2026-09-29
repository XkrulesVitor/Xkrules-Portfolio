'use client'

import { useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import type { WebProject } from '@/content/types'
import { ProjectsApp } from '@/ui/os/apps/ProjectsApp'
import { ProjectWindow } from '@/ui/os/apps/ProjectWindow'
import { Desktop } from '@/ui/os/Desktop'
import { MonitorScreen } from '@/ui/os/MonitorScreen'

// Página de desenvolvimento: os rótulos abaixo não são conteúdo do site.

/** Gera uma "captura" sintética (SVG inline) para exercitar o visor de imagens. */
function fakeShot(label: string, from: string, to: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="800" viewBox="0 0 1280 800">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/>` +
    `<stop offset="1" stop-color="${to}"/></linearGradient></defs>` +
    `<rect width="1280" height="800" fill="url(#g)"/>` +
    `<rect x="80" y="80" width="1120" height="64" rx="16" fill="rgba(255,255,255,.18)"/>` +
    `<rect x="80" y="200" width="640" height="420" rx="24" fill="rgba(255,255,255,.14)"/>` +
    `<rect x="760" y="200" width="440" height="200" rx="24" fill="rgba(255,255,255,.1)"/>` +
    `<text x="80" y="720" font-family="sans-serif" font-size="56" fill="#fff">${label}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

// Amostra sintética: os 5 projetos reais ainda têm images: []. Isto só confere o visor.
const SAMPLE_WITH_MEDIA: WebProject = {
  slug: 'amostra',
  title: 'Projeto de amostra com mídia',
  summary: 'Amostra sintética para conferir o visor, as miniaturas e o botão do site.',
  details: [
    'Primeiro parágrafo de detalhes, só para ver o ritmo do texto ao lado da mídia.',
    'Segundo parágrafo, um pouco mais longo, para forçar quebra de linha e conferir o espaçamento entre blocos.',
  ],
  role: 'Front-end',
  year: 2026,
  stack: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Motion', 'Vercel'],
  repoUrl: 'https://example.com/repo',
  liveUrl: 'https://example.com',
  // data: inválido de propósito: sem arquivo real não há 404 no console, e o poster continua aparecendo.
  video: { src: 'data:video/mp4;base64,AAAA', poster: fakeShot('poster do vídeo', '#1e293b', '#0f766e') },
  images: [
    { src: fakeShot('captura 1', '#312e81', '#0ea5e9'), alt: 'Captura 1 da amostra', width: 1280, height: 800 },
    { src: fakeShot('captura 2', '#7c2d12', '#f59e0b'), alt: 'Captura 2 da amostra', width: 1280, height: 800 },
    { src: fakeShot('captura 3', '#14532d', '#84cc16'), alt: 'Captura 3 da amostra', width: 1280, height: 800 },
  ],
  accent: '#7ff5d0',
}

interface FrameProps {
  title: string
  note: string
  width: number
  height: number
  children: ReactNode
  /** Estilo extra da moldura (ex.: fundo do "painel"). */
  frameClassName?: string
  /** Controles ao lado do título. */
  actions?: ReactNode
}

function Frame({ title, note, width, height, children, frameClassName, actions }: FrameProps) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-ink/60">{note}</p>
        </div>
        {actions}
      </div>
      <div className="max-w-full overflow-x-auto pb-2">
        <div
          data-frame={title}
          style={{ width, height }}
          className={`relative shrink-0 overflow-hidden ring-1 ring-white/20 ${frameClassName ?? ''}`}
        >
          {children}
        </div>
      </div>
    </section>
  )
}

const SCALE = 0.6
const SCALED_STYLE: CSSProperties = {
  width: 1280,
  height: 720,
  transform: `scale(${SCALE})`,
  transformOrigin: '0 0',
}

export function Preview() {
  // O MonitorScreen é o wrapper que a Fase 2.2 leva para dentro do monitor 3D (MonitorHtml): a
  // prop `active` é a mesma que lá vem de `focused` + `desk`. Desligada, o SO some (opacidade 0),
  // deixa de receber clique (pointer-events: none) e fica `inert`.
  const [active, setActive] = useState(true)

  return (
    <main className="mx-auto max-w-[1360px] space-y-14 p-6 pb-24">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">SO do monitor (Fases 2.1 e 2.2)</h1>
        <p className="max-w-3xl text-sm text-ink/70">
          O wrapper do monitor (1280×720, janela Projetos já aberta, fade e inert), o mesmo Desktop em
          outra moldura (o layout escala pelo container, sem vw/vh), o Desktop sob um transform CSS
          (simula o matrix3d do drei: o arraste tem de continuar certo), o ProjectsApp sozinho num
          painel estreito e o detalhe com mídia sintética.
        </p>
      </header>

      <Frame
        title="MonitorScreen 1280×720"
        note="Exatamente o que o Html transform da Fase 2.2 recebe, com o foco no monitor ligado."
        width={1280}
        height={720}
        actions={
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={active}
              onChange={(event) => setActive(event.target.checked)}
            />
            Monitor em foco (SO {active ? 'visível e interativo' : 'invisível, sem ponteiro e inert'})
          </label>
        }
      >
        <MonitorScreen active={active} />
      </Frame>

      <Frame
        title="Desktop 640×360"
        note="Mesmo componente, metade do tamanho: tem de parecer a mesma tela."
        width={640}
        height={360}
      >
        <Desktop />
      </Frame>

      <Frame
        title="Desktop 1280×720 sob transform: scale(0.6)"
        note="Ocupa 768×432 na tela. Arrastar uma janela aqui prova a conversão pelo getBoundingClientRect."
        width={1280 * SCALE}
        height={720 * SCALE}
      >
        <div style={SCALED_STYLE}>
          <Desktop />
        </div>
      </Frame>

      <Frame
        title="ProjectsApp sozinho 390×600"
        note="Painel DOM do mobile: fora do Desktop, sem --px definido, com detalhe embutido."
        width={390}
        height={600}
        frameClassName="overflow-y-auto bg-white/5"
      >
        <ProjectsApp />
      </Frame>

      <Frame
        title="ProjectWindow com mídia (amostra sintética) 760×560"
        note="Vídeo (src sintético inválido: só o poster aparece), 3 imagens e as duas ações."
        width={760}
        height={560}
        frameClassName="overflow-y-auto bg-[#0e1630]"
      >
        <ProjectWindow project={SAMPLE_WITH_MEDIA} />
      </Frame>
    </main>
  )
}
