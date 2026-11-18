"""Creator test 2 (18 Nov 2026): art_incoming/creator/v2/base_walk.png + hair_1..4.png (each a 4x4 sheet, rows =
down/left/right/up, all four columns the same view). The hair is drawn about twice the head's size, so it's scaled to
fit the head width (measured per view), lined up on the head top, and on the side views on the back of the head."""
import numpy as np, sys, json
from PIL import Image
from scipy import ndimage as ndi
D = 'art_incoming/creator/v2/'
def rgba(p):
    a = np.asarray(Image.open(D + p).convert('RGB')).astype(int); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    m = ndi.binary_opening(~((r > 150) & (b > 150) & (g < 130)), iterations=1)
    return np.dstack([a, m * 255]).astype(np.uint8)
C = 1254 / 4
def cell(img, r, c):
    t = img[int(r * C):int((r + 1) * C), int(c * C):int((c + 1) * C)]; a = t[..., 3] > 0; ys, xs = np.nonzero(a)
    return t[ys.min():ys.max() + 1, xs.min():xs.max() + 1], (int(c * C) + xs.min(), int(r * C) + ys.min())
BASE = rgba('base_walk.png'); HAIRS = [rgba(f'hair_{i}.png') for i in range(1, 5)]
def head_metrics(fr):
    a = fr[..., 3] > 0; rgb = fr[..., :3].astype(int); mx = rgb.max(-1)
    ys = np.nonzero(a.any(1))[0]; top = ys[0]
    w = [np.ptp(np.nonzero(a[y])[0]) if a[y].any() else 0 for y in range(top, top + 70)]
    hw = max(w[:60]); xs = np.nonzero(a[top:top + 60].any(0))[0]
    return top, xs[0], xs[-1], hw
def debald(fr):
    fr = fr.copy(); top, x0, x1, _ = head_metrics(fr); rgb = fr[..., :3].astype(int); a = fr[..., 3] > 0; mx = rgb.max(-1)
    reg = np.zeros(a.shape, bool); reg[top:top + 26, x0:x1 + 1] = True
    skin = a & reg & (mx > 170) & (rgb[..., 0] > rgb[..., 2] + 40); hairpx = a & reg & (mx > 55) & ~skin
    if skin.any(): fr[hairpx, :3] = np.median(rgb[skin], 0).astype(np.uint8)
    return fr
K = dict(s=1.0, up=10, side=14)   # tuned below
def fit_scale(view):
    # hair width to head width, from standing frames
    fr, _ = cell(BASE, view, 1); _, x0, x1, hw = head_metrics(fr)
    return hw
def compose(view, col, style, scale_k=1.0, up=10, side=12):
    fr, _ = cell(BASE, view, col); hp, _ = cell(HAIRS[style], view, 1)
    top, x0, x1, hw = head_metrics(fr)
    front_hw = head_metrics(cell(BASE, 0, 1)[0])[3]; front_hairw = cell(HAIRS[style], 0, 1)[0].shape[1]
    s = scale_k * front_hw * 1.55 / front_hairw          # one scale per hairstyle, set by the front view
    im = Image.fromarray(hp).resize((max(1, round(hp.shape[1] * s)), max(1, round(hp.shape[0] * s))), Image.LANCZOS)
    W = fr.shape[1] + 200; H = fr.shape[0] + 120; ox, oy = 100, 100
    canvas = Image.new('RGBA', (W, H)); canvas.alpha_composite(Image.fromarray(debald(fr)), (ox, oy))
    if view == 1: x = ox + x1 + side - im.width       # facing left: hair's back edge just past the back of the head
    elif view == 2: x = ox + x0 - side
    else: x = ox + (x0 + x1) // 2 - im.width // 2
    y = oy + top - up
    canvas.alpha_composite(im, (int(x), int(y)))
    return canvas
if __name__ == '__main__':
    sk, up, side = (float(sys.argv[1]), int(sys.argv[2]), int(sys.argv[3])) if len(sys.argv) > 3 else (1.0, 16, 12)
    cw, ch = 340, 200
    sheet = Image.new('RGBA', (cw * 4, ch * 5), (190, 214, 190, 255))
    for v in range(4):
        fr, _ = cell(BASE, v, 1); sheet.alpha_composite(Image.fromarray(fr).crop((0, 0, fr.shape[1], min(ch, fr.shape[0]))), (v * cw + 110, 0))
    for st in range(4):
        for v in range(4):
            c = compose(v, 1, st, sk, up, side); sheet.alpha_composite(c.crop((0, 0, cw, ch)), (v * cw, (st + 1) * ch))
    sheet.save('/tmp/cc2_heads.png')
    frames = []
    for f in range(4):
        cv = Image.new('RGBA', (cw * 4, 420 * 4), (190, 214, 190, 255))
        for st in range(4):
            for v in range(4): cv.alpha_composite(compose(v, f, st, sk, up, side).crop((0, 0, cw, 420)), (v * cw, st * 420))
        frames.append(cv.resize((cw * 2, 420 * 2), Image.LANCZOS).convert('RGB'))
    frames[0].save('/tmp/cc2_walk.gif', save_all=True, append_images=frames[1:], duration=170, loop=0)
    print('ok')
