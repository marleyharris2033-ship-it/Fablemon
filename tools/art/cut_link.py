"""The Link Hall art (25 Nov 2026), from art_incoming/link/:
interior.png -> src/link_int.webp (1024x1536, like the arenas: shown at half size, 512x768 world px)
exterior.png -> src/link_ext.webp (cream background keyed out, trimmed)
emotes.png   -> src/link_emotes.webp (8 bubbles, 96px each, in a row)
icon.png     -> src/link_icon.webp (128px)"""
import os
from collections import deque
from PIL import Image
ROOT = os.path.join(os.path.dirname(__file__), '..', '..'); IN = os.path.join(ROOT, 'art_incoming', 'link'); OUT = os.path.join(ROOT, 'src')

def key_out(im, tol=38):
    """flood-fill the flat background from the edges to transparent"""
    im = im.convert('RGBA'); W, H = im.size; px = im.load(); bg = px[2, 2][:3]
    seen = bytearray(W * H); q = deque()
    for x in range(W): q.extend([(x, 0), (x, H - 1)])
    for y in range(H): q.extend([(0, y), (W - 1, y)])
    near = lambda c: sum(abs(c[i] - bg[i]) for i in range(3)) <= tol
    while q:
        x, y = q.popleft(); i = y * W + x
        if seen[i]: continue
        seen[i] = 1
        if not near(px[x, y]): continue
        px[x, y] = (0, 0, 0, 0)
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < W and 0 <= ny < H and not seen[ny * W + nx]: q.append((nx, ny))
    return im

def trim(im): return im.crop(im.getbbox())

Image.open(os.path.join(IN, 'interior.png')).convert('RGB').resize((1024, 1536), Image.LANCZOS).save(os.path.join(OUT, 'link_int.webp'), quality=88)
ext = trim(key_out(Image.open(os.path.join(IN, 'exterior.png'))))
ext = ext.resize((864, round(ext.height * 864 / ext.width)), Image.LANCZOS); ext.save(os.path.join(OUT, 'link_ext.webp'), quality=90); print('ext', ext.size)
em = key_out(Image.open(os.path.join(IN, 'emotes.png')))
W, H = em.size; sheet = Image.new('RGBA', (96 * 8, 96), (0, 0, 0, 0))
for r in range(2):
    for c in range(4):
        cell = trim(em.crop((c * W // 4, r * H // 2, (c + 1) * W // 4, (r + 1) * H // 2)))
        s = 92 / max(cell.size); cell = cell.resize((round(cell.width * s), round(cell.height * s)), Image.LANCZOS)
        sheet.paste(cell, ((r * 4 + c) * 96 + (96 - cell.width) // 2, (96 - cell.height) // 2), cell)
sheet.save(os.path.join(OUT, 'link_emotes.webp'), quality=92)
ic = trim(key_out(Image.open(os.path.join(IN, 'icon.png')))).resize((128, 128), Image.LANCZOS); ic.save(os.path.join(OUT, 'link_icon.webp'), quality=92)
print('done')
