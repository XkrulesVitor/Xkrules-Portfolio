# Backlog por fases — com prompts prontos para subagentes (Sonnet)

Cada tarefa é autocontida: um subagente lê `docs/ARCHITECTURE.md` (e `docs/ASSET_PIPELINE.md` quando indicado), executa, e valida com os comandos de aceite. Rode as tarefas **na ordem** dentro de cada fase; fases podem se sobrepor apenas onde indicado.

Prompt-padrão (prefixo de toda tarefa):

```
Você é um dev frontend sênior em React Three Fiber. Antes de codar, leia docs/ARCHITECTURE.md
inteiro e siga as decisões, a estrutura de pastas e as convenções de código (§2, §3, §11).
Leia também node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md (regra do ssr:false).
Não altere docs/*.md. Não instale dependências além das listadas na tarefa.
Ao terminar rode: npx tsc --noEmit && npm run lint && npm run build. Corrija até passar.
(Em execução paralela vale o "Protocolo de execução paralela" abaixo: sem build, checagens filtradas.)
Reporte em 10 linhas: arquivos criados, decisões tomadas, o que ficou pendente.
```

Legenda de aceite: **A** = `tsc`/`lint`/`build` limpos · **M** = verificação manual no browser (`npm run dev`).

**Status (2026-10-01):** Fases 0, 1, 2.1 e 2.2 concluídas e comitadas; o XkrulesOS roda em produção (correção do `portal` estável no `MonitorHtml`). A Fase 3 não chegou a ser implementada e foi absorvida pela **Fase V** (visual v2, ARCHITECTURE §12), assim como as Fases 4 e 5. Onda 1 (V.1 arte draft, V.4 câmera, V.6 SO) onda 2 (V.2 runtime baked) e onda 3 (V.3 vida, V.5 som e acabamento) concluídas entre 2026-10-01 e 2026-10-02. V.7 em 2026-10-02: bake final 2048² comitado; o enquadramento responsivo da V.4 já cabe nas vistas com o glb final (sem recalibração); `sitemap.xml` e `robots.txt`. Falta: deploy (PR do dono) e Lighthouse em produção.

---

## Fase 0 — Fundação (grey-box navegável)

### 0.1 Dependências, tokens e shell client-only
- Instalar: `npm i zustand @react-spring/three motion @react-three/postprocessing postprocessing` e `npm i -D leva r3f-perf`.
- Criar a árvore de pastas de ARCHITECTURE §2 (com `.gitkeep` onde vazio).
- `globals.css`: tokens de §8 no `@theme`, `html, body { height: 100%; overflow: hidden; background: var(--color-bg-canvas) }`.
- `app/layout.tsx`: `lang="pt-BR"`, metadata real (title/description do portfólio), fontes Geist mantidas.
- `app/page.tsx` (server): `<h1 class="sr-only">`, `<noscript>` com links, e `<ExperienceLoader/>`.
- `experience/ExperienceLoader.tsx` (`'use client'`): `next/dynamic(() => import('./Experience'), { ssr:false, loading: () => <LoadingScreen/> })`.
- `experience/Experience.tsx`: `<Canvas dpr={[1,2]} gl={{antialias:false, powerPreference:'high-performance'}} camera={{fov:35}}>` + `<Suspense>` + `<Scene/>` + `<CameraRig/>`; `r3f-perf` só em `NODE_ENV=development`.
- Aceite: **A**; **M** canvas ocupa a viewport com fundo azul-marinho.

### 0.2 Store + máquina de estados
- `store/useExperienceStore.ts` exatamente com a interface de §3, `subscribeWithSelector`, guardas 1–5 implementadas e testadas por unidade leve (arquivo `store/__tests__/store.test.ts` com `node:test` + `tsx`, ou pular testes se preferir manter zero deps; documentar a escolha).
- `store/selectors.ts` com `selectIsFocused`, `selectCanInteract` (`mode==='idle'`).
- Campo extra `highlightBox: string | null` (§6.4).
- Aceite: **A**.

### 0.3 CameraRig + presets + leva
- `camera/presets.ts` com `HOME` e `chair|desk|printer|shelf` usando valores provisórios coerentes com o grey-box (posições em §0.5).
- `camera/CameraRig.tsx` conforme §4: `CameraControls makeDefault`, assinatura do store, `setLookAt(..., true)` + `await`, aplica `limits`, chama `onCameraRest()`. Respeitar `prefersReducedMotion` (`lib/device.ts`).
- Intro: após `mode:'intro'`, voar de uma posição afastada até `HOME` e então `idle`.
- Painel `leva` (dev only) com sliders de position/target e botão "Log preset" que imprime JSON pronto para colar em `presets.ts`.
- Aceite: **A**; **M** trocar `focus` via leva anima a câmera sem cortes; órbita em HOME respeita limites.

### 0.4 Sistema de hotspots + overlay básico
- `interaction/useHotspot.ts` conforme §5 (hover só em idle, click só em idle, cursor, touch).
- `interaction/useKeyboard.ts` (Esc → `requestHome`).
- `content/hotspots.ts` registry e `content/types.ts`.
- `ui/overlay/Overlay.tsx` (fixed, `pointer-events:none`), `BackButton.tsx` (aparece em focused/transitioning-to-hotspot), `Hud.tsx` (título + dica), `LoadingScreen.tsx` com `useProgress` e botão "Entrar" que dispara `setMode('intro')`.
- Painéis placeholder (`AboutPanel`, `PrinterPanel`, `GamesPanel` com só o título) montados por `AnimatePresence` segundo o registry.
- Deep-link `?focus=<id>` (§3).
- Aceite: **A**; **M** click no hotspot → câmera → painel aparece; Esc/Voltar → home.

### 0.5 Grey-box da cena
- `scene/placeholders/*`: ilha (box 10×0.4×8), mesa em L à centro-esquerda, cadeira (cilindro+box) à frente, bancada + impressora (box com "cabeça" separada) à direita, estante (boxes coloridos) na parede de fundo/direita, planos das telas com material preto. Tudo com `MeshStandardMaterial` cores neutras + 1 `hemisphereLight` (provisório; será baked).
- Cada hotspot é um `<group {...bind}>` com hitbox invisível (§5) envolvendo o placeholder.
- `scene/Scene.tsx` compõe tudo; `<Bvh>` ao redor.
- Aceite: **A**; **M** 4 hotspots funcionam; `r3f-perf` mostra < 40 draw calls.

**Pronto de Fase 0**: navegar entre os 4 hotspots e HOME, sem cortes, com Voltar/Esc, loading screen e intro.

---

## Protocolo de execução paralela (Fase 1 ‖ Fase 2.1)

As duas tarefas rodam ao mesmo tempo **na mesma árvore de trabalho**. O que evita conflito é posse de arquivos, não isolamento.

**Congelado antes do disparo** (commit `chore: contratos...`): tipos em `content/types.ts`, `content/projects.web.ts` com dados reais, identidade e links em `content/site.ts`, a rota `src/app/dev/layout.tsx` (404 em produção) e o pacote `@phosphor-icons/react` instalado.

| Agente | Cria ou edita | Só lê |
|---|---|---|
| Fase 1 (UI e conteúdo) | `ui/primitives/**`, `ui/panels/**`, `content/about.ts`, `content/projects.print.ts`, `content/projects.games.ts`, `UI_TEXT` em `content/site.ts`, `src/app/dev/ui/**`, `src/app/globals.css` | `content/types.ts` (pode **adicionar campos opcionais** em About, Print e Game), `store/**`, `ui/overlay/**` |
| Fase 2.1 (SO do monitor) | `ui/os/**`, `content/os.ts`, `src/app/dev/os/**` | `content/types.ts`, `content/projects.web.ts`, `content/site.ts` |

Proibido para os dois: `package.json` e lockfile (nenhum `npm install`), `next.config.ts`, `tsconfig.json`, `src/experience/**`, `src/store/**`, `docs/**`, `git commit`. O tipo `WebProject` não muda.

Verificação durante o trabalho:
- Tipos: `npx tsc --noEmit` e olhar só os erros nos próprios caminhos. Erros em arquivos do outro agente, ou em `.next/**` (tipos de rota gerados, que ficam desatualizados quando nasce uma rota nova), são ignorados e citados no relatório. Nunca corrigir arquivo alheio.
- Lint: `npx eslint <seus caminhos>`.
- Sem `npm run build`: quem integra roda o build no fim.
- Servidor: já existe um `next dev` em http://localhost:3000. Não iniciar outro e não parar esse. Um segundo `next dev` só imprime o PID do que já roda.
- Browser: abrir uma aba própria para a sua rota (`/dev/ui` ou `/dev/os`). O painel pode estar oculto; nesse caso `requestAnimationFrame` não roda, então valide pelo DOM e por capturas, sem depender de animação terminar.

Integração: o modelo arquiteto roda `tsc`, `lint`, `test` e `build`, revisa no browser e só então comita.

---

## Fase 1 — UI 2D e conteúdo

### 1.1 Primitivas glass
- `ui/primitives/GlassCard`, `Tabs`, `Carousel` (scroll-snap + setas), `IconButton`, `Kbd`, `Tag`. Estética: cartões translúcidos, blur, borda branca fina, micro-interações (hover eleva 2px, foco visível). Referências: glass.samasante.com, skiper-ui.com.
- Ícones: `@phosphor-icons/react`, nomes com sufixo `Icon` (ex.: `GithubLogoIcon`), peso `duotone` por padrão e `regular` em controles pequenos.
- Aceite: **A**; **M** página `/dev/ui` exibindo todas as primitivas. O layout `src/app/dev/layout.tsx` já existe; crie `src/app/dev/ui/page.tsx` (server) renderizando um `Preview.tsx` com `'use client'` na mesma pasta.

### 1.2 Conteúdo tipado
- Os tipos já existem em `content/types.ts` (`AboutContent`, `PrintShowcase`, `PrintProject`, `GameProject`, `GameSlug`) e `projects.web.ts` já está preenchido com dados reais do GitHub.
- Criar `content/about.ts`, `content/projects.print.ts` e `content/projects.games.ts` só com fatos confirmados (o prompt da tarefa traz os fatos). O que faltar vira `[TODO: ...]` explícito, nunca texto inventado.
- Os slugs dos jogos são os de `GameSlug`, os mesmos das peças da estante.
- Aceite: **A**.

### 1.3 Painéis reais
- `AboutPanel` (bio, skills em tags, redes), `PrinterPanel` (carrossel, specs, loja), `GamesPanel` (abas tabuleiro/digital; hover em item → `store.highlightBox`).
- Variantes motion de §8; lado (esq/dir) vindo do registry.
- `role="dialog"`, foco inicial, fechamento por Esc já existente.
- Aceite: **A**; **M** desktop.

---

## Fase 2 — Monitor OS (Html dentro do 3D)

### 2.1 `ui/os/*`
- `Desktop` (wallpaper, ícones), `Taskbar`, `Window` (arrastável dentro do desktop, minimizar/fechar, z-order), `apps/ProjectsApp` listando `projects.web` e `ProjectWindow` (vídeo/imagens, botões repo/live).
- Layout inteiro relativo ao wrapper 1280×720 (`container-type: size`, `cqw/cqh`); proibido `vw/vh`.
- `ProjectsApp` funciona sozinho, fora do `Desktop`, num container comum (reservado para um mobile futuro).
- Textos do SO em `content/os.ts`; projetos lidos de `content/projects.web.ts` sem alterá-lo.
- Crie `src/app/dev/os/page.tsx` (server) renderizando um `Preview.tsx` com `'use client'` na mesma pasta.
- Aceite: **A**; **M** em `/dev/os` renderizado num div 1280×720 e num 640×360 sem quebrar.

### 2.2 `MonitorHtml` (arquivo já montado: `src/experience/hotspots/desk/MonitorHtml.tsx`)
- Conforme §6.2: drei `<Html transform>` SEM `occlude` (ver a decisão em §6.2) com o `Desktop` de `src/ui/os` num wrapper FIXO de 1280×720 CSS px. Posição, rotação e escala derivadas de `LAYOUT.monitorMain` (centro, normal +X, 1.3 × 0.73 m): o wrapper precisa cobrir exatamente a tela (calibrar `distanceFactor`/`scale` pela razão 1.3 m / 1280 px).
- Fica 2 mm à frente do plano `screen_monitor_main` (ao longo da normal) para não brigar em profundidade com a tela.
- Interativo só com `mode === 'focused' && focus === 'desk'`: `pointer-events` e `inert` alternam no wrapper. Fora disso o SO fica invisível (opacidade 0) para poupar o CSS3D; ao chegar no foco, crossfade de ~0.3 s.
- O `Desktop` abre com a janela `Projetos` (`initialWindows`), para a tela não chegar vazia.
- O Esc global continua voltando para HOME; o SO não trata Esc.
- Mobile: adiado (fora do escopo por enquanto).
- Aceite: **A**; **M** na visão do `desk` a tela do SO cobre o monitor sem sobrar borda; clicar e arrastar janelas funciona só depois que a câmera para; em HOME e nos outros hotspots nada do SO recebe clique; redimensionar a janela do browser não muda o layout interno.

---

## Protocolo de execução paralela (Fase 2.2 ‖ Fase 3)

Mesmas regras do protocolo das Fases 1 ‖ 2.1 (checagem de tipos filtrada, eslint com escopo, sem `npm run build`, sem commit, um `next dev` só). O layout (`scene/layout.ts`) e os pontos de montagem estão congelados: `Desk.tsx` já monta `Screens` e `MonitorHtml`, `Shelf.tsx` já monta `ShelfParticles` e `Experience.tsx` já monta `Effects`.

| Agente | Cria ou edita | Só lê |
|---|---|---|
| Fase 2.2 (SO no monitor) | `src/experience/hotspots/desk/MonitorHtml.tsx`, `src/ui/os/**` (ajustes para embutir, ex.: `initialWindows`, `interactive`), `src/app/dev/os/**` | `scene/layout.ts`, `store/**`, `content/**` |
| Fase 3 (micro-interações e pós) | `hotspots/chair/**`, `hotspots/printer/**`, `hotspots/shelf/GameBox.tsx`, `hotspots/shelf/ShelfParticles.tsx` (e hooks novos nessas pastas), `hotspots/desk/Screens.tsx`, `scene/WallTv.tsx`, `scene/Effects.tsx`, `scene/Lights.tsx`, `scene/placeholders/materials.ts`, `scene/placeholders/PrinterPlaceholder.tsx`, `experience/Experience.tsx` (só `PerformanceMonitor`, `AdaptiveDpr` e props do Canvas), `experience/camera/**` (só na 3.6) | `scene/layout.ts`, `store/**`, `content/**` |

Proibido para os dois: `package.json` e lockfile (tudo o que é preciso já está instalado), `next.config.ts`, `tsconfig.json`, `docs/**`, `scene/layout.ts`, `hotspots/desk/Desk.tsx`, `hotspots/shelf/Shelf.tsx`, `store/**`, `content/**`, `ui/panels/**`, `ui/primitives/**`, `ui/overlay/**`.

Contrato entre os dois na tela do monitor: com `focused` + `desk`, o `Screens` (Fase 3) apaga a tela emissiva do monitor horizontal para o SO (Fase 2.2) aparecer por cima; o `MonitorHtml` fica 2 mm à frente do plano.

Verificação no browser: o painel costuma estar oculto e aí o canvas nem monta. Uma captura de tela força o desenho, e depois disso o canvas monta. Em dev, `window.__experienceStore` e `window.__cameraControls` permitem forçar estados (`setState({ mode: 'focused', focus: 'desk' })`) e enquadramentos sem esperar os voos.

---

## Fase 3 — Micro-interações 3D e pós-processamento

> **Absorvida pela Fase V** (3.1–3.4 → V.3, 3.5 → V.2, 3.6 → V.4). Mantida abaixo como especificação de comportamento.

### 3.1 Cadeira: `useChairSpring` (§6.1) com `@react-spring/three`, giro ~190° elástico no hover, retorno no unhover e ao voltar para HOME.
### 3.2 Telas e luzes (`hotspots/desk/Screens.tsx` e `scene/WallTv.tsx`)
- Monitores: damp de emissive com `useHotspot('desk').active` (§6.2), `toneMapped: false`. Em `focused` + `desk` a tela do monitor horizontal fica escura (o SO da 2.2 aparece por cima).
- PC gamer: `pc_fan_top`, `pc_fan_bottom` e `pc_rgb` pulsam no hover da mesa; `led_case` com sin(t). Um material por instância; nada de setState no useFrame.
- TV (§6.5): estática retrô no hover da zona de jogos; em `focused` + vista `digital`, tela de título tingida pelo `accent` do jogo em `highlightBox` (lendo `GAME_PROJECTS`); apagada no resto. Fita de LED rosa `tv_backlight` atrás da TV, emissiva.
### 3.3 Impressora: `usePrinterAnimation` (§6.3) em `useFrame` com refs; peça cresce ao focar. Pode ajustar `PrinterPlaceholder.tsx` para expor refs dos nós.
### 3.4 Zona de jogos: `GameBox` com spring z no hover e spring extra no `highlightBox`; `ShelfParticles` (Sparkles ≤ 80) só em `focused` + `shelf`, posicionadas na vista ativa (estante em `tabuleiro`, rack e TV em `digital`).
### 3.5 Pós e clima (`scene/Effects.tsx`, `scene/Lights.tsx`, `Experience.tsx`)
- `EffectComposer` com `SMAA` + `Bloom(threshold ~0.9, intensity ~0.6, mipmapBlur)`; `DepthOfField` só com `focused` + `chair`. `PerformanceMonitor` + `AdaptiveDpr` alimentam `quality` (§7).
- Iluminação PROVISÓRIA no clima da referência (até o bake da Fase 4): fim de noite, luz ambiente baixa, preenchimento roxo/azul vindo da mesa e dos monitores, rosa vindo da TV, um toque quente. Sem sombras. As emissivas (telas, fita RGB, LED da TV) devem estourar no Bloom e as paredes claras não podem virar branco chapado.
### 3.6 Enquadramento responsivo (ARCHITECTURE §4, dono de `experience/camera/**`): presets passam a `{ focusBox, direction, panelSide }` e o `CameraRig` calcula distância e deslocamento pelo aspect e pela largura do painel. Manter o contrato de sub-vistas (`presetKeyFor`, `resolveFocus`, voo sem `onCameraRest` em `focused`). Aceite: em 16:9 e 4:3 o conteúdo de cada hotspot e de cada vista da zona de jogos fica inteiro e fora do painel.
- Aceite (fase): **A**; **M** `r3f-perf` ≥ 55 fps no desktop com o composer; hover em cada hotspot mostra a animação; nada anima durante `transitioning`; trocar a aba da zona de jogos continua voando entre estante e TV.

---

## Fase 4 — Assets reais (depende de modelagem externa)

> **Substituída pela Fase V**: a cena passa a ser gerada por script no Blender (ASSET_PIPELINE v2), sem gltfjsx.

### 4.1 `scripts/optimize-models.mjs` + `npm run models:optimize` + headers de cache (ASSET_PIPELINE §4, §6).
### 4.2 Para cada glb entregue: rodar `gltfjsx` (ASSET_PIPELINE §5), substituir o placeholder pelo componente gerado no wrapper do hotspot, mapear nós (`chair_root`, `printer_head`…), remover `hemisphereLight` quando o bake chegar.
### 4.3 Recalibrar presets de câmera com leva e `distanceFactor` do monitor.
- Aceite: **A**; **M** budget de ARCHITECTURE §7 medido e anotado num comentário em `Scene.tsx`.

---

## Fase V — Visual v2 (competir com as referências)

Decisão de 2026-10-01 (ARCHITECTURE §12). Substitui a Fase 4 e absorve as tarefas 3.1–3.6, que não tinham sido implementadas. Fontes: ARCHITECTURE §12, ASSET_PIPELINE (contrato inteiro), REFERENCES.md (técnicas com número de linha nos dumps).

Ondas:

| Onda | Tarefas | Depende de |
|---|---|---|
| 1 (paralela) | V.1 arte no Blender ‖ V.4 câmera viva ‖ V.6 XkrulesOS v2 | — |
| 2 | V.2 runtime baked, tema e pós | arquivos do V.1 em `public/` |
| 3 (paralela) | V.3 vida na cena ‖ V.5 som e acabamento | V.2 (`useRoomNode`, materiais) |
| 4 | V.7 bake final, calibração e medição | todas |

Todos os agentes são Sonnet 5.5. Em cada onda vale o protocolo de execução paralela (checagem de tipos filtrada, eslint com escopo, sem `npm run build`, sem commit, um `next dev` só); quem integra roda `tsc`, `lint`, `test` e `build`, revisa no browser e comita.

### Protocolo da onda 1

| Agente | Cria ou edita | Só lê |
|---|---|---|
| V.1 Arte | `art/**`, `scripts/art/**`, `public/models/**`, `public/textures/**`, `.gitignore` (só `art/build/`), `package.json` (só scripts `art:*` e a devDependency `@gltf-transform/cli`) e o lockfile | `scene/layout.ts`, `camera/presets.ts`, `scene/placeholders/**` (proporções e cores do grey-box), `content/**`, REFERENCES.md e dumps |
| V.4 Câmera | `src/experience/camera/**`, `src/lib/constants.ts` (só para **adicionar** `PANEL_WIDTH_PX`) | `store/**`, `content/hotspots.ts`, `scene/layout.ts`, `ui/panels/PanelShell.tsx` |
| V.6 SO | `src/ui/os/**`, `src/content/os.ts`, `src/app/dev/os/**` | `content/types.ts`, `content/projects.web.ts`, `content/about.ts`, `content/site.ts` |

Proibido para os três: `docs/**`, `src/store/**`, `scene/layout.ts`, `next.config.ts`, `tsconfig.json`, `git commit`. V.4 e V.6 não mexem em `package.json`.

Contrato V.1 ↔ V.4: `camera/presets.ts` continua exportando `PRESETS` com `position` e `target` (o enquadramento de referência em 16:9). O V.4 pode **acrescentar** campos e arquivos, mas não renomeia nem remove esses dois: o `export-layout.ts` do V.1 lê os presets para as câmeras dos previews.

### V.1 Arte: pipeline Blender + quarto detalhado + bake draft (onda 1)
Contrato completo em ASSET_PIPELINE. Resumo do que entregar:
- `scripts/art/register.mjs` + hook de resolve, `scripts/art/export-layout.ts`, `scripts/art/blender.mjs` (acha o Blender por `BLENDER_BIN` ou `D:\Program Files\Blender\blender.exe` e repassa os argumentos; o caminho tem espaço), scripts `art:layout`, `art:build`, `art:optimize`, `art` no `package.json`.
- `art/blender/*` conforme ASSET_PIPELINE §2, com a direção de arte de ARCHITECTURE §12.2: estilo "quadradinho" com bevel em tudo, de 60 a 90 objetos, todos os nomes obrigatórios do §4, estático unido por zona.
- Bake `draft` completo (night, day, lightmap), glb otimizado em `public/models/room.glb`, texturas em `public/textures/`, `manifest.json` e os 7 previews em `art/previews/`.
- Ordem de trabalho: (1) esqueleto do pipeline de ponta a ponta só com paredes, piso e as âncoras como caixas, até gerar glb, bake e previews; (2) móveis principais; (3) props e decoração por zona; (4) ajuste de luz olhando os previews. Rode o pipeline completo depois de cada etapa.
- Aceite: checklist do ASSET_PIPELINE §7 com `--quality draft`; `npx tsc --noEmit` e `npx eslint scripts/art` limpos.

### V.4 Câmera viva e enquadramento responsivo (onda 1)
Dono de `src/experience/camera/**`. Mantém os contratos do §4: chegada por frame, `presetKeyFor`/`resolveFocus`, voo de sub-vista sem `onCameraRest`, deep link, `prefers-reduced-motion`.
- **Enquadramento responsivo** (antiga 3.6): cada preset ganha um `framing` (`focusBox` em coordenadas do mundo derivadas do `layout.ts`, e o lado do painel vindo do registry). Um resolvedor puro em `camera/framing.ts` calcula, a partir do aspect da viewport e da largura do painel (`PANEL_WIDTH_PX = 440` em `lib/constants.ts`, mesmo valor do `w-[min(440px,92cqw)]` do `PanelShell`), a distância e o deslocamento lateral para a caixa caber inteira na área livre (fora do painel), mantendo a direção de olhar do preset atual. Em 16:9 1920×1080 o resultado deve ficar perto dos presets atuais. Recalcula no resize (com debounce) quando em `focused`. O `desk` continua perpendicular à tela, com a tela inteira visível.
- **Idle em HOME**: depois de 3 s sem input, deriva lenta (período de 12 a 20 s, amplitude pequena) em torno da pose atual, como a Henry Heffernan (REFERENCES). Qualquer input do usuário pausa; volta a contar depois.
- **Parallax do mouse** em `focused` nos presets `chair`, `printer`, `shelf` e `shelfDigital` (não no `desk`, porque o SO precisa da tela parada): deslocamento de no máximo ~4 cm via `setFocalOffset`, suavizado. Zera ao sair do foco e durante `transitioning`.
- Tudo dentro de `camera/**`; nenhum outro componente toca a câmera. Nada de alocação ou setState no `useFrame`.
- Aceite: **A** filtrado; **M** em 1920×1080 e 1024×768 (resize da janela do browser, desktop) todas as vistas cabem fora do painel; idle e parallax visíveis e sutis; `npm test` passa.

### V.6 XkrulesOS v2 (onda 1)
Referência: o SO interno de Henry Heffernan (REFERENCES, inner-site). Dono de `src/ui/os/**`, `content/os.ts` e `src/app/dev/os/**`. Continua num wrapper fixo de 1280×720 com `cqw/cqh`, sem `vw/vh`, sem tratar Esc.
- Janelas: **resize** pelas bordas e pelo canto (tamanho mínimo, presa à área de trabalho), **duplo clique na barra de título** maximiza e restaura, botão maximizar. Abrir um app já aberto foca a janela.
- Apps novos (textos em `content/os.ts`; dados de `about.ts`, `site.ts`, `projects.web.ts` só lidos):
  - **Este Computador**: "specs" do autor em tom de brincadeira (CPU = stack, memória = anos de estrada etc.) usando fatos de `about.ts`; o que faltar vira `[TODO: ...]`, nunca texto inventado.
  - **Terminal**: prompt `xkrules@os:~$`, comandos `help`, `whoami`, `projects`, `open <slug>` (abre a janela do projeto), `links`, `date`, `clear`, `neofetch` (arte ASCII + resumo), histórico com ↑/↓ e autocomplete com Tab. Nada de `eval`.
  - **Jogo da Memória**: jogável, 4×4, cartas com glifos Phosphor, contador de jogadas e de tempo, botão reiniciar. Liga com o projeto `memory-game` (link para a versão completa).
  - **Créditos**: inspirações com links (Bruno Simon, Henry Heffernan, Julien Quenneville), stack do portfólio e ícones (Phosphor).
- **Desligar** no menu iniciar: sequência curta de desligamento (textos em `content/os.ts`), tela preta com botão de energia que religa (boot curto). Não altera nada fora do SO.
- Aceite: **A** filtrado; **M** em `/dev/os` a 1280×720 e 640×360: abrir cada app, redimensionar, maximizar, jogar uma partida, rodar os comandos do terminal, desligar e religar.

### V.2 Runtime baked, tema e pós (onda 2)
Lê ARCHITECTURE §7 e §12.3, ASSET_PIPELINE §3 e §4, REFERENCES (Bruno Simon `Baked.js` e fragment; Julien `TextureMaterial`). Dono de `src/experience/scene/**` (menos `layout.ts`), `Experience.tsx`, `preload.ts`, `LoadingBridge.tsx`, os wrappers `hotspots/*/{Chair,Desk,Printer,Shelf}.tsx` (só para alternar grey-box e baked), `src/store/**` (tema), `ui/overlay/Hud.tsx` (botão de tema), `UI_TEXT` em `content/site.ts` e `PRELOAD_LIST` em `lib/constants.ts`.
- `scene/baked/BakedMaterial.ts` (drei `shaderMaterial`), `BakedRoom.tsx` com o contexto `useRoomNode(name)`, materiais por categoria (emissivo `toneMapped:false` com a cor do glb, vidro, tela), `useSceneMode()` (`?greybox` ou erro de carregamento → grey-box), preload na tela de loading.
- Store: `theme: 'night' | 'day'` (padrão `night`), `toggleTheme()`, com testes. Botão no HUD com ícone Phosphor (lua/sol).
- Luzes de zona por foco: hover ou foco na mesa sobe mesa e PC; na zona de jogos sobe a TV. Damp, sem setState no frame.
- Pós (`Effects.tsx`): `SMAA`, `Bloom` (mipmapBlur, só os emissivos estouram), `Noise` leve (soft-light ~0.1) e `Vignette`, `Outline` no hover (seleção = nós da zona do hotspot, mapeados em `scene/baked/zones.ts`), `DepthOfField` só em `focused` + `chair`. `PerformanceMonitor` + `AdaptiveDpr` alimentam `quality` (§7).
- O grey-box continua funcionando igual (`?greybox`), com `Lights.tsx`.
- Aceite: **A** completo; **M** cena baked em HOME e em cada hotspot, tema alternando sem tranco, contorno no hover, `r3f-perf` ≥ 55 fps e ≤ 60 draw calls.

### V.3 Vida na cena (onda 3)
Lê ARCHITECTURE §6 e §12.4, REFERENCES (Bruno: `CoffeeSteam`, `TopChair`, `Screen`, `GoogleLeds`, `BouncingLogo`; Henry: camadas do `MonitorScreen`). Usa `useRoomNode` do V.2; no grey-box, os mesmos efeitos nos placeholders quando fizer sentido.
- Cadeira: balanço idle (`sin(t)`) somado ao giro elástico de ~190° no hover (antiga 3.1).
- Telas: monitor vertical com editor de código rolando (canvas), TV com estática no hover da zona de jogos, tela de título tingida pelo jogo em `highlightBox` na vista `digital` e logo quicando quando ociosa (antiga 3.2 + §6.5).
- Monitor do SO: camadas de Henry Heffernan por cima do `Html` (sujeira aditiva ~0.12, sombra interna), sem bloquear o clique.
- PC: fans girando, `pc_rgb` e `led_*` pulsando com fase por índice.
- Impressora (antiga 3.3), caixas com spring (antiga 3.4), partículas na zona de jogos, relógio com hora real (`clock_*`), fumaça da caneca (`fx_mug_steam`, shader com ruído, `depthWrite:false`).
- Aceite: **A**; **M** nada anima durante `transitioning`; `prefers-reduced-motion` desliga balanço, partículas e pulsos.

### V.5 Som e acabamento (onda 3)
- Áudio **sintetizado com WebAudio** (sem arquivos de terceiros): zumbido da ventoinha perto do PC, cliques de teclado e mouse ao interagir com o SO, estática da TV, ambiente noturno baixo. Mudo por padrão, toggle no HUD, volume por distância da câmera (Henry, `AudioManager`).
- Tela de loading temática (boot curto estilo BIOS, Henry `LoadingScreen`), com progresso real do `useProgress`.
- `prefers-reduced-motion` revisado de ponta a ponta; OpenGraph com captura do diorama; `<noscript>`.
- Aceite: **A**; **M** som só depois do primeiro clique do usuário; loading mostra progresso real.

### V.7 Bake final, calibração e medição (onda 4)
- `npm run art` com `--quality final` (em segundo plano; pode levar até 1 h na CPU).
- Recalibrar presets e `distanceFactor` do monitor com o glb real; medir draw calls, triângulos, fps e peso; anotar em `Scene.tsx`. Lighthouse desktop ≥ 80. Deploy.

---

## Fase 5 — Polish e deploy

> **Absorvida pela Fase V** (5.1, 5.3, 5.4 → V.5; 5.5 → V.7).

### 5.1 Áudio (`useAudio`, mudo por padrão, toggle no Hud, ventoinha no hover desk, estática na estante).
### 5.2 Touch: **adiado** (mobile fora do escopo por enquanto).
### 5.3 `prefers-reduced-motion`: transições instantâneas, sem partículas, sem pulso de LED.
### 5.4 SEO/fallback: `<noscript>`, `h1` oculto, OpenGraph image estática (screenshot do diorama), `sitemap`.
### 5.5 Deploy Vercel + analytics leve. Lighthouse desktop perf ≥ 80.

---

## Ordem sugerida de execução com subagentes

1. Fase 0 inteira num único subagente Sonnet (tarefas 0.1→0.5 são acopladas). ✔
2. Fase 1 e Fase 2.1 em paralelo. ✔
3. Fase 2.2. ✔
4. Fase V em ondas: V.1 ‖ V.4 ‖ V.6 → V.2 → V.3 ‖ V.5 → V.7. Cada onda é revisada, integrada e comitada antes da próxima.
