"""props/maker.py — maker space (`zone_maker`) e a impressora 3D (nós vivos `printer_*`).

Âncora: LAYOUT.printer = centro do tampo da bancada (3.0, 0.9, -2.8). Bancada 2.4 x 1.1; a impressora
fica no meio e tem os mesmos eixos do grey-box: base 0.9 x 0.14 x 0.8, colunas em x = +-0.4 e z = -0.3,
eixo Z (gantry) em y = +0.7, cabeça 0.1 à frente do eixo, mesa 0.6 x 0.6 e peça sobre a mesa.
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


SPOOL_COLORS = ['#e4572e', '#f28f3b', '#f2c14e', '#57b894', '#3fb8c9', '#4c8bf5', '#a855f7', '#e58bb2',
                '#f2efe8', '#2f3542']


def build(ctx):
    _bench(ctx)
    _pegboard(ctx)
    _bench_items(ctx)
    _printer(ctx)


def _spool(p, x, y, z, col, axis='z', r=0.09, w=0.05):
    """Carretel de filamento: dois flanges, núcleo e enrolamento colorido."""
    p.cyl(r, 0.005, (x, y, z - w / 2), c('white', 0.92), axis=axis, seg=18)
    p.ring(r, r * 0.8, 0.005, (x, y, z + w / 2), c('white', 0.92), axis=axis, seg=18)
    p.cyl(r * 0.92, w, (x, y, z), hx(col), axis=axis, seg=18)
    p.cyl(r * 0.45, w + 0.004, (x, y, z), c('white', 0.85), axis=axis, seg=14)


def _bench(ctx):
    px, py, pz = ctx.LAYOUT['printer']
    p = Prop('bench', 'maker', tier=1.1)
    wood, wl, wd = c('wood'), c('wood_light'), c('wood_dark')
    p.box((2.4, 0.06, 1.1), (px, py - 0.03, pz), wood, bevel=0.012, seg=2)
    p.box((2.3, 0.05, 1.0), (px, py - 0.085, pz), wd, bevel=0.006, seg=1)                  # avental
    for x in (px - 1.1, px + 1.1):
        for z in (pz - 0.48, pz + 0.48):
            p.box((0.08, py - 0.11, 0.08), (x, 0.0, z), wl, bevel=0.008, seg=2, anchor='b')
    p.box((2.2, 0.03, 0.96), (px, 0.26, pz), wl, bevel=0.007, seg=1)                         # prateleira de baixo
    # caixas organizadoras na prateleira de baixo
    for k, (col, w, h) in enumerate((('#3fb8c9', 0.4, 0.2), ('#e58bb2', 0.34, 0.16), ('#f2c14e', 0.42, 0.22),
                                     ('#8e6bbf', 0.3, 0.18))):
        x = px - 0.8 + k * 0.5
        p.box((w, h, 0.4), (x, 0.275, pz + 0.05), hx(col), bevel=0.012, seg=2, anchor='b')
        p.box((w * 0.9, 0.012, 0.36), (x, 0.275 + h, pz + 0.05), hx(col, 1.15), bevel=0.004, seg=1, anchor='b')
        p.box((w * 0.5, 0.05, 0.004), (x, 0.275 + h * 0.55, pz + 0.255), hx('#f2efe8'), bevel=0, seg=1, anchor='b')
    # carretéis empilhados no chão ao lado da bancada
    ctx.add_static(p)


def _pegboard(ctx):
    """Pegboard na parede do fundo com carretéis coloridos nos pinos e ferramentas penduradas."""
    px, py, pz = ctx.LAYOUT['printer']
    wall = ctx.W['WALL_BACK_Z']
    p = Prop('pegboard', 'maker', tier=1.2)
    cx, cy = px, 1.65
    w, h = 2.2, 1.0
    p.box((w, h, 0.02), (cx, cy, wall + 0.01), c('steel', 0.8), bevel=0.003, seg=1)
    # moldura e furos (linhas de furos em baixo-relevo falso: fileiras finas mais escuras)
    p.box((w + 0.04, 0.025, 0.026), (cx, cy + h / 2 + 0.0125, wall + 0.013), c('wood_dark'), bevel=0.004, seg=1)
    p.box((w + 0.04, 0.025, 0.026), (cx, cy - h / 2 - 0.0125, wall + 0.013), c('wood_dark'), bevel=0.004, seg=1)
    for s in (-1, 1):
        p.box((0.025, h, 0.026), (cx + s * (w / 2 + 0.0125), cy, wall + 0.013), c('wood_dark'), bevel=0.004, seg=1)
    for k in range(1, 20):
        p.box((0.0045, h - 0.06, 0.004), (cx - w / 2 + k * (w / 20), cy, wall + 0.021), c('dark', 0.85), bevel=0, seg=1)
    # carretéis nos pinos: 4 à esquerda, 4 à direita da impressora, em duas fileiras
    xs_left = (px - 1.0, px - 0.8, px - 0.6)
    xs_right = (px + 0.62, px + 0.82, px + 1.02)
    ci = 0
    for xs in (xs_left, xs_right):
        for y in (1.93, 1.52):
            for x in xs:
                col = SPOOL_COLORS[ci % len(SPOOL_COLORS)]
                ci += 1
                p.cyl(0.007, 0.085, (x, y, wall + 0.06), c('metal'), axis='z', seg=8)
                _spool(p, x, y, wall + 0.075, col, r=0.088, w=0.048)
    # ferramentas penduradas (uma faixa baixa no pegboard, à esquerda)
    ty = 1.22
    p.box((0.016, 0.16, 0.012), (px - 0.95, ty, wall + 0.03), c('red'), bevel=0.004, seg=1, rz=8)      # alicate (metade)
    p.box((0.016, 0.16, 0.012), (px - 0.95, ty, wall + 0.034), c('red'), bevel=0.004, seg=1, rz=-8)
    p.box((0.02, 0.2, 0.01), (px - 0.78, ty, wall + 0.03), c('metal'), bevel=0.003, seg=1)             # paquímetro
    p.box((0.04, 0.04, 0.012), (px - 0.78, ty + 0.1, wall + 0.03), c('metal'), bevel=0.003, seg=1)
    p.box((0.016, 0.1, 0.012), (px - 0.78, ty - 0.1, wall + 0.034), c('metal_dark'), bevel=0.003, seg=1)
    for k in range(5):                                                                                   # chaves hex
        p.box((0.008, 0.07 + 0.012 * k, 0.008), (px - 0.62 + k * 0.022, ty, wall + 0.03), c('steel'), bevel=0.002, seg=1)
    p.box((0.03, 0.16, 0.014), (px + 0.9, ty, wall + 0.03), c('yellow'), bevel=0.005, seg=1)           # espátula
    p.box((0.05, 0.05, 0.014), (px + 0.9, ty + 0.1, wall + 0.03), c('metal'), bevel=0.004, seg=1)
    # prateleirinha com potes de parafusos
    p.box((0.7, 0.02, 0.1), (px + 0.65, 1.15, wall + 0.06), c('wood'), bevel=0.004, seg=1)
    for k in range(4):
        p.cyl(0.03, 0.06, (px + 0.4 + k * 0.1, 1.16, wall + 0.06), hx(['#f2efe8', '#3fb8c9', '#f2c14e', '#e58bb2'][k], 1.0),
              anchor='b', seg=12, bevel=0.003)
    ctx.add_static(p)
    # barra de LED branco-quente no alto do pegboard: ilumina a bancada (e o carretel do suporte)
    ly = 2.2
    lb = Prop('emit_maker_light', None, pivot=(cx, ly, wall + 0.05))
    lb.box((1.9, 0.022, 0.05), (cx, ly, wall + 0.05), WHITE, bevel=0.004, seg=1)
    ctx.add_emit(lb, '#ffe2bd', 14.0, 1.5)
    bar = Prop('maker_light_mount', 'maker', tier=1.0)
    for s in (-1, 1):
        bar.box((0.02, 0.06, 0.05), (cx + s * 0.8, ly + 0.0, wall + 0.04), c('darker'), bevel=0.004, seg=1)
    ctx.add_static(bar)


def _bench_items(ctx):
    px, py, pz = ctx.LAYOUT['printer']
    p = Prop('maker_items', 'maker', tier=1.3)
    r = random.Random(23)
    # tapete de corte verde e peças impressas expostas (esquerda)
    mx, mz = px - 0.8, pz + 0.02
    p.box((0.52, 0.004, 0.4), (mx, py, mz), c('green', 0.9), bevel=0.001, seg=1, anchor='b', keep='+y')
    for k in range(1, 6):
        p.box((0.52, 0.0012, 0.002), (mx, py + 0.0041, mz - 0.2 + k * 0.0667), c('white', 0.9), bevel=0, seg=1, anchor='b', keep='+y')
    # benchy (barquinho): casco, cabine, chaminé
    bx, bz = mx - 0.1, mz + 0.05
    p.box((0.1, 0.03, 0.045), (bx, py + 0.004, bz), hx('#4c8bf5'), bevel=0.008, seg=2, anchor='b', ry=15)
    p.box((0.04, 0.035, 0.032), (bx + 0.005, py + 0.034, bz), hx('#f2efe8'), bevel=0.004, seg=1, anchor='b', ry=15)
    p.box((0.012, 0.03, 0.012), (bx + 0.01, py + 0.069, bz), hx('#e4572e'), bevel=0.002, seg=1, anchor='b', ry=15)
    # vaso espiral (cilindro facetado) e cubo de calibração
    p.cyl(0.04, 0.12, (mx + 0.1, py + 0.004, mz - 0.04), hx('#a855f7'), anchor='b', seg=8, r2=0.028, bevel=0.003)
    p.box((0.05, 0.05, 0.05), (mx + 0.12, py + 0.004, mz + 0.1), hx('#f28f3b'), bevel=0.004, seg=1, anchor='b', ry=20)
    # caixa de ferramentas
    p.box((0.4, 0.14, 0.2), (px - 0.52, py, pz - 0.28), c('red'), bevel=0.014, seg=2, anchor='b')
    p.box((0.4, 0.03, 0.2), (px - 0.52, py + 0.14, pz - 0.28), c('red', 1.2), bevel=0.012, seg=2, anchor='b')
    p.box((0.2, 0.02, 0.02), (px - 0.52, py + 0.185, pz - 0.28), c('metal_dark'), bevel=0.006, seg=2, anchor='b')
    # mini-estante à direita da impressora com figuras impressas
    sx = px + 0.88
    p.box((0.5, 0.012, 0.22), (sx, py + 0.32, pz + 0.08), c('wood_light'), bevel=0.003, seg=1)
    for s in (-1, 1):
        p.box((0.012, 0.32, 0.22), (sx + s * 0.25, py + 0.16, pz + 0.08), c('wood_light'), bevel=0.003, seg=1)
    p.box((0.5, 0.012, 0.22), (sx, py + 0.006, pz + 0.08), c('wood_light'), bevel=0.003, seg=1)
    p.box((0.5, 0.012, 0.22), (sx, py + 0.62, pz + 0.08), c('wood_light'), bevel=0.003, seg=1)
    p.box((0.02, 0.62, 0.22), (sx - 0.25, py + 0.31, pz + 0.08), c('wood_light'), bevel=0.003, seg=1)
    p.box((0.02, 0.62, 0.22), (sx + 0.25, py + 0.31, pz + 0.08), c('wood_light'), bevel=0.003, seg=1)
    # figuras: dragão de blocos, torre, boneco e vaso
    dx = sx - 0.14
    p.box((0.09, 0.05, 0.05), (dx, py + 0.012, pz + 0.08), hx('#57b894'), bevel=0.008, seg=2, anchor='b')
    p.box((0.04, 0.04, 0.04), (dx + 0.05, py + 0.06, pz + 0.08), hx('#57b894'), bevel=0.008, seg=2, anchor='b')
    p.box((0.01, 0.04, 0.05), (dx - 0.01, py + 0.062, pz + 0.08), hx('#3fb8c9'), bevel=0.003, seg=1, anchor='b')
    for k in range(4):
        p.box((0.07 - 0.012 * k, 0.04, 0.07 - 0.012 * k), (sx + 0.1, py + 0.012 + 0.04 * k, pz + 0.08), hx('#f2c14e', 1 - 0.07 * k),
              bevel=0.005, seg=1, anchor='b')
    p.cyl(0.03, 0.12, (sx - 0.02, py + 0.33, pz + 0.08), hx('#e58bb2'), anchor='b', seg=10, r2=0.02, bevel=0.003)
    p.cyl(0.04, 0.09, (sx + 0.1, py + 0.33, pz + 0.08), hx('#f2efe8'), anchor='b', seg=10, r2=0.025, bevel=0.003)
    p.blob((0.05, 0.07, 0.05), (sx - 0.1, py + 0.4, pz + 0.08), c('leaf3'), seg=8, rings=6)
    # carretel solto e filamento sobre a bancada, perto da frente
    p.cyl(0.085, 0.05, (px + 0.5, py, pz + 0.38), hx('#e58bb2'), anchor='b', seg=18, bevel=0.003)
    p.cyl(0.04, 0.052, (px + 0.5, py, pz + 0.38), c('white', 0.9), anchor='b', seg=12)
    ctx.add_static(p)


def _printer(ctx):
    px, py, pz = ctx.LAYOUT['printer']
    metal, mdark, dark = c('metal'), c('metal_dark'), c('dark')
    base = c('dark', 1.15)

    # --- printer_root: base, colunas, viga superior, painel e suporte do carretel
    root = Prop('printer_root', None, pivot=(px, py, pz), tier=1.5)
    root.box((0.9, 0.14, 0.8), (px, py + 0.07, pz), base, bevel=0.02, seg=3)
    for s in (-1, 1):
        x = px + s * 0.4
        root.box((0.08, 1.0, 0.08), (x, py + 0.64, pz - 0.3), metal, bevel=0.012, seg=2)
        root.box((0.02, 0.96, 0.02), (x - s * 0.02, py + 0.64, pz - 0.255), mdark, bevel=0.004, seg=1)        # trilho
        root.box((0.1, 0.02, 0.1), (x, py + 0.15, pz - 0.3), c('darker'), bevel=0.004, seg=1)
    root.box((0.9, 0.08, 0.12), (px, py + 1.18, pz - 0.3), metal, bevel=0.014, seg=2)
    root.box((0.7, 0.01, 0.05), (px, py + 1.225, pz - 0.3), mdark, bevel=0.002, seg=1)
    # painel de controle inclinado na frente, canto esquerdo
    root.box((0.2, 0.012, 0.09), (px - 0.28, py + 0.1, pz + 0.37), c('darker'), bevel=0.004, seg=1, rx=-35)
    root.box((0.16, 0.002, 0.06), (px - 0.28, py + 0.103, pz + 0.372), hx('#2a3a5c'), bevel=0, seg=1, rx=-35)
    root.cyl(0.015, 0.02, (px - 0.1, py + 0.1, pz + 0.395), mdark, axis='z', seg=12)
    # suporte do carretel no alto e carretel
    root.box((0.04, 0.12, 0.04), (px, py + 1.26, pz - 0.3), c('darker'), bevel=0.006, seg=1)
    root.cyl(0.008, 0.18, (px, py + 1.32, pz - 0.3), mdark, axis='x', seg=8)
    for dxs, ln in ((-0.032, 0.005), (0.032, 0.005)):
        root.cyl(0.1, ln, (px + dxs, py + 1.32, pz - 0.3), c('white', 0.92), axis='x', seg=22)
    root.cyl(0.09, 0.06, (px, py + 1.32, pz - 0.3), hx('#f28f3b'), axis='x', seg=22)
    root.cyl(0.04, 0.066, (px, py + 1.32, pz - 0.3), c('white', 0.85), axis='x', seg=14)
    ctx.add_live(root)

    # --- printer_axisZ: gantry horizontal que sobe e desce
    gy = py + 0.7
    ax = Prop('printer_axisZ', None, pivot=(px, gy, pz - 0.3), tier=1.5)
    ax.box((0.72, 0.06, 0.1), (px, gy, pz - 0.3), mdark, bevel=0.01, seg=2)
    ax.box((0.66, 0.012, 0.02), (px, gy + 0.036, pz - 0.25), c('dark'), bevel=0.002, seg=1)       # correia
    for s in (-1, 1):
        ax.box((0.06, 0.1, 0.12), (px + s * 0.38, gy, pz - 0.3), c('darker'), bevel=0.012, seg=2)
        ax.box((0.05, 0.04, 0.05), (px + s * 0.38, gy + 0.07, pz - 0.3), c('chair_acc'), bevel=0.006, seg=1)   # motor
    axis_obj = ctx.add_live(ax)

    # --- printer_head: cabeça de impressão, filha do gantry (mesmos nomes e hierarquia do grey-box)
    hy = gy
    hz = pz - 0.2
    hd = Prop('printer_head', None, pivot=(px, hy, hz), tier=1.6)
    hd.box((0.16, 0.14, 0.14), (px, hy, hz), c('accent'), bevel=0.014, seg=2)
    hd.box((0.12, 0.05, 0.1), (px, hy + 0.08, hz), c('darker'), bevel=0.01, seg=2)             # motor do extrusor
    hd.cyl(0.035, 0.02, (px, hy + 0.01, hz + 0.08), c('darker'), axis='z', seg=12)               # ventoinha do hotend
    hd.cyl(0.02, 0.04, (px, hy - 0.09, hz), mdark, seg=10, r2=0.008)
    hd.cyl(0.006, 0.02, (px, hy - 0.115, hz), hx('#f2c14e'), seg=8)
    ctx.add_live(hd, parent=axis_obj)

    # --- printer_bed: mesa aquecida com carro e chapa PEI
    bed = Prop('printer_bed', None, pivot=(px, py + 0.155, pz + 0.1), tier=1.5)
    bed.box((0.6, 0.026, 0.6), (px, py + 0.155, pz + 0.1), c('darker'), bevel=0.008, seg=2)
    bed.box((0.58, 0.006, 0.58), (px, py + 0.171, pz + 0.1), hx('#8a7a58'), bevel=0.002, seg=1, keep='+y')
    bed.box((0.3, 0.03, 0.4), (px, py + 0.125, pz + 0.1), mdark, bevel=0.006, seg=1)
    bed.box((0.5, 0.01, 0.5), (px, py + 0.138, pz + 0.1), c('dark'), bevel=0.002, seg=1)
    ctx.add_live(bed)

    # --- printer_part: peça em impressão (pagode empilhado), pivô na base
    pt = Prop('printer_part', None, pivot=(px, py + 0.171, pz + 0.1), tier=1.6)
    y = py + 0.174
    for k, (w, h) in enumerate(((0.2, 0.055), (0.17, 0.05), (0.14, 0.05), (0.11, 0.045), (0.07, 0.05))):
        pt.box((w, h, w), (px, y, pz + 0.1), hx('#ff9f6b', 1.0 - 0.05 * k), bevel=0.006, seg=2, anchor='b', ry=8 * k)
        y += h
    ctx.add_live(pt)

    # --- printer_led: LED de status na frente da base
    led = Prop('printer_led', None, pivot=(px + 0.36, py + 0.07, pz + 0.4))
    led.box((0.05, 0.014, 0.008), (px + 0.36, py + 0.07, pz + 0.402), WHITE, bevel=0.002, seg=1)
    ctx.add_emit(led, '#7ff5d0', 3.0, 1.0)
