"""lights.py — rigs de luz: noturno, diurno e o do lightmap (R/G/B).

As três luzes de zona (TV, mesa, PC) ficam DESLIGADAS nos bakes night e day: elas entram só pelo
lightmap, somadas no shader do runtime (ASSET_PIPELINE §5). Todas as luzes ficam na cena com o
nome `lt_*` e a propriedade `rigs` (lista dos rigs em que acendem); `rig()` liga e desliga.
"""

from __future__ import annotations

import math

import bpy
from mathutils import Vector

import kit
import materials as mt
from kit import L, lin

# Parâmetros de partida (ajustados olhando os previews). Cores sRGB.
NIGHT = {
    'world_color': '#3a3f8f', 'world_strength': 0.55,
    'moon_color': '#9fb2ff', 'moon_strength': 3.0,
    'city_color': '#7c8cff', 'city_energy': 220.0,
    'exposure': 0.0,
}
DAY = {
    'world_color': '#cfe2ff', 'world_strength': 1.1,
    'sun_color': '#ffe2b8', 'sun_strength': 7.0,
    'exposure': 0.0,
}

# Janela na parede esquerda (x = WALL_LEFT_X): centro, largura (z) e altura (y).
WINDOW = {'z': 1.75, 'w': 1.5, 'y0': 1.0, 'y1': 2.3}


def _dir_blender(d) -> Vector:
    return (kit.M_L2B.to_3x3() @ Vector(d)).normalized()


def _orient(obj, direction_layout):
    """Aponta o eixo -Z local (direção de emissão) para `direction_layout`."""
    obj.rotation_euler = _dir_blender(direction_layout).to_track_quat('-Z', 'Y').to_euler()


def _link(obj):
    bpy.context.scene.collection.objects.link(obj)
    return obj


def area(name, pos, direction, size, energy, color='#ffffff', rigs=(), spread=None, pure=None):
    d = bpy.data.lights.new(name, 'AREA')
    d.shape = 'RECTANGLE'
    d.size, d.size_y = size
    d.energy = energy
    d.color = pure if pure is not None else lin(color)[:3]
    if spread is not None:
        d.spread = math.radians(spread)
    obj = bpy.data.objects.new(name, d)
    obj.location = L(pos)
    _orient(obj, direction)
    obj['rigs'] = ','.join(rigs)
    obj['energy'] = float(energy)
    return _link(obj)


def point(name, pos, energy, color='#ffffff', radius=0.05, rigs=(), pure=None):
    d = bpy.data.lights.new(name, 'POINT')
    d.energy = energy
    d.shadow_soft_size = radius
    d.color = pure if pure is not None else lin(color)[:3]
    obj = bpy.data.objects.new(name, d)
    obj.location = L(pos)
    obj['rigs'] = ','.join(rigs)
    obj['energy'] = float(energy)
    return _link(obj)


def sun(name, direction, strength, color, angle_deg=2.0, rigs=()):
    d = bpy.data.lights.new(name, 'SUN')
    d.energy = strength
    d.angle = math.radians(angle_deg)
    d.color = lin(color)[:3]
    obj = bpy.data.objects.new(name, d)
    _orient(obj, direction)
    obj['rigs'] = ','.join(rigs)
    obj['energy'] = float(strength)
    return _link(obj)


def build_lights(ctx):
    """Cria todas as luzes (uma vez). Posições derivadas do layout.json e das marcas das props."""
    lay = ctx.LAYOUT
    wl = ctx.W['WALL_LEFT_X']
    zw, ww = WINDOW['z'], WINDOW['w']
    ym = (WINDOW['y0'] + WINDOW['y1']) / 2

    # ---- noite: lua pela janela + brilho da cidade + abajur
    sun('lt_moon', (0.82, -0.52, 0.18), NIGHT['moon_strength'], NIGHT['moon_color'], 2.5, rigs=('night',))
    area('lt_city', (wl - 1.0, ym, zw), (1, 0, 0), (ww, 1.2), NIGHT['city_energy'], NIGHT['city_color'],
         rigs=('night',), spread=140)
    bl = ctx.get_mark('bedlamp', (3.9, 0.82, 1.1))
    point('lt_bedlamp', bl, 70.0, '#ffb066', 0.07, rigs=('night',))

    # ---- dia: sol quente entrando pela janela
    sun('lt_sun', (0.78, -0.55, 0.12), DAY['sun_strength'], DAY['sun_color'], 1.2, rigs=('day',))

    # ---- lightmap: R = TV, G = mesa, B = PC (cores puras)
    tv = lay['tv']['center']
    tw, th = lay['tv']['size']
    area('lt_tv_front', (tv[0], tv[1], tv[2] + 0.08), (0, 0, 1), (tw * 0.95, th * 0.95), 900.0, rigs=('light',),
         pure=(1, 0, 0))
    wall_z = ctx.W['WALL_BACK_Z']
    # halo da fita de LED atrás da TV: quatro faixas voltadas para a parede
    for nm, (px, py, sx, sy) in {
        'top': (tv[0], tv[1] + th / 2 + 0.02, tw + 0.1, 0.04),
        'bot': (tv[0], tv[1] - th / 2 - 0.02, tw + 0.1, 0.04),
        'lef': (tv[0] - tw / 2 - 0.02, tv[1], 0.04, th + 0.1),
        'rig': (tv[0] + tw / 2 + 0.02, tv[1], 0.04, th + 0.1),
    }.items():
        area(f'lt_tv_halo_{nm}', (px, py, wall_z + 0.03), (0, 0, -1), (sx, sy), 90.0, rigs=('light',),
             pure=(1, 0, 0), spread=180)

    mm = lay['monitorMain']['center']
    mv = lay['monitorVertical']['center']
    ms = lay['monitorMain']['size']
    vs = lay['monitorVertical']['size']
    area('lt_desk_main', (mm[0] + 0.05, mm[1], mm[2]), (1, 0, 0), (ms[0], ms[1]), 330.0, rigs=('light',),
         pure=(0, 1, 0))
    area('lt_desk_vert', (mv[0] + 0.05, mv[1], mv[2]), (1, 0, 0), (vs[0], vs[1]), 200.0, rigs=('light',),
         pure=(0, 1, 0))
    lb = ctx.get_mark('lightbar', (mm[0] + 0.0, mm[1] + 0.42, mm[2]))
    area('lt_desk_bar', lb, (0.5, -1, 0), (0.45, 0.05), 120.0, rigs=('light',), pure=(0, 1, 0))
    lamp = ctx.get_mark('desklamp', (-3.78, 1.25, -3.12))
    point('lt_desk_lamp', lamp, 160.0, rigs=('light',), radius=0.06, pure=(0, 1, 0))

    px, py, pz = lay['pcTower']
    area('lt_pc_glass', (px, py + 0.31, pz + 0.17), (0, 0, 1), (0.46, 0.52), 260.0, rigs=('light',), pure=(0, 0, 1))
    area('lt_pc_front', (px + 0.30, py + 0.36, pz), (1, 0, 0), (0.05, 0.3), 80.0, rigs=('light',), pure=(0, 0, 1))


def rig(ctx, name: str):
    """Liga o rig `name` ('night' | 'day' | 'light') e desliga os outros."""
    sc = bpy.context.scene
    for o in bpy.data.objects:
        if o.type == 'LIGHT':
            o.hide_render = name not in o.get('rigs', '').split(',')
    # emissivos
    for o in bpy.data.objects:
        if o.type != 'MESH':
            continue
        cat = o.get('cat')
        if cat in ('emit', 'screen'):
            k = {'night': o.get('emit_night', 1.0), 'day': o.get('emit_day', 0.0), 'light': 0.0}[name]
            mt.set_emission(o, float(k))
        if cat in ('glass', 'fx'):
            o.hide_render = True
    # mundo
    world = sc.world
    if world is None:
        world = bpy.data.worlds.new('bake_world')
        sc.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get('Background')
    if name == 'night':
        bg.inputs['Color'].default_value = lin(NIGHT['world_color'])
        bg.inputs['Strength'].default_value = NIGHT['world_strength']
    elif name == 'day':
        bg.inputs['Color'].default_value = lin(DAY['world_color'])
        bg.inputs['Strength'].default_value = DAY['world_strength']
    else:
        bg.inputs['Color'].default_value = (0, 0, 0, 1)
        bg.inputs['Strength'].default_value = 0.0
    mt.set_use_color(name != 'light')
