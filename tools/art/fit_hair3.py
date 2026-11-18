"""Creator test 3 (18 Nov 2026): bald base (art_incoming/creator/v3/base_walk.png, 4x4, rows down/left/right/up)
and hairstyle sheets (hair_*.png: front, back, side facing left). For each hairstyle one scale for all its views, the
smallest at which every view covers the whole top of the skull while touching none of the face (eyes, brows, nose,
mouth); then each view's position. Right-facing = the left view mirrored. Writes fits3.json and check images."""
import numpy as np, json, glob, os, sys
from PIL import Image
from scipy import ndimage as ndi
from scipy.signal import fftconvolve
D = 'art_incoming/creator/v3/'
def rgba(p):
    a = np.asarray(Image.open(p).convert('RGB')).astype(int); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    m = ndi.binary_opening(~((r > 150) & (b > 150) & (g < 130)), iterations=1)
    pinkish = (b > g + 25) & (r > g + 25)                      # magenta has crept into these pixels
    edge = m & ~ndi.binary_erosion(m, iterations=2)
    m = ndi.binary_erosion(m, iterations=1) | (m & ~((r > 140) & (b > 120) & (g < 110)))   # (as approved)
    a = a.copy(); rim = m & edge & pinkish; a[rim] = (a[rim] * .35).astype(int)       # pink rim pixels become outline
    spill = m & ((b > g + 12) & (r > g + 12)) & ~rim              # pink-tinged pixels inside: paint them with the hair round them
    good = m & ~spill & ~rim
    if spill.any() and good.any():
        idx = ndi.distance_transform_edt(~good, return_distances=False, return_indices=True)
        a[spill] = a[idx[0][spill], idx[1][spill]]
    return np.dstack([a, m * 255]).astype(np.uint8)
BASE = rgba(D + 'base_walk.png'); C = BASE.shape[0] / 4
def cell(r, c):
    t = BASE[int(r * C):int((r + 1) * C), int(c * C):int((c + 1) * C)]; return t
def head_regions(v):
    fr = cell(v, 1); a = fr[..., 3] > 0; rgb = fr[..., :3].astype(int); mx = rgb.max(-1)
    top = np.nonzero(a.any(1))[0][0]; HH = 84
    head = a.copy(); head[top + HH:] = False
    inner = ndi.binary_erosion(head, iterations=8)
    feat = inner & (mx < 100); feat[:top + 22] = False; feat[top + HH - 6:] = False          # eyes, brows, nostril, mouth line
    mouth = inner & (rgb[..., 0] > 150) & (rgb[..., 1] < 110)          # reddish mouth
    feat |= mouth
    lb, n = ndi.label(feat); keep = np.zeros_like(feat)
    for i in range(1, n + 1):
        if (lb == i).sum() >= 3: keep |= lb == i
    feat = keep
    if v == 3 or not feat.any():   # back view: no face
        need = head.copy(); need[top + int(HH * .55):] = False; forb = np.zeros_like(head); ftop = None
    else:
        ys = np.nonzero(feat.any(1))[0]; ftop = ys[0]
        need = head.copy(); need[(top + int((ftop - top) * .55)) if v == 0 else ftop - 6:] = False   # front: a fringe or parting may show some forehead
        forb = ndi.binary_dilation(feat, iterations=2)
        cols = np.nonzero(head.any(0))[0]; x0, x1 = cols[0], cols[-1]; w = x1 - x0
        if v == 0: forb[:, :x0 + int(w * .2)] = False; forb[:, x1 - int(w * .2):] = False
        elif v == 1: forb[:, x0 + int(w * .5):] = False     # facing left: the face is the left half
        elif v == 2: forb[:, :x1 - int(w * .5)] = False
    if v in (1, 2):   # side views: the hair also has to come down the back of the head to the nape
        cols = np.nonzero(head.any(0))[0]; x0, x1 = cols[0], cols[-1]; w = x1 - x0
        nape = head.copy(); nape[top + int(HH * .72):] = False
        if v == 1: nape[:, :x1 - int(w * .30)] = False
        else: nape[:, x0 + int(w * .30):] = False
        NAPE[v] = nape
    return fr, head, need, forb, top
NAPE = {}
REG = [head_regions(v) for v in range(4)]
def views(path):
    """Front, back and side (facing left) sit in the left, middle and right thirds of the image. Everything in a third
    belongs to that view, loose strands included; small enclosed holes (dark highlights taken for background) are filled."""
    H = rgba(path); W = H.shape[1]; out = []
    for i in range(3):
        part = H[:, i * W // 3:(i + 1) * W // 3].copy(); m = part[..., 3] > 0
        lb, n = ndi.label(m); sizes = ndi.sum(m, lb, range(1, n + 1))
        keep = np.isin(lb, [j + 1 for j, z in enumerate(sizes) if z >= 60])     # drop specks
        holes = ndi.binary_fill_holes(keep) & ~keep; hl, hn = ndi.label(holes)
        for j in range(1, hn + 1):
            if (hl == j).sum() < 600: keep |= hl == j
        fill = keep & ~m
        if fill.any():
            idx = ndi.distance_transform_edt(~m, return_distances=False, return_indices=True)
            part[fill, :3] = part[idx[0][fill], idx[1][fill], :3]
        part[..., 3] = keep * 255
        ys, xs = np.nonzero(keep); out.append(part[ys.min():ys.max() + 1, xs.min():xs.max() + 1])
    f, bk, sd = out
    return {0: f, 1: sd, 2: sd[:, ::-1].copy(), 3: bk}
def best_pos(piece, s, v, nape=False, crown=False):
    fr, head, need, forb, top = REG[v]
    if crown: need = need.copy(); ys = np.nonzero(need.any(1))[0]; need[ys[0] + int((ys[-1] - ys[0]) * .45):] = False
    if nape and v in NAPE: need = need | NAPE[v]
    im = np.asarray(Image.fromarray(piece).resize((max(1, round(piece.shape[1] * s)), max(1, round(piece.shape[0] * s))), Image.LANCZOS)); hm = im[..., 3] > 127
    P = 120; pd = lambda m: np.pad(m.astype(float), P); k = hm[::-1, ::-1].astype(float)
    cov = np.rint(fftconvolve(pd(need), k)); bad = np.rint(fftconvolve(pd(forb), k)); on = fftconvolve(pd(head), k)
    N = need.sum(); q = cov / N - bad * 0.05 + on / (N * 500.)
    iy, ix = np.unravel_index(np.argmax(q), q.shape)
    return dict(s=s, x=int(ix - (hm.shape[1] - 1) - P), y=int(iy - (hm.shape[0] - 1) - P), w=im.shape[1], h=im.shape[0], cov=float(cov[iy, ix] / N), face=int(bad[iy, ix])), im
TUNE = {'shaggy': 1}
FIX = {'bob': .53, 'swept': .365}   # the user approved these as they are
def fit(path):
    V = views(path); best = None; nm = os.path.basename(path)[5:-4]
    for s in ([FIX[nm]] if nm in FIX else np.arange(.28, .62, .005)):
        res = [best_pos(V[v], round(float(s), 3), v)[0] for v in range(4)]
        ok = all(r['cov'] >= .995 and r['face'] == 0 for r in res)
        if ok:
            best = res
            if TUNE.get(os.path.basename(path)[5:-4]):   # tighten one style's views; both sides share one scale
                best = list(res)
                for vs in ([0], [1, 2], [3]):
                    for k in np.arange(.86, 1.3001, .02):
                        cand = [best_pos(V[v], round(float(s * k), 4), v, True)[0] for v in vs]
                        if all(r['cov'] >= .995 and r['face'] == 0 for r in cand):
                            for v, r in zip(vs, cand): best[v] = r
                            break
            break
    alt = None
    if nm not in FIX:   # long or centre-parted styles: size from the side and back views, the front only needs the crown
        for s in np.arange(.30, .62, .005):
            res = [best_pos(V[v], round(float(s), 3), v)[0] for v in (1, 2, 3)]
            if all(r['cov'] >= .99 and r['face'] == 0 for r in res):
                f0 = best_pos(V[0], round(float(s), 3), 0, crown=True)[0]
                if f0['face'] == 0 and f0['cov'] >= .99: alt = [f0] + res; break
    if alt and (best is None or alt[1]['s'] < best[1]['s']): best = alt
    if best is None:   # report the closest
        sc = []
        for s in np.arange(.28, .62, .01):
            res = [best_pos(V[v], round(float(s), 3), v)[0] for v in range(4)]
            sc.append((sum(r['cov'] for r in res) - sum(r['face'] for r in res) / 50, res))
        best = max(sc, key=lambda t: t[0])[1]
    return V, best
def compose(V, fits, v, col):
    fr = cell(v, col); fr1 = cell(v, 1); r = fits[v]
    a1 = fr1[..., 3] > 0; a = fr[..., 3] > 0
    t1 = np.nonzero(a1.any(1))[0][0]; t = np.nonzero(a.any(1))[0][0]
    xs1 = np.nonzero(a1[t1:t1 + 50].any(0))[0]; xs = np.nonzero(a[t:t + 50].any(0))[0]
    dx = round((xs[0] + xs[-1]) / 2 - (xs1[0] + xs1[-1]) / 2); dy = t - t1
    im = Image.fromarray(V[v]).resize((r['w'], r['h']), Image.LANCZOS)
    cv = Image.fromarray(fr.copy()); cv.alpha_composite(im, (r['x'] + dx, r['y'] + dy)) if r['x'] + dx >= 0 and r['y'] + dy >= 0 else cv.paste(im, (r['x'] + dx, r['y'] + dy), im)
    return cv
if __name__ == '__main__':
    out = {}; rows = []
    for p in sorted(glob.glob(D + 'hair_*.png')):
        name = os.path.basename(p)[5:-4]; V, fits = fit(p); out[name] = fits
        print(name, 'scale', fits[0]['s'], ' '.join(f"v{v}: cover {fits[v]['cov']:.3f} face {fits[v]['face']}" for v in range(4)), flush=True)
        rows.append((name, V, fits))
    json.dump(out, open(D + 'fits3.json', 'w'), indent=1)
    cw = int(C); Z = 2
    sheet = Image.new('RGBA', (cw * 4, 150 * (len(rows) + 1)), (190, 214, 190, 255))
    for v in range(4): sheet.alpha_composite(Image.fromarray(cell(v, 1)).crop((0, 0, cw, 150)), (v * cw, 0))
    for i, (name, V, fits) in enumerate(rows):
        for v in range(4): sheet.alpha_composite(compose(V, fits, v, 1).crop((0, 0, cw, 150)), (v * cw, (i + 1) * 150))
    sheet.resize((sheet.width * Z // 2, sheet.height * Z // 2), Image.NEAREST).save('/tmp/fit3_heads.png')
    frames = []
    for f in range(4):
        cv = Image.new('RGBA', (cw * 4, cw * len(rows)), (190, 214, 190, 255))
        for i, (name, V, fits) in enumerate(rows):
            for v in range(4): cv.alpha_composite(compose(V, fits, v, f), (v * cw, i * cw))
        frames.append(cv.convert('RGB'))
    frames[0].save('/tmp/fit3_walk.gif', save_all=True, append_images=frames[1:], duration=170, loop=0)
