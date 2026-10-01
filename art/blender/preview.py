"""preview.py — renders PNG das câmeras-chave para revisão (ASSET_PIPELINE §2).

O preview mostra o que o navegador vai mostrar: o baked como emissão pura e as três zonas misturadas
como no runtime (nós Mix em modo Lighten; fator = canal do lightmap x força). Cycles com poucas
amostras e view transform Standard (o AgX já está na textura).
"""

from __future__ import annotations

import math
import os

import bpy
from mathutils import Vector

import kit
import materials as mt
from ctx import timed
from kit import L, lin

# cores e forças das luzes de zona (ARCHITECTURE §12.3; valores da Bruno Simon)
ZONES = (('R', '#ff115e', 1.47), ('G', '#ff6700', 1.9), ('B', '#0082ff', 1.4))

PREVIEWS = (('home', 'home'), ('desk', 'desk'), ('shelf', 'shelf'), ('digital', 'shelfDigital'),
            ('printer', 'printer'), ('chair', 'chair'))


def _baked_preview_material(night_path: str, light_path: str, name: str) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    em = nt.nodes.new('ShaderNodeEmission')
    nt.links.new(em.outputs['Emission'], out.inputs['Surface'])

    tex_a = nt.nodes.new('ShaderNodeTexImage')
    tex_a.image = bpy.data.images.load(night_path, check_existing=True)
    tex_a.image.colorspace_settings.name = 'sRGB'
    tex_a.interpolation = 'Linear'
    tex_a.extension = 'EXTEND'
    tex_l = nt.nodes.new('ShaderNodeTexImage')
    tex_l.image = bpy.data.images.load(light_path, check_existing=True)
    tex_l.image.colorspace_settings.name = 'Non-Color'
    tex_l.interpolation = 'Linear'
    tex_l.extension = 'EXTEND'
    sep = nt.nodes.new('ShaderNodeSeparateColor')
    nt.links.new(tex_l.outputs['Color'], sep.inputs['Color'])

    last = tex_a.outputs['Color']
    for ch, hexcol, strength in ZONES:
        mul = nt.nodes.new('ShaderNodeMath')
        mul.operation = 'MULTIPLY'
        mul.use_clamp = True
        mul.inputs[1].default_value = strength
        nt.links.new(sep.outputs[{'R': 'Red', 'G': 'Green', 'B': 'Blue'}[ch]], mul.inputs[0])
        mix = nt.nodes.new('ShaderNodeMix')
        mix.data_type = 'RGBA'
        mix.blend_type = 'LIGHTEN'
        mix.inputs['B'].default_value = lin(hexcol)
        nt.links.new(mul.outputs['Value'], mix.inputs['Factor'])
        nt.links.new(last, mix.inputs['A'])
        last = mix.outputs['Result']
    nt.links.new(last, em.inputs['Color'])
    return mat


def _emit_material(name: str, color_hex: str, strength: float) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    em = nt.nodes.new('ShaderNodeEmission')
    em.inputs['Color'].default_value = lin(color_hex)
    em.inputs['Strength'].default_value = strength
    nt.links.new(em.outputs['Emission'], out.inputs['Surface'])
    return mat


def _glass_preview(name: str, color_hex: str, alpha: float) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    mixs = nt.nodes.new('ShaderNodeMixShader')
    tr = nt.nodes.new('ShaderNodeBsdfTransparent')
    em = nt.nodes.new('ShaderNodeEmission')
    em.inputs['Color'].default_value = lin(color_hex)
    mixs.inputs['Fac'].default_value = alpha
    nt.links.new(tr.outputs['BSDF'], mixs.inputs[1])
    nt.links.new(em.outputs['Emission'], mixs.inputs[2])
    nt.links.new(mixs.outputs['Shader'], out.inputs['Surface'])
    return mat


def render_previews(ctx, out_dir: str, tex_dir: str):
    sc = bpy.context.scene
    night = os.path.join(tex_dir, 'baked-night.webp')
    day = os.path.join(tex_dir, 'baked-day.webp')
    light = os.path.join(tex_dir, 'lightmap.webp')

    # cena de preview: Cycles, poucas amostras, sem bounces de luz (só emissão e transparência)
    sc.render.engine = 'CYCLES'
    cy = sc.cycles
    cy.device = 'CPU'
    cy.samples = 12
    cy.use_adaptive_sampling = False
    cy.use_denoising = True
    try:
        cy.denoiser = 'OPENIMAGEDENOISE'
    except TypeError:
        pass
    cy.max_bounces = 2
    cy.diffuse_bounces = 0
    cy.glossy_bounces = 0
    cy.transmission_bounces = 0
    cy.transparent_max_bounces = 8
    sc.render.resolution_x = 1280
    sc.render.resolution_y = 720
    sc.render.resolution_percentage = 100
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_mode = 'RGB'
    sc.view_settings.view_transform = 'Standard'
    sc.view_settings.look = 'None'
    sc.view_settings.exposure = 0.0
    sc.view_settings.gamma = 1.0
    sc.display_settings.display_device = 'sRGB'

    # mundo: o mesmo azul-marinho do fundo do canvas (<color attach="background" args={['#0b1020']}/>)
    world = bpy.data.worlds.get('preview_world') or bpy.data.worlds.new('preview_world')
    world.use_nodes = True
    bg = world.node_tree.nodes.get('Background')
    bg.inputs['Color'].default_value = lin('#0b1020')
    bg.inputs['Strength'].default_value = 1.0
    sc.world = world

    # luzes desligadas (só emissão)
    for o in bpy.data.objects:
        if o.type == 'LIGHT':
            o.hide_render = True
        elif o.type == 'MESH':
            o.hide_render = False

    # materiais de preview
    mat_night = _baked_preview_material(night, light, 'prev_night')
    mat_day = _baked_preview_material(day, light, 'prev_day')
    # no preview do dia as zonas ficam apagadas: força 0 trocando o fator
    for n in mat_day.node_tree.nodes:
        if n.type == 'MATH':
            n.inputs[1].default_value = 0.0
    scr = _emit_material('prev_screen', '#1a2745', 1.0)
    for o in ctx.objects():
        cat = o.get('cat')
        me = o.data
        if cat in ('zone', 'baked'):
            me.materials.clear()
            me.materials.append(mat_night)
        elif cat == 'screen':
            me.materials.clear()
            me.materials.append(_emit_material(f'prev_{o.name}', o.get('emit_color', '#1a2745'), 0.55))
        elif cat == 'emit':
            me.materials.clear()
            me.materials.append(_emit_material(f'prev_{o.name}', o['emit_color'], max(0.6, min(o['emit_night'], 1.6))))
        elif cat == 'glass':
            me.materials.clear()
            me.materials.append(_glass_preview(f'prev_{o.name}', o.get('glass_color', '#0c1230'),
                                               1.0 - float(o.get('glass_alpha', 0.3))))
        elif cat == 'fx':
            o.hide_render = True

    cam_data = bpy.data.cameras.new('prev_cam')
    cam_data.sensor_fit = 'VERTICAL'
    cam_data.lens_unit = 'FOV'
    cam_data.angle = math.radians(35.0)
    cam_data.clip_start = 0.05
    cam_data.clip_end = 100.0
    cam = bpy.data.objects.new('prev_cam', cam_data)
    sc.collection.objects.link(cam)
    sc.camera = cam

    os.makedirs(out_dir, exist_ok=True)
    pres = ctx.lay['presets']
    jobs = [(f'{label}.png', key, 'night') for label, key in PREVIEWS] + [('home-day.png', 'home', 'day')]
    for fname, key, theme in jobs:
        p = pres[key]
        cam.location = L(p['position'])
        d = L(p['target']) - L(p['position'])
        cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
        for o in ctx.objects():
            if o.get('cat') in ('zone', 'baked'):
                o.data.materials[0] = mat_day if theme == 'day' else mat_night
            if o.get('cat') == 'emit' or o.get('cat') == 'screen':
                pass
        sc.render.filepath = os.path.join(out_dir, fname)
        with timed(ctx, f'preview_{fname[:-4]}'):
            bpy.ops.render.render(write_still=True)
        print(f'[preview] {fname}', flush=True)
