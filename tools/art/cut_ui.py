"""Cosy carved-wood UI kit (27 Nov 2026), from art_incoming/ui/:
kit_menus.png, kit_controls.png -> src/ui/<piece>.webp (each piece keyed, despilled, trimmed)
icons1.png (8x6 grid)            -> src/ui/icons.webp (8x6 cells of 96px) + names in ICONS below"""
import os, numpy as np
from PIL import Image
from scipy import ndimage as nd
ROOT = os.path.join(os.path.dirname(__file__), '..', '..'); IN = os.path.join(ROOT, 'art_incoming', 'ui'); OUT = os.path.join(ROOT, 'src', 'ui')
M = np.array([255., 0., 255.])

def key(path):
    """magenta background -> alpha. Only pixels joined to the sheet edge through magenta-ish pixels are keyed,
    so pinks and purples inside a piece stay solid. Edge pixels are un-blended from the magenta (despill)."""
    p = np.asarray(Image.open(path).convert('RGB')).astype(float)
    score = np.minimum(p[..., 0], p[..., 2]) - p[..., 1]          # 255 on pure magenta, ~0 on wood/cream
    lab, n = nd.label(score > 25)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    mx = nd.maximum(score, lab, index=np.arange(1, n + 1))          # enclosed holes (rings, the gear) are pure magenta too
    holes = {i + 1 for i, v in enumerate(mx) if v > 225}
    bg = np.isin(lab, list(edge | holes))
    a = np.where(bg, 1 - np.clip((score - 110) / (232 - 110), 0, 1), 1.0)
    a[a < 0.04] = 0
    f = np.where(a[..., None] > 0, (p - (1 - a[..., None]) * M) / np.maximum(a[..., None], 1e-3), 0)
    rgba = np.dstack([np.clip(f, 0, 255), a * 255]).astype(np.uint8)
    return Image.fromarray(rgba, 'RGBA')

def cut(sheet, box, name, scale=1.0):
    x, y, w, h = box; im = sheet.crop((x - 4, y - 4, x + w + 4, y + h + 4)); im = im.crop(im.getbbox())
    if scale != 1: im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    im.save(os.path.join(OUT, name + '.webp'), quality=86, method=6); return im.size

MENUS = {  # name: (x, y, w, h) on kit_menus.png
 'frame': (18, 30, 323, 318), 'plaque': (356, 21, 442, 131), 'tray': (822, 21, 428, 155), 'ring': (1236, 72, 285, 268),
 'dialog': (355, 162, 524, 188), 'tip': (898, 192, 310, 159), 'tab_on': (40, 405, 225, 97), 'tab_off': (270, 405, 226, 98),
 'slot': (534, 367, 166, 168), 'slot_sel': (719, 365, 175, 171), 'slot_rare': (912, 366, 173, 170), 'slot_epic': (1105, 366, 174, 170), 'slot_lock': (1299, 366, 171, 170),
 'btn_g': (29, 560, 252, 88), 'btn_g_dn': (284, 560, 249, 87), 'btn_b': (536, 560, 241, 87), 'btn_r': (778, 560, 244, 87),
 'rb': (1042, 557, 91, 91), 'rb_x': (1135, 557, 91, 91), 'rb_l': (1228, 557, 92, 91), 'rb_r': (1322, 557, 92, 91), 'rb_plus': (1416, 557, 92, 91),
 'pill': (42, 668, 441, 78), 'bar': (520, 668, 830, 75), 'scroll': (1392, 669, 50, 314), 'scroll_h': (1448, 746, 47, 142),
 'fill_g': (41, 765, 319, 37), 'fill_b': (374, 765, 321, 37), 'fill_r': (710, 765, 319, 37), 'fill_y': (1041, 765, 320, 37),
 'divider': (88, 813, 1235, 75), 'tog_off': (45, 908, 171, 90), 'tog_on': (249, 908, 169, 90), 'chk': (465, 907, 94, 94), 'chk_on': (595, 907, 94, 94),
 'badge': (1248, 907, 87, 87)}
CTRL = {
 'joy': (54, 9, 263, 267), 'knob': (346, 59, 157, 159), 'knob_dn': (523, 60, 154, 157),
 'd_u': (729, 17, 129, 99), 'd_d': (887, 28, 129, 99), 'd_l': (1044, 15, 105, 117), 'd_r': (1199, 15, 105, 117),
 'd_u_dn': (729, 140, 129, 101), 'd_d_dn': (887, 148, 130, 103), 'd_l_dn': (1044, 139, 106, 118), 'd_r_dn': (1199, 139, 105, 118), 'd_c': (1353, 78, 127, 129),
 'act': (45, 277, 157, 157), 'act_dn': (207, 279, 155, 154), 'act_rdy': (363, 277, 158, 157),
 'rb_brown': (549, 302, 105, 111), 'rb_brown_dn': (657, 302, 107, 111), 'rb_blue': (784, 301, 106, 112), 'rb_blue_dn': (893, 301, 107, 112),
 'rb_red': (1019, 302, 105, 111), 'rb_red_dn': (1127, 302, 106, 111), 'sq': (1255, 301, 112, 114), 'sq_dn': (1377, 301, 114, 114),
 'hotbar': (6, 439, 952, 140), 'hslot': (964, 449, 119, 120), 'hslot_sel': (1089, 449, 122, 120),
 'clock': (16, 579, 414, 156), 'energy': (853, 581, 63, 154), 'energy_fill': (926, 587, 31, 141), 'card': (989, 581, 218, 144),
 'gold': (454, 610, 365, 102), 'toast': (1224, 609, 298, 90),
 'mv_g': (39, 737, 305, 70), 'mv_g_dn': (39, 810, 305, 70), 'mv_b': (357, 737, 303, 70), 'mv_b_dn': (357, 810, 303, 70),
 'mv_r': (673, 737, 307, 70), 'mv_r_dn': (673, 810, 307, 70), 'mv_y': (993, 737, 306, 70), 'mv_y_dn': (993, 810, 306, 70),
 'hp': (23, 895, 542, 56), 'hp_g': (595, 895, 335, 33), 'hp_y': (595, 933, 335, 33), 'hp_r': (596, 972, 333, 34),
 'ring_m': (957, 887, 131, 131), 'ring_fill': (1113, 886, 72, 112), 'bubble': (1223, 897, 281, 116)}
ICONS = ['coin', 'energy', 'heart', 'star', 'sparkle', 'trophy', 'medal', 'gift',
         'bag', 'paw', 'hammer', 'scroll', 'mail', 'map', 'compass', 'book',
         'gear', 'home', 'link', 'trade', 'flag', 'swords', 'lock', 'yesno',
         'talk', 'hand', 'hoe', 'can', 'axe', 'pick', 'sprout', 'sickle',
         't_leaf', 't_ember', 't_tide', 't_stone', 't_gale', 't_spark', 't_frost', 't_shade',
         't_glow', 't_wild', 'rod', 'saddle', 'boot', 'spring', 'summer', 'autumn']

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for f, table in (('kit_menus.png', MENUS), ('kit_controls.png', CTRL)):
        s = key(os.path.join(IN, f))
        for k, b in table.items(): cut(s, b, k)
    s = key(os.path.join(IN, 'icons1.png')); W, H = s.size; C = 96
    atlas = Image.new('RGBA', (C * 8, C * 6), (0, 0, 0, 0))
    for i, n in enumerate(ICONS):
        r, c = divmod(i, 8); cell = s.crop((c * W // 8, r * H // 6, (c + 1) * W // 8, (r + 1) * H // 6))
        cell = cell.crop(cell.getbbox()); k = (C - 4) / max(cell.size)
        cell = cell.resize((round(cell.width * k), round(cell.height * k)), Image.LANCZOS)
        atlas.paste(cell, (c * C + (C - cell.width) // 2, r * C + (C - cell.height) // 2), cell)
    atlas.save(os.path.join(OUT, 'icons.webp'), quality=90, method=6)
    print('done', sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT)) // 1024, 'KB')
