"""props/desk.py — zona da mesa (`zone_desk`) e a cadeira gamer (`chair_root`).

Mesa reta na parede esquerda, sem gaveteiro (decisão do dono, 2026-10-01). Quem senta olha para -X:
a direita dessa pessoa é -Z e a esquerda é +Z. As âncoras (telas, PC, cadeira) vêm do layout.json.
"""

from __future__ import annotations

import math
import random

from kit import Prop, lin
from materials import C

WHITE = (1.0, 1.0, 1.0, 1.0)


def c(name, k=1.0):
    return lin(C[name], k)


def build(ctx):
    _desk(ctx)
    _monitors(ctx)
    _keyboard_mouse(ctx)
    _pc(ctx)
    _desk_props(ctx)
    _wall_shelf(ctx)
    _cables(ctx)
    _chair(ctx)


# ----------------------------------------------------------------------------------- mesa


def _desk(ctx):
    top = ctx.W['DESK_TOP_Y']
    dc, ds = ctx.LAYOUT['desk']['center'], ctx.LAYOUT['desk']['size']
    x0, x1 = dc[0] - ds[0] / 2, dc[0] + ds[0] / 2
    z0, z1 = dc[2] - ds[2] / 2, dc[2] + ds[2] / 2
    p = Prop('desk_frame', 'desk', tier=1.1)
    p.box(ds, dc, c('wood'), bevel=0.014, seg=2)                                   # tampo
    p.box((ds[0] + 0.004, 0.012, ds[2] + 0.004), (dc[0], dc[1] - 0.05, dc[2]), c('wood_dark'), bevel=0.004, seg=1)
    # pernas de aço (quadradas) com sapatas
    for x in (x0 + 0.07, x1 - 0.07):
        for z in (z0 + 0.1, z1 - 0.1):
            p.box((0.06, top - 0.09, 0.06), (x, 0.015, z), c('steel'), bevel=0.006, anchor='b')
            p.box((0.08, 0.016, 0.08), (x, 0.0, z), c('darker'), bevel=0.004, seg=1, anchor='b')
        # travessas sob o tampo, ao longo de Z
        p.box((0.04, 0.05, ds[2] - 0.2), (x, top - 0.115, dc[2]), c('steel'), bevel=0.005, seg=1)
    # travessas ao longo de X nas pontas e painel traseiro baixo (contraventamento)
    for z in (z0 + 0.1, z1 - 0.1):
        p.box((ds[0] - 0.14, 0.05, 0.04), (dc[0], top - 0.115, z), c('steel'), bevel=0.005, seg=1)
    p.box((0.02, 0.32, ds[2] - 0.5), (x0 + 0.05, 0.42, dc[2]), c('dark'), bevel=0.004, seg=1)
    # bandeja de cabos sob o tampo, junto à parede
    p.box((0.16, 0.04, ds[2] - 0.5), (x0 + 0.1, top - 0.14, dc[2]), c('black'), bevel=0.006, seg=1)
    ctx.add_static(p)


def _monitors(ctx):
    L_ = ctx.LAYOUT
    top = ctx.W['DESK_TOP_Y']
    mm, vm = L_['monitorMain'], L_['monitorVertical']
    p = Prop('monitors', 'desk', tier=1.3)

    # --- monitor horizontal: painel 3,5 cm além da tela, 1,5 mm atrás do plano da tela
    cx, cy, cz = mm['center']
    sw, sh = mm['size']
    pw, ph, pt = sw + 0.07, sh + 0.07, 0.03
    xf = cx - 0.0015
    p.box((pt, ph, pw), (xf - pt / 2, cy, cz), c('bezel'), bevel=0.007, seg=2)
    p.box((0.05, ph - 0.2, pw - 0.3), (xf - pt - 0.025 + 0.002, cy + 0.02, cz), c('dark'), bevel=0.012, seg=2)
    p.box((0.05, 0.34, 0.1), (xf - pt - 0.02, top + 0.015, cz), c('steel'), bevel=0.008, anchor='b')   # pescoço
    p.box((0.22, 0.014, 0.42), (xf - pt - 0.03, top, cz), c('steel'), bevel=0.006, seg=1, anchor='b')  # base
    p.box((0.004, 0.006, 0.006), (xf + 0.0005, cy - ph / 2 + 0.014, cz + pw / 2 - 0.06), c('accent'), bevel=0)  # LED

    # --- monitor vertical
    vx, vy, vz = vm['center']
    vsw, vsh = vm['size']
    vpw, vph = vsw + 0.07, vsh + 0.07
    xv = vx - 0.0015
    p.box((pt, vph, vpw), (xv - pt / 2, vy, vz), c('bezel'), bevel=0.007, seg=2)
    p.box((0.05, vph - 0.3, vpw - 0.2), (xv - pt - 0.025 + 0.002, vy + 0.02, vz), c('dark'), bevel=0.012, seg=2)
    p.box((0.05, 0.3, 0.1), (xv - pt - 0.02, top + 0.015, vz), c('steel'), bevel=0.008, anchor='b')
    p.box((0.22, 0.014, 0.4), (xv - pt - 0.03, top, vz), c('steel'), bevel=0.006, seg=1, anchor='b')
    p.box((0.004, 0.006, 0.006), (xv + 0.0005, vy - vph / 2 + 0.014, vz + vpw / 2 - 0.05), c('accent'), bevel=0)
    ctx.add_static(p)

    ctx.add_screen('screen_monitor_main', mm['center'], mm['normal'], mm['size'], night=1.6, day=0.25,
                   color='#9fc2ff')
    ctx.add_screen('screen_monitor_vertical', vm['center'], vm['normal'], vm['size'], night=1.3, day=0.2,
                   color='#8e86ff')

    # --- light bar sobre o monitor horizontal (luminária) com tira emissiva embaixo
    bar = Prop('desk_lightbar', 'desk', tier=1.3)
    by = cy + ph / 2
    bar.box((0.05, 0.03, 0.46), (cx - 0.012, by + 0.03, cz), c('black'), bevel=0.008, seg=2)
    bar.box((0.03, 0.025, 0.05), (cx - 0.05, by + 0.012, cz), c('black'), bevel=0.006, seg=1)
    ctx.add_static(bar)
    em = Prop('emit_lightbar', None, pivot=(cx - 0.004, by + 0.0125, cz))
    em.box((0.034, 0.005, 0.42), (cx - 0.004, by + 0.0125, cz), WHITE, bevel=0.001, seg=1)
    ctx.add_emit(em, '#ffd9a8', 3.0, 0.4)
    ctx.set_mark('lightbar', (cx - 0.004, by + 0.0125, cz))


def _keyboard_mouse(ctx):
    top = ctx.W['DESK_TOP_Y']
    mm = ctx.LAYOUT['monitorMain']['center']
    kx, kz = mm[0] + 0.58, mm[2]
    p = Prop('desk_input', 'desk', tier=1.6)
    # desk mat cobrindo teclado e mouse (o "mousepad" à direita de quem senta, -Z)
    mat_top = top + 0.004
    p.box((0.36, 0.004, 1.2), (kx + 0.02, top + 0.002, kz - 0.28), c('darker'), bevel=0.0015, seg=1, keep='+y')
    p.box((0.36, 0.0045, 0.012), (kx + 0.02, top + 0.002, kz - 0.28 + 0.6 - 0.012), c('chair_acc'), bevel=0, keep='+y')
    # teclado full-size: base + teclas em grade (5 fileiras x 14 colunas)
    kb_y = mat_top
    p.box((0.17, 0.022, 0.47), (kx, kb_y, kz), c('dark'), bevel=0.006, seg=2, anchor='b')
    key_h = 0.011
    ky = kb_y + 0.022
    pitch_z, pitch_x = 0.0315, 0.0305
    r = random.Random(11)
    accent_keys = {(0, 0), (2, 13), (1, 13)}
    for row in range(5):
        xr = kx - 0.065 + row * pitch_x
        if row == 4:
            # barra de espaço + teclas laterais
            p.box((0.026, key_h, 0.2), (xr, ky, kz), c('chair_seat', 1.4), bevel=0.003, seg=1, anchor='b', keep='+y')
            for z in (-0.18, -0.15, 0.15, 0.18):
                p.box((0.026, key_h, 0.028), (xr, ky, kz + z), c('chair_seat', 1.4), bevel=0.003, seg=1, anchor='b', keep='+y')
            continue
        for col in range(14):
            zc = kz - 0.2 + col * pitch_z
            hot = (row, col) in accent_keys
            shade = c('chair_acc') if hot else c('chair_seat', 1.1 + r.uniform(-0.12, 0.12))
            w = 0.04 if (row == 1 and col == 13) else 0.0265
            p.box((0.0265, key_h, w), (xr, ky, zc), shade, bevel=0.003, seg=1, anchor='b', keep='+y')
    # mouse
    mx, mz = kx + 0.03, kz - 0.62
    p.box((0.1, 0.034, 0.06), (mx, mat_top, mz), c('dark'), bevel=0.016, seg=3, anchor='b')
    p.box((0.03, 0.004, 0.008), (mx - 0.02, mat_top + 0.034, mz), c('chair_acc'), bevel=0.001, seg=1, anchor='b')
    ctx.add_static(p)
    ctx.set_mark('mouse', (mx, mat_top, mz))


def _pc(ctx):
    px, py, pz = ctx.LAYOUT['pcTower']
    p = Prop('pc_case', 'desk', tier=1.3)
    bx0, bx1 = px - 0.275, px + 0.275
    z0, z1 = pz - 0.15, pz + 0.15
    y0, y1 = py + 0.02, py + 0.62
    dark, darker = c('dark'), c('darker')
    # pés, base e topo
    for x in (bx0 + 0.05, bx1 - 0.05):
        for z in (z0 + 0.04, z1 - 0.04):
            p.box((0.05, 0.02, 0.05), (x, py, z), c('black'), bevel=0.006, seg=1, anchor='b')
    p.box((0.55, 0.03, 0.30), (px, y0 + 0.015, pz), dark, bevel=0.006, seg=1)
    p.box((0.55, 0.03, 0.30), (px, y1 - 0.015, pz), dark, bevel=0.006, seg=1)
    for i in range(6):          # grade de ventilação do topo
        p.box((0.36, 0.004, 0.016), (px - 0.04, y1 + 0.001, pz - 0.1 + i * 0.04), c('black'), bevel=0, seg=1)
    # frente (+X): painel com tela de malha e LED; costas (-X); lado oposto ao vidro (-Z)
    p.box((0.03, y1 - y0 - 0.06, 0.30), (bx1 - 0.015, (y0 + y1) / 2, pz), dark, bevel=0.005, seg=1)
    p.box((0.006, y1 - y0 - 0.16, 0.2), (bx1 + 0.002, (y0 + y1) / 2 - 0.03, pz - 0.02), c('black'), bevel=0.001, seg=1)
    p.box((0.012, 0.022, 0.022), (bx1 + 0.002, y1 - 0.07, pz + 0.095), c('metal'), bevel=0.004, seg=2)  # botão
    p.box((0.03, y1 - y0 - 0.06, 0.30), (bx0 + 0.015, (y0 + y1) / 2, pz), darker, bevel=0.005, seg=1)
    p.box((0.55, y1 - y0 - 0.06, 0.012), (px, (y0 + y1) / 2, z0 + 0.006), dark, bevel=0.003, seg=1)
    # moldura do vidro (+Z): quatro barras finas em volta da janela
    zf = z1 - 0.006
    p.box((0.55, 0.026, 0.014), (px, y1 - 0.043, zf), darker, bevel=0.003, seg=1)
    p.box((0.55, 0.026, 0.014), (px, y0 + 0.043, zf), darker, bevel=0.003, seg=1)
    # interior: placa-mãe, GPU, RAM, cooler, fonte
    zin = z0 + 0.03
    p.box((0.4, 0.46, 0.008), (px - 0.03, py + 0.33, zin), c('green', 0.35), bevel=0.002, seg=1)
    p.box((0.34, 0.075, 0.13), (px + 0.0, py + 0.23, zin + 0.075), c('black'), bevel=0.006, seg=2)      # GPU
    p.box((0.30, 0.01, 0.1), (px + 0.0, py + 0.2, zin + 0.1), c('chair_acc'), bevel=0.002, seg=1)
    for k in range(2):
        p.box((0.012, 0.14, 0.028), (px - 0.14 + k * 0.022, py + 0.45, zin + 0.025), c('chair_acc', 1.2),
              bevel=0.002, seg=1)
    p.box((0.09, 0.13, 0.08), (px - 0.14, py + 0.36, zin + 0.05), c('metal_dark'), bevel=0.006, seg=2)   # cooler
    p.box((0.47, 0.1, 0.26), (px - 0.0, y0 + 0.08, pz - 0.0), c('black'), bevel=0.006, seg=1)            # fonte
    ctx.add_static(p)

    # vidro lateral (+Z)
    g = Prop('glass_pc', None, pivot=(px, py + 0.31, z1 - 0.003))
    g.quad((px - 0.255, py + 0.045, z1 - 0.003), (px + 0.255, py + 0.045, z1 - 0.003),
           (px + 0.255, py + 0.575, z1 - 0.003), (px - 0.255, py + 0.575, z1 - 0.003), WHITE)
    ctx.add_glass(g, '#0b1233', 0.3)

    # ventoinhas com pás (emissivas), girando em torno do eixo Z do vidro
    for nm, dy in (('pc_fan_top', 0.45), ('pc_fan_bottom', 0.185)):
        ctr = (px + 0.07, py + dy, pz + 0.11)
        f = Prop(nm, None, pivot=ctr)
        f.ring(0.066, 0.058, 0.026, ctr, WHITE, axis='z', seg=28)
        f.cyl(0.02, 0.026, ctr, WHITE, axis='z', seg=14)
        for k in range(7):
            a = k * 360.0 / 7
            rm = 0.04
            pos = (ctr[0] + rm * math.cos(math.radians(a)), ctr[1] + rm * math.sin(math.radians(a)), ctr[2])
            f.box((0.036, 0.02, 0.004), pos, WHITE, bevel=0.0012, seg=1, rx=24, rz=a, order='zx')
        ctx.add_emit(f, '#7fd0ff' if dy > 0.3 else '#b388ff', 2.2, 0.4)
    # fita RGB vertical junto à frente
    ctr = (px + 0.225, py + 0.31, pz + 0.135)
    rgb = Prop('pc_rgb', None, pivot=ctr)
    rgb.box((0.012, 0.5, 0.012), ctr, WHITE, bevel=0.002, seg=1)
    ctx.add_emit(rgb, '#b388ff', 3.0, 0.7)
    # LED frontal do gabinete
    ctr = (bx1 + 0.006, py + 0.36, pz)
    led = Prop('led_case', None, pivot=ctr)
    led.box((0.008, 0.3, 0.014), ctr, WHITE, bevel=0.002, seg=1)
    ctx.add_emit(led, '#7ff5d0', 2.5, 0.5, cat='emit')


def _desk_props(ctx):
    top = ctx.W['DESK_TOP_Y']
    p = Prop('desk_props', 'desk', tier=1.3)
    r = random.Random(5)
    # --- headset no suporte, à esquerda de quem senta (+Z)
    hx, hz = -3.72, 0.32
    p.cyl(0.07, 0.016, (hx, top, hz), c('dark'), bevel=0.004, anchor='b', seg=18)
    p.cyl(0.011, 0.3, (hx, top + 0.016, hz), c('metal_dark'), anchor='b', seg=10)
    p.box((0.05, 0.016, 0.05), (hx, top + 0.318, hz), c('metal_dark'), bevel=0.005, seg=1)
    hy = top + 0.34
    p.box((0.028, 0.022, 0.19), (hx + 0.02, hy + 0.13, hz), c('chair_seat'), bevel=0.008, seg=2)      # arco
    for s in (-1, 1):
        p.box((0.028, 0.12, 0.022), (hx + 0.02, hy + 0.07, hz + s * 0.09), c('chair_seat'), bevel=0.006, seg=2)
        p.cyl(0.05, 0.034, (hx + 0.02, hy, hz + s * 0.1), c('chair_acc'), axis='z', seg=18, bevel=0.008)
        p.cyl(0.044, 0.016, (hx + 0.02, hy, hz + s * 0.126), c('black'), axis='z', seg=18)
    p.box((0.1, 0.012, 0.012), (hx + 0.07, hy - 0.04, hz + 0.1), c('black'), bevel=0.004, seg=1)    # microfone
    # --- caneca de café (com vapor no nó fx_mug_steam)
    mx, mz = -3.2, -0.88
    p.cyl(0.04, 0.095, (mx, top, mz), c('cream'), bevel=0.004, anchor='b', seg=20)
    p.cyl(0.034, 0.005, (mx, top + 0.092, mz), c('walnut'), seg=20)
    for dz, dy in ((0.0, 0.0),):
        p.box((0.014, 0.012, 0.012), (mx, top + 0.075, mz + 0.047), c('cream'), bevel=0.003, seg=1)
        p.box((0.014, 0.012, 0.012), (mx, top + 0.03, mz + 0.047), c('cream'), bevel=0.003, seg=1)
        p.box((0.014, 0.058, 0.012), (mx, top + 0.052, mz + 0.056), c('cream'), bevel=0.003, seg=1)
    p.cyl(0.055, 0.004, (mx, top, mz), c('wood_dark'), anchor='b', seg=20)                           # porta-copo
    # --- caixas de som (esquerda +Z e direita -Z)
    for sz in (0.02, -3.12):
        sx = -3.84
        p.box((0.15, 0.25, 0.15), (sx, top, sz), c('dark'), bevel=0.012, seg=2, anchor='b')
        p.cyl(0.045, 0.01, (sx + 0.075, top + 0.09, sz), c('black'), axis='x', seg=18)
        p.cyl(0.02, 0.01, (sx + 0.075, top + 0.19, sz), c('black'), axis='x', seg=14)
        p.cyl(0.009, 0.006, (sx + 0.077, top + 0.045, sz + 0.05), c('chair_acc'), axis='x', seg=10)
    # --- suculenta em vaso, atrás do monitor vertical
    sx, sz = -3.3, -3.06
    p.cyl(0.05, 0.075, (sx, top, sz), c('pot2'), anchor='b', seg=16, r2=0.042, bevel=0.004)
    p.cyl(0.044, 0.008, (sx, top + 0.074, sz), c('soil'), anchor='b', seg=14)
    for k in range(9):
        a = k * 40 + r.uniform(-8, 8)
        rr = 0.028 if k < 6 else 0.012
        pos = (sx + rr * math.cos(math.radians(a)), top + 0.098 + (0 if k < 6 else 0.025), sz + rr * math.sin(math.radians(a)))
        p.blob((0.016, 0.03, 0.016), pos, c(['leaf3', 'leaf1', 'leaf4'][k % 3]), seg=7, rings=5, rx=0, ry=-a,
               rz=28 if k < 6 else 12)
    # --- porta-canetas com canetas
    px_, pz_ = -3.12, -3.0
    p.cyl(0.036, 0.095, (px_, top, pz_), c('teal'), anchor='b', seg=16, bevel=0.004)
    for k, col in enumerate(('red', 'yellow', 'blue', 'dark')):
        a = k * 90 + 20
        p.box((0.008, 0.14, 0.008), (px_ + 0.014 * math.cos(math.radians(a)), top + 0.12, pz_ + 0.014 * math.sin(math.radians(a))),
              c(col), bevel=0.002, seg=1, rz=8 * math.cos(math.radians(a)), rx=8 * math.sin(math.radians(a)))
    # --- caderno fechado e dois post-its
    p.box((0.15, 0.014, 0.21), (-3.08, top, -0.52), c('violet'), bevel=0.004, seg=2, anchor='b', ry=12)
    p.box((0.12, 0.002, 0.17), (-3.08, top + 0.0145, -0.52), c('cream'), bevel=0.0, seg=1, anchor='b', ry=12, keep='+y')
    ctx.add_static(p)
    ctx.set_mark('mug', (mx, top + 0.095, mz))

    # vapor: plano vertical sobre a caneca (normal +X), fumaça animada no runtime (V.3)
    steam = Prop('fx_mug_steam', None, pivot=(mx, top + 0.22, mz))
    steam.quad((mx, top + 0.11, mz + 0.06), (mx, top + 0.11, mz - 0.06), (mx, top + 0.33, mz - 0.06),
               (mx, top + 0.33, mz + 0.06), WHITE)
    ctx.add_fx(steam)


def _wall_shelf(ctx):
    """Prateleira na parede acima dos monitores: livros, figuras e fita de LED roxa por baixo."""
    xw = ctx.W['WALL_LEFT_X']
    sy = 2.52
    zc, zl = -1.8, 2.1
    p = Prop('wall_shelf', 'desk', tier=1.0)
    r = random.Random(3)
    p.box((0.26, 0.03, zl), (xw + 0.13, sy, zc), c('wood'), bevel=0.006, seg=2)
    for z in (zc - zl / 2 + 0.25, zc + zl / 2 - 0.25):
        p.box((0.2, 0.2, 0.025), (xw + 0.11, sy - 0.12, z), c('steel'), bevel=0.004, seg=1)
    top = sy + 0.015
    # fileira de livros (alturas e cores diferentes) ao fundo, mais uma pilha deitada
    z = zc - zl / 2 + 0.08
    cols = ('red', 'blue', 'yellow', 'teal', 'violet', 'green', 'orange', 'pink', 'accent')
    k = 0
    while z < zc - 0.1:
        t = r.uniform(0.028, 0.055)
        h = r.uniform(0.17, 0.28)
        tilt = r.uniform(-3, 3) if r.random() < 0.15 else 0
        p.box((0.16, h, t), (xw + 0.11, top, z + t / 2), c(cols[k % len(cols)], r.uniform(0.85, 1.05)),
              bevel=0.004, seg=1, anchor='b', rx=tilt)
        z += t + 0.003
        k += 1
    # pilha deitada
    for i in range(3):
        p.box((0.19 - i * 0.01, 0.035, 0.14), (xw + 0.12, top + i * 0.035, zc + 0.12), c(cols[(i + 3) % len(cols)]),
              bevel=0.004, seg=1, anchor='b', ry=r.uniform(-8, 8))
    # figuras: robozinho de caixas, cubo de dados e mini vaso
    rx_, rz_ = xw + 0.12, zc + 0.42
    p.box((0.07, 0.07, 0.08), (rx_, top, rz_), c('metal'), bevel=0.008, seg=2, anchor='b')
    p.box((0.055, 0.05, 0.06), (rx_, top + 0.07, rz_), c('metal'), bevel=0.008, seg=2, anchor='b')
    p.box((0.01, 0.01, 0.01), (rx_ + 0.03, top + 0.1, rz_ - 0.014), c('accent'), bevel=0.001, seg=1)
    p.box((0.01, 0.01, 0.01), (rx_ + 0.03, top + 0.1, rz_ + 0.014), c('accent'), bevel=0.001, seg=1)
    p.box((0.05, 0.05, 0.05), (xw + 0.13, top, zc + 0.62), c('dice'), bevel=0.006, seg=2, anchor='b', ry=25)
    p.cyl(0.035, 0.05, (xw + 0.14, top, zc + 0.85), c('pot'), anchor='b', seg=14, r2=0.03, bevel=0.003)
    p.blob((0.03, 0.04, 0.03), (xw + 0.14, top + 0.075, zc + 0.85), c('leaf2'), seg=9, rings=6)
    ctx.add_static(p)
    # fita de LED por baixo
    led = Prop('emit_ledshelf', None, pivot=(xw + 0.2, sy - 0.021, zc))
    led.box((0.012, 0.008, zl - 0.06), (xw + 0.2, sy - 0.021, zc), WHITE, bevel=0.001, seg=1)
    ctx.add_emit(led, '#b36bff', 3.5, 0.3)
    ctx.set_mark('desklamp', (xw + 0.2, sy - 0.1, zc))


def _cables(ctx):
    """Cabos pretos saindo da mesa e descendo pela parede até as tomadas."""
    xw = ctx.W['WALL_LEFT_X']
    top = ctx.W['DESK_TOP_Y']
    p = Prop('desk_cables', 'desk', tier=1.2)
    blk = c('black', 1.4)
    mm = ctx.LAYOUT['monitorMain']['center']
    desk_back = ctx.LAYOUT['desk']['center'][0] - ctx.LAYOUT['desk']['size'][0] / 2
    runs = [
        (mm[2], -0.9),                      # monitor horizontal -> tomada
        (-2.62, -3.05),                     # monitor vertical -> tomada
        (ctx.LAYOUT['pcTower'][2], 0.25),   # PC -> tomada
    ]
    for z_from, z_out in runs:
        pts = [
            (desk_back + 0.12, top + 0.004, z_from), (desk_back + 0.02, top + 0.004, z_from),
            (desk_back - 0.03, top - 0.03, z_from), (desk_back - 0.05, top - 0.25, (z_from + z_out) / 2),
            (xw + 0.03, 0.62, z_out + (z_from - z_out) * 0.1), (xw + 0.012, 0.42, z_out),
        ]
        p.tube(pts, 0.006, blk, seg=6)
    # cabo do mouse até atrás do tampo
    mx, my, mz = ctx.get_mark('mouse', (-3.0, top + 0.004, -2.05))
    p.tube([(mx - 0.05, my + 0.01, mz), (mx - 0.2, my + 0.006, mz + 0.02), (mx - 0.5, my + 0.004, mz - 0.1),
            (desk_back + 0.1, my + 0.004, mz - 0.2)], 0.003, blk, seg=5)
    ctx.add_static(p)


# ---------------------------------------------------------------------------------- cadeira


def _chair(ctx):
    cx, cy, cz = ctx.LAYOUT['chair']
    p = Prop('chair_root', None, pivot=(cx, cy, cz), tier=1.3)
    dark, black = c('chair'), c('black')
    seat, acc = c('chair_seat'), c('chair_acc')
    # base de 5 hastes com rodízios
    rug = 0.014
    for k in range(5):
        a = math.radians(90 + 72 * k)
        ca, sa = math.cos(a), math.sin(a)
        p.box((0.3, 0.034, 0.05), (cx + 0.15 * ca, rug + 0.06, cz + 0.15 * sa), black, bevel=0.01, seg=2,
              ry=-math.degrees(a))
        p.cyl(0.028, 0.045, (cx + 0.29 * ca, rug + 0.025, cz + 0.29 * sa), c('darker'), seg=12, bevel=0.005)
        p.cyl(0.018, 0.012, (cx + 0.29 * ca, rug + 0.0, cz + 0.29 * sa), c('metal_dark'), seg=10)
    p.cyl(0.06, 0.07, (cx, rug + 0.1, cz), black, seg=16, bevel=0.01)
    p.cyl(0.032, 0.34, (cx, rug + 0.14, cz), c('metal'), anchor='b', seg=14)
    p.cyl(0.058, 0.2, (cx, rug + 0.24, cz), black, anchor='b', seg=16, r2=0.045, bevel=0.006)
    # assento: base, almofada com bordas laterais em cor de destaque
    sy = 0.5
    p.box((0.5, 0.05, 0.5), (cx, sy, cz), black, bevel=0.015, seg=2)
    p.box((0.5, 0.09, 0.48), (cx - 0.005, sy + 0.07, cz), seat, bevel=0.035, seg=3)
    for s in (-1, 1):
        p.box((0.44, 0.07, 0.07), (cx - 0.02, sy + 0.1, cz + s * 0.2), acc, bevel=0.03, seg=3)
    # encosto alto levemente inclinado, com abas laterais e almofadas
    tilt = -8
    bx = cx + 0.24
    p.box((0.09, 0.62, 0.46), (bx, sy + 0.4, cz), dark, bevel=0.035, seg=3, rz=tilt)
    for s in (-1, 1):
        p.box((0.13, 0.5, 0.075), (bx - 0.02, sy + 0.37, cz + s * 0.2), acc, bevel=0.03, seg=3, rz=tilt)
    p.box((0.06, 0.16, 0.28), (bx + 0.02 + 0.07 * 0.14, sy + 0.78, cz), acc, bevel=0.025, seg=3, rz=tilt)   # encosto de cabeça
    p.box((0.05, 0.12, 0.3), (bx - 0.07, sy + 0.25, cz), acc, bevel=0.022, seg=3, rz=tilt)                 # lombar
    p.box((0.012, 0.42, 0.1), (bx + 0.052, sy + 0.38, cz), acc, bevel=0.004, seg=1, rz=tilt)               # faixa nas costas
    p.box((0.012, 0.1, 0.1), (bx + 0.056 + 0.05 * 0.14, sy + 0.62, cz), c('white'), bevel=0.004, seg=1, rz=tilt, ry=0)
    # braços
    for s in (-1, 1):
        p.box((0.05, 0.2, 0.05), (cx + 0.05, sy + 0.14, cz + s * 0.27), black, bevel=0.01, seg=2)
        p.box((0.3, 0.04, 0.075), (cx + 0.0, sy + 0.255, cz + s * 0.27), dark, bevel=0.016, seg=2)
    ctx.add_live(p)
