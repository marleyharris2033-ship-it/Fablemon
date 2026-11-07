"""Cut the sea Fablemon (art_incoming/seamons) into game sprites.

Battle pairs (front, back) -> appended to src/mon_battle.png / mon_icons.png after BASE rows, in MONS order
(the order src/seamons.js pushes them onto MON_ORDER).
Walk sheets: until the real walk sheets arrive, a stand-in is made from the battle art
(down = front, up = back, left = front, right = front flipped, with a little bob) so followers,
the ranch and the Derby still work. Real sheets go in art_incoming/seamons/walk_<id>.png
(4 rows down/left/right/up x 4 frames) and are used instead when present.
Run from the repo root:  python3 tools/art/cut_seamons.py [--preview out.png]
"""
import os, sys
from PIL import Image, ImageOps
sys.path.insert(0, 'tools/art')
import cut_thirds as C

A = 'art_incoming/seamons/'
G = 'src/'
BASE = 78       # rows before this batch: 53 + 22 third forms + 3 Nipshade line
# (id, battle sheet, row, rows in sheet, walk frame size)
MONS = [
    ('riftshear', 'riftshear', 0, 1, 28), ('riftshear_2', 'squalljaw', 0, 1, 40), ('riftshear_3', 'maelstromaw', 0, 1, 44),
    ('inkwick', 'inkwick', 0, 1, 28), ('inkwick_2', 'gloamwick', 0, 1, 40), ('inkwick_3', 'umbraclipse', 0, 1, 44),
    ('kilnback', 'kilnback', 0, 1, 28), ('kilnback_2', 'brineforge', 0, 1, 40), ('kilnback_3', 'breakbastion', 0, 1, 44),
    ('foilfin', 'foilfin', 0, 1, 28), ('foilfin_2', 'sabresail', 0, 1, 40), ('foilfin_3', 'galleolance', 0, 1, 44),
    ('floecalf', 'whale', 0, 2, 28), ('floecalf_2', 'whale', 1, 2, 44),
]


def standin_walk(sheet, row, nrows, F):
    if sheet not in C._battle:
        a, m = C.load(A + sheet + '.png'); C._battle[sheet] = C.grid(a, m, nrows, 2)
    front, back = C._battle[sheet][row]
    k = (F - 2) / max(max(front['mask'].shape), max(back['mask'].shape))
    fr, bk = C.shrink(front, k), C.shrink(back, k)
    out = Image.new('RGBA', (F * 4, F * 4))
    for r, im in enumerate((fr, fr, ImageOps.mirror(fr), bk)):
        for c in range(4):
            out.paste(im, (c * F + (F - im.width) // 2, r * F + F - im.height - (c % 2)), im)
    return out


def main():
    C.A = A
    bt = Image.open(G + 'mon_battle.png').convert('RGBA'); ic = Image.open(G + 'mon_icons.png').convert('RGBA')
    assert bt.height // 64 >= BASE
    nb = Image.new('RGBA', (128, 64 * (BASE + len(MONS)))); nb.paste(bt.crop((0, 0, 128, 64 * BASE)), (0, 0))
    ni = Image.new('RGBA', (48 * (BASE + len(MONS)), 48)); ni.paste(ic.crop((0, 0, 48 * BASE, 48)), (0, 0))
    pv = Image.new('RGBA', (176 + 8 + 128 + 8 + 48, len(MONS) * 182), (200, 220, 180, 255))
    for j, (sid, bs, br, bn, F) in enumerate(MONS):
        real = A + f'walk_{sid}.png'
        sheet = C.walk_sheet(real, F) if os.path.exists(real) else standin_walk(bs, br, bn, F)
        sheet.save(G + f'mon_{sid}.png')
        cell, icon = C.battle_pair(bs, br, bn)
        nb.paste(cell, (0, 64 * (BASE + j))); ni.paste(icon, (48 * (BASE + j), 0))
        y = j * 182; pv.paste(sheet, (0, y), sheet); pv.paste(cell, (184, y), cell); pv.paste(icon, (320, y), icon)
        print(sid, 'ok')
    nb.save(G + 'mon_battle.png', optimize=True); ni.save(G + 'mon_icons.png', optimize=True)
    if '--preview' in sys.argv: pv.resize((pv.width * 2, pv.height * 2), 0).save(sys.argv[sys.argv.index('--preview') + 1])


if __name__ == '__main__':
    main()
