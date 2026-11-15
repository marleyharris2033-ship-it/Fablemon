"""Farm animals, their buildings, machines and produce (src/animals.js), from art_incoming/livestock.

  src/hd_world/an_<kind>.webp   4x4 walk frames of 32x32 game px at 6x (rows down, left, right, up); babies' sheets
                                use their one front-facing row for every direction
  src/hd_world/int_coop.webp, int_barn.webp   the interiors at 6x, 15x10 tiles
  src/hd_world/lv.webp + .json  3x atlas: b_<building> (front-facing art, art_incoming/livestock/front),
                                m_<machine> and the icons i_<item>
Run from the repo root:  python3 tools/art/cut_livestock.py"""
import sys, json
import numpy as np
from PIL import Image
sys.path.insert(0, 'tools/art')
import cut_thirds as C
import cut_hd as H
import cut_farmer as F

A, OUT, K = 'art_incoming/livestock/', 'src/hd_world/', 6
HEIGHT = {'cow': 25, 'goat': 21, 'sheep': 19, 'hen': 14, 'duck': 16}          # game px, standing front-on
BABY = {'calf': (0, 16), 'chick': (1, 9), 'lamb': (2, 14), 'kid': (3, 15), 'duckling': (4, 10)}   # row in babies.png, height
CELL = 32 * K


def sheet_out(rows, s, path):
    out = Image.new('RGBA', (CELL * 4, CELL * 4))
    for r in range(4):
        for c in range(4): out.paste(F.place(rows[r][c], s, CELL, CELL, CELL / 2, CELL - K), (c * CELL, r * CELL))
    out.save(path, 'WEBP', quality=90, method=6)


def animals():
    for k, h in HEIGHT.items():
        a, m = C.load(A + f'animals/{k}.png'); g = C.grid(a, m, 4, 4)
        s = h * K / np.mean([g[0][c]['mask'].shape[0] for c in range(4)])
        sheet_out(g, s, OUT + f'an_{k}.webp'); print(k)
    a, m = C.load(A + 'animals/babies.png'); g = C.grid(a, m, 5, 4)
    for k, (row, h) in BABY.items():
        s = h * K / np.mean([g[row][c]['mask'].shape[0] for c in range(4)])
        sheet_out([g[row]] * 4, s, OUT + f'an_{k}.webp'); print(k)


def interiors():
    for k in ('coop', 'barn'):
        a, m = C.load(A + f'interiors/{k}-interior.png'); ys, xs = np.where(m)
        im = Image.open(A + f'interiors/{k}-interior.png').convert('RGB').crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
        # trim the pink matte that bleeds into the edge rows and columns
        px = np.asarray(im).astype(int); mg = (px[..., 0] > 150) & (px[..., 2] > 150) & (px[..., 1] < 110)
        r0, r1, c0, c1 = 0, mg.shape[0], 0, mg.shape[1]
        while mg[r0, c0:c1].mean() > .02: r0 += 1
        while mg[r1 - 1, c0:c1].mean() > .02: r1 -= 1
        while mg[r0:r1, c0].mean() > .02: c0 += 1
        while mg[r0:r1, c1 - 1].mean() > .02: c1 -= 1
        im = im.crop((c0, r0, c1, r1))
        im.resize((15 * 16 * K, 10 * 16 * K), Image.LANCZOS).save(OUT + f'int_{k}.webp', 'WEBP', quality=88, method=6); print('interior', k)


def piece(path):
    a, m = C.load(path); ys, xs = np.where(m)
    return {'mask': m[ys.min():ys.max() + 1, xs.min():xs.max() + 1], 'rgb': a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]}


BUILD = {'coop': ('coop-basic', 60), 'coop2': ('coop-upgraded', 68), 'barn': ('barn-basic', 100), 'barn2': ('barn-upgraded', 128)}   # game px wide
MACH = {'churn': 'butter-churn', 'press': 'cheese-press', 'mayo': 'mayonnaise-machine', 'jar': 'preserves-jar', 'spinner': 'spinning-wheel', 'loom2': 'weaving-loom', 'incubator': 'incubator'}
ICONS = {'hay': 'hay-bundle', 'grain': 'animal-feed-sack', 'egg': 'egg', 'brown_egg': 'brown-egg', 'duck_egg': 'duck-egg', 'golden_egg': 'golden-egg', 'milk': 'milk-bottle', 'large_milk': 'large-milk',
         'goat_milk': 'goat-milk', 'butter': 'butter', 'cheese': 'cheese-wheel', 'goat_cheese': 'goat-cheese', 'wool': 'wool', 'yarn': 'yarn-ball', 'cloth': 'cloth-bolt', 'feather': 'feather',
         'mayonnaise': 'mayonnaise-jar', 'jam': 'jam-jar', 'brush': 'grooming-brush', 'milk_pail': 'milk-pail', 'shears': 'shears'}


def atlas():
    ims = {}
    for k, (f, w) in BUILD.items():
        p = piece(A + f'front/{f}.png'); ims['b_' + k] = H.soft(p, w * 3 / p['mask'].shape[1])
    for k, f in MACH.items():
        p = piece(A + f'machines/{f}.png'); ims['m_' + k] = H.soft(p, 26 * 3 / max(p['mask'].shape))
        ims['i_' + k] = H.soft(p, 68 / max(p['mask'].shape))
    for k, f in ICONS.items():
        p = piece(A + f'icons/{f}.png'); ims['i_' + k] = H.soft(p, 64 / max(p['mask'].shape))
    for k in [k for k in ims if k.startswith('i_')]:   # icons sit centred on a 72px square
        im = ims[k]; sq = Image.new('RGBA', (72, 72)); sq.paste(im, ((72 - im.width) // 2, (72 - im.height) // 2), im); ims[k] = sq
    W = 1024; x = y = rowh = 0; pos = {}
    for n, im in sorted(ims.items(), key=lambda kv: -kv[1].height):
        if x + im.width > W: x = 0; y += rowh + 2; rowh = 0
        pos[n] = (x, y); x += im.width + 2; rowh = max(rowh, im.height)
    at = Image.new('RGBA', (W, y + rowh)); fr = {}
    for n, im in ims.items(): at.paste(im, pos[n], im); fr[n] = {'frame': {'x': pos[n][0], 'y': pos[n][1], 'w': im.width, 'h': im.height}}
    at.save(OUT + 'lv.webp', 'WEBP', quality=90, method=6); json.dump({'frames': fr}, open(OUT + 'lv.json', 'w'))
    print('atlas', at.size, {k: (v.width // 3, v.height // 3) for k, v in ims.items() if k[0] in 'bm'})


if __name__ == '__main__':
    animals(); interiors(); atlas()
