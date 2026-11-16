"""Cut the Elderwood Fablemon (art_incoming/ewmons, sent 16 Nov 2026: front/back battle pairs, no walk sheets yet).

Battle pairs -> appended to src/mon_battle.png / mon_icons.png after BASE rows, in MONS order (the order
src/ewmons.js pushes them onto MON_ORDER). Small walk sheets are built from the battle art (src/mon_<id>.png,
frame size F: it must match BIG in game.js for sizes other than 28/44). The high-detail versions come from
tools/art/cut_hd.py, which reads MONS from here (stand-in walk sheets from the battle art until real ones arrive).
Purple and pink art uses edge keying: only magenta joined to the picture's edge is background.
Run from the repo root:  python3 tools/art/cut_ewmons.py [--preview out.png]
"""
import sys
from PIL import Image, ImageOps
sys.path.insert(0, 'tools/art')
import cut_thirds as C

A = 'art_incoming/ewmons/'
G = 'src/'
BASE = 113      # rows before this batch (after the new starters)
# (id, walk frame size, edge keying)
MONS = [
    ('sprigfawn', 32, 0), ('stumpstag', 40, 0), ('elderhart', 48, 0),
    ('hollowcub', 28, 1), ('tanglebruin', 44, 1), ('ursylvane', 48, 1),
    ('snarlwisp', 32, 1), ('murkhowl', 40, 1), ('gloamfang', 44, 1),
    ('tappit', 32, 0), ('drummajor', 40, 0),
    ('pebblouse', 28, 0), ('cobblerollie', 40, 0), ('mortarmour', 44, 0),
    ('simmerkit', 36, 0), ('thermadam', 44, 0),
]


def pair(sid, edge):
    if edge:
        import cut_hd as H
        a, m = H.load_edge(A + sid + '.png')
    else:
        a, m = C.load(A + sid + '.png')
    return C.grid(a, m, 1, 2)[0]


def main():
    bt = Image.open(G + 'mon_battle.png').convert('RGBA'); ic = Image.open(G + 'mon_icons.png').convert('RGBA')
    assert bt.height // 64 >= BASE
    nb = Image.new('RGBA', (128, 64 * (BASE + len(MONS)))); nb.paste(bt.crop((0, 0, 128, 64 * BASE)), (0, 0))
    ni = Image.new('RGBA', (48 * (BASE + len(MONS)), 48)); ni.paste(ic.crop((0, 0, 48 * BASE, 48)), (0, 0))
    pv = Image.new('RGBA', (200 + 8 + 128 + 8 + 48, len(MONS) * 200), (120, 160, 110, 255))
    for j, (sid, F, edge) in enumerate(MONS):
        front, back = pair(sid, edge)
        k = 62 / max(max(front['mask'].shape), max(back['mask'].shape))
        cell = Image.new('RGBA', (128, 64))
        for q, o in enumerate((front, back)):
            im = C.shrink(o, k); cell.paste(im, (q * 64 + (64 - im.width) // 2, 63 - im.height), im)
        ki = 46 / max(front['mask'].shape)
        icon = Image.new('RGBA', (48, 48)); im = C.shrink(front, ki); icon.paste(im, ((48 - im.width) // 2, 47 - im.height), im)
        kw = (F - 2) / max(max(front['mask'].shape), max(back['mask'].shape))
        fr, bk = C.shrink(front, kw), C.shrink(back, kw)
        sheet = Image.new('RGBA', (F * 4, F * 4))
        for r, im in enumerate((fr, fr, ImageOps.mirror(fr), bk)):
            for c in range(4): sheet.paste(im, (c * F + (F - im.width) // 2, r * F + F - im.height - (c % 2)), im)
        sheet.save(G + f'mon_{sid}.png')
        nb.paste(cell, (0, 64 * (BASE + j))); ni.paste(icon, (48 * (BASE + j), 0))
        y = j * 200; pv.paste(sheet, (0, y), sheet); pv.paste(cell, (208, y), cell); pv.paste(icon, (344, y), icon)
        print(sid, 'ok')
    nb.save(G + 'mon_battle.png', optimize=True); ni.save(G + 'mon_icons.png', optimize=True)
    if '--preview' in sys.argv: pv.resize((pv.width * 2, pv.height * 2), 0).save(sys.argv[sys.argv.index('--preview') + 1])


if __name__ == '__main__':
    main()
