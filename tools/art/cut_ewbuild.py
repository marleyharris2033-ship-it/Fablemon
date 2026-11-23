"""Elderwood buildings (the user's art, 23 Nov 2026): art_incoming/ewbuild/NN_Name.png on magenta.
Each is keyed, trimmed and scaled to its world width (at the game's 3x HD detail) and packed into
src/hd_world/ewb.webp + ewb.json (frames in 3x px; elderwood.js shows them at a third)."""
import json, os, glob, numpy as np
from PIL import Image
from scipy import ndimage as ndi
SRC = 'art_incoming/ewbuild/'; OUT = 'src/hd_world/'
# frame name: (file number, world width in px)
B = {'ewb_lodge': (1, 184), 'ewb_inn': (2, 150), 'ewb_store': (3, 134), 'ewb_mill': (4, 132), 'ewb_mill_old': (5, 132),
     'ewb_carver': (6, 112), 'ewb_joinery': (7, 156), 'ewb_smith': (8, 128), 'ewb_bake': (9, 130), 'ewb_oak': (10, 160),
     'ewb_timber': (11, 120), 'ewb_woodcutter': (12, 112), 'ewb_oldcottage': (13, 118), 'ewb_gardener': (14, 120),
     'ewb_moss': (15, 112), 'ewb_riverside': (16, 116), 'ewb_ferry': (17, 116), 'ewb_tall': (18, 92), 'ewb_hunters': (19, 122),
     'ewb_stone': (20, 116), 'ewb_tree': (21, 104)}
def key(p):
    a = np.asarray(Image.open(p).convert('RGB')).astype(float); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mag = (r - g) + (b - g) - abs(r - b)                           # how magenta a pixel is
    alpha = np.clip((300 - mag) / 140, 0, 1)                         # pure magenta -> 0, building -> 1
    lb, n = ndi.label(alpha > .5); sz = ndi.sum(alpha > .5, lb, range(1, n + 1))
    keep = np.isin(lb, [i + 1 for i, s in enumerate(sz) if s > .002 * alpha.size])  # drop specks
    alpha = alpha * ndi.binary_dilation(keep, iterations=2)
    # despill: pull the magenta tint out of the soft edge
    sp = np.clip(np.minimum(r, b) - g, 0, None) * (1 - alpha); a[..., 0] -= sp; a[..., 2] -= sp
    rgba = np.dstack([np.clip(a, 0, 255), alpha * 255]).astype(np.uint8)
    ys, xs = np.nonzero(alpha > .05); return rgba[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
pics = {}
for name, (num, ww) in B.items():
    p = glob.glob(SRC + f'{num:02d}_*.png')[0]; im = key(p); W = ww * 3; H = round(im.shape[0] * W / im.shape[1])
    pics[name] = np.asarray(Image.fromarray(im).resize((W, H), Image.LANCZOS))
# the broken mill must sit exactly where the restored one does: same size
pics['ewb_mill_old'] = np.asarray(Image.fromarray(pics['ewb_mill_old']).resize(pics['ewb_mill'].shape[1::-1], Image.LANCZOS))
items = sorted(pics.items(), key=lambda t: -t[1].shape[0]); AW = 2048; x = y = rowh = 0; fr = {}
for k, im in items:
    h, w = im.shape[:2]
    if x + w > AW: x = 0; y += rowh + 2; rowh = 0
    fr[k] = dict(x=x, y=y, w=w, h=h); x += w + 2; rowh = max(rowh, h)
atlas = np.zeros((y + rowh, AW, 4), np.uint8)
for k, im in pics.items(): f = fr[k]; atlas[f['y']:f['y'] + f['h'], f['x']:f['x'] + f['w']] = im
Image.fromarray(atlas).save(OUT + 'ewb.webp', 'WEBP', quality=90, alpha_quality=100, method=6)
json.dump({'frames': {k: {'frame': f} for k, f in fr.items()}}, open(OUT + 'ewb.json', 'w'))
print('ewb', atlas.shape, os.path.getsize(OUT + 'ewb.webp') // 1024, 'KB'); [print(k, f['w'] // 3, f['h'] // 3) for k, f in fr.items()]
