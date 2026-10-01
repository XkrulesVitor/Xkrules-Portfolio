"""props/decor.py — decoração do quarto (`zone_room`): tapetes, relógio, ar-condicionado, quadros,
costela-de-adão, pufe, mesinha, luzinhas de varal. Os ponteiros `clock_*` são nós vivos.

Nada aqui invade as hitboxes (ARCHITECTURE §6.0) nem as linhas de visão dos presets: o centro do
quarto (entre a cadeira e a cama) fica livre.
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
    _rugs(ctx)
    _clock(ctx)
    _ac(ctx)
    _posters(ctx)
    _plant(ctx)
    _lounge(ctx)
    _fairy_lights(ctx)


def _rugs(ctx):
    p = Prop('rugs', 'room', tier=1.0)
    # tapete sob a cadeira (x -3.0..-0.85, z -2.9..0.05): moldura, campo, medalhão e franjas
    cx, cz = -1.95, -1.42
    p.box((2.1, 0.012, 2.9), (cx, 0.0, cz), c('rug_a'), bevel=0.004, seg=1, anchor='b', keep='+y')
    p.box((1.9, 0.014, 2.7), (cx, 0.0, cz), c('rug_b'), bevel=0.004, seg=1, anchor='b', keep='+y')
    p.box((1.66, 0.016, 2.46), (cx, 0.0, cz), c('rug_a', 1.05), bevel=0.004, seg=1, anchor='b', keep='+y')
    p.box((0.9, 0.018, 0.9), (cx, 0.0, cz), c('rug_c'), bevel=0.004, seg=1, anchor='b', ry=45, keep='+y')
    p.box((0.6, 0.02, 0.6), (cx, 0.0, cz), c('rug_a', 0.9), bevel=0.004, seg=1, anchor='b', ry=45, keep='+y')
    for s in (-1, 1):
        for k in range(14):
            p.box((0.016, 0.01, 0.1), (cx + s * 1.09, 0.0, cz - 1.3 + k * 0.2), c('rug_c'), bevel=0.003, seg=1, anchor='b', keep='+y')
    # tapete redondo no centro da frente
    p.cyl(1.05, 0.012, (-1.1, 0.0, 1.9), c('rug_b'), anchor='b', seg=40, bevel=0.003)
    p.cyl(0.85, 0.014, (-1.1, 0.0, 1.9), c('rug_c', 0.95), anchor='b', seg=40, bevel=0.003)
    p.cyl(0.62, 0.016, (-1.1, 0.0, 1.9), c('rug_b', 0.95), anchor='b', seg=40, bevel=0.003)
    ctx.add_static(p)


def _clock(ctx):
    """Relógio de parede no fundo, acima da estante. Os três ponteiros são nós vivos com pivô no eixo."""
    zb = ctx.W['WALL_BACK_Z']
    cx, cy = 0.7, 2.93
    p = Prop('wall_clock', 'room', tier=1.3)
    p.cyl(0.205, 0.03, (cx, cy, zb + 0.015), c('wood_dark'), axis='z', seg=36, bevel=0.006)        # aro
    p.cyl(0.18, 0.012, (cx, cy, zb + 0.031), c('cream'), axis='z', seg=36)                          # mostrador
    for k in range(12):
        a = math.radians(30 * k)
        big = k % 3 == 0
        r = 0.152
        p.box((0.012 if big else 0.007, 0.03 if big else 0.018, 0.004),
              (cx + r * math.sin(a), cy + r * math.cos(a), zb + 0.038), c('darker'), bevel=0.001, seg=1,
              rz=-math.degrees(a))
    ctx.add_static(p)
    z0 = zb + 0.04
    cap = Prop('clock_cap', 'room')
    cap.cyl(0.014, 0.014, (cx, cy, zb + 0.05), c('darker'), axis='z', seg=12)
    ctx.add_static(cap)
    for name, length, wd, dz, col in (('clock_hour', 0.1, 0.016, 0.0, 'darker'), ('clock_minute', 0.15, 0.011, 0.005, 'darker'),
                                      ('clock_second', 0.165, 0.005, 0.01, 'red')):
        h = Prop(name, None, pivot=(cx, cy, z0 + dz), tier=2.0)
        h.box((wd, length + 0.02, 0.004), (cx, cy + (length - 0.02) / 2, z0 + dz + 0.002), c(col), bevel=0.0012, seg=1)
        ctx.add_live(h)


def _ac(ctx):
    """Ar-condicionado split no alto do fundo, sobre a TV."""
    zb = ctx.W['WALL_BACK_Z']
    cx, cy = -1.6, 2.75
    p = Prop('air_conditioner', 'room', tier=1.0)
    p.box((0.96, 0.3, 0.2), (cx, cy, zb + 0.1), c('white'), bevel=0.03, seg=3)
    p.box((0.9, 0.03, 0.02), (cx, cy - 0.12, zb + 0.2), c('dark', 0.9), bevel=0.004, seg=1)
    p.box((0.9, 0.012, 0.012), (cx, cy + 0.1, zb + 0.206), c('white', 0.88), bevel=0.002, seg=1)
    p.box((0.9, 0.012, 0.012), (cx, cy + 0.05, zb + 0.206), c('white', 0.88), bevel=0.002, seg=1)
    ctx.add_static(p)
    led = Prop('emit_ac_led', None, pivot=(cx + 0.4, cy + 0.06, zb + 0.2))
    led.box((0.014, 0.014, 0.004), (cx + 0.4, cy + 0.06, zb + 0.201), WHITE, bevel=0.002, seg=1)
    ctx.add_emit(led, '#5dff9e', 2.0, 0.6)


def _frame(p, center, size, axis, paper, arts, frame_col='#1d2128'):
    """Quadro fino na parede. `axis`='x' (parede esquerda, normal +X) ou 'z' (parede do fundo, normal +Z).
    size = (largura, altura). `arts` = lista de (dx, dy, w, h, cor), no plano do quadro."""
    x, y, z = center
    w, h = size
    if axis == 'x':
        p.box((0.02, h, w), (x + 0.01, y, z), lin(frame_col), bevel=0.004, seg=1)
        p.box((0.006, h - 0.05, w - 0.05), (x + 0.0215, y, z), lin(paper), bevel=0, seg=1, keep='+x')
        for dx, dy, aw, ah, col in arts:
            p.box((0.004, ah, aw), (x + 0.0255, y + dy, z + dx), lin(col), bevel=0, seg=1, keep='+x')
    else:
        p.box((w, h, 0.02), (x, y, z + 0.01), lin(frame_col), bevel=0.004, seg=1)
        p.box((w - 0.05, h - 0.05, 0.006), (x, y, z + 0.0215), lin(paper), bevel=0, seg=1, keep='+z')
        for dx, dy, aw, ah, col in arts:
            p.box((aw, ah, 0.004), (x + dx, y + dy, z + 0.0255), lin(col), bevel=0, seg=1, keep='+z')


def _posters(ctx):
    xw, zb = ctx.W['WALL_LEFT_X'], ctx.W['WALL_BACK_Z']
    p = Prop('posters', 'room', tier=1.3)
    # parede da mesa (acima do PC e dos alto-falantes): pôster de montanhas e outro de planeta
    _frame(p, (xw, 2.15, 0.0), (0.56, 0.78), 'x', '#f1e7d2',
           [(0, 0.1, 0.4, 0.4, '#f28f3b'), (0.0, -0.02, 0.34, 0.12, '#3a3f8f'), (-0.07, -0.12, 0.2, 0.2, '#2f3542'),
            (0.09, -0.15, 0.17, 0.14, '#57b894')])
    _frame(p, (xw, 1.95, 0.5), (0.38, 0.5), 'x', '#1f2540',
           [(0, 0.04, 0.22, 0.22, '#e58bb2'), (0, -0.12, 0.28, 0.025, '#f2c14e'), (0, -0.17, 0.2, 0.025, '#3fb8c9')])
    # parede do fundo, à esquerda da TV
    _frame(p, (-3.42, 1.72, zb), (0.62, 0.84), 'z', '#e9e0cc',
           [(0, 0.12, 0.44, 0.34, '#3fb8c9'), (-0.1, -0.06, 0.18, 0.2, '#f2c14e'), (0.12, -0.12, 0.22, 0.14, '#c8412f'),
            (0, -0.3, 0.44, 0.04, '#2f3542')])
    _frame(p, (-2.98, 2.05, zb), (0.3, 0.42), 'z', '#f1e7d2',
           [(0, 0.04, 0.18, 0.18, '#8e6bbf'), (0, -0.1, 0.18, 0.04, '#2f3542')])
    ctx.add_static(p)


def _leaf(p, base, yaw, tilt, length, size, col, r):
    """Folha de costela-de-adão: talo curvo + lâmina (elipsoide achatado) com dois lóbulos laterais."""
    bx, by, bz = base
    a = math.radians(yaw)
    dx, dz = math.cos(a), math.sin(a)
    horiz = length * math.sin(math.radians(tilt))
    up = length * math.cos(math.radians(tilt))
    pts = [(bx, by, bz), (bx + dx * horiz * 0.25, by + up * 0.55, bz + dz * horiz * 0.25),
           (bx + dx * horiz * 0.7, by + up * 0.88, bz + dz * horiz * 0.7), (bx + dx * horiz, by + up, bz + dz * horiz)]
    p.tube(pts, 0.008, c('stem'), seg=5, cap=False)
    tip = pts[-1]
    sx, sz = size
    cx, cz = tip[0] + dx * sz * 0.55, tip[2] + dz * sz * 0.55
    py = tip[1] + 0.03
    col_ = c(col, r)
    # lâmina central e dois lóbulos, inclinados para fora (a folha pende)
    p.blob((sx, 0.014, sz), (cx, py, cz), col_, seg=10, rings=5, ry=-yaw + 90, rx=0, rz=0)
    for s in (-1, 1):
        ox, oz = -dz * s * sx * 0.55, dx * s * sx * 0.55
        p.blob((sx * 0.62, 0.012, sz * 0.66), (cx + ox, py - 0.02, cz + oz), c(col, r * 0.93), seg=9, rings=5,
               ry=-yaw + 90, rx=0, rz=s * 14)


def _plant(ctx):
    """Costela-de-adão grande no canto da frente, junto à parede esquerda."""
    r = random.Random(41)
    px, pz = -3.62, 3.0
    p = Prop('monstera', 'room', tier=1.1)
    p.cyl(0.2, 0.42, (px, 0.0, pz), c('pot2'), anchor='b', seg=20, r2=0.15, bevel=0.012)
    p.cyl(0.19, 0.012, (px, 0.43, pz), c('soil'), anchor='b', seg=18)
    p.cyl(0.2, 0.04, (px, 0.0, pz), c('wood_dark'), anchor='b', seg=20, r2=0.19)
    n = 11
    for k in range(n):
        yaw = k * (360 / n) + r.uniform(-12, 12)
        tilt = r.uniform(18, 50)
        ln = r.uniform(0.5, 0.95)
        col = ('leaf1', 'leaf2', 'leaf3')[k % 3]
        base = (px + 0.03 * math.cos(math.radians(yaw)), 0.43, pz + 0.03 * math.sin(math.radians(yaw)))
        _leaf(p, base, yaw, tilt, ln, (0.2, 0.15), col, r.uniform(0.9, 1.1))
    # duas folhas altas no centro
    for yaw, tilt, ln in ((20, 14, 1.15), (200, 12, 1.05)):
        _leaf(p, (px, 0.43, pz), yaw, tilt, ln, (0.22, 0.17), 'leaf3', 1.0)
    ctx.add_static(p)


def _lounge(ctx):
    """Pufe, mesinha baixa com caneca e um jogo de tabuleiro aberto: o quarto precisa parecer habitado."""
    p = Prop('lounge', 'room', tier=1.1)
    # pufe redondo, achatado
    px, pz = -2.5, 2.2
    p.cyl(0.34, 0.34, (px, 0.0, pz), c('violet'), anchor='b', seg=24, bevel=0.07, bseg=3)
    p.cyl(0.26, 0.012, (px, 0.34, pz), c('violet', 1.12), anchor='b', seg=20)
    p.blob((0.05, 0.02, 0.05), (px, 0.345, pz), c('violet', 0.8), seg=8, rings=4)
    # mesinha baixa de madeira
    tx, tz = -1.35, 2.5
    p.cyl(0.4, 0.04, (tx, 0.36, tz), c('wood_light'), anchor='b', seg=28, bevel=0.01)
    for k in range(3):
        a = math.radians(90 + 120 * k)
        p.box((0.04, 0.38, 0.04), (tx + 0.2 * math.cos(a), 0.0, tz + 0.2 * math.sin(a)), c('wood_dark'), bevel=0.006,
              seg=1, anchor='b', rx=10 * math.sin(a), rz=-10 * math.cos(a))
    # em cima: caneca, caixa de jogo aberta com tabuleiro e dados
    p.cyl(0.032, 0.08, (tx + 0.18, 0.4, tz - 0.1), c('pink'), anchor='b', seg=14, bevel=0.004)
    p.box((0.34, 0.04, 0.26), (tx - 0.04, 0.4, tz + 0.04), c('teal'), bevel=0.006, seg=1, anchor='b', ry=18)
    p.box((0.3, 0.004, 0.22), (tx - 0.04, 0.44, tz + 0.04), c('cream'), bevel=0, seg=1, anchor='b', ry=18, keep='+y')
    for k, (dx, dz, col) in enumerate(((0.02, 0.0, 'red'), (-0.08, 0.05, 'blue'), (0.08, 0.08, 'yellow'), (-0.02, -0.06, 'green'))):
        p.box((0.025, 0.025, 0.025), (tx + dx - 0.04, 0.444, tz + dz + 0.04), c(col), bevel=0.004, seg=1, anchor='b', ry=20 * k)
    ctx.add_static(p)


def _fairy_lights(ctx):
    """Varal de luzinhas quentes ao longo da parede esquerda, acima das cortinas e prateleira."""
    xw = ctx.W['WALL_LEFT_X']
    zs = [-3.25, -1.9, -0.6, 0.9, 2.3, 3.4]
    ys = [3.02, 2.9, 3.0, 2.98, 2.9, 3.02]
    pts = []
    n_per = 9
    for i in range(len(zs) - 1):
        for k in range(n_per):
            t = k / n_per
            z = zs[i] + (zs[i + 1] - zs[i]) * t
            sag = 0.12 * math.sin(math.pi * t)
            y = ys[i] + (ys[i + 1] - ys[i]) * t - sag
            pts.append((xw + 0.035, y, z))
    pts.append((xw + 0.035, ys[-1], zs[-1]))
    wire = Prop('fairy_wire', 'room', tier=1.0)
    wire.tube(pts, 0.0035, c('black', 1.5), seg=5)
    for z in zs:
        wire.box((0.012, 0.012, 0.012), (xw + 0.008, 3.04, z), c('metal'), bevel=0.003, seg=1)
    ctx.add_static(wire)
    bulbs = Prop('emit_fairy', None, pivot=(xw + 0.035, 2.95, 0.0))
    for i in range(len(pts)):
        if i % 3 == 1:
            x, y, z = pts[i]
            bulbs.blob((0.014, 0.018, 0.014), (x, y - 0.025, z), WHITE, seg=7, rings=5)
    ctx.add_emit(bulbs, '#ffc87a', 6.0, 0.8)
