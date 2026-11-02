import sys, numpy as np
src = open('/home/claude/work/cut_bogtr.py').read().split("G = '/home/claude/game/'")[0]
exec(src)
from PIL import Image
G = '/home/claude/game/'; F = 28
a, m = load(U + 'a0e54ad7-image.png'); W = m.shape[1]
cuts = [0, 735, 1450, W]   # three sheets side by side
pv = Image.new('RGBA', (3 * 118, 112), (200, 220, 180, 255))
for j, sp in enumerate(['bristlecone', 'clinkit', 'ramruff']):
    mm = m.copy(); mm[:, :cuts[j]] = False; mm[:, cuts[j + 1]:] = False
    cells = grid16(a, mm)
    k = (F - 1) / max(max(o['mask'].shape) for row in cells for o in row)
    sheet = Image.new('RGBA', (F * 4, F * 4))
    for r in range(4):
        for c in range(4):
            im = fit(cells[r][c], k, 26); sheet.paste(im, (c * F + (F - im.width) // 2, r * F + F - im.height), im)
    sheet.save(G + f'mon_{sp}.png'); pv.paste(sheet, (j * 118, 0), sheet)
pv.resize((pv.width * 3, pv.height * 3), Image.NEAREST).save('/home/claude/work/crag/walk2_preview.png')
