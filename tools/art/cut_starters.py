"""Cut the new starters (art_incoming/starters2, the Starter Collection sent 15 Nov 2026) into game sprites.

Battle pairs (front, back) -> appended to src/mon_battle.png / mon_icons.png after BASE rows, in MONS order
(the order src/starters.js pushes them onto MON_ORDER). Walk sheets (4 rows down/left/right/up x 4 frames)
-> src/mon_<id>.png. The high-detail versions come from tools/art/cut_hd.py, which reads MONS from here.
Run from the repo root:  python3 tools/art/cut_starters.py [--preview out.png]
"""
import sys
from PIL import Image
sys.path.insert(0, 'tools/art')
import cut_thirds as C
from cut_seamons import real_walk

A = 'art_incoming/starters2/'
G = 'src/'
BASE = 104      # rows before this batch
# (id, folder, walk frame size: 28 first stage, 40 second, 44 third, like the old starters)
MONS = [
    ('samarrow', 'Leaf/01-Samarrow/Samarrow', 28), ('samaslice', 'Leaf/02-Samaslice/Samaslice', 40), ('samarazor', 'Leaf/03-Samarazor/Samarazor', 44),
    ('wickid', 'Ember/01-Wickid/Wickid', 28), ('wickveil', 'Ember/02-Wickveil/Wickveil', 40), ('solwick', 'Ember/03-Solwick/Solwick', 44),
    ('rillcurl', 'Tide/01-Rillcurl/Rillcurl', 28), ('riptwake', 'Tide/02-Riptwake/Riptwake', 40), ('maelstromaw', 'Tide/03-Maelstromaw/Maelstromaw', 44),
]


def main():
    C.A = A
    bt = Image.open(G + 'mon_battle.png').convert('RGBA'); ic = Image.open(G + 'mon_icons.png').convert('RGBA')
    assert bt.height // 64 >= BASE
    nb = Image.new('RGBA', (128, 64 * (BASE + len(MONS)))); nb.paste(bt.crop((0, 0, 128, 64 * BASE)), (0, 0))
    ni = Image.new('RGBA', (48 * (BASE + len(MONS)), 48)); ni.paste(ic.crop((0, 0, 48 * BASE, 48)), (0, 0))
    pv = Image.new('RGBA', (176 + 8 + 128 + 8 + 48, len(MONS) * 182), (120, 160, 110, 255))
    for j, (sid, base, F) in enumerate(MONS):
        sheet = real_walk(A + base + '-Movement.png', F); sheet.save(G + f'mon_{sid}.png')
        cell, icon = C.battle_pair(base + '-Battle', 0, 1)
        nb.paste(cell, (0, 64 * (BASE + j))); ni.paste(icon, (48 * (BASE + j), 0))
        y = j * 182; pv.paste(sheet, (0, y), sheet); pv.paste(cell, (184, y), cell); pv.paste(icon, (320, y), icon)
        print(sid, 'ok')
    nb.save(G + 'mon_battle.png', optimize=True); ni.save(G + 'mon_icons.png', optimize=True)
    if '--preview' in sys.argv: pv.resize((pv.width * 2, pv.height * 2), 0).save(sys.argv[sys.argv.index('--preview') + 1])


if __name__ == '__main__':
    main()
