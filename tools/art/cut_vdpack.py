"""Cut the user's Verdance pack (art_incoming/vdpack, sent 16 Nov 2026) into the game.

Characters (4x4 walk sheets, columns step/stand/step/stand -> the game's stand/step/stand/step):
  src/tr_<kind>.png (1x, 4x4 of 28x32) + src/hd_world/tr_<kind>.webp (3x) + src/hd/port_<kind>_<0|1>.webp (240px)
  vtech <- tech_a, vtech2 <- tech_b, gleam, brask, ash, thorne, pell, dunmore.
  vale: no art yet, so a stand-in "figure in shadow" (tech_b darkened to a silhouette with green eyes).
Props and icons -> src/hd_world/vq.webp + vq.json (3x atlas): vq_wheel_<heron|eel|otter>, vq_pool, vq_valves,
  vq_ladder, vq_page, and i_<card|notebook|key|petition|revocation|jar> (72px).
Cutscene backgrounds -> src/hd/cs_office.webp, src/hd/cs_spire.webp (720x1080).
Run from the repo root:  python3 tools/art/cut_vdpack.py
"""
import json, sys
import numpy as np
from PIL import Image, ImageFilter
sys.path.insert(0, 'tools/art')
import cut_thirds as C
import cut_hd as H

A = 'art_incoming/vdpack/'
K = 3
CHARS = {'vtech': 'tech_a', 'vtech2': 'tech_b', 'gleam': 'gleam', 'brask': 'brask', 'ash': 'ash', 'thorne': 'thorne', 'pell': 'pell', 'dunmore': 'dunmore'}
ORDER = [1, 0, 3, 2]   # their sheets start on a step; the game's first frame in each row is the standing one


def walk(src, kind, FW=28, FH=32):
    a, m = C.load(src); cells = C.grid(a, m, 4, 4)
    k = min((FH - 1) / max(o['mask'].shape[0] for r in cells for o in r), (FW - 2) / max(o['mask'].shape[1] for r in cells for o in r))
    small = Image.new('RGBA', (FW * 4, FH * 4)); big = Image.new('RGBA', (FW * K * 4, FH * K * 4))
    for r in range(4):
        for c, cc in enumerate(ORDER):
            o = cells[r][cc]
            im = C.shrink(o, k); small.paste(im, (c * FW + (FW - im.width) // 2, r * FH + FH - im.height), im)
            im = H.soft(o, k * K); big.paste(im, (c * FW * K + (FW * K - im.width) // 2, r * FH * K + FH * K - im.height), im)
    small.save(f'src/tr_{kind}.png', optimize=True)
    big.save(f'src/hd_world/tr_{kind}.webp', 'WEBP', quality=90, method=6)
    return big


def portraits(src, who, silhouette=False):
    a, m = C.load(src); faces = C.grid(a, m, 1, 2)[0]
    k = 63 / max(max(o['mask'].shape) for o in faces)
    S = 80 * K; kk = k * S / 64
    out = []
    for j, o in enumerate(faces):
        im = H.soft(o, kk)
        if silhouette: im = shadow_figure(im, j)
        bg = Image.new('RGBA', (S, S), (0x2e, 0x33, 0x2c, 255) if silhouette else (0xcf, 0xe3, 0xb2, 255))
        bg.paste(im, ((S - im.width) // 2, S - im.height), im)
        bg.convert('RGB').save(f'src/hd/port_{who}_{j}.webp', 'WEBP', quality=85, method=6); out.append(bg)
    return out


def shadow_figure(im, j):
    """A figure in shadow: the outline only, with a faint green rim and two green eyes."""
    a = np.asarray(im).astype(np.float32); al = a[..., 3]
    out = np.zeros_like(a); out[..., :3] = (22, 26, 24); out[..., 3] = al
    sil = Image.fromarray(out.astype(np.uint8))
    rim = Image.fromarray(np.dstack([np.full(al.shape, 140), np.full(al.shape, 204), np.full(al.shape, 60), al]).astype(np.uint8)).filter(ImageFilter.GaussianBlur(3))
    base = Image.new('RGBA', im.size); base.alpha_composite(rim); base.alpha_composite(sil)
    # eyes: about 40% down the head, either side of the middle
    ys, xs = np.nonzero(al > 40); top = ys.min(); cx = int(xs[ys < top + 60].mean()) if (ys < top + 60).any() else im.width // 2
    ey = top + int(im.height * .27); from PIL import ImageDraw
    d = ImageDraw.Draw(base)
    for dx in (-14, 14):
        x = cx + dx; d.ellipse((x - 5, ey - 2, x + 5, ey + 2), fill=(170, 255, 90, 255) if j == 0 else (210, 255, 120, 255))
    return base.filter(ImageFilter.SMOOTH)


def vale_standin():
    """A woman in shadow: sharp bob, high collar, green rim light and eyes. Replaced when her art arrives."""
    from PIL import ImageDraw
    S = 80 * K
    for j in (0, 1):
        m = Image.new('L', (S, S)); d = ImageDraw.Draw(m)
        d.rounded_rectangle((30, 168, S - 30, S + 40), 40, fill=255)              # shoulders
        d.polygon([(96, 150), (144, 150), (150, 182), (90, 182)], fill=255)       # neck and collar
        d.ellipse((78, 44, 162, 150), fill=255)                                   # head
        d.ellipse((68, 30, 172, 128), fill=255); d.polygon([(68, 80), (172, 80), (180, 148), (154, 142), (148, 96), (92, 96), (86, 142), (60, 148)], fill=255)   # the bob, with a sharp line at the jaw
        rim = Image.new('RGBA', (S, S), (140, 204, 60, 0)); rim.putalpha(m.filter(ImageFilter.GaussianBlur(4)))
        body = Image.new('RGBA', (S, S), (20, 24, 22, 255)); body.putalpha(m)
        bg = Image.new('RGBA', (S, S), (0x2e, 0x33, 0x2c, 255)); bg.alpha_composite(rim); bg.alpha_composite(body)
        dd = ImageDraw.Draw(bg); ey = 104 if j == 0 else 106
        for x in (104, 136):
            dd.polygon([(x - 8, ey), (x + 8, ey - 2 if x > 120 else ey + 2), (x, ey + 3)] if j else [(x - 7, ey), (x + 7, ey), (x, ey + 3)], fill=(170, 255, 90, 255))
        if j: dd.arc((104, 124, 136, 140), 20, 160, fill=(120, 200, 70, 255), width=2)   # the smile
        bg.convert('RGB').save(f'src/hd/port_vale_{j}.webp', 'WEBP', quality=85, method=6)


def prop(name, h):
    """A prop cut from its own picture, scaled to h game pixels tall at 3x."""
    a, m = C.load(A + name + '.png'); o = C.grid(a, m, 1, 1)[0][0]
    return H.soft(o, h * K / o['mask'].shape[0])


def icon(name):
    a, m = C.load(A + name + '.png'); o = C.grid(a, m, 1, 1)[0][0]
    im = H.soft(o, 66 / max(o['mask'].shape)); c = Image.new('RGBA', (72, 72)); c.paste(im, ((72 - im.width) // 2, (72 - im.height) // 2), im); return c


def atlas():
    ims = {'vq_wheel_heron': prop('prop_lock_wheel_heron', 22), 'vq_wheel_eel': prop('prop_lock_wheel_eel', 22), 'vq_wheel_otter': prop('prop_lock_wheel_otter', 22),
           'vq_pool': prop('prop_grey_pool', 20), 'vq_valves': prop('prop_valve_panel', 60), 'vq_ladder': prop('prop_boarding_ladder', 60), 'vq_page': prop('prop_notebook_page', 11)}
    for n, f in [('card', 'i_greenline_card'), ('notebook', 'i_notebook'), ('key', 'i_override_key'), ('petition', 'i_petition'), ('revocation', 'i_revocation'), ('jar', 'i_sample_jar')]: ims['i_' + n] = icon(f)
    W = 1024; x = y = rh = 0; frames = {}; sheet = Image.new('RGBA', (W, 1024))
    for n, im in sorted(ims.items(), key=lambda kv: -kv[1].height):
        if x + im.width > W: x = 0; y += rh + 2; rh = 0
        sheet.paste(im, (x, y), im); frames[n] = {'x': x, 'y': y, 'w': im.width, 'h': im.height}; x += im.width + 2; rh = max(rh, im.height)
    sheet = sheet.crop((0, 0, W, y + rh))
    sheet.save('src/hd_world/vq.webp', 'WEBP', quality=90, method=6); json.dump({'frames': {k: {'frame': v} for k, v in frames.items()}}, open('src/hd_world/vq.json', 'w'))
    return sheet


def backgrounds():
    for src, name in [('bg_spire_office', 'office'), ('bg_spire_exterior', 'spire')]:
        Image.open(A + src + '.png').convert('RGB').resize((720, 1080), Image.LANCZOS).save(f'src/hd/cs_{name}.webp', 'WEBP', quality=80, method=6)


if __name__ == '__main__':
    pv = []
    for kind, n in CHARS.items():
        pv.append(walk(A + f'vd_{n}_walk.png', kind)); portraits(A + f'vd_{n}_portraits.png', kind); print(kind)
    # Ms Vale has no art yet: a figure in shadow
    vale_standin()
    walk(A + 'vd_thorne_walk.png', 'vale')   # never shown walking yet; keeps the loader happy
    atlas(); backgrounds(); print('atlas, backgrounds')
    if '--preview' in sys.argv:
        out = Image.new('RGBA', (sum(p.width for p in pv[:4]), pv[0].height * 2), (120, 160, 110, 255)); x = 0
        for i, p in enumerate(pv): out.paste(p, ((i % 4) * p.width, (i // 4) * p.height), p)
        out.save(sys.argv[sys.argv.index('--preview') + 1])
