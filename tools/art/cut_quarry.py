"""Cut the Quarrydown art in art_incoming/quarrydown into game sprites.

  buildings + props -> src/quarrydown.png / quarrydown.json (atlas 'qd')
  granger_walk      -> src/tr_granger.png (4x4 frames of 28x32, like the other trainers)
  granger_portraits -> row 11 of src/tr_portraits.png (ready, beaten)
  quarry_pit_arena  -> src/gym_qd.jpg (672x896, drawn at half size: 21 x 28 tiles)

Run from the repo root:  python3 tools/art/cut_quarry.py   (safe to re-run)
"""
import json, os, sys
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
import cut_thirds as C

A = 'art_incoming/quarrydown/'
G = 'src/'
PORTRAIT_ROW = 11

# frame name, file, width in pixels in the game
BUILDINGS = [
    ('qd_clinic', 'clinic', 108), ('qd_shop', 'shop_stone_and_supply', 148), ('qd_station', 'station', 160),
    ('qd_cottage', 'stone_cottage', 108), ('qd_cottage_old', 'stone_cottage_broken', 108),
    ('qd_crane', 'old_crane', 150), ('qd_crane_old', 'old_crane_broken', 150),
]
PROPS = ['boulder', 'slate_spikes', 'sandstone', 'ore_boulder', 'rock_heap',
         'blocks', 'rubble', 'slate_rack', 'column', 'mason_bench',
         'ore_cart', 'wheelbarrow', 'tool_rack', 'rope_spool', 'winch',
         'crates', 'barrel_hat', 'barrier', 'stone_lantern', 'pick_sign']
PROP_K = .125


def whole(path, width):
    a, m = C.load(path)
    o = C.piece(a, m, 0, m.shape[0], 0, m.shape[1], keep=.002)
    return C.shrink(o, width / o['mask'].shape[1])


def atlas():
    ims = {n: whole(A + f + '.png', w) for n, f, w in BUILDINGS}
    a, m = C.load(A + 'quarry_props.png'); cells = C.grid(a, m, 4, 5)
    for i, n in enumerate(PROPS):
        ims['qd_' + n] = C.shrink(cells[i // 5][i % 5], PROP_K)
    # simple shelf packing
    W = 512; x = y = rowh = 0; pos = {}
    for n, im in sorted(ims.items(), key=lambda kv: -kv[1].height):
        if x + im.width > W: x = 0; y += rowh + 1; rowh = 0
        pos[n] = (x, y); x += im.width + 1; rowh = max(rowh, im.height)
    out = Image.new('RGBA', (W, y + rowh))
    frames = {}
    for n, im in ims.items():
        px, py = pos[n]; out.paste(im, (px, py), im)
        frames[n] = {'frame': {'x': px, 'y': py, 'w': im.width, 'h': im.height}, 'rotated': False, 'trimmed': False,
                     'spriteSourceSize': {'x': 0, 'y': 0, 'w': im.width, 'h': im.height}, 'sourceSize': {'w': im.width, 'h': im.height}}
    out.save(G + 'quarrydown.png', optimize=True)
    json.dump({'frames': frames, 'meta': {'image': 'quarrydown.png', 'size': {'w': out.width, 'h': out.height}, 'scale': '1'}}, open(G + 'quarrydown.json', 'w'))
    for n, im in ims.items(): print(n, im.size)


def granger():
    a, m = C.load(A + 'granger_walk.png'); cells = C.grid(a, m, 4, 4)
    FW, FH = 28, 32
    k = min((FH - 1) / max(o['mask'].shape[0] for r in cells for o in r), (FW - 1) / max(o['mask'].shape[1] for r in cells for o in r))
    sheet = Image.new('RGBA', (FW * 4, FH * 4))
    for r in range(4):
        for c in range(4):
            im = C.shrink(cells[r][c], k); sheet.paste(im, (c * FW + (FW - im.width) // 2, r * FH + FH - im.height), im)
    sheet.save(G + 'tr_granger.png')
    a, m = C.load(A + 'granger_portraits.png'); faces = C.grid(a, m, 1, 2)[0]
    k = 63 / max(max(o['mask'].shape) for o in faces)
    tp = Image.open(G + 'tr_portraits.png').convert('RGBA')
    out = Image.new('RGBA', (128, max(tp.height, (PORTRAIT_ROW + 1) * 64))); out.paste(tp.crop((0, 0, 128, min(tp.height, PORTRAIT_ROW * 64))), (0, 0))
    for j, o in enumerate(faces):
        im = C.shrink(o, k); out.paste(im, (j * 64 + (64 - im.width) // 2, PORTRAIT_ROW * 64 + 64 - im.height), im)
    out.save(G + 'tr_portraits.png', optimize=True)


def pit():
    Image.open(A + 'quarry_pit_arena.png').convert('RGB').resize((672, 896), Image.LANCZOS).save(G + 'gym_qd.jpg', quality=88)


if __name__ == '__main__':
    atlas(); granger(); pit()
