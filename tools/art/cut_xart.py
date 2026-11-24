"""Rootway shrines, the farm stable and its props, Elderwood's ancient trees, the Eldest Tree and the Harvester
(the user's art, 24 Nov 2026): one sheet, art_incoming/xart/sheet.png, on magenta.
Each piece is picked out by the box it sits in on the sheet, keyed, sized to its width in the world (in px, 16 to a
tile) and packed at 3x into src/hd_world/xa.webp + xa.json. mounts.js, rootway.js and elderwood.js show them at a third."""
import json, os
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

SRC = 'art_incoming/xart/sheet.png'; OUT = 'src/hd_world/'
# name: (x0, y0, x1, y1) on the sheet, width in the world
P = {
    'shr_sleep': ((8, 78, 322, 406), 52), 'shr_awake': ((326, 78, 642, 406), 52), 'shr_icon': ((652, 250, 744, 342), 18),
    'stb_stable': ((784, 2, 1486, 330), 168),
    'stb_hay': ((740, 340, 856, 418), 18), 'stb_hay2': ((862, 324, 986, 426), 20), 'stb_trough': ((998, 350, 1146, 414), 26),
    'stb_bucket': ((1158, 338, 1240, 420), 13), 'stb_brush': ((1268, 332, 1338, 422), 9), 'stb_saddle': ((1370, 324, 1492, 430), 20),
    'stb_hitch': ((722, 426, 886, 522), 28), 'stb_barrow': ((908, 422, 1066, 530), 26), 'stb_sign': ((1066, 410, 1174, 536), 18),
    'stb_fence': ((1186, 434, 1342, 518), 26), 'stb_gate': ((1348, 424, 1518, 520), 28),
    'ewt_oak1': ((6, 556, 240, 716), 72), 'ewt_oak2': ((240, 556, 436, 716), 62), 'ewt_oak3': ((432, 556, 664, 716), 72),
    'ewt_pine1': ((14, 712, 146, 890), 38), 'ewt_pine2': ((146, 712, 304, 890), 42), 'ewt_elder': ((304, 712, 484, 890), 52),
    'ewt_birch': ((482, 712, 626, 890), 40), 'ewt_hollow': ((4, 884, 164, 1014), 46), 'ewt_log': ((160, 900, 346, 1010), 48),
    'ewt_stump': ((332, 920, 462, 1012), 26), 'ewt_shrooms': ((458, 904, 552, 1010), 22), 'ewt_fern': ((550, 912, 670, 1014), 24),
    'ew_eldest': ((642, 556, 1116, 1006), 136), 'ew_harvester': ((1092, 588, 1532, 960), 104),
}
a = np.asarray(Image.open(SRC).convert('RGB')).astype(float); r, g, b = a[..., 0], a[..., 1], a[..., 2]
mag = (r - g) + (b - g) - abs(r - b)
ALPHA = np.clip((300 - mag) / 140, 0, 1)
LB, _ = ndi.label(ndi.binary_dilation(ALPHA > .5, iterations=1))
CENT = {i + 1: c for i, c in enumerate(ndi.center_of_mass(np.ones_like(LB), LB, range(1, LB.max() + 1)))}
SIZE = {i + 1: s for i, s in enumerate(ndi.sum(np.ones_like(LB), LB, range(1, LB.max() + 1)))}

def cut(box):
    x0, y0, x1, y1 = box
    # every blob whose middle sits in this box (so a neighbour's overhang stays with its neighbour)
    ids = [i for i, (cy, cx) in CENT.items() if x0 <= cx < x1 and y0 <= cy < y1 and SIZE[i] > 25 and not (cy < 42 and cx < 1200)]   # (not the section labels)
    keep = np.isin(LB, ids); keep[:y0] = 0; keep[y1:] = 0; keep[:, :x0] = 0; keep[:, x1:] = 0
    al = ALPHA * ndi.binary_dilation(keep, iterations=1)
    c = a.copy(); sp = np.clip(np.minimum(c[..., 0], c[..., 2]) - c[..., 1], 0, None) * (1 - al); c[..., 0] -= sp; c[..., 2] -= sp
    rgba = np.dstack([np.clip(c, 0, 255), al * 255]).astype(np.uint8)
    ys, xs = np.nonzero(al > .05); return rgba[ys.min():ys.max() + 1, xs.min():xs.max() + 1]

pics = {}
for k, (box, ww) in P.items():
    im = cut(box); W = ww * 3; H = round(im.shape[0] * W / im.shape[1])
    pics[k] = np.asarray(Image.fromarray(im).resize((W, H), Image.LANCZOS))
items = sorted(pics.items(), key=lambda t: -t[1].shape[0]); AW = 1024; x = y = rowh = 0; fr = {}
for k, im in items:
    h, w = im.shape[:2]
    if x + w > AW: x = 0; y += rowh + 2; rowh = 0
    fr[k] = dict(x=x, y=y, w=w, h=h); x += w + 2; rowh = max(rowh, h)
atlas = np.zeros((y + rowh, AW, 4), np.uint8)
for k, im in pics.items(): f = fr[k]; atlas[f['y']:f['y'] + f['h'], f['x']:f['x'] + f['w']] = im
Image.fromarray(atlas).save(OUT + 'xa.webp', 'WEBP', quality=90, alpha_quality=100, method=6)
json.dump({'frames': {k: {'frame': f} for k, f in fr.items()}}, open(OUT + 'xa.json', 'w'))
print('xa', atlas.shape, os.path.getsize(OUT + 'xa.webp') // 1024, 'KB'); [print(k, f['w'] // 3, f['h'] // 3) for k, f in fr.items()]
# a contact sheet to check the cut
cs = Image.new('RGBA', (AW, atlas.shape[0]), (110, 150, 100, 255)); cs.alpha_composite(Image.fromarray(atlas)); cs.save('/tmp/xa_check.png')
