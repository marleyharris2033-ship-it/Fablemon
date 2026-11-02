import sys, json, base64, numpy as np
sys.argv = ['x', 'a']
exec(open('/home/claude/work/cut_evo.py').read().split('rows = {}')[0])
from PIL import Image
U = '/mnt/user-data/uploads/'
def objects_n(a, m, k):
    for dil in (10, 7, 5, 3, 1):
        lab, n = ndimage.label(ndimage.binary_dilation(m, iterations=dil))
        if n >= k: break
    sz = ndimage.sum(m, lab, range(1, n + 1)); cm = ndimage.center_of_mass(m, lab, range(1, n + 1))
    big = list(np.argsort(sz)[::-1][:k]); groups = {b: [b] for b in big}
    for i in range(n):
        if i in groups: continue
        b = min(big, key=lambda b: (cm[i][0] - cm[b][0]) ** 2 + (cm[i][1] - cm[b][1]) ** 2); groups[b].append(i)
    big.sort(key=lambda b: cm[b][0]); cols = 4; rows = [sorted(big[r * cols:(r + 1) * cols], key=lambda b: cm[b][1]) for r in range(k // cols)]
    out = []
    for row in rows:
        for b in row:
            g = np.isin(lab, [i + 1 for i in groups[b]]) & m; ys, xs = np.where(g); sl = (slice(ys.min(), ys.max() + 1), slice(xs.min(), xs.max() + 1))
            out.append(dict(rgb=a[sl][..., :3], mask=g[sl]))
    return out
def icon(o):
    k = 22 / max(o['mask'].shape); im = fit(o, k, 32); c = Image.new('RGBA', (24, 24)); c.paste(im, ((24 - im.width) // 2, 23 - im.height), im); return c
def obj(o, w=None, h=None):
    H, W = o['mask'].shape; k = (w / W) if w else (h / H); return fit(o, k, 32)
SHEETS = [
 ('3d8dc38d-image.png', 16, [(i, None) for i in ['veg_soup', 'corn_chowder', 'roast_turnip', 'jacket_potato', 'glazed_carrots', 'tomato_salad', 'pumpkin_pie', 'berry_crumble', 'hearty_stew', 'corn_fritters', 'tavern_pie', 'trainers_breakfast', 'fen_chowder', 'hearth_roast', 'grilled_trout', 'fish_pie']]),
 ('aeb032d7-image.png', 16, [(i, None) for i in ['minnow', 'brook_trout', 'silver_perch', 'honey', 'berry', 'mon_treat', 'feed', 'premium_feed', 'fertiliser', 'tonic', 'root_charm', 'sturdy_charm', 'watercress_seeds', 'wildrice_seeds', 'cranberry_seeds', 'lotus_seeds']]),
 ('d198b16f-image.png', 16, [('pot', ('pot', None, 22)), ('well', ('well', None, 30)), ('mine', ('mine', 48, None)), ('compost', ('compost', 18, None)), ('beehive', ('beehive', None, 24)), ('trough', ('trough', 32, None)),
   ('big_chest', ('chest2', 20, None)), ('fishing_hut', ('fishhut', 32, None)), ('training_ring', ('ring', 32, None)), ('quality_sprinkler', ('sprinkler2', None, 15)), ('golden_sprinkler', ('sprinkler3', None, 16)), ('busy_beehive', ('beehive2', 26, None)),
   ('quick_compost', ('compost2', 20, None)), ('deluxe_trough', ('trough2', 32, None)), ('farmstand', None), ('dirt_path', None)]),
 ('24b621b2-image.png', 16, [(i, None) for i in ['lantern', 'barrel', 'crate', 'bench', 'planter', 'flowerbed', 'hedge', 'bush', 'wildflowers', 'rockery', 'lamp', 'wall', 'pillar']] + [('birdbath', ('birdbath', None, 19)), ('sundial', ('sundial', None, 18)), ('bird_house', ('birdhouse', None, 24))]),
 ('1af98943-image.png', 8, [('stone_lantern', ('stonelantern', None, 22)), ('garden_fountain', ('gfountain', 32, None)), ('topiary', ('topiary', None, 24)), ('hearth_lantern', ('hearthlantern', None, 24)),
   ('hearth_sapling', ('hearthsap', None, 24)), ('oak_sapling', ('sap_oak', None, 18)), ('pine_sapling', ('sap_pine', None, 18)), ('apple_sapling', ('sap_apple', None, 18))]),
]
ICONS, OBJS = {}, {}
for f, k, names in SHEETS:
    a, m = load(U + f); objs = objects_n(a, m, k)
    for o, (iid, ob) in zip(objs, names):
        ICONS[iid] = icon(o)
        if ob: OBJS[ob[0]] = obj(o, ob[1], ob[2])
def enc(im): a = np.asarray(im.convert('RGBA')); return [im.width, im.height, base64.b64encode(a.tobytes()).decode()]
json.dump({'icons': {k: enc(v) for k, v in ICONS.items()}, 'objs': {k: enc(v) for k, v in OBJS.items()}}, open('../src/itemart.json', 'w'))
pv = Image.new('RGBA', (16 * 26, 6 * 26 + 60), (200, 220, 180, 255))
for i, (k, im) in enumerate(ICONS.items()): pv.paste(im, ((i % 16) * 26 + 1, (i // 16) * 26 + 1), im)
x = 2
for k, im in OBJS.items():
    if x + im.width > pv.width: break
    pv.paste(im, (x, pv.height - 2 - im.height), im); x += im.width + 3
pv.resize((pv.width * 3, pv.height * 3), Image.NEAREST).save('preview_items_preview.png')
x2 = Image.new('RGBA', (sum(i.width + 3 for i in OBJS.values()), 52), (200, 220, 180, 255)); x = 0
for im in OBJS.values(): x2.paste(im, (x, 50 - im.height), im); x += im.width + 3
x2.resize((x2.width * 3, x2.height * 3), Image.NEAREST).save('preview_items_objs.png')
print(len(ICONS), len(OBJS))
