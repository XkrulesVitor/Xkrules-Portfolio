"""bake.py — atlas de UV único, bakes (night, day, lightmap), denoise e gravação em WebP.

ASSET_PIPELINE §5: Smart UV Project em todos os nós baked juntos + um único pack (margem 0.003);
bake DIFFUSE para uma imagem float; uma cena auxiliar (Workbench) roda o compositor
Image -> Denoise -> Composite e grava o arquivo pelo render, com a view transform certa.
"""

from __future__ import annotations

import math
import os
import time

import bpy
import numpy as np

import lights
import materials as mt
from ctx import timed


# ------------------------------------------------------------------------------------- UV


def unwrap(ctx):
    """Smart UV Project em todos os nós baked juntos, escala média de ilhas e um único pack."""
    objs = ctx.baked_objects()
    mat = mt.bake_material()
    for o in objs:
        o.data.materials.clear()
        o.data.materials.append(mat)
    view = bpy.context.view_layer
    for o in view.objects:
        o.select_set(False)
    for o in objs:
        o.select_set(True)
    view.objects.active = objs[0]
    ts = bpy.context.scene.tool_settings
    ts.use_uv_select_sync = True
    override = dict(active_object=objs[0], object=objs[0], selected_objects=objs, selected_editable_objects=objs,
                    objects_in_mode_unique_data=objs)
    with bpy.context.temp_override(**override):
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.uv.smart_project(angle_limit=math.radians(66), margin_method='SCALED', island_margin=0.0,
                                 area_weight=0.0, correct_aspect=True, scale_to_bounds=False)
        bpy.ops.uv.average_islands_scale()
        bpy.ops.object.mode_set(mode='OBJECT')

    # densidade de textura por peso (atributo `tier`): escala as ilhas em torno da origem da UV; o pack
    # seguinte reorganiza tudo, então sobreposição momentânea não importa.
    for o in objs:
        me = o.data
        n = len(me.loops)
        if n == 0:
            continue
        attr = me.attributes.get('tier')
        if attr is None:
            continue
        tier = np.empty(len(me.polygons), dtype=np.float32)
        attr.data.foreach_get('value', tier)
        loop_total = np.empty(len(me.polygons), dtype=np.int32)
        me.polygons.foreach_get('loop_total', loop_total)
        per_loop = np.repeat(tier, loop_total)
        uvl = me.uv_layers['UVMap']
        uv = np.empty(n * 2, dtype=np.float32)
        uvl.data.foreach_get('uv', uv)
        uv = uv.reshape(-1, 2) * per_loop[:, None]
        uvl.data.foreach_set('uv', uv.reshape(-1))

    with bpy.context.temp_override(**override):
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.uv.pack_islands(udim_source='CLOSEST_UDIM', rotate=True, rotate_method='ANY', scale=True,
                                merge_overlap=False, margin_method='SCALED', margin=0.003, pin=False,
                                shape_method='CONVEX' if ctx.draft else 'CONCAVE')
        bpy.ops.object.mode_set(mode='OBJECT')
    ts.use_uv_select_sync = False


def uv_stats(ctx) -> dict:
    """Cobertura do atlas (área de UV usada) e densidade média, para o manifest."""
    tot_uv = 0.0
    for o in ctx.baked_objects():
        me = o.data
        uvl = me.uv_layers['UVMap'].data
        for p in me.polygons:
            pts = [uvl[i].uv for i in p.loop_indices]
            a = 0.0
            for i in range(len(pts)):
                j = (i + 1) % len(pts)
                a += pts[i][0] * pts[j][1] - pts[j][0] * pts[i][1]
            tot_uv += abs(a) / 2
    return {'uv_area_used': round(tot_uv, 3)}


# ------------------------------------------------------------------------------------- cycles


def setup_cycles(ctx):
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    cy = sc.cycles
    cy.device = 'CPU'
    cy.samples = ctx.samples
    cy.use_adaptive_sampling = False
    cy.use_denoising = False
    cy.max_bounces = 5
    cy.diffuse_bounces = 4
    cy.glossy_bounces = 0
    cy.transmission_bounces = 0
    cy.volume_bounces = 0
    cy.transparent_max_bounces = 4
    cy.sample_clamp_indirect = 3.0
    cy.sample_clamp_direct = 0.0
    cy.caustics_reflective = False
    cy.caustics_refractive = False
    sc.render.threads_mode = 'AUTO'
    sc.render.bake.margin = 8
    sc.render.bake.margin_type = 'EXTEND'
    sc.render.bake.use_clear = True
    # sem mapeamento de cor durante o bake
    sc.view_settings.view_transform = 'Standard'
    sc.view_settings.look = 'None'


def bake_to_image(ctx, name: str, filter_set: set) -> bpy.types.Image:
    """Bake DIFFUSE de todos os nós baked para uma imagem float do tamanho do atlas."""
    size = ctx.atlas
    old = bpy.data.images.get(f'bake_{name}')
    if old:
        bpy.data.images.remove(old)
    img = bpy.data.images.new(f'bake_{name}', size, size, alpha=False, float_buffer=True)
    img.colorspace_settings.name = 'Linear Rec.709'
    mat = bpy.data.materials['bake_mat']
    node = mat.node_tree.nodes['bake_target']
    node.image = img
    mat.node_tree.nodes.active = node
    objs = ctx.baked_objects()
    view = bpy.context.view_layer
    for o in view.objects:
        o.select_set(False)
    for o in objs:
        o.select_set(True)
    view.objects.active = objs[0]
    t0 = time.time()
    with bpy.context.temp_override(active_object=objs[0], object=objs[0], selected_objects=objs,
                                   selected_editable_objects=objs):
        bpy.ops.object.bake(type='DIFFUSE', pass_filter=filter_set, margin=8, margin_type='EXTEND', use_clear=True)
    print(f'[bake] {name}: {time.time() - t0:.1f} s', flush=True)
    return img


# ------------------------------------------------------------------------------------- saída


def write_via_compositor(img: bpy.types.Image, path: str, size: int, view: str, fmt: str, quality: int = 90,
                         denoise: bool = True, exposure: float = 0.0, exr_depth: str = '32'):
    """Image -> (Denoise) -> Composite numa cena auxiliar Workbench; grava pelo render."""
    aux = bpy.data.scenes.new('aux_write')
    aux.render.engine = 'BLENDER_WORKBENCH'
    aux.render.resolution_x = size
    aux.render.resolution_y = size
    aux.render.resolution_percentage = 100
    aux.render.use_compositing = True
    aux.render.use_sequencer = False
    aux.use_nodes = True
    nt = aux.node_tree
    nt.nodes.clear()
    n_img = nt.nodes.new('CompositorNodeImage')
    n_img.image = img
    n_out = nt.nodes.new('CompositorNodeComposite')
    last = n_img.outputs['Image']
    if denoise:
        n_dn = nt.nodes.new('CompositorNodeDenoise')
        try:
            n_dn.use_hdr = True
        except AttributeError:
            pass
        nt.links.new(last, n_dn.inputs['Image'])
        last = n_dn.outputs['Image']
    nt.links.new(last, n_out.inputs['Image'])
    aux.display_settings.display_device = 'sRGB'
    aux.view_settings.view_transform = view
    aux.view_settings.look = 'None'
    aux.view_settings.exposure = exposure
    aux.view_settings.gamma = 1.0
    rs = aux.render.image_settings
    rs.file_format = fmt
    rs.color_mode = 'RGB'
    if fmt == 'WEBP':
        rs.quality = quality
        rs.color_depth = '8'
    elif fmt == 'OPEN_EXR':
        rs.color_depth = exr_depth
        rs.exr_codec = 'ZIP'
    rs.color_management = 'FOLLOW_SCENE'
    aux.render.filepath = path
    aux.render.use_file_extension = False
    bpy.ops.render.render(write_still=True, scene=aux.name)
    bpy.data.scenes.remove(aux)


def _read_exr(path: str, size: int) -> np.ndarray:
    im = bpy.data.images.load(path, check_existing=False)
    im.colorspace_settings.name = 'Linear Rec.709'
    arr = np.empty(size * size * 4, dtype=np.float32)
    im.pixels.foreach_get(arr)
    bpy.data.images.remove(im)
    return arr.reshape(-1, 4)


def stats(arr: np.ndarray) -> dict:
    rgb = arr[:, :3]
    lum = rgb @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    nz = lum[lum > 1e-5]
    if nz.size == 0:
        return {'mean': 0, 'p50': 0, 'p95': 0, 'p99': 0, 'max': 0}
    return {'mean': float(nz.mean()), 'p50': float(np.percentile(nz, 50)), 'p95': float(np.percentile(nz, 95)),
            'p99': float(np.percentile(nz, 99)), 'max': float(nz.max())}


def bake_color_pass(ctx, which: str, exposure: float) -> dict:
    """night ou day: bake com cor + luz, denoise e gravação com AgX."""
    lights.rig(ctx, which)
    with timed(ctx, f'bake_{which}'):
        img = bake_to_image(ctx, which, {'DIRECT', 'INDIRECT', 'COLOR'})
    arr = np.empty(ctx.atlas * ctx.atlas * 4, dtype=np.float32)
    img.pixels.foreach_get(arr)
    st = stats(arr.reshape(-1, 4))
    os.makedirs(ctx.out, exist_ok=True)
    out = os.path.join(ctx.out, f'baked-{which}.webp')
    with timed(ctx, f'write_{which}'):
        write_via_compositor(img, out, ctx.atlas, 'AgX', 'WEBP', 90, True, exposure)
    # cópia float para depuração e reuso entre etapas
    return st


def bake_lightmap(ctx) -> dict:
    """Lightmap RGB: materiais brancos, só as 3 luzes de zona (R=TV, G=mesa, B=PC), sem cor."""
    lights.rig(ctx, 'light')
    with timed(ctx, 'bake_lightmap'):
        img = bake_to_image(ctx, 'light', {'DIRECT', 'INDIRECT'})
    tmp = os.path.join(ctx.out, 'lightmap_dn.exr')
    with timed(ctx, 'write_lightmap'):
        # 1) denoise, float
        write_via_compositor(img, tmp, ctx.atlas, 'Raw', 'OPEN_EXR', denoise=True)
        arr = _read_exr(tmp, ctx.atlas)
        rgb = arr[:, :3].copy()
        gains = []
        for c in range(3):
            v = rgb[:, c]
            m = float(v.max())
            if m <= 1e-6:
                gains.append(1.0)
                continue
            sel = v[v > 0.05 * m]
            p = float(np.percentile(sel, 99)) if sel.size else m
            g = 1.0 / max(p, 1e-6)
            gains.append(g)
            rgb[:, c] = np.clip(v * g, 0.0, 1.0)
        arr[:, :3] = rgb
        norm = bpy.data.images.new('lightmap_norm', ctx.atlas, ctx.atlas, alpha=False, float_buffer=True)
        norm.colorspace_settings.name = 'Linear Rec.709'
        norm.pixels.foreach_set(arr.reshape(-1))
        norm.update()
        out = os.path.join(ctx.out, 'lightmap.webp')
        # 2) gravação sem perdas, Raw (valores lineares intactos)
        write_via_compositor(norm, out, ctx.atlas, 'Raw', 'WEBP', 100, False, 0.0)
    try:
        os.remove(tmp)
    except OSError:
        pass
    return {'gains': [round(g, 4) for g in gains], 'channel_p99_raw': [round(1.0 / g, 5) for g in gains]}
