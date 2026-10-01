"""main.py — orquestra a geração do quarto no Blender (headless).

Uso (via npm run art:build):
  blender -b --factory-startup -P art/blender/main.py -- --layout art/build/layout.json --out art/build \
      [--quality draft|final] [--stage build|bake|export|preview|all]

Cada etapa abre o `room.blend` salvo pela anterior, então dá para repetir só uma (o bake leva minutos,
o preview e a exportação levam segundos). Eixos: o layout é Y-up; no Blender (Z-up) vira (x, -z, y).

Etapas: build (props, junção por zona, atlas de UV) · bake (night, day, lightmap) · export (glb + manifest) ·
preview (PNG das câmeras do layout.json) · quick (prévia sem bake, Workbench) · direct (render Cycles sem bake,
para separar defeito de bake de defeito de luz).

Variáveis de ambiente de depuração (todas opcionais): BAKE_SAMPLES (sobrescreve as amostras), BAKE_ONLY
(night,day,lightmap), BAKE_DEBUG (salva albedo e bake bruto em art/build), PREVIEW_ONLY (home,chair...),
PREVIEW_CAM ("nome=px,py,pz,tx,ty,tz[,day];..."), PREVIEW_NOZONES, QUICK_NAMES, RIG, DIRECT_SAMPLES.
"""

import argparse
import importlib
import json
import os
import sys
import time

sys.dont_write_bytecode = True     # sem __pycache__ dentro de art/ (nada de .pyc no git)
HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

try:
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')
except (AttributeError, ValueError):
    pass

import bpy  # noqa: E402

import bake  # noqa: E402
import export  # noqa: E402
import kit  # noqa: E402
import lights  # noqa: E402
import materials as mt  # noqa: E402
import preview  # noqa: E402
from ctx import ZONES, Ctx, timed  # noqa: E402

PROP_MODULES = ('room', 'desk', 'games', 'maker', 'bed', 'decor')


def parse_args():
    argv = sys.argv
    argv = argv[argv.index('--') + 1:] if '--' in argv else []
    ap = argparse.ArgumentParser()
    ap.add_argument('--layout', default='art/build/layout.json')
    ap.add_argument('--out', default='art/build')
    ap.add_argument('--quality', choices=('draft', 'final'), default='draft')
    ap.add_argument('--stage', choices=('build', 'bake', 'export', 'preview', 'quick', 'direct', 'all'), default='all')
    ap.add_argument('--previews', default=None, help='pasta dos PNG (padrão: art/previews)')
    return ap.parse_args(argv)


def blend_path(ctx) -> str:
    return os.path.join(ctx.out, 'room.blend')


def open_blend(ctx):
    bpy.ops.wm.open_mainfile(filepath=blend_path(ctx))
    sc = bpy.context.scene
    ctx.props_log = json.loads(sc.get('props_log', '[]'))


def stage_build(ctx):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.unit_settings.system = 'METRIC'
    sc.unit_settings.scale_length = 1.0
    mt.bake_material()
    with timed(ctx, 'build_props'):
        for name in PROP_MODULES:
            mod = importlib.import_module(f'props.{name}')
            importlib.reload(mod)
            mod.build(ctx)
    with timed(ctx, 'join_zones'):
        for z in ZONES:
            objs = ctx.zone_objs[z]
            if not objs:
                continue
            obj = kit.join(objs, f'zone_{z}', zone=z)
            kit.set_origin_world_zero(obj)
            obj['cat'] = 'zone'
    with timed(ctx, 'unwrap'):
        sc['uv_stats'] = json.dumps(bake.unwrap(ctx))
    sc['props_log'] = json.dumps(ctx.props_log)
    os.makedirs(ctx.out, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=blend_path(ctx))
    print(f'[build] {len(ctx.props_log)} props, blend salvo em {blend_path(ctx)}', flush=True)


def stage_bake(ctx):
    open_blend(ctx)
    bake.setup_cycles(ctx)
    lights.build_lights(ctx)
    only = os.environ.get('BAKE_ONLY')
    only = only.split(',') if only else ['night', 'day', 'lightmap']
    res = {}
    with timed(ctx, 'bake_aux'):
        aux = bake.bake_aux(ctx)
    if 'night' in only:
        res['night'] = bake.bake_color_pass(ctx, 'night', lights.NIGHT['exposure'], aux)
    if 'day' in only:
        res['day'] = bake.bake_color_pass(ctx, 'day', lights.DAY['exposure'], aux)
    if 'lightmap' in only:
        res['lightmap'] = bake.bake_lightmap(ctx, aux)
    prev = {}
    p_stats = os.path.join(ctx.out, 'bake_stats.json')
    if os.path.exists(p_stats):
        with open(p_stats, encoding='utf-8') as f:
            prev = json.load(f).get('bake', {})
    res = {**prev, **res}
    save_stats(ctx, {'bake': res, 'quality': ctx.args.quality, 'atlas': ctx.atlas, 'samples': ctx.samples,
                      'samples_night': ctx.samples_night})


def save_stats(ctx, extra):
    path = os.path.join(ctx.out, 'bake_stats.json')
    old = {}
    if os.path.exists(path):
        with open(path, encoding='utf-8') as f:
            old = json.load(f)
    old.update(extra)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(old, f, indent=1)


def persist_timings(ctx):
    path = os.path.join(ctx.out, 'timings.json')
    old = {}
    if os.path.exists(path):
        with open(path, encoding='utf-8') as f:
            old = json.load(f)
    old.update(ctx.timings)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(old, f, indent=1)
    return old


def stage_export(ctx):
    open_blend(ctx)
    glb = os.path.join(ctx.out, 'room.glb')
    with timed(ctx, 'export_glb'):
        export.export_glb(ctx, glb)
    extra = {}
    stats_path = os.path.join(ctx.out, 'bake_stats.json')
    if os.path.exists(stats_path):
        with open(stats_path, encoding='utf-8') as f:
            extra.update(json.load(f))
    ctx.timings = persist_timings(ctx)
    data = export.write_manifest(ctx, extra)
    print(f'[export] {data["meshes"]} meshes, {data["triangles"]} tris; faltando: {data["missing_required"]}',
          flush=True)


def stage_preview(ctx):
    open_blend(ctx)
    out = ctx.args.previews or os.path.join(os.path.dirname(ctx.out), 'previews')
    preview.render_previews(ctx, out, ctx.out)


def stage_quick(ctx):
    open_blend(ctx)
    names = os.environ.get('QUICK_NAMES')
    preview.quick_previews(ctx, os.path.join(ctx.out, 'quick'), names.split(',') if names else None)


def stage_direct(ctx):
    open_blend(ctx)
    cams = {}
    for item in os.environ.get('PREVIEW_CAM', '').split(';'):
        if '=' not in item:
            continue
        nm, vals = item.split('=')
        v = [float(x) for x in vals.split(',')[:6]]
        cams[nm] = (v[:3], v[3:6])
    bake.direct_render(ctx, cams, os.environ.get('RIG', 'night'), int(os.environ.get('DIRECT_SAMPLES', '64')))


def main():
    args = parse_args()
    ctx = Ctx(args)
    if args.stage in ('all', 'build'):
        for stale in ('timings.json', 'bake_stats.json', 'manifest.json'):
            try:
                os.remove(os.path.join(ctx.out, stale))
            except OSError:
                pass
    stages = ('build', 'bake', 'export', 'preview') if args.stage == 'all' else (args.stage,)
    t_all = time.time()
    for st in stages:
        t0 = time.time()
        {'build': stage_build, 'bake': stage_bake, 'export': stage_export, 'preview': stage_preview,
         'quick': stage_quick, 'direct': stage_direct}[st](ctx)
        ctx.timings[f'stage_{st}'] = round(time.time() - t0, 1)
        print(f'[stage] {st}: {time.time() - t0:.1f} s', flush=True)
        persist_timings(ctx)
    print(f'[total] {time.time() - t_all:.1f} s', flush=True)


main()
