"""export.py — materiais de exportação, glb (+Y up) e manifest.json.

Nós baked recebem um material simples chamado `baked`, sem textura. Emissivos mantêm a cor de
emissão (o runtime lê dali), telas recebem `screen`. Sem imagens embutidas. Depois do glb, o
`npm run art:optimize` aplica `gltf-transform meshopt` e copia as texturas.
"""

from __future__ import annotations

import json
import os

import bpy

import kit
import materials as mt
from kit import lin

# Nomes que o runtime procura (ASSET_PIPELINE §4)
REQUIRED = [
    'zone_room', 'zone_desk', 'zone_games', 'zone_maker', 'zone_bed',
    'chair_root',
    'printer_root', 'printer_axisZ', 'printer_head', 'printer_bed', 'printer_part', 'printer_led',
    'box_terra', 'box_aldeia_dorme', 'box_porrilandia', 'box_peter', 'box_o_anel',
    'screen_monitor_main', 'screen_monitor_vertical', 'screen_tv',
    'tv_backlight',
    'led_case', 'glass_pc', 'pc_fan_top', 'pc_fan_bottom', 'pc_rgb',
    'clock_hour', 'clock_minute', 'clock_second',
    'fx_mug_steam',
    'emit_window_city',
]


def _simple(name: str, color_hex: str, **kw) -> bpy.types.Material:
    m = bpy.data.materials.get(name)
    if m:
        bpy.data.materials.remove(m)
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = lin(color_hex)
    bsdf.inputs['Roughness'].default_value = 0.9
    for k, v in kw.items():
        bsdf.inputs[k].default_value = v
    return m


def prepare_export(ctx):
    baked = _simple('baked', '#cccccc')
    screen = _simple('screen', '#050507')
    fx = _simple('fx', '#ffffff', **{'Alpha': 0.5})
    try:
        fx.surface_render_method = 'BLENDED'
        fx.blend_method = 'BLEND'
    except (AttributeError, TypeError):
        pass
    for o in ctx.objects():
        cat = o.get('cat')
        me = o.data
        if cat in ('zone', 'baked'):
            me.materials.clear()
            me.materials.append(baked)
        elif cat == 'screen':
            me.materials.clear()
            me.materials.append(screen)
        elif cat == 'fx':
            me.materials.clear()
            me.materials.append(fx)
        elif cat == 'emit':
            mt.set_emission(o, 1.0)
        # atributos auxiliares do build não vão para o glb
        for a in ('col', 'tier'):
            at = me.attributes.get(a)
            if at is not None and cat != 'emit':
                me.attributes.remove(at)
        o.hide_render = False


def export_glb(ctx, path: str):
    prepare_export(ctx)
    view = bpy.context.view_layer
    for o in view.objects:
        o.select_set(False)
    exp = [o for o in ctx.objects()]
    for o in exp:
        o.select_set(True)
    view.objects.active = exp[0]
    kwargs = dict(
        filepath=path,
        export_format='GLB',
        use_selection=True,
        export_yup=True,
        export_apply=True,
        export_texcoords=True,
        export_normals=False,
        export_tangents=False,
        export_materials='EXPORT',
        export_cameras=False,
        export_lights=False,
        export_animations=False,
        export_extras=False,
        export_skins=False,
        export_morph=False,
        export_vertex_color='NONE',
        export_attributes=False,
        export_image_format='NONE',
        export_unused_images=False,
        export_unused_textures=False,
        export_hierarchy_full_collections=False,
    )
    valid = set(bpy.ops.export_scene.gltf.get_rna_type().properties.keys())
    kwargs = {k: v for k, v in kwargs.items() if k in valid}
    with bpy.context.temp_override(active_object=exp[0], selected_objects=exp, selected_editable_objects=exp):
        bpy.ops.export_scene.gltf(**kwargs)


def manifest(ctx, extra: dict) -> dict:
    """Nós por categoria, bounding boxes no mundo (Y-up), triângulos por nó."""
    nodes = []
    cats: dict[str, list[str]] = {}
    total_tris = 0
    for o in sorted(ctx.objects(), key=lambda x: x.name):
        cat = o.get('cat', '?')
        tris = kit.tri_count(o)
        mn, mx = kit.world_bbox_layout(o)
        loc = kit.world_bbox_layout  # (apenas para clareza)
        center = [round((a + b) / 2, 4) for a, b in zip(mn, mx)]
        pos = o.matrix_world.translation
        origin = [round(pos.x, 4), round(pos.z, 4), round(-pos.y, 4)]
        nodes.append({
            'name': o.name, 'cat': cat, 'tris': tris, 'origin': origin,
            'bbox_min': [round(v, 4) for v in mn], 'bbox_max': [round(v, 4) for v in mx], 'center': center,
            'parent': o.parent.name if o.parent else None,
        })
        cats.setdefault(cat, []).append(o.name)
        total_tris += tris
    names = {n['name'] for n in nodes}
    missing = [n for n in REQUIRED if n not in names]
    dup = [n for n in names if '.0' in n]
    lay = ctx.LAYOUT
    by = {n['name']: n for n in nodes}
    checks = {}
    for key, lk in (('screen_monitor_main', 'monitorMain'), ('screen_monitor_vertical', 'monitorVertical'),
                    ('screen_tv', 'tv')):
        if key in by:
            c = by[key]['center']
            ref = lay[lk]['center']
            err = max(abs(c[i] - ref[i]) for i in range(3))
            checks[key] = {'center': c, 'layout': ref, 'max_error_m': round(err, 5)}
    return {
        'nodes': nodes, 'categories': cats, 'triangles': total_tris, 'missing_required': missing,
        'suffix_001': dup, 'checks': checks, 'meshes': len(nodes),
        'props': ctx.props_log, **extra,
    }


def write_manifest(ctx, extra: dict):
    path = os.path.join(ctx.out, 'manifest.json')
    old = {}
    if os.path.exists(path):
        try:
            with open(path, encoding='utf-8') as f:
                old = json.load(f)
        except (OSError, ValueError):
            old = {}
    data = manifest(ctx, extra)
    data['timings'] = {**old.get('timings', {}), **ctx.timings}
    for k in ('bake', 'quality', 'atlas'):
        if k in old and k not in data:
            data[k] = old[k]
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=1, ensure_ascii=False)
    return data
