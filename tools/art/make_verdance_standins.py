"""Stand-in art for Verdance Energy, until the user's own art arrives (story plan, Nov 2026).

Characters are recoloured copies of existing high-detail sheets and portraits, in Verdance's slate grey and acid
green. Skin and outlines are kept; clothes are recoloured by hue band.
  src/hd_world/tr_<kind>.webp + src/tr_<kind>.png (1x)   walk sheets (4x4 of 28x32)
  src/hd/port_<kind>_<0|1>.webp                         portraits
Props (siphon rig, drill, tower, sea rig, pipe, billboard, stake, kiosk, collar) are drawn here into the
hd_world/vd atlas at 3x.
Run from the repo root:  python3 tools/art/make_verdance_standins.py [--preview out.png]
"""
import colorsys, json, math, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUT = 'src/hd_world/'
SLATE = (0.58, 0.13)        # hue, saturation of Verdance grey
GREEN = (0.24, 0.72)        # acid green

# kind: (base sheet, base portrait, bands). Only colours inside a band change; everything else (faces, hair, outlines)
# is kept. band: (hue_lo, hue_hi, sat_min, val_max, style), style 'slate', 'green', 'dark' or 'white'.
CHARS = {
    'vtech': ('tr_reedcutter', 'reedcutter', [(.95, 1, .55, 1, 'green'), (0, .06, .6, 1, 'green'), (.13, .45, .2, 1, 'slate'), (.5, .72, .15, 1, 'green')]),
    'vtech2': ('tr_rambler', 'rambler', [(.0, .1, .62, 1, 'green'), (.96, 1, .62, 1, 'green'), (.12, .3, .25, 1, 'slate'), (.3, .45, .2, 1, 'slate')]),
    'gleam': ('tr_orrin', 'orrin', [(.07, .19, .25, 1, 'white'), (.94, 1, .5, 1, 'green'), (0, .025, .5, 1, 'green'), (.55, .8, .2, 1, 'dark')]),
    'brask': ('tr_granger', 'granger', [(.94, 1, .45, 1, 'dark'), (0, .04, .5, 1, 'dark'), (.55, .75, .2, 1, 'slate')]),
    'ash': ('tr_wispwatcher', 'wispwatcher', [(.42, .62, .15, 1, 'white')]),
}


def recolour(im, bands, protect=None):
    a = np.asarray(im.convert('RGBA')).astype(np.float32) / 255
    rgb = a[..., :3]; al = a[..., 3]
    mx = rgb.max(-1); mn = rgb.min(-1); v = mx; s = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    h = np.zeros_like(mx); d = np.maximum(mx - mn, 1e-6)
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) / 6
    out = rgb.copy()
    style = np.full(mx.shape, '', dtype=object)
    for lo, hi, smin, vmax, st in bands: style[(h >= lo) & (h < hi) & (s >= smin) & (v <= vmax)] = st
    change = (al > 0) & (style != '')
    if protect is not None: change &= ~protect
    def hsv2rgb(hh, ss, vv):
        i = np.floor(hh * 6) % 6; f = hh * 6 - np.floor(hh * 6); p = vv * (1 - ss); q = vv * (1 - f * ss); t = vv * (1 - (1 - f) * ss)
        R = np.choose(i.astype(int), [vv, q, p, p, t, vv]); G = np.choose(i.astype(int), [t, vv, vv, q, p, p]); B = np.choose(i.astype(int), [p, p, t, vv, vv, q])
        return np.stack([R, G, B], -1)
    for st, (hh, ss, vk, vb) in {'slate': (SLATE[0], SLATE[1], .9, 0), 'green': (GREEN[0], GREEN[1], 1.0, .04), 'dark': (SLATE[0], .16, .55, 0), 'white': (.58, .06, 1.15, .22)}.items():
        m = change & (style == st)
        if not m.any(): continue
        nv = np.clip(v * vk + vb, 0, 1)
        out[m] = hsv2rgb(np.full(mx.shape, hh), np.full(mx.shape, ss), nv)[m]
    o = np.dstack([out, al]); return Image.fromarray((o * 255).round().astype(np.uint8), 'RGBA')


def head_mask_sheet(im, rows=4, cols=4, frac=.4):
    """Keep each walking frame's head untouched: the top `frac` of the figure in every cell."""
    al = np.asarray(im.convert('RGBA'))[..., 3] > 0; H, W = al.shape; m = np.zeros_like(al)
    ch, cw = H // rows, W // cols
    for r in range(rows):
        for c in range(cols):
            cell = al[r * ch:(r + 1) * ch, c * cw:(c + 1) * cw]; ys = np.where(cell.any(1))[0]
            if len(ys): m[r * ch + ys[0]:r * ch + ys[0] + int((ys[-1] - ys[0]) * frac), c * cw:(c + 1) * cw] = True
    return m


def head_mask_port(im, cy=.38, ry=.31, rx=.25):
    W, H = im.size; yy, xx = np.mgrid[0:H, 0:W]
    return ((xx / W - .5) / rx) ** 2 + ((yy / H - cy) / ry) ** 2 < 1


def chars():
    for kind, (sheet, port, bands) in CHARS.items():
        src0 = Image.open(OUT + sheet + '.webp'); im = recolour(src0, bands, head_mask_sheet(src0))
        im.save(OUT + 'tr_' + kind + '.webp', 'WEBP', quality=86, method=6)
        im.resize((im.width // 3, im.height // 3), Image.LANCZOS).save('src/tr_' + kind + '.png')
        for j in (0, 1):
            p = Image.open(f'src/hd/port_{port}_{j}.webp').convert('RGBA')
            bg = p.getpixel((2, 2))
            q = recolour(p, bands, head_mask_port(p)); a = np.asarray(q).copy()
            # keep the talk-box green background as it was
            src = np.asarray(p); same = (np.abs(src[..., :3].astype(int) - np.array(bg[:3])).sum(-1) < 30)
            a[same] = src[same]; Image.fromarray(a).convert('RGB').save(f'src/hd/port_{kind}_{j}.webp', 'WEBP', quality=86, method=6)
        print(kind)


# ---------------------------------------------------------------- props, drawn at 8x and shrunk to 3x
K = 3; SS = 8
OUTL = (34, 38, 44, 255); STEEL = (112, 124, 138, 255); STEEL_D = (74, 84, 98, 255); STEEL_L = (160, 172, 186, 255)
GRN = (140, 210, 60, 255); GRN_D = (78, 140, 34, 255); GLOW = (190, 255, 120, 255); RUST = (150, 96, 60, 255)
WOOD = (142, 98, 58, 255); WOOD_D = (98, 64, 36, 255); PAPER = (236, 232, 216, 255)
FONT = '/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf'


def canvas(w, h):
    """w, h in game pixels; returns (image, draw, unit) where unit = drawing pixels per game pixel"""
    u = K * SS; im = Image.new('RGBA', (w * u, h * u)); return im, ImageDraw.Draw(im), u


def done(im): return im.resize((im.width // SS, im.height // SS), Image.LANCZOS)


def box(d, u, x0, y0, x1, y1, fill, ol=OUTL, r=0, w=.6):
    d.rounded_rectangle([x0 * u, y0 * u, x1 * u, y1 * u], radius=r * u, fill=fill, outline=ol, width=max(1, int(w * u)))


def logo(d, u, cx, cy, r):
    """the Verdance mark: a leaf inside a cog"""
    for i in range(8):
        a = i / 8 * math.tau; x, y = cx + math.cos(a) * r, cy + math.sin(a) * r
        d.rectangle([(x - r * .22) * u, (y - r * .22) * u, (x + r * .22) * u, (y + r * .22) * u], fill=STEEL_D)
    d.ellipse([(cx - r) * u, (cy - r) * u, (cx + r) * u, (cy + r) * u], fill=STEEL_L, outline=OUTL, width=int(.35 * u))
    d.ellipse([(cx - r * .55) * u, (cy - r * .9) * u, (cx + r * .55) * u, (cy + r * .9) * u], fill=GRN, outline=GRN_D, width=int(.25 * u))
    d.line([(cx * u, (cy - r * .7) * u), (cx * u, (cy + r * .8) * u)], fill=GRN_D, width=int(.25 * u))


def text(d, u, x, y, s, size, fill=OUTL):
    f = ImageFont.truetype(FONT, int(size * u)); d.text((x * u, y * u), s, font=f, fill=fill, anchor='mm')


def siphon(on=True):
    """a squat pump rig drilled into the ground: frame, tank, pistons, green glow when running"""
    im, d, u = canvas(30, 34)
    box(d, u, 3, 26, 27, 33, STEEL_D, r=1)                                 # base plate
    for x in (5, 23): box(d, u, x, 6, x + 2.5, 28, STEEL)                    # uprights
    box(d, u, 4, 4, 26, 8, STEEL, r=1)                                       # crossbeam
    box(d, u, 9, 12, 21, 26, STEEL_L if on else STEEL, r=3)                  # tank
    box(d, u, 11, 15, 19, 23, GLOW if on else (90, 98, 104, 255), ol=GRN_D if on else OUTL, r=2)
    logo(d, u, 15, 8 + 0, 2.2)
    d.line([(13.5 * u, 26 * u), (13.5 * u, 34 * u)], fill=OUTL, width=int(1.6 * u)); d.line([(16.5 * u, 26 * u), (16.5 * u, 34 * u)], fill=OUTL, width=int(1.6 * u))
    box(d, u, 0, 18, 9, 21, STEEL_D); box(d, u, 21, 18, 30, 21, STEEL_D)   # pipes out
    if not on:
        d.line([(9 * u, 13 * u), (21 * u, 25 * u)], fill=RUST, width=int(.8 * u)); d.line([(21 * u, 13 * u), (9 * u, 25 * u)], fill=RUST, width=int(.8 * u))
    return done(im)


def drill(on=True):
    """the deep drill under the old mine: a tall derrick with a spinning bit"""
    im, d, u = canvas(28, 44)
    box(d, u, 2, 38, 26, 43, STEEL_D, r=1)
    d.polygon([(6 * u, 39 * u), (12 * u, 3 * u), (16 * u, 3 * u), (22 * u, 39 * u)], outline=OUTL, width=int(.8 * u))
    for y in range(8, 38, 6):
        t = (y - 3) / 36; xl, xr = 12 - 6 * t, 16 + 6 * t
        d.line([(xl * u, y * u), (xr * u, y * u)], fill=STEEL, width=int(.9 * u)); d.line([(xl * u, y * u), ((xr - 1) * u, (y + 6) * u)], fill=STEEL_D, width=int(.5 * u))
    box(d, u, 10, 1, 18, 5, STEEL, r=1); logo(d, u, 14, 3, 1.6)
    box(d, u, 11, 22, 17, 32, GLOW if on else (90, 98, 104, 255), ol=GRN_D if on else OUTL, r=1)
    d.polygon([(12 * u, 38 * u), (16 * u, 38 * u), (14 * u, 44 * u)], fill=STEEL_L, outline=OUTL)
    return done(im)


def tower(on=True):
    """Dr Ash's wind siphon on Windcrown Peak: a mast with spinning vanes and a humming coil"""
    im, d, u = canvas(30, 52)
    box(d, u, 7, 46, 23, 51, STEEL_D, r=1)
    box(d, u, 13, 10, 17, 47, STEEL)
    for y in range(14, 46, 5): d.line([(13 * u, y * u), (17 * u, (y + 4) * u)], fill=STEEL_D, width=int(.4 * u))
    box(d, u, 9, 26, 21, 36, STEEL_L, r=2); box(d, u, 11, 28, 19, 34, GLOW if on else (90, 98, 104, 255), ol=GRN_D if on else OUTL, r=1)
    for a in (0, 120, 240):                                                    # vanes
        r = math.radians(a + 20); x, y = 15 + math.cos(r) * 13, 8 + math.sin(r) * 6
        d.polygon([(15 * u, 8 * u), (x * u, y * u), ((x + 2) * u, (y + 2.5) * u)], fill=STEEL_L, outline=OUTL)
    d.ellipse([12.5 * u, 5.5 * u, 17.5 * u, 10.5 * u], fill=GRN if on else STEEL, outline=OUTL, width=int(.5 * u))
    logo(d, u, 15, 41, 2)
    return done(im)


def searig(on=True):
    """an offshore platform: legs into the water, deck, crane and a glowing intake"""
    im, d, u = canvas(48, 40)
    for x in (6, 16, 32, 42): box(d, u, x, 18, x + 3, 39, STEEL_D)
    d.rectangle([0, 34 * u, 48 * u, 40 * u], fill=(60, 110, 150, 110))
    box(d, u, 2, 14, 46, 20, STEEL, r=1); d.line([(2 * u, 17 * u), (46 * u, 17 * u)], fill=STEEL_D, width=int(.5 * u))
    box(d, u, 6, 4, 20, 14, STEEL_L, r=1); box(d, u, 9, 6, 17, 11, GLOW if on else (90, 98, 104, 255), ol=GRN_D if on else OUTL, r=1)
    d.line([(30 * u, 14 * u), (30 * u, 2 * u)], fill=OUTL, width=int(1.4 * u)); d.line([(30 * u, 2 * u), (44 * u, 8 * u)], fill=OUTL, width=int(1.2 * u))
    d.line([(44 * u, 8 * u), (44 * u, 13 * u)], fill=OUTL, width=int(.5 * u))
    box(d, u, 22, 8, 28, 14, (210, 120, 40, 255), r=.5)
    logo(d, u, 37, 10.5, 2.3)
    return done(im)


def pipe():
    im, d, u = canvas(16, 8)
    box(d, u, 0, 2, 16, 7, STEEL, r=.5); d.line([(0, 3.2 * u), (16 * u, 3.2 * u)], fill=STEEL_L, width=int(.8 * u))
    for x in (2, 13): box(d, u, x, 1, x + 2, 8, STEEL_D)
    return done(im)


def billboard(defaced=False):
    im, d, u = canvas(40, 30)
    for x in (6, 31): box(d, u, x, 14, x + 3, 30, WOOD_D)
    box(d, u, 1, 1, 39, 19, PAPER, r=1)
    d.rectangle([2 * u, 2 * u, 38 * u, 7 * u], fill=GRN_D)
    text(d, u, 20, 4.6, 'VERDANCE', 3.6, fill=(240, 250, 230, 255))
    logo(d, u, 7, 12.5, 3.2)
    text(d, u, 24, 10.6, 'Clean power,', 2.5); text(d, u, 24, 14.8, 'naturally.', 2.5)
    if defaced:
        d.line([(12 * u, 9 * u), (37 * u, 17 * u)], fill=(200, 40, 40, 255), width=int(1 * u))
        text(d, u, 24, 12.8, 'LIARS', 4.2, fill=(200, 40, 40, 235))
        for (x, y) in [(5, 4), (33, 15), (16, 17)]: d.ellipse([x * u, y * u, (x + 3) * u, (y + 2) * u], fill=(110, 140, 60, 200))
    return done(im)


def stake():
    im, d, u = canvas(8, 16)
    box(d, u, 3, 3, 5, 16, WOOD)
    d.polygon([(4.6 * u, 2 * u), (8 * u, 3.5 * u), (4.6 * u, 6 * u)], fill=GRN, outline=GRN_D)
    return done(im)


def memo():
    """a dropped Verdance clipboard, lying in the grass"""
    im, d, u = canvas(14, 12)
    d.polygon([(1 * u, 4 * u), (10 * u, 2 * u), (13 * u, 9 * u), (4 * u, 11.4 * u)], fill=WOOD, outline=OUTL)
    d.polygon([(2.4 * u, 4.6 * u), (9.6 * u, 3 * u), (12 * u, 8.6 * u), (4.6 * u, 10.3 * u)], fill=PAPER, outline=(170, 168, 156, 255))
    for i in range(3):
        y = 5.8 + i * 1.3; d.line([(3.6 * u + i * .35 * u, (y + .6) * u), (9.6 * u + i * .35 * u, (y - .7) * u)], fill=(150, 156, 160, 255), width=int(.45 * u))
    d.rounded_rectangle([4.8 * u, 1.6 * u, 7.6 * u, 3.4 * u], radius=.4 * u, fill=STEEL_L, outline=OUTL, width=int(.4 * u))
    d.ellipse([9.4 * u, 7.4 * u, 11 * u, 9 * u], fill=GRN, outline=GRN_D)
    return done(im)


def grow_icon():
    """Verdance Grow: a tied slate sack with an acid-green label and the leaf-cog mark"""
    im, d, u = canvas(24, 24)
    d.rounded_rectangle([3.4 * u, 7.5 * u, 20.6 * u, 22.4 * u], radius=6 * u, fill=STEEL, outline=OUTL, width=int(.6 * u))
    d.rounded_rectangle([5 * u, 9 * u, 9 * u, 20 * u], radius=2 * u, fill=STEEL_L)          # highlight
    d.polygon([(8.6 * u, 8.2 * u), (10.4 * u, 4.2 * u), (13.6 * u, 4.2 * u), (15.4 * u, 8.2 * u)], fill=STEEL, outline=OUTL)
    d.polygon([(9.6 * u, 4.4 * u), (8.4 * u, 1.4 * u), (12 * u, 3.2 * u), (15.6 * u, 1.4 * u), (14.4 * u, 4.4 * u)], fill=STEEL_L, outline=OUTL)
    d.rounded_rectangle([9.2 * u, 6.6 * u, 14.8 * u, 8.4 * u], radius=.6 * u, fill=GRN_D, outline=OUTL, width=int(.4 * u))   # tie
    d.rounded_rectangle([6 * u, 12 * u, 18 * u, 19.6 * u], radius=1.2 * u, fill=GRN, outline=GRN_D, width=int(.5 * u))      # label
    logo(d, u, 12, 15.8, 2.3)
    for x, y in [(16.4, 21.2), (18.4, 20.4), (6.2, 21.4)]: d.ellipse([(x - .8) * u, (y - .8) * u, (x + .8) * u, (y + .8) * u], fill=GLOW, outline=GRN_D)
    return done(im)


def kiosk():
    im, d, u = canvas(34, 32)
    box(d, u, 2, 12, 32, 31, STEEL_L, r=1)
    box(d, u, 0, 6, 34, 13, GRN, ol=GRN_D, r=1)
    for x in range(0, 34, 6): d.rectangle([x * u, 10.5 * u, (x + 3) * u, 13 * u], fill=(240, 250, 230, 255))
    text(d, u, 17, 9, 'VERDANCE GROW', 2.6, fill=(240, 250, 230, 255))
    box(d, u, 4, 16, 30, 22, STEEL, r=.5)
    for i, x in enumerate(range(6, 28, 5)): box(d, u, x, 13, x + 3.5, 18, GRN if i % 2 else (210, 196, 150, 255), r=.4)
    logo(d, u, 17, 26.5, 3)
    return done(im)


def rootheart(revived):
    """a hearthtree's root-heart breaking the surface: two great roots arching out of a mound of earth and
    twisting round a knot with a heart-light inside. Drained: grey, split, with a Verdance clamp and pipe on it."""
    im, d, u = canvas(34, 26)
    bark, bark_d, bark_l = ((150, 108, 66, 255), (98, 66, 38, 255), (192, 148, 96, 255)) if revived else ((140, 136, 128, 255), (92, 90, 86, 255), (172, 168, 160, 255))
    def curve(pts, w, col):
        (x0, y0), (x1, y1), (x2, y2) = pts
        for i in range(41):
            t = i / 40; x = (1 - t) ** 2 * x0 + 2 * (1 - t) * t * x1 + t * t * x2; y = (1 - t) ** 2 * y0 + 2 * (1 - t) * t * y1 + t * t * y2
            r = w * (1 - .45 * abs(t - .5) * 2) / 2
            d.ellipse([(x - r) * u, (y - r) * u, (x + r) * u, (y + r) * u], fill=col)
    # earth mound
    d.ellipse([1 * u, 18 * u, 33 * u, 26 * u], fill=(98, 72, 46, 255) if revived else (110, 104, 92, 255), outline=OUTL, width=int(.5 * u))
    roots = [((3, 23), (6, 6), (17, 11)), ((31, 23), (29, 7), (17, 11)), ((9, 24), (12, 15), (17, 14)), ((25, 24), (23, 16), (17, 14))]
    for pts in roots: curve(pts, 6.4, OUTL)
    for pts in roots: curve(pts, 5, bark)
    for pts in roots[:2]: curve([(x - .8, y - .8) for x, y in pts], 1.6, bark_l)
    # the knot, and the heart in it
    d.ellipse([11.5 * u, 6.5 * u, 22.5 * u, 17.5 * u], fill=bark_d, outline=OUTL, width=int(.6 * u))
    if revived:
        for r, a in [(5.4, 70), (4, 140), (2.8, 255)]:
            d.ellipse([(17 - r) * u, (12 - r) * u, (17 + r) * u, (12 + r) * u], fill=(255, 196, 90, a) if r > 3 else (255, 244, 200, 255))
        for x, y, f in [(6, 9, 1), (27, 8, -1), (13, 4, 1), (22, 3, -1), (9, 15, 1)]:
            d.polygon([(x * u, y * u), ((x + 3 * f) * u, (y - 2.4) * u), ((x + 4.4 * f) * u, (y - .2) * u), ((x + 1.2 * f) * u, (y + 1.2) * u)], fill=(116, 196, 72, 255), outline=(50, 110, 40, 255))
    else:
        d.ellipse([14.5 * u, 9.5 * u, 19.5 * u, 14.5 * u], fill=(108, 104, 98, 255))
        for (x0, y0, x1, y1) in [(13, 8, 16, 12), (20, 9, 18, 13), (16, 16, 17, 13)]: d.line([(x0 * u, y0 * u), (x1 * u, y1 * u)], fill=OUTL, width=int(.5 * u))
        # the clamp and its pipe, running off to the right
        d.rounded_rectangle([20.5 * u, 8.5 * u, 24 * u, 15.5 * u], radius=.6 * u, fill=STEEL, outline=OUTL, width=int(.5 * u))
        d.rounded_rectangle([23.5 * u, 10.6 * u, 33.6 * u, 13.4 * u], radius=.4 * u, fill=STEEL_L, outline=OUTL, width=int(.5 * u))
        d.ellipse([21.2 * u, 9.6 * u, 23.2 * u, 11.6 * u], fill=GRN, outline=GRN_D)
    return done(im)


def collar():
    im, d, u = canvas(16, 8)
    d.ellipse([1 * u, 1 * u, 15 * u, 7 * u], outline=OUTL, width=int(2 * u)); d.ellipse([1 * u, 1 * u, 15 * u, 7 * u], outline=STEEL, width=int(1.2 * u))
    box(d, u, 6, 4, 10, 8, STEEL_D, r=.5); d.ellipse([7.2 * u, 5 * u, 8.8 * u, 6.6 * u], fill=GLOW)
    return done(im)


def props():
    ims = {'vd_siphon': siphon(), 'vd_siphon_off': siphon(False), 'vd_drill': drill(), 'vd_drill_off': drill(False), 'vd_tower': tower(), 'vd_tower_off': tower(False),
           'vd_rig': searig(), 'vd_rig_off': searig(False), 'vd_pipe': pipe(), 'vd_board': billboard(), 'vd_board_x': billboard(True), 'vd_stake': stake(),
           'vd_kiosk': kiosk(), 'vd_root': rootheart(False), 'vd_root_on': rootheart(True), 'vd_collar': collar(), 'vd_memo': memo(), 'i_vgrow': grow_icon()}
    W = 1024; x = y = rowh = 0; pos = {}
    for n, im in sorted(ims.items(), key=lambda kv: -kv[1].height):
        if x + im.width > W: x = 0; y += rowh + 2; rowh = 0
        pos[n] = (x, y); x += im.width + 2; rowh = max(rowh, im.height)
    out = Image.new('RGBA', (W, y + rowh)); frames = {}
    for n, im in ims.items():
        px, py = pos[n]; out.paste(im, (px, py), im); frames[n] = {'frame': {'x': px, 'y': py, 'w': im.width, 'h': im.height}}
    out.save(OUT + 'vd.webp', 'WEBP', quality=88, method=6); json.dump({'frames': frames}, open(OUT + 'vd.json', 'w'))
    print('props', out.size)
    return out


if __name__ == '__main__':
    chars(); out = props()
    if '--preview' in sys.argv:
        p = sys.argv[sys.argv.index('--preview') + 1]
        rows = [Image.open(OUT + f'tr_{k}.webp') for k in CHARS]
        W = sum(r.width for r in rows) + 10 * len(rows); bg = Image.new('RGBA', (max(W, out.width * 2), 384 + 20 + out.height * 2 + 260), (126, 170, 96, 255))
        x = 0
        for r in rows: bg.paste(r, (x, 0), r); x += r.width + 10
        big = out.resize((out.width * 2, out.height * 2), Image.LANCZOS); bg.paste(big, (0, 404), big)
        x = 0
        for k in CHARS:
            for j in (0, 1): pi = Image.open(f'src/hd/port_{k}_{j}.webp'); bg.paste(pi, (x, 404 + big.height + 10)); x += 244
        bg.save(p)
