"""props/games.py — zona de jogos (`zone_games`): rack com console, TV de parede e a estante de board games.

Âncoras do layout: rack (centro e tamanho), TV (centro da tela, normal +Z) e estante (origem no piso,
centro da largura, meio da profundidade, frente em +Z). As caixas `box_*` são nós vivos nas posições
exatas de `hotspots/shelf/Shelf.tsx`.
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
    """Decoração fixa: pilhas, caixas em pé e deitadas, dados, miniaturas, meeples. Ver ARCHITECTURE §6.4."""
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
    # --- prateleira 2: Root e Heat (decoração) e peças soltas entre as caixas autorais
    stand(0.3, b2, 0.34, 0.46, 0.1, '#d9a441', z=0.08)
    stand(0.66, b2, 0.34, 0.46, 0.1, '#c8412f', z=0.08)
    for k, (col, dx) in enumerate((('#d64545', -0.01), ('#3fb8c9', 0.04), ('#f2c14e', 0.09))):
        # meeples: corpo em cone + cabeça + braços
        mx = sx - 0.07 + 0.03 + dx
        p.cyl(0.016, 0.028, (mx, b2, sz + 0.2), hx(col), anchor='b', seg=8, r2=0.008)
        p.blob((0.011, 0.011, 0.011), (mx, b2 + 0.036, sz + 0.2), hx(col), seg=7, rings=5)
        p.box((0.04, 0.008, 0.01), (mx, b2 + 0.02, sz + 0.2), hx(col), bevel=0.002, seg=1)
    for x, z, col, ry in ((0.02, 0.17, '#f2efe8', 20), (0.06, 0.2, '#d64545', 50)):
        p.box((0.028, 0.028, 0.028), (sx + x + 0.0, b2, sz + z), hx(col), bevel=0.004, seg=2, anchor='b', ry=ry)
    # --- prateleira 3
    flat(-0.45, b3, 0.5, 0.08, 0.4, pal[3], ry=-2)
    flat(-0.45, b3 + 0.08, 0.46, 0.08, 0.38, pal[4], ry=3)
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


def _live_boxes(ctx):
    """Caixas dos projetos: nós vivos com pivô no centro (spring em z no runtime)."""
    top = ctx.W['RACK_TOP_Y']
    rx, _, rz = ctx.LAYOUT['rack']['center']
    sx, sy, sz = ctx.LAYOUT['shelf']
    board = (0.34, 0.46, 0.1)
    case = (0.12, 0.17, 0.02)
    spec = {
        'terra': ((sx - 0.62, sy + 0.935, sz + 0.08), board, '#57b894', '#a9e6cf', '#1f6b52'),
        'aldeia_dorme': ((sx - 0.24, sy + 0.935, sz + 0.08), board, '#3a3f8f', '#8a90e0', '#f2c14e'),
        'porrilandia': ((rx + 0.25, top + 0.085, rz + 0.02), case, '#e4572e', '#ffb199', '#5a1f10'),
        'peter': ((rx + 0.38, top + 0.085, rz + 0.02), case, '#4c8bf5', '#a9c7ff', '#173a7a'),
        'o_anel': ((rx + 0.51, top + 0.085, rz + 0.02), case, '#f2c14e', '#fff0b8', '#6b4d10'),
        'racco': ((rx + 0.64, top + 0.085, rz + 0.02), case, '#10b981', '#8af0cc', '#07503b'),
        'memory_game': ((rx + 0.77, top + 0.085, rz + 0.02), case, '#a855f7', '#dcb8ff', '#4a1d7a'),
    }
    for slug, (pos, size, col, art, deco) in spec.items():
        b = Prop(f'box_{slug}', None, pivot=pos, tier=1.4)
        x, y, z = pos
        w, h, d = size
        b.box(size, pos, hx(col), bevel=0.004 if d < 0.05 else 0.006, seg=1)
        zf = z + d / 2
        # arte da capa: quadro claro, faixa de título, emblema e rodapé escuro
        b.box((w * 0.84, h * 0.5, 0.003), (x, y + h * 0.1, zf + 0.0015), hx(art), bevel=0, seg=1, keep='+z')
        b.box((w * 0.84, h * 0.13, 0.003), (x, y + h * 0.37, zf + 0.0015), hx('#f6f3ec'), bevel=0, seg=1, keep='+z')
        b.box((w * 0.3, h * 0.2, 0.003), (x - w * 0.12, y + h * 0.12, zf + 0.003), hx(deco), bevel=0, seg=1, ry=0, rz=0, keep='+z')
        b.box((w * 0.84, h * 0.08, 0.003), (x, y - h * 0.34, zf + 0.0015), hx('#1c1f27'), bevel=0, seg=1, keep='+z')
        ctx.add_live(b)
