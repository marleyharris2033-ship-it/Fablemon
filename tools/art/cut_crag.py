import sys, json, base64, numpy as np
sys.argv = ['x', 'a']
exec(open('/home/claude/work/cut_evo.py').read().split('rows = {}')[0])
exec(open('/home/claude/work/cut_items.py').read().split('def icon')[0].split("U = '/mnt/user-data/uploads/'")[1])
from PIL import Image
U = '/mnt/user-data/uploads/'
def enc(im): a = np.asarray(im.convert('RGBA')); return [im.width, im.height, base64.b64encode(a.tobytes()).decode()]
OBJ = {}
# props: name, width (or None,height)
props = [('cart_front', 18), ('cart_left', 22), ('cart_back', 18), ('cart_right', 22), ('cart_ore', 18), ('cart_gems', 18), ('cart_broken', 26), ('boulder', 16),
         ('boulder2', 17), ('stone_small', 9), ('rock_pile', 20), ('ore_rock', 16), ('pick_rock', 16), ('lamp_post', (None, 28)), ('crate', 15)]
a, m = load(U + '9f9cb6c9-image.png')
src = 'def objects_n' + open('/home/claude/work/cut_items.py').read().split('def objects_n')[1].split('def icon')[0]
src = src.replace('def objects_n(a, m, k)', 'def objects_15(a, m, k)').replace("rows = [sorted(big[r * cols:(r + 1) * cols], key=lambda b: cm[b][1]) for r in range(k // cols)]", "rows = [sorted(big[r * cols:(r + 1) * cols], key=lambda b: cm[b][1]) for r in range((k + cols - 1) // cols)]")
exec(src); objs = objects_15(a, m, 15)
print(len(objs))
for o, (n, w) in zip(objs, props):
    H, W = o['mask'].shape
    OBJ[n] = fit(o, (w / W) if isinstance(w, int) else (w[1] / H), 32)
rails = ['r_h', 'r_v', 'r_c1', 'r_c2', 'r_c3', 'r_c4', 'r_t', 'r_x', 'buf_n', 'buf_e', 'buf_s', 'buf_w', 'lever_l', 'lever_r', 'signal', 'tunnel']
a, m = load(U + '4a2b5b1e-image.png'); objs = objects_n(a, m, 16)
size = {'lever_l': (None, 15), 'lever_r': (None, 15), 'signal': (None, 22), 'tunnel': 48}
for o, n in zip(objs, rails):
    if n not in size: continue
    w = size[n]; H, W = o['mask'].shape
    OBJ[n] = fit(o, (w / W) if isinstance(w, int) else (w[1] / H), 32)
# ground squares: grid crop (4 x 4)
im = np.asarray(Image.open(U + 'd75c4765-image.png').convert('RGB')).astype(int)
r, g, b = im[..., 0], im[..., 1], im[..., 2]; bg = (np.minimum(r, b) - g > 85) & (r > 150) & (b > 150)
ys = np.where((~bg).sum(1) > 200)[0]; xs = np.where((~bg).sum(0) > 200)[0]
def runs(v):
    out = []; s = v[0]; p = v[0]
    for q in v[1:]:
        if q != p + 1: out.append((s, p)); s = q
        p = q
    out.append((s, p)); return [x for x in out if x[1] - x[0] > 100]
RY, RX = runs(ys), runs(xs); print(RY, RX)
names = ['cobble_moss', 'cobble_moss2', 'dirt_pebble', 'dirt_light', 'slab', 'dirt_patch', 'cobble_dry', 'cobble', 'ledge', 'cliff2', 'cliff_corner', 'cliff_crack', 'crack', 'crack_boulder', 'rubble', 'crack_bridge']
GROUND = {}
src = Image.open(U + 'd75c4765-image.png').convert('RGBA')
for i, n in enumerate(names):
    (y0, y1), (x0, x1) = RY[i // 4], RX[i % 4]
    t = src.crop((x0 + 4, y0 + 4, x1 - 3, y1 - 3))
    a2 = np.asarray(t).copy(); rr, gg, bb = a2[..., 0].astype(int), a2[..., 1].astype(int), a2[..., 2].astype(int)
    mg = (np.minimum(rr, bb) - gg > 85); a2[mg, 3] = 0; t = Image.fromarray(a2)
    sz = 16 if n.startswith('crack') or n == 'rubble' else 32
    GROUND[n] = t.resize((sz, sz), Image.LANCZOS)
    if n in ('ledge', 'cliff2', 'cliff_corner', 'cliff_crack'): GROUND[n] = t.resize((32, 32), Image.LANCZOS)
json.dump({'objs': {k: enc(v) for k, v in OBJ.items()}, 'ground': {k: enc(v) for k, v in GROUND.items()}}, open('/home/claude/game/crag.json', 'w'))
pv = Image.new('RGBA', (560, 140), (120, 100, 80, 255)); x = 2
for k, v in OBJ.items():
    if x + v.width > 560: break
    pv.paste(v, (x, 60 - v.height), v); x += v.width + 4
x = 2
for k, v in GROUND.items(): pv.paste(v, (x, 70), v); x += v.width + 2
pv.resize((1680, 420), Image.NEAREST).save('/home/claude/work/crag/preview.png')
