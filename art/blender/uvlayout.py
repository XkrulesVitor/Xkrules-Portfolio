"""uvlayout.py — atlas de UV único, com densidade de textura controlada.

Por que não `uv.smart_project` + `uv.pack_islands`: o chanfro de cada caixa vira dezenas de ilhas minúsculas
(cantos), cada uma pagando a margem de 3 px, e o atlas fica ~90% vazio. Aqui cada face é projetada no
plano do seu eixo dominante, as faces vizinhas do mesmo eixo formam UMA ilha (a face grande e o seu
chanfro), e a densidade (px por metro) é a mesma em todo o atlas, multiplicada pelo peso `tier` de cada
prop (piso e paredes menos, mesa e teclado mais). As ilhas são empacotadas em prateleiras, todas com a
mesma margem em pixels; o fator de escala é o maior que ainda cabe.

ASSET_PIPELINE §5 pede Smart UV Project + um pack único, com margem 0.003; o resultado é o mesmo
contrato (um único mapa UVMap por mesh, todos os nós baked no mesmo atlas, margem 0.003 do atlas).
"""

from __future__ import annotations

import math

import numpy as np


def _find_factory(parent):
    def find(a):
        while parent[a] != a:
            parent[a] = parent[parent[a]]
            a = parent[a]
        return a
    return find


def _island_labels(n_faces: int, face_key: np.ndarray, pairs: np.ndarray, nrm: np.ndarray) -> np.ndarray:
    """Ilhas: faces principais (normal alinhada a um eixo) vizinhas com o mesmo eixo dominante formam uma
    ilha; as faces "diagonais" (chanfros e cantos) entram na ilha da vizinha mais parecida, em rodadas.
    Sem isso cada canto chanfrado vira uma ilha minúscula que paga a margem do atlas."""
    nmax = np.abs(nrm).max(axis=1)
    main = nmax >= 0.85
    parent = np.arange(n_faces)
    find = _find_factory(parent)
    for a, b in pairs:
        if main[a] and main[b] and face_key[a] == face_key[b]:
            ra, rb = find(a), find(b)
            if ra != rb:
                parent[rb] = ra
    label = np.full(n_faces, -1, dtype=np.int64)
    for i in range(n_faces):
        if main[i]:
            label[i] = find(i)
    if len(pairs):
        a_all = np.concatenate([pairs[:, 0], pairs[:, 1]])
        b_all = np.concatenate([pairs[:, 1], pairs[:, 0]])
        dots = np.einsum('ij,ij->i', nrm[a_all], nrm[b_all])
        for _ in range(8):
            todo = (label[a_all] < 0) & (label[b_all] >= 0)
            if not todo.any():
                break
            ia, ib, dd = a_all[todo], b_all[todo], dots[todo]
            order = np.lexsort((-dd, ia))
            ia, ib = ia[order], ib[order]
            first = np.ones(len(ia), dtype=bool)
            first[1:] = ia[1:] != ia[:-1]
            label[ia[first]] = label[ib[first]]
    rest = np.nonzero(label < 0)[0]
    if len(rest):
        # componentes sem nenhuma face principal (blobs, tubos): ilhas por eixo dominante
        for i in rest:
            label[i] = n_faces + int(face_key[i])
        # junta vizinhas com o mesmo eixo dentro do resto
        parent2 = {}
        def f2(a):
            while parent2.get(a, a) != a:
                parent2[a] = parent2.get(parent2[a], parent2[a])
                a = parent2[a]
            return a
        restset = set(rest.tolist())
        for a, b in pairs:
            if a in restset and b in restset and face_key[a] == face_key[b]:
                ra, rb = f2(a), f2(b)
                if ra != rb:
                    parent2[rb] = ra
        for i in rest:
            label[i] = n_faces + 8 + f2(int(i))
    return label


def _merge_small_components(n_faces, lab, pairs, co, loop_v, face_of_loop, small_m):
    """Peças pequenas (teclas, peões, dados: menos de `small_m` metros em qualquer direção) viram UMA ilha:
    a margem de cada ilha custaria mais atlas do que a própria peça, e ela cobre só 1 a 3 texels."""
    if small_m <= 0:
        return lab
    parent = np.arange(n_faces)
    find = _find_factory(parent)
    for a, b in pairs:
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[rb] = ra
    root = np.array([find(i) for i in range(n_faces)])
    pos = co[loop_v]
    uniq, inv = np.unique(root[face_of_loop], return_inverse=True)
    k = len(uniq)
    mn = np.full((k, 3), np.inf)
    mx = np.full((k, 3), -np.inf)
    np.minimum.at(mn, inv, pos)
    np.maximum.at(mx, inv, pos)
    ext = (mx - mn).max(axis=1)
    small_comp = ext < small_m
    face_comp = np.searchsorted(uniq, root)
    out = lab.copy()
    is_small = small_comp[face_comp]
    out[is_small] = (n_faces * 4 + root[is_small])
    return out


def _mesh_arrays(me):
    nv, nl, nf = len(me.vertices), len(me.loops), len(me.polygons)
    co = np.empty(nv * 3, dtype=np.float32)
    me.vertices.foreach_get('co', co)
    co = co.reshape(-1, 3)
    loop_v = np.empty(nl, dtype=np.int32)
    me.loops.foreach_get('vertex_index', loop_v)
    loop_e = np.empty(nl, dtype=np.int32)
    me.loops.foreach_get('edge_index', loop_e)
    ls = np.empty(nf, dtype=np.int32)
    me.polygons.foreach_get('loop_start', ls)
    lt = np.empty(nf, dtype=np.int32)
    me.polygons.foreach_get('loop_total', lt)
    nrm = np.empty(nf * 3, dtype=np.float32)
    me.polygons.foreach_get('normal', nrm)
    nrm = nrm.reshape(-1, 3)
    area = np.empty(nf, dtype=np.float32)
    me.polygons.foreach_get('area', area)
    attr = me.attributes.get('tier')
    if attr is not None:
        tier = np.empty(nf, dtype=np.float32)
        attr.data.foreach_get('value', tier)
    else:
        tier = np.ones(nf, dtype=np.float32)
    return co, loop_v, loop_e, ls, lt, nrm, tier, area


def _shelf_pack(sizes: np.ndarray, atlas: int):
    """Empacota retângulos (w, h) em px em prateleiras, maior altura primeiro. Devolve (x, y) ou None."""
    n = len(sizes)
    order = np.argsort(-sizes[:, 1], kind='stable')
    xs = np.zeros(n, dtype=np.int32)
    ys = np.zeros(n, dtype=np.int32)
    shelves = []                      # [y, altura, x_atual]
    y_top = 0
    for i in order:
        w, h = int(sizes[i, 0]), int(sizes[i, 1])
        if w > atlas or h > atlas:
            return None
        placed = False
        for sh in shelves:
            if h <= sh[1] and sh[2] + w <= atlas:
                xs[i], ys[i] = sh[2], sh[0]
                sh[2] += w
                placed = True
                break
        if not placed:
            if y_top + h > atlas:
                return None
            shelves.append([y_top, h, w])
            xs[i], ys[i] = 0, y_top
            y_top += h
    return xs, ys


THIN_M = 0.03      # face "fina": lado projetado menor que 3 cm (já multiplicado pelo tier)
MIN_PX = 3         # toda ilha ocupa pelo menos 3 px em cada direção, para ao menos um centro de pixel cair nela


def layout(objs, atlas: int, pad_frac: float = 0.002, small_m: float = 0.06) -> dict:
    """Gera o UVMap de todos os objetos num atlas único. Devolve estatísticas.

    Faces finas e inclinadas (os degraus do chanfro, menores que um texel) não conseguem ser assadas:
    o bake só preenche pixels cujo centro cai dentro da face, e o resto virava cor de outra ilha (manchas
    pretas e coloridas nos travesseiros). Elas são projetadas e depois PRESAS à borda do retângulo da
    ilha (clamp): passam a amostrar o texel de borda da face grande vizinha. Ilhas minúsculas ganham
    um mínimo de MIN_PX pixels (esticadas), para o bake ter pelo menos um pixel para assar.
    """
    pad = max(2, int(round(pad_frac * atlas)))
    per_obj = []
    islands_w, islands_h = [], []     # em metros x tier (já orientadas com w >= h)
    for oi, o in enumerate(objs):
        me = o.data
        co, loop_v, loop_e, ls, lt, nrm, tier, area = _mesh_arrays(me)
        nf = len(ls)
        if nf == 0:
            per_obj.append(None)
            continue
        ax = np.argmax(np.abs(nrm), axis=1)
        nmax = np.abs(nrm).max(axis=1)
        sgn = (np.take_along_axis(nrm, ax[:, None], axis=1)[:, 0] >= 0).astype(np.int32)
        key = ax * 2 + sgn
        face_of_loop = np.repeat(np.arange(nf), lt)
        order = np.argsort(loop_e, kind='stable')
        se = loop_e[order]
        sf = face_of_loop[order]
        same = np.nonzero(se[1:] == se[:-1])[0]
        pairs = np.stack([sf[same], sf[same + 1]], axis=1)
        pairs = pairs[pairs[:, 0] != pairs[:, 1]]
        lab = _island_labels(nf, key, pairs, nrm)
        lab = _merge_small_components(nf, lab, pairs, co, loop_v, face_of_loop, small_m)
        pos = co[loop_v]
        uniq_f, inv_f = np.unique(lab, return_inverse=True)
        votes = np.zeros((len(uniq_f), 3))
        np.add.at(votes, (inv_f, ax), area)
        isl_axis = votes.argmax(axis=1)
        face_axis = isl_axis[inv_f]
        a = face_axis[face_of_loop]
        t = tier[face_of_loop]
        u = np.where(a == 0, pos[:, 1], pos[:, 0]) * t
        v = np.where(a == 2, pos[:, 1], pos[:, 2]) * t
        # faces finas e inclinadas em relação ao eixo da ilha
        fu0 = np.minimum.reduceat(u, ls)
        fu1 = np.maximum.reduceat(u, ls)
        fv0 = np.minimum.reduceat(v, ls)
        fv1 = np.maximum.reduceat(v, ls)
        thin = np.minimum(fu1 - fu0, fv1 - fv0) < THIN_M
        aligned = (ax == face_axis) & (nmax >= 0.85)
        excluded = (~aligned) & thin
        loop_lab = lab[face_of_loop]
        uniq, inv = np.unique(loop_lab, return_inverse=True)
        k = len(uniq)
        ok_loop = ~excluded[face_of_loop]
        umin = np.full(k, np.inf)
        vmin = np.full(k, np.inf)
        umax = np.full(k, -np.inf)
        vmax = np.full(k, -np.inf)
        np.minimum.at(umin, inv[ok_loop], u[ok_loop])
        np.minimum.at(vmin, inv[ok_loop], v[ok_loop])
        np.maximum.at(umax, inv[ok_loop], u[ok_loop])
        np.maximum.at(vmax, inv[ok_loop], v[ok_loop])
        empty = ~np.isfinite(umin)                      # ilha só de faces finas: usa todas, sem clamp
        if empty.any():
            e_loop = empty[inv]
            np.minimum.at(umin, inv[e_loop], u[e_loop])
            np.minimum.at(vmin, inv[e_loop], v[e_loop])
            np.maximum.at(umax, inv[e_loop], u[e_loop])
            np.maximum.at(vmax, inv[e_loop], v[e_loop])
        u = np.clip(u, umin[inv], umax[inv])
        v = np.clip(v, vmin[inv], vmax[inv])
        w = np.maximum(umax - umin, 1e-3)
        h = np.maximum(vmax - vmin, 1e-3)
        swap = h > w
        w2 = np.where(swap, h, w)
        h2 = np.where(swap, w, h)
        per_obj.append({'u': u, 'v': v, 'inv': inv, 'umin': umin, 'vmin': vmin, 'swap': swap, 'k': k,
                        'w': w, 'h': h})
        islands_w.append(w2)
        islands_h.append(h2)
    W = np.concatenate(islands_w)
    H = np.concatenate(islands_h)
    n_isl = len(W)

    def sizes_for(scale):
        return np.stack([np.maximum(np.ceil(W * scale), MIN_PX) + 2 * pad,
                         np.maximum(np.ceil(H * scale), MIN_PX) + 2 * pad], axis=1)

    area_m2 = float(np.sum(W * H))
    hi = math.sqrt(atlas * atlas / max(area_m2, 1e-6))
    lo = hi * 0.2
    best = None
    for _ in range(14):
        mid = (lo + hi) / 2
        res = _shelf_pack(sizes_for(mid), atlas)
        if res is not None:
            best, lo = (mid, res), mid
        else:
            hi = mid
    if best is None:
        res = _shelf_pack(sizes_for(lo * 0.5), atlas)
        best = (lo * 0.5, res)
    scale, (xs, ys) = best

    cursor = 0
    for oi, o in enumerate(objs):
        d = per_obj[oi]
        if d is None:
            continue
        k = d['k']
        sl = slice(cursor, cursor + k)
        cursor += k
        ox = xs[sl].astype(np.float64) + pad
        oy = ys[sl].astype(np.float64) + pad
        inv = d['inv']
        uu = d['u'] - d['umin'][inv]
        vv = d['v'] - d['vmin'][inv]
        sw = d['swap'][inv]
        # esticar ilhas menores que MIN_PX para MIN_PX (separadamente em cada direção)
        su = np.where(d['w'] * scale < MIN_PX, MIN_PX / (d['w'] * scale), 1.0)
        sv = np.where(d['h'] * scale < MIN_PX, MIN_PX / (d['h'] * scale), 1.0)
        uu = uu * su[inv]
        vv = vv * sv[inv]
        # ilhas giradas (w >= h): troca u e v
        fu = np.where(sw, vv, uu)
        fv = np.where(sw, uu, vv)
        U = (ox[inv] + fu * scale) / atlas
        V = (oy[inv] + fv * scale) / atlas
        uv = np.stack([U, V], axis=1).astype(np.float32)
        me = o.data
        uvl = me.uv_layers.get('UVMap') or me.uv_layers.new(name='UVMap')
        uvl.data.foreach_set('uv', uv.reshape(-1))
        me.update()
    sz = sizes_for(scale)
    used_px = float(np.sum((sz[:, 0] - 2 * pad) * (sz[:, 1] - 2 * pad)))
    big_side = np.maximum(W, H) * scale
    hist = {}
    for lo_, hi_ in ((0, 4), (4, 8), (8, 16), (16, 32), (32, 64), (64, 9999)):
        m = (big_side >= lo_) & (big_side < hi_)
        hist[f'{lo_}-{hi_}px'] = [int(m.sum()), round(float((sz[m, 0] * sz[m, 1]).sum()) / (atlas * atlas), 3)]
    return {
        'hist_count_and_fill': hist,
        'islands': int(n_isl), 'scale_px_per_m': round(float(scale), 2),
        'texel_cm_tier1': round(100.0 / float(scale), 2), 'pad_px': pad,
        'coverage': round(used_px / (atlas * atlas), 3),
        'packed_fill': round(float(np.sum(sz[:, 0] * sz[:, 1])) / (atlas * atlas), 3),
    }
