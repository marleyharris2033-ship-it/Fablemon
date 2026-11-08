"""Cut the Highmoor Fablemon (art_incoming/highmoor_mons) into game sprites.

Battle pairs (front, back) -> appended to src/mon_battle.png / mon_icons.png after BASE rows, in MONS order
(the order src/hmmons.js pushes them onto MON_ORDER). Walk sheets (4 rows down/left/right/up x 4 frames)
-> src/mon_<id>.png at the frame size given here (it must match BIG in game.js for sizes other than 28/44).
Run from the repo root:  python3 tools/art/cut_hmmons.py [--preview out.png]
"""
import sys
from PIL import Image
sys.path.insert(0, 'tools/art')
import cut_thirds as C
from cut_seamons import real_walk

A = 'art_incoming/highmoor_mons/'
G = 'src/'
BASE = 92       # rows before this batch: 78 + 14 sea Fablemon
# (id, battle sheet, row, rows in sheet, walk sheet, walk frame size)
MONS = [
    ('kitlet', 'kestrel_1', 0, 1, 'kestrel_1', 32), ('kitlet_2', 'kestrel_2', 0, 1, 'kestrel_2', 40), ('kitlet_3', 'kestrel_3', 0, 1, 'kestrel_3', 44),
    ('flurrowl', 'owl_1', 0, 1, 'owl_1', 28), ('flurrowl_2', 'owl_2', 0, 1, 'owl_2', 40), ('flurrowl_3', 'owl_3', 0, 1, 'owl_3', 44),
    ('wishling', 'dandelion_1_2', 0, 2, 'dandelion_1', 28), ('wishling_2', 'dandelion_1_2', 1, 2, 'dandelion_2', 36), ('wishling_3', 'dandelion_3', 0, 1, 'dandelion_3', 44),
    ('heathfoal', 'pony_1', 0, 1, 'pony_1', 32), ('heathfoal_2', 'pony_2', 0, 1, 'pony_2', 44),
]


def main():
    C.A = A
    bt = Image.open(G + 'mon_battle.png').convert('RGBA'); ic = Image.open(G + 'mon_icons.png').convert('RGBA')
    assert bt.height // 64 >= BASE
    nb = Image.new('RGBA', (128, 64 * (BASE + len(MONS)))); nb.paste(bt.crop((0, 0, 128, 64 * BASE)), (0, 0))
    ni = Image.new('RGBA', (48 * (BASE + len(MONS)), 48)); ni.paste(ic.crop((0, 0, 48 * BASE, 48)), (0, 0))
    pv = Image.new('RGBA', (176 + 8 + 128 + 8 + 48, len(MONS) * 182), (120, 160, 110, 255))
    for j, (sid, bs, br, bn, walk, F) in enumerate(MONS):
        sheet = real_walk(A + f'walk_{walk}.png', F); sheet.save(G + f'mon_{sid}.png')
        cell, icon = C.battle_pair(bs, br, bn)
        nb.paste(cell, (0, 64 * (BASE + j))); ni.paste(icon, (48 * (BASE + j), 0))
        y = j * 182; pv.paste(sheet, (0, y), sheet); pv.paste(cell, (184, y), cell); pv.paste(icon, (320, y), icon)
        print(sid, 'ok')
    nb.save(G + 'mon_battle.png', optimize=True); ni.save(G + 'mon_icons.png', optimize=True)
    if '--preview' in sys.argv: pv.resize((pv.width * 2, pv.height * 2), 0).save(sys.argv[sys.argv.index('--preview') + 1])


if __name__ == '__main__':
    main()
