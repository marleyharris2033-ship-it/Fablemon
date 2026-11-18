"""Painted Derby tracks (18 Nov 2026).
For each picture in art_incoming/derby_tracks/<key>.png: find the road (flood fill or colour match from seed
points), bridge gaps (start line, root arches, plank bridges), skeletonise, prune spurs, follow the loop from the
start line in the race direction, smooth it and write src/derby_tracks.json:
  { key: { w, h, line: [[x, y], ...] (image px, every ~8px, starting at the start line), half: road half-width (px) } }
plus src/track_<key>.webp (the picture) and /tmp/ct_<key>.png (check overlay). Mudrun's alternative routes are in
the json too (alt: {...}).  usage: python3 tools/art/cut_tracks.py [key ...]"""
import sys, json, os, warnings, numpy as np
warnings.filterwarnings('ignore')
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
from skimage import color, filters, morphology, measure, segmentation, draw
SRC = 'art_incoming/derby_tracks/'; OUT = 'src/'
CFG = {
  'meadow': dict(flood=((400, 820), 14), start=(742, 820), dir=(1, 0)),
  'bramble': dict(flood=((200, 700), 22), start=(198, 545), dir=(0, 1)),
  # the bog floods mid-race: 'line' is the dry route (round the far east side), 'alt' the one through the middle of the bog
  'mudrun': dict(flood=((400, 925), 14), bridges=[(690, 920, 890, 920, 40)], start=(780, 920), dir=(-1, 0),
                 via=[(100, 600), (300, 120), (1150, 170), (1420, 520), (1400, 860)],
                 alt=[(100, 600), (300, 120), (600, 330), (450, 545), (600, 790)]),
  'gale': dict(colour=(9, 7, 5, [(1000, 885), (1390, 700), (1300, 400), (1290, 260), (1400, 150), (1250, 90), (600, 180), (300, 250), (150, 200), (100, 500), (250, 640), (500, 380), (800, 450), (1000, 560), (1150, 600), (900, 690), (700, 660), (920, 105), (830, 440), (1100, 650), (1380, 570), (1270, 420)]), start=(862, 885), dir=(1, 0)),
  'beach': dict(flood=((400, 950), 10), start=(715, 955), dir=(1, 0)),
  'rootway': dict(colour=(9, 5, 4, [(400, 880), (1000, 880), (1420, 750), (1420, 350), (1300, 70), (950, 420), (800, 640), (560, 560), (650, 330), (800, 90), (560, 150), (100, 300), (100, 500), (300, 540), (100, 780), (1300, 880)]),
                  bridges=[(600, 880, 900, 880, 36), (215, 212, 300, 192, 30), (300, 192, 450, 190, 30), (1385, 470, 1385, 600, 30)], start=(775, 880), dir=(1, 0)),
  'lantern': dict(kerb=(38, 3, [(400, 910)]), start=(775, 910), dir=(1, 0)),
  'summit': dict(kerb=(-32, 2, [(400, 862)]), bridges=[(700, 862, 880, 862, 26)], start=(778, 862), dir=(1, 0)),
}
def road(key, c):
    im = np.asarray(Image.open(SRC + key + '.png').convert('RGB')).astype(float) / 255
    if 'flood' in c:
        (sx, sy), t = c['flood']; lab = color.rgb2lab(filters.gaussian(im, 4, channel_axis=-1))
        m = segmentation.flood(np.sqrt(((lab - lab[sy, sx]) ** 2).sum(-1)), (sy, sx), tolerance=t)
        m = morphology.binary_closing(m, morphology.disk(6)); m = morphology.remove_small_holes(m, 4000); m = morphology.binary_opening(m, morphology.disk(5))
        seeds = [(sx, sy)]
    elif 'kerb' in c:   # the road is everything inside its kerbs: bright kerbs (thr > 0) or brightly coloured ones (thr < 0)
        thr, dil, seeds = c['kerb']; LAB = color.rgb2lab(filters.gaussian(im, 1, channel_axis=-1))
        F = LAB[..., 0] if thr > 0 else np.hypot(LAB[..., 1], LAB[..., 2])
        bar = morphology.binary_dilation(F > abs(thr), morphology.disk(dil))
        lb = measure.label(~bar, connectivity=1); m = np.isin(lb, list(set(lb[y, x] for x, y in seeds) - {0}))
        m = morphology.binary_closing(m, morphology.disk(dil + 2))
    else:
        tol, op, cl, seeds = c['colour']; lab = color.rgb2lab(filters.gaussian(im, 3, channel_axis=-1))
        d = np.min([np.sqrt(((lab - lab[y, x]) ** 2).sum(-1)) for x, y in seeds], axis=0)
        m = d < tol
        if op: m = morphology.binary_opening(m, morphology.disk(op))
        if cl: m = morphology.binary_closing(m, morphology.disk(cl))
        m = morphology.remove_small_holes(m, 3000)
    for (x0, y0, x1, y1, r) in c.get('bridges', []) + [(*c['start'], *c['start'], 40)]:   # gaps painted over: start line, arches, planks
        n = int(max(abs(x1 - x0), abs(y1 - y0)) / 2) + 1
        for t in np.linspace(0, 1, n): rr, cc = draw.disk((y0 + (y1 - y0) * t, x0 + (x1 - x0) * t), r, shape=m.shape); m[rr, cc] = True
    lb = measure.label(m); keep = set(lb[y, x] for x, y in seeds + [c['start']]) - {0}
    return morphology.remove_small_holes(np.isin(lb, list(keep)), 12000)
NB = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]
def prune(sk):
    sk = sk.copy()
    k = np.ones((3, 3)); k[1, 1] = 0
    while True:
        n = ndi.convolve(sk.astype(int), k, mode='constant')
        ends = sk & (n <= 1)
        if not ends.any(): return sk
        sk[ends] = False
def loop(sk, start, dirv, via=None):
    """The loop through the start: the shortest way round from just ahead of the start back to just behind it
    (through each point in `via`, in order, if given). Works on the pixel graph of the skeleton."""
    from scipy.sparse import coo_matrix
    from scipy.sparse.csgraph import dijkstra
    ys, xs = np.nonzero(sk); idx = -np.ones(sk.shape, int); idx[ys, xs] = np.arange(len(ys))
    r, c_, w = [], [], []
    for a, b in NB:
        y2, x2 = ys + a, xs + b; ok = (y2 >= 0) & (y2 < sk.shape[0]) & (x2 >= 0) & (x2 < sk.shape[1])
        j = np.where(ok)[0]; k = idx[y2[j], x2[j]]; good = k >= 0
        r += list(j[good]); c_ += list(k[good]); w += [np.hypot(a, b)] * int(good.sum())
    G = coo_matrix((w, (r, c_)), shape=(len(ys), len(ys))).tocsr()
    near = lambda p: int(np.argmin((xs - p[0]) ** 2 + (ys - p[1]) ** 2))
    s0 = near(start); a = near((start[0] + dirv[0] * 30, start[1] + dirv[1] * 30)); b = near((start[0] - dirv[0] * 30, start[1] - dirv[1] * 30))
    stops = [a] + [near(v) for v in (via or [])] + [b]
    order = [s0]
    G2 = G.tolil(); G2[s0, :] = 0; G2[:, s0] = 0; G2 = G2.tocsr()   # don't cut back through the start
    for u, v in zip(stops, stops[1:]):
        _, pred = dijkstra(G2, indices=u, return_predecessors=True)
        p, seg = v, []
        while p != u and p >= 0: seg.append(p); p = pred[p]
        if p < 0: raise RuntimeError('no way round')
        order += [u] + seg[::-1][:-1] if False else [u] + seg[::-1]
    out, last = [], None
    for k in order:
        if k != last: out.append(k); last = k
    return np.array([(xs[k], ys[k]) for k in out], float)
def resample(P, step=8, smooth=9):
    # smooth a closed polyline, then even spacing
    n = len(P); k = smooth
    Q = np.array([P[[(i + j) % n for j in range(-k, k + 1)]].mean(0) for i in range(n)])
    seg = np.hypot(*np.diff(np.vstack([Q, Q[:1]]), axis=0).T); cum = np.concatenate([[0], np.cumsum(seg)]); L = cum[-1]
    out = []
    for s in np.arange(0, L, step):
        j = np.searchsorted(cum, s, 'right') - 1; f = (s - cum[j]) / max(1e-9, seg[j]); a, b = Q[j], Q[(j + 1) % n]; out.append(a + (b - a) * f)
    return np.array(out), L
def cut(key):
    c = CFG[key]; m = road(key, c)
    sk = prune(morphology.skeletonize(m))
    P = loop(sk, c['start'], c['dir'], c.get('via'))
    line, L = resample(P)
    dist = ndi.distance_transform_edt(m)
    half = float(np.median([dist[int(y), int(x)] for x, y in line]))
    o = (np.asarray(Image.open(SRC + key + '.png').convert('RGB')) * .55).astype(np.uint8)
    o[m] = (o[m] * .6 + np.array([60, 120, 255]) * .4).astype(np.uint8)
    im = Image.fromarray(o); d = ImageDraw.Draw(im)
    d.line([tuple(p) for p in line] + [tuple(line[0])], fill=(255, 50, 50), width=3)
    for i in range(0, len(line), 25): d.text(tuple(line[i]), str(i // 25), fill=(255, 255, 0))
    d.ellipse([line[0][0] - 8, line[0][1] - 8, line[0][0] + 8, line[0][1] + 8], outline=(255, 255, 0), width=3)
    im.resize((768, 512)).save(f'/tmp/ct_{key}.png')
    Image.open(SRC + key + '.png').convert('RGB').save(OUT + f'track_{key}.webp', 'WEBP', quality=84, method=6)
    out = dict(w=m.shape[1], h=m.shape[0], half=round(half, 1), line=[[round(float(x), 1), round(float(y), 1)] for x, y in line])
    if c.get('alt'):
        A, LA = resample(loop(sk, c['start'], c['dir'], c['alt']))
        out['alt'] = [[round(float(x), 1), round(float(y), 1)] for x, y in A]
        d.line([tuple(p) for p in A] + [tuple(A[0])], fill=(60, 255, 120), width=3); im.resize((768, 512)).save(f'/tmp/ct_{key}.png')
        print(key, 'alt lap', int(LA))
    print(key, 'lap', int(L), 'px  half', round(half, 1), 'pts', len(line))
    return out
if __name__ == '__main__':
    jp = OUT + 'derby_tracks.json'; data = json.load(open(jp)) if os.path.exists(jp) else {}
    for k in (sys.argv[1:] or CFG): data[k] = cut(k)
    json.dump(data, open(jp, 'w'), separators=(',', ':'))
