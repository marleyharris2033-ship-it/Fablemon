"""Cut the Highmoor art in art_incoming/highmoor into game sprites.

  buildings + props -> src/highmoor.png / highmoor.json (atlas 'hm')
     props (4x4 sheet): small_windmill kite_pole flour_sacks millstone / hay_cart weathervane wind_chimes banner_pole /
                        heather wall bench glider / birdhouse windswept_tree planter grain_barrel
  tamsin_walk       -> src/tr_tamsin.png (4x4 frames of 28x32)
  tamsin_portraits  -> row 13 of src/tr_portraits.png (ready, beaten)
  gym_interior      -> src/gym_hm.jpg (672x896), the windmill's mill floor
  battle_bg         -> src/battle_highmoor.jpg (960x540), the windmill gallery
Run from the repo root:  python3 tools/art/cut_highmoor.py   (safe to re-run)
"""
import json, os, sys
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
import cut_thirds as C

A = 'art_incoming/highmoor/'
G = 'src/'
PORTRAIT_ROW = 13
BUILDINGS = [('hm_windmill', 'windmill_big', 150), ('hm_cliff_cottage', 'cliff_cottage', 132), ('hm_shop', 'shop_weathervane', 132),
             ('hm_clinic', 'clinic', 112), ('hm_kite_house', 'kite_house', 92), ('hm_windpump', 'windpump_cottage', 124)]
PROPS = ['small_windmill', 'kite_pole', 'flour_sacks', 'millstone', 'hay_cart', 'weathervane', 'wind_chimes', 'banner_pole',
         'heather', 'wall', 'bench', 'glider', 'birdhouse', 'windswept_tree', 'planter', 'grain_barrel']
PROP_K = .115
PROP_BIG = {'small_windmill': .15, 'windswept_tree': .15, 'glider': .13, 'hay_cart': .12}


def whole(path, width):
    a, m = C.load(path)
    o = C.piece(a, m, 0, m.shape[0], 0, m.shape[1], keep=.002)
    return C.shrink(o, width / o['mask'].shape[1])


def atlas():
    ims = {n: whole(A + f + '.png', w) for n, f, w in BUILDINGS}
    a, m = C.load(A + 'props.png'); cells = C.grid(a, m, 4, 4)
    for i, n in enumerate(PROPS): ims['hm_' + n] = C.shrink(cells[i // 4][i % 4], PROP_BIG.get(n, PROP_K))
    W = 512; x = y = rowh = 0; pos = {}
    for n, im in sorted(ims.items(), key=lambda kv: -kv[1].height):
        if x + im.width > W: x = 0; y += rowh + 1; rowh = 0
        pos[n] = (x, y); x += im.width + 1; rowh = max(rowh, im.height)
    out = Image.new('RGBA', (W, y + rowh)); frames = {}
    for n, im in ims.items():
        px, py = pos[n]; out.paste(im, (px, py), im)
        frames[n] = {'frame': {'x': px, 'y': py, 'w': im.width, 'h': im.height}, 'rotated': False, 'trimmed': False,
                     'spriteSourceSize': {'x': 0, 'y': 0, 'w': im.width, 'h': im.height}, 'sourceSize': {'w': im.width, 'h': im.height}}
    out.save(G + 'highmoor.png', optimize=True)
    json.dump({'frames': frames, 'meta': {'image': 'highmoor.png', 'size': {'w': out.width, 'h': out.height}, 'scale': '1'}}, open(G + 'highmoor.json', 'w'))
    for n, im in ims.items(): print(n, im.size)


def tamsin():
    a, m = C.load(A + 'tamsin_walk.png'); cells = C.grid(a, m, 4, 4)
    FW, FH = 28, 32
    k = min((FH - 1) / max(o['mask'].shape[0] for r in cells for o in r), (FW - 1) / max(o['mask'].shape[1] for r in cells for o in r))
    sheet = Image.new('RGBA', (FW * 4, FH * 4))
    for r in range(4):
        for c in range(4):
            im = C.shrink(cells[r][c], k); sheet.paste(im, (c * FW + (FW - im.width) // 2, r * FH + FH - im.height), im)
    sheet.save(G + 'tr_tamsin.png')
    a, m = C.load(A + 'tamsin_portraits.png'); faces = C.grid(a, m, 1, 2)[0]
    k = 63 / max(max(o['mask'].shape) for o in faces)
    tp = Image.open(G + 'tr_portraits.png').convert('RGBA')
    out = Image.new('RGBA', (128, max(tp.height, (PORTRAIT_ROW + 1) * 64))); out.paste(tp.crop((0, 0, 128, min(tp.height, PORTRAIT_ROW * 64))), (0, 0))
    for j, o in enumerate(faces):
        im = C.shrink(o, k); out.paste(im, (j * 64 + (64 - im.width) // 2, PORTRAIT_ROW * 64 + 64 - im.height), im)
    out.save(G + 'tr_portraits.png', optimize=True)


def arena():
    Image.open(A + 'gym_interior.png').convert('RGB').resize((672, 896), Image.LANCZOS).save(G + 'gym_hm.jpg', quality=88)
    Image.open(A + 'battle_bg.png').convert('RGB').crop((0, 160, 1536, 1024)).resize((960, 540), Image.LANCZOS).save(G + 'battle_highmoor.jpg', quality=88)


if __name__ == '__main__':
    atlas(); tamsin(); arena()
