"""props/games.py — zona de jogos (`zone_games`): rack com console, TV de parede e a estante de board games.

Âncoras do layout: rack (centro e tamanho), TV (centro da tela, normal +Z) e estante (origem no piso,
centro da largura, meio da profundidade, frente em +Z). As caixas `box_*` são nós vivos nas posições
exatas de `hotspots/shelf/Shelf.tsx`. As caixas de DECORAÇÃO (Root, Heat e Everdell com a Ever Tree,
`_decor_games`) são estáticas, fundidas em `zone_games`; só a capa de cada uma (`cover_decor_*`) é um nó.
"""

from __future__ import annotations

import math
import random

from kit import Prop, lin
from materials import C

WHITE = (1.0, 1.0, 1.0, 1.0)


def c(name, k=1.0):
    return lin(C[name], k)


def hx(h, k=1.0):
    return lin(h, k)


def build(ctx):
    _rack(ctx)
    _tv(ctx)
    _shelf_frame(ctx)
    _shelf_leds(ctx)
    _shelf_contents(ctx)
    _decor_games(ctx)
    _live_boxes(ctx)


# --------------------------------------------------------------------------------- rack


def _rack(ctx):
    rc, rs = ctx.LAYOUT['rack']['center'], ctx.LAYOUT['rack']['size']
    top = ctx.W['RACK_TOP_Y']
    rx, ry, rz = rc
    rw, rh, rd = rs
    front = rz + rd / 2
    x0, x1 = rx - rw / 2, rx + rw / 2
    p = Prop('rack', 'games', tier=1.3)
    white, wood, dark = c('white'), c('wood_light'), c('darker')
    # tampo de madeira (topo exatamente em RACK_TOP_Y), corpo branco, plinto escuro recuado
    p.box((rw + 0.02, 0.03, rd + 0.02), (rx, top - 0.015, rz + 0.005), c('wood'), bevel=0.008, seg=2)
    p.box((rw - 0.06, 0.04, rd - 0.06), (rx, 0.02, rz), dark, bevel=0.004, seg=1, hide=('-y',))
    p.box((rw, 0.03, rd), (rx, 0.055, rz), white, bevel=0.006, seg=1)
    for x in (x0 + 0.015, x1 - 0.015):
        p.box((0.03, rh - 0.07, rd), (x, 0.04 + (rh - 0.07) / 2 + 0.0, rz), white, bevel=0.006, seg=1)
    for x in (rx - 0.265, rx + 0.265):                                   # divisórias do vão central
        p.box((0.024, rh - 0.1, rd - 0.02), (x, 0.07 + (rh - 0.1) / 2, rz - 0.005), white, bevel=0.004, seg=1)
    p.box((rw - 0.06, rh - 0.1, 0.012), (rx, 0.07 + (rh - 0.1) / 2, rz - rd / 2 + 0.01), c('white', 0.9), bevel=0, seg=1)
    p.box((0.5, 0.02, rd - 0.05), (rx, 0.26, rz - 0.005), white, bevel=0.004, seg=1)      # prateleira do vão
    # portas de madeira com ripas verticais e puxadores
    for side in (-1, 1):
        cx = rx + side * 0.6
        p.box((0.64, rh - 0.12, 0.018), (cx, 0.07 + (rh - 0.12) / 2 + 0.01, front - 0.002), wood, bevel=0.006, seg=2)
        for k in range(7):
            p.box((0.012, rh - 0.17, 0.008), (cx - 0.27 + k * 0.09, 0.07 + (rh - 0.12) / 2 + 0.01, front + 0.007),
                  c('wood_light', 0.88), bevel=0.003, seg=1)
        p.box((0.014, 0.1, 0.014), (rx + side * 0.3 + side * 0.0 , 0.26, front + 0.012), c('metal'), bevel=0.004, seg=2)
    # dentro do vão: roteador/decodificador e cabos
    p.box((0.3, 0.06, 0.2), (rx - 0.02, 0.29, rz - 0.01), c('black'), bevel=0.01, seg=2, anchor='b', ry=4)
    p.box((0.24, 0.1, 0.16), (rx + 0.0, 0.07 + 0.03, rz - 0.01), c('dark'), bevel=0.01, seg=2, anchor='b')
    # console deitado no tampo, à esquerda do vão: corpo escuro com placas laterais brancas
    cx, cz = rx - 0.55, rz - 0.02
    p.box((0.3, 0.075, 0.12), (cx, top, cz), c('black'), bevel=0.014, seg=2, anchor='b')
    for s in (-1, 1):
        p.box((0.3, 0.075, 0.05), (cx, top, cz + s * 0.085), white, bevel=0.018, seg=3, anchor='b')
    p.box((0.2, 0.012, 0.09), (cx - 0.03, top + 0.075, cz), c('dark'), bevel=0.004, seg=1, anchor='b')
    # controle no tampo
    gx, gz = rx - 0.15, rz + 0.12
    p.box((0.13, 0.026, 0.085), (gx, top, gz), white, bevel=0.012, seg=3, anchor='b', ry=-22)
    for s in (-1, 1):
        p.blob((0.03, 0.017, 0.028), (gx + 0.02 * math.cos(math.radians(-22)) - s * 0.045 * math.sin(math.radians(-22)),
                                      top + 0.017, gz + s * 0.04), white, seg=8, rings=5, ry=-22)
    p.cyl(0.011, 0.012, (gx - 0.012, top + 0.029, gz - 0.014), c('black'), seg=10, anchor='b', ry=-22)
    p.cyl(0.011, 0.012, (gx + 0.012, top + 0.029, gz + 0.02), c('black'), seg=10, anchor='b', ry=-22)
    ctx.add_static(p)

    # LEDs do console e do roteador (um nó só, `led_console`, pivô no console)
    led = Prop('led_console', None, pivot=(cx - 0.01, top + 0.075, cz - 0.0))
    led.box((0.2, 0.004, 0.006), (cx - 0.01, top + 0.0765, cz + 0.04), WHITE, bevel=0.001, seg=1)
    led.box((0.02, 0.006, 0.004), (rx - 0.02, 0.325, rz + 0.092), WHITE, bevel=0.001, seg=1)
    ctx.add_emit(led, '#7ff5d0', 2.5, 0.8)
    ctx.set_mark('console', (cx, top + 0.1, cz))


# ----------------------------------------------------------------------------------- TV


def _tv(ctx):
    tv = ctx.LAYOUT['tv']
    tx, ty, tz = tv['center']
    tw, th = tv['size']
    wall = ctx.W['WALL_BACK_Z']
    ctx.add_screen('screen_tv', tv['center'], tv['normal'], tv['size'], night=0.7, day=0.12, color='#8aa0ff')
    p = Prop('tv_body', 'games', tier=1.3)
    pt = 0.03
    zf = tz - 0.0015
    p.box((tw + 0.04, th + 0.04, pt), (tx, ty, zf - pt / 2), c('bezel'), bevel=0.007, seg=2)
    p.box((tw * 0.62, th * 0.6, 0.014), (tx, ty, zf - pt - 0.007 + 0.002), c('dark'), bevel=0.008, seg=2)
    p.box((0.012, 0.006, 0.004), (tx + tw / 2 - 0.04, ty - th / 2 - 0.012, zf + 0.0005), c('accent'), bevel=0)  # LED
    # soundbar fixa sob a TV
    sy = ty - th / 2 - 0.1
    p.box((1.1, 0.065, 0.09), (tx, sy, wall + 0.05), c('black'), bevel=0.016, seg=3)
    p.box((1.0, 0.04, 0.008), (tx, sy, wall + 0.098), c('dark', 1.2), bevel=0.004, seg=1)
    for s in (-1, 1):
        p.box((0.04, 0.02, 0.03), (tx + s * 0.4, sy + 0.04, wall + 0.015), c('steel'), bevel=0.004, seg=1)
    ctx.add_static(p)

    # fita de LED atrás da TV: moldura rosa 2 cm além da borda do painel (halo na parede)
    z = wall + 0.011
    bl = Prop('tv_backlight', None, pivot=(tx, ty, z))
    ow, oh = tw + 0.08, th + 0.08
    w = 0.012
    bl.box((ow, w, 0.008), (tx, ty + oh / 2 - w / 2, z), WHITE, bevel=0.002, seg=1)
    bl.box((ow, w, 0.008), (tx, ty - oh / 2 + w / 2, z), WHITE, bevel=0.002, seg=1)
    bl.box((w, oh - 2 * w, 0.008), (tx - ow / 2 + w / 2, ty, z), WHITE, bevel=0.002, seg=1)
    bl.box((w, oh - 2 * w, 0.008), (tx + ow / 2 - w / 2, ty, z), WHITE, bevel=0.002, seg=1)
    ctx.add_emit(bl, '#ff115e', 4.0, 1.2)


# ----------------------------------------------------------------------------- estante


def _shelf_frame(ctx):
    sx, sy, sz = ctx.LAYOUT['shelf']
    levels = (0.03, 0.68, 1.33, 1.98, 2.58)
    p = Prop('shelf_frame', 'games', tier=1.3)
    wood, light, back = c('wood_light'), c('wood_light', 1.08), c('wood', 0.92)
    for x in (-0.87, 0.87):
        p.box((0.06, 2.6, 0.5), (sx + x, 1.3, sz), wood, bevel=0.008, seg=2, hide=('-y',))
    p.box((1.8, 2.6, 0.02), (sx, 1.3, sz - 0.24), back, bevel=0, seg=1)
    for y in levels:
        p.box((1.8, 0.05, 0.5), (sx, y, sz), light, bevel=0.007, seg=2)
    p.box((1.86, 0.03, 0.54), (sx, 2.625, sz + 0.01), c('wood'), bevel=0.008, seg=2)     # capa do topo
    p.box((1.86, 0.03, 0.54), (sx, 0.0, sz + 0.01), c('wood'), bevel=0.008, seg=1, anchor='b', hide=('-y',))
    ctx.add_static(p)


def _shelf_leds(ctx):
    """Fitas de LED quente sob as prateleiras 2, 3 e 4 da estante (um único nó): iluminam as caixas."""
    sx, sy, sz = ctx.LAYOUT['shelf']
    z = sz + 0.22
    led = Prop('emit_shelf_led', None, pivot=(sx, 1.3, z))
    for y in (0.68, 1.33, 1.98):
        led.box((1.62, 0.008, 0.012), (sx, y - 0.032, z), WHITE, bevel=0.001, seg=1)
    ctx.add_emit(led, '#ffd9a8', 7.0, 0.6)


def _shelf_contents(ctx):
    """Decoração fixa: pilhas, caixas em pé e deitadas, dados, miniaturas, meeples. Ver ARCHITECTURE §6.4.
    Root, Heat e o Everdell (caixas com capa real) não estão aqui: ver `_decor_games`."""
    sx, sy, sz = ctx.LAYOUT['shelf']
    r = random.Random(17)
    p = Prop('shelf_items', 'games', tier=1.4)
    b1, b2, b3, b4 = 0.055, 0.705, 1.355, 2.005
    pal = ['#3d6e8f', '#7a4f9a', '#2f8f6f', '#c25b4a', '#5b7fc2', '#d9a441', '#c8412f', '#8e6bbf', '#3fb8c9',
           '#e58bb2', '#f28f3b', '#57b894']

    def flat(x, y, w, h, d, col, ry=0.0):
        p.box((w, h, d), (sx + x, y, sz + 0.0), hx(col), bevel=0.006, seg=1, anchor='b', ry=ry)
        # tampa com faixa de título
        p.box((w * 0.8, 0.003, d * 0.28), (sx + x, y + h, sz + 0.0), hx('#f2efe8', 0.9), bevel=0, seg=1, anchor='b', ry=ry, keep='+y')

    def stand(x, y, w, h, d, col, rz=0.0, z=0.07):
        p.box((w, h, d), (sx + x, y, sz + z), hx(col), bevel=0.005, seg=1, anchor='b', rz=rz)
        p.box((w * 0.8, h * 0.28, 0.003), (sx + x, y + h * 0.55, sz + z + d / 2), hx('#f2efe8', 0.88), bevel=0, seg=1,
              anchor='b', rz=rz, keep='+z')
        p.box((w * 0.5, h * 0.12, 0.003), (sx + x, y + h * 0.18, sz + z + d / 2), hx('#1c1f27'), bevel=0, seg=1,
              anchor='b', rz=rz, keep='+z')

    # --- prateleira 1
    flat(-0.45, b1, 0.6, 0.09, 0.42, pal[0], ry=2)
    flat(-0.45, b1 + 0.09, 0.56, 0.09, 0.4, pal[1], ry=-3)
    flat(-0.45, b1 + 0.18, 0.52, 0.09, 0.38, pal[2], ry=4)
    stand(0.08, b1, 0.3, 0.4, 0.09, pal[4], rz=0)
    stand(0.42, b1, 0.3, 0.36, 0.09, pal[3], rz=-4)
    p.cyl(0.04, 0.1, (sx + 0.7, b1, sz + 0.1), hx('#9aa3b5'), anchor='b', seg=12, r2=0.03, bevel=0.003)
    p.cyl(0.04, 0.08, (sx + 0.78, b1, sz + 0.06), hx('#b58b6a'), anchor='b', seg=12, r2=0.03, bevel=0.003)
    # --- prateleira 2: peças soltas entre as caixas autorais e as de decoração (Root e Heat: `_decor_games`)
    for k, (col, dx) in enumerate((('#d64545', -0.01), ('#3fb8c9', 0.04), ('#f2c14e', 0.09))):
        # meeples: corpo em cone + cabeça + braços
        mx = sx - 0.07 + 0.03 + dx
        p.cyl(0.016, 0.028, (mx, b2, sz + 0.2), hx(col), anchor='b', seg=8, r2=0.008)
        p.blob((0.011, 0.011, 0.011), (mx, b2 + 0.036, sz + 0.2), hx(col), seg=7, rings=5)
        p.box((0.04, 0.008, 0.01), (mx, b2 + 0.02, sz + 0.2), hx(col), bevel=0.002, seg=1)
    for x, z, col, ry in ((0.02, 0.17, '#f2efe8', 20), (0.06, 0.2, '#d64545', 50)):
        p.box((0.028, 0.028, 0.028), (sx + x + 0.0, b2, sz + z), hx(col), bevel=0.004, seg=2, anchor='b', ry=ry)
    # --- prateleira 3 (o Everdell deitado, com a árvore, ocupa a esquerda: `_decor_games`)
    p.box((0.16, 0.28, 0.16), (sx + 0.15, b3, sz + 0.03), hx('#6b4f3a'), bevel=0.008, seg=2, anchor='b')      # torre de dados
    p.box((0.07, 0.1, 0.012), (sx + 0.15, b3 + 0.04, sz + 0.115), hx('#1a1612'), bevel=0.004, seg=1, anchor='b')
    p.box((0.18, 0.016, 0.18), (sx + 0.15, b3 + 0.28, sz + 0.03), hx('#8a6a4f'), bevel=0.005, seg=1, anchor='b')
    for k, col in enumerate(('#9aa3b5', '#b58b6a', '#6f8f5a', '#e58bb2')):
        p.cyl(0.04, 0.11, (sx + 0.42 + (k % 2) * 0.13, b3, sz + 0.1 - 0.04 * (k // 2)), hx(col), anchor='b', seg=12,
              r2=0.028, bevel=0.003)
    for x, z, col, ry in ((0.72, 0.1, '#f2efe8', 10), (0.64, 0.16, '#d64545', 40), (0.78, 0.18, '#3fb8c9', 70)):
        p.box((0.05, 0.05, 0.05), (sx + x, b3, sz + z), hx(col), bevel=0.006, seg=2, anchor='b', ry=ry)
    # --- prateleira 4: caixas coloridas em pé, alturas diferentes
    for k, x in enumerate((-0.6, -0.22, 0.17, 0.52)):
        stand(x, b4, 0.3 if k != 3 else 0.28, [0.4, 0.46, 0.38, 0.44][k], 0.08, ['#8e6bbf', '#3fb8c9', '#e58bb2', '#f28f3b'][k],
              rz=[0, 0, 0, 5][k], z=0.1)
    p.box((0.2, 0.3, 0.07), (sx + 0.76, b4, sz + 0.1), hx('#57b894'), bevel=0.005, seg=1, anchor='b', rz=-3)
    # --- cima da estante: caixas deitadas e um troféu
    top = 2.64
    flat(-0.5, top, 0.5, 0.08, 0.36, '#3a3f8f', ry=-4)
    flat(-0.5, top + 0.08, 0.44, 0.08, 0.34, '#d9a441', ry=6)
    p.cyl(0.05, 0.015, (sx + 0.3, top, sz), hx('#d9a441'), anchor='b', seg=14, bevel=0.003)
    p.cyl(0.012, 0.1, (sx + 0.3, top + 0.015, sz), hx('#d9a441'), anchor='b', seg=10)
    p.cyl(0.05, 0.075, (sx + 0.3, top + 0.115, sz), hx('#f2c14e'), anchor='b', seg=14, r2=0.03, bevel=0.003)
    p.blob((0.1, 0.13, 0.1), (sx + 0.88, top + 0.1, sz + 0.0), c('leaf2'), seg=10, rings=7)       # planta pendente
    p.cyl(0.07, 0.09, (sx + 0.88, top, sz), c('pot'), anchor='b', seg=14, r2=0.05, bevel=0.004)
    ctx.add_static(p)


# Albedo do quadro da capa: cinza neutro claro. O bake dele guarda só a luz que chega à frente da caixa;
# o runtime multiplica a arte por essa luz e divide por este albedo (`COVER_ALBEDO` do CoverMaterial.ts).
COVER_GREY = '#e6e6e6'


def _cover_quad(ctx, name, pos, size, bevel, face='+z', parent=None):
    """Quadro cinza da capa, nó vivo `name` com pivô no centro da caixa (`pos`, `size` = largura, altura, profundidade).

    `face='+z'`: caixa em pé, quadro 1 mm à frente da face da frente. `face='+y'`: caixa deitada, quadro 1 mm acima
    da tampa. Em ambos fica dentro do chanfro (sobra uma moldura fina da cor da caixa). O runtime acha o plano da
    arte pela caixa delimitadora (CoverMaterial.ts); a capa deitada tem o topo da arte para o fundo da estante."""
    x, y, z = pos
    w, h, d = size
    cover = Prop(name, None, pivot=pos, tier=1.6)
    if face == '+y':
        cover.box((w - 2 * bevel, 0.001, d - 2 * bevel), (x, y + h / 2 + 0.0005, z), hx(COVER_GREY), bevel=0, seg=1,
                  keep='+y')
    else:
        cover.box((w - 2 * bevel, h - 2 * bevel, 0.001), (x, y, z + d / 2 + 0.0005), hx(COVER_GREY), bevel=0, seg=1,
                  keep='+z')
    return ctx.add_live(cover, parent=parent)


def _wavy(rx, rz, seed, n=56, scallops=11, amp=0.06):
    """Contorno ondulado (folhagem): elipse deformada por duas ondas lentas e por `scallops` ondinhas. Estrelado
    em relação ao centro (uma reta por ele corta o contorno em dois pontos), requisito do `cut` de `Prop.poly`."""
    r = random.Random(seed)
    p1, p2, p3 = (r.uniform(0, 2 * math.pi) for _ in range(3))
    pts = []
    for i in range(n):
        a = 2 * math.pi * i / n
        k = 1 + 0.10 * math.cos(2 * a + p1) + 0.06 * math.cos(3 * a + p2) + amp * math.cos(scallops * a + p3)
        pts.append((rx * k * math.cos(a), rz * k * math.sin(a)))
    return pts


def _decor_games(ctx):
    """Board games de DECORAÇÃO da estante, com a capa real (não são do dono do portfólio).

    - Root (horizontal, 4:3: 0,36 x 0,273) e Heat: Pedal to the Metal (quadrada) em pé na prateleira 2, à direita das caixas
      autorais, na mesma profundidade delas (z = +0.08).
    - Everdell (quadrada, DEITADA) na prateleira 3, no lugar da pilha de caixas, com a Ever Tree de papelão montada
      em cima: duas tábuas de tronco cruzadas, três plataformas de folhagem de contorno ondulado (meio verde, meio
      outono) e a copa com os três medalhões de estação.

    As caixas são ESTÁTICAS (fundidas em `zone_games`): nada nelas se move, então um nó por caixa só gastaria draw
    call (a contagem de meshes já passa do orçamento). A capa de cada uma é um quadro separado
    (`cover_decor_<id>`, nó baked) para o runtime pôr a arte (`content/decor.ts`) com a luz assada. Tudo cabe na
    folga da estante: Root e Heat têm 1,5 cm de ar entre si e do painel lateral; a árvore tem ~42 cm de altura
    sobre a tampa (topo a 1,88 m, a prateleira 4 começa em 1,955 m) e cabe nos 40 cm de profundidade livre."""
    sx, sy, sz = ctx.LAYOUT['shelf']
    b2, b3 = 0.705, 1.355
    p = Prop('shelf_decor', 'games', tier=1.4)
    label = hx('#d9b866', 0.95)
    covers = []

    # --- Root e Heat em pé (mesma profundidade das caixas autorais da prateleira 2)
    for name, w, h, d, cx, col in (('root', 0.36, 0.273, 0.09, 0.29, '#46503f'),
                                   ('heat', 0.34, 0.34, 0.10, 0.655, '#d8c79a')):
        pos = (sx + cx, b2 + h / 2, sz + 0.08)
        p.box((w, h, d), pos, hx(col), bevel=0.006, seg=1)
        covers.append((f'cover_decor_{name}', pos, (w, h, d), 0.006, '+z'))

    # --- Everdell deitado: tampa a 10 cm do tampo, capa para cima
    ew, eh, ed = 0.38, 0.10, 0.38
    ex, ez = sx - 0.45, sz + 0.0
    epos = (ex, b3 + eh / 2, ez)
    p.box((ew, eh, ed), epos, hx('#2b3a3a'), bevel=0.006, seg=1)
    p.box((ew * 0.62, eh * 0.34, 0.003), (ex, b3 + eh * 0.52, ez + ed / 2), label, bevel=0, seg=1, keep='+z')   # etiqueta na lateral
    covers.append(('cover_decor_everdell', epos, (ew, eh, ed), 0.006, '+y'))
    _ever_tree(p, ex, b3 + eh, ez)
    ctx.add_static(p)

    # capas: quadros soltos (sem pai), um nó baked cada
    for name, pos, size, bevel, face in covers:
        _cover_quad(ctx, name, pos, size, bevel, face)


def _ever_tree(p, tx, y0, tz):
    """A Ever Tree do Everdell, em estilo diorama (cores sólidas, chanfro): `(tx, y0, tz)` = centro da base, sobre a
    tampa da caixa. Tábuas de tronco em cruz, três plataformas de folhagem ovais de contorno ondulado e a copa
    de medalhões. Alturas (m, acima da tampa): plataformas em 0.092, 0.178 e 0.258; topo da copa em ~0.42."""
    wood, wood_b, edge = hx('#8c5a30'), hx('#74462a'), hx('#6a4224')

    # tronco: perfil com base aberta (raízes) que afina para cima. Tábua A de frente para +Z; B girada 90 graus
    half = [(0.165, 0.0), (0.15, 0.025), (0.11, 0.055), (0.075, 0.10), (0.058, 0.16), (0.05, 0.24), (0.048, 0.29)]
    prof_a = half + [(-x, y) for x, y in reversed(half)]
    short = [(x, y) for x, y in half if y <= 0.16] + [(0.05, 0.20)]
    prof_b = short + [(-x, y) for x, y in reversed(short)]
    p.poly(prof_a, 0.02, (tx, y0, tz), wood, plane='xy', bevel=0.003)
    p.poly(prof_b, 0.02, (tx, y0, tz), wood_b, plane='xy', bevel=0.003, ry=90)

    # plataformas de folhagem: metade verde, metade outono (o corte passa pelo centro; ângulos diferentes)
    def leaf(top_a, top_b, a_deg):
        nx, nz = -math.sin(math.radians(a_deg)), math.cos(math.radians(a_deg))

        def f(normal, c):
            if normal.y < 0.25:                    # lateral e fundo: madeira à mostra
                return edge
            return top_a if c.x * nx + c.z * nz >= 0 else top_b
        return f

    for k, (rx, rz, y, ry, cut, ca, cb) in enumerate((
            (0.215, 0.160, 0.092, 0, 25, '#6fa845', '#d8782c'),
            (0.170, 0.132, 0.178, 40, 115, '#85ba4c', '#e08a33'),
            (0.115, 0.094, 0.258, -25, -40, '#78b34a', '#c96a28'))):
        p.poly(_wavy(rx, rz, 40 + k), 0.014, (tx, y0 + y, tz), leaf(hx(ca), hx(cb), cut), plane='xz', bevel=0.003, ry=ry,
               cut=cut)

    # copa: os três medalhões (primavera, verão, outono) assentados direto no topo da tábua A; os dois laterais
    # ficam um pouco atrás do central, que cobre a borda deles
    def medal(col):
        def f(normal, c):
            return hx(col) if abs(normal.z) > 0.5 else edge
        return f

    for dx, dy, dz, col in ((-0.066, 0.322, -0.013, '#7fbf45'), (0.066, 0.322, -0.013, '#e07b30'),
                            (0.0, 0.350, 0.0, '#b7d95a')):
        p.poly(_wavy(0.046, 0.050, 60 + int(dx * 100), n=28, scallops=7, amp=0.07), 0.013, (tx + dx, y0 + dy, tz + dz),
               medal(col), plane='xy', bevel=0.002)


def _live_boxes(ctx):
    """Caixas dos jogos: nós vivos com pivô no centro (spring em z no runtime).

    As capas são quadradas, então as caixas também: board games de 36 cm na prateleira 2 da estante e
    estojos de 13 cm (como os de CD) de pé no tampo do rack, na ordem do painel. Cada caixa tem um filho
    `cover_<slug>`: um quadro cinza rente à frente, assado como o resto, onde o runtime aplica a arte
    (a luz, a sombra e as luzes de zona vêm do bake). A cor da caixa vem da arte e aparece nas laterais
    e na moldura em volta da capa.
    """
    top = ctx.W['RACK_TOP_Y']
    rx, _, rz = ctx.LAYOUT['rack']['center']
    sx, sy, sz = ctx.LAYOUT['shelf']
    board = (0.36, 0.36, 0.1)
    case = (0.13, 0.13, 0.02)
    board_y = sy + 0.705 + board[1] / 2          # apoiada na prateleira 2
    case_y = top + case[1] / 2

    def on_rack(k):
        return (rx + 0.12 + k * 0.14, case_y, rz + 0.02)

    spec = {
        'aldeia_dorme': ((sx - 0.62, board_y, sz + 0.08), board, '#b59b7a'),
        'conquista_galactica': ((sx - 0.24, board_y, sz + 0.08), board, '#151a30'),
        'porriland': (on_rack(0), case, '#1d8fd8'),
        'piter': (on_rack(1), case, '#9a5b2e'),
        'memory_game': (on_rack(2), case, '#5b2bd1'),
        'o_anel': (on_rack(3), case, '#a8380f'),
        'racco': (on_rack(4), case, '#2c5552'),
        'duel_arena': (on_rack(5), case, '#3a4a5c'),
    }
    for slug, (pos, size, col) in spec.items():
        x, y, z = pos
        w, h, d = size
        bevel = 0.004 if d < 0.05 else 0.006
        b = Prop(f'box_{slug}', None, pivot=pos, tier=1.4)
        b.box(size, pos, hx(col), bevel=bevel, seg=1)
        box = ctx.add_live(b)
        # quadro da capa: 1 mm à frente da face, dentro do chanfro (sobra uma moldura fina da cor da caixa)
        _cover_quad(ctx, f'cover_{slug}', pos, size, bevel, parent=box)
