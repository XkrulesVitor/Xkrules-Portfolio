"""props/bed.py — cama de casal, criado-mudo com abajur e chinelos (`zone_bed`).

Âncora: LAYOUT.bed = centro do estrado (3.12, 0, 2.35), 2.2 (x) x 1.8 (z), cabeceira em +X encostada na
borda direita da ilha. Estática, sem hotspot.
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
    _bed(ctx)
    _nightstand(ctx)
    _extras(ctx)


def _bed(ctx):
    bx, _, bz = ctx.LAYOUT['bed']
    r = random.Random(31)
    p = Prop('bed', 'bed', tier=1.1)
    # estrado: plinto escuro recuado + caixa de madeira
    p.box((2.1, 0.1, 1.7), (bx, 0.0, bz), c('darker'), bevel=0.01, seg=1, anchor='b', hide=('-y',))
    p.box((2.2, 0.2, 1.8), (bx, 0.1, bz), c('wood_dark'), bevel=0.016, seg=2, anchor='b')
    p.box((2.14, 0.012, 1.74), (bx - 0.01, 0.296, bz), c('wood', 0.9), bevel=0.004, seg=1, anchor='b')
    # cabeceira alta e acolchoada (+X, encostada na borda)
    p.box((0.08, 0.85, 1.8), (bx + 1.14, 0.0, bz), c('wood_dark'), bevel=0.014, seg=2, anchor='b')
    for s in (-1, 1):
        p.box((0.06, 0.42, 0.8), (bx + 1.1, 0.4, bz + s * 0.43), c('headboard'), bevel=0.03, seg=3, anchor='b')
    p.box((0.05, 0.1, 1.74), (bx + 1.095, 0.8, bz), c('headboard', 0.85), bevel=0.02, seg=2, anchor='b')
    # colchão com lençol aparente
    p.box((2.12, 0.2, 1.72), (bx - 0.02, 0.3, bz), c('sheet'), bevel=0.03, seg=3, anchor='b')
    # edredom: volume principal, cuff dobrado na cabeceira e pregas
    dv = bx - 0.28
    p.box((1.52, 0.1, 1.82), (dv, 0.5, bz), c('duvet'), bevel=0.04, seg=3, anchor='b')
    for s in (-1, 1):                                  # laterais caindo sobre o estrado
        p.box((1.5, 0.26, 0.05), (dv, 0.3, bz + s * 0.88), c('duvet', 0.92), bevel=0.02, seg=2, anchor='b')
    p.box((0.05, 0.26, 1.78), (dv - 0.78, 0.31, bz), c('duvet', 0.92), bevel=0.02, seg=2, anchor='b')       # pé da cama
    p.box((0.24, 0.07, 1.84), (dv + 0.62, 0.58, bz), c('duvet_fold'), bevel=0.03, seg=3, anchor='b')            # cuff dobrado
    for k in range(2):                                  # listras de acolchoado (faixas mais claras)
        p.box((1.5, 0.004, 0.09), (dv, 0.598, bz + (k - 0.5) * 0.9), c('duvet_fold', 0.95), bevel=0.0015, seg=1,
              anchor='b', keep='+y')
    # manta de pé de cama, dobrada
    p.box((0.4, 0.07, 1.62), (bx - 0.86, 0.6, bz), c('curtain2'), bevel=0.035, seg=3, anchor='b', ry=1.5)
    for s_ in (-1, 0, 1):
        p.box((0.02, 0.004, 1.58), (bx - 0.86 + s_ * 0.12, 0.668, bz), c('curtain', 1.1), bevel=0.001, seg=1,
              anchor='b', keep='+y')
    # travesseiros chanfrados
    p.box((0.42, 0.16, 0.74), (bx + 0.86, 0.5, bz - 0.43), c('pillow'), bevel=0.06, seg=3, anchor='b', ry=5)
    p.box((0.42, 0.16, 0.74), (bx + 0.86, 0.5, bz + 0.43), c('pillow2'), bevel=0.06, seg=3, anchor='b', ry=-4)
    p.box((0.34, 0.14, 0.62), (bx + 0.7, 0.64, bz - 0.4), c('pillow', 0.97), bevel=0.05, seg=3, anchor='b', ry=3, rz=-8)
    # almofada decorativa e ursinho de pelúcia
    p.box((0.12, 0.34, 0.34), (bx + 0.45, 0.58, bz + 0.0), c('chair_acc'), bevel=0.05, seg=3, anchor='b', rz=24)
    p.blob((0.07, 0.07, 0.065), (bx + 0.45, 0.67, bz + 0.5), hx('#c9a27a'), seg=9, rings=6)
    p.blob((0.05, 0.05, 0.05), (bx + 0.45, 0.76, bz + 0.5), hx('#c9a27a'), seg=9, rings=6)
    for s in (-1, 1):
        p.blob((0.018, 0.018, 0.018), (bx + 0.45, 0.805, bz + 0.5 + s * 0.04), hx('#c9a27a'), seg=7, rings=5)
    ctx.add_static(p)


def _nightstand(ctx):
    bx, _, bz = ctx.LAYOUT['bed']
    nx, nz = bx + 0.78, bz - 1.24                       # ao lado da cabeceira, no lado do fundo
    p = Prop('nightstand', 'bed', tier=1.2)
    wood, wl = c('wood'), c('wood_light')
    for sx in (-1, 1):
        for sz in (-1, 1):
            p.box((0.04, 0.12, 0.04), (nx + sx * 0.19, 0.0, nz + sz * 0.17), c('wood_dark'), bevel=0.006, seg=1, anchor='b')
    p.box((0.46, 0.34, 0.4), (nx, 0.12, nz), wood, bevel=0.014, seg=2, anchor='b')
    p.box((0.5, 0.025, 0.44), (nx, 0.46, nz), wl, bevel=0.008, seg=2, anchor='b')
    p.box((0.01, 0.12, 0.34), (nx - 0.235, 0.34, nz), wl, bevel=0.004, seg=1, anchor='b')            # frente da gaveta de cima
    p.box((0.01, 0.12, 0.34), (nx - 0.235, 0.2, nz), wl, bevel=0.004, seg=1, anchor='b')
    p.box((0.014, 0.014, 0.1), (nx - 0.245, 0.4, nz), c('metal'), bevel=0.004, seg=1, anchor='b')
    p.box((0.014, 0.014, 0.1), (nx - 0.245, 0.26, nz), c('metal'), bevel=0.004, seg=1, anchor='b')
    # abajur: base e haste (o casco da cúpula é emissivo)
    top = 0.485
    lx, lz = nx + 0.03, nz - 0.08
    p.cyl(0.06, 0.02, (lx, top, lz), c('metal_dark'), anchor='b', seg=16, bevel=0.004)
    p.cyl(0.012, 0.16, (lx, top + 0.02, lz), c('metal_dark'), anchor='b', seg=10)
    # livros empilhados, caneca e despertador
    p.box((0.16, 0.025, 0.12), (nx + 0.0, top, nz + 0.1), c('blue'), bevel=0.004, seg=1, anchor='b', ry=10)
    p.box((0.15, 0.022, 0.11), (nx + 0.0, top + 0.025, nz + 0.1), c('pink'), bevel=0.004, seg=1, anchor='b', ry=-6)
    p.cyl(0.032, 0.07, (nx - 0.1, top, nz - 0.1), c('white'), anchor='b', seg=14, bevel=0.004)
    p.box((0.07, 0.055, 0.04), (nx - 0.12, top, nz + 0.14), c('darker'), bevel=0.012, seg=2, anchor='b', ry=18)
    ctx.add_static(p)
    lamp_y = top + 0.2
    shade = Prop('emit_bedlamp', None, pivot=(lx, lamp_y, lz))
    shade.cyl(0.11, 0.14, (lx, lamp_y, lz), WHITE, seg=18, r2=0.075, bevel=0.0)
    ctx.add_emit(shade, '#ffbf7a', 9.0, 1.0, light_proxy=True)
    ctx.set_mark('bedlamp', (lx, lamp_y, lz))
    ph = Prop('emit_phone', None, pivot=(nx - 0.12, top + 0.004, nz + 0.14))
    ph.box((0.07, 0.006, 0.14), (nx + 0.12, top + 0.004, nz + 0.14), WHITE, bevel=0.002, seg=1, ry=-12)
    ctx.add_emit(ph, '#7da8ff', 2.0, 0.3)


def _extras(ctx):
    bx, _, bz = ctx.LAYOUT['bed']
    p = Prop('bed_extras', 'bed', tier=1.2)
    # tapete aos pés da cama
    rx, rz = bx - 1.75, bz
    p.box((1.3, 0.012, 2.0), (rx, 0.0, rz), c('rug_b'), bevel=0.004, seg=1, anchor='b', keep='+y')
    p.box((1.1, 0.014, 1.8), (rx, 0.0, rz), c('rug_a'), bevel=0.004, seg=1, anchor='b', keep='+y')
    p.box((0.8, 0.016, 1.5), (rx, 0.0, rz), c('rug_b'), bevel=0.004, seg=1, anchor='b', keep='+y')
    # chinelos
    for k, (dz, ry) in enumerate(((-0.14, 8), (0.12, -6))):
        sx, sz = rx + 0.1, rz + dz
        p.box((0.24, 0.02, 0.1), (sx, 0.014, sz), c('white'), bevel=0.008, seg=2, anchor='b', ry=ry)
        p.box((0.2, 0.04, 0.09), (sx + 0.02, 0.034, sz), c('pink'), bevel=0.018, seg=3, anchor='b', ry=ry)
    ctx.add_static(p)
