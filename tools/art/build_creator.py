"""Character creator pieces (18 Nov 2026) -> src/creator/: one atlas (cc_atlas.webp), one material atlas
(cc_mat.png: 0 keep, 1 skin, 2 hair, 3 beard) and cc.json describing every piece.

Sources (art_incoming/creator/v3/):
  base_walk.png  4x4 walk sheet (rows down, left, right, up), bald, grey vest and shorts
  hair_*.png     hairstyles, 3 views (front, back, side facing left); fitted by fit_hair3.py -> fits3.json
  heads_6.png    6 faces x 3 views (front, side facing left, back), cells 341 x 256
  beards_4.png   4 beards x 2 views (front, side facing left), drawn in register with the heads' cells

Everything is placed in the coordinates of the base sheet's standing frame for each direction (column 1). Walking
frames move a piece by how far the head moved (anchor dx, dy per frame). Right-facing views are the left ones mirrored.
Output is at OUT_SCALE of the source (the base figure is ~273 px tall in the source)."""
import json, glob, os, os, sys, importlib.util
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from colorsys import rgb_to_hsv
spec = importlib.util.spec_from_file_location('fh', os.path.join(os.path.dirname(__file__), 'fit_hair3.py'))
fh = importlib.util.module_from_spec(spec); spec.loader.exec_module(fh)
D = fh.D; OUT = 'src/creator/'; OUT_SCALE = .5
os.makedirs(OUT, exist_ok=True)

def hsv_img(a):
    rgb = a[..., :3].astype(float) / 255; mx = rgb.max(-1); mn = rgb.min(-1); d = mx - mn
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    h = np.zeros_like(mx); m = d > 1e-6
    rr = m & (mx == r); gg = m & (mx == g) & ~rr; bb = m & ~rr & ~gg
    h[rr] = ((g - b)[rr] / d[rr]) % 6; h[gg] = (b - r)[gg] / d[gg] + 2; h[bb] = (r - g)[bb] / d[bb] + 4
    return h / 6, np.where(mx > 0, d / np.maximum(mx, 1e-6), 0), mx
def skin_mask(a):
    """Skin: warm orange-brown pixels, not the outline, brows, eyes, lips or make-up."""
    al = a[..., 3] > 0; h, s, v = hsv_img(a)
    warm = al & (h >= .015) & (h <= .14) & (s >= .18) & (s <= .85) & (v >= .2)
    if not warm.any(): return warm
    vm = np.median(v[warm]); return warm & (v >= vm * .55)
def mat_for(a, kind):
    m = np.zeros(a.shape[:2], np.uint8); al = a[..., 3] > 0
    if kind == 'skin': m[skin_mask(a)] = 1
    elif kind == 'outfit':   # clothes keep their colours; only bare skin (if any shows) follows the skin colour
        h, s, v = hsv_img(a); sk = skin_mask(a) & (s >= .32) & (s <= .62) & (v >= .55); lb, n = ndi.label(sk)
        if n: sz = ndi.sum(sk, lb, range(1, n + 1)); sk = np.isin(lb, [j + 1 for j, z in enumerate(sz) if z >= 40])
        m[sk] = 1
    elif kind == 'body':   # the body sheets' shirts have a warm tint: skin must be properly saturated, and no stray specks
        h, s, v = hsv_img(a); sk = skin_mask(a) & (s >= .32); lb, n = ndi.label(sk)
        if n: sz = ndi.sum(sk, lb, range(1, n + 1)); sk = np.isin(lb, [j + 1 for j, z in enumerate(sz) if z >= 25])
        m[sk] = 1
    elif kind in ('hair', 'beard'):
        h, s, v = hsv_img(a)
        if kind == 'hair': m[al & (v > .06)] = 2
        else: m[ndi.binary_erosion(al) | (al & (v > .06))] = 3   # beards: every inner pixel recolours, even the near-black texture; the outline stays
    return m
def cells(img, rows, cols):
    H, W = img.shape[:2]; return [[img[r * H // rows:(r + 1) * H // rows, c * W // cols:(c + 1) * W // cols] for c in range(cols)] for r in range(rows)]
def biggest(part, min_px=60, fill_holes=600):
    m = part[..., 3] > 0; lb, n = ndi.label(m)
    if n == 0: return None, None
    sizes = ndi.sum(m, lb, range(1, n + 1)); keep = np.isin(lb, [j + 1 for j, z in enumerate(sizes) if z >= min_px])
    holes = ndi.binary_fill_holes(keep) & ~keep; hl, hn = ndi.label(holes)
    for j in range(1, hn + 1):
        if (hl == j).sum() < fill_holes: keep |= hl == j
    part = part.copy(); fill = keep & ~m
    if fill.any():
        idx = ndi.distance_transform_edt(~m, return_distances=False, return_indices=True); part[fill, :3] = part[idx[0][fill], idx[1][fill], :3]
    part[..., 3] = keep * 255; ys, xs = np.nonzero(keep)
    return part[ys.min():ys.max() + 1, xs.min():xs.max() + 1], (int(xs.min()), int(ys.min()))
def resize(a, s):
    return np.asarray(Image.fromarray(a).resize((max(1, round(a.shape[1] * s)), max(1, round(a.shape[0] * s))), Image.LANCZOS))

# ---------- the body: 16 frames, and where the head is in each
BASE = fh.BASE; C = fh.C
frames = []; anchors = []
for r in range(4):
    st = fh.cell(r, 1); a1 = st[..., 3] > 0; t1 = np.nonzero(a1.any(1))[0][0]; xs1 = np.nonzero(a1[t1:t1 + 50].any(0))[0]
    for c in range(4):
        fr = fh.cell(r, c); a = fr[..., 3] > 0; t = np.nonzero(a.any(1))[0][0]; xs = np.nonzero(a[t:t + 50].any(0))[0]
        frames.append(fr); anchors.append([round(float((xs[0] + xs[-1]) / 2 - (xs1[0] + xs1[-1]) / 2)), int(t - t1)])
CELL = frames[0].shape[1]

# ---------- the 8 body types: headless sheets in the same 4x4 layout. Each frame is lined up with the base body's same
# frame by its neck and shoulders (best overlap of the band just under the chin), so every head, hair and beard piece
# sits on every body; that shift is stored per body per frame and added to the head pieces' position.
BODY_NAMES = ['Male_Skinny', 'Male_Medium', 'Male_Muscular', 'Male_Large', 'Female_Skinny', 'Female_Medium', 'Female_Muscular', 'Female_Large']
def neck_row(a):
    t = np.nonzero(a.any(1))[0][0]; w = np.array([a[y].sum() for y in range(t + 60, t + 110)]); return t + 60 + int(np.argmin(w))
bodies = []
for bn in BODY_NAMES:
    S = fh.rgba(D + f'bodies/{bn}.png'); out = dict(name=bn, frames=[], offs=[])
    for f in range(16):
        r, c = divmod(f, 4); fr = S[int(r * C):int((r + 1) * C), int(c * C):int((c + 1) * C)]
        H0, W0 = frames[f].shape[:2]; fr = np.pad(fr, ((0, max(0, H0 - fr.shape[0])), (0, max(0, W0 - fr.shape[1])), (0, 0)))[:H0, :W0]
        ba = frames[f][..., 3] > 0; na = fr[..., 3] > 0; yn = neck_row(ba); band = np.zeros_like(ba); band[yn:yn + 40] = True
        ref = ba & band; best = None
        for dy in range(-18, 19):
            for dx in range(-14, 15):
                sh = np.roll(np.roll(na, -dy, 0), -dx, 1) & band   # the new body moved back by (dx, dy)
                iou = (sh & ref).sum() / max(1, (sh | ref).sum())
                if best is None or iou > best[0]: best = (iou, dx, dy)
        out['frames'].append(fr); out['offs'].append([best[1], best[2]])
    tops = []
    for fr in out['frames']:
        a = fr[..., 3] > 0; t = np.nonzero(a.any(1))[0][0]; xs = np.nonzero(a[t:t + 10])[1]; tops.append((float(xs.mean()), int(t)))
    out['tops'] = tops
    bodies.append(out); print('body', bn, 'offs', out['offs'][1], out['offs'][5], out['offs'][13], flush=True)
# The overlap fit is right for the medium male but drifts on bodies built very differently (the muscular male's neck
# starts far higher). So every body uses the medium male's fit, moved by how far its own neck stump's top (and centre)
# sits from his, frame by frame: the head lands on each neck exactly as it does on his.
REFB = bodies[BODY_NAMES.index('Male_Medium')]
for bd in bodies:
    bd['offs'] = [[REFB['offs'][f][0] + round(bd['tops'][f][0] - REFB['tops'][f][0]), REFB['offs'][f][1] + bd['tops'][f][1] - REFB['tops'][f][1]] for f in range(16)]
    print('body', bd['name'], 'final', bd['offs'][1], bd['offs'][5], bd['offs'][13])

# ---------- outfits: each is a whole clothed body, drawn on one of the 8 body types (its folder). Choosing an outfit
# chooses the body. Each frame is lined up with its body type's same frame (best overlap of the whole figure below
# the collar), and the head goes where it goes on that body, moved by the same amount.
outfits = []
for bi, bn in enumerate(BODY_NAMES):
    for p in sorted(glob.glob(D + f'outfits/{bn}/*.png')):
        S = fh.rgba(p); od = dict(name=os.path.basename(p)[:-4].replace('_', ' '), body=bi, frames=[], offs=[])
        for f in range(16):
            r, c = divmod(f, 4); fr = S[int(r * C):int((r + 1) * C), int(c * C):int((c + 1) * C)]
            H0, W0 = frames[f].shape[:2]; fr = np.pad(fr, ((0, max(0, H0 - fr.shape[0])), (0, max(0, W0 - fr.shape[1])), (0, 0)))[:H0, :W0]
            ba = bodies[bi]['frames'][f][..., 3] > 0; oa = fr[..., 3] > 0
            t = np.nonzero(ba.any(1))[0][0]; band = np.zeros_like(ba); band[t + 12:] = True; ref = ba & band; best = None
            for dy in range(-10, 11):
                for dx in range(-10, 11):
                    sh = np.roll(np.roll(oa, -dy, 0), -dx, 1) & band; iou = (sh & ref).sum() / max(1, (sh | ref).sum())
                    if best is None or iou > best[0]: best = (iou, dx, dy)
            od['frames'].append(fr); od['offs'].append([bodies[bi]['offs'][f][0] + best[1], bodies[bi]['offs'][f][1] + best[2]]); od.setdefault('iou', []).append(round(best[0], 2))
            od.setdefault('shift', []).append([best[1], best[2]])
        outfits.append(od); print('outfit', od['name'], 'shift', od['offs'][1], 'iou', min(od['iou']), flush=True)

# ---------- heads: fitted onto each direction's standing head (best overlap of the outlines)
def head_sil(v):
    fr, head, need, forb, top = fh.REG[v]; return head, top
Hs = cells(fh.rgba(D + 'heads_6.png'), 6, 3)          # columns: front, side (left), back
Bs = cells(fh.rgba(D + 'beards_4.png'), 6, 3)
VIEW_OF_COL = {0: 0, 1: 1, 2: 3}
def fit_head(piece, v, fixed=None):
    head, top = head_sil(v); hm = piece[..., 3] > 127
    rows = np.nonzero(head.any(1))[0]; cols = np.nonzero(head.any(0))[0]
    s = fixed or (cols[-1] - cols[0] + 1) / hm.shape[1]
    best = None
    for k in ([1.0] if fixed else np.arange(.96, 1.045, .01)):
        im = resize(piece, s * k); m = im[..., 3] > 127
        from scipy.signal import fftconvolve
        P = 40; H2 = np.pad(head.astype(float), P)
        ov = fftconvolve(H2, m[::-1, ::-1].astype(float)); un = H2.sum() + m.sum() - ov
        iou = ov / np.maximum(un, 1); iy, ix = np.unravel_index(np.argmax(iou), iou.shape)
        if best is None or iou[iy, ix] > best[0]: best = (float(iou[iy, ix]), s * k, int(ix - (m.shape[1] - 1) - P), int(iy - (m.shape[0] - 1) - P))
    return best
# friendlier male faces: the scowl comes out of the brows (inner ends lifted) and the mouth corners turn up.
# Done as a gentle pull of the pixels on the full-size art, so the shading travels with it.
CHEER = {0: (.07, .075), 1: (.07, .075), 2: (.06, .065), 3: (.03, .07)}   # face index: (brow lift, smile), as fractions of head height
def cheer(p, col, brow, smile):
    H, W = p.shape[:2]; yy, xx = np.mgrid[0:H, 0:W].astype(float); g = lambda c, sg: np.exp(-((yy - c * H) / (sg * H)) ** 2)
    if col == 0:   # front
        cx = W / 2; ax = np.abs(xx - cx)
        lift = brow * H * np.clip(1 - ax / (.30 * W), 0, 1) * g(.42, .07)
        lift += smile * H * np.clip(ax / (.14 * W), 0, 1) ** 2 * np.clip((.22 * W - ax) / (.06 * W), 0, 1) * g(.80, .05)
    else:          # side, facing left: the brow's inner end and the mouth's corner are both towards the front
        lift = brow * H * np.clip(1 - (xx - .12 * W) / (.30 * W), 0, 1) * (xx > .04 * W) * g(.40, .07)
        lift += smile * H * np.clip((xx - .06 * W) / (.14 * W), 0, 1) ** 2 * np.clip((.27 * W - xx) / (.05 * W), 0, 1) * g(.76, .045)
    f = p.astype(float); al = f[..., 3:] / 255; f[..., :3] *= al
    out = np.stack([ndi.map_coordinates(f[..., k], [yy + lift, xx], order=1, mode='nearest') for k in range(4)], -1)
    a = np.clip(out[..., 3], 0, 255); out[..., :3] = out[..., :3] / np.maximum(a[..., None] / 255, 1e-3)
    out[..., 3] = p[..., 3]                                  # the outline of the head doesn't move
    return np.clip(out, 0, 255).astype(np.uint8)
def mouth_of(h):   # the mouth's centre on the face as drawn (before the smile), in atlas output coordinates
    a = resize(h['raw'], h['s'] * OUT_SCALE); al = a[..., 3] > 127; v = a[..., :3].max(-1) / 255.; H, W = al.shape
    cs = slice(int(W * .38), int(W * .62)); rows = range(int(H * .72), int(H * .92))
    y = min(rows, key=lambda r: v[r, cs][al[r, cs]].mean() if al[r, cs].any() else 9)
    return [h['x'] * OUT_SCALE + W / 2, h['y'] * OUT_SCALE + y + .5]
heads = []
for i in range(6):
    hv = {}
    for col in range(3):
        piece, (px, py) = biggest(Hs[i][col], fill_holes=4000)
        raw = piece
        if i in CHEER and col in (0, 1): piece = cheer(piece, col, *CHEER[i])
        iou, s, x, y = fit_head(piece, VIEW_OF_COL[col])
        hv[col] = dict(piece=piece, raw=raw, s=s, x=x, y=y, iou=iou, src=(px, py))
    mp = hv[1]['piece'][:, ::-1].copy(); iou, s, x, y = fit_head(mp, 2, fixed=hv[1]['s'])   # facing right: the side view mirrored, same size
    hv['r'] = dict(piece=mp, s=s, x=x, y=y, iou=iou, src=(px, py))
    heads.append(hv); print('head', i + 1, ' '.join(f"{c}:{hv[c]['iou']:.2f}" for c in range(3)), flush=True)
# beards: same cell coordinates as the heads, so they ride on head 1's transform for that view (all heads share a skull)
def seat_side_beard(piece, s):
    """Side view, facing left. The moustache's top-front goes right under the nose; then the beard is leant (a vertical
    shear about the moustache) so its sideburn's top meets the hairline just in front of the ear, as a real beard does."""
    h = heads[0][1]; fa = resize(h['piece'], h['s'])[..., 3] > 127; H, W = fa.shape
    lx = [np.nonzero(fa[y])[0][0] if fa[y].any() else W for y in range(H)]
    rows = range(int(H * .5), int(H * .78)); ny = min(rows, key=lambda y: (lx[y], -y)); nx = lx[ny]
    uy = next((y for y in range(ny + 1, H) if lx[y] >= nx + max(2, W * .05)), ny + 2)
    N = (h['x'] + lx[uy], h['y'] + uy)                                    # just under the nose
    E = (h['x'] + W * .62, h['y'] + H * .40)                              # front of the ear, at the hairline
    b = resize(piece, s); ba = b[..., 3] > 127; bh, bw = ba.shape
    def top_in(x0, x1):
        cols = [x for x in range(int(x0), int(x1)) if ba[:, x].any()]; x = min(cols, key=lambda x: (np.nonzero(ba[:, x])[0][0], x)); return x, np.nonzero(ba[:, x])[0][0]
    mx, my = top_in(0, bw * .3); sx, sy = top_in(bw * .75, bw)
    bx, by = N[0] - mx, N[1] + 1 - my                                     # moustache under the nose
    k = ((E[1]) - (by + sy)) / max(1, sx - mx)                            # lift per pixel back from the moustache
    k = max(-.45, min(.1, k))
    im = Image.fromarray(piece); W0, H0 = im.size; kk = k                 # shear in source pixels (same slope)
    up = int(np.ceil(-kk * W0)) if kk < 0 else 0; dn = int(np.ceil(kk * W0)) if kk > 0 else 0
    mx0 = mx / s
    sh = im.transform((W0, H0 + up + dn), Image.AFFINE, (1, 0, 0, -kk, 1, kk * mx0 - up), resample=Image.BICUBIC)
    print('side beard: lean', round(k, 3), 'nose', N, 'ear', [round(v) for v in E], flush=True)
    return np.asarray(sh), round(bx), round(by - up * s + 0)
beards = []
for i in range(4):
    bv = {}
    for col in range(2):
        raw = Bs[i][col].copy(); rr, gg, bb = [raw[..., k].astype(int) for k in range(3)]
        raw[(rr > 140) & (rr > gg + 60) & (rr > bb + 40), 3] = 0          # the lips drawn in the mouth gap: the face shows through
        m0 = raw[..., 3] > 0; lb0, n0 = ndi.label(m0)
        if n0 > 1:   # stray specks (a dot floated above the goatee): keep only parts at least 8% the size of the beard
            sz0 = ndi.sum(m0, lb0, range(1, n0 + 1)); raw[~np.isin(lb0, [j + 1 for j, z in enumerate(sz0) if z >= .08 * sz0.max()]), 3] = 0
        piece, (px, py) = biggest(raw, min_px=20, fill_holes=0)
        h = heads[0][col]; s = h['s']
        bv[col] = dict(piece=piece, s=s, x=round(h['x'] + (px - h['src'][0]) * s), y=round(h['y'] + (py - h['src'][1]) * s))
        if col == 1:   # side view: seat it by landmarks, then lean it so the sideburn climbs to the hairline
            piece, bv[1]['x'], bv[1]['y'] = seat_side_beard(piece, s)
            bv[1]['piece'] = piece
        if col == 1:   # facing right: the left placement mirrored about the head
            hl, hr = heads[0][1], heads[0]['r']; wl = hl['piece'].shape[1] * hl['s']; bw = piece.shape[1] * s
            bv['r'] = dict(piece=piece[:, ::-1].copy(), s=s, x=round(hr['x'] + wl - (bv[1]['x'] - hl['x']) - bw), y=round(hr['y'] + (bv[1]['y'] - hl['y'])))
    beards.append(bv)
fits = json.load(open(D + 'fits3.json'))

# ---------- pack everything into one atlas
items = []   # (key, rgba, material, x, y)  x, y: placement in the standing frame of its direction, at full source scale
def add(key, rgba, kind, x, y, s=1.0):
    im = resize(rgba, s * OUT_SCALE) if s * OUT_SCALE != 1 else rgba
    items.append((key, im, mat_for(im, kind), x * OUT_SCALE, y * OUT_SCALE))
# a neck to sit behind every outfit: the body type's own neck stump, carried a little way down so hollow collars
# show skin instead of a hole (it takes the skin colour like the rest of the body)
for i, bd in enumerate(bodies):
    for f, fr in enumerate(bd['frames']):
        al = fr[..., 3] > 0; t = np.nonzero(al.any(1))[0][0]; xs = np.nonzero(al[t:t + 8].any(0))[0]
        nk = np.zeros_like(fr); x0, x1 = xs.min() + 1, xs.max(); nk[t:t + 44, x0:x1] = fr[t:t + 44, x0:x1]
        add(f'neck{i}_{f}', nk, 'body', 0, 0)
for i, od in enumerate(outfits):
    for f, fr in enumerate(od['frames']): add(f'outfit{i}_{f}', fr, 'outfit', 0, 0)
DIRV = {0: 0, 1: 1, 3: 2}   # direction -> head column
for i, hv in enumerate(heads):
    for d, col in ((0, 0), (1, 1), (2, 'r'), (3, 2)):
        h = hv[col]; add(f'head{i}_{d}', h['piece'], 'skin', h['x'], h['y'], h['s'])
for i, bv in enumerate(beards):
    for d, col in ((0, 0), (1, 1), (2, 'r')):
        b = bv[col]; add(f'beard{i}_{d}', b['piece'], 'beard', b['x'], b['y'], b['s'])
HAIR_NAMES = sorted(fits)
# the head the player sees is the face piece, not the body's own head. The approved fits (fits3) sit on the body's head,
# so carry each one across onto the face piece: same spot relative to the head's top centre, scaled with the head.
def bbox(m):
    ys, xs = np.nonzero(m); return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
HF = {}
MAP = {}
for d, col in ((0, 0), (1, 1), (3, 2)):
    bx0, by0, bx1, by1 = bbox(fh.REG[d][1])
    h = heads[0][col]; m = resize(h['piece'], h['s'])[..., 3] > 127; fx0, fy0, fx1, fy1 = bbox(m)
    fx0 += h['x']; fx1 += h['x']; fy0 += h['y']
    MAP[d] = ((bx0 + bx1) / 2, by0, (fx0 + fx1) / 2, fy0, (fx1 - fx0) / (bx1 - bx0))
    print('map', d, [round(float(v), 2) for v in MAP[d]])
# Fitting only moves and scales, but the face pieces' skulls are a different shape from the bald body the hair was fitted
# on (fuller forehead, rounder crown). So each hair piece is reshaped: along every direction out from the head's centre,
# hair that sat on the body's scalp is pushed (or pulled) to sit on the face piece's scalp, and everything further out
# moves with it, keeping its thickness. Below the ears nothing changes, so braids and long hair hang as drawn.
from scipy import ndimage as ndi
M = 220
def face_mask(d, col):
    base = fh.REG[d][1]; h = heads[0][col]; im = resize(h['piece'], h['s'])[..., 3] > 127
    fm = np.zeros((base.shape[0] + 2 * M, base.shape[1] + 2 * M), bool); fm[h['y'] + M:h['y'] + M + im.shape[0], h['x'] + M:h['x'] + M + im.shape[1]] = im
    return fm[M:-M, M:-M]
def radii(m, c):
    T = np.radians(np.arange(360)); R = np.zeros(360)
    for i, t in enumerate(T):
        rs = np.arange(0, 200, .5); xs = np.round(c[0] + rs * np.cos(t)).astype(int); ys = np.round(c[1] + rs * np.sin(t)).astype(int)
        ok = (xs >= 0) & (ys >= 0) & (xs < m.shape[1]) & (ys < m.shape[0]); inside = np.zeros_like(rs, bool); inside[ok] = m[ys[ok], xs[ok]]
        R[i] = rs[np.nonzero(inside)[0][-1]] if inside.any() else 0
    return R
WARP = {}
for d, col in ((0, 0), (1, 1), (3, 2)):
    bm = fh.REG[d][1]; fm = face_mask(d, col)
    ys, xs = np.nonzero(bm); c = ((xs.min() + xs.max()) / 2, ys.min() + .55 * (ys.max() - ys.min()))
    Rb, Rf = radii(bm, c), radii(fm, c)
    k = np.ones(9) / 9; sm = lambda a: np.convolve(np.r_[a[-4:], a, a[:4]], k, 'valid')
    Rb, Rf = sm(Rb), sm(Rf); up = -np.sin(np.radians(np.arange(360))); w = np.clip((up + .5) / .5, 0, 1)
    ok = (Rb > 5) & (Rf > 5); Rf = np.where(ok, Rb + (Rf - Rb) * w, Rb)
    WARP[d] = (c, Rb, Rf); print('warp', d, 'max push', round(float((Rf - Rb).max()), 1), 'max pull', round(float((Rf - Rb).min()), 1))
def warp(img, s, x, y, d):
    c, Rb, Rf = WARP[d]; im = resize(img, s).astype(float); H, W = fh.REG[d][1].shape
    cv = np.zeros((H + 2 * M, W + 2 * M, 4)); y0, x0 = y + M, x + M
    cv[y0:y0 + im.shape[0], x0:x0 + im.shape[1]] = im
    a = cv[..., 3:] / 255; cv[..., :3] *= a                       # premultiply so edges don't fringe
    yy, xx = np.mgrid[0:cv.shape[0], 0:cv.shape[1]].astype(float); dx, dy = xx - (c[0] + M), yy - (c[1] + M)
    r = np.hypot(dx, dy); th = np.degrees(np.arctan2(dy, dx)) % 360; i0 = np.floor(th).astype(int) % 360; f = th - np.floor(th)
    rb = Rb[i0] * (1 - f) + Rb[(i0 + 1) % 360] * f; rf = Rf[i0] * (1 - f) + Rf[(i0 + 1) % 360] * f
    src = np.where(r < rf, r * rb / np.maximum(rf, 1e-3), r - (rf - rb)); sc = src / np.maximum(r, 1e-3)
    sx, sy = (c[0] + M) + dx * sc, (c[1] + M) + dy * sc
    out = np.stack([ndi.map_coordinates(cv[..., k], [sy, sx], order=1) for k in range(4)], -1)
    al = np.clip(out[..., 3], 0, 255); rgb = out[..., :3] / np.maximum(al[..., None] / 255, 1e-3); al[al < 8] = 0
    out = np.dstack([np.clip(rgb, 0, 255), al]).astype(np.uint8)
    ys, xs = np.nonzero(out[..., 3]); out = out[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    return out, xs.min() - M, ys.min() - M
# Side views get a last check against the face itself: hair mustn't jut out in front of the face (past the forehead,
# over the brow or cheek), and it should cover the scalp from the hairline back to the nape. Each style's side piece
# is resized (a little) and slid (a few px) to the spot that does both best, staying put if it already does.
FM1 = face_mask(1, 1); _ys, _xs = np.nonzero(FM1); FT, FB = _ys.min(), _ys.max(); FH = FB - FT
FLX = np.full(FM1.shape[0], 10 ** 6); FRX = np.full(FM1.shape[0], -1)
for _y in range(FT, FB + 1):
    _r = np.nonzero(FM1[_y])[0]
    if len(_r): FLX[_y], FRX[_y] = _r[0], _r[-1]
_yy, _xx = np.mgrid[0:FM1.shape[0], 0:FM1.shape[1]]
_xf, _xb = _xs.min(), _xs.max()
SCALP1 = FM1 & (_yy < FT + FH * (.22 + .40 * np.clip((_xx - _xf) / max(1, _xb - _xf), 0, 1)))
FRONT1 = (_yy > FT + .15 * FH) & (_yy < FB) & (_xx < FLX[:, None] - 3)       # in front of the face's profile
def refine_side(img, s, x, y, top_rel):
    H0, W0 = FM1.shape; best = None
    for k in np.arange(.70, 1.041, .03):
        hm = resize(img, s * k)[..., 3] > 127; h, w = hm.shape
        bx = x + (img.shape[1] * s) * (1 - k) / 2; by = y + (img.shape[0] * s) * (1 - k) * .25
        for dx in range(-2, 16, 2):
            for dy in range(-6, 31, 2):
                X, Y = int(round(bx + dx)), int(round(by + dy)); cv = np.zeros((H0, W0), bool)
                x0, y0, x1, y1 = max(0, X), max(0, Y), min(W0, X + w), min(H0, Y + h)
                if x1 <= x0 or y1 <= y0: continue
                cv[y0:y1, x0:x1] = hm[y0 - Y:y1 - Y, x0 - X:x1 - X]
                rows = np.nonzero(cv.any(1))[0]; tr = rows[0] - FT if len(rows) else 0
                # the same hairdo is as tall over the crown from the side as from the front (within a few px)
                sc = 2 * (cv & FRONT1).sum() + (SCALP1 & ~cv).sum() + 300 * abs(k - 1) + 2 * (abs(dx) + abs(dy)) + 20 * max(0, abs(tr - top_rel) - 6)
                if best is None or sc < best[0]: best = (sc, k, X, Y)
    return best
# Squeeze: from the side, hair must hug the skull. Its front may come at most 2px past the forehead and its back at
# most 2px past the back of the skull (4px for long, loose styles), measured over the crown. Where a style is drawn
# wider than that, it is squeezed front-to-back (never more than to 78%) so both edges land on the head.
_fr = lambda a, b: FM1[FT + int(a * FH):FT + int(b * FH)]
SKF = np.nonzero(_fr(.15, .30).any(0))[0].min(); SKB = np.nonzero(_fr(0, .45).any(0))[0].max()
LOOSE = {'bob', 'copper_bob', 'black_curls', 'plum_black_waves'}
NOBACK = {'chestnut_bun', 'dark_chocolate_high_ponytail'}          # their bun / tail is meant to stand out behind
def squeeze_side(n, img, s, x, y):
    im = resize(img, s); al = im[..., 3] > 127; H0 = al.shape[0]
    def cols(r0, r1):
        a0, a1 = max(0, r0 - y), min(H0, r1 - y)
        c = np.nonzero(al[a0:a1].any(0))[0] if a1 > a0 else []
        return (c.min() + x, c.max() + x) if len(c) else (None, None)
    hF, _ = cols(-10 ** 6, FT + int(.30 * FH)); _, hB = cols(FT, FT + int(.45 * FH))
    if hF is None or hB is None: return img, x
    F = max(hF, SKF - 4); B = hB if n in NOBACK else min(hB, SKB + (8 if n in LOOSE else 4))
    sx = max(.78, min(1.0, (B - F) / max(1, hB - hF)))
    if sx > .995 and F == hF: return img, x
    w0, h0 = img.shape[1], img.shape[0]; sq = np.asarray(Image.fromarray(img).resize((max(1, round(w0 * sx)), h0), Image.LANCZOS))
    nx = round(F - (hF - x) * sx)                                   # the front edge lands on F
    print('squeeze', n, 'to', round(sx, 2), 'front', hF - SKF, '->', F - SKF, 'back', hB - SKB, '->', round(nx + (hB - x) * sx) - SKB, flush=True)
    return sq, nx
for n in HAIR_NAMES:
    V = fh.views(D + f'hair_{n}.png'); P = {}
    for d in (0, 1, 3):
        bcx, btop, fcx, ftop, k = MAP[d]; r = fits[n][d]
        hs, hx, hy = r['s'] * k, round(fcx + (r['x'] - bcx) * k), round(ftop + (r['y'] - btop) * k)
        if d == 1:
            fim, fx, fy = P[0]; ftop = np.nonzero(face_mask(0, 0).any(1))[0][0]
            sc, kk, hx, hy = refine_side(V[1], hs, hx, hy, fy + np.nonzero(fim[..., 3].any(1))[0][0] - ftop); hs *= kk; print('side', n, 'size', round(kk, 2), 'score', int(sc), flush=True)
            V[1], hx = squeeze_side(n, V[1], hs, hx, hy)
        P[d] = warp(V[d], hs, hx, hy, d)
    hl, hr = heads[0][1], heads[0]['r']; wl = hl['piece'].shape[1] * hl['s']; im, lx, ly = P[1]
    P[2] = (im[:, ::-1].copy(), round(hr['x'] + wl - (lx - hl['x']) - im.shape[1]), round(hr['y'] + (ly - hl['y'])))
    for d in (0, 1, 2, 3):
        im, x, y = P[d]; add(f'hair_{n}_{d}', im, 'hair', x, y, 1.0)
    print('hair', n, flush=True)
# shelf packing
items.sort(key=lambda t: -t[1].shape[0]); W = 2048; x = y = rowh = 0; place = {}
for key, im, mt, px, py in items:
    w, h = im.shape[1], im.shape[0]
    if x + w > W: x = 0; y += rowh + 2; rowh = 0
    place[key] = (x, y, w, h); x += w + 2; rowh = max(rowh, h)
H = y + rowh
atlas = np.zeros((H, W, 4), np.uint8); mat = np.zeros((H, W), np.uint8)
meta = {}
for key, im, mt, px, py in items:
    x, y, w, h = place[key]; atlas[y:y + h, x:x + w] = im; mat[y:y + h, x:x + w] = mt * 60
    meta[key] = dict(f=[x, y, w, h], at=[round(float(px), 1), round(float(py), 1)])
Image.fromarray(atlas).save(OUT + 'cc_atlas.webp', 'WEBP', lossless=True, quality=100, method=6)
Image.fromarray(mat).save(OUT + 'cc_mat.png', optimize=True)
json.dump(dict(cell=round(CELL * OUT_SCALE), anchors=[[a[0] * OUT_SCALE, a[1] * OUT_SCALE] for a in anchors], pieces=meta,
               hair=HAIR_NAMES, heads=6, beards=4, bob=[2, 0, 2, 0],
               bodies=[b['name'].replace('_', ' ') for b in bodies], mouths=[mouth_of(h[0]) for h in heads],
               outfits=[dict(name=o['name'], body=o['body'], offs=[[v[0] * OUT_SCALE, v[1] * OUT_SCALE] for v in o['offs']], neck=[[v[0] * OUT_SCALE, v[1] * OUT_SCALE] for v in o['shift']]) for o in outfits]), open(OUT + 'cc.json', 'w'), separators=(',', ':'))
print('atlas', atlas.shape, os.path.getsize(OUT + 'cc_atlas.webp') // 1024, 'KB')
import subprocess, sys
subprocess.run([sys.executable, 'tools/art/nudge_beards.py'], check=True)   # settle the beards onto the jaws
