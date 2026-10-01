"""kit.py — primitivas chanfradas em coordenadas do LAYOUT (Y-up, metros).

Todo o código de cena escreve posições como no `layout.ts`: (x, y, z) com +Y para cima. A conversão
para o Blender (Z-up) acontece uma vez só, em `Prop.finish()`: (x, y, z) -> (x, -z, y). O exportador
glTF com "+Y up" desfaz essa conversão, então o glb sai com os mesmos números do layout.

Uma `Prop` acumula geometria (várias primitivas) num único bmesh e vira UM objeto. Cada primitiva
é criada num bmesh temporário (cubo, bevel, corte de faces escondidas), transformada e copiada com
cor por loop (atributo `col`, linear) e peso de densidade de textura por face (atributo `tier`).
"""

from __future__ import annotations

import math
import random
import zlib

import bmesh
import bpy
from mathutils import Matrix, Vector

# layout (x, y, z) Y-up  ->  Blender (x, -z, y) Z-up. Rotação própria (det = +1): não inverte faces.
M_L2B = Matrix(((1, 0, 0, 0), (0, 0, -1, 0), (0, 1, 0, 0), (0, 0, 0, 1)))

# Planos de contato (face interna das paredes e piso). Preenchidos por main.py a partir do layout.json.
PLANES = {'wall_left_x': -4.18, 'wall_back_z': -3.38, 'floor_y': 0.0}


def L(x, y=None, z=None) -> Vector:
    """Ponto do layout (x, y, z) -> Vector no espaço do Blender."""
    if y is None:
        x, y, z = x
    return Vector((x, -z, y))


def srgb_to_lin(c: float) -> float:
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def lin(hexstr: str, k: float = 1.0) -> tuple[float, float, float, float]:
    """'#rrggbb' (sRGB) -> (r, g, b, 1) linear, opcionalmente multiplicado por k."""
    h = hexstr.lstrip('#')
    r, g, b = (int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4))
    return (srgb_to_lin(r) * k, srgb_to_lin(g) * k, srgb_to_lin(b) * k, 1.0)


_RNG = random.Random(1234)


def rng(seed: int | None = None) -> random.Random:
    return random.Random(seed) if seed is not None else _RNG


def _rot(rx=0.0, ry=0.0, rz=0.0, order='yxz') -> Matrix:
    """Rotação no espaço do layout, em graus. `order` = ordem de composição da esquerda para a direita
    (padrão 'yxz': o giro vertical Y é o último a ser aplicado aos vértices)."""
    ang = {'x': rx, 'y': ry, 'z': rz}
    m = Matrix.Identity(4)
    for ch in order:
        m = m @ Matrix.Rotation(math.radians(ang[ch]), 4, ch.upper())
    return m


class Prop:
    """Um objeto do quarto: várias primitivas num mesmo mesh. Coordenadas no espaço do layout."""

    def __init__(self, name: str, zone: str | None = 'room', tier: float = 1.0, pivot=None, jitter: float = 0.0,
                 seed: int | None = None):
        self.name = name
        self.zone = zone
        self.pivot = Vector(pivot) if pivot is not None else None
        self.tier = tier
        self.jitter = jitter
        self.bm = bmesh.new()
        self.col = self.bm.loops.layers.float_color.new('col')
        self.tier_layer = self.bm.faces.layers.float.new('tier')
        self.rng = random.Random(seed if seed is not None else zlib.crc32(name.encode()))
        self.children: list[Prop] = []

    # ------------------------------------------------------------------ núcleo

    def _merge(self, t: bmesh.types.BMesh, color, tier: float | None, flat=None):
        """Copia o bmesh temporário `t` (já no espaço do layout) para o bmesh da prop.
        `flat` = índices de faces com sombreamento plano (faces grandes e planas, tampas): evita o
        artefato de terminador (manchas escuras) que a normal suave de uma face grande causa no bake."""
        t.faces.index_update()
        flat = flat if flat is not None else {f.index for f in t.faces if len(f.verts) > 4}
        bm = self.bm
        if self.jitter:
            k = 1.0 + self.rng.uniform(-self.jitter, self.jitter)
            color = (color[0] * k, color[1] * k, color[2] * k, 1.0)
        tv = tier if tier is not None else self.tier
        # Normais suaves, com arestas duras acima de ~40 graus (bevel fica redondo, quina fica viva).
        for e in t.edges:
            e.smooth = len(e.link_faces) == 2 and e.calc_face_angle(0.0) < math.radians(40)
        t.verts.index_update()
        vm = [bm.verts.new(v.co) for v in t.verts]
        for f in t.faces:
            try:
                nf = bm.faces.new([vm[v.index] for v in f.verts])
            except ValueError:
                continue
            nf.smooth = f.index not in flat
            nf[self.tier_layer] = tv
            for lp in nf.loops:
                lp[self.col] = color
        for e in t.edges:
            ne = bm.edges.get((vm[e.verts[0].index], vm[e.verts[1].index]))
            if ne is not None:
                ne.smooth = e.smooth
        t.free()

    @staticmethod
    def _cull(t: bmesh.types.BMesh, hide, half):
        """Apaga a face plana principal de cada direção em `hide` ('-y', '+z'...), antes de girar."""
        if not hide:
            return
        axes = {'x': 0, 'y': 1, 'z': 2}
        kill = []
        for h in hide:
            sign = -1.0 if h[0] == '-' else 1.0
            ax = axes[h[1]]
            for f in t.faces:
                if f.normal[ax] * sign > 0.999 and abs(f.calc_center_median()[ax] - sign * half[ax]) < 1e-4:
                    kill.append(f)
        if kill:
            bmesh.ops.delete(t, geom=list(set(kill)), context='FACES')

    def _place(self, t, at, rx, ry, rz, order='yxz'):
        m = Matrix.Translation(Vector(at)) @ _rot(rx, ry, rz, order)
        bmesh.ops.transform(t, matrix=m, verts=t.verts)

    # --------------------------------------------------------------- primitivas

    def box(self, size, at, color, bevel=0.012, seg=2, rx=0.0, ry=0.0, rz=0.0, anchor='c', hide=(), tier=None,
            order='yxz', keep=None):
        """Caixa chanfrada. `size`=(sx, sy, sz) nos eixos do layout; `at` = centro (ou base, com anchor='b').
        Com anchor='b' a base não aparece (apoiada em algo) e é apagada. `keep='+y'` (ou '-x', '+z'...) mantém só
        a face dessa direção e o chanfro ao redor: placas finas, tábuas, tapetes, teclas. Economiza atlas."""
        sx, sy, sz = size
        if anchor == 'b' and '-y' not in hide:
            hide = tuple(hide) + ('-y',)
        t = bmesh.new()
        bmesh.ops.create_cube(t, size=1.0)
        bmesh.ops.scale(t, vec=(sx, sy, sz), verts=t.verts)
        b = min(bevel, 0.45 * min(sx, sy, sz))
        if b > 2e-4:
            bmesh.ops.bevel(t, geom=list(t.edges), offset=b, segments=seg, profile=0.5, affect='EDGES',
                            clamp_overlap=True)
        self._cull(t, hide, (sx / 2, sy / 2, sz / 2))
        if keep:
            axis = {'x': 0, 'y': 1, 'z': 2}[keep[1]]
            sgn = 1.0 if keep[0] == '+' else -1.0
            drop = [f for f in t.faces if f.normal[axis] * sgn < 0.5]
            if drop:
                bmesh.ops.delete(t, geom=drop, context='FACES')
        t.faces.index_update()
        flat = {f.index for f in t.faces if max(abs(f.normal.x), abs(f.normal.y), abs(f.normal.z)) > 0.9999}
        if anchor == 'b':
            bmesh.ops.translate(t, vec=(0, sy / 2, 0), verts=t.verts)
        elif anchor == 't':
            bmesh.ops.translate(t, vec=(0, -sy / 2, 0), verts=t.verts)
        self._place(t, at, rx, ry, rz, order)
        self._merge(t, color, tier, flat)
        return self

    def cyl(self, r, h, at, color, axis='y', seg=20, r2=None, bevel=0.0, bseg=2, rx=0.0, ry=0.0, rz=0.0,
            anchor='c', caps=True, tier=None, order='yxz'):
        """Cilindro ou tronco de cone (r2 = raio do topo). `axis`: eixo do layout em que ele está de pé."""
        t = bmesh.new()
        bmesh.ops.create_cone(t, cap_ends=caps, cap_tris=False, segments=seg, radius1=r,
                              radius2=r if r2 is None else r2, depth=h)
        if bevel > 2e-4 and caps:
            rim = [e for e in t.edges if len(e.link_faces) == 2 and e.calc_face_angle(0.0) > math.radians(60)]
            b = min(bevel, 0.45 * min(r if r2 is None else max(r, r2), h))
            bmesh.ops.bevel(t, geom=rim, offset=b, segments=bseg, profile=0.5, affect='EDGES', clamp_overlap=True)
        # create_cone alinha ao eixo Z do Blender: levar para o eixo pedido (no espaço do layout).
        if axis == 'y':
            align = Matrix.Rotation(-math.pi / 2, 4, 'X')
        elif axis == 'x':
            align = Matrix.Rotation(math.pi / 2, 4, 'Y')
        else:
            align = Matrix.Identity(4)
        bmesh.ops.transform(t, matrix=align, verts=t.verts)
        if anchor == 'b' and caps:
            axv = {'x': (-1, 0, 0), 'y': (0, -1, 0), 'z': (0, 0, -1)}[axis]
            drop = [f for f in t.faces if len(f.verts) > 4 and f.normal.dot(axv) > 0.99]
            if drop:
                bmesh.ops.delete(t, geom=drop, context='FACES')
        off = {'c': 0.0, 'b': h / 2, 't': -h / 2}[anchor]
        if off:
            d = {'x': (off, 0, 0), 'y': (0, off, 0), 'z': (0, 0, off)}[axis]
            bmesh.ops.translate(t, vec=d, verts=t.verts)
        self._place(t, at, rx, ry, rz, order)
        self._merge(t, color, tier)
        return self

    def ring(self, r_out, r_in, h, at, color, axis='z', seg=24, rx=0.0, ry=0.0, rz=0.0, tier=None, order='yxz'):
        """Anel (aro de ventoinha, argola): cilindro vazado com `h` de altura ao longo de `axis`."""
        t = bmesh.new()
        ho = h / 2
        ring_o_t, ring_o_b, ring_i_t, ring_i_b = [], [], [], []
        for k in range(seg):
            a = 2 * math.pi * k / seg
            c, s_ = math.cos(a), math.sin(a)
            ring_o_t.append(t.verts.new((r_out * c, r_out * s_, ho)))
            ring_o_b.append(t.verts.new((r_out * c, r_out * s_, -ho)))
            ring_i_t.append(t.verts.new((r_in * c, r_in * s_, ho)))
            ring_i_b.append(t.verts.new((r_in * c, r_in * s_, -ho)))
        for k in range(seg):
            j = (k + 1) % seg
            t.faces.new((ring_o_b[k], ring_o_b[j], ring_o_t[j], ring_o_t[k]))      # fora
            t.faces.new((ring_i_t[k], ring_i_t[j], ring_i_b[j], ring_i_b[k]))      # dentro
            t.faces.new((ring_o_t[k], ring_o_t[j], ring_i_t[j], ring_i_t[k]))      # topo
            t.faces.new((ring_i_b[k], ring_i_b[j], ring_o_b[j], ring_o_b[k]))      # base
        bmesh.ops.recalc_face_normals(t, faces=t.faces)
        if axis == 'y':
            bmesh.ops.transform(t, matrix=Matrix.Rotation(-math.pi / 2, 4, 'X'), verts=t.verts)
        elif axis == 'x':
            bmesh.ops.transform(t, matrix=Matrix.Rotation(math.pi / 2, 4, 'Y'), verts=t.verts)
        self._place(t, at, rx, ry, rz, order)
        self._merge(t, color, tier)
        return self

    def blob(self, radii, at, color, seg=10, rings=7, rx=0.0, ry=0.0, rz=0.0, tier=None, order='yxz'):
        """Elipsoide (folhas, almofadas redondas, terra de vaso). `radii` = (rx, ry, rz) do layout."""
        t = bmesh.new()
        bmesh.ops.create_uvsphere(t, u_segments=seg, v_segments=rings, radius=1.0)
        # a esfera do Blender tem o polo em Z: girar para o polo ficar em Y do layout
        bmesh.ops.transform(t, matrix=Matrix.Rotation(-math.pi / 2, 4, 'X'), verts=t.verts)
        bmesh.ops.scale(t, vec=tuple(radii), verts=t.verts)
        self._place(t, at, rx, ry, rz, order)
        self._merge(t, color, tier)
        return self

    def prism(self, pts_xz, y0, y1, color, bevel=0.0, tier=None):
        """Extrusão vertical de um polígono CONVEXO no plano XZ do layout (de y0 até y1)."""
        t = bmesh.new()
        bot = [t.verts.new((x, y0, z)) for x, z in pts_xz]
        top = [t.verts.new((x, y1, z)) for x, z in pts_xz]
        n = len(bot)
        t.faces.new(list(reversed(bot)))
        t.faces.new(top)
        for i in range(n):
            j = (i + 1) % n
            t.faces.new((bot[i], bot[j], top[j], top[i]))
        bmesh.ops.recalc_face_normals(t, faces=t.faces)
        if bevel > 2e-4:
            bmesh.ops.bevel(t, geom=list(t.edges), offset=min(bevel, 0.45 * abs(y1 - y0)), segments=2,
                            profile=0.5, affect='EDGES', clamp_overlap=True)
        t.faces.index_update()
        self._merge(t, color, tier, {f.index for f in t.faces if max(abs(f.normal.x), abs(f.normal.y), abs(f.normal.z)) > 0.9999})
        return self

    def quad(self, p0, p1, p2, p3, color, tier=None):
        """Quadrilátero solto (pontos do layout, sentido anti-horário visto de fora)."""
        t = bmesh.new()
        vs = [t.verts.new(Vector(p)) for p in (p0, p1, p2, p3)]
        t.faces.new(vs)
        t.faces.index_update()
        self._merge(t, color, tier, {0})
        return self

    def tube(self, pts, radius, color, seg=6, cap=True, tier=None):
        """Cabo: varre um círculo ao longo de uma polilinha (pontos do layout)."""
        pts = [Vector(p) for p in pts]
        t = bmesh.new()
        rings = []
        for i, p in enumerate(pts):
            if i == 0:
                d = pts[1] - p
            elif i == len(pts) - 1:
                d = p - pts[i - 1]
            else:
                d = pts[i + 1] - pts[i - 1]
            d.normalize()
            up = Vector((0, 1, 0)) if abs(d.y) < 0.95 else Vector((1, 0, 0))
            a = d.cross(up).normalized()
            b = d.cross(a).normalized()
            ring = []
            for k in range(seg):
                ang = 2 * math.pi * k / seg
                ring.append(t.verts.new(p + a * (math.cos(ang) * radius) + b * (math.sin(ang) * radius)))
            rings.append(ring)
        for i in range(len(rings) - 1):
            for k in range(seg):
                k2 = (k + 1) % seg
                t.faces.new((rings[i][k], rings[i][k2], rings[i + 1][k2], rings[i + 1][k]))
        if cap:
            t.faces.new(list(reversed(rings[0])))
            t.faces.new(rings[-1])
        bmesh.ops.recalc_face_normals(t, faces=t.faces)
        self._merge(t, color, tier)
        return self

    def merge_prop(self, other: 'Prop'):
        """Anexa a geometria de outra Prop (mesmo espaço do layout) a esta."""
        mesh = bpy.data.meshes.new('_tmp_merge')
        other.bm.to_mesh(mesh)
        self.bm.from_mesh(mesh)
        bpy.data.meshes.remove(mesh)
        other.bm.free()

    # ------------------------------------------------------------------ saída

    def _cull_contact(self):
        """Apaga faces que nunca aparecem: base apoiada no piso e costas coladas nas paredes."""
        bm = self.bm
        kill = []
        eps = 0.004
        for f in bm.faces:
            n = f.normal
            c = f.calc_center_median()
            if n.y < -0.99 and abs(c.y - PLANES['floor_y']) < eps:
                kill.append(f)
            elif n.z < -0.99 and abs(c.z - PLANES['wall_back_z']) < eps:
                kill.append(f)
            elif n.x < -0.99 and abs(c.x - PLANES['wall_left_x']) < eps:
                kill.append(f)
        if kill:
            bmesh.ops.delete(bm, geom=kill, context='FACES')

    def finish(self, cull=True) -> bpy.types.Object:
        """Fecha a prop: corta faces escondidas, converte para o Blender e cria o objeto."""
        bm = self.bm
        if cull:
            self._cull_contact()
        pivot = self.pivot if self.pivot is not None else Vector((0, 0, 0))
        if self.pivot is not None:
            bmesh.ops.translate(bm, vec=-pivot, verts=bm.verts)
        bmesh.ops.transform(bm, matrix=M_L2B, verts=bm.verts)
        mesh = bpy.data.meshes.new(self.name)
        bm.to_mesh(mesh)
        bm.free()
        mesh.uv_layers.new(name='UVMap')
        obj = bpy.data.objects.new(self.name, mesh)
        obj.location = L(pivot)
        bpy.context.scene.collection.objects.link(obj)
        if self.zone:
            obj['zone'] = self.zone
        return obj


# ------------------------------------------------------------------ utilidades de cena


def join(objs, name, zone=None, origin=(0, 0, 0)) -> bpy.types.Object:
    """Une `objs` num único mesh `name` com a origem no ponto do layout `origin` (padrão: origem do mundo)."""
    objs = [o for o in objs if o is not None]
    assert objs, f'join({name}): lista vazia'
    for o in bpy.context.view_layer.objects:
        o.select_set(False)
    for o in objs:
        o.select_set(True)
    active = objs[0]
    bpy.context.view_layer.objects.active = active
    if len(objs) > 1:
        with bpy.context.temp_override(active_object=active, selected_objects=objs, selected_editable_objects=objs,
                                       object=active):
            bpy.ops.object.join()
    active.name = name
    active.data.name = name
    if zone:
        active['zone'] = zone
    return active


def set_origin_world_zero(obj):
    """Garante origem em (0,0,0) com rotação e escala neutras (nós `zone_*`)."""
    obj.location = (0, 0, 0)
    obj.rotation_euler = (0, 0, 0)
    obj.scale = (1, 1, 1)


def parent_keep(child: bpy.types.Object, parent: bpy.types.Object):
    """Faz `child` filho de `parent` sem mover o filho no mundo."""
    bpy.context.view_layer.update()          # matrix_world do pai precisa estar atualizada
    child.parent = parent
    child.matrix_parent_inverse = parent.matrix_world.inverted()


def tri_count(obj) -> int:
    me = obj.data
    me.calc_loop_triangles()
    return len(me.loop_triangles)


def world_bbox_layout(obj):
    """Bounding box no mundo, devolvida no espaço do layout (Y-up): (min, max)."""
    pts = [obj.matrix_world @ Vector(c) for c in obj.bound_box]
    lay = [(p.x, p.z, -p.y) for p in pts]
    mn = [min(p[i] for p in lay) for i in range(3)]
    mx = [max(p[i] for p in lay) for i in range(3)]
    return mn, mx
