import sys, numpy as np
src = open('/home/claude/work/cut_bogtr.py').read().split("G = '/home/claude/game/'")[0]
exec(src)
from PIL import Image, ImageOps
G = '/home/claude/game/'; F = 28
pv = Image.new('RGBA', (5 * 118, 112), (200, 220, 180, 255))
def put(sheet, im, r, c, lift=0):
    sheet.paste(im, (c * F + (F - im.width) // 2, r * F + F - im.height - lift), im)
# drawn walk sheets: Cindhop and Craglet
for j, (sp, f) in enumerate([('cindhop', '2c3d6e99-image.png'), ('craglet', 'c5f6f765-image.png')]):
    a, m = load(U + f); cells = grid16(a, m)
    k = (F - 1) / max(max(o['mask'].shape) for row in cells for o in row)
    sheet = Image.new('RGBA', (F * 4, F * 4))
    for r in range(4):
        for c in range(4): put(sheet, fit(cells[r][c], k, 26), r, c)
    sheet.save(G + f'mon_{sp}.png'); pv.paste(sheet, (j * 118, 0), sheet)
# made from the battle art until their own sheets arrive: front for down and left, mirrored for right, back for up, with a little hop
a, m = load(U + '87fbc6ad-image.png')
lab, n = ndimage.label(ndimage.binary_dilation(m, iterations=8)); sz = ndimage.sum(m, lab, range(1, n + 1)); cm = ndimage.center_of_mass(m, lab, range(1, n + 1))
big = list(np.argsort(sz)[::-1][:10]); groups = {b: [b] for b in big}
for i in range(n):
    if i in groups or sz[i] < 20: continue
    b = min(big, key=lambda b: (cm[i][0] - cm[b][0]) ** 2 + (cm[i][1] - cm[b][1]) ** 2); groups[b].append(i)
big.sort(key=lambda b: cm[b][0]); rows = [sorted(big[r * 2:r * 2 + 2], key=lambda b: cm[b][1]) for r in range(5)]
def obj(b):
    g = np.isin(lab, [i + 1 for i in groups[b]]) & m; ys, xs = np.where(g); sl = (slice(ys.min(), ys.max() + 1), slice(xs.min(), xs.max() + 1)); return dict(rgb=a[sl][..., :3], mask=g[sl])
for j, (sp, ri) in enumerate([('bristlecone', 2), ('clinkit', 3), ('ramruff', 4)]):
    fr, bk = obj(rows[ri][0]), obj(rows[ri][1])
    k = (F - 2) / max(max(fr['mask'].shape), max(bk['mask'].shape))
    f_im, b_im = fit(fr, k, 26), fit(bk, k, 26)
    views = {0: f_im, 1: f_im, 2: ImageOps.mirror(f_im), 3: b_im}
    sheet = Image.new('RGBA', (F * 4, F * 4))
    for r, im in views.items():
        for c, lift in enumerate([0, 1, 0, 2]):
            frame = im if c % 2 == 0 else im.resize((im.width, max(1, im.height - 1)), Image.NEAREST)
            put(sheet, frame, r, c, lift)
    sheet.save(G + f'mon_{sp}.png'); pv.paste(sheet, ((j + 2) * 118, 0), sheet)
pv.resize((pv.width * 3, pv.height * 3), Image.NEAREST).save('/home/claude/work/crag/walk_preview.png')
