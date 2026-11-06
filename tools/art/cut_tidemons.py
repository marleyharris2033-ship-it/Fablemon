"""Cut the Nipshade line (art_incoming/nipshade) into game sprites.

  walk sheets  -> src/mon_nipshade.png (28px frames), mon_nipshade_2.png (40px), mon_nipshade_3.png (44px)
  battle pairs -> appended to src/mon_battle.png after BASE rows; icons -> src/mon_icons.png
Rows follow MON_ORDER: these three are pushed by src/tidemons.js, after the third forms.
Run from the repo root:  python3 tools/art/cut_tidemons.py [--preview out.png]
"""
import sys
from PIL import Image
sys.path.insert(0, 'tools/art')
import cut_thirds as C

A = 'art_incoming/nipshade/'
G = 'src/'
BASE = 75       # rows in mon_battle.png before this line (53 + 22 third forms)
# (id, walk sheet, frame size, battle sheet, row, rows)
MONS = [('nipshade', 'walk1', 28, 'battle12', 0, 2), ('nipshade_2', 'walk2', 40, 'battle12', 1, 2), ('nipshade_3', 'walk3', 44, 'battle3', 0, 1)]


def walk_sheet(name, F):
    a, m = C.load(A + name + '.png'); cells = C.grid(a, m, 4, 4)
    k = (F - 2) / max(max(o['mask'].shape) for row in cells for o in row)
    sheet = Image.new('RGBA', (F * 4, F * 4))
    for r in range(4):
        for c in range(4):
            im = C.shrink(cells[r][c], k); sheet.paste(im, (c * F + (F - im.width) // 2, r * F + F - im.height), im)
    return sheet


def main():
    C.A = A
    bt = Image.open(G + 'mon_battle.png').convert('RGBA'); ic = Image.open(G + 'mon_icons.png').convert('RGBA')
    assert bt.height // 64 >= BASE
    nb = Image.new('RGBA', (128, 64 * (BASE + len(MONS)))); nb.paste(bt.crop((0, 0, 128, 64 * BASE)), (0, 0))
    ni = Image.new('RGBA', (48 * (BASE + len(MONS)), 48)); ni.paste(ic.crop((0, 0, 48 * BASE, 48)), (0, 0))
    pv = Image.new('RGBA', (176 + 8 + 128 + 8 + 48, len(MONS) * 182), (200, 220, 180, 255))
    for j, (sid, walk, F, bs, br, bn) in enumerate(MONS):
        sheet = walk_sheet(walk, F); sheet.save(G + f'mon_{sid}.png')
        cell, icon = C.battle_pair(bs, br, bn)
        nb.paste(cell, (0, 64 * (BASE + j))); ni.paste(icon, (48 * (BASE + j), 0))
        y = j * 182; pv.paste(sheet, (0, y), sheet); pv.paste(cell, (184, y), cell); pv.paste(icon, (320, y), icon)
        print(sid, 'ok')
    nb.save(G + 'mon_battle.png', optimize=True); ni.save(G + 'mon_icons.png', optimize=True)
    if '--preview' in sys.argv: pv.resize((pv.width * 2, pv.height * 2), 0).save(sys.argv[sys.argv.index('--preview') + 1])


if __name__ == '__main__':
    main()
