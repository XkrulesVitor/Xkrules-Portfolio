# Referências — o que cada uma faz bem e o que vamos copiar

Os dumps completos estão nesta pasta (`docs/*-8a5edab282632443.txt`). As linhas abaixo apontam direto para o trecho. Leia o trecho antes de implementar a técnica correspondente; não copie código literalmente, porque as versões de three/R3F são outras.

## A lição comum
As cinco salas bonitas têm a mesma base: **cena modelada no Blender com luz pré-calculada (bake)**. O navegador só desenha uma textura com a luz já pronta (`MeshBasicMaterial`/shader simples), o que dá GI, AO e sombras macias a 60 fps. O "clima" vem de **três luzes coloridas** cuja contribuição também é baked num `lightMap` (R, G, B = uma luz cada) e é misturada em tempo real por shader. É isso que vamos fazer (ARCHITECTURE §12, ASSET_PIPELINE).

## Bruno Simon — My Room in 3D (`brunosimon-my-room-in-3d-*.txt`)
| Técnica | Onde | Uso aqui |
|---|---|---|
| Shader baked: day/night/neutral + lightMap RGB (TV, PC, mesa) com blend `lighten` | `Baked.js` L425; `shaders/baked/fragment.glsl` L2208 | `BakedMaterial` (Fase V.2). Tema dia/noite = `uNightMix`; hover na TV/mesa/PC aumenta a força do canal |
| Cores das luzes: TV `#ff115e`, mesa `#ff6700`, PC `#0082ff` | `Baked.js` L476 | Paleta padrão das zonas de luz |
| Fumaça do café (plano + perlin no shader, `depthWrite:false`) | `CoffeeSteam.js` L885; shaders L2272 | Caneca na mesa (Fase V.3) |
| Cadeira balançando (`rotation.y = sin(t)*0.5`) | `TopChair.js` L2050 | Idle da cadeira, somado ao giro do hover |
| Telas com `VideoTexture` | `Screen.js` L1991 | Monitor vertical e TV com loops de vídeo/canvas |
| LEDs pulsando com `alphaMap` e fase por índice | `GoogleLeds.js` L1214 | Fitas de LED e fans do PC |
| Botões acendendo em sequência aleatória (gsap) | `LoupedeckButtons.js` L1317 | Teclado RGB / console |
| Logo quicando na tela | `BouncingLogo.js` L591 | Descanso de tela da TV quando ociosa |
| Navegação: spherical com limites + suavização | `Navigation.js` L1492 | Já temos CameraControls; usar os limites como referência |

## Henry Heffernan — site 3D (`henryjeff-portfolio-website-*.txt`)
| Técnica | Onde | Uso aqui |
|---|---|---|
| Monitor com camadas por cima do CSS3D: sujeira (additive 0.12), sombra interna, estática em vídeo (additive) | `World/MonitorScreen.ts` L4288 (camadas ~L4546) | Camadas no monitor do XkrulesOS (Fase V.3) |
| Planos que fecham a borda da tela e "dimmer" de perspectiva | `MonitorScreen.ts` (`createEnclosingPlanes`, `createPerspectiveDimmer`) | Borda do monitor sem vazar o HTML |
| Overlay de ruído no canvas inteiro (soft-light, 12%) | `Renderer.ts` L940; `shaders/screen/fragment.glsl` L2029 | Grão de filme no pós (Fase V.2) |
| Câmera: idle oscilando; mesa com parallax do mouse; zoom do monitor ajustado pelo aspect | `Camera/CameraKeyframes.ts` L1753 | Fase V.4 (câmera viva) |
| Áudio posicional: teclado e mouse; ambiente com low-pass pela distância | `Audio/AudioManager.ts` L1177; `AudioSources.ts` L1374 | Fase V.5 (áudio) |
| Loading com boot "BIOS" | `UI/components/LoadingScreen.tsx` L2930 | Tela de loading temática |
| Mute e "free cam" | `MuteToggle.tsx` L3337; `FreeCamToggle.tsx` L2352 | HUD |

## Henry Heffernan — SO interno (`henryjeff-portfolio-inner-site-*.txt`)
| Técnica | Onde | Uso aqui |
|---|---|---|
| Desktop, janelas com arraste e resize, barra de tarefas | `os/Desktop.tsx` L4517; `os/Window.tsx` L5857; `os/Toolbar.tsx` L5470; `ResizeIndicator.tsx` L5087 | XkrulesOS v2 (resize, duplo clique) |
| Sequência de desligar | `os/ShutdownSequence.tsx` L5158 | "Desligar" no menu iniciar |
| Apps: Este Computador, Créditos, jogos (Wordle, Doom via js-dos) | `applications/*` L3435–L3878 | Apps do XkrulesOS: Este Computador, Terminal, Jogo da Memória |
| Fontes retrô (Millennium, Terminal) | L3361–L3373 | Tema visual opcional do SO |

## Julien Quenneville / AT010303 — Room Portfolio em R3F (`julienq1-*.txt`, `at010303-*.txt`)
| Técnica | Onde | Uso aqui |
|---|---|---|
| `TextureMaterial` (drei `shaderMaterial`) com day/night/lightMap e cores via leva | `roomModel.jsx` L1494; `textures/TextureMaterial.jsx` L1970; `shaders/Room/fragment.glsl` L1906 | Mesmo padrão em TS para o `BakedMaterial` |
| Troca de tema com gsap no `NightMix` | `roomModel.jsx` L1522; `Switch/TheamSwitch.jsx` L2004 | Botão de tema no HUD (damp, sem gsap) |
| Contorno no hover (`Selection` + `Outline` do postprocessing) | `Experience.jsx` L276; `DispFrame.jsx` L654 | Contorno nos hotspots no hover (Fase V.2) |
| Câmera por estado com limites próprios | `CameraManager/CameraManager.jsx` L381 | Já temos; conferir limites por vista |
| Relógio de parede com hora real (nós do glb) | `RoomModel/clock.jsx` L575 | `clock_*` no glb, girados em runtime |
| iframe no monitor via `Html` | `iframes/desktopiFrame.jsx` L1706 | Já resolvido no XkrulesOS (com `portal` estável) |

## RoomLayout3D RandC (`vevenom-roomlayout3d_randc-*.txt`)
Método de pesquisa (ECCV 2020) que reconstrói paredes, piso e teto de um cômodo a partir de **uma foto**, com segmentação e profundidade. Não é técnica de render nem de interação. Só serviria para medir um quarto real a partir de foto; o nosso layout já vem de `scene/layout.ts`. **Fora do escopo.**
