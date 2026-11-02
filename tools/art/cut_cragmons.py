import sys, numpy as np
sys.argv = ['x', 'a']
exec(open('/home/claude/work/cut_evo.py').read().split('rows = {}')[0])
from PIL import Image
G = '/home/claude/game/'; U = '/mnt/user-data/uploads/'
NAMES = ['craglet', 'cindhop', 'bristlecone', 'clinkit', 'ramruff']
a, m = load(U + '50c71dd2-image.png')
lab, n = ndimage.label(ndimage.binary_dilation(m, iterations=8)); sz = ndimage.sum(m, lab, range(1, n + 1)); cm = ndimage.center_of_mass(m, lab, range(1, n + 1))
big = list(np.argsort(sz)[::-1][:10]); groups = {b: [b] for b in big}
for i in range(n):
    if i in groups or sz[i] < 20: continue
    b = min(big, key=lambda b: (cm[i][0] - cm[b][0]) ** 2 + (cm[i][1] - cm[b][1]) ** 2); groups[b].append(i)
big.sort(key=lambda b: cm[b][0]); rows = [sorted(big[r * 2:r * 2 + 2], key=lambda b: cm[b][1]) for r in range(5)]
def obj(b):
    g = np.isin(lab, [i + 1 for i in groups[b]]) & m; ys, xs = np.where(g); sl = (slice(ys.min(), ys.max() + 1), slice(xs.min(), xs.max() + 1)); return dict(rgb=a[sl][..., :3], mask=g[sl])
bt = Image.open(G + 'mon_battle.png'); ic = Image.open(G + 'mon_icons.png')
nb = Image.new('RGBA', (128, bt.height + 64 * 5)); nb.paste(bt, (0, 0)); ni = Image.new('RGBA', (ic.width + 48 * 5, 48)); ni.paste(ic, (0, 0))
pv = Image.new('RGBA', (5 * 180, 64), (200, 220, 180, 255))
for j, (name, row) in enumerate(zip(NAMES, rows)):
    cell, icon = pair(obj(row[0]), obj(row[1]), 36)
    nb.paste(cell, (0, bt.height + j * 64), cell); ni.paste(icon, (ic.width + j * 48, 0), icon)
    pv.paste(cell, (j * 180, 0), cell); pv.paste(icon, (j * 180 + 130, 8), icon)
nb.save(G + 'mon_battle.png'); ni.save(G + 'mon_icons.png')
pv.resize((pv.width * 2, 128), Image.NEAREST).save('/home/claude/work/crag/mons_preview.png')
print(bt.height // 64, nb.height // 64, ic.width // 48, ni.width // 48)
