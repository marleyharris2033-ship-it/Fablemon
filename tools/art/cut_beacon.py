"""Cut the Beaconreach art in art_incoming/beaconreach into game sprites.

  buildings + props -> src/beaconreach.png / beaconreach.json (atlas 'br')
  orrin_walk        -> src/tr_orrin.png (4x4 frames of 28x32, like the other trainers)
  orrin_portraits   -> row 12 of src/tr_portraits.png (ready, beaten)
  arena             -> src/gym_br.jpg (960x640, drawn at half size: 30 x 20 tiles) and
                       src/battle_beacon.jpg (960x540, the battle background for Orrin's fight)
Run from the repo root:  python3 tools/art/cut_beacon.py   (safe to re-run)
"""
import json, os, sys
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
import cut_thirds as C

A = 'art_incoming/beaconreach/'
G = 'src/'
PORTRAIT_ROW = 12
BUILDINGS = [('br_lighthouse', 'lighthouse', 128), ('br_harbour', 'harbour_office', 150), ('br_clinic', 'clinic', 112),
             ('br_shop', 'chandlery', 112), ('br_lookout', 'lookout_house', 84), ('br_cottage', 'cottage', 112)]
PROPS = ['lens', 'lantern_post', 'oil_cart', 'lamp_bench', 'windsock', 'telescope', 'tide_clock', 'signal_flags',
         'bell_frame', 'lifebuoy_post', 'oilskin_rack', 'rowboat', 'well', 'bench', 'dune_grass', 'planter']
PROP_K = .115


def whole(path, width):
    a, m = C.load(path)
    o = C.piece(a, m, 0, m.shape[0], 0, m.shape[1], keep=.002)
    return C.shrink(o, width / o['mask'].shape[1])


def atlas():
    ims = {n: whole(A + f + '.png', w) for n, f, w in BUILDINGS}
    a, m = C.load(A + 'props.png'); cells = C.grid(a, m, 4, 4)
    for i, n in enumerate(PROPS): ims['br_' + n] = C.shrink(cells[i // 4][i % 4], PROP_K)
    W = 512; x = y = rowh = 0; pos = {}
    for n, im in sorted(ims.items(), key=lambda kv: -kv[1].height):
        if x + im.width > W: x = 0; y += rowh + 1; rowh = 0
        pos[n] = (x, y); x += im.width + 1; rowh = max(rowh, im.height)
    out = Image.new('RGBA', (W, y + rowh)); frames = {}
    for n, im in ims.items():
        px, py = pos[n]; out.paste(im, (px, py), im)
        frames[n] = {'frame': {'x': px, 'y': py, 'w': im.width, 'h': im.height}, 'rotated': False, 'trimmed': False,
                     'spriteSourceSize': {'x': 0, 'y': 0, 'w': im.width, 'h': im.height}, 'sourceSize': {'w': im.width, 'h': im.height}}
    out.save(G + 'beaconreach.png', optimize=True)
    json.dump({'frames': frames, 'meta': {'image': 'beaconreach.png', 'size': {'w': out.width, 'h': out.height}, 'scale': '1'}}, open(G + 'beaconreach.json', 'w'))
    for n, im in ims.items(): print(n, im.size)


def orrin():
    a, m = C.load(A + 'orrin_walk.png'); cells = C.grid(a, m, 4, 4)
    FW, FH = 28, 32
    k = min((FH - 1) / max(o['mask'].shape[0] for r in cells for o in r), (FW - 1) / max(o['mask'].shape[1] for r in cells for o in r))
    sheet = Image.new('RGBA', (FW * 4, FH * 4))
    for r in range(4):
        for c in range(4):
            im = C.shrink(cells[r][c], k); sheet.paste(im, (c * FW + (FW - im.width) // 2, r * FH + FH - im.height), im)
    sheet.save(G + 'tr_orrin.png')
    a, m = C.load(A + 'orrin_portraits.png'); faces = C.grid(a, m, 1, 2)[0]
    k = 63 / max(max(o['mask'].shape) for o in faces)
    tp = Image.open(G + 'tr_portraits.png').convert('RGBA')
    out = Image.new('RGBA', (128, max(tp.height, (PORTRAIT_ROW + 1) * 64))); out.paste(tp.crop((0, 0, 128, min(tp.height, PORTRAIT_ROW * 64))), (0, 0))
    for j, o in enumerate(faces):
        im = C.shrink(o, k); out.paste(im, (j * 64 + (64 - im.width) // 2, PORTRAIT_ROW * 64 + 64 - im.height), im)
    out.save(G + 'tr_portraits.png', optimize=True)


def arena():
    im = Image.open(A + 'arena.png').convert('RGB')
    im.resize((960, 640), Image.LANCZOS).save(G + 'gym_br.jpg', quality=88)
    im.crop((0, 160, 1536, 1024)).resize((960, 540), Image.LANCZOS).save(G + 'battle_beacon.jpg', quality=88)


if __name__ == '__main__':
    atlas(); orrin(); arena()
