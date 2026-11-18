"""Settle each beard onto the jaw of the face pieces. The beard sheet wasn't drawn on exactly the same spot as the heads,
so each beard is slid (a few px at most) to where it sits most on the face and least off it, judged over all six faces.
Facing right is the left placement mirrored about the head. Run after build_creator.py (it calls this itself)."""
import json, numpy as np
from PIL import Image
J = 'src/creator/cc.json'
c = json.load(open(J)); A = np.asarray(Image.open('src/creator/cc_atlas.webp').convert('RGBA'))[..., 3] > 127
N = 220
def mask(k):
    P = c['pieces'][k]; x, y, w, h = P['f']; m = np.zeros((N, N), bool); ax, ay = round(P['at'][0]), round(P['at'][1])
    m[ay + 30:ay + 30 + h, ax + 30:ax + 30 + w] = A[y:y + h, x:x + w]; return m
for b in range(c['beards']):
    for d in (0, 1):
        k = f'beard{b}_{d}'; bm = mask(k); best = None
        heads = [mask(f'head{f}_{d}') for f in range(c['heads'])]
        for dy in range(-4, 5):
            for dx in range(-4, 5):
                s = np.roll(np.roll(bm, dy, 0), dx, 1); sc = 0
                for hm in heads:
                    ys = np.nonzero(hm.any(1))[0]; eyes = np.zeros_like(hm); eyes[:ys[0] + int((ys[-1] - ys[0]) * .45)] = True
                    sc += (s & hm).sum() - 1.5 * (s & ~hm).sum() - 6 * (s & eyes).sum()
                sc -= 3 * (abs(dx) + abs(dy))
                if best is None or sc > best[0]: best = (sc, dx, dy)
        _, dx, dy = best; P = c['pieces'][k]; P['at'] = [P['at'][0] + dx, P['at'][1] + dy]; print(k, 'moved', dx, dy)
    # facing right: mirror the left placement about the head
    hl, hr = c['pieces']['head0_1'], c['pieces']['head0_2']; L = c['pieces'][f'beard{b}_1']; R = c['pieces'][f'beard{b}_2']
    R['at'] = [hr['at'][0] + hl['f'][2] - (L['at'][0] - hl['at'][0]) - L['f'][2], hr['at'][1] + (L['at'][1] - hl['at'][1])]
json.dump(c, open(J, 'w'), separators=(',', ':'))
