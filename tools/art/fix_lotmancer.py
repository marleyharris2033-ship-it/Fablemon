"""Re-cut Lotmancer's battle art and icon. Its purple petals are close to the magenta backdrop, so the usual
keying punched holes in them. Here only magenta connected to the picture's edge (or pure #FF00FF) counts as background.
Run from the repo root:  python3 tools/art/fix_lotmancer.py"""
import sys, numpy as np
from PIL import Image
from scipy import ndimage
sys.path.insert(0, 'tools/art')
import cut_thirds as C

ROW = 42 + 13          # MON_ORDER index of lotveil_3: 42 base + its place in THIRDS
im = Image.open('art_incoming/third_stages/lotmancer_battle.png').convert('RGB')
a = np.array(im).astype(np.int16); r, g, b = a[..., 0], a[..., 1], a[..., 2]
loose = (r > 150) & (b > 150) & (g < 110) & (np.minimum(r, b) - g > 90)
lab, n = ndimage.label(loose)
edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
bg = np.isin(lab, list(edge)) | ((r > 235) & (b > 235) & (g < 40))
m = ndimage.binary_opening(ndimage.binary_erosion(~bg, iterations=2), iterations=1)
front, back = C.grid(a.astype(np.uint8), m, 1, 2)[0]
k = 62 / max(max(front['mask'].shape), max(back['mask'].shape))
cell = Image.new('RGBA', (128, 64))
for j, o in enumerate((front, back)):
    s = C.shrink(o, k); cell.paste(s, (j * 64 + (64 - s.width) // 2, 63 - s.height), s)
icon = Image.new('RGBA', (48, 48)); s = C.shrink(front, 46 / max(front['mask'].shape)); icon.paste(s, ((48 - s.width) // 2, 47 - s.height), s)
bt = Image.open('src/mon_battle.png').convert('RGBA'); bt.paste(Image.new('RGBA', (128, 64)), (0, 64 * ROW)); bt.paste(cell, (0, 64 * ROW)); bt.save('src/mon_battle.png', optimize=True)
ic = Image.open('src/mon_icons.png').convert('RGBA'); ic.paste(Image.new('RGBA', (48, 48)), (48 * ROW, 0)); ic.paste(icon, (48 * ROW, 0)); ic.save('src/mon_icons.png', optimize=True)
p = Image.new('RGBA', (176, 64), (60, 120, 80, 255)); p.paste(cell, (0, 0), cell); p.paste(icon, (128, 8), icon); p.resize((704, 256), 0).save('/tmp/t/lm_fix.png')
