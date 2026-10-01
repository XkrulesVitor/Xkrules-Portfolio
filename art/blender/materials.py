"""materials.py — paleta e materiais.

Cor sólida por vértice (atributo `col`, linear) e UM material de bake para tudo que vai ao atlas.
Quem dá o acabamento é a luz (ASSET_PIPELINE §5). Emissivos têm material próprio (Principled com
emissão) e guardam cor e força nas propriedades do objeto, para os rigs de luz ajustarem.
"""

from __future__ import annotations

import bpy

from kit import lin

# --------------------------------------------------------------------------- paleta (sRGB)
# Parte dela vem do grey-box (placeholders/parts.ts), com acabamento mais rico.
C = {
    # estrutura
    'floor': '#b9885c', 'floor_dark': '#9c6f48', 'floor_gap': '#2a1c18',
    'slab': '#6b4d3d', 'island1': '#3a3350', 'island2': '#2b2640',
    'wall_left': '#ddd5ec', 'wall_back': '#eadde2', 'wall_top': '#cfc6dc',
    'baseboard': '#f4f0ea',
    # madeira e superfícies
    'wood': '#b08d6a', 'wood_light': '#c8a27a', 'wood_dark': '#7a5a42', 'walnut': '#5c4033',
    'white': '#ece8e1', 'cream': '#f1e9da', 'dark': '#2f3542', 'darker': '#1f232c', 'black': '#14161c',
    'bezel': '#1d2128', 'metal': '#c9ced6', 'metal_dark': '#8b93a1', 'steel': '#5b6372',
    # tecidos
    'rug_a': '#6f67a3', 'rug_b': '#9b92cc', 'rug_c': '#e0b97a',
    'duvet': '#5a6fb5', 'duvet_fold': '#7d92d1', 'sheet': '#e9e4da', 'pillow': '#f6f3ec', 'pillow2': '#c9b8e8',
    'headboard': '#6b5b95', 'curtain': '#9a8fc4', 'curtain2': '#b6abd9',
    # plantas
    'leaf1': '#3f9a5a', 'leaf2': '#2f7d4b', 'leaf3': '#5db36d', 'leaf4': '#7ac47f', 'stem': '#4a7a3f',
    'pot': '#c4724a', 'pot2': '#e7e2da', 'soil': '#3a2a22',
    # cadeira gamer
    'chair': '#272b36', 'chair_acc': '#8b5cf6', 'chair_seat': '#343947',
    # acentos
    'accent': '#ef6c3b', 'part': '#ff9f6b', 'teal': '#3fb8c9', 'pink': '#e58bb2', 'violet': '#8e6bbf',
    'yellow': '#d9a441', 'red': '#c8412f', 'green': '#2f8f6f', 'blue': '#4c8bf5', 'orange': '#f28f3b',
    'dice': '#f2efe8',
}

# Luz de cada emissor (cor sRGB do emissor, força no rig noturno e no diurno)
# Os rigs leem estas chaves nas propriedades do objeto: emit_color, emit_night, emit_day.


def bake_material() -> bpy.types.Material:
    """Material único dos nós baked: cor do atributo `col` num Diffuse + nó de imagem alvo (ativo)."""
    mat = bpy.data.materials.get('bake_mat')
    if mat:
        return mat
    mat = bpy.data.materials.new('bake_mat')
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    out.location = (600, 0)
    diff = nt.nodes.new('ShaderNodeBsdfDiffuse')
    diff.location = (400, 0)
    attr = nt.nodes.new('ShaderNodeAttribute')
    attr.attribute_name = 'col'
    attr.attribute_type = 'GEOMETRY'
    attr.location = (-200, 100)
    mix = nt.nodes.new('ShaderNodeMix')
    mix.name = 'use_color'
    mix.data_type = 'RGBA'
    mix.blend_type = 'MIX'
    mix.location = (100, 0)
    mix.inputs['Factor'].default_value = 1.0
    mix.inputs['A'].default_value = (0.8, 0.8, 0.8, 1)
    nt.links.new(attr.outputs['Color'], mix.inputs['B'])
    nt.links.new(mix.outputs['Result'], diff.inputs['Color'])
    nt.links.new(diff.outputs['BSDF'], out.inputs['Surface'])
    img = nt.nodes.new('ShaderNodeTexImage')
    img.name = 'bake_target'
    img.location = (100, -300)
    nt.nodes.active = img
    return mat


def set_use_color(on: bool):
    """Passes com cor (night/day) liberam o atributo; o lightmap usa branco puro."""
    mat = bpy.data.materials['bake_mat']
    mat.node_tree.nodes['use_color'].inputs['Factor'].default_value = 1.0 if on else 0.0


def emissive_material(name: str, color_hex: str, strength: float = 1.0) -> bpy.types.Material:
    """Principled preto com emissão. O glb exporta este material (cor de emissão, força 1)."""
    mat = bpy.data.materials.get(name)
    if mat is None:
        mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.name = 'emit_bsdf'
    bsdf.inputs['Base Color'].default_value = (0, 0, 0, 1)
    bsdf.inputs['Emission Color'].default_value = lin(color_hex)
    bsdf.inputs['Emission Strength'].default_value = strength
    nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    return mat


def glass_material(name: str, color_hex: str = '#0c1230', alpha: float = 0.35) -> bpy.types.Material:
    mat = bpy.data.materials.get(name)
    if mat is None:
        mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.name = 'glass_bsdf'
    bsdf.inputs['Base Color'].default_value = lin(color_hex)
    bsdf.inputs['Alpha'].default_value = alpha
    nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    try:
        mat.surface_render_method = 'BLENDED'
    except (AttributeError, TypeError):
        pass
    try:
        mat.blend_method = 'BLEND'
    except (AttributeError, TypeError):
        pass
    return mat


def set_emission(obj, strength: float):
    """Muda a força de emissão do material do objeto (rigs de luz)."""
    for slot in obj.material_slots:
        nt = slot.material.node_tree if slot.material else None
        node = nt.nodes.get('emit_bsdf') if nt else None
        if node:
            node.inputs['Emission Strength'].default_value = strength
