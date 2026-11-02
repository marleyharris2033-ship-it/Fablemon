import sys, json, base64, numpy as np
sys.argv = ['x', 'a']
src = open('cut_items.py').read()
exec(src.split('SHEETS = [')[0])
from PIL import Image
U = '/mnt/user-data/uploads/'
def objects_rows(a, m, k, cols):
    for dil in (10, 7, 5, 3, 1):
        lab, n = ndimage.label(ndimage.binary_dilation(m, iterations=dil))
        if n >= k: break
    sz = ndimage.sum(m, lab, range(1, n + 1)); cm = ndimage.center_of_mass(m, lab, range(1, n + 1))
    big = list(np.argsort(sz)[::-1][:k]); groups = {b: [b] for b in big}
    for i in range(n):
        if i in groups: continue
        b = min(big, key=lambda b: (cm[i][0] - cm[b][0]) ** 2 + (cm[i][1] - cm[b][1]) ** 2); groups[b].append(i)
    big.sort(key=lambda b: cm[b][0]); rows = []; i = 0
    for c in cols: rows.append(sorted(big[i:i + c], key=lambda b: cm[b][1])); i += c
    out = []
    for row in rows:
        orow = []
        for b in row:
            g = np.isin(lab, [i + 1 for i in groups[b]]) & m; ys, xs = np.where(g); sl = (slice(ys.min(), ys.max() + 1), slice(xs.min(), xs.max() + 1))
            orow.append(dict(rgb=a[sl][..., :3], mask=g[sl]))
        out.append(orow)
    return out
CROPS, ICONS = {}, {}
a, m = load(U + '1d663d9b-image.png'); rows = objects_rows(a, m, 15, [4, 4, 4, 3])
for name, row in zip(['frostkale', 'emberbeet', 'snowpea'], rows[:3]):
    k = 17 / max(max(o['mask'].shape) for o in row)
    for i, o in enumerate(row): CROPS[f'{name}{i + 1}'] = fit(o, k, 28)
for iid, o in zip(['frost_kale', 'ember_beet', 'snowpea'], rows[3]): ICONS[iid] = icon(o)
a, m = load(U + '09059048-image.png'); rows = objects_rows(a, m, 8, [4, 4])
for iid, o in zip(['frostkale_seeds', 'emberbeet_seeds', 'snowpea_seeds', 'kale_soup', 'roast_beets', 'snowpea_stirfry', 'winter_stew', 'beet_cider'], rows[0] + rows[1]): ICONS[iid] = icon(o)
# greenhouse: frame keeps its colour, glass becomes see-through, the floor (magenta) is cut away
a, m = load(U + '09d2e0ab-image.png'); ys, xs = np.where(m); sl = (slice(ys.min(), ys.max() + 1), slice(xs.min(), xs.max() + 1))
o = dict(rgb=a[sl][..., :3], mask=m[sl]); gh = fit(o, 54 / o['mask'].shape[1], 24)
px = np.array(gh).astype(int); r, g, b = px[..., 0], px[..., 1], px[..., 2]
glass = (px[..., 3] > 0) & (b > 190) & (g > 190) & (b - r > 18)
px[glass, 3] = 70
GH = Image.fromarray(px.astype(np.uint8), 'RGBA')
def enc(im): a2 = np.asarray(im.convert('RGBA')); return [im.width, im.height, base64.b64encode(a2.tobytes()).decode()]
json.dump({'crops': {k: enc(v) for k, v in CROPS.items()}, 'icons': {k: enc(v) for k, v in ICONS.items()}, 'greenhouse': enc(GH)}, open('../src/winterart.json', 'w'))
pv = Image.new('RGBA', (260, 90), (120, 160, 90, 255)); x = 2
for im in CROPS.values(): pv.paste(im, (x, 22 - im.height), im); x += im.width + 2
x = 2
for im in ICONS.values(): pv.paste(im, (x, 26), im); x += 25
pv.paste(GH, (2, 88 - GH.height), GH)
pv.resize((pv.width * 4, pv.height * 4), Image.NEAREST).save('preview_winter.png'); print(GH.size, len(CROPS), len(ICONS))
