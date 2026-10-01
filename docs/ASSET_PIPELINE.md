# Pipeline de Assets v2 — Blender por script (headless) → glb + bake → R3F

Complementa [ARCHITECTURE.md](./ARCHITECTURE.md) §12 e [REFERENCES.md](./REFERENCES.md). Este arquivo é o **contrato** entre quem gera a cena no Blender e quem a usa no runtime. Mudou em 2026-10-01: a cena deixa de ser modelada à mão e passa a ser **gerada por código Python** a partir do `scene/layout.ts`, com luz pré-calculada (bake), como nas referências.

---

## 1. Ferramentas e comandos

- Blender 4.4 em `D:\Program Files\Blender\blender.exe`. A variável `BLENDER_BIN` sobrescreve o caminho.
- Cycles **na CPU** (a RX 580 não tem suporte a HIP no Blender 4.x). Ryzen 3 3200G, 4 núcleos: planeje o tempo de bake (§5).
- Comandos (scripts no `package.json`):

| Script | O que faz |
|---|---|
| `npm run art:layout` | `node --import ./scripts/art/register.mjs scripts/art/export-layout.ts` → `art/build/layout.json` (ROOM, LAYOUT, presets de câmera resolvidos). O Node 24 já remove tipos sozinho, mas não resolve `@/` nem import sem extensão (o `presets.ts` usa os dois): `register.mjs` registra um hook `resolve` (`module.register`) que mapeia `@/` → `src/` e tenta `.ts`. Nada em `src/` muda por causa disso |
| `npm run art:build -- --quality draft` | `blender -b --factory-startup -P art/blender/main.py -- --layout art/build/layout.json --out art/build --quality draft` |
| `npm run art:optimize` | `@gltf-transform/cli` (devDependency): `meshopt` no glb → `public/models/room.glb`; copia `art/build/*.webp` → `public/textures/` |
| `npm run art` | os três em sequência (`--quality final`) |

- `art/build/` é intermediário e vai para o `.gitignore`. `public/models` e `public/textures` são comitados.

## 2. Estrutura do código Blender

```
art/blender/
  main.py        # orquestra: limpa a cena, constrói, materiais, luzes, UV, bake, export, previews
  kit.py         # primitivas chanfradas (caixa com bevel, cilindro, prancha, alça), conversão de eixos
  props/         # um módulo por zona: room.py, desk.py, games.py, maker.py, bed.py, decor.py
  materials.py   # paleta (cores sólidas; quem dá o acabamento é a luz)
  lights.py      # rig noturno, rig diurno e rig do lightmap (R/G/B)
  bake.py        # atlas de UV único + bakes + denoise
  export.py      # glb (+Y up), nomes do §4
  preview.py     # renders PNG das câmeras-chave para revisão
art/previews/    # home.jpg, desk.jpg, shelf.jpg, digital.jpg, printer.jpg, chair.jpg, home-day.jpg (comitados, para revisão)
```

**Eixos.** O layout é Y-up em metros: `(x, y, z)` do layout vira `(x, -z, y)` no Blender (Z-up). O exportador glTF com "+Y up" desfaz a conversão. Verifique com uma âncora conhecida (centro da tela do monitor) no `manifest.json`.

**Fonte de posições.** Todo móvel com âncora no `layout.json` usa a âncora. Objetos novos de decoração podem ter posição própria no Python, mas não podem invadir as hitboxes (ARCHITECTURE §6.0) nem as linhas de visão dos presets.

**Mesa sem gaveteiro.** O gaveteiro branco sob a ponta da frente da mesa foi removido de propósito (decisão do dono, 2026-10-01). Não recriar.

**Previews.** `preview.py` renderiza das câmeras do `layout.json` (presets `home`, `desk`, `shelf`, `shelfDigital`, `printer`, `chair`; fov 35, 1280×720) **com os bakes aplicados como emissão pura e as três zonas misturadas como no runtime** (nós Mix em modo Lighten, fator = canal do lightmap × força, cores e forças de ARCHITECTURE §12.3). O que aparece no preview é o que o navegador vai mostrar. Cycles com 8 amostras, view transform **Standard** (o AgX já está na textura). A revisão pega defeito de bake (UV sobreposta, mancha, vazamento de luz). `home-day.jpg` usa o `baked-day`.

## 3. Saídas (contrato com o runtime)

| Arquivo | Conteúdo |
|---|---|
| `public/models/room.glb` | Todos os objetos, com os nomes do §4. Nós "baked" usam a UV0 como **atlas único** do bake. Telas e LEDs têm UV 0..1 próprias. Depois do bake, o estático de cada zona é **unido num mesh só** (`zone_room`, `zone_desk`, `zone_games`, `zone_maker`, `zone_bed`): um draw call por zona e contorno de hover por zona |
| `public/textures/baked-night.webp` | Bake difuso com cor (cor × luz) do rig noturno, já com AgX (§5). 2048² no `final`, 1024² no `draft`. sRGB, `flipY = false`. Gravado pelo próprio Blender em WebP (qualidade 90) |
| `public/textures/baked-day.webp` | O mesmo, com o rig diurno |
| `public/textures/lightmap.webp` | **Linear** (Non-Color, WebP sem perdas). Só luz, com materiais brancos: R = luz da TV, G = luz da mesa (luminária e monitores), B = luz do PC. Mesmo atlas. Normalizado para o canal mais forte ficar perto de 1 sem saturar |
| `art/build/manifest.json` | Nós por categoria, bounding boxes no mundo (Y-up), triângulos por nó, tempo de cada etapa |

**Categorias de nó (pelo prefixo do nome):**
- **baked** (padrão): o runtime aplica o `BakedMaterial` compartilhado. São os `zone_*` e os nós vivos (`chair_root`, `printer_*` menos `printer_led`, `box_*`, `clock_*`). Cada nó vivo é **um mesh só** (partes unidas), com pivô no lugar certo; é baked na posição de repouso e movido em runtime, como a cadeira de Bruno Simon.
- `screen_*`: plano com UV 0..1 para vídeo, canvas ou `Html`. Fora do atlas.
- `emit_*`, `led_*`, `pc_rgb`, `pc_fan_*`, `tv_backlight`: emissivos. No Blender têm shader de emissão e **iluminam a cena no bake**. No runtime recebem material emissivo com `toneMapped: false`. Fora do atlas.
- `glass_*`: transparentes (`glass_pc`, `glass_window`). Fora do atlas.
- `fx_*`: planos de efeito (fumaça da caneca). Fora do atlas.

## 4. Nomes obrigatórios

Padrão `<grupo>_<parte>` em snake_case, sem acento e sem sufixo `.001`. Lista mínima (o runtime procura estes nomes):

```
zone_room · zone_desk · zone_games · zone_maker · zone_bed   # estático unido por zona
chair_root                       # pivô no centro da base; gira em Y
printer_root · printer_axisZ · printer_head · printer_bed · printer_part · printer_led
box_terra · box_aldeia_dorme     # caixas dos board games (estante, prateleira 2)
box_porrilandia · box_peter · box_o_anel   # capinhas dos jogos digitais (tampo do rack)
screen_monitor_main              # plano da tela, centro = LAYOUT.monitorMain.center, normal +X
screen_monitor_vertical
screen_tv                        # TV acima do rack
tv_backlight                     # fita de LED rosa atrás da TV
led_case · glass_pc · pc_fan_top · pc_fan_bottom · pc_rgb
clock_hour · clock_minute · clock_second   # ponteiros; pivô no centro do relógio
fx_mug_steam                     # plano vertical acima da caneca
emit_window_city                 # cidade noturna vista pela janela
```

Pivôs: `chair_root` no centro da base; telas no centro do plano com a normal para fora; `printer_part` na base (cresce em Y); ponteiros no eixo do relógio.

## 5. Bake

1. **UV:** todos os nós baked recebem Smart UV Project juntos (edição multiobjeto) e um único pack de ilhas, margem 0.003.
2. **baked-night / baked-day:** bake `DIFFUSE` com Direct + Indirect + Color, margem 8 px (extend). Rig noturno: lua fria pela janela, cidade (`emit_window_city`), telas e LEDs emitindo, abajur do criado-mudo, ambiente bem baixo. Rig diurno: sol e céu quentes pela janela, telas fracas. **As três luzes de zona (TV, mesa, PC) ficam desligadas nos dois**: elas entram só pelo lightmap, somadas no shader; se entrarem no bake também, a luz dobra.
3. **lightmap:** troca todos os materiais por branco difuso, desliga tudo menos as três luzes de zona, pinta as luzes de vermelho puro (TV), verde puro (mesa) e azul puro (PC) e faz um bake `DIFFUSE` com Direct + Indirect, sem Color. Cada canal sai com a contribuição de uma luz.
4. **Denoise e gravação:** o bake vai para uma imagem float. Uma cena auxiliar vazia (engine Workbench, resolução = tamanho do atlas) roda o compositor `Image → Denoise (OIDN) → Composite` e grava o arquivo pelo render. Cor da gravação:
   - `baked-night` e `baked-day`: view transform **AgX**, display sRGB. A textura sai pronta para a tela; o runtime não aplica tone mapping.
   - `lightmap`: view transform **Raw** (valores lineares intactos), WebP sem perdas.
   - Exposição: calibre as luzes para o bake não estourar; ajuste fino com `view_settings.exposure` da cena auxiliar.
5. **Qualidade:**

| `--quality` | Atlas | Amostras | Meta de tempo (3200G) |
|---|---|---|---|
| `draft` | 1024² | 16 | < 5 min no total |
| `final` | 2048² | 128–256 | < 60 min no total; se passar, baixe amostras antes de baixar resolução |

## 6. Orçamento

| Item | Limite |
|---|---|
| `room.glb` (meshopt) | ≤ 4 MB |
| Triângulos | ≤ 250k |
| Texturas WebP somadas | ≤ 2 MB |
| Draw calls em runtime | ≤ 60 (todos os baked dividem um material) |

## 7. Checklist de aceite de um bake

- [ ] `npm run art` termina sem erro e gera os quatro arquivos do §3.
- [ ] Todos os nomes do §4 existem no glb (`manifest.json`), sem `.001`.
- [ ] Contagem de meshes no glb ≤ 45 (draw calls).
- [ ] O centro de `screen_monitor_main` bate com `LAYOUT.monitorMain.center` (erro < 1 cm).
- [ ] Previews em `art/previews/` sem buracos de luz, sem manchas pretas de UV sobreposta, sem objetos atravessados.
- [ ] Orçamento do §6 respeitado.
