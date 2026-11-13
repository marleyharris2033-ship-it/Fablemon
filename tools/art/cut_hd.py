"""Cut high-detail Fablemon sprites straight from the original art.

The first cutters shrank each ~900px drawing to a 64px battle sprite and a 28-48px walking sprite, which threw
most of the drawing away. This keeps far more of it:

  src/hd/<id>_f.webp   battle front, 256px (4x the old 64px cell, same framing)
  src/hd/<id>_b.webp   battle back, 256px
  src/hd/<id>_i.webp   icon, 96px (2x the old 48px)
  src/hd/<id>_w.webp   walk sheet, 4x4 frames at 3x the game's frame size (rows down, left, right, up)

build.py bundles whatever is in src/hd; the game uses these when present and the old small sprites otherwise.
So to upgrade a Fablemon: drop its original sheets in art_incoming/, add a line to EARLY below, re-run this.
Run from the repo root:  python3 tools/art/cut_hd.py [--preview out_prefix] [--only id,id]
"""
import os, sys, numpy as np
from PIL import Image
from scipy import ndimage
sys.path.insert(0, 'tools/art')
import cut_thirds as C
import cut_seamons, cut_hmmons, cut_tidemons

G = 'src/'; OUT = 'src/hd/'
BS, IS, WS = 4, 2, 3          # battle, icon and walk scale over the old sprites

T = 'art_incoming/third_stages/'; S = 'art_incoming/seamons/'; H = 'art_incoming/highmoor_mons/'; N = 'art_incoming/nipshade/'; E = 'art_incoming/early/'
# id -> dict(b=(battle sheet, row, rows), w=(walk sheet, strips, strip index, frames per row, which frame stands still))
MONS = {}
for sid, walk, bs, br, bn, cols in C.MONS:
    MONS[sid] = dict(b=(T + bs + '.png', br, bn), w=(T + walk + '_walk.png', 1, 0, cols, 0))
MONS['lotveil_3']['edge'] = True          # purple petals: only magenta joined to the picture's edge is background
for sid, walk, F, bs, br, bn in cut_tidemons.MONS:
    MONS[sid] = dict(b=(N + bs + '.png', br, bn), w=(N + walk + '.png', 1, 0, 4, 0))
for sid, bs, br, bn, F in cut_seamons.MONS:
    MONS[sid] = dict(b=(S + bs + '.png', br, bn), w=(S + f'walk_{sid}.png', 1, 0, 4, 0))
for sid, bs, br, bn, walk, F in cut_hmmons.MONS:
    MONS[sid] = dict(b=(H + bs + '.png', br, bn), w=(H + f'walk_{walk}.png', 1, 0, 4, 0))
MONS['cirrovale'] = dict(b=('art_incoming/cirrovale/cirrovale.png', 0, 1), w=('art_incoming/cirrovale/walk_cirrovale.png', 1, 0, 4, 0))

# the earlier Fablemon, from originals re-sent in Nov 2026. Three-frame walk rows are step, stand, step.
def early(ids, battle=None, walk=None, cols=3, stand=1):
    for i, sid in enumerate(ids):
        d = MONS.setdefault(sid, {})
        if battle: d['b'] = (E + battle + '.png', i, len(ids))
        if walk: d['w'] = (E + walk + '.png', len(ids), i, cols, stand)
early(['hedglet', 'cindimple', 'rillip'], battle='battle_hedglet-cindimple-rillip')
for s in ['hedglet', 'cindimple', 'rillip', 'brooknook', 'briamble', 'kilnook', 'weirlet', 'fleecebolt', 'whirlwyn', 'cloverguard', 'flintburrow']: early([s], walk='walk_' + s)
early(['tusskip', 'whirplet', 'cloverclasp', 'flintuck', 'fuzzwick', 'duskwick'], battle='battle_tusskip-whirplet-cloverclasp-flintuck-fuzzwick-duskwick')
early(['tusskip', 'whirplet'], walk='walk_tusskip-whirplet'); early(['cloverclasp', 'flintuck'], walk='walk_cloverclasp-flintuck'); early(['fuzzwick', 'duskwick'], walk='walk_fuzzwick-duskwick')
early(['mortoad', 'brashlet'], battle='battle_mortoad-brashlet', walk='walk_mortoad-brashlet')
early(['brooknook'], battle='battle_brooknook')
early(['briamble', 'kilnook', 'weirlet'], battle='battle_briamble-kilnook-weirlet')
early(['fenfang'], battle='battle_fenfang'); early(['puffpiper'], battle='battle_puffpiper'); early(['marshviper'], battle='battle_marshviper')
early(['reefarer', 'reefarer_cotton'], battle='battle_reefarer-reefarer_cotton')
early(['mirebellows', 'lotveil', 'yawnox', 'brimbramble', 'stormveil', 'hollowbark'], battle='battle_mirebellows-lotveil-yawnox-brimbramble-stormveil-hollowbark')
early(['fulgarok'], battle='battle_fulgarok', walk='walk_fulgarok', cols=4, stand=0)
early(['craglet', 'cindhop', 'bristlecone', 'clinkit', 'ramruff'], battle='battle_craglet-cindhop-bristlecone-clinkit-ramruff')
early(['craglet'], walk='walk_craglet', cols=4, stand=0); early(['cindhop'], walk='walk_cindhop', cols=4, stand=0)
early(['bristlecone', 'clinkit', 'ramruff'], walk='walk_bristlecone-clinkit-ramruff', cols=4, stand=0)
early(['craglet_2', 'cindhop_2', 'bristlecone_2', 'clinkit_2', 'ramruff_2'], battle='battle_crag2')
early(['bristlecone_2'], walk='walk_bristlecone_2', cols=4, stand=0); early(['cindhop_2'], walk='walk_cindhop_2', cols=4, stand=0)


def load_edge(path):
    im = Image.open(path).convert('RGB'); a = np.array(im).astype(np.int16); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    loose = (r > 150) & (b > 150) & (g < 110) & (np.minimum(r, b) - g > 90)
    lab, n = ndimage.label(loose)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(edge)) | ((r > 235) & (b > 235) & (g < 40))
    return a.astype(np.uint8), ndimage.binary_opening(ndimage.binary_erosion(~bg, iterations=2), iterations=1)


_sheets = {}
def sheet(path, edge=False):
    if path not in _sheets: _sheets[path] = load_edge(path) if edge else C.load(path)
    return _sheets[path]


def soft(o, k):
    """scale a cut-out by k, keeping a smooth edge (the game draws these sprites smoothly, not as hard pixels)"""
    h, w = o['mask'].shape; W, Hh = max(1, round(w * k)), max(1, round(h * k))
    al = o['mask'].astype(np.float32); pre = np.dstack([o['rgb'].astype(np.float32) * al[..., None], al * 255])
    ch = [np.array(Image.fromarray(pre[..., i]).resize((W, Hh), Image.LANCZOS)) for i in range(4)]
    a = np.clip(ch[3], 0, 255); cov = np.maximum(a / 255, 1e-3)
    rgb = np.dstack([np.clip(ch[i] / cov, 0, 255) for i in range(3)])
    a[a < 10] = 0
    return Image.fromarray(np.dstack([rgb, a]).astype(np.uint8), 'RGBA')


def place(cell, im, bottom):
    out = Image.new('RGBA', (cell, cell)); out.paste(im, ((cell - im.width) // 2, bottom - im.height), im); return out


def battle(d):
    path, row, rows = d['b']; a, m = sheet(path, d.get('edge'))
    front, back = C.grid(a, m, rows, 2)[row]
    k = 62 * BS / max(max(front['mask'].shape), max(back['mask'].shape))
    ki = 46 * IS / max(front['mask'].shape)
    return place(64 * BS, soft(front, k), 63 * BS), place(64 * BS, soft(back, k), 63 * BS), place(48 * IS, soft(front, ki), 47 * IS)


def walk(d, F):
    path, strips, idx, cols, stand = d['w']; a, m = sheet(path)
    w = a.shape[1]; x0, x1 = w * idx // strips, w * (idx + 1) // strips
    cells = C.grid(a[:, x0:x1], m[:, x0:x1], 4, cols)
    if cols == 3: cells = [[r[1], r[0], r[1], r[2]] if stand == 1 else [r[0], r[1], r[0], r[2]] for r in cells]
    W = F * WS; k = (F - 2) * WS / max(max(o['mask'].shape) for row in cells for o in row)
    out = Image.new('RGBA', (W * 4, W * 4))
    for r in range(4):
        for c in range(4):
            im = soft(cells[r][c], k); out.paste(im, (c * W + (W - im.width) // 2, r * W + W - im.height), im)
    return out


def save(im, name): im.save(OUT + name + '.webp', 'WEBP', quality=72 if name.endswith('_w') else 80, method=6)   # walk sheets are big, so they compress harder


def main():
    os.makedirs(OUT, exist_ok=True)
    only = set(sys.argv[sys.argv.index('--only') + 1].split(',')) if '--only' in sys.argv else None
    pv = []
    for sid, d in MONS.items():
        if only and sid not in only: continue
        got = []
        if 'b' in d and os.path.exists(d['b'][0]):
            f, b, i = battle(d); save(f, sid + '_f'); save(b, sid + '_b'); save(i, sid + '_i'); got.append('battle'); pv.append((sid, f))
        wp = G + f'mon_{sid}.png'
        if 'w' in d and os.path.exists(d['w'][0]) and os.path.exists(wp):
            F = Image.open(wp).width // 4; save(walk(d, F), sid + '_w'); got.append(f'walk {F}px x{WS}')
        print(sid, ', '.join(got) or 'no art found')
    if '--preview' in sys.argv and pv:
        import json, re
        order = re.findall(r"'(\w+)'", re.search(r"const MON_ORDER = \[(.*?)\]", open(G + 'game.js').read(), re.S).group(1))
        bt = Image.open(G + 'mon_battle.png').convert('RGBA'); pre = sys.argv[sys.argv.index('--preview') + 1]
        per = 24
        for p in range(0, len(pv), per):
            chunk = pv[p:p + per]; im = Image.new('RGBA', (4 * 520, ((len(chunk) + 3) // 4) * 264), (126, 170, 96, 255))
            for j, (sid, f) in enumerate(chunk):
                x, y = (j % 4) * 520, (j // 4) * 264
                if sid in order:
                    r = order.index(sid); old = bt.crop((0, 64 * r, 64, 64 * r + 64)).resize((256, 256), 0); im.paste(old, (x, y), old)
                im.paste(f, (x + 260, y), f)
            im.save(f'{pre}_{p // per + 1}.png')


if __name__ == '__main__':
    main()
