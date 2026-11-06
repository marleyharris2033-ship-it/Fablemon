"""Cut the Glimmer Sea art in art_incoming/sea into game sprites.

  props.png     -> src/sea.png / sea.json (atlas 'sea'): rocks, reefs, buoys, flotsam, wreck, islets
  boat.png      -> src/boat_sail.png: the player's boat, 4 rows (down, left, right, up) x 2 bob frames of 48x48
  battle_bg.png -> src/battle_sea.jpg (cropped so the sandbar sits where the wild Fablemon stands)
Run from the repo root:  python3 tools/art/cut_sea.py
"""
import json, os, sys
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
import cut_thirds as C

A = 'art_incoming/sea/'
G = 'src/'
PROPS = [('rock', .12), ('rock_tall', .12), ('reef', .12), ('reef_kelp', .12),
         ('buoy_red', .11), ('buoy_teal', .11), ('buoy_bell', .11), ('flotsam', .12),
         ('wreck', .17), ('islet', .2), ('island', .22), ('lagoon', .22)]


def atlas():
    a, m = C.load(A + 'props.png'); cells = C.grid(a, m, 3, 4); ims = {}
    for i, (n, k) in enumerate(PROPS): ims['sea_' + n] = C.shrink(cells[i // 4][i % 4], k)
    W = 256; x = y = rowh = 0; pos = {}
    for n, im in sorted(ims.items(), key=lambda kv: -kv[1].height):
        if x + im.width > W: x = 0; y += rowh + 1; rowh = 0
        pos[n] = (x, y); x += im.width + 1; rowh = max(rowh, im.height)
    out = Image.new('RGBA', (W, y + rowh)); frames = {}
    for n, im in ims.items():
        px, py = pos[n]; out.paste(im, (px, py), im)
        frames[n] = {'frame': {'x': px, 'y': py, 'w': im.width, 'h': im.height}, 'rotated': False, 'trimmed': False,
                     'spriteSourceSize': {'x': 0, 'y': 0, 'w': im.width, 'h': im.height}, 'sourceSize': {'w': im.width, 'h': im.height}}
    out.save(G + 'sea.png', optimize=True)
    json.dump({'frames': frames, 'meta': {'image': 'sea.png', 'size': {'w': out.width, 'h': out.height}, 'scale': '1'}}, open(G + 'sea.json', 'w'))
    for n, im in ims.items(): print(n, im.size)


def boat():
    a, m = C.load(A + 'boat.png'); cells = C.grid(a, m, 4, 2); F = 48
    k = (F - 2) / max(max(o['mask'].shape) for r in cells for o in r)
    sheet = Image.new('RGBA', (F * 2, F * 4))
    for r in range(4):
        for c in range(2):
            im = C.shrink(cells[r][c], k); sheet.paste(im, (c * F + (F - im.width) // 2, r * F + F - im.height), im)
    sheet.save(G + 'boat_sail.png')


def background():
    im = Image.open(A + 'battle_bg.png').convert('RGB')
    im.crop((103, 23, 1463, 788)).resize((960, 540), Image.LANCZOS).save(G + 'battle_sea.jpg', quality=88)


if __name__ == '__main__':
    atlas(); boat(); background()
