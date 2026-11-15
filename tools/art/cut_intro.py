"""The opening's 12 panels (art_incoming/intro2/sheet1-3.png, 2x2 comic pages on a cream gutter) -> src/intro/s1..s12.jpg.
Finds the gutters, trims the black panel border, and scales each panel up to 1152px wide for the intro frame (3:2)."""
from PIL import Image, ImageFilter
import numpy as np

def runs(ix):
    out, s, p = [], None, None
    for i in ix:
        if s is None or i != p + 1:
            if s is not None: out.append((s, p))
            s = i
        p = i
    out.append((s, p)); return out

n = 0
for sh in (1, 2, 3):
    im = Image.open(f'art_incoming/intro2/sheet{sh}.png').convert('RGB'); a = np.asarray(im).astype(int); light = a.min(2) > 200
    gc = runs([i for i, v in enumerate(light.mean(0)) if v > .9]); gr = runs([i for i, v in enumerate(light.mean(1)) if v > .9])
    for (y0, y1) in zip([g[1] for g in gr[:-1]], [g[0] for g in gr[1:]]):
        for (x0, x1) in zip([g[1] for g in gc[:-1]], [g[0] for g in gc[1:]]):
            p = im.crop((x0 + 7, y0 + 7, x1 - 6, y1 - 6))
            p = p.resize((1152, round(1152 * p.height / p.width)), Image.LANCZOS).filter(ImageFilter.UnsharpMask(1.2, 40, 2))
            n += 1; p.save(f'src/intro/s{n}.jpg', quality=86, optimize=True, progressive=True); print(n, p.size)
