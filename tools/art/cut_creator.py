"""Character creator test (18 Nov 2026): put hairstyles on the base body.
art_incoming/creator/base_walk.png: 4x4 walk sheet (rows down, left, right, up; cols step, stand, step, stand) on magenta.
art_incoming/creator/hair_test.png: 4 hairstyles (rows) x 4 views (cols front, left, right, back) on magenta, drawn ~2x.
Each hairstyle is fitted to the head once per direction (scale and offset that best cover the base's own close-cropped
hair without covering the face), then follows the head in every frame. Writes /tmp/cc_*.png and a walking GIF."""
import numpy as np, itertools, sys
from PIL import Image
from scipy import ndimage as ndi
SRC = 'art_incoming/creator/'
def load(p):
    a = np.asarray(Image.open(SRC + p).convert('RGB')).astype(int); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    m = ~((r > 160) & (b > 160) & (g < 120))
    m = ndi.binary_opening(m, iterations=1)
    rgba = np.dstack([a, m * 255]).astype(np.uint8); return rgba, m
def cells(m):
    lb, n = ndi.label(m); objs = [o for i, o in enumerate(ndi.find_objects(lb)) if (lb[o] == i + 1).sum() > 800]
    objs.sort(key=lambda o: (round(o[0].start / 150), o[1].start)); return objs
BODY, BM = load('base_walk.png'); HAIR, HM = load('hair_test.png')
bc, hc = cells(BM), cells(HM)
assert len(bc) == 16 and len(hc) == 16, (len(bc), len(hc))
CW = 320; CH = 330   # output cell; feet on a common baseline
def body_frame(i):
    o = bc[i]; im = BODY[o]; h, w = im.shape[:2]
    out = np.zeros((CH, CW, 4), np.uint8); x0 = (CW - w) // 2; y0 = CH - 12 - h
    out[y0:y0 + h, x0:x0 + w] = im; return out
def hsv(rgb):
    from colorsys import rgb_to_hsv
    return np.array([rgb_to_hsv(*(p / 255)) for p in rgb.reshape(-1, 3)]).reshape(rgb.shape)
frames = [body_frame(i) for i in range(16)]
def head(fr):
    a = fr[..., 3] > 0; ys = np.nonzero(a.any(1))[0]; top = ys[0]
    band = a[top:top + 40]; xs = np.nonzero(band)[1]; return top, xs.mean()
def scalp_face(fr):
    top, cx = head(fr); a = fr[..., 3] > 0; rgb = fr[..., :3].astype(float)
    H = np.zeros(a.shape, bool); H[top:top + 62] = True
    mx = rgb.max(-1); mn = rgb.min(-1); sat = (mx - mn) / np.maximum(mx, 1)
    dark = a & H & (mx < 120)                              # the close-cropped hair and outlines
    skin = a & H & (mx > 150) & (rgb[..., 0] > rgb[..., 2] + 40)   # warm skin
    return dark, skin
def hair_piece(row, col):
    o = hc[row * 4 + col]; return HAIR[o]
def place(fr, piece, s, dx, dy):
    h, w = piece.shape[:2]; im = Image.fromarray(piece).resize((max(1, int(w * s)), max(1, int(h * s))), Image.NEAREST)
    top, cx = head(fr); out = Image.fromarray(fr.copy()); x = int(round(cx + dx - im.width / 2)); y = int(round(top + dy))
    out.alpha_composite(im, (x, y)) if 0 <= x and 0 <= y and x + im.width <= CW and y + im.height <= CH else out.paste(im, (x, y), im)
    return np.asarray(out), (x, y, im)
def fit(row, col, fr):
    dark, skin = scalp_face(fr); best = None
    piece = hair_piece(row, col)
    for s in np.arange(.40, .62, .02):
        h, w = piece.shape[:2]; im = np.asarray(Image.fromarray(piece).resize((int(w * s), int(h * s)), Image.NEAREST))[..., 3] > 0
        top, cx = head(fr)
        for dx in range(-24, 25, 2):
            for dy in range(-60, 11, 2):
                x = int(round(cx + dx - im.shape[1] / 2)); y = int(round(top + dy))
                cov = np.zeros(dark.shape, bool); ys, xs = max(0, y), max(0, x)
                sub = im[ys - y:, xs - x:][:CH - ys, :CW - xs]; cov[ys:ys + sub.shape[0], xs:xs + sub.shape[1]] = sub
                sc = (cov & dark).sum() * 2 - (cov & skin).sum() * (3 if col in (0,) else 1.2) - (dark & ~cov).sum() * 1.5 - cov.sum() * .02
                if best is None or sc > best[0]: best = (sc, s, dx, dy)
    return best

# ---- rule-based placement (replaces the fitter): one scale, hair top above the head top; side views line the
# back of the hair up with the back of the head
SCALE = .5
def head_box(fr):
    a = fr[..., 3] > 0; ys = np.nonzero(a.any(1))[0]; top = ys[0]; xs = np.nonzero(a[top:top + 50].any(0))[0]
    return top, xs[0], xs[-1]
def place2(fr, piece, d, tweak=(0, 0)):
    top, x0, x1 = head_box(fr); h, w = piece.shape[:2]
    im = Image.fromarray(piece).resize((int(w * SCALE), int(h * SCALE)), Image.NEAREST)
    a = np.asarray(im)[..., 3] > 0; cols = np.nonzero(a.any(0))[0]; L, R = cols[0], cols[-1]
    if d == 1: x = x1 + 14 - R         # facing left: back of head on the right
    elif d == 2: x = x0 - 14 - L       # facing right
    else: x = int(round((x0 + x1) / 2 - (L + R) / 2))
    y = top - (34 if d in (0, 3) else 30)
    x += tweak[0]; y += tweak[1]
    base = Image.fromarray(debald(fr, im, x, y)); base.alpha_composite(im, (int(x), int(y))) if x >= 0 and y >= 0 else base.paste(im, (int(x), int(y)), im)
    return np.asarray(base)
def debald(fr, im, x, y):
    """The base's own close-cropped hair shows through gaps in a hairstyle (round the face): paint it as skin."""
    fr = fr.copy(); top, x0, x1 = head_box(fr); rgb = fr[..., :3].astype(int); a = fr[..., 3] > 0
    mx = rgb.max(-1); mn = rgb.min(-1)
    reg = np.zeros(a.shape, bool); reg[top:top + 24, x0:x1 + 1] = True
    skin = a & reg & (mx > 170) & (rgb[..., 0] > rgb[..., 2] + 40)
    hairpx = a & reg & (mx > 55) & ~skin   # everything up there that isn't skin or the outline is the base's own hair
    if skin.any() and hairpx.any():
        col = np.median(rgb[skin], 0).astype(np.uint8); fr[hairpx, :3] = col
    return fr
def recolour(piece, rgb):
    """Hair colour: every pixel takes the new hue/saturation, its brightness kept (shading stays)."""
    from colorsys import rgb_to_hsv, hsv_to_rgb
    p = piece.copy(); th, ts, tv = rgb_to_hsv(*(np.array(rgb) / 255))
    a = p[..., 3] > 0; px = p[a][:, :3] / 255.
    mx = px.max(1); mean = mx[mx > .25].mean() if (mx > .25).any() else .5
    out = []
    for r, g, b in px:
        h, s_, v = rgb_to_hsv(r, g, b); nv = min(1, v * (tv / mean)) if v > .2 else v * .9
        out.append(hsv_to_rgb(th, min(1, ts * (0.6 + 0.6 * s_)), nv))
    p[a, :3] = (np.array(out) * 255).astype(np.uint8); return p

if __name__ == '__main__' and 'old' in sys.argv:
    import json
    VIEW = [0, 1, 2, 3]   # body row (down, left, right, up) -> hair view column
    fits = {}
    for r in range(4):
        for d in range(4):
            fits[(r, d)] = fit(r, VIEW[d], frames[d * 4 + 1]); print('hair', r, 'dir', d, [round(float(v), 2) for v in fits[(r, d)]], flush=True)
    # one scale per hairstyle (median), keep each direction's offset
    sheet = Image.new('RGBA', (CW * 4, CH * 5), (190, 214, 190, 255))
    for d in range(4): sheet.alpha_composite(Image.fromarray(frames[d * 4 + 1]), (d * CW, 0))
    for r in range(4):
        for d in range(4):
            _, s, dx, dy = fits[(r, d)]; out, _ = place(frames[d * 4 + 1], hair_piece(r, VIEW[d]), s, dx, dy)
            sheet.alpha_composite(Image.fromarray(out), (d * CW, (r + 1) * CH))
    sheet.resize((CW * 2, CH * 5 // 2), Image.NEAREST).save('/tmp/cc_sheet.png')
    # walking gif for each hairstyle, front and right
    gif = []
    for f in range(4):
        canvas = Image.new('RGBA', (CW * 4, CH * 2), (190, 214, 190, 255))
        for r in range(4):
            for k, d in enumerate([0, 2]):
                _, s, dx, dy = fits[(r, d)]; out, _ = place(frames[d * 4 + f], hair_piece(r, VIEW[d]), s, dx, dy)
                canvas.alpha_composite(Image.fromarray(out), (r * CW, k * CH))
        gif.append(canvas.resize((CW * 2, CH), Image.NEAREST).convert('RGB'))
    gif[0].save('/tmp/cc_walk.gif', save_all=True, append_images=gif[1:], duration=180, loop=0)
    json.dump({f'{r},{d}': [float(v) for v in fits[(r, d)][1:]] for r in range(4) for d in range(4)}, open('/tmp/cc_fits.json', 'w'))

if __name__ == '__main__' and 'old' not in sys.argv:
    VIEW = [0, 1, 2, 3]
    # 1. heads close up: every hairstyle in every direction
    W, Hh = CW, 150
    sheet = Image.new('RGBA', (W * 4, Hh * 5), (190, 214, 190, 255))
    for d in range(4): sheet.alpha_composite(Image.fromarray(frames[d * 4 + 1][:Hh]), (d * W, 0))
    for r in range(4):
        for d in range(4): sheet.alpha_composite(Image.fromarray(place2(frames[d * 4 + 1], hair_piece(r, VIEW[d]), d)[:Hh]), (d * W, (r + 1) * Hh))
    sheet.save('/tmp/cc_heads.png')
    # 2. colours: hairstyle 2 (the bob) in 8 hair colours, front view
    COLS = [(40, 30, 28), (92, 58, 36), (128, 70, 40), (150, 60, 36), (196, 104, 48), (226, 188, 110), (150, 148, 150), (230, 228, 220)]
    cs = Image.new('RGBA', (W * 8, Hh), (190, 214, 190, 255))
    for i, c in enumerate(COLS): cs.alpha_composite(Image.fromarray(place2(frames[1], recolour(hair_piece(2, 0), c), 0)[:Hh]), (i * W, 0))
    cs.resize((W * 4, Hh // 2), Image.LANCZOS).save('/tmp/cc_colours.png')
    # 3. walking, at the size the game shows it (a sixth), all four hairstyles, all four directions
    gif = []
    for f in range(4):
        canvas = Image.new('RGBA', (CW * 4, CH * 4), (190, 214, 190, 255))
        for r in range(4):
            for d in range(4): canvas.alpha_composite(Image.fromarray(place2(frames[d * 4 + f], hair_piece(r, VIEW[d]), d)), (d * CW, r * CH))
        gif.append(canvas.resize((CW * 2, CH * 2), Image.LANCZOS).convert('RGB'))
    gif[0].save('/tmp/cc_walk.gif', save_all=True, append_images=gif[1:], duration=170, loop=0)
    print('done')
