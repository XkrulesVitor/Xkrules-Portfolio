# Arquitetura — Portfólio 3D "Diorama Isométrico / Quarto Gamer"

> Documento-fonte de verdade. Qualquer subagente que for codar **lê este arquivo antes** e segue as decisões aqui registradas. Mudanças de arquitetura são feitas aqui primeiro, depois no código.

Relacionados: [ASSET_PIPELINE.md](./ASSET_PIPELINE.md) · [BACKLOG.md](./BACKLOG.md)

---

## 0. Decisões fixas (TL;DR)

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
| HTML dentro do 3D | **Apenas o monitor** usa `<Html transform occlude="blending">`. Os painéis "Sobre", "Impressora" e "Games" são **DOM overlay fora do Canvas** | Overlay DOM é mais nítido, acessível e não sofre distorção de resize |
| Iluminação | 100% **baked** (lightmap/AO na textura) + materiais **emissivos** para telas e LEDs. Zero luzes dinâmicas com sombra | 60 fps estáveis |
| Loading | `useProgress` + `useGLTF.preload` de todos os `.glb` na tela de loading, depois voo de câmera de introdução | Cache completo antes da interação |
| Estilo | Tailwind v4 (já instalado) + tokens CSS no `globals.css` | Glassmorphism via utilitários e variáveis |
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
│  ├─ page.tsx                # SERVER component: SEO + <noscript> fallback + <ExperienceLoader/>
│  └─ globals.css             # tokens de design (cores, glass, blur), reset
│
├─ experience/                # TUDO que roda dentro/ao redor do <Canvas> (client-only)
│  ├─ ExperienceLoader.tsx    # 'use client'; next/dynamic(ssr:false) + <LoadingScreen/>
│  ├─ Experience.tsx          # <Canvas> + <Suspense> + <Scene/> + <Effects/> + <CameraRig/>
│  ├─ scene/
│  │  ├─ Scene.tsx            # composição: <Room/> + 4 hotspots + <Lights/>
│  │  ├─ Room.tsx             # geometria estática baked (1 draw call por atlas), inclui a cama
│  │  ├─ WallTv.tsx           # TV de parede COMPARTILHADA por desk e shelf (§6.5)
│  │  ├─ Lights.tsx           # só ambient/hemisphere fraca (o resto é baked)
│  │  ├─ Effects.tsx          # EffectComposer condicional (Bloom, DoF)
│  │  └─ placeholders/        # grey-box (primitivas) usado até os .glb existirem
│  ├─ hotspots/
│  │  ├─ chair/   Chair.tsx · useChairSpring.ts
│  │  ├─ desk/    Desk.tsx · Screens.tsx (emissive) · MonitorHtml.tsx (<Html transform>)
│  │  ├─ printer/ Printer.tsx · usePrinterAnimation.ts
│  │  └─ shelf/   Shelf.tsx · GameBox.tsx · ShelfParticles.tsx
│  ├─ camera/
│  │  ├─ CameraRig.tsx        # <CameraControls makeDefault> + subscribe no store
│  │  ├─ presets.ts           # HOME + 1 preset por hotspot (position, target, limites)
│  │  └─ useCameraTransition.ts
│  ├─ interaction/
│  │  ├─ useHotspot.ts        # hook único: {hovered, focused, bind} para qualquer hotspot
│  │  └─ useKeyboard.ts       # Esc → home
│  ├─ audio/
│  │  └─ useAudio.ts          # sons opcionais (ventoinha, estática), mudo por padrão
│  └─ models/                 # componentes GERADOS por gltfjsx (não editar à mão)
│
├─ ui/                        # DOM 2D, FORA do Canvas
│  ├─ overlay/
│  │  ├─ Overlay.tsx          # roteia painel por store.focus; pointer-events controlado
│  │  ├─ Hud.tsx              # logo, dica "arraste para explorar", botão som
│  │  ├─ BackButton.tsx       # "← Voltar" (Esc)
│  │  └─ LoadingScreen.tsx    # barra useProgress + botão "Entrar"
│  ├─ panels/
│  │  ├─ AboutPanel.tsx       # chair
│  │  ├─ PrinterPanel.tsx     # printer (carrossel de fotos, specs, link loja)
│  │  └─ GamesPanel.tsx       # shelf (abas: tabuleiro / digital)
│  ├─ os/                     # UI que renderiza DENTRO do monitor (via <Html transform>)
│  │  ├─ Desktop.tsx · Taskbar.tsx · Window.tsx
│  │  └─ apps/ ProjectsApp.tsx · ProjectWindow.tsx
│  └─ primitives/             # GlassCard, Tabs, Carousel, IconButton, Kbd
│
├─ store/
│  ├─ useExperienceStore.ts   # zustand + subscribeWithSelector
│  └─ selectors.ts
│
├─ content/                   # DADOS tipados; painéis são 100% data-driven
│  ├─ hotspots.ts             # registry: id, label, preset de câmera, painel
│  ├─ about.ts
│  ├─ projects.web.ts         # Inatel², CP2eJR Corporative, ...
│  ├─ projects.print.ts       # Reino de Amestris
│  ├─ projects.games.ts       # Porrilândia, Peter, Terra, Aldeia Dorme, O Anel...
│  └─ types.ts
│
├─ lib/
│  ├─ device.ts               # isTouch, prefersReducedMotion, gpuTier (simples)
│  ├─ math.ts                 # helpers pequenos (clamp, mapRange)
│  └─ constants.ts
│
public/
├─ models/    *.glb (draco/meshopt) — ver ASSET_PIPELINE.md
├─ textures/  *.ktx2 / *.webp
├─ media/     imagens/vídeos dos projetos
└─ draco/     decoder (copiado de three/examples/jsm/libs/draco/gltf/)
docs/
scripts/      optimize-models.mjs (gltf-transform)
```

**Regras de fronteira**
- Nada em `src/ui/**` importa `three` ou `@react-three/*`. Comunicação apenas via `store` e `content`.
- Nada em `src/experience/**` renderiza DOM fixo (exceto `MonitorHtml` via drei `Html`).
- `src/content/**` não importa React. São dados puros + tipos.

---

## 3. Máquina de estados (store)

```ts
// src/store/useExperienceStore.ts
export type HotspotId = 'chair' | 'desk' | 'printer' | 'shelf'
export type Mode = 'loading' | 'intro' | 'idle' | 'transitioning' | 'focused'

interface ExperienceState {
  mode: Mode
  focus: HotspotId | null          // alvo atual (durante transitioning = destino)
  hovered: HotspotId | null
  quality: 'high' | 'medium' | 'low'
  audioEnabled: boolean
  // ações
  setMode(m: Mode): void
  setHovered(id: HotspotId | null): void
  requestFocus(id: HotspotId): void   // idle → transitioning(focus=id)
  requestHome(): void                 // focused|transitioning → transitioning(focus=null)
  onCameraRest(): void                // transitioning → focused | idle
  setQuality(q): void
  toggleAudio(): void
}
```

**Guardas (invariantes)**
1. `requestFocus` é aceito em `idle`, em `intro` e em `transitioning` **de volta para HOME** (`focus === null`): um clique enquanto a câmera ainda retorna não pode ser perdido. É ignorado em `loading`, `focused` e `transitioning` rumo a outro hotspot (evita spam de câmera).
2. `requestHome` é aceito em `focused` **e** `transitioning` (usuário pode cancelar uma entrada).
3. `hovered` é sempre `null` quando `mode !== 'idle'` (evita cadeira girando enquanto a câmera está nela).
4. `onCameraRest` é chamado **apenas** pelo `CameraRig` (fonte única de verdade do "chegou").
5. Painéis DOM só recebem `pointer-events: auto` quando `mode === 'focused'`.

**Quem lê o quê**
- Componentes 3D leem o store com `useExperienceStore(selector)` para JSX, e com `useExperienceStore.subscribe(selector, cb)` / `getState()` dentro de `useFrame` para valores por frame.
- URL: em `focused` sincronizar `?focus=<id>` via `history.replaceState` (shallow). Na carga, se houver `?focus`, pular o intro e ir direto ao preset.

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
- Cada hotspot tem seu preset. Desk: câmera **exatamente** perpendicular à tela do monitor (target = centro da tela, position = target + normal * d), `userControl:false`.
- Preferência `prefers-reduced-motion`: `smoothTime = 0` e `setLookAt(..., false)`.
- Afinar valores com `leva` em dev (painel `Camera` com botões "copiar preset atual"). Presets finais ficam hardcoded.
- **Enquadramento responsivo (pendente, BACKLOG 3.6)**: os presets são posições fixas, afinadas em 16:9. Em 4:3 e em retrato o conteúdo escapa do quadro ou fica sob o painel (medido na estante: em 4:3 a TV entra sob o painel esquerdo). A solução planejada troca `position` fixa por `{ focusBox, direction, panelSide }` e deixa o `CameraRig` calcular a distância e o deslocamento lateral a partir do aspect e da largura do painel.
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

**Hitbox**: cada hotspot tem um `<mesh visible={false}>` simples (box) por cima da geometria detalhada para raycast barato e área generosa. A geometria detalhada tem `raycast={() => null}`.

**Registry** (`content/hotspots.ts`): `{ id, label, description, panel: 'about'|'os'|'printer'|'games', preset: keyof PRESETS }`. O `Overlay` usa o registry para decidir qual painel montar.

---

## 6. Comportamento por hotspot (implementação)

### 6.0 Layout espacial (mundo, 1 unidade = 1 m)
Ilha de 10 × 8 com origem no centro do piso. Paredes em x = -5 (esquerda) e z = -4 (fundo). A câmera HOME olha da diagonal +X/+Z.

| Elemento | Posição | Observação |
|---|---|---|
| Mesa em L | tampo principal na parede esquerda, asa na parede do fundo (x -4.75 a -1.75) | monitores voltados para +X |
| TV de parede | centro (-2.85, 2.3, -3.85), acima da asa | compartilhada por `desk` e `shelf` (§6.5) |
| Estante | centro (-0.6, 0, -3.6), colada à direita da TV | "zona de jogos": TV, console e caixas no mesmo quadro |
| Bancada + impressora | centro (1.75, 0.9, -3.4) | maker space à direita |
| Cama | canto direito do fundo, x 3.3 a 4.8 | estática, sem hotspot, vai no `room-static.glb` |
| Cadeira | (-2.75, 0, -1.0) | à frente, de costas para a câmera |

Regra das hitboxes: elas não se sobrepõem. A da mesa vai até x = -1.7, a da estante ocupa x -1.55 a 0.35 e a da impressora começa em 0.35.

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
| Hover | `useFrame`: `damp(mat, 'emissiveIntensity', active ? 1.6 : 0, 0.25, dt)` em monitor e monitor vertical; a TV de parede acende no modo `desk` (§6.5); LED do gabinete pulsa (`sin(t*4)`); áudio opcional de ventoinha (só se `audioEnabled`) |
| Click | preset `desk` perpendicular à tela. Quando `mode === 'focused'`, `MonitorHtml` troca `pointerEvents` de `none` → `auto` e o SO fictício (`ui/os/*`) ganha interação |
| Voltar | janelas minimizam (motion), câmera recua |

**`MonitorHtml`** (o único `Html` do projeto):
```tsx
<Html
  transform
  occlude="blending"
  position={screenCenter} rotation={screenRotation}
  distanceFactor={SCREEN_DISTANCE_FACTOR}   // calibrado para 1 CSS px == 1 "pixel" da tela 3D
  style={{ width: 1280, height: 720, pointerEvents: focused ? 'auto' : 'none' }}
  zIndexRange={[10, 0]}
>
  <Desktop />
</Html>
```
Regra anti-distorção: o wrapper tem **tamanho fixo em px** (1280×720) e todo o layout interno usa unidades relativas a esse wrapper (`%`, `cqw` via `container-type: size`). Nunca usar `vw/vh` dentro do monitor. O `transform` do drei escala o bloco todo junto com o 3D; resize da janela não muda o layout interno.

Antes do focus, a tela mostra um "wallpaper" estático (mesh emissivo com textura), e o `Html` fica com `visible=false`/opacidade 0 para poupar CSS3D. Ao chegar, faz crossfade.

### 6.3 `printer` — Reino de Amestris
| Estado | Implementação |
|---|---|
| Idle | estática |
| Hover | `usePrinterAnimation(active)`: nós `printer_axisZ` (sobe/desce lento), `printer_head` (Lissajous em X/Y), `printer_led` emissive on. Tudo via refs em `useFrame`, sem state |
| Click | preset macro na base; a peça em impressão (`printer_part`) ganha `visible` progressivo (scale Y de 0.2 → 1 via damp) |
| Voltar | animação pausa (damp de volta), painel colapsa |

Painel: `PrinterPanel` com carrossel (`ui/primitives/Carousel`) de fotos reais, specs de slicer, link da loja. Fotos em `public/media/print/*.webp`.

### 6.4 `shelf` — Board games & Game dev
| Estado | Implementação |
|---|---|
| Idle | caixas alinhadas |
| Hover | `GameBox` usa spring `z: active ? 0.08 : 0` (projeta para fora). A TV de parede entra no modo `shelf` e mostra estática retrô (§6.5) |
| Click | preset "zona de jogos": TV e estante inteira no mesmo quadro; `ShelfParticles` (drei `Sparkles`, count ≤ 80) monta |
| UI | `GamesPanel` com abas. Hover em item do painel → `store.highlightBox = slug` → `GameBox` correspondente faz spring extra |
| Voltar | partículas desmontam, caixas voltam, câmera recua |

Isso exige um campo extra no store: `highlightBox: string | null` (única exceção de comunicação UI→3D além de focus).

Conteúdo físico da estante (o slug é o mesmo de `content/projects.games.ts` e do nó `box_<slug>`):
- **Board games autorais** (`terra`, `aldeia_dorme`): caixas grandes na prateleira 1.
- **Jogos digitais e game jams** (`porrilandia`, `peter`, `o_anel`): capinhas ao lado do console, na prateleira 3.
- **Decoração** (Root, Heat, pilhas, miniaturas, dados): estática, sem slug, fundida no `shelf_frame`.

### 6.5 TV de parede compartilhada
A TV acima da asa da mesa é a tela do PC **e** a tela do console da estante. Ela é um componente próprio (`scene/WallTv.tsx`), fora dos dois hotspots, e seu material segue o store:

| Estado do store | Tela |
|---|---|
| `hovered` ou `focus` = `desk` | acende com o wallpaper emissivo, junto com os monitores |
| `hovered` ou `focus` = `shelf` | estática retrô (shader com `uTime`); em `focused`, pode mostrar a capa do jogo em `highlightBox` |
| qualquer outro | apagada |

A TV não tem hitbox própria. O hover nela cai na hitbox da mesa, o que mantém a regra "um hover, um hotspot". Como `hovered` só guarda um id, os dois modos nunca disputam a tela.

---

## 7. Render, materiais e performance

**Budget alvo (desktop médio, 1080p)**
| Métrica | Alvo |
|---|---|
| Frame | ≤ 16 ms (60 fps); ≥ 30 fps em mobile |
| Draw calls | < 120 |
| Triângulos | < 350k |
| Texturas | 1 lightmap 2K (KTX2) + demais ≤ 1K; total VRAM < 80 MB |
| Bundle JS inicial | < 400 kB gzip (three + fiber + drei já ≈ 250 kB) |
| Modelos | soma dos .glb < 12 MB (draco/meshopt) |

**Estratégias**
- Room estático: **um material `MeshBasicMaterial` com `map` = atlas baked** (cor + luz + AO já no bake). Não usar `MeshStandardMaterial` no room. `toneMapped: true`.
- Telas/LEDs: `MeshBasicMaterial` + `emissive`-like via `color` brilhante e `toneMapped: false` para estourar no Bloom (threshold 0.9).
- Objetos animados (cadeira, cabeça da impressora, caixas) ficam em **glb separados** com bake próprio, para não quebrar o atlas do room.
- `<Canvas dpr={[1, 2]} gl={{ antialias: false, powerPreference: 'high-performance' }}>` + `<AdaptiveDpr pixelated />` + `<PerformanceMonitor onDecline={() => setQuality('medium')}>`. Antialias via `SMAA` no composer (mais barato que MSAA com Bloom).
- `quality`: `high` = Bloom+DoF+dpr 2; `medium` = Bloom, dpr 1.5, sem DoF; `low` = sem composer, dpr 1.
- `frameloop="always"` (há animações idle), mas parar o composer em `document.hidden`.
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
- `BackButton` aparece em `focused` e `transitioning(to hotspot)`. `Esc` sempre ativo.
- Mobile (`< 768px`): painéis viram bottom-sheet (altura 70dvh) e o monitor **não** usa `Html transform`: o `ProjectsApp` é montado como painel DOM comum (mesmo componente, container diferente).

Acessibilidade mínima: painéis com `role="dialog"`, foco inicial no título, `aria-label` no botão voltar; a página tem `<noscript>` e um `<h1>` visualmente oculto com resumo e links (SEO/leitores de tela).

---

## 9. Dependências a adicionar

```bash
npm i zustand @react-spring/three motion @react-three/postprocessing postprocessing
```
```bash
npm i -D leva r3f-perf @gltf-transform/cli
```
`gltfjsx` roda via `npx gltfjsx`. Não instalar `gsap` (CameraControls + spring + motion cobrem tudo).

`next.config.ts`: adicionar `transpilePackages: ['three']` **apenas se** o build reclamar de ESM de `three/examples`; por padrão não é necessário. Headers de cache imutável para `/models/*` e `/textures/*` via `headers()`.

---

## 10. Fases (resumo; detalhes e prompts em BACKLOG.md)

| Fase | Entrega | Critério de pronto |
|---|---|---|
| 0 Fundação | deps, pastas, store, Canvas shell, loading, CameraRig+presets, hotspot system, overlay com Voltar/Esc, **grey-box** com primitivas | navegar entre 4 hotspots e home sem cortes, `tsc` e `lint` limpos |
| 1 UI 2D | tokens, GlassCard, painéis About/Printer/Games data-driven, conteúdo real em `content/*` | painéis abrem/fecham com motion; mobile bottom-sheet |
| 2 Monitor OS | `MonitorHtml` + `ui/os/*` com janelas de projetos | clicável só em focused; sem distorção em resize |
| 3 Micro-interações 3D | cadeira spring, telas emissive, impressora eixos, caixas + partículas, Bloom/DoF, quality tiers | 60 fps desktop com composer ligado |
| 4 Assets reais | pipeline Blender → glb → gltfjsx, substituir placeholders | draw calls e tris dentro do budget |
| 5 Polish | áudio, touch, reduced-motion, deep-link `?focus`, SEO fallback, analytics, deploy Vercel | Lighthouse perf ≥ 80 mobile |

---

## 11. Convenções de código

- TypeScript estrito; sem `any`. Props de componentes 3D tipadas com `ThreeElements['group']` etc.
- Componentes 3D: PascalCase, um por arquivo, `'use client'` **apenas** em `ExperienceLoader.tsx` (o resto já está do lado client por ser importado dele).
- Nunca `setState` dentro de `useFrame`. Use refs + damp/spring.
- Nunca criar `new Vector3()`/`new Color()` dentro de `useFrame`; alocar no módulo ou `useMemo`.
- Nomes de nós do glb seguem `ASSET_PIPELINE.md` (ex.: `chair_root`, `printer_head`). Componentes gerados por gltfjsx vão para `experience/models/` e **não são editados**; a lógica fica no wrapper do hotspot.
- Conteúdo (textos, links, imagens) só em `src/content/*`. Componentes não têm strings de conteúdo hardcoded.
- Commits: `feat(scope): ...` (`scope` = fase ou hotspot: `camera`, `chair`, `os`, `ui`, `assets`).
