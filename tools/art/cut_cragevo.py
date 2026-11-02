import sys, numpy as np
src = open('/home/claude/work/cut_bogtr.py').read().split("G = '/home/claude/game/'")[0]
exec(src)
from PIL import Image
G = '/home/claude/game/'; F = 40
NAMES = ['craglet_2', 'cindhop_2', 'bristlecone_2', 'clinkit_2', 'ramruff_2']
# walk sheets: five side by side; Cindhop's and Bristlecone's have 3 frames a row
def cutsAt(proj, k, lo, hi):
    """k equal-ish bands, each cut moved to the emptiest line near where it would fall"""
    out = [lo]
    for i in range(1, k):
        c = lo + (hi - lo) * i // k; w = (hi - lo) // (2 * k); seg = proj[c - w:c + w]; out.append(c - w + int(np.argmin(seg)))
    return out + [hi]
def gridN(a, m, cols, x0, x1):
    """fixed grid: equal columns across this sheet, four equal rows"""
    H = m.shape[0]; out = []
    xs_ = np.where(m[:, x0:x1].any(0))[0]; x0, x1 = x0 + xs_.min(), x0 + xs_.max() + 1
    RY = cutsAt(m[:, x0:x1].sum(1), 4, 0, H); CX = [x0 + v for v in cutsAt(m[:, x0:x1].sum(0), cols, 0, x1 - x0)]
    for r in range(4):
        orow = []
        for c in range(cols):
            cx0, cx1 = CX[c], CX[c + 1]
            mm = np.zeros_like(m); mm[RY[r]:RY[r + 1], cx0:cx1] = m[RY[r]:RY[r + 1], cx0:cx1]
            lab, n = ndimage.label(ndimage.binary_dilation(mm, iterations=3)); sz = ndimage.sum(mm, lab, range(1, n + 1))
            g = np.isin(lab, [i + 1 for i in range(n) if sz[i] >= sz.max() * .05]) & mm
            ys, xs = np.where(g); sl = (slice(ys.min(), ys.max() + 1), slice(xs.min(), xs.max() + 1)); orow.append(dict(rgb=a[sl][..., :3], mask=g[sl]))
        out.append(orow)
    return out
a, m = load(U + 'bc470b60-image.png')
cuts = [0, 418, 765, 1129, 1604, m.shape[1]]; cols = [4, 3, 3, 4, 4]
pv = Image.new('RGBA', (5 * 164, 160 + 70), (200, 220, 180, 255))
for j, sp in enumerate(NAMES):
    cells = gridN(a, m, cols[j], cuts[j], cuts[j + 1])
    if cols[j] == 3: cells = [[r[0], r[1], r[0], r[2]] for r in cells]   # stand, step, stand, other step
    k = (F - 2) / max(max(o['mask'].shape) for row in cells for o in row)
    sheet = Image.new('RGBA', (F * 4, F * 4))
    for r in range(4):
        for c in range(4):
            im = fit(cells[r][c], k, 30); sheet.paste(im, (c * F + (F - im.width) // 2, r * F + F - im.height), im)
    sheet.save(G + f'mon_{sp}.png'); pv.paste(sheet, (j * 164, 0), sheet)
# battle front/back + icons
a, m = load(U + 'f7a13880-image.png')
def cellobj(r, c):
    H, W = m.shape; RY = cutsAt(m.sum(1), 5, 0, H); CX = cutsAt(m.sum(0), 2, 0, W); mm = np.zeros_like(m); ys0, ys1, xs0, xs1 = RY[r], RY[r + 1], CX[c], CX[c + 1]
    mm[ys0:ys1, xs0:xs1] = m[ys0:ys1, xs0:xs1]
    lab, n = ndimage.label(ndimage.binary_dilation(mm, iterations=3)); sz = ndimage.sum(mm, lab, range(1, n + 1))
    g = np.isin(lab, [i + 1 for i in range(n) if sz[i] >= sz.max() * .03]) & mm
    ys, xs = np.where(g); sl = (slice(ys.min(), ys.max() + 1), slice(xs.min(), xs.max() + 1)); return dict(rgb=a[sl][..., :3], mask=g[sl])
rows = [[(r, 0), (r, 1)] for r in range(5)]
obj = lambda rc: cellobj(*rc)
bt = Image.open(G + 'mon_battle.png'); ic = Image.open(G + 'mon_icons.png'); assert bt.height // 64 == 48
nb = Image.new('RGBA', (128, bt.height + 64 * 5)); nb.paste(bt, (0, 0)); ni = Image.new('RGBA', (ic.width + 48 * 5, 48)); ni.paste(ic, (0, 0))
for j, row in enumerate(rows):
    cell, icon = pair(obj(row[0]), obj(row[1]), 40)
    nb.paste(cell, (0, bt.height + j * 64), cell); ni.paste(icon, (ic.width + j * 48, 0), icon); pv.paste(cell, (j * 164, 164), cell)
nb.save(G + 'mon_battle.png'); ni.save(G + 'mon_icons.png')
pv.resize((pv.width * 2, pv.height * 2), Image.NEAREST).save('/home/claude/work/crag/evo_preview.png')
# better walk sheets for Cindhop's and Bristlecone's evolutions (Bristlecone's has right before left: swap)
for sp, f, swap in [('cindhop_2', 'a7c17f1c-image.png', False), ('bristlecone_2', '79e938c3-image.png', True)]:
    a, m = load(U + f); cells = gridN(a, m, 4, 0, m.shape[1])
    if swap: cells[1], cells[2] = cells[2], cells[1]
    k = (F - 2) / max(max(o['mask'].shape) for row in cells for o in row)
    sheet = Image.new('RGBA', (F * 4, F * 4))
    for r in range(4):
        for c in range(4):
            im = fit(cells[r][c], k, 30); sheet.paste(im, (c * F + (F - im.width) // 2, r * F + F - im.height), im)
    sheet.save(G + f'mon_{sp}.png'); j = NAMES.index(sp); pv.paste(Image.new('RGBA', (160, 160), (200, 220, 180, 255)), (j * 164, 0)); pv.paste(sheet, (j * 164, 0), sheet)
pv.resize((pv.width * 2, pv.height * 2), Image.NEAREST).save('/home/claude/work/crag/evo_preview.png')
