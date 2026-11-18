"""Elderwood Town Hall (18 Nov 2026): a neoclassical sandstone hall after Paisley Town Hall, painted in code because no art
exists for it yet. Drawn at 6x, downsampled to 3x (the game's HD scale) -> src/hd_world/ewhall.webp (shown at 1/3 = 336x210).
Run from the repo root:  python3 tools/art/make_townhall.py
"""
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
S = 6                       # drawing scale (px per world px)
W, H = 336, 210             # world px
img = Image.new('RGBA', (W * S, H * S), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
def R(x0, y0, x1, y1, c, o=None, w=1.6): d.rectangle([x0 * S, y0 * S, x1 * S - 1, y1 * S - 1], fill=c, outline=o, width=int(w * S) if o else 0)
def P(pts, c, o=None, w=1.6): d.polygon([(x * S, y * S) for x, y in pts], fill=c, outline=o, width=int(w * S) if o else 0)
def E(x0, y0, x1, y1, c, o=None): d.ellipse([x0 * S, y0 * S, x1 * S, y1 * S], fill=c, outline=o, width=int(1.5 * S) if o else 0)
OUT = (74, 50, 30, 255); STONE = (222, 188, 140, 255); LIGHT = (240, 214, 170, 255); MID = (196, 158, 108, 255); SH = (160, 120, 78, 255); DARK = (112, 80, 52, 255)
GLASS = (58, 78, 96, 255); GLASS2 = (96, 132, 156, 255); ROOF = (98, 104, 112, 255); ROOF2 = (128, 134, 142, 255); DOOR = (86, 52, 30, 255); GOLD = (222, 176, 70, 255)
def window(x, y, w, h, arch=False, hood=False):
    if hood: P([(x - 2, y - 1), (x + w / 2, y - 5), (x + w + 2, y - 1)], LIGHT, OUT); R(x - 2, y - 1, x + w + 2, y + 1, MID, OUT)
    R(x - 1, y, x + w + 1, y + h + 1, SH)
    if arch: E(x, y - w / 2, x + w, y + w / 2, GLASS, OUT)
    R(x, y, x + w, y + h, GLASS, OUT)
    R(x + 1, y + 1, x + w / 2 - .5, y + h / 2, GLASS2); R(x + w / 2 - .5, y, x + w / 2 + .5, y + h, OUT)
    R(x, y + h / 2 - .5, x + w, y + h / 2 + .5, OUT); R(x - 2, y + h, x + w + 2, y + h + 2, LIGHT, OUT)
def column(x, top, bot, w=8):
    R(x - 1, bot - 3, x + w + 1, bot, MID, OUT)                       # base
    for k in range(int(w * S)):                                         # a shaded cylinder
        t = k / (w * S); c = tuple(int(a * (0.72 + 0.5 * np.sin(np.pi * t) ** .6)) for a in STONE[:3]) + (255,)
        d.line([(x * S + k, top * S), (x * S + k, (bot - 3) * S)], fill=c)
    for f in (2.2, 4, 5.8): d.line([((x + f) * S, (top + 2) * S), ((x + f) * S, (bot - 4) * S)], fill=SH, width=2)   # fluting
    d.rectangle([x * S, top * S, (x + w) * S - 1, (bot - 3) * S - 1], outline=OUT, width=S)
    R(x - 2, top - 4, x + w + 2, top, LIGHT, OUT); P([(x - 1, top - 4), (x + w / 2, top - 1), (x + w + 1, top - 4)], GOLD)   # capital
def balustrade(x0, x1, y):
    R(x0, y, x1, y + 2, LIGHT, OUT); R(x0, y + 8, x1, y + 10, MID, OUT)
    xx = x0 + 2
    while xx < x1 - 2: E(xx, y + 2, xx + 3, y + 8, STONE, OUT); xx += 4.5
def urn(x, y): E(x - 3, y - 6, x + 3, y, LIGHT, OUT); R(x - 1.5, y, x + 1.5, y + 3, MID, OUT); E(x - 1.2, y - 9, x + 1.2, y - 6, GOLD, OUT)

GY = 196                                                    # ground line
# --- slate roofs behind the parapets
for (x0, x1) in [(14, 112), (224, 322)]:
    P([(x0 + 2, 88), (x0 + 12, 66), (x1 - 12, 66), (x1 - 2, 88)], ROOF, OUT)
    for k in range(int(x0) + 16, int(x1) - 12, 7): d.line([(k * S, 68 * S), ((k - 4) * S, 87 * S)], fill=ROOF2, width=S)
P([(112, 62), (124, 44), (212, 44), (224, 62)], ROOF, OUT)
# --- the wings: two storeys each side, with corner pavilions
for (x0, x1) in [(14, 112), (224, 322)]:
    R(x0, 96, x1, GY, STONE, OUT)
    R(x0, 96, x1, 101, LIGHT, OUT); R(x0, 140, x1, 144, LIGHT, OUT); R(x0, GY - 8, x1, GY, MID, OUT)   # cornice, string course, plinth
    for k in range(int(x0) + 4, int(x1) - 2, 9): d.line([(k * S, 146 * S), (k * S, (GY - 9) * S)], fill=MID, width=S // 2)       # rusticated ground floor
    for yy in range(150, GY - 8, 8): d.line([(x0 * S, yy * S), (x1 * S, yy * S)], fill=MID, width=S // 2)
    n = 5; step = (x1 - x0 - 20) / (n - 1)
    for i in range(n):
        wx = x0 + 6 + i * step; window(wx, 110, 8, 22, arch=True, hood=True); window(wx, 154, 8, 24)
    balustrade(x0 - 1, x1 + 1, 86)
for px in [8, 300]:                                          # corner pavilions, a step taller
    R(px, 90, px + 28, GY, LIGHT, OUT); R(px, 90, px + 28, 96, STONE, OUT); R(px + 2, 96, px + 4, GY - 8, MID); R(px + 24, 96, px + 26, GY - 8, MID)
    window(px + 9, 108, 10, 26, arch=True, hood=True); window(px + 9, 152, 10, 26)
    R(px - 1, 78, px + 29, 90, MID, OUT); R(px + 4, 64, px + 24, 78, STONE, OUT)   # attic and drum
    COP = (98, 150, 132, 255); E(px + 3, 50, px + 25, 78, COP, OUT); E(px + 6, 54, px + 13, 64, (140, 190, 168, 255))   # copper domes, gone green
    for rx in (px + 9, px + 14, px + 19): d.line([(rx * S, 52 * S), (rx * S, 76 * S)], fill=(70, 112, 98, 255), width=S)
    R(px + 13, 44, px + 15, 54, OUT); E(px + 11, 40, px + 17, 46, GOLD, OUT)
    urn(px + 3, 78); urn(px + 25, 78)
for ux in [30, 52, 74, 96, 240, 262, 284, 306]: urn(ux, 86)
# --- the centre block behind the portico
R(112, 60, 224, GY, STONE, OUT)
for i, wx in enumerate([124, 148, 172, 196]):
    window(wx + 2, 112, 10, 24, arch=True); 
R(112, 60, 224, 66, LIGHT, OUT)
# --- the portico: six columns, entablature, pediment
R(104, 70, 232, 80, LIGHT, OUT); R(104, 80, 232, 86, MID, OUT)                          # entablature
for k in range(106, 232, 6): R(k, 80, k + 3, 83, SH)                                       # dentils
P([(100, 70), (168, 26), (236, 70)], LIGHT, OUT); P([(112, 66), (168, 34), (224, 66)], STONE)          # pediment
P([(118, 64), (168, 38), (218, 64)], MID)
E(156, 44, 180, 62, LIGHT, OUT); E(160, 48, 176, 58, GOLD, OUT)                            # the Elderwood seal (a leaf)
P([(168, 49), (172, 53), (168, 57), (164, 53)], (90, 130, 60, 255))
# clock cupola above the pediment
R(158, 8, 178, 30, STONE, OUT); E(161, 12, 175, 26, (245, 238, 220, 255), OUT); d.line([(168 * S, 19 * S), (168 * S, 14 * S)], fill=OUT, width=S); d.line([(168 * S, 19 * S), (172 * S, 19 * S)], fill=OUT, width=S)
P([(154, 8), (168, -2), (182, 8)], ROOF2, OUT); E(166, -6, 170, -1, GOLD, OUT)
# behind the columns: shadowed loggia, big doors
R(112, 86, 224, GY - 10, (176, 136, 92, 255)); R(112, 86, 224, 92, SH)
for dx in [128, 160, 192]: R(dx, 140, dx + 16, GY - 10, DOOR, OUT); R(dx + 7.5, 140, dx + 8.5, GY - 10, OUT); E(dx, 132, dx + 16, 148, DOOR, OUT); R(dx + 2, 142, dx + 14, GY - 10, (110, 68, 40, 255))
for wx in [130, 162, 194]: window(wx, 100, 12, 18)
for i in range(6): column(110 + i * 22.4, 86, GY - 10)
# steps across the front
for k in range(5): R(100 - k * 4, GY - 10 + k * 2.2, 236 + k * 4, GY - 7.8 + k * 2.2, LIGHT if k % 2 == 0 else STONE, OUT)
# lamps and the statue
for lx in [92, 244]: R(lx, 168, lx + 3, GY, OUT); E(lx - 3, 160, lx + 6, 170, (255, 214, 120, 255), OUT)
R(162, GY - 2, 174, GY + 10, MID, OUT); R(164, GY - 6, 172, GY - 2, LIGHT, OUT)
E(165, 166, 171, 173, (70, 92, 84, 255), OUT); R(164, 172, 172, GY - 6, (70, 92, 84, 255), OUT)          # a bronze figure
# ivy and a little greenery at the corners
rng = np.random.default_rng(3)
for (cx, cy) in [(14, GY - 4), (322, GY - 4), (112, GY - 4), (224, GY - 4)]:
    for _ in range(26): r = rng.uniform(1.5, 3.5); x = cx + rng.normal(0, 4); y = cy - abs(rng.normal(0, 10)); E(x - r, y - r, x + r, y + r, (78 + rng.integers(0, 40), 120 + rng.integers(0, 40), 58, 255))
# stone texture: a little noise over the sandstone
a = np.asarray(img).astype(np.float32); m = a[:, :, 3] > 0
n = rng.normal(0, 1, a.shape[:2]); n = np.asarray(Image.fromarray(((n * 20 + 128).clip(0, 255)).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32) - 128
for c in range(3): a[:, :, c] = np.where(m, (a[:, :, c] + n * .35).clip(0, 255), a[:, :, c])
img = Image.fromarray(a.astype(np.uint8))
# light from above: walls darken towards the ground
yy = np.linspace(0, 1, a.shape[0])[:, None]; shade = 1.06 - .16 * np.clip((yy * H - 90) / 110, 0, 1)
for c in range(3): a[:, :, c] = np.where(m, (a[:, :, c] * shade).clip(0, 255), a[:, :, c])
img = Image.fromarray(a.astype(np.uint8))
# soft shadow at the foot
sh = Image.new('RGBA', img.size, (0, 0, 0, 0)); ImageDraw.Draw(sh).ellipse([0, (GY - 6) * S, W * S, (GY + 12) * S], fill=(20, 14, 6, 90))
img = Image.alpha_composite(sh.filter(ImageFilter.GaussianBlur(6 * S)), img)
out = img.resize((W * 3, H * 3), Image.LANCZOS)
out.save('src/hd_world/ewhall.webp', 'WEBP', quality=92, method=6)
out.resize((W * 2, H * 2), Image.LANCZOS).save('/tmp/ewhall_preview.png'); print('ok', out.size)
