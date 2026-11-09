"""Cut Cirrovale, the cloud dragon legend (art_incoming/cirrovale): battle pair -> mon_battle.png / mon_icons.png row ROW
(its place in MON_ORDER), walk sheet (down/left/right/up x 4) -> src/mon_cirrovale.png at 48px frames (BIG in game.js).
Run from the repo root:  python3 tools/art/cut_cirrovale.py [--preview out.png]"""
import sys
from PIL import Image
sys.path.insert(0, 'tools/art')
import cut_thirds as C
from cut_seamons import real_walk

A = 'art_incoming/cirrovale/'; G = 'src/'; ROW = 103; F = 48
C.A = A
bt = Image.open(G + 'mon_battle.png').convert('RGBA'); ic = Image.open(G + 'mon_icons.png').convert('RGBA')
assert bt.height // 64 >= ROW
nb = Image.new('RGBA', (128, 64 * (ROW + 1))); nb.paste(bt.crop((0, 0, 128, 64 * ROW)), (0, 0))
ni = Image.new('RGBA', (48 * (ROW + 1), 48)); ni.paste(ic.crop((0, 0, 48 * ROW, 48)), (0, 0))
sheet = real_walk(A + 'walk_cirrovale.png', F); sheet.save(G + 'mon_cirrovale.png')
cell, icon = C.battle_pair('cirrovale', 0, 1)
nb.paste(cell, (0, 64 * ROW)); ni.paste(icon, (48 * ROW, 0))
nb.save(G + 'mon_battle.png', optimize=True); ni.save(G + 'mon_icons.png', optimize=True)
if '--preview' in sys.argv:
    pv = Image.new('RGBA', (F * 4 + 8 + 128 + 8 + 48, F * 4), (120, 140, 170, 255)); pv.paste(sheet, (0, 0), sheet); pv.paste(cell, (F * 4 + 8, 0), cell); pv.paste(icon, (F * 4 + 144, 0), icon)
    pv.resize((pv.width * 3, pv.height * 3), 0).save(sys.argv[sys.argv.index('--preview') + 1])
print('cirrovale ok')
