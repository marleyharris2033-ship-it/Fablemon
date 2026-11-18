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
import json, os, sys, importlib.util
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
    elif kind in ('hair', 'beard'):
        h, s, v = hsv_img(a); m[al & (v > .06)] = 2 if kind == 'hair' else 3
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
heads = []
for i in range(6):
    hv = {}
    for col in range(3):
        piece, (px, py) = biggest(Hs[i][col], fill_holes=4000)
        iou, s, x, y = fit_head(piece, VIEW_OF_COL[col])
        hv[col] = dict(piece=piece, s=s, x=x, y=y, iou=iou, src=(px, py))
    mp = hv[1]['piece'][:, ::-1].copy(); iou, s, x, y = fit_head(mp, 2, fixed=hv[1]['s'])   # facing right: the side view mirrored, same size
    hv['r'] = dict(piece=mp, s=s, x=x, y=y, iou=iou, src=(px, py))
    heads.append(hv); print('head', i + 1, ' '.join(f"{c}:{hv[c]['iou']:.2f}" for c in range(3)), flush=True)
# beards: same cell coordinates as the heads, so they ride on head 1's transform for that view (all heads share a skull)
beards = []
for i in range(4):
    bv = {}
    for col in range(2):
        raw = Bs[i][col].copy(); rr, gg, bb = [raw[..., k].astype(int) for k in range(3)]
        raw[(rr > 140) & (rr > gg + 60) & (rr > bb + 40), 3] = 0          # the lips drawn in the mouth gap: the face shows through
        piece, (px, py) = biggest(raw, min_px=20, fill_holes=0)
        h = heads[0][col]; s = h['s']
        bv[col] = dict(piece=piece, s=s, x=round(h['x'] + (px - h['src'][0]) * s), y=round(h['y'] + (py - h['src'][1]) * s))
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
for f, fr in enumerate(frames): add(f'body_{f}', fr, 'skin', 0, 0)
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
for n in HAIR_NAMES:
    V = fh.views(D + f'hair_{n}.png'); out = {}
    for d in (0, 1, 3):
        bcx, btop, fcx, ftop, k = MAP[d]; r = fits[n][d]
        out[d] = dict(s=r['s'] * k, x=round(fcx + (r['x'] - bcx) * k), y=round(ftop + (r['y'] - btop) * k))
        out[d]['w'] = round(V[d].shape[1] * out[d]['s'])
    hl, hr = heads[0][1], heads[0]['r']; wl = hl['piece'].shape[1] * hl['s']; l = out[1]
    out[2] = dict(s=l['s'], x=round(hr['x'] + wl - (l['x'] - hl['x']) - l['w']), y=round(hr['y'] + (l['y'] - hl['y'])))
    HF[n] = out
    for d in (0, 1, 2, 3):
        r = out[d]; add(f'hair_{n}_{d}', V[d], 'hair', r['x'], r['y'], r['s'])
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
               hair=HAIR_NAMES, heads=6, beards=4, bob=[2, 0, 2, 0]), open(OUT + 'cc.json', 'w'), separators=(',', ':'))
print('atlas', atlas.shape, os.path.getsize(OUT + 'cc_atlas.webp') // 1024, 'KB')
import subprocess, sys
subprocess.run([sys.executable, 'tools/art/nudge_beards.py'], check=True)   # settle the beards onto the jaws
