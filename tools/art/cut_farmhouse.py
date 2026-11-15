"""The farmhouse interior (art_incoming/farmhouse, drawn at 140px per tile) -> the game at 6x (96px per tile).

  src/hd_world/room_<n>.webp   the empty room for each house size in HOUSE_ROOM (game.js), built from pieces of
                               farmhouse-empty.png so every size keeps the corner brackets, windows between posts,
                               the centre carving and the door mat in front of the door
  src/hd_world/furn.webp/.json the furniture (f_<id>) and their inventory icons (i_f_<id>, 72px = 24 game px at 3x)
Run from the repo root:  python3 tools/art/cut_farmhouse.py"""
import json
import numpy as np
from PIL import Image

A = 'art_incoming/farmhouse/'
OUT = 'src/hd_world/'
TP, K = 140, 96                     # art px per tile, output px per tile
ROOMS = [(10, 8), (13, 9), (16, 10), (18, 11)]
FURN = {'bed': 'patchwork-bed', 'bedside': 'bedside-cabinet', 'armchair': 'sage-armchair', 'rug': 'braided-rug', 'chest': 'acorn-chest', 'stool': 'flower-stool',
        'table': 'trestle-table', 'chair': 'ladderback-chair', 'stove': 'stone-cookstove', 'sink': 'farmhouse-sink', 'dresser': 'crockery-dresser', 'bench': 'oak-bench',
        'workbench': 'carpenter-workbench', 'bookcase': 'bookcase', 'desk': 'field-journal-desk', 'fern': 'potted-fern', 'basket': 'fablemon-basket', 'lamp': 'brass-lantern'}

src = Image.open(A + 'farmhouse-empty.png').convert('RGB'); a = np.asarray(src).astype(int)
WALL_H, BEAM_H, FLOOR_Y, BOT_Y = 332, 52, 331, 1078


def crop(x0, y0, x1, y1): return src.crop((x0, y0, x1, y1))


def tile_h(piece, w):
    """repeat a piece sideways to width w"""
    out = Image.new('RGB', (w, piece.height)); x = 0
    while x < w: out.paste(piece, (x, 0)); x += piece.width
    return out


def plank_rows():
    """the floor's plank rows, each cut from one joint to another so they wrap without a seam"""
    bounds = [366, 405, 445, 486, 526, 567, 607, 648, 688, 728, 768, 808, 847, 887, 927, 967, 1007, 1048]
    rows = []
    for y0, y1 in zip(bounds[:-1], bounds[1:]):
        band = a[y0 + 4:y1 - 4, :, :].sum(2).mean(0)
        dark = [x for x in range(40, 1362) if band[x] < band[max(0, x - 12):x + 12].mean() - 60 and band[x] == band[x - 2:x + 3].min()]
        if len(dark) < 2: dark = [40, 1360]
        x0, x1 = dark[0], dark[-1]
        rows.append(crop(x0, y0, x1, y1))
    return rows


def room(W, H):
    PW, PH = W * TP, H * TP
    im = Image.new('RGB', (PW, PH))
    # floor: plank rows, each starting somewhere different
    rows = plank_rows(); y = FLOOR_Y; i = 0; rng = np.random.default_rng(W * 31 + H)
    while y < PH:
        r = rows[i % len(rows)]; off = int(rng.integers(0, r.width)); line = Image.new('RGB', (PW + r.width, r.height)); x = -off
        while x < PW: line.paste(r, (x, 0)); x += r.width
        im.paste(line.crop((0, 0, PW, r.height)), (0, y)); y += r.height; i += 1
    # side borders
    for x0, x1, dx in [(0, 18, 0), (1384, 1402, PW - 18)]:
        seg = crop(x0, 420, x1, 1000); yy = FLOOR_Y
        while yy < PH: im.paste(seg, (dx, yy)); yy += seg.height
    # bottom border, with the door mat in front of the door
    by = PH - (1122 - BOT_Y)
    im.paste(tile_h(crop(100, BOT_Y, 560, 1122), PW), (0, by))
    im.paste(crop(0, BOT_Y, 60, 1122), (0, by)); im.paste(crop(1342, BOT_Y, 1402, 1122), (PW - 60, by))
    mat = crop(596, BOT_Y, 806, 1122); door = (W // 2 + .5) * TP
    im.paste(mat, (int(door - mat.width / 2), by))
    # wall: caps, windows between posts, plain plaster between, a plain top beam with the carving in the middle
    M = PW - 350; n = max(1, round(M / 560)); win, post, plain = crop(300, BEAM_H, 545, WALL_H), crop(668, BEAM_H, 736, WALL_H), crop(180, BEAM_H, 300, WALL_H)
    f = (M - n * win.width - (n - 1) * post.width) / (2 * n); x = 175.0
    for k in range(n):
        for _ in range(2):
            pass
        fw = int(round(x + f) - round(x)); im.paste(tile_h(plain, fw), (int(round(x)), BEAM_H)); x += f
        im.paste(win, (int(round(x)), BEAM_H)); x += win.width
        fw = int(round(x + f) - round(x)); im.paste(tile_h(plain, fw), (int(round(x)), BEAM_H)); x += f
        if k < n - 1: im.paste(post, (int(round(x)), BEAM_H)); x += post.width
    im.paste(tile_h(crop(180, 0, 500, BEAM_H), PW), (0, 0))
    im.paste(crop(0, 0, 175, WALL_H), (0, 0)); im.paste(crop(1227, 0, 1402, WALL_H), (PW - 175, 0))
    orn = crop(520, 0, 880, BEAM_H); im.paste(orn, (int(PW / 2 - orn.width / 2), 0))
    return im.resize((W * K, H * K), Image.LANCZOS)


def main():
    for n, (W, H) in enumerate(ROOMS):
        room(W, H).save(OUT + f'room_{n}.webp', 'WEBP', quality=88, method=6); print('room', n, W, H)
    ims = {}
    for k, f in FURN.items():
        im = Image.open(A + 'furniture/' + f + '.png').convert('RGBA')
        im = im.crop(im.getbbox())
        ims['f_' + k] = im.resize((max(1, round(im.width * K / TP)), max(1, round(im.height * K / TP))), Image.LANCZOS)
        ic = im.copy(); ic.thumbnail((68, 68), Image.LANCZOS); sq = Image.new('RGBA', (72, 72)); sq.paste(ic, ((72 - ic.width) // 2, (72 - ic.height) // 2), ic)
        ims['i_f_' + k] = sq
    W = 1024; x = y = rowh = 0; pos = {}
    for n, im in sorted(ims.items(), key=lambda kv: -kv[1].height):
        if x + im.width > W: x = 0; y += rowh + 2; rowh = 0
        pos[n] = (x, y); x += im.width + 2; rowh = max(rowh, im.height)
    atlas = Image.new('RGBA', (W, y + rowh)); frames = {}
    for n, im in ims.items(): atlas.paste(im, pos[n], im); frames[n] = {'frame': {'x': pos[n][0], 'y': pos[n][1], 'w': im.width, 'h': im.height}}
    atlas.save(OUT + 'furn.webp', 'WEBP', quality=90, method=6); json.dump({'frames': frames}, open(OUT + 'furn.json', 'w'))
    print({k: (v.width / K, v.height / K) for k, v in ims.items() if k.startswith('f_')})


if __name__ == '__main__':
    main()
