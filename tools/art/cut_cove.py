"""Cut the Driftwood Cove art in art_incoming/cove into game sprites.

  buildings, boat stages, props -> src/cove.png / cove.json (atlas 'cove')
  shipwright_walk      -> src/npc_shipwright.png (4x4 frames of 28x32, like the villagers)
  shipwright_portraits -> row 12 of src/vill_portraits.png (calm, laughing)

Run from the repo root:  python3 tools/art/cut_cove.py   (safe to re-run)
"""
import json, os, sys
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
import cut_thirds as C

A = 'art_incoming/cove/'
G = 'src/'
ROW = 12

WHOLE = [('cv_pier', 'pier', 112), ('cv_cottage', 'cottage_stilts', 92), ('cv_hut', 'fish_hut', 104),
         ('cv_shipyard', 'shipyard', 168), ('cv_house', 'cottage_tall', 96)]
BOATS = ['cv_boat1', 'cv_boat2', 'cv_boat3', 'cv_boat4']
PROPS = ['net_frame', 'net_pile', 'barrels', 'fish_crate', 'pot_round', 'pot_box', 'rope_coil', 'rope_spool',
         'oars', 'oar_rack', 'anchor', 'anchor_rope', 'buoys', 'glass_floats', 'bollard', 'lantern']


def whole(path, width):
    a, m = C.load(path)
    o = C.piece(a, m, 0, m.shape[0], 0, m.shape[1], keep=.002)
    return C.shrink(o, width / o['mask'].shape[1])


def atlas():
    ims = {n: whole(A + f + '.png', w) for n, f, w in WHOLE}
    a, m = C.load(A + 'boat_stages.png'); cells = C.grid(a, m, 2, 2)
    k = 84 / max(o['mask'].shape[1] for r in cells for o in r)        # all four stages at one scale
    for i, n in enumerate(BOATS): ims[n] = C.shrink(cells[i // 2][i % 2], k)
    a, m = C.load(A + 'cove_props.png'); cells = C.grid(a, m, 4, 4)
    for i, n in enumerate(PROPS): ims['cv_' + n] = C.shrink(cells[i // 4][i % 4], .085)
    W = 512; x = y = rowh = 0; pos = {}
    for n, im in sorted(ims.items(), key=lambda kv: -kv[1].height):
        if x + im.width > W: x = 0; y += rowh + 1; rowh = 0
        pos[n] = (x, y); x += im.width + 1; rowh = max(rowh, im.height)
    out = Image.new('RGBA', (W, y + rowh)); frames = {}
    for n, im in ims.items():
        px, py = pos[n]; out.paste(im, (px, py), im)
        frames[n] = {'frame': {'x': px, 'y': py, 'w': im.width, 'h': im.height}, 'rotated': False, 'trimmed': False,
                     'spriteSourceSize': {'x': 0, 'y': 0, 'w': im.width, 'h': im.height}, 'sourceSize': {'w': im.width, 'h': im.height}}
    out.save(G + 'cove.png', optimize=True)
    json.dump({'frames': frames, 'meta': {'image': 'cove.png', 'size': {'w': out.width, 'h': out.height}, 'scale': '1'}}, open(G + 'cove.json', 'w'))
    for n, im in ims.items(): print(n, im.size)


def shipwright():
    a, m = C.load(A + 'shipwright_walk.png'); cells = C.grid(a, m, 4, 4)
    FW, FH = 28, 32
    k = min((FH - 1) / max(o['mask'].shape[0] for r in cells for o in r), (FW - 1) / max(o['mask'].shape[1] for r in cells for o in r))
    sheet = Image.new('RGBA', (FW * 4, FH * 4))
    for r in range(4):
        for c in range(4):
            im = C.shrink(cells[r][c], k); sheet.paste(im, (c * FW + (FW - im.width) // 2, r * FH + FH - im.height), im)
    sheet.save(G + 'npc_shipwright.png')
    a, m = C.load(A + 'shipwright_portraits.png'); faces = C.grid(a, m, 1, 2)[0]
    k = 63 / max(max(o['mask'].shape) for o in faces)
    vp = Image.open(G + 'vill_portraits.png').convert('RGBA')
    out = Image.new('RGBA', (128, max(vp.height, (ROW + 1) * 64))); out.paste(vp.crop((0, 0, 128, min(vp.height, ROW * 64))), (0, 0))
    for j, o in enumerate(faces):
        im = C.shrink(o, k); out.paste(im, (j * 64 + (64 - im.width) // 2, ROW * 64 + 64 - im.height), im)
    out.save(G + 'vill_portraits.png', optimize=True)


if __name__ == '__main__':
    atlas(); shipwright()
