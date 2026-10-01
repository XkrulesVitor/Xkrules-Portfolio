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
import uvlayout
from ctx import timed


# percentil (entre os pixels iluminados) que vira 1.0 no lightmap de cada canal
NORM_PERCENTILE = 99.95
# folga por canal (R, G, B): divide o ganho, então 1.35 deixa a luz da TV 26% mais fraca que a normalização pura
NORM_HEADROOM = (1.35, 1.1, 1.1)
# margem (px) por dilatação própria em volta das ilhas
MARGIN_PX = 8
# joelho: valores abaixo disso viram 0. O blend `lighten` do runtime tinge superfícies escuras mesmo com
# fator minúsculo, então o ruído residual do lightmap longe das luzes vira manchas coloridas.
LIGHTMAP_KNEE = 0.02

# ------------------------------------------------------------------------------------- UV


def unwrap(ctx) -> dict:
    """Atlas único com todos os nós baked (ver uvlayout.py). Todos recebem o material de bake."""
    objs = ctx.baked_objects()
    mat = mt.bake_material()
    for o in objs:
        o.data.materials.clear()
        o.data.materials.append(mat)
    stats = uvlayout.layout(objs, ctx.atlas)
    print(f'[uv] {stats}', flush=True)
    return stats


# ------------------------------------------------------------------------------------- margem própria


def dilate(arr: np.ndarray, mask: np.ndarray, size: int, iters: int = 8) -> np.ndarray:
    """Estende a cor dos pixels assados (mask) para os vizinhos vazios, `iters` pixels para fora.

    O bake do Blender com vários objetos aplica a margem objeto por objeto, e a margem de um objeto
    SOBRESCREVE pixels já assados de outro objeto vizinho no atlas (ilhas pequenas viravam cor de
    outra ilha). Por isso o bake roda com margem 0 e a margem é feita aqui, com a máscara de cobertura
    real (pixels cujo normal foi assado)."""
    a = arr.reshape(size, size, -1).copy()
    m = mask.reshape(size, size).copy()
    for _ in range(iters):
        if m.all():
            break
        acc = np.zeros_like(a)
        cnt = np.zeros((size, size), dtype=np.float32)
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                if dy == 0 and dx == 0:
                    continue
                ys = slice(max(dy, 0), size + min(dy, 0))
                yd = slice(max(-dy, 0), size + min(-dy, 0))
                xs = slice(max(dx, 0), size + min(dx, 0))
                xd = slice(max(-dx, 0), size + min(-dx, 0))
                # vizinho em (y+dy, x+dx) contribui para o pixel (y, x)
                src_m = m[ys, xs]
                acc[yd, xd] += np.where(src_m[..., None], a[ys, xs], 0.0)
                cnt[yd, xd] += src_m
        new = (~m) & (cnt > 0)
        a[new] = acc[new] / cnt[new][:, None]
        m |= new
    return a.reshape(arr.shape)


def _get_pixels(img, size):
    arr = np.empty(size * size * 4, dtype=np.float32)
    img.pixels.foreach_get(arr)
    return arr.reshape(-1, 4)


def _set_pixels(img, arr):
    img.pixels.foreach_set(arr.reshape(-1))
    img.update()


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


def bake_to_image(ctx, name: str, filter_set: set, bounces: int = 4, clamp_indirect: float = 3.0) -> bpy.types.Image:
    """Bake DIFFUSE de todos os nós baked para uma imagem float do tamanho do atlas."""
    size = ctx.atlas
    bpy.context.scene.cycles.diffuse_bounces = bounces
    bpy.context.scene.cycles.sample_clamp_indirect = clamp_indirect
    bpy.context.scene.cycles.max_bounces = bounces + 1
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
        bpy.ops.object.bake(type='DIFFUSE', pass_filter=filter_set, margin=0, use_clear=True)
    print(f'[bake] {name}: {time.time() - t0:.1f} s', flush=True)
    if getattr(ctx, 'bake_mask', None) is not None:
        arr = _get_pixels(img, size)
        arr[:, :3] = dilate(arr[:, :3], ctx.bake_mask, size, MARGIN_PX)
        _set_pixels(img, arr)
    return img


def bake_aux(ctx):
    """Albedo (cor pura) e normal (espaço do objeto = mundo, sem rotação) no mesmo atlas.
    São os guias do Denoise: sem eles o OIDN borra uma ilha na outra e o fundo preto entra nas ilhas
    pequenas (manchas pretas e brancas na cama, no travesseiro)."""
    mt.set_use_color(True)
    size = ctx.atlas
    out = {}
    for name in ('albedo', 'normal'):
        old = bpy.data.images.get(f'bake_{name}')
        if old:
            bpy.data.images.remove(old)
        out[name] = bpy.data.images.new(f'bake_{name}', size, size, alpha=False, float_buffer=True)
        out[name].colorspace_settings.name = 'Non-Color'
    mat = bpy.data.materials['bake_mat']
    node = mat.node_tree.nodes['bake_target']
    objs = ctx.baked_objects()
    view = bpy.context.view_layer
    for o in view.objects:
        o.select_set(False)
    for o in objs:
        o.select_set(True)
    view.objects.active = objs[0]
    ov = dict(active_object=objs[0], object=objs[0], selected_objects=objs, selected_editable_objects=objs)
    t0 = time.time()
    old_samples = bpy.context.scene.cycles.samples
    bpy.context.scene.cycles.samples = 1
    with bpy.context.temp_override(**ov):
        node.image = out['albedo']
        mat.node_tree.nodes.active = node
        bpy.ops.object.bake(type='DIFFUSE', pass_filter={'COLOR'}, margin=0, use_clear=True)
        node.image = out['normal']
        mat.node_tree.nodes.active = node
        bpy.ops.object.bake(type='NORMAL', normal_space='OBJECT', margin=0, use_clear=True,
                            normal_r='POS_X', normal_g='POS_Y', normal_b='POS_Z')
    bpy.context.scene.cycles.samples = old_samples
    # máscara de cobertura: o normal codificado (n + 1) / 2 nunca é (0, 0, 0) onde houve bake
    nrm = _get_pixels(out['normal'], size)
    mask = nrm[:, :3].sum(axis=1) > 1e-6
    ctx.bake_mask = mask
    ctx.bake_coverage = float(mask.mean())
    alb = _get_pixels(out['albedo'], size)
    alb[:, :3] = dilate(alb[:, :3], mask, size, MARGIN_PX)
    _set_pixels(out['albedo'], alb)
    nrm[:, :3] = dilate(nrm[:, :3], mask, size, MARGIN_PX)
    # normal: codificado (n + 1) / 2 -> volta para n em [-1, 1] (guia do OIDN)
    nrm[:, :3] = nrm[:, :3] * 2.0 - 1.0
    _set_pixels(out['normal'], nrm)
    print(f'[bake] aux (albedo, normal): {time.time() - t0:.1f} s', flush=True)
    if os.environ.get('BAKE_DEBUG'):
        write_via_compositor(out['albedo'], os.path.join(ctx.out, 'albedo-debug.png'), size, 'Standard', 'PNG', 90, False)
    return out


# ------------------------------------------------------------------------------------- saída


def write_via_compositor(img: bpy.types.Image, path: str, size: int, view: str, fmt: str, quality: int = 90,
                         denoise: bool = True, exposure: float = 0.0, exr_depth: str = '32', dither: float = 1.0,
                         aux: dict | None = None):
    """Image -> (Denoise) -> Composite numa cena auxiliar Workbench; grava pelo render."""
    aux_sc = bpy.data.scenes.new('aux_write')
    aux_sc.render.engine = 'BLENDER_WORKBENCH'
    aux_sc.render.resolution_x = size
    aux_sc.render.resolution_y = size
    aux_sc.render.resolution_percentage = 100
    aux_sc.render.use_compositing = True
    aux_sc.render.dither_intensity = dither   # 0 no lightmap: o dither vira manchas coloridas no blend `lighten`
    aux_sc.render.use_sequencer = False
    aux_sc.use_nodes = True
    nt = aux_sc.node_tree
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
        if aux:
            for key, sock in (('albedo', 'Albedo'), ('normal', 'Normal')):
                n_aux = nt.nodes.new('CompositorNodeImage')
                n_aux.image = aux[key]
                nt.links.new(n_aux.outputs['Image'], n_dn.inputs[sock])
        last = n_dn.outputs['Image']
    nt.links.new(last, n_out.inputs['Image'])
    aux_sc.display_settings.display_device = 'sRGB'
    aux_sc.view_settings.view_transform = view
    aux_sc.view_settings.look = 'None'
    aux_sc.view_settings.exposure = exposure
    aux_sc.view_settings.gamma = 1.0
    rs = aux_sc.render.image_settings
    rs.file_format = fmt
    rs.color_mode = 'RGB'
    if fmt == 'WEBP':
        rs.quality = quality
        rs.color_depth = '8'
    elif fmt == 'PNG':
        rs.color_depth = '8'
    elif fmt == 'OPEN_EXR':
        rs.color_depth = exr_depth
        rs.exr_codec = 'ZIP'
    rs.color_management = 'FOLLOW_SCENE'
    aux_sc.render.filepath = path
    aux_sc.render.use_file_extension = False
    bpy.ops.render.render(write_still=True, scene=aux_sc.name)
    bpy.data.scenes.remove(aux_sc)


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


def bake_color_pass(ctx, which: str, exposure: float, aux=None) -> dict:
    """night ou day: bake com cor + luz, denoise e gravação com AgX."""
    lights.rig(ctx, which)
    bpy.context.scene.cycles.samples = ctx.samples_night if which == 'night' else ctx.samples
    with timed(ctx, f'bake_{which}'):
        img = bake_to_image(ctx, which, {'DIRECT', 'INDIRECT', 'COLOR'})
    arr = np.empty(ctx.atlas * ctx.atlas * 4, dtype=np.float32)
    img.pixels.foreach_get(arr)
    st = stats(arr.reshape(-1, 4))
    os.makedirs(ctx.out, exist_ok=True)
    out = os.path.join(ctx.out, f'baked-{which}.webp')
    with timed(ctx, f'write_{which}'):
        write_via_compositor(img, out, ctx.atlas, 'AgX', 'WEBP', 90, True, exposure, aux=aux)
        if os.environ.get('BAKE_DEBUG'):
            write_via_compositor(img, os.path.join(ctx.out, f'raw-{which}.png'), ctx.atlas, 'AgX', 'PNG', 90, False,
                                 exposure)
    # cópia float para depuração e reuso entre etapas
    return st


def bake_lightmap(ctx, aux=None) -> dict:
    """Lightmap RGB: materiais brancos, só as 3 luzes de zona (R=TV, G=mesa, B=PC), sem cor."""
    lights.rig(ctx, 'light')
    bpy.context.scene.cycles.samples = ctx.samples
    with timed(ctx, 'bake_lightmap'):
        img = bake_to_image(ctx, 'light', {'DIRECT', 'INDIRECT'}, bounces=1, clamp_indirect=0.3)
    tmp = os.path.join(ctx.out, 'lightmap_dn.exr')
    with timed(ctx, 'write_lightmap'):
        # 1) denoise, float
        write_via_compositor(img, tmp, ctx.atlas, 'Raw', 'OPEN_EXR', denoise=True, aux=aux)
        arr = _read_exr(tmp, ctx.atlas)
        rgb = arr[:, :3].copy()
        gains = []
        for c in range(3):
            v = rgb[:, c]
            pos = v[v > 1e-6]
            if pos.size < 16:
                gains.append(1.0)
                continue
            # referência robusta: corta pontos quentes (percentil 99,9) e usa o percentil 99,5 do resto,
            # então só o miolo da luz (perto da fonte) chega a ~1 e o resto cai por distância.
            top = float(np.percentile(pos, 99.99))
            ref = float(np.percentile(pos[pos <= top], NORM_PERCENTILE))
            g = 1.0 / max(ref * NORM_HEADROOM[c], 1e-6)
            gains.append(g)
            rgb[:, c] = np.clip((v * g - LIGHTMAP_KNEE) / (1.0 - LIGHTMAP_KNEE), 0.0, 1.0)
        arr[:, :3] = rgb
        norm = bpy.data.images.new('lightmap_norm', ctx.atlas, ctx.atlas, alpha=False, float_buffer=True)
        norm.colorspace_settings.name = 'Linear Rec.709'
        norm.pixels.foreach_set(arr.reshape(-1))
        norm.update()
        out = os.path.join(ctx.out, 'lightmap.webp')
        # 2) gravação sem perdas, Raw (valores lineares intactos)
        write_via_compositor(norm, out, ctx.atlas, 'Raw', 'WEBP', 100, False, 0.0, dither=0.0)
    try:
        os.remove(tmp)
    except OSError:
        pass
    return {'gains': [round(g, 4) for g in gains], 'channel_ref_raw': [round(1.0 / g, 5) for g in gains]}


def direct_render(ctx, cams: dict, rig_name: str = 'night', samples: int = 64):
    """Render Cycles direto (sem bake) das câmeras dadas: confere se um defeito vem do bake ou da luz."""
    import math as _m
    from kit import L as _L
    lights.build_lights(ctx)
    lights.rig(ctx, rig_name)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.samples = samples
    sc.cycles.device = 'CPU'
    sc.cycles.use_denoising = True
    sc.cycles.diffuse_bounces = 4
    sc.cycles.max_bounces = 5
    sc.cycles.sample_clamp_indirect = 3.0
    sc.render.resolution_x, sc.render.resolution_y = 1280, 720
    sc.render.resolution_percentage = 100
    sc.display_settings.display_device = 'sRGB'
    sc.view_settings.view_transform = 'AgX'
    sc.render.image_settings.file_format = 'PNG'
    for o in bpy.data.objects:
        if o.type == 'MESH' and o.get('cat') in ('emit', 'screen'):
            o.hide_render = False
    cam_data = bpy.data.cameras.new('dcam')
    cam_data.sensor_fit = 'VERTICAL'
    cam_data.lens_unit = 'FOV'
    cam_data.angle = _m.radians(35.0)
    cam = bpy.data.objects.new('dcam', cam_data)
    sc.collection.objects.link(cam)
    sc.camera = cam
    mt.set_use_color(True)
    os.makedirs(os.path.join(ctx.out, 'quick'), exist_ok=True)
    for name, (pos, tgt) in cams.items():
        cam.location = _L(pos)
        cam.rotation_euler = (_L(tgt) - _L(pos)).to_track_quat('-Z', 'Y').to_euler()
        sc.render.filepath = os.path.join(ctx.out, 'quick', f'direct_{name}.png')
        bpy.ops.render.render(write_still=True)
