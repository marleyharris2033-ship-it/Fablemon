"""The other farmers you can play as (character creator, src/look.js), from the user's sheets in art_incoming/farmers.

  src/hd_world/farmer_<p>_walk.webp   4x4 frames of 24x32 at 6x, like farmer_walk.webp
  src/hd_world/farmer_<p>_tools.webp  64 frames of 40x48 at 6x, like farmer_tools.webp
  src/hd/port_<p>_<0|1>.webp          portraits (calm, grin) from the turnaround sheets

The walk sheets share one scale (from straw_walk_ref.png, the original farmer drawn on the same sheet), so the farmers
keep their real heights next to each other. These farmers have no tool sheets yet, so their tool frames are made
here: the standing farmer with a drawn tool swung through four phases (ready, raise, strike, follow-through), and the
watering can as for the original. When tool sheets arrive, cut them like cut_farmer.py does.
Run from the repo root:  python3 tools/art/cut_presets.py
"""
import sys
import numpy as np
from PIL import Image, ImageDraw
sys.path.insert(0, 'tools/art')
import cut_thirds as C
import cut_hd as H
import cut_farmer as F

K = 6
A = 'art_incoming/farmers/'
OUT = 'src/hd_world/'
PRESETS = ['olive', 'teal', 'rust', 'jacket', 'cap']
OUTL, WOOD, WOOD_D, WOOD_L = (40, 32, 40, 255), (150, 102, 58, 255), (104, 68, 38, 255), (192, 142, 88, 255)
MET, MET_D, MET_L = (150, 160, 172, 255), (100, 108, 122, 255), (214, 222, 232, 255)


def sheet(path): a, m = C.load(path); return C.grid(a, m, 4, 4)


def tool_img(kind):
    """a tool drawn pointing straight up, the hand end at the bottom centre. 8x supersampled, game px * K."""
    S = 8; u = K * S; L, Wd = 12, 12        # handle length, canvas width (game px)
    im = Image.new('RGBA', (Wd * u, (L + 2) * u)); d = ImageDraw.Draw(im); cx = Wd * u / 2
    d.rounded_rectangle([cx - 1.1 * u, 3 * u, cx + 1.1 * u, (L + 1.6) * u], radius=1 * u, fill=OUTL)
    d.rounded_rectangle([cx - .6 * u, 3.4 * u, cx + .6 * u, (L + 1.2) * u], radius=.5 * u, fill=WOOD)
    d.line([(cx - .1 * u, 4 * u), (cx - .1 * u, L * u)], fill=WOOD_L, width=int(.25 * u))
    if kind == 'hoe':      # a flat blade bent forward off the top
        d.polygon([(cx - .6 * u, 1.6 * u), (cx + 4.6 * u, 1.6 * u), (cx + 5.2 * u, 5.4 * u), (cx + 1.2 * u, 4.6 * u), (cx - .6 * u, 3.6 * u)], fill=OUTL)
        d.polygon([(cx - .1 * u, 2.2 * u), (cx + 4.1 * u, 2.2 * u), (cx + 4.5 * u, 4.6 * u), (cx + 1.2 * u, 4 * u), (cx - .1 * u, 3.2 * u)], fill=MET)
        d.line([(cx + .4 * u, 2.6 * u), (cx + 3.8 * u, 2.6 * u)], fill=MET_L, width=int(.35 * u))
    elif kind == 'axe':    # a wedge head to one side
        d.polygon([(cx - 1 * u, .8 * u), (cx + 1.2 * u, .8 * u), (cx + 4.8 * u, -.2 * u + u), (cx + 5.4 * u, 6.6 * u), (cx + 1.2 * u, 5.2 * u), (cx - 1 * u, 5.2 * u)], fill=OUTL)
        d.polygon([(cx - .5 * u, 1.3 * u), (cx + 1.2 * u, 1.3 * u), (cx + 4.4 * u, 1.4 * u), (cx + 4.9 * u, 5.8 * u), (cx + 1.2 * u, 4.7 * u), (cx - .5 * u, 4.7 * u)], fill=MET)
        d.line([(cx + 4.5 * u, 1.8 * u), (cx + 4.8 * u, 5.4 * u)], fill=MET_L, width=int(.45 * u))
    else:                  # pickaxe: a curved double point across the top
        d.chord([cx - 6 * u, .4 * u, cx + 6 * u, 7 * u], 190, 350, fill=OUTL)
        d.chord([cx - 5.4 * u, 1 * u, cx + 5.4 * u, 6.4 * u], 192, 348, fill=MET)
        d.line([(cx - 4 * u, 2.4 * u), (cx + 4 * u, 2.4 * u)], fill=MET_L, width=int(.35 * u))
        d.rounded_rectangle([cx - 1.2 * u, 1.2 * u, cx + 1.2 * u, 3.8 * u], radius=.4 * u, fill=MET_D, outline=OUTL, width=int(.3 * u))
    im = im.resize((im.width // S, im.height // S), Image.LANCZOS)
    return im, (im.width / 2, im.height - .6 * K)     # image, pivot (the hand)


def swung(tool, piv, ang, flip):
    """rotate a tool about its hand end; returns the image and the hand's position in it"""
    if flip: tool = tool.transpose(Image.FLIP_LEFT_RIGHT); piv = (tool.width - piv[0], piv[1]); ang = -ang
    R = int(max(tool.size) * 1.5); big = Image.new('RGBA', (R * 2, R * 2)); big.paste(tool, (int(R - piv[0]), int(R - piv[1])), tool)
    return big.rotate(-ang, resample=Image.BICUBIC), (R, R)


# per direction (down, left, right, up): the hand's position (game px in the 40x48 cell) and the tool's angle each phase
HAND = {0: (24, 32), 1: (16, 32), 2: (24, 32), 3: (16, 32)}
PHASES = [  # (angle, hand dx, hand dy, crouch) for a farmer facing right; left mirrors it; down and up swing over the head
    (60, -1, 2, 0), (-30, -3, -6, 0), (140, 3, 1, 1), (158, 3, 3, 1)]
PHASES_V = [(150, -1, 2, 0), (-6, 0, -8, 0), (180, 0, 1, 1), (184, 0, 3, 1)]


def main():
    ref = sheet(A + 'straw_walk_ref.png')
    s = F.HEIGHT * K / np.mean([ref[r][1]['mask'].shape[0] for r in range(4)])
    tools = {t: tool_img(t) for t in ('hoe', 'axe', 'pickaxe')}
    can, spl = F.draw_can(K), F.drops(K)
    for p in PRESETS:
        walk = sheet(A + p + '_walk.png')
        FW, FH = 24 * K, 32 * K
        out = Image.new('RGBA', (FW * 4, FH * 4))
        for r in range(4):
            for c, src in enumerate([1, 0, 3, 2]):
                out.paste(F.place(walk[r][src], s, FW, FH, FW / 2, FH - K // 2), (c * FW, r * FH))
        out.save(OUT + f'farmer_{p}_walk.webp', 'WEBP', quality=90, method=6)
        TW, TH = 40 * K, 48 * K; frames = []
        for t in ['hoe', 'can', 'axe', 'pickaxe']:
            for d in range(4):
                for ph in range(4):
                    if t == 'can':
                        cell = F.place(walk[d][1], s, TW, TH, TW / 2, 46 * K); pour = ph in (1, 2)
                        c2 = can if d != 1 else can.transpose(Image.FLIP_LEFT_RIGHT)
                        if pour: c2 = c2.rotate(-28 if d != 1 else 28, resample=Image.BICUBIC, expand=True)
                        hx = {0: TW / 2 + K, 1: TW / 2 - 6 * K, 2: TW / 2 + 6 * K, 3: TW / 2 + K}[d]; hy = 46 * K - 12 * K + pour * K
                        layer = Image.new('RGBA', cell.size); layer.paste(c2, (int(hx - c2.width / 2), int(hy - c2.height / 2)), c2)
                        if ph == 2: sx = int(hx + (c2.width / 2 if d != 1 else -c2.width / 2 - spl.width)); layer.paste(spl, (sx, int(hy)), spl)
                        if d == 3: layer.alpha_composite(cell); cell = layer
                        else: cell.alpha_composite(layer)
                    else:
                        ang, dx, dy, crouch = (PHASES_V if d in (0, 3) else PHASES)[ph]
                        cell = F.place(walk[d][1], s, TW, TH, TW / 2, 46 * K + crouch * K)
                        img, hp = swung(*tools[t], ang, d == 1)
                        hx, hy = HAND[d]; hx += -dx if d == 1 else dx; hy += dy
                        layer = Image.new('RGBA', cell.size); layer.paste(img, (int(hx * K - hp[0]), int(hy * K - hp[1])), img)
                        if d == 3 and ph != 1: layer.alpha_composite(cell); cell = layer      # from behind, the tool is mostly hidden by the body
                        else: cell.alpha_composite(layer)
                    frames.append(cell)
        COLS = 8; sheet_out = Image.new('RGBA', (TW * COLS, TH * (len(frames) // COLS)))
        for i, f in enumerate(frames): sheet_out.paste(f, ((i % COLS) * TW, (i // COLS) * TH))
        sheet_out.save(OUT + f'farmer_{p}_tools.webp', 'WEBP', quality=88, method=6)
        # portraits: the two faces on the right of the turnaround
        a, m = C.load(A + p + '_turnaround.png'); x0 = int(a.shape[1] * {'jacket': .69, 'cap': .66}.get(p, .62))   # Green Jacket's back view reaches further right
        faces = C.grid(a[:, x0:], m[:, x0:], 2, 1); S2 = 240
        for j, row in enumerate(faces):
            o = row[0]; k = S2 / max(o['mask'].shape); im = H.soft(o, k * .98); bg = Image.new('RGBA', (S2, S2), (0xcf, 0xe3, 0xb2, 255))
            bg.paste(im, ((S2 - im.width) // 2, S2 - im.height), im); bg.convert('RGB').save(f'src/hd/port_{p}_{j}.webp', 'WEBP', quality=88, method=6)
        print(p, 'done')


if __name__ == '__main__':
    main()
