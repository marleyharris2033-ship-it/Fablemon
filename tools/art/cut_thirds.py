"""Cut the third-form Fablemon art in art_incoming/third_stages into game sprites.

  walk sheets  -> src/mon_<id>.png   (4x4 frames of 44px: rows down, left, right, up)
  battle pairs -> appended to src/mon_battle.png (64px front | 64px back per row)
  icons        -> appended to src/mon_icons.png  (48px each)

Rows in mon_battle.png / mon_icons.png follow MON_ORDER, so the ids here must be
pushed onto MON_ORDER in this same order (see the end of crag.js).
Run from the repo root:  python3 tools/art/cut_thirds.py [--preview out.png]
It is safe to re-run: it rebuilds the battle/icon sheets from the first BASE rows.
"""
import sys, numpy as np
from PIL import Image
from scipy import ndimage

A = 'art_incoming/third_stages/'
G = 'src/'
F = 44          # walk frame size for third forms (same as Marshviper / Rampartoad)
BASE = 53       # rows already in mon_battle.png before the third forms

# (id, walk sheet, battle sheet, row in battle sheet, rows in battle sheet, frames per walk row)
MONS = [
    ('hedgerholt',        'hedgerholt',       'battle_shared_hedgerholt-hearthrusk-merewheel', 0, 3, 4),
    ('hearthrusk',        'hearthrusk',       'battle_shared_hedgerholt-hearthrusk-merewheel', 1, 3, 4),
    ('merewheel',         'merewheel',        'battle_shared_hedgerholt-hearthrusk-merewheel', 2, 3, 4),
    ('plumevix',          'plumevix',         'plumevix_battle', 0, 1, 3),
    ('whorlcrest',        'whorlcrest',       'battle_shared_whorlcrest-flintcairn-moonspark', 0, 3, 4),
    ('cloverlegion',      'cloverlegion',     'cloverlegion_battle', 0, 1, 4),
    ('flintcairn',        'flintcairn',       'battle_shared_whorlcrest-flintcairn-moonspark', 1, 3, 4),
    ('moonspark',         'moonspark',        'battle_shared_whorlcrest-flintcairn-moonspark', 2, 3, 4),
    ('duskwyrm',          'duskwyrm',         'duskwyrm_battle', 0, 1, 4),
    ('torrentail',        'torrentail',       'torrentail_battle', 0, 1, 4),
    ('reefarer_3',        'deepfarer',        'battle_shared_deepfarer-reed-cotton', 0, 2, 4),
    ('reefarer_cotton_3', 'deepfarer_cotton', 'battle_shared_deepfarer-reed-cotton', 1, 2, 4),
    ('mirebellows_3',     'mirelure',         'mirelure_battle', 0, 1, 4),
    ('lotveil_3',         'lotmancer',        'lotmancer_battle', 0, 1, 4),
    ('yawnox_3',          'slumberdew',       'slumberdew_battle', 0, 1, 4),
    ('brimbramble_3',     'pitchfiend',       'pitchfiend_battle', 0, 1, 4),
    ('stormveil_3',       'stormcrown',       'stormcrown_battle', 0, 1, 4),
    ('hollowbark_3',      'grimbark',         'grimbark_battle', 0, 1, 4),
    ('cindhop_3',         'blazejack',        'blazejack_battle', 0, 1, 4),
    ('bristlecone_3',     'pinewarden',       'pinewarden_battle', 0, 1, 4),
    ('clinkit_3',         'belfrock',         'belfrock_battle', 0, 1, 4),
    ('craglet_3',         'shardgryph',       'shardgryph_battle', 0, 1, 4),
]


def load(path):
    """RGB array + foreground mask: transparent pixels or the magenta backdrop are background"""
    im = Image.open(path)
    a = np.array(im.convert('RGBA')).astype(np.int16)
    if im.mode == 'RGBA' and (a[..., 3] < 128).mean() > .2:
        m = a[..., 3] >= 128
    else:
        r, g, b = a[..., 0], a[..., 1], a[..., 2]
        mag = (r > 150) & (b > 150) & (g < 110) & (np.minimum(r, b) - g > 90)
        m = ~mag
        m = ndimage.binary_erosion(m, iterations=2)          # drop the pink fringe
    m = ndimage.binary_opening(m, iterations=1)
    return a[..., :3].astype(np.uint8), m


def cuts_at(proj, k, lo, hi):
    """k equal-ish bands; each cut slides to the emptiest line near where it would fall"""
    out = [lo]
    for i in range(1, k):
        c = lo + (hi - lo) * i // k; w = (hi - lo) // (2 * k); seg = proj[c - w:c + w]
        out.append(c - w + int(np.argmin(seg)))
    return out + [hi]


def piece(a, m, y0, y1, x0, x1, keep=.04):
    mm = np.zeros_like(m); mm[y0:y1, x0:x1] = m[y0:y1, x0:x1]
    lab, n = ndimage.label(ndimage.binary_dilation(mm, iterations=4))
    sz = ndimage.sum(mm, lab, range(1, n + 1))
    g = np.isin(lab, [i + 1 for i in range(n) if sz[i] >= sz.max() * keep]) & mm
    ys, xs = np.where(g); sl = (slice(ys.min(), ys.max() + 1), slice(xs.min(), xs.max() + 1))
    return dict(rgb=a[sl], mask=g[sl])


def grid(a, m, rows, cols):
    ys, xs = np.where(m); y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    RY = cuts_at(m[:, x0:x1].sum(1), rows, y0, y1)
    CX = cuts_at(m[y0:y1].sum(0), cols, x0, x1)
    return [[piece(a, m, RY[r], RY[r + 1], CX[c], CX[c + 1]) for c in range(cols)] for r in range(rows)]


def shrink(o, k):
    """scale a cut-out down by k into a crisp sprite with a hard edge and a dark rim"""
    h, w = o['mask'].shape; W, H = max(1, round(w * k)), max(1, round(h * k))
    al = o['mask'].astype(np.float32)
    rgb = o['rgb'].astype(np.float32) * al[..., None]
    pre = np.array(Image.fromarray(np.dstack([rgb, al * 255]).clip(0, 255).astype(np.uint8)).resize((W, H), Image.BOX)).astype(np.float32)
    cov = pre[..., 3] / 255
    col = pre[..., :3] / np.maximum(cov, 1e-3)[..., None]
    sharp = np.array(Image.fromarray(col.clip(0, 255).astype(np.uint8)).resize((W, H)))  # no-op, keeps dtype
    mask = cov >= .42
    # dark rim: edge pixels inside the silhouette darken towards the outline colour
    edge = mask & ~ndimage.binary_erosion(mask, border_value=0)
    out = sharp.astype(np.float32)
    out[edge] = out[edge] * .45 + np.array([28, 20, 22]) * .55
    rgba = np.dstack([out.clip(0, 255), mask * 255]).astype(np.uint8)
    return Image.fromarray(rgba, 'RGBA')


def walk_sheet(name, cols):
    a, m = load(A + name + '_walk.png')
    cells = grid(a, m, 4, cols)
    if cols == 3:                                   # stand, step, stand, other step
        cells = [[r[0], r[1], r[0], r[2]] for r in cells]
    k = (F - 2) / max(max(o['mask'].shape) for row in cells for o in row)
    sheet = Image.new('RGBA', (F * 4, F * 4))
    for r in range(4):
        for c in range(4):
            im = shrink(cells[r][c], k)
            sheet.paste(im, (c * F + (F - im.width) // 2, r * F + F - im.height), im)
    return sheet


_battle = {}
def battle_pair(sheet, row, nrows):
    if sheet not in _battle:
        a, m = load(A + sheet + '.png'); _battle[sheet] = grid(a, m, nrows, 2)
    front, back = _battle[sheet][row]
    k = 62 / max(max(front['mask'].shape), max(back['mask'].shape))
    cell = Image.new('RGBA', (128, 64))
    for j, o in enumerate((front, back)):
        im = shrink(o, k); cell.paste(im, (j * 64 + (64 - im.width) // 2, 63 - im.height), im)
    ki = 46 / max(front['mask'].shape)
    icon = Image.new('RGBA', (48, 48)); im = shrink(front, ki); icon.paste(im, ((48 - im.width) // 2, 47 - im.height), im)
    return cell, icon


def main():
    bt = Image.open(G + 'mon_battle.png').convert('RGBA'); ic = Image.open(G + 'mon_icons.png').convert('RGBA')
    assert bt.height // 64 >= BASE and ic.width // 48 >= BASE
    nb = Image.new('RGBA', (128, 64 * (BASE + len(MONS)))); nb.paste(bt.crop((0, 0, 128, 64 * BASE)), (0, 0))
    ni = Image.new('RGBA', (48 * (BASE + len(MONS)), 48)); ni.paste(ic.crop((0, 0, 48 * BASE, 48)), (0, 0))
    pv = Image.new('RGBA', (F * 4 + 8 + 128 + 8 + 48, len(MONS) * (F * 4 + 6)), (200, 220, 180, 255))
    for j, (sid, walk, bsheet, brow, bn, cols) in enumerate(MONS):
        sheet = walk_sheet(walk, cols); sheet.save(G + f'mon_{sid}.png')
        cell, icon = battle_pair(bsheet, brow, bn)
        nb.paste(cell, (0, 64 * (BASE + j))); ni.paste(icon, (48 * (BASE + j), 0))
        y = j * (F * 4 + 6); pv.paste(sheet, (0, y), sheet); pv.paste(cell, (F * 4 + 8, y), cell); pv.paste(icon, (F * 4 + 144, y), icon)
        print(sid, 'ok')
    nb.save(G + 'mon_battle.png', optimize=True); ni.save(G + 'mon_icons.png', optimize=True)
    if '--preview' in sys.argv: pv.save(sys.argv[sys.argv.index('--preview') + 1])


if __name__ == '__main__':
    main()
