# Arquitetura — Portfólio 3D "Diorama Isométrico / Quarto Gamer"

> Documento-fonte de verdade. Qualquer subagente que for codar **lê este arquivo antes** e segue as decisões aqui registradas. Mudanças de arquitetura são feitas aqui primeiro, depois no código.

Relacionados: [ASSET_PIPELINE.md](./ASSET_PIPELINE.md) · [BACKLOG.md](./BACKLOG.md)

---

## 0. Decisões fixas (TL;DR)

> **Escopo atual: só desktop (decisão de 2026-09-29).** Mobile e touch ficam fora do escopo por enquanto. O código responsivo que já existe (bottom-sheet dos painéis, `ProjectsApp` avulso) pode ficar, mas não recebe trabalho nem entra nos critérios de aceite. Tarefas de mobile no backlog estão marcadas como adiadas.

| Tema | Decisão | Motivo |
|---|---|---|
| Framework | Next 16.3 App Router, **uma única rota `/`** | O portfólio é uma SPA espacial; o App Router só serve shell, metadata e fallback SEO |
| Fronteira client/server | `page.tsx` (server) → `ExperienceLoader` (`'use client'`, `next/dynamic` com `ssr:false`) → `Experience` (Canvas) | `ssr:false` só funciona dentro de Client Component no Next 16 (ver `node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md`) |
| 3D | `three 0.186` · `@react-three/fiber 9` · `@react-three/drei 10` | Já instalados |
| Estado global | `zustand 5` (já vem transitivo; adicionar como dep direta) com `subscribeWithSelector` | Lê-se estado dentro de `useFrame` sem re-render |
| Câmera | `CameraControls` do drei (`camera-controls 3.x`) com `setLookAt(..., true)` e presets | Transições suaves nativas, limites de órbita, sem cortes secos |
| Animação 3D | `@react-spring/three` para molas (cadeira, caixas) e `useFrame + maath/easing.damp` para valores contínuos (emissive, eixos da impressora) | Mola quando há "física elástica"; damp quando é lerp contínuo |
| Animação UI 2D | `motion` (`motion/react`, sucessor do framer-motion) com `AnimatePresence` | Entrada/saída de painéis glassmorphism |
| Pós-processamento | `@react-three/postprocessing`: `Bloom` sempre; `DepthOfField` só em `focused:chair` | DoF é caro; liga só quando a narrativa pede |
| HTML dentro do 3D | **O monitor e a TV** usam `<Html transform>`, sem `occlude`: o SO só aparece com a câmera parada de frente para o monitor, e a TV só tem HTML enquanto um jogo roda (§6.6). Os painéis "Sobre", "Impressora" e "Games" são **DOM overlay fora do Canvas** | Overlay DOM é mais nítido, acessível e não sofre distorção de resize |
| Iluminação | 100% **baked** no Blender por script (§12): `baked-night`, `baked-day` e `lightmap` RGB misturados no `BakedMaterial` + materiais **emissivos** para telas e LEDs. Zero luzes dinâmicas com sombra | É o que faz as referências serem bonitas, e roda a 60 fps |
| Arte 3D | Cena **gerada por Python no Blender 4.4 (headless)** a partir do `layout.ts`; estilo diorama "quadradinho" detalhado, com bevel em tudo (§12) | Reprodutível, revisável em PR e executável por agentes; o grey-box vira fallback (`?greybox`) |
| Loading | `useProgress` + `useGLTF.preload` de todos os `.glb` na tela de loading, depois voo de câmera de introdução | Cache completo antes da interação |
| Áudio | 100% **sintetizado** em Web Audio, sem arquivo de som: música lo-fi gerada, ambiente, zumbido do PC e cliques. Três buses de volume (Música, Ambiente, Efeitos). O `AudioContext` nasce no clique em "Entrar" e o visitante entra com som, salvo escolha anterior dele (§12.5) | Zero peso de download e zero direito autoral; o som ainda acompanha a câmera e o jogo da TV |
| Idiomas | Português (padrão) e inglês, trocados em runtime por `store.locale`. O server (SEO, `<noscript>`, OpenGraph) fica em pt-BR (§13) | Uma rota só, sem i18n de roteamento; o idioma é preferência do visitante |
| Estilo | Tailwind v4 (já instalado) + tokens CSS no `globals.css` | Glassmorphism via utilitários e variáveis |
| Sub-vistas | Hotspot pode ter `views` no registry; `store.view` escolhe câmera e lado do painel sem sair do foco | A zona de jogos troca entre estante (Tabuleiro) e TV + console (Digital) pela aba do painel |
| Dev tooling | `leva` (afinar presets de câmera), `r3f-perf` (medir), `gltfjsx` (gerar componentes tipados) | Só em dev |

---

## 1. Visão geral da experiência

```
[Loading 2D]  →  [Intro: voo de câmera até HOME]  →  [IDLE: isométrico, órbita limitada]
                                                            │ hover  → feedback local do hotspot
                                                            │ click  → TRANSITIONING(to: hotspot)
                                                            ▼
                                                     [FOCUSED: hotspot]
                                                            │ Esc / botão Voltar / click fora
                                                            ▼
                                                     TRANSITIONING(to: home) → IDLE
```

Quatro hotspots: `chair` (Sobre mim), `desk` (Projetos Web / SO fictício no monitor), `printer` (Reino de Amestris / manufatura), `shelf` (Board games + game dev).

---

## 2. Estrutura de pastas

```
src/
├─ app/
│  ├─ layout.tsx              # fonts, metadata, <html lang="pt-BR">
│  ├─ dev/                    # SÓ em dev (404 em produção): previews isolados de UI
│  │  ├─ layout.tsx           # guarda de NODE_ENV + rolagem local
│  │  ├─ ui/                  # page.tsx + Preview.tsx ('use client'): primitivas e painéis
│  │  └─ os/                  # page.tsx + Preview.tsx ('use client'): SO do monitor
│  ├─ page.tsx                # SERVER component: SEO + <noscript> fallback + <ExperienceLoader/> (sempre em pt-BR, §13)
│  ├─ icon.svg · favicon.ico · apple-icon.png   # favicon: monograma XK (SVG com 3 níveis de detalhe por media query), .ico 16/32/48 e 180 px; o Next os detecta pelo nome do arquivo
│  └─ globals.css             # tokens de design (cores, glass, blur), reset
│
├─ experience/                # TUDO que roda dentro/ao redor do <Canvas> (client-only)
│  ├─ ExperienceLoader.tsx    # 'use client'; next/dynamic(ssr:false) + <LoadingScreen/>
│  ├─ Experience.tsx          # <Canvas> + <Suspense> + <Scene/> + <Effects/> + <CameraRig/>
│  ├─ scene/
│  │  ├─ Scene.tsx            # composição: <Room/> + 4 hotspots + <Lights/>
│  │  ├─ layout.ts            # FONTE ÚNICA das posições do quarto (§6.0)
│  │  ├─ Room.tsx             # geometria estática baked (1 draw call por atlas), inclui a cama
│  │  ├─ WallTv.tsx           # TV de parede COMPARTILHADA por desk e shelf (§6.5)
│  │  ├─ Lights.tsx           # só ambient/hemisphere fraca (o resto é baked)
│  │  ├─ Effects.tsx          # EffectComposer condicional (Bloom, DoF)
│  │  ├─ ScenePause.tsx       # frameloop sob demanda enquanto um jogo roda na TV (§6.6)
│  │  └─ placeholders/        # grey-box (primitivas) usado até os .glb existirem
│  ├─ hotspots/
│  │  ├─ chair/   Chair.tsx · useChairSpring.ts
│  │  ├─ desk/    Desk.tsx · Screens.tsx (emissive) · MonitorHtml.tsx (<Html transform>)
│  │  ├─ printer/ Printer.tsx · usePrinterAnimation.ts
│  │  └─ shelf/   Shelf.tsx · GameBox.tsx · GameCovers.tsx · ShelfParticles.tsx · TvGameHtml.tsx (<Html transform>) · BoardGameFx.tsx + fx/ (caça imperial e meeples, §6.4)
│  ├─ camera/
│  │  ├─ CameraRig.tsx        # <CameraControls makeDefault> + subscribe no store
│  │  ├─ presets.ts           # HOME + 1 preset por hotspot (position, target, limites)
│  │  └─ useCameraTransition.ts
│  ├─ interaction/
│  │  ├─ useHotspot.ts        # hook único: {hovered, focused, bind} para qualquer hotspot
│  │  └─ useKeyboard.ts       # Esc → home
│  ├─ audio/
│  │  └─ AudioDirector.tsx    # lado 3D do áudio: volume do zumbido e do ambiente pela distância da câmera, estática da TV, e replica `muted`, `volumes` e `playing` do store no motor (src/lib/audio, §12.5)
│  └─ models/                 # componentes GERADOS por gltfjsx (não editar à mão)
│
├─ ui/                        # DOM 2D, FORA do Canvas
│  ├─ overlay/
│  │  ├─ Overlay.tsx          # roteia painel por store.focus; pointer-events controlado
│  │  ├─ Hud.tsx              # só em idle: logo, dica "arraste para explorar" e, no canto superior direito, Som, Tema e Idioma
│  │  ├─ SoundMenu.tsx        # botão de som do HUD + popover: mudo geral e sliders de Música, Ambiente e Efeitos (§12.5)
│  │  ├─ LanguageSwitch.tsx   # seletor "PT | EN" do HUD (§13)
│  │  ├─ BackButton.tsx       # "← Voltar" (Esc); com jogo na TV vira "← Sair do jogo"
│  │  ├─ TvGameBar.tsx        # barra do jogo na TV: título, "Tela cheia", "Abrir no itch.io" (§6.6)
│  │  └─ LoadingScreen.tsx    # boot estilo BIOS: barra useProgress + botão "Entrar" (que cria o AudioContext e liga o som, §12.5)
│  ├─ panels/
│  │  ├─ AboutPanel.tsx       # chair
│  │  ├─ PrinterPanel.tsx     # printer (carrossel de fotos, specs, link loja)
│  │  └─ GamesPanel.tsx       # shelf (abas: tabuleiro / digital)
│  ├─ os/                     # UI que renderiza DENTRO do monitor (via <Html transform>)
│  │  ├─ Desktop.tsx · Taskbar.tsx · Window.tsx · DesktopIcon.tsx
│  │  ├─ OsGlyph.tsx          # `AppGlyph`: ícone real do projeto (`WebProject.icon`) ou, sem ele, o glifo Phosphor (§6.2)
│  │  └─ apps/ ProjectsApp.tsx · ProjectWindow.tsx · ProjectMedia.tsx
│  ├─ tv/                     # UI que renderiza DENTRO da TV (via <Html transform>, §6.6)
│  │  └─ TvGameScreen.tsx     # wrapper fixo 1280×716 px: iframe do jogo + tela "Ligando..."
│  ├─ i18n/                   # useLocale.ts (useLocale, useContent, useUiText, useOsText) · useDocumentLocale.ts (§13)
│  └─ primitives/             # GlassCard, Tabs, Carousel, IconButton, Kbd
│
├─ store/
│  ├─ useExperienceStore.ts   # zustand + subscribeWithSelector
│  └─ selectors.ts
│
├─ content/                   # DADOS tipados; painéis são 100% data-driven
│  ├─ hotspots.ts             # registry: id, label, preset de câmera, painel
│  ├─ about.ts
│  ├─ projects.web.ts         # Inatel², CP2eJR Corporative, Portfólio Gabriela, ... (cada um com `icon?`, §6.2)
│  ├─ projects.print.ts       # Reino de Amestris
│  ├─ projects.games.ts       # Aldeia Dorme, Conquista Galáctica, PorriLand, Piter, O Anel...
│  ├─ decor.ts                # capas dos board games de decoração da estante: Root, Heat e Everdell (§6.4)
│  ├─ os.ts                   # textos do SO fictício do monitor
│  ├─ screens.ts              # textos e código das telas desenhadas em canvas (TV, papel de parede, editor)
│  ├─ site.ts                 # identidade, links globais e UI_TEXT (chrome)
│  ├─ i18n.ts · locales.ts    # `Locale`, `LOCALE_INFO`, `Widened` · `contentFor(locale)` (§13)
│  ├─ en/                     # textos em inglês (um arquivo por módulo acima), escritos com `satisfies Widened<typeof PT>`
│  └─ types.ts
│
├─ lib/
│  ├─ device.ts               # isTouch, prefersReducedMotion, gpuTier (simples)
│  ├─ math.ts                 # helpers pequenos (clamp, mapRange)
│  ├─ locale.ts               # detecção e persistência do idioma (§13)
│  ├─ audio/                  # motor de áudio sintetizado (Web Audio): engine, music, score, voices, mix, volumes, noise (§12.5)
│  └─ constants.ts
│
public/
├─ models/    *.glb (draco/meshopt) — ver ASSET_PIPELINE.md
├─ textures/  *.ktx2 / *.webp
├─ media/     imagens/vídeos dos projetos (`games/` capas, `web/<slug>/icon.*` ícones do SO, `decor/` capas da decoração da estante)
└─ draco/     decoder (copiado de three/examples/jsm/libs/draco/gltf/)
docs/
scripts/      optimize-models.mjs (gltf-transform)
```

**Regras de fronteira**
- Nada em `src/ui/**` importa `three` ou `@react-three/*`. Comunicação apenas via `store` e `content`.
- Nada em `src/experience/**` renderiza DOM fixo (exceto `MonitorHtml` e `TvGameHtml`, via drei `Html`).
- `src/content/**` não importa React. São dados puros + tipos.
- `src/lib/audio/**` e `src/lib/locale.ts` não importam `three`, `@react-three/*` nem React: `ui/**`, `experience/**` e o store os importam.

---

## 3. Máquina de estados (store)

```ts
// src/store/useExperienceStore.ts
export type HotspotId = 'chair' | 'desk' | 'printer' | 'shelf'
export type Mode = 'loading' | 'intro' | 'idle' | 'transitioning' | 'focused'

interface ExperienceState {
  mode: Mode
  focus: HotspotId | null          // alvo atual (durante transitioning = destino)
  view: string | null              // sub-vista do foco (null = a primeira do registry)
  hovered: HotspotId | null
  quality: 'high' | 'medium' | 'low'
  theme: 'night' | 'day'            // tema do quarto baked (§12.3); padrão 'night'
  muted: boolean                    // mudo geral; começa true e o "Entrar" o desliga se o visitante nunca escolheu (§12.5)
  soundChosen: boolean              // o visitante já escolheu ligar ou silenciar (salvo): o "Entrar" respeita a escolha
  volumes: Volumes                  // { music, ambient, effects } em 0..1; padrão 0,35 / 0,5 / 0,8; salvo no localStorage
  locale: Locale                    // 'pt' | 'en'; ?lang= > localStorage > navigator.language (§13); no server é 'pt'
  playing: string | null            // slug do jogo rodando na TV (§6.6); só em focused + shelf + vista digital
  pcLaunch: { app: PcApp; id: number } | null  // último pedido de abrir um app do XkrulesOS (§6.6); o id cresce a cada pedido
  // ações
  setMode(m: Mode): void
  setHovered(id: HotspotId | null): void
  requestFocus(id: HotspotId, view?: string | null): void   // idle → transitioning(focus=id, view)
  setView(view: string | null): void  // só em focused: troca a sub-vista sem sair do foco
  requestHome(): void                 // focused|transitioning → transitioning(focus=null)
  onCameraRest(): void                // transitioning → focused | idle
  setQuality(q): void
  toggleTheme(): void
  toggleMuted(): void                 // marca soundChosen e grava a escolha
  setVolume(category: SoundCategory, value: number): void   // 0..1 em passos de 1%; grava
  enterWithSound(): void              // chamado pelo "Entrar": tira do mudo se soundChosen é false; não grava a escolha
  setLocale(locale: Locale): void     // grava no localStorage e atualiza <html lang>; idioma inválido é ignorado
  startGame(slug: string): void       // liga o jogo na TV; só em focused + shelf + vista digital; limpa o highlightBox
  stopGame(): void                    // desliga o jogo; a câmera volta para a vista Digital, com o painel
  openOnPc(app: PcApp): void          // idle | focused → transitioning(focus='desk') + pcLaunch (exceção da guarda 1)
}
```

**Guardas (invariantes)**
1. `requestFocus` é aceito em `idle`, em `intro` e em `transitioning` **de volta para HOME** (`focus === null`): um clique enquanto a câmera ainda retorna não pode ser perdido. É ignorado em `loading`, `focused` e `transitioning` rumo a outro hotspot (evita spam de câmera).
2. `requestHome` é aceito em `focused` **e** `transitioning` (usuário pode cancelar uma entrada).
3. `hovered` é sempre `null` quando `mode !== 'idle'` (evita cadeira girando enquanto a câmera está nela).
4. `onCameraRest` é chamado **apenas** pelo `CameraRig` (fonte única de verdade do "chegou").
5. Painéis DOM só recebem `pointer-events: auto` quando `mode === 'focused'`.
6. `view` só existe junto com `focus` (some em `requestHome` e fora de `focused`/`transitioning`). `setView` só vale em `focused` e limpa o `highlightBox`.
7. `startGame` só vale em `focused` + `shelf` + vista `digital` e limpa o `highlightBox`. `playing` volta a `null` em `stopGame`, `setView`, `requestHome`, `requestFocus`, `openOnPc` e em `setMode` que saia de `focused`: um jogo nunca sobrevive à troca de vista nem à saída da zona.
8. `openOnPc` é uma **exceção deliberada à guarda 1**, porque o pedido vem de um botão e não de um clique na cena. De `idle`, ou de `focused` em qualquer hotspot, ele vai direto a `transitioning` com `focus = 'desk'` e grava o `pcLaunch`. Com a mesa já em foco, só incrementa o `id` do `pcLaunch`. É ignorado em `loading`, `intro` e `transitioning`.
9. `pcLaunch.id` cresce a cada pedido e o `pcLaunch` nunca é limpo: o `Desktop` guarda o último `id` atendido e abre a janela uma vez por id.
10. O som tem mais de um estado: `muted` (mudo geral), `soundChosen` (escolha do visitante) e `volumes` por categoria. Só `toggleMuted` marca `soundChosen`, e o `muted` só é gravado depois disso; `enterWithSound` liga o som sem gravar nada, e só se o visitante nunca escolheu. `setVolume` grava só os volumes que diferem do padrão. A preferência fica em `portfolio3d:sound:v1` (§12.5).
11. O `AudioContext` não nasce mais só no botão de som: nasce em qualquer gesto que o peça, o "Entrar" ou o mudo geral do menu de som. Antes do gesto o motor guarda a intenção (`muted`, `volumes`) e a aplica ao nascer.
12. `locale` nunca é `null`. `setLocale` ignora idioma inválido e grava a escolha mesmo quando o idioma clicado já é o ativo (§13).

**Quem lê o quê**
- Componentes 3D leem o store com `useExperienceStore(selector)` para JSX, e com `useExperienceStore.subscribe(selector, cb)` / `getState()` dentro de `useFrame` para valores por frame.
- URL: em `focused` sincronizar `?focus=<id>&view=<vista>` via `history.replaceState` (shallow). Na carga, se houver `?focus`, pular o intro e ir direto ao preset da vista. O `?lang=pt|en` está sempre presente (§13).

---

## 4. Sistema de câmera

`CameraRig.tsx` monta `<CameraControls makeDefault />` e assina o store:

```ts
// pseudo-fluxo
subscribe(s => [s.mode, s.focus], async ([mode, focus]) => {
  if (mode !== 'transitioning') return
  const preset = focus ? PRESETS[focus] : PRESETS.home
  controls.enabled = false                       // bloqueia input do usuário
  applyLimits(controls, preset.limits)
  controls.smoothTime = preset.smoothTime ?? 0.8
  await controls.setLookAt(...preset.position, ...preset.target, true)
  controls.enabled = preset.userControl          // home: órbita limitada; hotspot: travado ou micro-órbita
  store.onCameraRest()
})
```

**Formato do preset** (`camera/presets.ts`):
```ts
interface CameraPreset {
  position: [number, number, number]
  target: [number, number, number]
  fov?: number                      // default 35 (isométrico "falso" com perspectiva leve)
  smoothTime?: number               // camera-controls: tempo de amortecimento
  userControl: boolean              // permite órbita depois de chegar?
  limits: { minDistance; maxDistance; minPolar; maxPolar; minAzimuth; maxAzimuth }
  dof?: { focusDistance; focalLength; bokehScale }   // só chair usa
}
```

- **Chegada**: não usar a promise de `setLookAt` para decidir "chegou". Ela só resolve no evento `rest` do camera-controls, e a cauda do amortecimento leva vários segundos depois de a câmera parecer parada (medido: ~9 s na intro). O `CameraRig` detecta chegada em `useFrame` comparando `getPosition(v, false)`/`getTarget(v, false)` (valor **atual**, não o final) com o preset (eps 0.06) e usa `2.5 × smoothTime` como teto.
- HOME: visão isométrica distante (ilha flutuante inteira). Órbita permitida em ±25° azimute, polar entre 35° e 70°, dolly entre 8 e 16 unidades. `truck` habilitado com limites (panning suave).
- **Sub-vistas**: o preset de destino vem de `resolveFocus(focus, view)` (registry). O `CameraRig` assina `[mode, focus, view]`; em `focused`, se a vista mudar, ele voa para o preset novo **sem** chamar `onCameraRest` (o modo continua `focused` e o painel continua montado). Um `requestHome` no meio desse voo o substitui pelo token.
- **Jogo na TV**: o preset `shelfTv` fica de frente para a tela da TV, perpendicular como o `desk` (target = centro da tela, position = target + normal × 1.8 m), com `framing` de `margin: 0.09` e sem parallax. A margem de 9% por lado deixa o botão "Sair do jogo" (topo) e a barra de controles (base) fora da imagem. Ele **não é sub-vista do registry**: o `CameraRig` assina também `playing !== null` (`[mode, focus, view, playing]`) e, em `focused` + `shelf` com jogo ligado, escolhe `shelfTv` com lado de painel `none`. Como na troca de sub-vista, o voo não chama `onCameraRest`. Em `stopGame` a câmera volta para `shelfDigital`.
- Cada hotspot tem seu preset. Desk: câmera **exatamente** perpendicular à tela do monitor (target = centro da tela, position = target + normal * d), `userControl:false`.
- Preferência `prefers-reduced-motion`: `smoothTime = 0` e `setLookAt(..., false)`.
- Afinar valores com `leva` em dev (painel `Camera` com botões "copiar preset atual"). Presets finais ficam hardcoded.
- **Enquadramento responsivo (feito na V.4)**: cada preset tem `framing` (`focusBoxes` derivadas do `layout.ts` e `margin`). `position`/`target` continuam no preset como referência em 16:9 e definem a direção de olhar. O resolvedor puro `camera/framing.ts` calcula a menor distância e o deslocamento lateral para os 8 cantos de cada caixa caberem na área livre (tela menos margem menos o painel de `PANEL_WIDTH_PX`, do lado do registry); `camera/resolvePose.ts` liga isso à viewport. Todo voo usa a pose resolvida, e o resize (debounce 150 ms) refaz o enquadramento sem chamar `onCameraRest`. HOME usa 3 caixas (piso e as duas paredes) e mantém a órbita do usuário no resize; os limites de dolly acompanham a distância resolvida. Testes em `camera/__tests__/framing.test.ts`.
- **Câmera viva (V.4)**: em HOME `idle`, depois de 3 s sem input, deriva lenta (`idleDrift.ts`, ±1.5° de azimute e ±0.8° de polar como deltas de `rotate`); input do usuário pausa. Em `focused` nos presets `chair`, `printer`, `shelf` e `shelfDigital`, parallax do mouse (`parallax.ts`, `setFocalOffset` de até 4 cm), zerado no começo de cada voo; nunca no `desk` nem no `shelfTv`. As duas desligam em `prefers-reduced-motion`. Testes em `camera/__tests__/life.test.ts`.
- Câmera ortográfica **não** será usada: o zoom-in nos hotspots precisa de perspectiva. O "look isométrico" vem de fov baixo (~30–35) e ângulo fixo.

---

## 5. Contrato de hotspot

Todo hotspot é um componente 3D que usa **um único hook**:

```ts
// src/experience/interaction/useHotspot.ts
const { hovered, focused, active, bind } = useHotspot('printer')
// bind = { onPointerOver, onPointerOut, onClick } com stopPropagation + cursor pointer
// active = hovered || focused  (usado para animações "ligadas")
<group {...bind}> ... </group>
```

Responsabilidades do hook:
- Só reporta hover em `mode === 'idle'`.
- Click chama `requestFocus(id)` e o store decide se aceita (guarda 1 de §3).
- Troca `document.body.style.cursor` (pointer/auto).
- Em touch: hover é ignorado (primeiro toque = click).

**Hitbox**: cada hotspot tem um `<mesh visible={false}>` simples (box) por cima da geometria detalhada para raycast barato e área generosa. A geometria detalhada tem `raycast={() => null}`. Uma hitbox pode declarar `view` (vai para `userData.view`); o clique nela chama `requestFocus(id, view)`. Assim, clicar no rack da TV já abre a zona de jogos na vista Digital.

**Registry** (`content/hotspots.ts`): `{ id, label, description, panel, preset, side, views? }`. `views` é uma lista `{ id, preset, side }`; a primeira é a padrão. `resolveFocus(id, view)` devolve o preset e o lado efetivos. O `Overlay` usa o registry para decidir qual painel montar; o painel com sub-vistas passa o lado da vista ao `PanelShell`, que desliza de um lado para o outro (layout animation) sem desmontar.

---

## 6. Comportamento por hotspot (implementação)

### 6.0 Layout espacial (mundo, 1 unidade = 1 m)
Ilha de 8.6 × 7.0 com origem no centro do piso. Paredes em x = -4.3 (esquerda) e z = -3.5 (fundo); as bordas +X e +Z são abertas ("paredes invisíveis"). A câmera HOME olha da diagonal +X/+Z. Referência de clima: quarto aconchegante de fim de noite, piso de madeira, luzes roxas, azuis e rosa.

**Fonte única: `src/experience/scene/layout.ts`.** Placeholders, hitboxes e presets de câmera leem as âncoras de lá, e os presets dos hotspots são relativos a elas. Mover um móvel é mudar esse arquivo; a câmera acompanha.

| Elemento | Posição | Observação |
|---|---|---|
| Mesa reta | parede esquerda, do canto do fundo para a frente (z -3.3 a 0.5) | gaveteiro branco sob a ponta da frente; quem senta olha para -X, então a direita é -Z |
| Monitor horizontal | tela 1.3 × 0.73 com centro em (-3.62, 1.62, -1.45), normal +X | a câmera do `desk` para a 1.55 m da tela |
| Monitor vertical | tela 0.56 × 1.0, à direita de quem senta (-Z) | |
| Teclado e mouse | teclado em frente ao monitor; mouse e mousepad à direita (-Z) | |
| PC gamer | torre grande em cima da mesa, à esquerda do monitor horizontal (+Z) | vidro lateral para +Z com dois fans e fita RGB |
| Rack da TV | parede do fundo, centro (-1.6, 0.25, -3.14), 1.9 de largura | console, controle e capinhas dos jogos digitais no tampo |
| TV | na parede acima do rack, tela 1.68 × 0.94 com centro em (-1.6, 1.3, -3.32) | tela da zona de jogos (§6.5) |
| Estante | à direita do rack, centro (0.7, 0, -3.13) | só board games e decoração |
| Bancada + impressora | canto direito do fundo, centro (3.0, 0.9, -2.8), 2.4 de largura | maker space |
| Cama de casal | frente à direita, centro (3.12, 0, 2.35), 2.2 × 1.8 | cabeceira em +X encostada na borda direita; estática, sem hotspot |
| Cadeira | (-2.2, 0, -1.45) | diante do monitor horizontal |

Regra das hitboxes: elas não se sobrepõem. A da mesa vai até x = -2.6, a do rack ocupa x -2.58 a -0.62, a da estante x -0.25 a 1.65 e a da impressora começa em 1.7.

### 6.1 `chair` — Sobre mim
| Estado | Implementação |
|---|---|
| Idle | cadeira de costas (rotação Y = 0 relativo ao nó `chair_root`) |
| Hover | `useSpring({ rotY: active ? Math.PI*1.05 : 0, config: { tension: 120, friction: 14 } })` (elástico, ~190°) |
| Click | preset `chair` (altura do ombro, arco); `Effects` liga `DepthOfField` lendo `preset.dof`; `Overlay` monta `AboutPanel` (glass lateral direita) |
| Voltar | `AnimatePresence` some com o painel; DoF desliga; cadeira volta a 0 |

Personagem: mesh estático com pose sentada (rig opcional; se houver animação idle no glb, tocar via `useAnimations` com loop).

### 6.2 `desk` — Projetos Web
| Estado | Implementação |
|---|---|
| Idle | telas com `MeshBasicMaterial` preto + `envMap`/`MeshReflectorMaterial` sutil (desligada) |
| Hover | `useFrame`: `damp(mat, 'emissiveIntensity', active ? 1.6 : 0, 0.25, dt)` em monitor e monitor vertical; o PC gamer acende os fans e a fita RGB (`pc_fan_*`, `pc_rgb`) e o LED do gabinete pulsa (`sin(t*4)`). A TV não é mais da mesa; o zumbido da ventoinha (bus Ambiente) cresce com a proximidade da câmera ao PC (§12.5) |
| Click | preset `desk` perpendicular à tela. Quando `mode === 'focused'`, `MonitorHtml` troca `pointerEvents` de `none` → `auto` e o SO fictício (`ui/os/*`) ganha interação |
| Voltar | janelas minimizam (motion), câmera recua |

**`MonitorHtml`** (o primeiro dos dois `Html` do projeto; o outro é o `TvGameHtml`, §6.6):
```tsx
<Html
  transform
  position={screenCenter + normal * 0.002} rotation={screenRotation}
  scale={SCREEN_SCALE}                      // calibrado: 1280 CSS px == 1.3 m da tela 3D
  style={{ width: 1280, height: 720, pointerEvents: focused ? 'auto' : 'none' }}
  zIndexRange={[5, 0]}                      // abaixo do Overlay (z-10): o Voltar fica por cima
>
  <Desktop initialWindows={[projects]} />
</Html>
```
**Sem `occlude` (decisão de 2026-09-29).** O `occlude="blending"` abre um buraco no canvas para o HTML aparecer atrás dele, e o `EffectComposer` da Fase 3 costuma apagar esse buraco. Como o SO só fica visível em `focused` + `desk`, com a câmera parada e perpendicular à tela, nada o encobre: basta o Html na frente do canvas, com opacidade 0, `pointer-events: none` e `inert` fora desse estado.
Regra anti-distorção: o wrapper tem **tamanho fixo em px** (1280×720) e todo o layout interno usa unidades relativas a esse wrapper (`%`, `cqw` via `container-type: size`). Nunca usar `vw/vh` dentro do monitor. O `transform` do drei escala o bloco todo junto com o 3D; resize da janela não muda o layout interno.

Antes do focus, a tela mostra um "wallpaper" estático (mesh emissivo com textura), e o `Html` fica com `visible=false`/opacidade 0 para poupar CSS3D. Ao chegar, faz crossfade.

**Ícones dos projetos.** `WebProject` (`content/types.ts`) ganhou o campo opcional `icon?: MediaImage`: o ícone real do projeto, quadrado (~256 px), em `public/media/web/<slug>/icon.webp` ou `.svg`. Os ícones foram baixados do GitHub do dono; o do Jogo da Memória é a capa do jogo, porque o repositório só tem um `.ico`. O SO resolve o ícone no `AppGlyph` (`ui/os/OsGlyph.tsx`): com `icon`, mostra a imagem; sem ele, mostra o glifo Phosphor que `OS_PROJECT_GLYPHS` (`content/os.ts`) mapeia por slug (slug sem entrada usa o glifo genérico de app). O mesmo ícone aparece na área de trabalho (`DesktopIcon`), na barra de tarefas (`Taskbar`), na barra de título (`Window`), nos cartões do `ProjectsApp` e no cabeçalho do `ProjectMedia`. A imagem é decorativa (`alt` vazio, `<img>` simples, sem `next/image`): o nome do app sempre aparece ao lado, e o `alt` real do ícone fica no conteúdo. Na lista de `projects.web.ts`, o `portfolio-gab` (Portfólio Gabriela) entrou e o `dicionario-c04a` saiu.

### 6.3 `printer` — Reino de Amestris
| Estado | Implementação |
|---|---|
| Idle | estática |
| Hover | `usePrinterAnimation(active)`: nós `printer_axisZ` (sobe/desce lento), `printer_head` (Lissajous em X/Y), `printer_led` emissive on. Tudo via refs em `useFrame`, sem state |
| Click | preset macro na base; a peça em impressão (`printer_part`) ganha `visible` progressivo (scale Y de 0.2 → 1 via damp) |
| Voltar | animação pausa (damp de volta), painel colapsa |

Painel: `PrinterPanel` com carrossel (`ui/primitives/Carousel`) de fotos reais, specs de slicer, link da loja. Fotos em `public/media/print/*.webp`.

### 6.4 `shelf` — Zona de jogos (board games e game dev)
A zona de jogos é UM hotspot com DUAS sub-vistas (§5). A aba do `GamesPanel` é a vista.

| Vista (`store.view`) | Câmera (preset) | Painel | Hitbox que abre |
|---|---|---|---|
| `tabuleiro` (padrão) | `shelf`: zoom nas prateleiras 2 e 3 da estante | à esquerda | estante |
| `digital` | `shelfDigital`: TV + rack com o console, em diagonal pela direita | à direita | rack + TV |

| Estado | Implementação |
|---|---|
| Idle | caixas alinhadas, TV apagada |
| Hover | `GameBox` usa spring `z: active ? 0.08 : 0` (projeta para fora); a TV mostra estática retrô (§6.5) |
| Click | a hitbox clicada define a vista; `ShelfParticles` (drei `Sparkles`, count ≤ 80) monta junto da vista ativa |
| Troca de aba | `setView` → a câmera voa entre estante e TV sem sair do foco e o painel desliza para o outro lado |
| UI | hover num jogo do painel → `store.highlightBox = slug` → a `GameBox` correspondente faz spring extra; nas duas caixas autorais da estante, dispara também a animação da caixa (abaixo) |
| Jogar | o cartão de um jogo com `play` (`content/types.ts`) mostra "Jogar na TV" (`startGame(slug)`) ou "Jogar no PC" (`openOnPc(app)`); ver §6.6 |
| Voltar | partículas desmontam, caixas voltam, câmera recua |

`highlightBox: string | null` e `view` são os dois canais UI→3D além de `focus`.

Conteúdo físico (o slug é o mesmo de `content/projects.games.ts` e dos nós `box_<slug>` e `cover_<slug>`; na estante, a ordem da esquerda para a direita é a do painel; no rack, a ordem dos estojos é a do bake, e o painel Digital lista primeiro os jogáveis na TV, depois o do PC e por último os sem versão jogável):
- **Board games autorais** (`aldeia_dorme`, `conquista_galactica`): caixas quadradas de 36 cm na prateleira 2 da estante.
- **Jogos digitais** (`porriland`, `piter`, `memory_game`, `o_anel`, `racco`, `duel_arena`): estojos quadrados de 13 cm (como os de CD) de pé no tampo do rack, ao lado do console.
- **Capas**: as artes são quadradas (`cover` em `content/projects.games.ts`, em `public/media/games/`). Elas são a miniatura do cartão no painel e a textura da caixa no quarto. Cada `box_<slug>` do glb tem um filho `cover_<slug>`, um quadro cinza rente à frente que é assado como o resto do quarto. O `GameCovers` troca o material desse quadro pelo `CoverMaterial`, que multiplica a arte pela luz assada do quadro (dividida pelo albedo do cinza) e aplica as luzes de zona como o `BakedMaterial`. Assim a capa segue o tema dia/noite, a sombra da prateleira e o rosa da TV. O plano da arte sai da bounding box do próprio quadro, não de uma convenção do nó: o eixo mais fino é a normal. Quadro em pé: o topo da arte é +Y e a direita é `Y × normal` (na frente da estante, normal +Z, a direita é +X). Quadro deitado: o topo da arte aponta para o fundo da estante (-Z) e a direita é +X. `COVER_URLS` (`scene/baked/assets.ts`) é a lista única de capas, jogos primeiro e decoração depois, e é ela que o `preload.ts` e o `GameCovers` usam: as texturas entram no preload com a mesma chave de cache.
- **Decoração da estante**: pilhas, caixas em pé e miniaturas na prateleira 1; Root, Heat, meeples e dados soltos na 2; Everdell deitado com a Ever Tree, torre de dados, miniaturas e dados na 3; fileira de caixas na 4; caixas deitadas, um troféu e uma planta pendente em cima. Estática, fundida no `zone_games`.
  - **Caixas com capa real** (`content/decor.ts`, `public/media/decor/*.webp`; não são do dono e não têm cartão no painel): Root (horizontal, 4:3) e Heat: Pedal to the Metal (quadrada) em pé na prateleira 2, à direita das caixas autorais; Everdell (quadrada) **deitado** na prateleira 3, com a capa para cima.
  - **Ever Tree**: a árvore de papelão do Everdell é modelada por script em cima da caixa (`_ever_tree` em `art/blender/props/games.py`): duas tábuas de tronco cruzadas, três plataformas de folhagem de contorno ondulado (metade verde, metade outono) e a copa com os três medalhões de estação. Tem ~42 cm de altura e fica abaixo da prateleira 4.
  - **As caixas são estáticas**: ficam em `zone_games` e não são nós. Só o quadro da capa de cada uma é um nó baked solto (`cover_decor_root`, `cover_decor_heat`, `cover_decor_everdell`), sem pai e sem spring. O `GameCovers` aplica a arte neles e o contorno de hover da zona os lista (`HOTSPOT_OUTLINE_NODES.shelf` em `scene/baked/zones.ts`): o `Outline` só seleciona os objetos nomeados, e esses quadros são nós à parte de `zone_games`.

O painel mostra no cartão a capa, o gênero, as etiquetas (prêmio, contexto, ano, ferramenta, jogadores e duração), o primeiro parágrafo e, atrás do "Ler mais", o resto da descrição. O ícone do cabeçalho acompanha a aba (dado no Tabuleiro, controle no Digital).

**Animações das caixas (`BoardGameFx`).** Ao destacar uma das duas caixas autorais no painel, um efeito de ~3 s sai de trás dela. Os dois rodam em `src/experience/hotspots/shelf/fx/`:

| Caixa (`highlightBox`) | Efeito | Duração |
|---|---|---|
| `conquista_galactica` ("Star Wars: Conquista Galáctica") | um caça imperial low-poly sai de trás da caixa, sobe por cima da borda, faz uma curva inclinada, dá um rasante pela frente da estante disparando **três lasers verdes**, rola e sai do quadro pela direita (`ImperialFighterFx`) | ~2,85 s (`FIGHTER_TOTAL`) |
| `aldeia_dorme` ("Aldeia Dorme") | cinco meeples camponeses (chapéu de palha ou capuz) pulam de trás da caixa para o topo, quicam com squash and stretch, **cochilam** sob uma lua minguante, com os "z z z" subindo do vigia da lanterna, e pulam de volta para trás da caixa (`VillageMeeplesFx`) | ~3,05 s (`VILLAGE_TOTAL`) |

- **Gatilho** (`useBoardGameFx`): o efeito começa quando `highlightBox` PASSA a ser o slug. Toca uma vez por destaque: um destaque novo com o efeito rodando é ignorado, e um depois do fim toca de novo. O efeito termina mesmo que o destaque saia no meio. Só é cortado (some em ~0,2 s) se a câmera deixar a vista Tabuleiro (voltar para HOME, trocar de aba). Com `prefers-reduced-motion` nunca começa.
- **Sem luz real.** O quarto não tem luz dinâmica, então o efeito parece iluminado sem luz: meshes de runtime com `MeshMatcapMaterial` (matcap gerado em canvas, `flatShading` para o visual facetado), cor multiplicada por um tint noturno que acompanha `nightMix`, e brilhos (laser, motor, lanterna, lua, "z") em `MeshBasicMaterial`/`SpriteMaterial` com `toneMapped: false` e cor acima de 1 para passar do limiar do Bloom. Geometrias, matcaps e texturas são criados uma vez por montagem e descartados no unmount.
- **Montagem.** O grupo do efeito fica `visible=false` fora da animação. Ele segue o nó `box_<slug>` do glb (a caixa sobe 15 cm no spring e o grupo sobe junto) ou, no grey-box, o mesh do `GameBox`. Nenhum mesh do efeito recebe raycast.
- **Frame.** O relógio avança por `delta` (limitado a 0,05 s), sem `setState`: tudo é ref ou objeto mutável. A coreografia é lógica pura em `fx/fxTimeline.ts` (spline Catmull-Rom do caça, balística dos saltos, as duas linhas do tempo), sem three nem React, e é testada em `fx/__tests__/fxTimeline.test.ts`.

### 6.5 TV da zona de jogos
A TV fica na parede acima do rack, é um componente próprio (`scene/WallTv.tsx`) e não tem hitbox: o clique nela cai na hitbox `digital` do rack. A mesa não mexe mais nela. O material segue o store:

| Estado do store | Tela |
|---|---|
| `hovered === 'shelf'` | estática retrô (shader com `uTime`) |
| `focused` + `shelf` + vista `digital` | "ligada no console": tela de título com o nome e o ano do jogo em `highlightBox`, tingida pelo `accent` dele (ou neutra). Ferramenta e contexto ficam só no painel |
| `playing` (jogo ligado) | o iframe do jogo (`TvGameHtml`, §6.6) cobre a TV inteira, 2 mm à frente da tela. Por baixo fica a tela de título neutra (`startGame` limpa o `highlightBox`) |
| qualquer outro | apagada |

Atrás da TV vai uma fita de LED rosa emissiva (`tv_backlight`), como na referência, para o Bloom.

### 6.6 Jogos na TV e no PC
Os jogos digitais podem ser jogados dentro do quarto. O campo `GameProject.play` (`content/types.ts`, tipo `GamePlay`) diz onde:

| `play` | Onde roda | Jogos |
|---|---|---|
| `{ where: 'tv', src, area? }` | build HTML5 do itch.io num iframe sobre a tela da TV. `src` é o embed oficial do itch.io (`itch.io/embed-upload/<id>`); o endereço direto do jogo (`html-classic.itch.zone`) é bloqueado fora do itch.io (anti-hotlink) | PorriLand, Piter, O Anel, Racco |
| `{ where: 'pc', app: 'memory' }` | app do XkrulesOS no monitor da mesa (`PcApp`) | Jogo da Memória ("Memória 4×4") |
| ausente | não é jogável no quarto | Duel Arena |

O Duel Arena não tem build web: a Cubio está em alfa e o cartão dele aponta para o download da plataforma.

**`TvGameHtml`** (o segundo `Html` do projeto, dentro de `Shelf.tsx`):
- drei `<Html transform>` com um wrapper de **tamanho fixo em px, 1280×716** (`TvGameScreen`, em `src/ui/tv`), preso 2 mm à frente da tela da TV (`LAYOUT.tv`). A conta de escala é a do `MonitorHtml` (`distanceFactor` cobre a largura, o eixo Y leva a correção mínima) e o `portal` também é estável, apontando para o pai do canvas (sem ele o drei recria a raiz React do `Html` e, em produção, o conteúdo some).
- Sem `occlude`: com o jogo rodando a câmera fica parada de frente para a TV. Sem jogo, o wrapper fica vazio e com `pointer-events: none`. Cliques no wrapper não sobem para a cena (o R3F leria `offsetX/Y` do elemento e viraria "clique fora").
- O iframe é o embed oficial do itch.io, que tem 1 px de borda e um rodapé de 20 px. Ele recebe uma área de jogo de 1280×720 (iframe de 1282×741, como o embed que o itch gera) e o conjunto é reduzido por CSS até caber na TV. Assim cada motor escala o jogo como no próprio itch: os de 640×360 em 2× e os de 1280×720 em 1×. Uma área menor que 720 de altura derruba o zoom inteiro do Construct 3 para 1×. Jogo de canvas fixo declara a própria `area` (`GamePlay`): o Piter, feito em GameMaker sem "scale to fit", desenha num canvas de 1760×990. Numa área menor o canvas vaza e aparecem barras de rolagem.
- Até o `load` do iframe aparece a tela "Ligando <jogo>" com a capa. No `load` o iframe recebe o foco do teclado; o clique no jogo continua necessário para liberar o áudio. Trocar de jogo remonta o iframe, e sem jogo nada fica montado (o áudio do jogo para junto).

**Com um jogo rodando (`playing !== null`)**
- Câmera: preset `shelfTv` (§4), sem painel.
- UI: o `Overlay` esconde o painel de Jogos. O `BackButton` vira "Sair do jogo" e chama `stopGame`. A `TvGameBar`, embaixo, mostra o título, "Tela cheia" (`requestFullscreen` no iframe; a tela cheia vai para o top layer e ignora as transformações 3D) e "Abrir no itch.io".
- Saída: `Esc` na página chama `stopGame`. Com o foco dentro do iframe o jogo fica com o `Esc`, então o botão "Sair do jogo" é a saída garantida. Clicar fora da TV (`onPointerMissed`) **não** volta para HOME enquanto há jogo.
- Render: o `ScenePause` troca o `frameloop` do R3F para `demand` (o `CameraControls` ainda invalida durante o voo e o resize redesenha) e volta a `always` quando o jogo acaba. O quarto parado não disputa GPU com o jogo.
- Qualidade: o `PerformanceMonitor` do `QualityManager` (`Effects.tsx`) é desmontado, para os quadros esparsos do `demand` não rebaixarem o `quality`. Volta zerado quando o jogo acaba.
- Áudio: com `playing !== null` o `AudioDirector` liga `setGameActive` no motor e a Música e o Ambiente vão a zero por rampa (o jogo tem o próprio som); o bus de Efeitos segue disponível. `muted` e `volumes` do visitante não mudam, e Música e Ambiente voltam quando o jogo acaba (§12.5).

**"Jogar no PC"** (Jogo da Memória): o cartão chama `openOnPc('memory')`. A câmera voa para a mesa (guarda 8, §3) e o `MonitorHtml` repassa o `pcLaunch` ao `MonitorScreen`, que o converte em `LaunchRequest` e o passa ao `Desktop` (prop `launch`). O `Desktop` trata cada `id` uma vez, durante o render (ajuste de estado por prop, sem efeito), e abre a janela `memory`. Se o SO estava desligado, ele liga junto.

---

## 7. Render, materiais e performance

**Budget alvo (desktop médio, 1080p)**
| Métrica | Alvo |
|---|---|
| Frame | ≤ 16 ms (60 fps) em desktop |
| Draw calls | < 120 (baked em HOME: 58; no hover o Outline re-renderiza a seleção e chega a ~102) |
| Triângulos | < 350k |
| Texturas | 1 lightmap 2K (KTX2) + demais ≤ 1K; total VRAM < 80 MB |
| Bundle JS inicial | < 400 kB gzip (three + fiber + drei já ≈ 250 kB) |
| Modelos | soma dos .glb < 12 MB (draco/meshopt) |

**Estratégias**
- Room: **um único `BakedMaterial`** (shader, §12.3) compartilhado por todos os nós baked; cor + luz + AO vêm do bake. Não usar `MeshStandardMaterial` no room. O AgX já vem aplicado na textura (o Blender aplica ao salvar o bake), então o `BakedMaterial` usa `toneMapped: false` e só converte para sRGB na saída.
- Telas/LEDs: `MeshBasicMaterial` + `emissive`-like via `color` brilhante e `toneMapped: false` para estourar no Bloom (threshold 0.9).
- Objetos animados (cadeira, partes da impressora, caixas, ponteiros) ficam no **mesmo `room.glb` e no mesmo atlas**, como nós separados: são baked na posição de repouso e movidos em runtime (ASSET_PIPELINE §3). O estático é unido em um mesh por zona (`zone_*`). O `room.glb` atual tem 56 meshes (um draw call cada) e 58 mil triângulos (manifest do bake de 2026-10-24); as caixas decorativas da estante ficam estáticas dentro de `zone_games` justamente para não somar nós (ASSET_PIPELINE §6 e §7).
- `<Canvas dpr={[1, 2]} gl={{ antialias: false, powerPreference: 'high-performance' }}>` + `<AdaptiveDpr pixelated />` + `<PerformanceMonitor onDecline={() => setQuality('medium')}>`. Antialias via `SMAA` no composer (mais barato que MSAA com Bloom).
- `quality`: `high` = Bloom+DoF+dpr 2; `medium` = Bloom, dpr 1.5, sem DoF; `low` = sem composer, dpr 1.
- `frameloop="always"` (há animações idle), mas parar o composer em `document.hidden`. Com um jogo rodando na TV o `ScenePause` passa para `demand` e o `PerformanceMonitor` sai de cena (§6.6).
- `<Bvh>` do drei ao redor da cena para raycast barato (mesmo com hitboxes simples, o piso/room pode receber raycast).
- Todo `.glb` carregado com `useGLTF(url)` e listado em `PRELOAD_LIST`; `LoadingScreen` chama `useGLTF.preload` para todos.
- `useMemo` para qualquer geometria criada em runtime (partículas, curvas). Materiais compartilhados exportados de um módulo `materials.ts`.

---

## 8. Overlay 2D e design system

Tokens em `globals.css` (`@theme` do Tailwind v4):
```
--color-bg-canvas: #0b1020 (azul-marinho profundo)   --color-accent-mint: #7ff5d0
--color-accent-blue: #6aa8ff                          --color-wood: #a8704a
--glass-bg: rgb(255 255 255 / 0.06)   --glass-border: rgb(255 255 255 / 0.14)   --glass-blur: 18px
```
`GlassCard` = `backdrop-blur-[var(--glass-blur)] bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl shadow-[inset 0 1px 0 rgb(255 255 255/.12)]`.

Layout do `Overlay`:
- `position: fixed; inset: 0; pointer-events: none` sempre. Só os filhos interativos recebem `pointer-events: auto`, e apenas em `focused`.
- Painéis laterais: largura `min(440px, 92vw)`, altura `100dvh`, à direita (chair, printer) ou esquerda (shelf), decidido no registry.
- `AnimatePresence mode="wait"` com variantes `initial: {x: 40, opacity: 0}`, `animate`, `exit`. Duração 0.35 s, ease `[0.22, 1, 0.36, 1]`.
- `BackButton` aparece em `focused` e `transitioning(to hotspot)`. `Esc` sempre ativo. Com um jogo na TV, o painel some, o botão vira "Sair do jogo" e a `TvGameBar` aparece embaixo (§6.6).
- Mobile: **adiado** (fora do escopo por enquanto, ver §0). O plano, se voltar: abaixo de 768px os painéis viram bottom-sheet de 70dvh e o monitor não usa `Html transform`; o `ProjectsApp` entra como painel DOM comum.

Ícones: `@phosphor-icons/react`, sempre pelos nomes com sufixo `Icon` (ex.: `GithubLogoIcon`; os nomes sem sufixo estão obsoletos). Peso `duotone` por padrão, que aproxima o estilo Bulk do Iconly da referência, e `regular` em controles pequenos. O pacote está em `experimental.optimizePackageImports`.

Acessibilidade mínima: painéis com `role="dialog"`, foco inicial no título, `aria-label` no botão voltar; a página tem `<noscript>` e um `<h1>` visualmente oculto com resumo e links (SEO/leitores de tela).

---

## 9. Dependências a adicionar

```bash
npm i zustand @react-spring/three motion @react-three/postprocessing postprocessing
```
```bash
npm i -D leva r3f-perf @gltf-transform/cli
```
Ícones (instalado antes das Fases 1 e 2.1, para os dois agentes paralelos não tocarem no lockfile):
```bash
npm i @phosphor-icons/react
```
`gltfjsx` roda via `npx gltfjsx`. Não instalar `gsap` (CameraControls + spring + motion cobrem tudo).

`next.config.ts`: adicionar `transpilePackages: ['three']` **apenas se** o build reclamar de ESM de `three/examples`; por padrão não é necessário. Headers de cache imutável para `/models/*` e `/textures/*` via `headers()`.

---

## 10. Fases (resumo; detalhes e prompts em BACKLOG.md)

| Fase | Entrega | Critério de pronto |
|---|---|---|
| 0 Fundação | deps, pastas, store, Canvas shell, loading, CameraRig+presets, hotspot system, overlay com Voltar/Esc, **grey-box** com primitivas | navegar entre 4 hotspots e home sem cortes, `tsc` e `lint` limpos |
| 1 UI 2D | tokens, GlassCard, painéis About/Printer/Games data-driven, conteúdo real em `content/*` | painéis abrem/fecham com motion |
| 2 Monitor OS | `MonitorHtml` + `ui/os/*` com janelas de projetos | clicável só em focused; sem distorção em resize |
| 3 Micro-interações 3D | cadeira spring, telas emissive, impressora eixos, caixas + partículas, Bloom/DoF, quality tiers | 60 fps desktop com composer ligado |
| 4 Assets reais | **substituída pela Fase V** (visual v2, §12 e BACKLOG) | — |
| V Visual v2 | cena gerada no Blender com bake, `BakedMaterial`, tema dia/noite, vida (telas, relógio, fumaça), câmera viva, XkrulesOS v2, áudio | competir visualmente com as referências (REFERENCES.md) |
| 5 Polish | áudio, reduced-motion, deep-link `?focus`, SEO fallback, analytics, deploy Vercel | Lighthouse perf ≥ 80 desktop |

---

## 11. Convenções de código

- TypeScript estrito; sem `any`. Props de componentes 3D tipadas com `ThreeElements['group']` etc.
- Componentes 3D: PascalCase, um por arquivo, `'use client'` **apenas** em `ExperienceLoader.tsx` (o resto já está do lado client por ser importado dele). A única outra exceção são os `Preview.tsx` das rotas `src/app/dev/**`, que são entradas client próprias.
- Nunca `setState` dentro de `useFrame`. Use refs + damp/spring.
- Nunca criar `new Vector3()`/`new Color()` dentro de `useFrame`; alocar no módulo ou `useMemo`.
- Nomes de nós do glb seguem `ASSET_PIPELINE.md` (ex.: `chair_root`, `printer_head`). Componentes gerados por gltfjsx vão para `experience/models/` e **não são editados**; a lógica fica no wrapper do hotspot.
- Conteúdo (textos, links, imagens) só em `src/content/*`. Componentes não têm strings de conteúdo hardcoded, e os textos de interface vêm dos hooks de idioma de `ui/i18n` (§13), nunca de `UI_TEXT` ou `OS_TEXT` direto.
- Commits: `feat(scope): ...` (`scope` = fase ou hotspot: `camera`, `chair`, `os`, `ui`, `assets`).

---

## 12. Visual v2 — cena baked gerada por código (decisão de 2026-10-01)

### 12.1 Por quê
As referências (Bruno Simon, Henry Heffernan, Julien Quenneville) são bonitas por causa da **luz pré-calculada no Blender**, não por geometria complexa. Primitivas chanfradas com GI, AO e sombras macias já parecem um diorama premium. O Blender 4.4 está instalado, então a cena é gerada por script Python (headless), revisável e repetível por agentes. Detalhes do contrato em ASSET_PIPELINE.md.

### 12.2 Direção de arte
- **Estilo:** diorama isométrico "quadradinho" e detalhado. Proporções robustas, bevel de 1 a 3 cm (2 a 3 segmentos) em tudo, nada de textura realista: cores sólidas, e o acabamento vem da luz baked e do AO.
- **Densidade:** de 60 a 90 objetos distintos. O quarto tem que parecer habitado.
- **Clima padrão:** noite. Ambiente baixo e frio, janela com cidade noturna, e três luzes de zona coloridas: TV rosa `#ff115e`, mesa laranja `#ff6700`, PC azul `#0082ff` (as cores de Bruno Simon). O tema dia é um bake à parte, com luz de janela quente.
- **Paleta:** piso de tábuas de madeira com frestas; paredes claras levemente tingidas; madeira quente nos móveis; plástico colorido nas caixas de jogos; borda da ilha escura.

Objetos por zona (posições das âncoras do `layout.ts`; decoração livre sem invadir hitboxes):

| Zona | Objetos |
|---|---|
| Quarto | piso em tábuas, rodapé, tomadas, janela com persiana ou cortina e cidade (`emit_window_city*`, dentro da espessura da parede: só aparece pelo vidro), quadros e pôsteres, relógio de parede com ponteiros (`clock_*`), ar-condicionado, planta grande (costela-de-adão), tapete |
| Mesa (`desk`) | dois monitores com moldura e suporte, teclado com teclas em grade, mouse e mousepad à direita, PC gamer com vidro e fans, headset no suporte, caneca com fumaça (`fx_mug_steam`), luminária ou light bar do monitor, caixas de som, suculenta, prateleira na parede com livros e figuras, fita de LED |
| Jogos (`shelf`) | rack com portas, console e controle, capinhas (`box_*` digitais), TV fina com LED atrás (`tv_backlight`), soundbar; estante com caixas variadas em pé e deitadas, dados, miniaturas, meeples, caixas autorais (`box_*` tabuleiro), caixas decorativas com capa real (Root e Heat em pé na prateleira 2, Everdell deitado na 3) e a Ever Tree de papelão modelada por script em cima do Everdell |
| Maker (`printer`) | bancada, impressora detalhada (estrutura, mesa, cabeça, eixo, carretel de filamento no suporte), carretéis num pegboard, alicate e paquímetro, peças impressas expostas |
| Cama | cama de casal com edredom dobrado, dois travesseiros, criado-mudo com abajur e celular (sem chinelos: saíram da frente da cama) |
| Cadeira (`chair`) | cadeira gamer com encosto alto, braços, base de 5 rodas (`chair_root`) |

### 12.3 Runtime
- `experience/scene/baked/BakedMaterial.ts`: `shaderMaterial` do drei portado de Bruno Simon (REFERENCES.md): `uBakedNight`, `uBakedDay`, `uLightMap`, `uNightMix`, e cor + força para TV, mesa e PC, com blend `lighten` (`mix(base, max(base, cor), canal × força)`). Sem tone mapping no runtime (o bake já sai do Blender com AgX); `#include <colorspace_fragment>` no fim. Valores iniciais de Bruno Simon: forças TV 1.47, mesa 1.9, PC 1.4.
- `experience/scene/baked/BakedRoom.tsx`: carrega `room.glb` e as três texturas (`useGLTF`, `useTexture`, preload na tela de loading), aplica o `BakedMaterial` em todos os nós da categoria baked e os materiais próprios nas outras categorias. Expõe os nós por nome num contexto (`useRoomNode(name)`) para hotspots e animações.
- **Tema:** `store.theme` (`'night' | 'day'`, padrão noite) e `toggleTheme()`. O `uNightMix` faz damp até o alvo. Botão no HUD.
- **Luzes de zona reagem ao foco:** hover ou foco na mesa aumenta G e B; na zona de jogos aumenta R. Damp, sem setState no frame.
- **Hitboxes e câmera não mudam:** continuam vindo do `layout.ts`. O glb tem que respeitar as mesmas posições.
- **Fallback:** com `?greybox` na URL, ou se os assets falharem, renderiza a cena procedural atual (`scene/placeholders`).
- **Luzes dinâmicas:** nenhuma na cena baked. O `Lights.tsx` só existe para o grey-box.

### 12.4 Vida na cena (o que roda em cima do bake)
Cadeira com balanço idle somado ao giro do hover, telas com conteúdo (vídeo ou canvas: editor de código rolando no monitor vertical, descanso de tela com logo quicando na TV), fans e fitas de LED pulsando, relógio com hora real, fumaça da caneca, impressora animada, caixas com spring e destaque, partículas na zona de jogos, animações das caixas de board game (caça imperial da Conquista Galáctica e meeples da Aldeia Dorme, §6.4), contorno no hover dos hotspots. Monitor do XkrulesOS com camadas de sujeira e reflexo por cima do HTML (Henry Heffernan).

### 12.5 Áudio (V.5)
O som é **todo sintetizado** em Web Audio: nenhum arquivo de som, nenhum import de `three`/R3F. O motor fica em `src/lib/audio` (importável por `ui/**` e `experience/**`) e o `AudioDirector` (`src/experience/audio`) liga o 3D e o store a ele.

| Arquivo (`src/lib/audio`) | Papel |
|---|---|
| `engine.ts` | `audio`, o único motor do app. `unlock()` cria o `AudioContext`, os buses, o master e o limitador (precisa de gesto); `setMuted`, `setVolumes`, `setGameActive`, `setFanLevel`, `setAmbientLevel`, `keyClick`, `mouseClick`, `tvStatic`, `getDebug`. Criá-lo não toca em `window`: seguro no SSR |
| `volumes.ts` | folha pura: categorias `music`, `ambient` e `effects`, `DEFAULT_VOLUMES` (Música 0,35, Ambiente 0,5, Efeitos 0,8), curva de ganho do bus e a preferência salva (`portfolio3d:sound:v1`) |
| `score.ts` | folha pura: a partitura (harmonia, condução de vozes, padrões) e o `Sequencer` com lookahead |
| `music.ts` | toca a partitura com vozes sintetizadas (a música lo-fi) |
| `voices.ts` | zumbido da ventoinha e ambiente (laços de ruído), cliques de tecla e de mouse, estática da TV |
| `mix.ts` | `VOICE_GAIN`, alvos de loudness (`LEVEL_TARGETS_DB`), curvas de distância e o limitador de saturação suave |
| `noise.ts` | ruído branco, marrom e o chiado de vinil |
| `measure.ts` | só em dev: renderiza cada voz offline e mede o nível (`window.__audio.measure()`) |

**Grafo.** Voz → **bus da categoria** → master → limitador (`WaveShaper` de saturação suave, joelho em 0,6) → destino. O master sobe e desce por rampa (`setTargetAtTime`), então ligar e desligar nunca estala.

| Bus | O que passa |
|---|---|
| Música | a música lo-fi gerada |
| Ambiente | o zumbido do PC (volume pela distância da câmera ao PC) e o ambiente noturno (pela distância ao centro do quarto) |
| Efeitos | os cliques de tecla e de mouse no SO do monitor e a estática da TV |

O ganho de cada bus segue o slider do visitante por uma curva quadrática, normalizada no volume padrão (no padrão vale 1; zero é silêncio exato). As vozes foram calibradas offline para esse padrão (`measureVoices`, contra os alvos de `LEVEL_TARGETS_DB`): o alvo da música é -36 dBFS de RMS, abaixo do zumbido do PC (-34).

**A música.** Gerada em tempo real, em Fá maior, a 75 BPM. O ciclo tem 12 compassos, três frases de 4 (`Gm9 C9 Fmaj9 Dm9`, `Bbmaj9 Am9 Gm9 C9` e `Fmaj9 Bbmaj9 Am9 Dm9`: ii-V-I-vi, IV-iii-ii-V e I-IV-iii-vi) e volta ao início sem emenda. As vozes entram em camadas (teclado; depois baixo e chimbal; depois bumbo e caixa) e a cada ciclo muda o humor (melodia, bumbo, chimbal). Instrumentos: piano elétrico FM com tremolo e eco, baixo triangular, bateria com swing (caixa atrasada), chiado de vinil, "wow/flutter" de fita e passa-baixa quente.
- **Agendamento com lookahead.** Um timer de 250 ms agenda as notas dos próximos 1,6 s pelo relógio do `AudioContext` (`currentTime`, não o do timer) e cria os nós só dessas notas, que se soltam sozinhos. O atraso do timer nunca estraga o ritmo.
- **Só trabalha quando alguém ouve.** O gerador é criado na primeira vez que alguém o ouviria e só agenda notas com o som ligado, a aba visível, nenhum jogo na TV e o slider acima de 0,5%.

**Entrada e preferência.**
- O `AudioContext` precisa de um gesto. O clique em "Entrar" (`LoadingBridge`) o cria e chama `enterWithSound()`: o visitante **entra com som**, com a música baixinha nos volumes padrão, a menos que já tenha escolhido ligar ou silenciar (a escolha salva vale). A tela de loading avisa antes do clique (`boot.soundNote`). Sem Web Audio, o site segue mudo.
- O botão de som do HUD abre o `SoundMenu`, um popover com o mudo geral e um slider por categoria. Ligar o som por ali também cria o `AudioContext`, dentro do clique.
- A preferência fica no `localStorage`, na chave `portfolio3d:sound:v1`, `{ muted?, volumes? }`: o `muted` só entra se o visitante o escolheu, e de `volumes` só o que difere do padrão. JSON quebrado ou localStorage bloqueado voltam ao padrão sem erro (§3, guarda 10).

**Silêncio automático.**
- Aba escondida conta como mudo. Mudo ou aba escondida por mais de 450 ms **suspende o contexto**; ligar o retoma.
- Com um jogo na TV (`playing`), Música e Ambiente vão a zero por rampa, sem mexer nas preferências (§6.6).
- A estática da TV toca no hover da zona de jogos e ao trocar de sub-vista dentro dela, com volume pela distância à TV e um intervalo mínimo entre disparos.

**Testes e debug.** `lib/audio/__tests__/{mix,noise,score,volumes}.test.ts` (`node --test`). Em dev, `window.__audio` expõe `debug()`, `measure()` e o `engine`.

---

## 13. Idiomas (português e inglês)

O site tem dois idiomas, `pt` (padrão e idioma-fonte) e `en`, trocados em runtime, sem rota nova. **O server fica sempre em pt-BR**: `layout.tsx` (`<html lang="pt-BR">`, metadata, OpenGraph), `app/page.tsx` (`<h1>`, `<noscript>`) e o SEO usam os exports em português. O inglês só entra no cliente, depois da hidratação.

| Peça | Onde | Papel |
|---|---|---|
| Tipos | `content/i18n.ts` | `Locale = 'pt' \| 'en'`, `LOCALES`, `DEFAULT_LOCALE`, `LOCALE_INFO` (`htmlLang`, `label`, `name`, `intl`), `ByLocale<T>`, `Widened<T>`. Folha pura, sem imports |
| Textos em inglês | `content/en/*.ts` | `about`, `hotspots`, `os`, `projects.games`, `projects.print`, `projects.web`, `screens` e `site`, escritos com `satisfies Widened<typeof PT>`: chave faltando ou sobrando é erro de compilação |
| Mapas por idioma | ao lado de cada export em português | `UI_TEXT_BY_LOCALE`, `OS_TEXT_BY_LOCALE`, `SCREEN_TEXT_BY_LOCALE`, `EDITOR_CODE_BY_LOCALE`, `SITE_BY_LOCALE`, `ABOUT_BY_LOCALE`, `GAME_PROJECTS_BY_LOCALE`, `WEB_PROJECTS_BY_LOCALE`, `PRINT_SHOWCASE_BY_LOCALE`, `HOTSPOTS_BY_LOCALE`. Os exports em português (`UI_TEXT`, `SITE`, `HOTSPOTS`...) continuam valendo `pt` |
| Pacote | `content/locales.ts` | `contentFor(locale)` devolve tudo do idioma (`ui`, `os`, `screens`, `editorCode`, `site`, `about`, `games`, `web`, `print`, `hotspots`, `getHotspot`). Montado uma vez por idioma: a referência nunca muda, serve de dependência de memo |
| Detecção | `lib/locale.ts` | módulo folha, testado com `node --test`: `pickLocale`, `detectInitialLocale`, `readStoredLocale`, `writeStoredLocale`, `applyDocumentLang` |
| Store | `store.locale` e `setLocale` | §3 |
| Hooks | `ui/i18n/useLocale.ts` | `useLocale`, `useContent`, `useUiText`, `useOsText` |
| Documento | `ui/i18n/useDocumentLocale.ts` | `<html lang>` e `document.title` acompanham o idioma. Chamado pela `LoadingScreen`, o primeiro componente que existe no cliente |
| URL | `experience/interaction/useUrlSync.ts` | mantém `?lang=` junto de `?focus` e `?view` |
| Seletor | `ui/overlay/LanguageSwitch.tsx` | "PT \| EN" no HUD |

**Regras**
- **Só texto muda.** Slug, links, anos, cores, stack, imagens e `src` de ícones são compartilhados; o inglês é aplicado por cima do dado em português (`localizeWeb` em `projects.web.ts`, por exemplo). Títulos oficiais de jogos ficam como são.
- **Detecção.** `?lang=` na URL, depois o `localStorage` (`portfolio3d:locale`), depois `navigator.language` (começa com `pt` é português; o resto é inglês). No server e nos testes do node vale `pt`. `setLocale` grava a escolha, atualiza `<html lang>` e ignora idioma inválido.
- **Hidratação.** `useLocale` usa `useSyncExternalStore` com snapshot de server `pt`: o primeiro render bate com o HTML do servidor e, logo depois, troca para o idioma detectado.
- **Componentes de `ui/**` não importam `UI_TEXT` nem `OS_TEXT` direto**: usam os hooks. O canvas lê o idioma sem passar pelo React: as telas desenhadas (TV, papel de parede e editor de código) usam `useExperienceStore.getState().locale` e se redesenham quando ele muda. O editor de código continua a digitação de onde estava. O relógio do papel de parede, o do SO, a data do terminal e os números do painel da impressora usam `LOCALE_INFO[locale].intl`.
- **URL.** `?lang=` está sempre presente, gravado na montagem e a cada troca por `history.replaceState`. Um link copiado abre no mesmo idioma.
- **HUD.** O `LanguageSwitch` fica no canto superior direito, em `idle`, junto de Som e Tema. É um grupo com um botão por idioma (`aria-pressed` no ativo); o nome acessível de cada botão é o idioma escrito nele mesmo ("Português (PT)") e cada botão leva o `lang` do próprio idioma.
- **Texto novo.** Escreva em português e em `content/en/` (o compilador acusa o que faltar). Idioma novo: acrescente-o em `LOCALES` e preencha todo `ByLocale` (o compilador acusa o mapa que faltar) e `LOCALE_INFO`.
- **Testes.** `content/__tests__/i18n.test.ts` (mesmas chaves, mesmos `{modelos}` e `[TODO: ...]`, dados idênticos nos dois idiomas, nomes antigos valem `pt`, referência estável) e `lib/__tests__/locale.test.ts` (URL > localStorage > navegador, persistência sem lançar).
