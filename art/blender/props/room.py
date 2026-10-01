"""props/room.py — a casca do quarto: ilha, piso em tábuas, paredes, rodapé, janela e cidade.

Tudo em coordenadas do layout (Y-up). O piso tem topo em y = 0; as paredes ficam em x = -4.3..-4.18
(esquerda) e z = -3.5..-3.38 (fundo); as bordas +X e +Z são abertas (ARCHITECTURE §6.0).
"""

from __future__ import annotations

import math
import random

from kit import Prop, lin
from materials import C
import lights

WINDOW = lights.WINDOW


def build(ctx):
    _island(ctx)
    _floor(ctx)
    _walls(ctx)
    _window(ctx)
    _baseboards(ctx)
    _outlets(ctx)
    _city(ctx)


def _island(ctx):
    W, D = ctx.ROOM['width'], ctx.ROOM['depth']
    p = Prop('island_base', 'room', tier=0.35)
    # subpiso de madeira escura (visível nas frestas das tábuas e na borda da ilha) e a ilha em degraus
    p.box((W, 0.26, D), (0, -0.17, 0), lin(C['slab']), bevel=0.012, hide=('-y',))
    p.box((W - 1.4, 0.8, D - 1.4), (0, -0.70, 0), lin(C['island1']), bevel=0.04, seg=2)
    p.box((W - 3.4, 0.7, D - 3.0), (0, -1.45, 0), lin(C['island2']), bevel=0.04, seg=2, hide=('-y',))
    ctx.add_static(p)


def _floor(ctx):
    """Tábuas ao longo de X, com frestas de 6 mm e juntas escalonadas."""
    r = random.Random(7)
    p = Prop('floor_planks', 'room', tier=0.55)
    x_min, x_max = ctx.W['WALL_LEFT_X'], ctx.W['EDGE_RIGHT_X']
    z0, z1 = ctx.W['WALL_BACK_Z'], ctx.W['EDGE_FRONT_Z']
    pw, gap = 0.22, 0.006
    n = int(math.ceil((z1 - z0) / (pw + gap)))
    base = C['floor']
    for i in range(n):
        zc = z0 + (i + 0.5) * (pw + gap)
        w = min(pw, z1 - (zc - pw / 2))
        zc = z1 - w / 2 if zc + w / 2 > z1 else zc
        x = x_min
        # junta inicial deslocada por fileira
        seg = r.uniform(0.9, 2.6)
        while x < x_max - 1e-3:
            ln = min(seg, x_max - x)
            if x_max - (x + ln) < 0.5:
                ln = x_max - x
            k = r.uniform(0.9, 1.07)
            warm = r.uniform(-0.02, 0.025)
            col = lin(base, k)
            col = (col[0] * (1 + warm), col[1], col[2] * (1 - warm), 1.0)
            p.box((ln - gap, 0.04, w), (x + ln / 2, -0.02, zc), col, bevel=0.003, seg=1, hide=('-y',))
            x += ln
            seg = r.uniform(1.2, 3.2)
    ctx.add_static(p)


def _walls(ctx):
    W, D, H = ctx.ROOM['width'], ctx.ROOM['depth'], ctx.ROOM['wallHeight']
    T = ctx.ROOM['wallThickness']
    xl, xli = -W / 2, ctx.W['WALL_LEFT_X']
    zb, zbi = -D / 2, ctx.W['WALL_BACK_Z']
    zf = D / 2
    y_lo = -0.04
    wl = lin(C['wall_left'])
    wb = lin(C['wall_back'])
    cap = lin(C['wall_top'])
    win = WINDOW
    zc, ww = win['z'], win['w']
    za, zb_ = zc - ww / 2, zc + ww / 2
    y0, y1 = win['y0'], win['y1']

    pl = Prop('wall_left', 'room', tier=0.5)
    xc = (xl + xli) / 2
    # peças em torno da abertura da janela (sem bevel: a moldura cobre os cortes)
    pl.box((T, y0 - y_lo, zf - zbi), (xc, (y_lo + y0) / 2, (zbi + zf) / 2), wl, bevel=0, hide=('-x',))
    pl.box((T, H - y1, zf - zbi), (xc, (y1 + H) / 2, (zbi + zf) / 2), wl, bevel=0, hide=('-x',))
    pl.box((T, y1 - y0, za - zbi), (xc, (y0 + y1) / 2, (zbi + za) / 2), wl, bevel=0, hide=('-x',))
    pl.box((T, y1 - y0, zf - zb_), (xc, (y0 + y1) / 2, (zb_ + zf) / 2), wl, bevel=0, hide=('-x',))
    ctx.add_static(pl)

    pb = Prop('wall_back', 'room', tier=0.5)
    pb.box((W, H - y_lo, T), (0, (y_lo + H) / 2, (zb + zbi) / 2), wb, bevel=0, hide=('-z',))
    ctx.add_static(pb)

    # capa do topo das paredes (faixa mais escura, bem chanfrada) + canto
    pc = Prop('wall_caps', 'room', tier=0.5)
    pc.box((T, 0.03, zf - zbi), (xc, H + 0.015, (zbi + zf) / 2), cap, bevel=0.008)
    pc.box((W, 0.03, T), (0, H + 0.015, (zb + zbi) / 2), cap, bevel=0.008)
    ctx.add_static(pc)


def _window(ctx):
    win = WINDOW
    xli = ctx.W['WALL_LEFT_X']
    zc, ww = win['z'], win['w']
    y0, y1 = win['y0'], win['y1']
    hw = ww / 2
    wood = lin(C['baseboard'])
    p = Prop('window_frame', 'room', tier=1.0)
    # moldura interna (batente) no plano da parede
    p.box((0.12, 0.05, ww + 0.1), (xli - 0.06, y1 + 0.025, zc), wood, bevel=0.008)           # topo
    p.box((0.12, 0.05, ww + 0.1), (xli - 0.06, y0 - 0.025, zc), wood, bevel=0.008)           # base
    p.box((0.12, y1 - y0, 0.05), (xli - 0.06, (y0 + y1) / 2, zc - hw - 0.025), wood, bevel=0.008)
    p.box((0.12, y1 - y0, 0.05), (xli - 0.06, (y0 + y1) / 2, zc + hw + 0.025), wood, bevel=0.008)
    # guarnição aplicada na face interna da parede + peitoril
    p.box((0.025, 0.07, ww + 0.26), (xli + 0.0125, y1 + 0.085, zc), wood, bevel=0.006)
    p.box((0.025, y1 - y0 + 0.2, 0.07), (xli + 0.0125, (y0 + y1) / 2, zc - hw - 0.13), wood, bevel=0.006)
    p.box((0.025, y1 - y0 + 0.2, 0.07), (xli + 0.0125, (y0 + y1) / 2, zc + hw + 0.13), wood, bevel=0.006)
    p.box((0.14, 0.04, ww + 0.34), (xli + 0.07, y0 - 0.02, zc), wood, bevel=0.01)             # peitoril
    # caixilho: bastidor + travessas em cruz, no meio da espessura da parede
    xm = xli - 0.06
    bar = lin('#f6f2ea')
    p.box((0.04, 0.045, ww), (xm, y1 - 0.0225, zc), bar, bevel=0.005)
    p.box((0.04, 0.045, ww), (xm, y0 + 0.0225, zc), bar, bevel=0.005)
    p.box((0.04, y1 - y0, 0.045), (xm, (y0 + y1) / 2, zc - hw + 0.0225), bar, bevel=0.005)
    p.box((0.04, y1 - y0, 0.045), (xm, (y0 + y1) / 2, zc + hw - 0.0225), bar, bevel=0.005)
    p.box((0.04, y1 - y0, 0.035), (xm, (y0 + y1) / 2, zc), bar, bevel=0.005)
    p.box((0.04, 0.035, ww), (xm, y0 + (y1 - y0) * 0.62, zc), bar, bevel=0.005)
    ctx.add_static(p)

    # cortinas: varão + duas cortinas em dobras
    pc = Prop('window_curtains', 'room', tier=0.9)
    rod_y = y1 + 0.24
    pc.cyl(0.014, ww + 0.9, (xli + 0.09, rod_y, zc), lin(C['metal_dark']), axis='z', seg=10)
    for s in (-1, 1):
        pc.blob((0.03, 0.03, 0.03), (xli + 0.09, rod_y, zc + s * (hw + 0.47)), lin(C['wood_dark']), seg=8, rings=6)
        z_edge = zc + s * (hw + 0.4)   # lado de fora da cortina
        for k in range(4):
            zk = z_edge - s * (0.07 * k + 0.035)
            shade = lin(C['curtain'] if k % 2 == 0 else C['curtain2'])
            d = 0.075 + (0.015 if k % 2 == 0 else 0.0)
            ytop = rod_y - 0.03
            h = ytop - 0.1
            pc.box((d, h, 0.07), (xli + d / 2 + 0.01, 0.1 + h / 2, zk), shade, bevel=0.014, seg=2)
    ctx.add_static(pc)

    # vidro
    g = Prop('glass_window', None)
    g.box((0.006, y1 - y0, ww), (xli - 0.06, (y0 + y1) / 2, zc), lin('#101a40'), bevel=0.0)
    ctx.add_glass(g, '#0c1535', 0.18)


def _baseboards(ctx):
    W, D = ctx.ROOM['width'], ctx.ROOM['depth']
    xli, zbi = ctx.W['WALL_LEFT_X'], ctx.W['WALL_BACK_Z']
    col = lin(C['baseboard'])
    p = Prop('baseboards', 'room', tier=0.7)
    p.box((W / 2 + xli * -1 - 0.0 + (W / 2 - 0.0) - W / 2 + 0.0 - 0.0 + (xli + W / 2) * 0 + (-xli + W / 2) - (-xli),
           0.09, 0.02), (0, 0.045, zbi + 0.01), col, bevel=0.004, hide=('-z',)) if False else None
    x_len = (W / 2) - xli
    p.box((x_len, 0.09, 0.02), (xli + x_len / 2, 0.045, zbi + 0.01), col, bevel=0.004, seg=2)
    z_len = D / 2 - zbi
    p.box((0.02, 0.09, z_len), (xli + 0.01, 0.045, zbi + z_len / 2), col, bevel=0.004, seg=2)
    ctx.add_static(p)


def _outlets(ctx):
    xli, zbi = ctx.W['WALL_LEFT_X'], ctx.W['WALL_BACK_Z']
    p = Prop('outlets', 'room', tier=1.2)
    plate = lin(C['white'])
    for z, y in ((-3.05, 0.35), (0.25, 0.35), (-0.9, 0.35)):
        p.box((0.014, 0.08, 0.08), (xli + 0.007, y, z), plate, bevel=0.004)
        p.box((0.004, 0.02, 0.012), (xli + 0.0155, y + 0.012, z - 0.012), lin(C['darker']), bevel=0)
        p.box((0.004, 0.02, 0.012), (xli + 0.0155, y + 0.012, z + 0.012), lin(C['darker']), bevel=0)
    for x, y in ((-0.45, 0.35), (1.95, 1.05), (3.9, 1.05)):
        p.box((0.08, 0.08, 0.014), (x, y, zbi + 0.007), plate, bevel=0.004)
        p.box((0.012, 0.02, 0.004), (x - 0.012, y + 0.012, zbi + 0.0155), lin(C['darker']), bevel=0)
        p.box((0.012, 0.02, 0.004), (x + 0.012, y + 0.012, zbi + 0.0155), lin(C['darker']), bevel=0)
    # interruptor perto da janela
    p.box((0.014, 0.09, 0.055), (xli + 0.007, 1.25, 3.0), plate, bevel=0.004)
    p.box((0.01, 0.04, 0.025), (xli + 0.016, 1.26, 3.0), lin('#d6d0c6'), bevel=0.003)
    ctx.add_static(p)


def _city(ctx):
    """Cidade noturna vista pela janela: janelinhas acesas agrupadas em prédios, num plano distante."""
    r = random.Random(21)
    xp = -6.2
    warm = Prop('emit_window_city', None)
    cool = Prop('emit_window_city_cool', None)
    z_lo, z_hi = -5.0, 8.5
    # prédios: (z central, largura, altura do topo, andar base)
    z = z_lo
    while z < z_hi:
        bw = r.uniform(1.4, 3.0)
        top = r.uniform(-0.2, 6.5)
        floors = int((top + 5.0) / 0.42)
        cols = int(bw / 0.3)
        for fi in range(floors):
            y = -5.0 + fi * 0.42
            for ci in range(cols):
                if r.random() < 0.42:
                    zz = z + 0.15 + ci * 0.3
                    target = cool if r.random() < 0.2 else warm
                    sx, sz = 0.2, 0.12
                    target.box((0.02, sx, sz), (xp, y, zz), (1, 1, 1, 1), bevel=0.0)
        z += bw + r.uniform(0.2, 0.8)
    # antena e luzes vermelhas no topo de dois prédios
    ctx.add_emit(warm, '#ffd89b', 2.2, 0.0)
    ctx.add_emit(cool, '#9fe3ff', 2.0, 0.0)
