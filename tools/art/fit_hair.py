"""Exact hair fitting (18 Nov 2026). For each hairstyle and view, find the scale and position at which the hair
covers ALL of the base's own short hair (and the head outline round it) while touching none of the face (eyes, nose,
mouth; the front of the face in side views). One scale per hairstyle, shared by its four views; the smallest that
works, so the hair hugs the head. Writes art_incoming/creator/v2/fits.json and /tmp/fit_*.png."""
import importlib.util, numpy as np, json
from PIL import Image
from scipy import ndimage as ndi
from scipy.signal import fftconvolve
spec = importlib.util.spec_from_file_location('c', 'tools/art/cut_creator2.py'); c = importlib.util.module_from_spec(spec); spec.loader.exec_module(c)
def regions(v):
    fr, _ = c.cell(c.BASE, v, 1); a = fr[..., 3] > 0; rgb = fr[..., :3].astype(int); r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]; mx = rgb.max(-1)
    top = np.nonzero(a.any(1))[0][0]; H = 66   # head rows
    skin = a & (mx > 170) & (g > r * .55) & (r > b + 40)
    hair = a & (mx > 60) & (mx < 190) & (g < r * .55)
    hair[top + H:] = False
    head = a.copy(); head[top + H:] = False
    skin_rows = [y for y in range(top, top + H) if skin[y].sum() > 6]
    brow = skin_rows[0] if skin_rows else top + 20
    chin = max(y for y in range(top, top + H) if skin[y].any())
    cols = np.nonzero(head.any(0))[0]; x0, x1 = cols[0], cols[-1]; w = x1 - x0
    hair[brow + 3:] = False   # the short hair above the brow line (no sideburn wisps: a fringe or long hair may leave them)
    need = ndi.binary_dilation(hair, iterations=3) & head; need[brow:] = False; need |= hair
    forb = skin.copy(); forb[:brow + 5] = False; forb[chin + 1:] = False
    if v == 0: forb[:, :x0 + int(w * .14)] = False; forb[:, x1 - int(w * .14):] = False
    elif v == 1: forb[:, x0 + int(w * .55):] = False   # facing left: face on the left
    elif v == 2: forb[:, :x1 - int(w * .55)] = False
    else: forb[:] = False
    return fr, need, forb, head
def score_map(hmask, need, forb, head):
    k = hmask[::-1, ::-1].astype(float)
    cov = fftconvolve(need.astype(float), k, 'full'); bad = fftconvolve(forb.astype(float), k, 'full'); on = fftconvolve(head.astype(float), k, 'full')
    return np.rint(cov), np.rint(bad), on
def fit_view(st, v, s, sy=None):
    fr, need, forb, head = regions(v); hp, _ = c.cell(c.HAIRS[st], v, 1)
    sy = sy or s; im = np.asarray(Image.fromarray(hp).resize((max(1, round(hp.shape[1] * s)), max(1, round(hp.shape[0] * sy))), Image.LANCZOS)); hm = im[..., 3] > 127
    # pad the base so the hair can hang outside it
    P = 80; pad = lambda m: np.pad(m, P)
    cov, bad, on = score_map(hm, pad(need), pad(forb), pad(head))
    N = need.sum()
    q = cov / N - bad / 40.0 + on / (N * 400.0)   # cover all the base hair, avoid the face, then sit on the head
    iy, ix = np.unravel_index(np.argmax(q), q.shape)
    if DIAG: print('   view', v, 's', s, 'cover %.3f' % (cov[iy, ix] / N), 'face px', int(bad[iy, ix]))
    if cov[iy, ix] < N * TOL or bad[iy, ix] > FACE: return None
    # full-convolution index -> top-left of the hair in base coords
    y = iy - (hm.shape[0] - 1) - P; x = ix - (hm.shape[1] - 1) - P
    return dict(s=s, sy=sy, x=int(x), y=int(y), w=im.shape[1], h=im.shape[0], cov=float(cov[iy, ix] / N), face=int(bad[iy, ix]))
import sys
DIAG = 'diag' in sys.argv; TOL = .97; FACE = 6
fits = {}
for st in range(4):
    res = []
    for v in range(4):
        best = None
        for sx in np.arange(.40, .76, .02):
            for sy in np.arange(.40, .76, .02):
                r = fit_view(st, v, round(float(sx), 2), round(float(sy), 2))
                if r and (best is None or sx * sy < best[0]): best = (sx * sy, r)
        res.append(best and best[1])
        print('style', st, 'view', v, best and {k: (round(x, 3) if isinstance(x, float) else x) for k, x in best[1].items()}, flush=True)
    fits[st] = res if all(res) else None
json.dump(fits, open('art_incoming/creator/v2/fits.json', 'w'), indent=1)
# render: 1:1 heads (zoomed x3) and full bodies
Z = 3; o = Image.new('RGBA', (4 * 170 * Z, 5 * 130 * Z), (190, 214, 190, 255))
def comp(st, v, col):
    fr, _ = c.cell(c.BASE, v, col); r = fits[st][v]; hp, _ = c.cell(c.HAIRS[st], v, 1)
    # the walking frames bob: line the head top of this frame up with the standing frame's
    top_s = np.nonzero(c.cell(c.BASE, v, 1)[0][..., 3].any(1))[0][0]; top_f = np.nonzero(fr[..., 3].any(1))[0][0]
    xs_s = np.nonzero(c.cell(c.BASE, v, 1)[0][top_s:top_s + 40, :, 3].any(0))[0]; xs_f = np.nonzero(fr[top_f:top_f + 40, :, 3].any(0))[0]
    dx = (xs_f[0] + xs_f[-1]) / 2 - (xs_s[0] + xs_s[-1]) / 2; dy = top_f - top_s
    im = Image.fromarray(hp).resize((r['w'], r['h']), Image.LANCZOS)
    cv = Image.new('RGBA', (fr.shape[1] + 200, fr.shape[0] + 160)); cv.alpha_composite(Image.fromarray(c.debald(fr)), (100, 120))
    cv.alpha_composite(im, (int(round(100 + r['x'] + dx)), int(round(120 + r['y'] + dy)))); return cv
for v in range(4):
    fr, _ = c.cell(c.BASE, v, 1); h = Image.fromarray(fr).crop((0, 0, fr.shape[1], 110)); o.alpha_composite(h.resize((h.width * Z, h.height * Z), Image.NEAREST), (v * 170 * Z + 20 * Z, 0))
for st in range(4):
    if not fits[st]: continue
    for v in range(4):
        cv = comp(st, v, 1).crop((80, 70, 250, 200)); o.alpha_composite(cv.resize((170 * Z, 130 * Z), Image.NEAREST), (v * 170 * Z, (st + 1) * 130 * Z))
o.save('/tmp/fit_heads.png')
frames = []
for f in range(4):
    cv = Image.new('RGBA', (4 * 340, 4 * 420), (190, 214, 190, 255))
    for st in range(4):
        if not fits[st]: continue
        for v in range(4): cv.alpha_composite(comp(st, v, f).crop((10, 40, 350, 460)), (v * 340, st * 420))
    frames.append(cv.resize((680, 840), Image.LANCZOS).convert('RGB'))
frames[0].save('/tmp/fit_walk.gif', save_all=True, append_images=frames[1:], duration=170, loop=0)
