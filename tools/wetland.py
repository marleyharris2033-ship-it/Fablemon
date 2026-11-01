import math, json, base64, numpy as np
from PIL import Image
OUT = (42, 30, 26)
def hx(s): s = s.lstrip('#'); return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4))
class Cv:
    def __init__(s, w, h): s.w, s.h = w, h; s.a = np.zeros((h, w, 4), np.uint8)
    def put(s, x, y, c):
        x, y = int(round(x)), int(round(y))
        if 0 <= x < s.w and 0 <= y < s.h: s.a[y, x, :3] = hx(c) if isinstance(c, str) else c; s.a[y, x, 3] = 255
    def disc(s, cx, cy, rx, ramp, ry=None, light=(-.6, -.8), ang=0, cut=None):
        ry = ry or rx; R = max(rx, ry); ca, sa = math.cos(ang), math.sin(ang)
        for y in range(int(cy - R - 1), int(cy + R + 2)):
            for x in range(int(cx - R - 1), int(cx + R + 2)):
                px, py = x + .5 - cx, y + .5 - cy
                if cut and cut(px, py): continue
                dx, dy = (px * ca + py * sa) / rx, (-px * sa + py * ca) / ry
                d = dx * dx + dy * dy
                if d <= 1:
                    l = -(dx * light[0] + dy * light[1])
                    i = 3 if l > .55 and d < .45 else 2 if l > .1 else 1 if l > -.45 else 0
                    s.put(x, y, ramp[min(i, len(ramp) - 1)])
    def line(s, x0, y0, x1, y1, c):
        n = int(max(abs(x1 - x0), abs(y1 - y0))) + 1
        for i in range(n + 1): t = i / max(n, 1); s.put(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, c)
    def rect(s, x, y, w, h, c):
        for yy in range(y, y + h):
            for xx in range(x, x + w): s.put(xx, yy, c)
    def outline(s):
        m = s.a[..., 3] > 0; o = np.zeros_like(m)
        o[1:] |= m[:-1]; o[:-1] |= m[1:]; o[:, 1:] |= m[:, :-1]; o[:, :-1] |= m[:, 1:]
        o &= ~m; s.a[o, :3] = OUT; s.a[o, 3] = 255; return s
    def img(s): return Image.fromarray(s.a, 'RGBA')
LEAF = ['#2f6a2a', '#4e9a38', '#7cc44e', '#b8e882']
DLEAF = ['#24502a', '#356e34', '#4e8c3e', '#7ab05a']
STEM = '#3f7a2e'
OUT_SPR = {}
def spr(name, w, h, draw):
    c = Cv(w + 2, h + 2); draw(c); OUT_SPR[name] = c.outline().img()
# ---------------- crops (drawn in a w x h box, bottom = ground)
def wc(c, n, flowers=False):
    pts = [(8, 9), (5, 8), (11, 8), (7, 6), (10, 5), (4, 5), (12, 10), (3, 9), (8, 3)][:n]
    for x, y in pts: c.line(8, 12, x, y + 1, STEM)
    for x, y in pts: c.disc(x, y, 2.1 if n > 4 else 1.7, LEAF)
    if flowers:
        for x, y in [(7, 2), (11, 3), (4, 3), (9, 1)]: c.put(x, y, '#ffffff'); c.put(x + 1, y, '#f4f4e8'); c.put(x, y + 1, '#e8e8d8')
spr('watercress1', 14, 13, lambda c: wc(c, 2))
spr('watercress2', 14, 13, lambda c: wc(c, 4))
spr('watercress3', 14, 13, lambda c: wc(c, 7))
spr('watercress4', 14, 13, lambda c: wc(c, 9, True))
def rice(c, hgt, ripe, heads):
    base = c.h - 2; xs = [3, 6, 8, 10, 13]
    for i, x in enumerate(xs):
        top = base - hgt + (i % 2) * 2 + (2 if i in (0, 4) else 0); lean = (-1.5 if x < 8 else 1.5 if x > 8 else 0) * hgt / 18
        col = ['#9a8a3a', '#c9b25a'] if ripe else ['#4e8a34', '#7ab04a']
        c.line(x, base, x + lean, top, col[i % 2])
        if heads:
            hx_, hy = x + lean, top
            sd = 1 if lean >= 0 else -1
            for k in range(5 if ripe else 3):
                gx, gy = hx_ + sd * (k * .9 if ripe else k * .4), hy + k * (1.1 if ripe else 1.5)
                c.put(gx, gy, '#4a2c18' if ripe else '#7aa04a'); c.put(gx + sd, gy, '#8a5a32' if ripe else '#a8c86a')
                if ripe and k % 2: c.put(gx, gy + 1, '#6a4428')
spr('wildrice1', 14, 8, lambda c: rice(c, 5, False, False))
spr('wildrice2', 14, 13, lambda c: rice(c, 10, False, False))
spr('wildrice3', 14, 17, lambda c: rice(c, 14, False, True))
spr('wildrice4', 14, 20, lambda c: rice(c, 17, True, True))
BERRY = ['#7a0e22', '#b0182e', '#e0405a', '#ffb0b8']
def cran(c, size, flowers=False, berries=0):
    cx, base = c.w / 2, c.h - 3
    leaves = [(cx, base - 2), (cx - 3, base - 1), (cx + 3, base - 1), (cx - 1.5, base - 4), (cx + 2, base - 4), (cx - 5, base), (cx + 5, base), (cx, base - 6)][:size]
    for x, y in leaves: c.disc(x, y, 2.3, DLEAF, ry=1.7)
    if flowers:
        for x, y in leaves[1::2]: c.put(x, y - 1, '#f6c8d4'); c.put(x + 1, y - 1, '#e89ab0')
    for x, y in [(cx - 3, base - 2), (cx + 2.5, base - 3), (cx, base), (cx + 5, base - 1), (cx - 5.5, base - 1), (cx - 1, base - 5)][:berries]: c.disc(x, y, 1.6, BERRY)
spr('cranberry1', 14, 8, lambda c: cran(c, 2))
spr('cranberry2', 16, 10, lambda c: cran(c, 5))
spr('cranberry3', 16, 12, lambda c: cran(c, 8, True))
spr('cranberry4', 16, 12, lambda c: cran(c, 8, False, 6))
PAD = ['#235e33', '#3e8a4a', '#62b06a', '#9ad49a']
PET = ['#c05a8a', '#f0a0c0', '#ffd0e4', '#fff0f6']
def pad(c, x, y, r):
    c.disc(x, y, r, PAD, ry=r * .62, cut=lambda px, py: py > 0 and abs(px) < py * .9 + .3)
    c.put(x, y, '#235e33')
def lotus(c, st):
    base = c.h - 4
    if st >= 1: pad(c, 7, base + 1, 5.5)
    if st >= 2: pad(c, 13.5, base - 1.5, 4)
    if st >= 3:
        c.line(9.5, base - 1, 9.5, 5 if st == 4 else 6, '#4e8a34')
    if st == 3: c.disc(9.5, 4.5, 2.2, PET, ry=3)
    if st == 4:
        for dx, dy, r, a in [(-3.6, 1.4, 1.6, .9), (3.6, 1.4, 1.6, -.9), (-2, -.4, 1.7, .4), (2, -.4, 1.7, -.4), (0, -1.6, 1.8, 0)]: c.disc(9.5 + dx, 4.5 + dy, r, PET, ry=r * 1.9, ang=a)
        c.disc(9.5, 5, 1.4, ['#c89a2a', '#f2d24e', '#ffe98a', '#fff6c0'], ry=1)
spr('lotus1', 16, 10, lambda c: lotus(c, 1))
spr('lotus2', 20, 11, lambda c: lotus(c, 2))
spr('lotus3', 20, 14, lambda c: lotus(c, 3))
spr('lotus4', 20, 14, lambda c: lotus(c, 4))
# ---------------- icons (20 x 20 art, centred in 24 x 24 later)
ICON = {}
def ico(name, draw):
    c = Cv(22, 22); draw(c); c.outline(); im = Image.new('RGBA', (24, 24)); im.paste(c.img(), (1, 1)); ICON[name] = im
CER = ['#b8ad98', '#e6dcc8', '#fbf6ea', '#ffffff']
def bowl(c, y=12, w=8.5, col=CER):
    c.disc(11, y, w, col, ry=4.5)
    for x in range(int(11 - w), int(11 + w) + 1):
        for yy in range(0, y - 1):
            c.a[yy, x, 3] = c.a[yy, x, 3]   # no-op (keep)
def plate(c, y=15):
    c.disc(11, y, 9.5, CER, ry=3.4); c.disc(11, y - .5, 7.5, ['#d8ccb4', '#efe6d4', '#f6efe2', '#fffaf0'], ry=2.4)
def wc_icon(c):
    tips = [(4, 7), (8, 4), (13, 3), (17, 6), (6, 11), (15, 10), (11, 7)]
    for x, y in tips: c.line(11, 19, x, y + 2, STEM)
    for x, y in tips:
        for ox, oy in [(-1.4, .6), (1.4, .6), (0, -1)]: c.disc(x + ox, y + oy, 1.7, LEAF)
    c.rect(9, 15, 5, 2, '#c9a35a'); c.line(9, 15, 13, 15, '#e8c880')
ico('watercress', wc_icon)
def wr_icon(c):
    c.disc(11, 14, 7, ['#8a6a3a', '#b08a52', '#d0aa6a', '#e8c890'], ry=6)
    c.rect(6, 7, 11, 2, '#b08a52'); c.line(6, 7, 16, 7, '#8a6a3a')
    for i, (x, y) in enumerate([(8, 5), (10, 4), (12, 4), (14, 5), (9, 6), (11, 5), (13, 6)]): c.put(x, y, '#5a3a22'); c.put(x + 1, y, '#7a5232')
    c.line(5, 12, 17, 12, '#8a6a3a')
ico('wild_rice', wr_icon)
def cb_icon(c):
    c.disc(13, 6, 3.5, DLEAF, ry=2); c.line(11, 7, 9, 10, '#356e34')
    for x, y in [(7, 12), (13, 11), (10, 16), (16, 15), (5, 17)]: c.disc(x, y, 3.2, BERRY)
ico('cranberry', cb_icon)
ROOT = ['#a08a68', '#cdb894', '#e8d8b8', '#fbf0d8']
def lr_icon(c):
    c.disc(9, 5.5, 5, ROOT, ry=3, ang=.6); c.disc(14.5, 10, 5, ROOT, ry=3, ang=.6)
    for x, y in [(11.5, 8), (12.5, 7.5)]: c.put(x, y, '#8a7050')
    c.disc(5.5, 15.5, 5, ['#8a7050', '#c8b48e', '#e8dcc0', '#fffaf0'])
    for x, y in [(5, 15), (3, 14), (7, 14), (4, 17), (6, 17), (5, 12), (2, 16), (8, 16)]: c.put(x, y, '#8a7050')
ico('lotus_root', lr_icon)
def peat(c):
    c.rect(3, 7, 16, 11, '#4a3020'); c.rect(3, 7, 16, 2, '#6a4a30'); c.rect(17, 7, 2, 11, '#36221a')
    for x, y in [(6, 11), (10, 13), (14, 10), (8, 15), (13, 15), (5, 14)]: c.put(x, y, '#7a5a3a'); c.put(x + 1, y, '#5a3a26')
    for x in (5, 9, 12, 16): c.line(x, 5, x + 1, 7, '#8a9a4a')
ico('bog_peat', peat)
def salad(c):
    c.disc(11, 13, 9, CER, ry=5.2); c.disc(11, 11, 7.5, ['#3e7a32', '#5ea43c'], ry=2.6)
    for x, y in [(7, 9), (11, 8), (15, 9), (9, 10), (13, 10)]: c.disc(x, y, 2.2, LEAF)
    for x, y in [(10, 7), (14, 8)]: c.disc(x, y, 1.2, ['#a01828', '#d83040', '#ff7a80'])
ico('watercress_salad', salad)
def pilaf(c):
    plate(c)
    c.disc(11, 11, 6.5, ['#6a4a2a', '#8a6038', '#a87c4a', '#c89a62'], ry=4)
    for x, y in [(8, 10), (12, 9), (14, 12), (10, 12), (7, 12), (13, 8)]: c.put(x, y, '#3a2416')
    for x, y in [(10, 8), (14, 10), (8, 12)]: c.put(x, y, '#7cc44e')
ico('wildrice_pilaf', pilaf)
def tart(c):
    plate(c, 16)
    c.disc(11, 12, 8, ['#a8682a', '#d89a52', '#f0c070', '#ffe0a0'], ry=4.6)
    c.disc(11, 11.5, 6, BERRY, ry=3.2)
    for x, y in [(8, 11), (12, 10), (14, 12), (10, 13)]: c.put(x, y, '#ffb0b8')
ico('cranberry_tart', tart)
def stirfry(c):
    c.line(1, 14, 5, 13, '#5a3a22'); c.line(1, 15, 5, 14, '#5a3a22')
    c.disc(13, 13, 8, ['#26262a', '#3a3a40', '#55555c', '#70707a'], ry=5)
    c.disc(13, 12, 6.2, ['#5a3a1a', '#7a5228'], ry=3.2)
    for x, y in [(10, 11), (15, 10), (13, 13)]: c.disc(x, y, 1.9, ROOT); c.put(x, y, '#8a7050')
    for x, y in [(12, 10), (16, 12), (9, 13)]: c.disc(x, y, 1.2, LEAF)
ico('lotus_stirfry', stirfry)
def feast(c):
    c.disc(11, 14, 10.4, ['#8a6038', '#b08a52', '#d0aa6a', '#e8c890'], ry=6)
    c.disc(11, 13.5, 8.6, CER, ry=4.6)
    c.disc(7, 12, 3.2, ['#6a4a2a', '#8a6038', '#a87c4a'], ry=2.2)
    c.disc(14, 11, 3, ROOT, ry=2.2); c.put(14, 11, '#8a7050')
    for x, y in [(10, 14), (12, 15)]: c.disc(x, y, 1.5, BERRY)
    for x, y in [(16, 14), (6, 15), (9, 10)]: c.disc(x, y, 1.6, LEAF)
ico('bog_feast', feast)
# ---------------- export
def enc(im): a = np.asarray(im.convert('RGBA')); return [im.width, im.height, base64.b64encode(a.tobytes()).decode()]
data = {'crops': {k: enc(v) for k, v in OUT_SPR.items()}, 'icons': {k: enc(v) for k, v in ICON.items()}}
json.dump(data, open('../src/wetland.json', 'w'))
# preview
pv = Image.new('RGBA', (16 * 24 + 8, 2 * 26 + 30), (200, 220, 180, 255))
for i, (k, im) in enumerate(OUT_SPR.items()): pv.paste(im, ((i % 16) * 24 + 2, 26 - im.height), im)
for i, (k, im) in enumerate(ICON.items()): pv.paste(im, (i * 26 + 2, 30), im)
pv.resize((pv.width * 4, pv.height * 4), Image.NEAREST).save('preview_wetland.png')
print('ok', len(OUT_SPR), len(ICON))
