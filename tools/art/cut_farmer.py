"""The farmer (the player) at 6x detail from the user's sheets in art_incoming/farmer.

  src/hd_world/farmer_walk.webp    4x4 frames of 24x32 (x6): rows down, left, right, up; columns stand, step, stand, step
  src/hd_world/farmer_tools.webp   64 frames of 40x48 (x6), 8 per row. Frame ((tool * 4 + dir) * 4 + phase),
                                   tools hoe, can, axe, pickaxe; phases ready, raise, strike, follow-through.
  src/hd/port_player_<0|1>.webp    portraits (calm, grin), 240px, for later use

The game uses these when present (hd.js hdFarmerLoad / hdFarmerSwap, game.js swing). 6x because a phone shows the
farmer about 6 screen pixels per game pixel, so this is sharp rather than enlarged.
The watering can has no new sheet yet: its frames are the standing farmer holding a can drawn here (draw_can).
Run from the repo root:  python3 tools/art/cut_farmer.py
"""
import json, sys
import numpy as np
from PIL import Image
sys.path.insert(0, 'tools/art')
import cut_thirds as C
import cut_hd as H

K = 6
A = 'art_incoming/farmer/'
OUT = 'src/hd_world/'
HEIGHT = 31          # the old farmer stood 31 pixels tall


def sheet(name): a, m = C.load(A + name + '.png'); return C.grid(a, m, 4, 4)


def boots_x(o):
    """horizontal anchor: the middle of the boots (bottom 12% of the figure)"""
    m = o['mask']; h = m.shape[0]; ys, xs = np.where(m[int(h * .88):]); return xs.mean() if len(xs) else m.shape[1] / 2


def place(o, s, W, Hh, cx, bottom):
    im = H.soft(o, s); cell = Image.new('RGBA', (W, Hh))
    x = int(round(cx - boots_x(o) * s)); y = int(round(bottom - o['mask'].shape[0] * s))
    cell.paste(im, (x, y), im); return cell


def draw_can(k):
    """a smooth watering can in the sheets' style (dark outline, soft shading), facing right, spout up-right"""
    from PIL import ImageDraw, ImageFilter
    S = 8 * k                                       # drawn 8x bigger then shrunk, for clean edges
    W, Hh = 16 * S // 8 * 2, 12 * S // 8 * 2
    im = Image.new('RGBA', (W * 2, Hh * 2)); d = ImageDraw.Draw(im)
    u = W * 2 / 32                                   # 32 x 24 design grid
    def R(x0, y0, x1, y1): return [x0 * u, y0 * u, x1 * u, y1 * u]
    OUT, DARK, MID, LIGHT, SHINE = (40, 32, 40, 255), (70, 98, 130, 255), (112, 146, 182, 255), (160, 190, 220, 255), (226, 240, 250, 255)
    # spout, handle (behind), body, rose
    d.line([(20 * u, 15 * u), (29 * u, 6 * u)], fill=OUT, width=int(3.4 * u)); d.line([(20 * u, 15 * u), (29 * u, 6 * u)], fill=MID, width=int(1.8 * u))
    d.arc(R(5, 2, 19, 16), 200, 340, fill=OUT, width=int(3 * u)); d.arc(R(5, 2, 19, 16), 200, 340, fill=DARK, width=int(1.4 * u))
    d.rounded_rectangle(R(4, 8, 21, 22), radius=3 * u, fill=OUT)
    d.rounded_rectangle(R(5.2, 9.2, 19.8, 20.8), radius=2.4 * u, fill=MID)
    d.rounded_rectangle(R(5.2, 16, 19.8, 20.8), radius=2.4 * u, fill=DARK)
    d.rounded_rectangle(R(7, 10.5, 9.5, 17), radius=1.2 * u, fill=LIGHT); d.ellipse(R(7.4, 11, 8.8, 12.6), fill=SHINE)
    d.line([(5.5 * u, 13 * u), (19.5 * u, 13 * u)], fill=DARK, width=int(.9 * u))
    d.ellipse(R(27, 3.5, 31.5, 8.5), fill=OUT); d.ellipse(R(27.8, 4.3, 30.7, 7.7), fill=LIGHT)
    im = im.crop(im.getbbox())
    return im.resize((im.width // 8, im.height // 8), Image.LANCZOS)


def drops(k):
    from PIL import ImageDraw
    im = Image.new('RGBA', (8 * k * 2, 10 * k * 2)); d = ImageDraw.Draw(im); u = k * 2
    for x, y in [(1, 1), (4, 3), (2, 6), (6, 7), (5, 1)]:
        d.ellipse([x * u, y * u, (x + 1.4) * u, (y + 1.9) * u], fill=(110, 190, 245, 230), outline=(40, 90, 150, 255), width=max(1, u // 3))
    return im.resize((im.width // 2, im.height // 2), Image.LANCZOS)


def main():
    walk = sheet('walk')
    s = HEIGHT * K / np.mean([walk[r][1]['mask'].shape[0] for r in range(4)])   # the standing frames
    # walk: new columns are step, stand, step, stand -> the game's stand, step, stand, step
    FW, FH = 24 * K, 32 * K
    out = Image.new('RGBA', (FW * 4, FH * 4))
    for r in range(4):
        for c, src in enumerate([1, 0, 3, 2]):
            out.paste(place(walk[r][src], s, FW, FH, FW / 2, FH - K // 2), (c * FW, r * FH))
    out.save(OUT + 'farmer_walk.webp', 'WEBP', quality=90, method=6); print('walk', out.size, 'scale', round(s, 4))

    TW, TH = 40 * K, 48 * K
    tools = {'hoe': sheet('hoe'), 'axe': sheet('axe'), 'pickaxe': sheet('pickaxe')}
    # the can: standing farmer holding a drawn can; it tips forward and pours on the strike
    can = draw_can(K); spl = drops(K)
    frames = []
    for t in ['hoe', 'can', 'axe', 'pickaxe']:
        for d in range(4):
            for ph in range(4):
                if t == 'can':
                    cell = place(walk[d][1], s, TW, TH, TW / 2, 46 * K)
                    pour = ph in (1, 2)
                    c2 = can if d != 1 else can.transpose(Image.FLIP_LEFT_RIGHT)
                    if pour: c2 = c2.rotate(-28 if d != 1 else 28, resample=Image.BICUBIC, expand=True)
                    hx = {0: TW / 2 + 1 * K, 1: TW / 2 - 6 * K, 2: TW / 2 + 6 * K, 3: TW / 2 + 1 * K}[d]; hy = 46 * K - 12 * K + pour * K
                    layer = Image.new('RGBA', cell.size); layer.paste(c2, (int(hx - c2.width / 2), int(hy - c2.height / 2)), c2)
                    if ph == 2:   # water from the rose
                        sx = int(hx + (c2.width / 2 if d != 1 else -c2.width / 2 - spl.width)); layer.paste(spl, (sx, int(hy)), spl)
                    if d == 3: layer.alpha_composite(cell); cell = layer        # seen from behind: can in front of him is hidden by his body
                    else: cell.alpha_composite(layer)
                else:
                    cell = place(tools[t][d][ph], s, TW, TH, TW / 2, 46 * K)
                frames.append(cell)
    COLS = 8; out = Image.new('RGBA', (TW * COLS, TH * (len(frames) // COLS)))
    for i, f in enumerate(frames): out.paste(f, ((i % COLS) * TW, (i // COLS) * TH))
    assert out.width <= 4096 and out.height <= 4096
    out.save(OUT + 'farmer_tools.webp', 'WEBP', quality=90, method=6); print('tools', out.size)

    # portraits: the two faces on the right of the turnaround sheet
    a, m = C.load(A + 'turnaround_portraits.png'); x0 = int(a.shape[1] * .66)
    faces = C.grid(a[:, x0:], m[:, x0:], 2, 1)
    S = 240
    for j, row in enumerate(faces):
        o = row[0]; k = S / max(o['mask'].shape); im = H.soft(o, k * .98); bg = Image.new('RGBA', (S, S), (0xcf, 0xe3, 0xb2, 255))
        bg.paste(im, ((S - im.width) // 2, S - im.height), im); bg.convert('RGB').save(f'src/hd/port_player_{j}.webp', 'WEBP', quality=88, method=6)
    print('portraits')


if __name__ == '__main__':
    main()
