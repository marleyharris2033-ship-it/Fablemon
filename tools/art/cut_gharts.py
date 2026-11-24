"""Gloamhollow's own art (the user's four sheets, 24 Nov 2026, art_incoming/gharts/sheetA-D.png, on magenta):
A: siphons, the Taproot drill, beams, cart, Brask's tools, the gold collar, the bore, drill heads (and Rootweave tiles, kept for the finale)
B: Glimmerdeep (mirrors, beam lamp, great crystal, black crystal door, wall crystals, fungi), Noon Bloom, Noonbell crop, marsh plants, ground tiles
C: the five great lanterns (unlit/lit), street lamp, church bells, crypt, maintenance door, tunnel mouth
D: lamp tower, church, inn, shop, mill, 8 homes, two market stalls, the well
Pieces are picked out by the box they sit in (every blob whose middle is in the box), keyed, sized to their width in the
world (px, 16 to a tile) and packed at 3x into src/hd_world/gh.webp + gh.json. The ground tiles are made seamless and
saved as src/ground/ghg_*.webp (512px), like the other painted grounds.
Run from the repo root:  python3 tools/art/cut_gharts.py"""
import json, os
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

A = 'art_incoming/gharts/'; OUT = 'src/hd_world/'
# name: (sheet, (x0, y0, x1, y1), width in the world)
B = 0.36   # buildings share one scale so they sit together
P = {
    # A
    'gh_siphon': ('A', (40, 0, 320, 292), 36), 'gh_siphon_off': ('A', (328, 0, 610, 292), 36),
    'gh_drill': ('A', (636, 0, 1086, 294), 120), 'gh_drill_off': ('A', (1086, 0, 1534, 294), 120),
    'gh_beams': ('A', (36, 296, 345, 478), 42), 'gh_cart': ('A', (400, 284, 672, 498), 36),
    'gh_pick': ('A', (680, 288, 880, 482), 20), 'gh_lamp': ('A', (905, 288, 1030, 480), 12), 'gh_gauge': ('A', (1078, 296, 1222, 478), 14),
    'gh_collar': ('A', (1250, 306, 1508, 472), 26), 'gh_bore': ('A', (70, 470, 460, 752), 96), 'gh_shaftwall': ('A', (526, 480, 820, 750), 48),
    'gh_drillhead': ('A', (930, 462, 1132, 750), 56), 'gh_drillhead_off': ('A', (1218, 462, 1434, 750), 58),
    # B
    'gh_mirror_l': ('B', (30, 0, 228, 206), 30), 'gh_mirror_r': ('B', (265, 0, 462, 206), 30), 'gh_beamlamp': ('B', (496, 0, 690, 206), 30),
    'gh_crystal': ('B', (905, 0, 1170, 212), 44), 'gh_crystal_lit': ('B', (1232, 0, 1495, 214), 44),
    'gh_door': ('B', (12, 200, 382, 428), 72), 'gh_door_open': ('B', (380, 200, 750, 428), 72),
    'gh_xtal_b1': ('B', (766, 208, 938, 410), 26), 'gh_xtal_b2': ('B', (938, 248, 1040, 390), 16), 'gh_xtal_b3': ('B', (1040, 290, 1112, 392), 10),
    'gh_xtal_v1': ('B', (1118, 208, 1298, 402), 26), 'gh_xtal_v2': ('B', (1298, 250, 1414, 388), 16), 'gh_xtal_v3': ('B', (1414, 282, 1500, 388), 10),
    'gh_fungus1': ('B', (24, 418, 240, 588), 30), 'gh_fungus2': ('B', (240, 466, 374, 588), 18), 'gh_fungus3': ('B', (374, 494, 462, 586), 11),
    'gh_bloom': ('B', (474, 422, 652, 590), 18), 'gh_bloom_open': ('B', (668, 420, 832, 590), 20),
    'gh_nb1': ('B', (868, 496, 978, 586), 9), 'gh_nb2': ('B', (994, 464, 1150, 586), 13), 'gh_nb3': ('B', (1164, 428, 1312, 588), 14), 'gh_nb4': ('B', (1322, 400, 1516, 588), 16),
    'gh_reeds1': ('B', (16, 600, 132, 752), 14), 'gh_reeds2': ('B', (140, 590, 322, 752), 24), 'gh_reeds3': ('B', (324, 574, 570, 756), 34),
    'gh_lily1': ('B', (584, 618, 804, 744), 28), 'gh_lily2': ('B', (804, 586, 1106, 750), 40),
    'gh_moss1': ('B', (1118, 598, 1244, 746), 16), 'gh_moss2': ('B', (1258, 580, 1520, 760), 34),
    # C: the lanterns on their posts, unlit then lit
    'gh_lan_ember': ('C', (22, 196, 148, 486), 24), 'gh_lan_ember_lit': ('C', (150, 196, 285, 486), 24),
    'gh_lan_spark': ('C', (318, 196, 420, 486), 20), 'gh_lan_spark_lit': ('C', (436, 196, 540, 486), 20),
    'gh_lan_gourd': ('C', (588, 196, 700, 486), 22), 'gh_lan_gourd_lit': ('C', (716, 196, 830, 486), 22),
    'gh_lan_mirror': ('C', (886, 196, 1004, 486), 22), 'gh_lan_mirror_lit': ('C', (1016, 196, 1128, 486), 22),
    'gh_lan_moth': ('C', (1218, 196, 1346, 486), 24), 'gh_lan_moth_lit': ('C', (1358, 196, 1488, 486), 24),
    'gh_streetlamp': ('C', (60, 486, 158, 716), 12), 'gh_streetlamp_lit': ('C', (200, 486, 300, 716), 12),
    'gh_bell_owl': ('C', (366, 488, 628, 712), 34), 'gh_bell_moon': ('C', (654, 488, 914, 712), 34),
    'gh_bell_key': ('C', (940, 488, 1202, 712), 34), 'gh_bell_lantern': ('C', (1228, 488, 1490, 712), 34),
    'gh_crypt': ('C', (18, 710, 326, 1012), 44), 'gh_crypt_open': ('C', (328, 710, 692, 1012), 52),
    'gh_mdoor': ('C', (706, 710, 1070, 1012), 44), 'gh_tunnel': ('C', (1096, 710, 1502, 1012), 60),
    # D: buildings
    'gh_tower': ('D', (96, 0, 278, 314), 80), 'gh_church': ('D', (362, 0, 716, 314), round(354 * B)),
    'gh_inn': ('D', (718, 6, 1104, 314), round(381 * B)), 'gh_store': ('D', (1142, 2, 1404, 312), round(256 * B)),
    'gh_mill': ('D', (12, 316, 374, 570), round(350 * B)),
    'gh_h1': ('D', (416, 318, 714, 560), round(286 * B)), 'gh_h2': ('D', (788, 312, 1030, 566), round(230 * B)), 'gh_h3': ('D', (1128, 318, 1398, 560), round(258 * B)),
    'gh_h4': ('D', (50, 562, 328, 812), round(268 * B)), 'gh_h5': ('D', (455, 552, 620, 812), round(153 * B)), 'gh_h6': ('D', (770, 566, 992, 812), round(210 * B)),
    'gh_h7': ('D', (1100, 572, 1424, 810), round(312 * B)), 'gh_h8': ('D', (90, 808, 314, 1080), round(211 * B)),
    'gh_stall_lamps': ('D', (396, 828, 680, 1076), 60), 'gh_stall_crops': ('D', (742, 828, 1046, 1078), 62), 'gh_well': ('D', (1136, 812, 1374, 1080), 36),
}
TILES = {   # sheet B's bottom row: (x0, x1) of each square, cut well inside its drawn border
    'ghg_rail': (12, 222), 'ghg_planks': (238, 439), 'ghg_rock': (454, 655), 'ghg_crystal': (668, 868), 'ghg_board': (882, 1083), 'ghg_cobble': (1098, 1299), 'ghg_moss': (1314, 1523),
}

SH = {}
def sheet(n):
    if n in SH: return SH[n]
    a = np.asarray(Image.open(A + f'sheet{n}.png').convert('RGB')).astype(float); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mag = (r - g) + (b - g) - abs(r - b)
    al = np.clip((300 - mag) / 140, 0, 1)
    lb, _ = ndi.label(ndi.binary_dilation(al > .5, iterations=1)); k = lb.max()
    cent = dict(zip(range(1, k + 1), ndi.center_of_mass(np.ones_like(lb), lb, range(1, k + 1))))
    size = dict(zip(range(1, k + 1), ndi.sum(np.ones_like(lb), lb, range(1, k + 1))))
    SH[n] = (a, al, lb, cent, size); return SH[n]

def cut(n, box):
    a, ALPHA, LB, CENT, SIZE = sheet(n); x0, y0, x1, y1 = box
    ids = [i for i, (cy, cx) in CENT.items() if x0 <= cx < x1 and y0 <= cy < y1 and SIZE[i] > 25]
    keep = np.isin(LB, ids); keep[:y0] = 0; keep[y1:] = 0; keep[:, :x0] = 0; keep[:, x1:] = 0
    al = ALPHA * ndi.binary_dilation(keep, iterations=1)
    c = a.copy(); sp = np.clip(np.minimum(c[..., 0], c[..., 2]) - c[..., 1], 0, None) * (1 - al); c[..., 0] -= sp; c[..., 2] -= sp
    rgba = np.dstack([np.clip(c, 0, 255), al * 255]).astype(np.uint8)
    ys, xs = np.nonzero(al > .05); return rgba[ys.min():ys.max() + 1, xs.min():xs.max() + 1]

def seamless(im, size=512):
    """cross-fade the tile with itself shifted by half, so its edges meet"""
    a = np.asarray(im.resize((size, size), Image.LANCZOS).convert('RGB')).astype(float)
    b = np.roll(np.roll(a, size // 2, 0), size // 2, 1)
    t = np.abs(np.linspace(-1, 1, size)); w = np.clip((np.maximum.outer(t, t) - .55) / .4, 0, 1)[..., None]   # 0 inside, 1 near the edges
    return Image.fromarray((a * (1 - w) + b * w).astype(np.uint8))

def main():
    pics = {}
    for k, (n, box, ww) in P.items():
        im = cut(n, box); W = ww * 3; H = round(im.shape[0] * W / im.shape[1])
        pics[k] = np.asarray(Image.fromarray(im).resize((W, H), Image.LANCZOS))
    items = sorted(pics.items(), key=lambda t: -t[1].shape[0]); AW = 2048; x = y = rowh = 0; fr = {}
    for k, im in items:
        h, w = im.shape[:2]
        if x + w > AW: x = 0; y += rowh + 2; rowh = 0
        fr[k] = dict(x=x, y=y, w=w, h=h); x += w + 2; rowh = max(rowh, h)
    atlas = np.zeros((y + rowh, AW, 4), np.uint8)
    for k, im in pics.items(): f = fr[k]; atlas[f['y']:f['y'] + f['h'], f['x']:f['x'] + f['w']] = im
    Image.fromarray(atlas).save(OUT + 'gh.webp', 'WEBP', quality=88, alpha_quality=100, method=6)
    json.dump({'frames': {k: {'frame': f} for k, f in fr.items()}}, open(OUT + 'gh.json', 'w'))
    print('gh', atlas.shape, os.path.getsize(OUT + 'gh.webp') // 1024, 'KB')
    cs = Image.new('RGBA', (AW, atlas.shape[0]), (110, 150, 100, 255)); cs.alpha_composite(Image.fromarray(atlas)); cs.save('/tmp/gh_check.png')
    src = Image.open(A + 'sheetB.png').convert('RGB')
    for k, (x0, x1) in TILES.items():
        t = seamless(src.crop((x0 + 14, 782, x1 - 14, 990)))
        t.save(f'src/ground/{k}.webp', 'WEBP', quality=90)
    print('tiles', list(TILES))

if __name__ == '__main__':
    main()
