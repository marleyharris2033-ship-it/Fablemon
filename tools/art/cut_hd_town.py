"""High-detail Smallroot, farmhouse, Hearthroot, route trainers, Bramble and the farmer's tool poses (Nov 2026 originals).

  src/hd_world/town.webp + .json      the Smallroot 'town' atlas at 3x. Frames with new art are cut from the
                                      originals; the rest are the old pixels enlarged 3x so the atlas stays whole.
  src/hd_world/houses.webp + .json    the three farmhouse sizes at 3x
  src/hd_world/<sheet>.webp           tools, tr_rambler, tr_ponddipper, tr_birdwatcher, tr_forager, tr_busker,
                                      tr_allotment, npc_bramble: 3x sheets matching the old frame grid
  src/hd/port_<kind>_<0|1>.webp       trainer portraits at 240px on the talk-box green

Every new picture is fitted to the old frame's size, so nothing in the game moves.
Run from the repo root:  python3 tools/art/cut_hd_town.py
"""
import json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage
sys.path.insert(0, 'tools/art')
import cut_thirds as C
import cut_hd as H

K = 3
A = 'art_incoming/smallroot/'
OUT = 'src/hd_world/'


def bbox(im):
    a = np.array(im.convert('RGBA'))[..., 3] > 100
    if not a.any(): return None
    ys, xs = np.where(a); return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def fit_building(o, w, h):
    """scale a cut-out to fill a (3w x 3h) frame: match the width, sit on the bottom edge"""
    W, Hh = w * K, h * K; mw, mh = o['mask'].shape[1], o['mask'].shape[0]
    s = W / mw
    if mh * s > Hh: s = Hh / mh
    im = H.soft(o, s); out = Image.new('RGBA', (W, Hh)); out.paste(im, ((W - im.width) // 2, Hh - im.height), im); return out


def cells(path, rows, cols, keep=.04):
    a, m = C.load(path)
    if keep == .04: return C.grid(a, m, rows, cols)
    ys, xs = np.where(m); y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    RY = C.cuts_at(m[:, x0:x1].sum(1), rows, y0, y1); CX = C.cuts_at(m[y0:y1].sum(0), cols, x0, x1)
    return [[C.piece(a, m, RY[r], RY[r + 1], CX[c], CX[c + 1], keep=keep) for c in range(cols)] for r in range(rows)]


def flat(g): return [o for row in g for o in row]


def atlas_hd(name, new):
    """the small atlas src/<name>.png/json at 3x: frames in `new` cut from originals, the rest old pixels enlarged"""
    tj = json.load(open(f'src/{name}.json'))['frames']; small = Image.open(f'src/{name}.png').convert('RGBA')
    ims = {}
    for fn, f in tj.items():
        r = f['frame']; w, h = r['w'], r['h']
        ims[fn] = fit_building(new[fn], w, h) if fn in new else small.crop((r['x'], r['y'], r['x'] + w, r['y'] + h)).resize((w * K, h * K), Image.NEAREST)
    missing = set(new) - set(tj); assert not missing, missing
    pack(ims, name); print(name, 'new art for', len(new), 'of', len(tj))


# shared prop cut-outs (props.png and farm_objects.png are also the bag icons, see items())
def props():
    return dict(zip(['lantern', 'barrel', 'crate', 'bench', 'planter', 'flowerbed', 'hedge', 'bush', 'wildflowers', 'rockery', 'lamp', 'wall', 'pillar', 'birdbath', 'sundial', 'bird_house'],
                    flat(cells(A + 'props.png', 4, 4))))


def farm_objects():
    return dict(zip(['pot', 'well', 'mine', 'compost', 'beehive', 'trough', 'big_chest', 'fishing_hut', 'training_ring', 'quality_sprinkler', 'golden_sprinkler',
                     'busy_beehive', 'quick_compost', 'deluxe_trough', 'farmstand', 'dirt_path'], flat(cells(A + 'farm_objects.png', 4, 4))))


def decor():
    return dict(zip(['stone_lantern', 'garden_fountain', 'topiary', 'hearth_lantern', 'hearth_sapling', 'oak_sapling', 'pine_sapling', 'apple_sapling'],
                    flat(cells(A + 'decor.png', 2, 4))))


def objects():
    P = props()
    atlas_hd('objects', {'lantern_post': P['lantern'], 'barrel': P['barrel'], 'crate': P['crate'], 'bush_round': P['bush'], 'wildflowers': P['wildflowers'], 'rock_pair': P['rockery']})


def seasonal():
    new = {}
    for sheet, names in [('season_winter', ['w_snowman', 'w_snowman_s', 'w_snowpile', 'w_snowbush', 'w_puddle', 'w_firewood', 'w_wreath', 'w_lantern']),
                         ('season_autumn', ['a_leafpile', 'a_litter', 'a_pumpkins', 'a_jack', 'a_scarecrow', 'a_haypump', 'a_mush', 'a_apples']),
                         ('season_summer', ['s_sunflower', 's_umbrella', 's_melon', 's_stand', 's_flowers', 's_hay', 's_dragonfly', 's_lanterns']),
                         ('season_spring', ['p_petals', 'p_bush', 'p_tulips', 'p_daffs', 'p_birdbox', 'p_planter', 'p_fly_open', 'p_fly_closed'])]:
        new.update(zip(names, flat(cells(A + sheet + '.png', 2, 4, keep=.002))))
    atlas_hd('seasonal', new)


def bog():
    """bog_props.png: a row of ground tiles (not used: the ground is composed at 1x), then props laid out freely"""
    a, m = C.load(A + 'bog_props.png'); m[:280] = False
    lab, n = ndimage.label(ndimage.binary_dilation(m, iterations=2)); lab = lab * m
    sz = ndimage.sum(m, lab, range(1, n + 1)); cm = ndimage.center_of_mass(m, lab, range(1, n + 1))
    at = {'cattail': (300, 410), 'tuft': (565, 475), 'bog_grass': (825, 460), 'post': (1025, 600), 'dead_tree': (1270, 540), 'log': (255, 630),
          'stump': (570, 630), 'lilies': (815, 630), 'signpost': (340, 815), 'lever_up': (600, 815), 'lever_down': (805, 860)}
    groups = {k: [] for k in at}
    for i in range(n):
        if sz[i] < 60: continue
        y, x = cm[i]; k = min(at, key=lambda k: (at[k][0] - x) ** 2 + (at[k][1] - y) ** 2)
        if (at[k][0] - x) ** 2 + (at[k][1] - y) ** 2 < 160 ** 2: groups[k].append(i + 1)
    new = {}
    for k, ids in groups.items():
        g = np.isin(lab, ids) & m; ys, xs = np.where(g); sl = (slice(ys.min(), ys.max() + 1), slice(xs.min(), xs.max() + 1))
        new[k] = dict(rgb=a[sl], mask=g[sl])
    atlas_hd('bog', new)


def items():
    """bag icons (72px, 3x the 24px ones) and placed-object pictures (3x their old size) -> hd_world/items"""
    old = json.load(open('src/itemart.json'))
    P, F, D = props(), farm_objects(), decor()
    obj_of = {'pot': 'pot', 'well': 'well', 'mine': 'mine', 'compost': 'compost', 'beehive': 'beehive', 'trough': 'trough', 'big_chest': 'chest2', 'fishing_hut': 'fishhut',
              'training_ring': 'ring', 'quality_sprinkler': 'sprinkler2', 'golden_sprinkler': 'sprinkler3', 'busy_beehive': 'beehive2', 'quick_compost': 'compost2',
              'deluxe_trough': 'trough2', 'birdbath': 'birdbath', 'sundial': 'sundial', 'bird_house': 'birdhouse', 'stone_lantern': 'stonelantern',
              'garden_fountain': 'gfountain', 'topiary': 'topiary', 'hearth_lantern': 'hearthlantern', 'hearth_sapling': 'hearthsap', 'oak_sapling': 'sap_oak',
              'pine_sapling': 'sap_pine', 'apple_sapling': 'sap_apple'}
    ims = {}
    for iid, o in {**P, **F, **D}.items():
        if iid in old['icons']:
            k = 22 * K / max(o['mask'].shape); im = H.soft(o, k); c = Image.new('RGBA', (24 * K, 24 * K))
            c.paste(im, ((24 * K - im.width) // 2, 23 * K - im.height), im); ims['i_' + iid] = c
        ob = obj_of.get(iid)
        if ob and ob in old['objs']:
            w, h = old['objs'][ob][:2]; ims['o_' + ob] = fit_building(o, w, h)
    pack(ims, 'items'); print('items', sum(k.startswith('i_') for k in ims), 'icons,', sum(k.startswith('o_') for k in ims), 'objects')


def town():
    tj = json.load(open('src/town.json'))['frames']; small = Image.open('src/town.png').convert('RGBA')
    new = {}
    g = cells(A + 'ranch_station.png', 2, 2)
    new.update(ranch_old=g[0][0], ranch=g[0][1], station_old=g[1][0], station=g[1][1])
    g = cells(A + 'clinic_hall_carpenter.png', 3, 2)
    new.update(clinic_old=g[0][0], clinic=g[0][1], hall_old=g[1][0], hall=g[1][1], carpenter_old=g[2][0], carpenter=g[2][1])
    g = cells(A + 'store_smith_tavern.png', 3, 2)
    new.update(store_old=g[0][0], store=g[0][1], smith_old=g[1][0], smith=g[1][1], tavern_old=g[2][0], tavern=g[2][1])
    a, m = C.load(A + 'hearthroot.png'); hh = a.shape[0] // 2
    top = C.grid(a[:hh], m[:hh], 1, 3)[0]; bot = C.grid(a[hh:], m[hh:], 1, 2)[0]
    for i, o in enumerate(top + bot): new[f'hearth{i}'] = o
    new['derby'] = cells(A + 'derby_arch.png', 1, 1, keep=.002)[0][0]
    P = props()
    new.update(bench=P['bench'], planter=P['planter'], flowerbed=P['flowerbed'], hedge=P['hedge'], lamp=P['lamp'], stall=farm_objects()['farmstand'])
    ims = {}
    for name, f in tj.items():
        r = f['frame']; w, h = r['w'], r['h']
        if name in new: ims[name] = fit_building(new[name], w, h)
        else: ims[name] = small.crop((r['x'], r['y'], r['x'] + w, r['y'] + h)).resize((w * K, h * K), Image.NEAREST)
    pack(ims, 'town')
    print('town: new art for', ', '.join(sorted(new)))


def houses():
    hj = json.load(open('src/houses.json'))
    g = cells(A + 'farmhouses.png', 1, 3)[0]
    ims = {f'house{i + 1}': fit_building(g[i], hj[f'house{i + 1}']['w'], hj[f'house{i + 1}']['h']) for i in range(3)}
    pack(ims, 'houses')


def pack(ims, name, W=2048):
    x = y = rowh = 0; pos = {}
    for n, im in sorted(ims.items(), key=lambda kv: -kv[1].height):
        if x + im.width > W: x = 0; y += rowh + 2; rowh = 0
        pos[n] = (x, y); x += im.width + 2; rowh = max(rowh, im.height)
    out = Image.new('RGBA', (W, y + rowh)); frames = {}
    for n, im in ims.items():
        px, py = pos[n]; out.paste(im, (px, py), im)
        frames[n] = {'frame': {'x': px, 'y': py, 'w': im.width, 'h': im.height}}
    assert out.height <= 4096, name
    out.save(OUT + name + '.webp', 'WEBP', quality=82, method=6)
    json.dump({'frames': frames}, open(OUT + name + '.json', 'w'))
    print(name, out.size)


def sheet_like(old_path, FW, FH, grid, name, order=None):
    """grid: rows of cut-outs in the old sheet's frame order (rows x 4). Scale to match the old sprites' height,
    and place each so its feet and centre line up with the old frame's."""
    old = Image.open(old_path).convert('RGBA'); cols = old.width // FW; rows = old.height // FH
    hs = [b[3] - b[1] for r in range(rows) for c in range(cols) if (b := bbox(old.crop((c * FW, r * FH, c * FW + FW, r * FH + FH))))]
    s = max(hs) * K / max(o['mask'].shape[0] for row in grid for o in row)
    out = Image.new('RGBA', (cols * FW * K, rows * FH * K))
    for r, row in enumerate(grid):
        for c, o in enumerate(row):
            b = bbox(old.crop((c * FW, r * FH, c * FW + FW, r * FH + FH))) or (0, 0, FW, FH - 1)
            im = H.soft(o, s); cx = (b[0] + b[2]) / 2 * K; bottom = b[3] * K
            x = int(round(c * FW * K + cx - im.width / 2)); y = int(round(r * FH * K + bottom - im.height))
            cell = Image.new('RGBA', (FW * K, FH * K)); cell.paste(im, (x - c * FW * K, y - r * FH * K), im)
            out.paste(cell, (c * FW * K, r * FH * K), cell)
    out.save(OUT + name + '.webp', 'WEBP', quality=82, method=6); print(name, out.size)


def walk3(path, strips, idx):
    """a 3-frames-per-row walk sheet (step, stand, step) -> rows of [stand, step, stand, step]"""
    a, m = C.load(path); w = a.shape[1]; x0, x1 = w * idx // strips, w * (idx + 1) // strips
    g = C.grid(a[:, x0:x1], m[:, x0:x1], 4, 3)
    return [[r[1], r[0], r[1], r[2]] for r in g]


def trainers():
    for path, kinds in [('walk_rambler_ponddipper.png', ['rambler', 'ponddipper']), ('walk_birdwatcher_forager.png', ['birdwatcher', 'forager']),
                        ('walk_busker_allotment.png', ['busker', 'allotment'])]:
        for i, k in enumerate(kinds): sheet_like(f'src/tr_{k}.png', 28, 32, walk3(A + path, 2, i), 'tr_' + k)
    sheet_like('src/npc_bramble.png', 28, 32, walk3(A + 'bramble_walk.png', 1, 0), 'npc_bramble')
    for k in ['reedcutter', 'wispwatcher', 'delphine']: sheet_like(f'src/tr_{k}.png', 28, 32, cells(A + f'walk_{k}.png', 4, 4), 'tr_' + k)


def tools():
    g = cells(A + 'farmer_tools.png', 3, 4)
    # new sheet columns: front, back, left, right; the game's: front, left, right, back
    sheet_like('src/farmer_tools.png', 40, 48, [[r[0], r[2], r[3], r[1]] for r in g], 'tools')


def portraits():
    g = cells(A + 'trainer_portraits.png', 6, 2)
    kinds = ['rambler', 'ponddipper', 'birdwatcher', 'forager', 'busker', 'allotment']
    k = 63 / max(max(o['mask'].shape) for row in g for o in row)
    S = 80 * K; kk = k * S / 64
    for kind, row in zip(kinds, g):
        for j, o in enumerate(row):
            im = H.soft(o, kk); bg = Image.new('RGBA', (S, S), (0xcf, 0xe3, 0xb2, 255))
            bg.paste(im, ((S - im.width) // 2, S - im.height), im)
            bg.convert('RGB').save(f'src/hd/port_{kind}_{j}.webp', 'WEBP', quality=85, method=6)
    for kind in ['reedcutter', 'wispwatcher', 'delphine']:
        for j, o in enumerate(cells(A + f'port_{kind}.png', 1, 2)[0]):
            k = 63 / max(o['mask'].shape); im = H.soft(o, k * S / 64); bg = Image.new('RGBA', (S, S), (0xcf, 0xe3, 0xb2, 255))
            bg.paste(im, ((S - im.width) // 2, S - im.height), im); bg.convert('RGB').save(f'src/hd/port_{kind}_{j}.webp', 'WEBP', quality=85, method=6)
        kinds.append(kind)
    print('portraits', kinds)


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    only = sys.argv[1:]
    for f in [town, houses, trainers, tools, portraits, objects, seasonal, bog, items]:
        if not only or f.__name__ in only: f()
