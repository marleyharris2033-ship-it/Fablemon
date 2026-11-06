"""Cut the Smallroot Derby art in art_incoming/derby into game sprites.

  monty_walk.png      -> src/npc_monty.png (4x4 frames of 28x32, like the other villagers)
  monty_portraits.png -> row 11 of src/vill_portraits.png (calm, laughing)
  derby_entrance.png  -> frame 'derby' in src/town.png / town.json

Run from the repo root:  python3 tools/art/cut_derby.py   (safe to re-run)
"""
import json, os, sys
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
import cut_thirds as C

A = 'art_incoming/derby/'
G = 'src/'
ROW = 11            # Monty's row in vill_portraits.png
ARCH_W = 172        # arch width in pixels in town (buildings are 110-160)


def walk():
    a, m = C.load(A + 'monty_walk.png'); cells = C.grid(a, m, 4, 4)
    FW, FH = 28, 32
    k = min((FH - 1) / max(o['mask'].shape[0] for r in cells for o in r), (FW - 1) / max(o['mask'].shape[1] for r in cells for o in r))
    sheet = Image.new('RGBA', (FW * 4, FH * 4))
    for r in range(4):
        for c in range(4):
            im = C.shrink(cells[r][c], k); sheet.paste(im, (c * FW + (FW - im.width) // 2, r * FH + FH - im.height), im)
    sheet.save(G + 'npc_monty.png')


def portraits():
    a, m = C.load(A + 'monty_portraits.png'); faces = C.grid(a, m, 1, 2)[0]
    k = 63 / max(max(o['mask'].shape) for o in faces)
    vp = Image.open(G + 'vill_portraits.png').convert('RGBA')
    out = Image.new('RGBA', (128, max(vp.height, (ROW + 1) * 64))); out.paste(vp.crop((0, 0, 128, min(vp.height, ROW * 64))), (0, 0))
    for j, o in enumerate(faces):
        im = C.shrink(o, k); out.paste(im, (j * 64 + (64 - im.width) // 2, ROW * 64 + 64 - im.height), im)
    out.save(G + 'vill_portraits.png', optimize=True)


def arch():
    a, m = C.load(A + 'derby_entrance.png')
    o = C.piece(a, m, 0, m.shape[0], 0, m.shape[1], keep=.002)
    im = C.shrink(o, ARCH_W / o['mask'].shape[1])
    tj = json.load(open(G + 'town.json')); tp = Image.open(G + 'town.png').convert('RGBA')
    fr = tj['frames']
    if 'derby' in fr:                                   # re-run: drop the old strip at the bottom
        y0 = fr['derby']['frame']['y']; tp = tp.crop((0, 0, tp.width, y0 - 1)); del fr['derby']
    y = tp.height + 1
    out = Image.new('RGBA', (max(tp.width, im.width), y + im.height)); out.paste(tp, (0, 0)); out.paste(im, (0, y), im)
    fr['derby'] = {'frame': {'x': 0, 'y': y, 'w': im.width, 'h': im.height}, 'rotated': False, 'trimmed': False,
                   'spriteSourceSize': {'x': 0, 'y': 0, 'w': im.width, 'h': im.height}, 'sourceSize': {'w': im.width, 'h': im.height}}
    tj['meta']['size'] = {'w': out.width, 'h': out.height}
    out.save(G + 'town.png', optimize=True); json.dump(tj, open(G + 'town.json', 'w'))
    print('arch', im.size)


if __name__ == '__main__':
    walk(); portraits(); arch()
