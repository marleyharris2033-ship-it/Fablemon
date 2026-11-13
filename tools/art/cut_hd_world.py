"""High-detail versions of the town art, characters and portraits we have originals for.

The town cutters (cut_cove, cut_quarry, cut_beacon, cut_highmoor, cut_sea) shrink each drawing into a small
pixel atlas. This re-runs them with the shrink swapped for a smooth cut at 3x the size, into src/hd_world/.
The game keeps the small atlas for frame sizes and positions, and swaps in the 3x pixels (hd.js, hdWorld).

  src/hd_world/<atlas>.png + .json     town atlases at 3x (cove, quarrydown, beaconreach, highmoor, sea)
  src/hd_world/<sheet>.png             walk sheets at 3x (tr_granger, tr_orrin, tr_tamsin, npc_shipwright, npc_monty, boat_sail)
  src/hd/port_<who>_<0|1>.webp         portraits at 240px on the talk-box green (granger, orrin, tamsin, hal, monty)

Run from the repo root:  python3 tools/art/cut_hd_world.py
"""
import json, os, sys, types
import numpy as np
from PIL import Image
sys.path.insert(0, 'tools/art')
import cut_thirds as C
import cut_hd as H

K = 3
OUT = 'src/hd_world/'
_small_shrink = C.shrink


def big_shrink(o, k):
    return H.soft(o, k * K)


def run_atlas(modname, png):
    src = open(f'tools/art/{modname}.py').read()
    src = src.replace("G = 'src/'", f"G = '{OUT}'").replace('W = 512', 'W = 2048').replace('W = 256', 'W = 1024')
    mod = types.ModuleType(modname + '_hd'); mod.__file__ = f'tools/art/{modname}.py'
    exec(compile(src, mod.__file__, 'exec'), mod.__dict__)
    C.shrink = big_shrink
    try:
        mod.atlas()
    finally:
        C.shrink = _small_shrink
    small = set(json.load(open('src/' + png.replace('.png', '.json')))['frames'])
    big = json.load(open(OUT + png.replace('.png', '.json')))
    missing = small - set(big['frames'])
    w, h = Image.open(OUT + png).size
    print(png, f'{w}x{h}', len(big['frames']), 'frames', 'MISSING ' + ','.join(sorted(missing)) if missing else 'all frames match')
    assert w <= 4096 and h <= 4096, 'too big for phones'


def walk(path, name, FW=28, FH=32):
    a, m = C.load(path); cells = C.grid(a, m, 4, 4)
    k = min((FH - 1) / max(o['mask'].shape[0] for r in cells for o in r), (FW - 1) / max(o['mask'].shape[1] for r in cells for o in r))
    W, Hh = FW * K, FH * K
    sheet = Image.new('RGBA', (W * 4, Hh * 4))
    for r in range(4):
        for c in range(4):
            im = big_shrink(cells[r][c], k); sheet.paste(im, (c * W + (W - im.width) // 2, r * Hh + Hh - im.height), im)
    sheet.save(OUT + name + '.png', optimize=True); print(name, sheet.size)


def boat():
    A = 'art_incoming/sea/'; F = 48
    a, m = C.load(A + 'boat.png'); cells = C.grid(a, m, 4, 2)
    k = (F - 2) / max(max(o['mask'].shape) for r in cells for o in r); W = F * K
    sheet = Image.new('RGBA', (W * 2, W * 5))
    for r in range(4):
        for c in range(2):
            im = big_shrink(cells[r][c], k); sheet.paste(im, (c * W + (W - im.width) // 2, r * W + W - im.height), im)
    a, m = C.load(A + 'boat_empty_src.png'); im = big_shrink(C.grid(a, m, 1, 1)[0][0], k)
    sheet.paste(im, ((W - im.width) // 2, 4 * W + W - im.height), im)
    sheet.save(OUT + 'boat_sail.png', optimize=True); print('boat_sail', sheet.size)


def portraits(path, who):
    a, m = C.load(path); faces = C.grid(a, m, 1, 2)[0]
    k = 63 / max(max(o['mask'].shape) for o in faces)
    S = 80 * K; kk = k * S / 64          # the game draws each 64px cell into an 80px box
    for j, o in enumerate(faces):
        im = H.soft(o, kk); bg = Image.new('RGBA', (S, S), (0xcf, 0xe3, 0xb2, 255))
        bg.paste(im, ((S - im.width) // 2, S - im.height), im)
        bg.convert('RGB').save(f'src/hd/port_{who}_{j}.webp', 'WEBP', quality=85, method=6)
    print('portraits', who)


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for mod, png in [('cut_cove', 'cove.png'), ('cut_quarry', 'quarrydown.png'), ('cut_beacon', 'beaconreach.png'), ('cut_highmoor', 'highmoor.png'), ('cut_sea', 'sea.png')]:
        run_atlas(mod, png)
    walk('art_incoming/quarrydown/granger_walk.png', 'tr_granger')
    walk('art_incoming/beaconreach/orrin_walk.png', 'tr_orrin')
    walk('art_incoming/highmoor/tamsin_walk.png', 'tr_tamsin')
    walk('art_incoming/cove/shipwright_walk.png', 'npc_shipwright')
    walk('art_incoming/derby/monty_walk.png', 'npc_monty')
    boat()
    portraits('art_incoming/quarrydown/granger_portraits.png', 'granger')
    portraits('art_incoming/beaconreach/orrin_portraits.png', 'orrin')
    portraits('art_incoming/highmoor/tamsin_portraits.png', 'tamsin')
    portraits('art_incoming/cove/shipwright_portraits.png', 'hal')
    portraits('art_incoming/derby/monty_portraits.png', 'monty')
    # webp is far smaller; json frame lists keep pointing at the same layout
    import glob
    for p in glob.glob(OUT + '*.png'):
        Image.open(p).convert('RGBA').save(p[:-4] + '.webp', 'WEBP', quality=82, method=6); os.remove(p)
