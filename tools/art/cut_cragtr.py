import sys, numpy as np
src = open('/home/claude/work/cut_bogtr.py').read().split("G = '/home/claude/game/'")[0]
exec(src)
from PIL import Image
G = '/home/claude/game/'
# battle background
Image.open(U + 'a476b623-image.png').convert('RGB').resize((960, 540), Image.LANCZOS).save(G + 'battle_crag.jpg', quality=88)
# trainers: portraits row 9 (miner), 10 (climber)
tp = Image.open(G + 'tr_portraits.png'); rows0 = tp.height // 64
out = Image.new('RGBA', (128, 64 * (rows0 + 2))); out.paste(tp, (0, 0))
prev = Image.new('RGBA', (2 * 252, 128), (200, 220, 180, 255))
for j, (kind, por, walk) in enumerate([('miner', 'ab608203-image.png', '6b86263b-image.png'), ('climber', '3f08c62b-image.png', '8ab0b539-image.png')]):
    a, m = load(U + por)
    lab, n = ndimage.label(ndimage.binary_dilation(m, iterations=6)); sz = ndimage.sum(m, lab, range(1, n + 1)); cm = ndimage.center_of_mass(m, lab, range(1, n + 1))
    big = sorted(np.argsort(sz)[::-1][:2], key=lambda b: cm[b][1]); fo = []
    for b in big:
        g = (lab == b + 1) & m; ys, xs = np.where(g); sl = (slice(ys.min(), ys.max() + 1), slice(xs.min(), xs.max() + 1)); fo.append(dict(rgb=a[sl][..., :3], mask=g[sl]))
    k = 64 / max(max(o['mask'].shape) for o in fo)
    for col, o in ((0, fo[0]), (1, fo[1])):   # left image = ready to battle, right = beaten but cheerful
        im = fit(o, k, 40); out.paste(im, (col * 64 + (64 - im.width) // 2, (rows0 + j) * 64 + 64 - im.height), im)
    a, m = load(U + walk); cells = grid16(a, m)
    k = 31 / max(o['mask'].shape[0] for row in cells for o in row)
    sheet = Image.new('RGBA', (112, 128))
    for r in range(4):
        for c in range(4):
            im = fit(cells[r][c], k, 26); sheet.paste(im, (c * 28 + (28 - im.width) // 2, r * 32 + 32 - im.height), im)
    sheet.save(G + f'tr_{kind}.png')
    prev.paste(sheet, (j * 252, 0), sheet); pr = out.crop((0, (rows0 + j) * 64, 128, (rows0 + j + 1) * 64)); prev.paste(pr, (j * 252 + 118, 0), pr)
out.save(G + 'tr_portraits.png'); print('rows', rows0, rows0 + 1)
# Fulgarok: overworld 4x4 at 40px, battle front/back 64px, icon 48px
a, m = load(U + '25b18d6b-image.png'); cells = grid16(a, m)
k = 39 / max(max(o['mask'].shape) for row in cells for o in row)
sheet = Image.new('RGBA', (160, 160))
for r in range(4):
    for c in range(4):
        im = fit(cells[r][c], k, 32); sheet.paste(im, (c * 40 + (40 - im.width) // 2, r * 40 + 40 - im.height), im)
sheet.save(G + 'mon_fulgarok.png')
a, m = load(U + '4c16f410-image.png')
lab, n = ndimage.label(ndimage.binary_dilation(m, iterations=6)); sz = ndimage.sum(m, lab, range(1, n + 1)); cm = ndimage.center_of_mass(m, lab, range(1, n + 1))
big = sorted(np.argsort(sz)[::-1][:2], key=lambda b: cm[b][1]); fo = []
for b in big:
    g = (lab == b + 1) & m; ys, xs = np.where(g); sl = (slice(ys.min(), ys.max() + 1), slice(xs.min(), xs.max() + 1)); fo.append(dict(rgb=a[sl][..., :3], mask=g[sl]))
cell, icon = pair(fo[0], fo[1], 40)
# icon: just the head and crystals from the front view
f0 = fo[0]; H0, W0 = f0['mask'].shape; hd = dict(rgb=f0['rgb'][:int(H0 * .45), :int(W0 * .62)], mask=f0['mask'][:int(H0 * .45), :int(W0 * .62)])
ys, xs = np.where(hd['mask']); hd = dict(rgb=hd['rgb'][ys.min():ys.max() + 1, xs.min():xs.max() + 1], mask=hd['mask'][ys.min():ys.max() + 1, xs.min():xs.max() + 1])
ki = 44 / max(hd['mask'].shape); ic = fit(hd, ki, 40); icon = Image.new('RGBA', (48, 48)); icon.paste(ic, ((48 - ic.width) // 2, 46 - ic.height), ic)
bt = Image.open(G + 'mon_battle.png'); bt.paste(Image.new('RGBA', (128, 64)), (0, bt.height - 64)); bt.paste(cell, (0, bt.height - 64), cell); bt.save(G + 'mon_battle.png')
ic0 = Image.open(G + 'mon_icons.png'); ic0.paste(Image.new('RGBA', (48, 48)), (ic0.width - 48, 0)); ic0.paste(icon, (ic0.width - 48, 0), icon); ic0.save(G + 'mon_icons.png')
pv = Image.new('RGBA', (160 + 128 + 48 + 20, 160), (60, 50, 70, 255)); pv.paste(sheet, (0, 0), sheet); pv.paste(cell, (165, 0), cell); pv.paste(icon, (300, 0), icon)
pv.resize((pv.width * 3, pv.height * 3), Image.NEAREST).save('/home/claude/work/crag/legend_preview.png')
prev.resize((prev.width * 3, prev.height * 3), Image.NEAREST).save('/home/claude/work/crag/tr_preview.png')
