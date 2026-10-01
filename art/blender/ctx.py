"""ctx.py — contexto compartilhado entre as etapas (layout, registro de nós, criadores por categoria).

Categorias de nó (ASSET_PIPELINE §3), gravadas em `obj['cat']`:
  zone   estático de uma zona; é unido em `zone_<zona>` antes do bake
  baked  nó vivo (cadeira, impressora, caixas, ponteiros): UM mesh, pivô próprio, entra no atlas
  screen telas (UV 0..1 próprias, fora do atlas)
  emit   emissivos (emit_*, led_*, pc_*, tv_backlight): iluminam o bake, fora do atlas
  glass  vidros (fora do atlas, escondidos no bake)
  fx     planos de efeito (fumaça), escondidos no bake
"""

from __future__ import annotations

import json
import math
import os
import time

import bmesh
import bpy
from mathutils import Vector

import kit
import materials as mt
from kit import Prop, L, lin

ZONES = ('room', 'desk', 'games', 'maker', 'bed')


class Ctx:
    def __init__(self, args):
        self.args = args
        self.out = os.path.abspath(args.out)
        self.layout_path = os.path.abspath(args.layout)
        with open(self.layout_path, encoding='utf-8') as f:
            self.lay = json.load(f)
        self.LAYOUT = self.lay['layout']
        self.W = self.lay['walls']
        self.ROOM = self.lay['room']
        kit.PLANES['wall_left_x'] = self.W['WALL_LEFT_X']
        kit.PLANES['wall_back_z'] = self.W['WALL_BACK_Z']
        self.draft = args.quality == 'draft'
        self.atlas = 1024 if self.draft else 2048
        self.samples = 16 if self.draft else 160
        self.zone_objs: dict[str, list[bpy.types.Object]] = {z: [] for z in ZONES}
        self.props_log: list[dict] = []
        self.timings: dict[str, float] = {}

    # ------------------------------------------------------------ registro

    def _log(self, obj, cat, prop: Prop | None = None):
        obj['cat'] = cat
        self.props_log.append({'name': obj.name, 'cat': cat, 'zone': obj.get('zone', '')})

    def add_static(self, prop: Prop) -> bpy.types.Object:
        """Prop estática: entra na lista da zona e é unida depois."""
        obj = prop.finish()
        zone = prop.zone or 'room'
        self.zone_objs[zone].append(obj)
        self._log(obj, 'zone')
        return obj

    def add_live(self, prop: Prop, parent=None) -> bpy.types.Object:
        """Nó vivo baked: mesh próprio, pivô em `prop.pivot`, entra no atlas."""
        prop.zone = None
        obj = prop.finish()
        if parent is not None:
            kit.parent_keep(obj, parent)
        obj['zone'] = ''
        self._log(obj, 'baked')
        return obj

    def add_emit(self, prop: Prop, color: str, night: float, day: float, cat: str = 'emit',
                 light_pass: float = 0.0) -> bpy.types.Object:
        """Emissivo: ilumina o bake (força por rig) e vai ao glb com material de emissão."""
        prop.zone = None
        obj = prop.finish(cull=False)
        mat = mt.emissive_material(f'mat_{obj.name}', color, 1.0)
        obj.data.materials.append(mat)
        obj['emit_color'] = color
        obj['emit_night'] = float(night)
        obj['emit_day'] = float(day)
        self._log(obj, cat)
        return obj

    def add_glass(self, prop: Prop, color='#0c1230', alpha=0.3) -> bpy.types.Object:
        prop.zone = None
        obj = prop.finish(cull=False)
        obj.data.materials.append(mt.glass_material(f'mat_{obj.name}', color, alpha))
        obj['glass_color'] = color
        obj['glass_alpha'] = alpha
        self._log(obj, 'glass')
        return obj

    def add_fx(self, prop: Prop, color='#ffffff') -> bpy.types.Object:
        prop.zone = None
        obj = prop.finish(cull=False)
        obj.data.materials.append(mt.emissive_material(f'mat_{obj.name}', color, 0.0))
        self._log(obj, 'fx')
        return obj

    def add_screen(self, name: str, center, normal, size, up=(0, 1, 0), night=1.0, day=0.15,
                   color='#9fc2ff') -> bpy.types.Object:
        """Plano com UV 0..1. `normal` aponta para fora; u cresce para a DIREITA de quem olha a tela."""
        c = Vector(center)
        n = Vector(normal).normalized()
        upv = Vector(up).normalized()
        right = upv.cross(n).normalized()       # direita de quem olha de frente para a tela
        hw, hh = size[0] / 2, size[1] / 2
        t = bmesh.new()
        # (-,-) (+,-) (+,+) (-,+) em (direita, cima): anti-horário visto de quem olha
        pts = [-right * hw - upv * hh, right * hw - upv * hh, right * hw + upv * hh, -right * hw + upv * hh]
        vs = [t.verts.new(p) for p in pts]
        t.faces.new(vs)
        bmesh.ops.recalc_face_normals(t, faces=t.faces)
        f = t.faces[0]
        if f.normal.dot(n) < 0:
            f.normal_flip()
        uvl = t.loops.layers.uv.new('UVMap')
        for lp, uv in zip(f.loops, ((0, 0), (1, 0), (1, 1), (0, 1))):
            lp[uvl].uv = uv
        bmesh.ops.transform(t, matrix=kit.M_L2B, verts=t.verts)
        mesh = bpy.data.meshes.new(name)
        t.to_mesh(mesh)
        t.free()
        obj = bpy.data.objects.new(name, mesh)
        obj.location = L(c)
        bpy.context.scene.collection.objects.link(obj)
        mat = mt.emissive_material(f'mat_{name}', color, 1.0)
        obj.data.materials.append(mat)
        obj['emit_color'] = color
        obj['emit_night'] = float(night)
        obj['emit_day'] = float(day)
        obj['size'] = [float(size[0]), float(size[1])]
        self._log(obj, 'screen')
        return obj

    # ------------------------------------------------------------- consulta

    def objects(self, cat: str | None = None):
        return [o for o in bpy.data.objects if o.type == 'MESH' and (cat is None or o.get('cat') == cat)]

    def baked_objects(self):
        return [o for o in bpy.data.objects if o.type == 'MESH' and o.get('cat') in ('zone', 'baked')]


def timed(ctx: Ctx, key: str):
    class _T:
        def __enter__(self_):
            self_.t0 = time.time()
            return self_

        def __exit__(self_, *a):
            ctx.timings[key] = round(ctx.timings.get(key, 0.0) + time.time() - self_.t0, 1)
            print(f'[tempo] {key}: {ctx.timings[key]} s', flush=True)

    return _T()


# ------------------------------------------------------------------ marcas (posições compartilhadas)
def _set_mark(self, name, pos):
    bpy.context.scene[f'mark_{name}'] = [float(v) for v in pos]
    return tuple(pos)


def _get_mark(self, name, default=None):
    v = bpy.context.scene.get(f'mark_{name}')
    return tuple(v) if v is not None else default


Ctx.set_mark = _set_mark
Ctx.get_mark = _get_mark
