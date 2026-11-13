"""High-detail Smallroot, farmhouse, Hearthroot, route trainers, Bramble and the farmer's tool poses (Nov 2026 originals).

  src/hd_world/town.webp + .json      the Smallroot 'town' atlas at 3x. Frames with new art are cut from the
                                      originals; the rest are the old pixels enlarged 3x so the atlas stays whole.
  src/hd_world/houses.webp + .json    the three farmhouse sizes at 3x
  src/hd_world/<sheet>.webp           tools, tr_rambler, tr_ponddipper, tr_birdwatcher, tr_forager, tr_busker,
                                      tr_allotment, npc_bramble: 3x sheets matching the old frame grid
  src/hd/port_<kind>_<0|1>.webp       trainer portraits at 240px on the talk-box green

Every new picture is fitted to the old frame's size, so nothing in the game moves.
Run from the repo root:  python3 tools/art/cut_hd_town.py
"""
import json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage
sys.path.insert(0, 'tools/art')
import cut_thirds as C
import cut_hd as H

K = 3
A = 'art_incoming/smallroot/'
OUT = 'src/hd_world/'


def bbox(im):
    a = np.array(im.convert('RGBA'))[..., 3] > 100
    if not a.any(): return None
    ys, xs = np.where(a); return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def fit_building(o, w, h):
    """scale a cut-out to fill a (3w x 3h) frame: match the width, sit on the bottom edge"""
    W, Hh = w * K, h * K; mw, mh = o['mask'].shape[1], o['mask'].shape[0]
    s = W / mw
    if mh * s > Hh: s = Hh / mh
    im = H.soft(o, s); out = Image.new('RGBA', (W, Hh)); out.paste(im, ((W - im.width) // 2, Hh - im.height), im); return out


def cells(path, rows, cols):
    a, m = C.load(path); return C.grid(a, m, rows, cols)


def town():
    tj = json.load(open('src/town.json'))['frames']; small = Image.open('src/town.png').convert('RGBA')
    new = {}
    g = cells(A + 'ranch_station.png', 2, 2)
    new.update(ranch_old=g[0][0], ranch=g[0][1], station_old=g[1][0], station=g[1][1])
    g = cells(A + 'clinic_hall_carpenter.png', 3, 2)
    new.update(clinic_old=g[0][0], clinic=g[0][1], hall_old=g[1][0], hall=g[1][1], carpenter_old=g[2][0], carpenter=g[2][1])
    g = cells(A + 'store_smith_tavern.png', 3, 2)
    new.update(store_old=g[0][0], store=g[0][1], smith_old=g[1][0], smith=g[1][1], tavern_old=g[2][0], tavern=g[2][1])
    a, m = C.load(A + 'hearthroot.png'); hh = a.shape[0] // 2
    top = C.grid(a[:hh], m[:hh], 1, 3)[0]; bot = C.grid(a[hh:], m[hh:], 1, 2)[0]
    for i, o in enumerate(top + bot): new[f'hearth{i}'] = o
    ims = {}
    for name, f in tj.items():
        r = f['frame']; w, h = r['w'], r['h']
        if name in new: ims[name] = fit_building(new[name], w, h)
        else: ims[name] = small.crop((r['x'], r['y'], r['x'] + w, r['y'] + h)).resize((w * K, h * K), Image.NEAREST)
    pack(ims, 'town')
    print('town: new art for', ', '.join(sorted(new)))


def houses():
    hj = json.load(open('src/houses.json'))
    g = cells(A + 'farmhouses.png', 1, 3)[0]
    ims = {f'house{i + 1}': fit_building(g[i], hj[f'house{i + 1}']['w'], hj[f'house{i + 1}']['h']) for i in range(3)}
    pack(ims, 'houses')


def pack(ims, name, W=2048):
    x = y = rowh = 0; pos = {}
    for n, im in sorted(ims.items(), key=lambda kv: -kv[1].height):
        if x + im.width > W: x = 0; y += rowh + 2; rowh = 0
        pos[n] = (x, y); x += im.width + 2; rowh = max(rowh, im.height)
    out = Image.new('RGBA', (W, y + rowh)); frames = {}
    for n, im in ims.items():
        px, py = pos[n]; out.paste(im, (px, py), im)
        frames[n] = {'frame': {'x': px, 'y': py, 'w': im.width, 'h': im.height}}
    assert out.height <= 4096, name
    out.save(OUT + name + '.webp', 'WEBP', quality=82, method=6)
    json.dump({'frames': frames}, open(OUT + name + '.json', 'w'))
    print(name, out.size)


def sheet_like(old_path, FW, FH, grid, name, order=None):
    """grid: rows of cut-outs in the old sheet's frame order (rows x 4). Scale to match the old sprites' height,
    and place each so its feet and centre line up with the old frame's."""
    old = Image.open(old_path).convert('RGBA'); cols = old.width // FW; rows = old.height // FH
    hs = [b[3] - b[1] for r in range(rows) for c in range(cols) if (b := bbox(old.crop((c * FW, r * FH, c * FW + FW, r * FH + FH))))]
    s = max(hs) * K / max(o['mask'].shape[0] for row in grid for o in row)
    out = Image.new('RGBA', (cols * FW * K, rows * FH * K))
    for r, row in enumerate(grid):
        for c, o in enumerate(row):
            b = bbox(old.crop((c * FW, r * FH, c * FW + FW, r * FH + FH))) or (0, 0, FW, FH - 1)
            im = H.soft(o, s); cx = (b[0] + b[2]) / 2 * K; bottom = b[3] * K
            x = int(round(c * FW * K + cx - im.width / 2)); y = int(round(r * FH * K + bottom - im.height))
            cell = Image.new('RGBA', (FW * K, FH * K)); cell.paste(im, (x - c * FW * K, y - r * FH * K), im)
            out.paste(cell, (c * FW * K, r * FH * K), cell)
    out.save(OUT + name + '.webp', 'WEBP', quality=82, method=6); print(name, out.size)


def walk3(path, strips, idx):
    """a 3-frames-per-row walk sheet (step, stand, step) -> rows of [stand, step, stand, step]"""
    a, m = C.load(path); w = a.shape[1]; x0, x1 = w * idx // strips, w * (idx + 1) // strips
    g = C.grid(a[:, x0:x1], m[:, x0:x1], 4, 3)
    return [[r[1], r[0], r[1], r[2]] for r in g]


def trainers():
    for path, kinds in [('walk_rambler_ponddipper.png', ['rambler', 'ponddipper']), ('walk_birdwatcher_forager.png', ['birdwatcher', 'forager']),
                        ('walk_busker_allotment.png', ['busker', 'allotment'])]:
        for i, k in enumerate(kinds): sheet_like(f'src/tr_{k}.png', 28, 32, walk3(A + path, 2, i), 'tr_' + k)
    sheet_like('src/npc_bramble.png', 28, 32, walk3(A + 'bramble_walk.png', 1, 0), 'npc_bramble')


def tools():
    g = cells(A + 'farmer_tools.png', 3, 4)
    # new sheet columns: front, back, left, right; the game's: front, left, right, back
    sheet_like('src/farmer_tools.png', 40, 48, [[r[0], r[2], r[3], r[1]] for r in g], 'tools')


def portraits():
    g = cells(A + 'trainer_portraits.png', 6, 2)
    kinds = ['rambler', 'ponddipper', 'birdwatcher', 'forager', 'busker', 'allotment']
    k = 63 / max(max(o['mask'].shape) for row in g for o in row)
    S = 80 * K; kk = k * S / 64
    for kind, row in zip(kinds, g):
        for j, o in enumerate(row):
            im = H.soft(o, kk); bg = Image.new('RGBA', (S, S), (0xcf, 0xe3, 0xb2, 255))
            bg.paste(im, ((S - im.width) // 2, S - im.height), im)
            bg.convert('RGB').save(f'src/hd/port_{kind}_{j}.webp', 'WEBP', quality=85, method=6)
    print('portraits', kinds)


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    town(); houses(); trainers(); tools(); portraits()
