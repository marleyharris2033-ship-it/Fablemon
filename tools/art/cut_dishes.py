"""The eight produce dishes (Nov 2026): two 2x2 sheets on magenta -> src/hd_world/dishes.webp + .json (i_<id>, 72px).
Run from the repo root:  python3 tools/art/cut_dishes.py
"""
import sys
from PIL import Image
sys.path.insert(0, 'tools/art')
import cut_thirds as C
import cut_hd as H
import cut_hd_town as T

A = 'art_incoming/dishes/'
SHEETS = {'dishes_a.png': ['potato_gratin', 'pumpkin_custard', 'cream_chowder', 'omelette'],
          'dishes_b.png': ['butter_carrots', 'jam_tart', 'farm_breakfast', 'egg_salad']}
ims = {}
for fn, ids in SHEETS.items():
    a, m = C.load(A + fn)
    for iid, o in zip(ids, [p for row in C.grid(a, m, 2, 2) for p in row]):
        k = 22 * 3 / max(o['mask'].shape); im = H.soft(o, k); c = Image.new('RGBA', (72, 72))
        c.paste(im, ((72 - im.width) // 2, 69 - im.height), im); ims['i_' + iid] = c
T.pack(ims, 'dishes', W=600)
