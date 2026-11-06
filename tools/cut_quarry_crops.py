"""Cut the Quarrydown crop and dish art (art_incoming/quarry_crops) into src/quarrycrops.json:
crop growth stages (with the soil mound removed, since the game draws the tilled soil), and icons for the
harvested crops, seed bags and dishes. Run from tools/:  python3 cut_quarry_crops.py"""
import sys, json, numpy as np
from scipy import ndimage
import base64
from PIL import Image
sys.path.insert(0, 'art'); import cut_thirds as C
def fit(o, k, _=None): return C.shrink(o, k)
def icon(o):
    im = C.shrink(o, 22 / max(o['mask'].shape)); c = Image.new('RGBA', (24, 24)); c.paste(im, ((24 - im.width) // 2, 23 - im.height), im); return c
def enc(im): a2 = np.asarray(im.convert('RGBA')); return [im.width, im.height, base64.b64encode(a2.tobytes()).decode()]
A = '../art_incoming/quarry_crops/'
NAMES = ['cragberry', 'quarrypepper', 'flintcorn', 'geodemelon']
ITEMS_ = ['cragberry', 'quarry_pepper', 'flintcorn', 'geode_melon']
DISHES = ['cragberry_jam', 'quarry_chilli', 'flintcorn_bread', 'geode_sorbet', 'quarryman_pie']

def unsoil(o):
    """drop the brown soil mound and its pebbles: soil-coloured pixels in the lower part, then anything left
    that isn't joined to the plant"""
    rgb, m = o['rgb'].astype(int), o['mask'].copy(); H = m.shape[0]
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    low = np.zeros_like(m); low[int(H * .45):] = 1
    soil = (r > 70) & (r < 200) & (g > 25) & (g < 125) & (b < 95) & (r - g > 35) & (r - g < 100) & (g - b > -5)
    dark = (r + g + b) < 150
    grey = (abs(r - g) < 22) & (abs(g - b) < 26) & (r < 175)
    m &= ~(low & soil)
    # outline and pebbles of the mound: dark or grey pixels low down with no plant colour beside them
    plant = m & ~dark & ~grey
    near = ndimage.binary_dilation(plant, iterations=2)
    m &= ~(low & (dark | grey) & ~near)
    lab, n = ndimage.label(m)
    if n:
        sz = ndimage.sum(m, lab, range(1, n + 1)); keep = [i + 1 for i in range(n) if sz[i] >= sz.max() * .12]
        m = np.isin(lab, keep)
    ys, xs = np.where(m); sl = (slice(ys.min(), ys.max() + 1), slice(xs.min(), xs.max() + 1))
    return dict(rgb=o['rgb'][sl], mask=m[sl])

CROPS, ICONS = {}, {}
a, m = C.load(A + 'crops.png'); cells = C.grid(a, m, 4, 6)
for name, iid, row in zip(NAMES, ITEMS_, cells):
    stages = [unsoil(o) for o in row[:4]]
    k = min(22 / max(o['mask'].shape[0] for o in stages), 24 / max(o['mask'].shape[1] for o in stages))
    for i, o in enumerate(stages): CROPS[f'{name}{i + 1}'] = fit(o, k, 28)
    ICONS[iid] = icon(row[4]); ICONS[name + '_seeds'] = icon(row[5])
a, m = C.load(A + 'dishes.png'); row = C.grid(a, m, 1, 5)[0]
for iid, o in zip(DISHES, row): ICONS[iid] = icon(o)
json.dump({'crops': {k: enc(v) for k, v in CROPS.items()}, 'icons': {k: enc(v) for k, v in ICONS.items()}}, open('../src/quarrycrops.json', 'w'))
pv = Image.new('RGBA', (16 * 24 + 8, 70), (150, 110, 70, 255)); x = 2
for im in CROPS.values(): pv.paste(im, (x, 30 - im.height), im); x += 24
x = 2
for im in ICONS.values(): pv.paste(im, (x, 40), im); x += 24
pv.resize((pv.width * 3, pv.height * 3), Image.NEAREST).save('/tmp/qcrops.png'); print(len(CROPS), len(ICONS))
