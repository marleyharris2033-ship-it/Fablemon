"""Pets you adopt from Hattie (src/pets.js): art_incoming/pets/<Name>.png, 4x4 walk sheets on transparent
(rows down, left, right, up) -> src/hd_world/pet_<name>.webp, 4x4 frames of 24x24 game px at 6x, feet at the
bottom of each frame. Sized from the user's still pictures (art_incoming/farmhouse2/pets, drawn at 140px a tile).
Also src/hd/pet_<name>_i.webp, the still picture, for menus."""
import numpy as np
from PIL import Image
K, CELL, TP = 6, 24 * 6, 140
PETS = {'bramble': ('Bramble', 'bramble-terrier'), 'clover': ('Clover', 'clover-rabbit'), 'hazel': ('Hazel', 'hazel-hedgehog'),
        'marmalade': ('Marmalade', 'marmalade-tabby'), 'pip': ('Pip', 'pip-ferret'), 'puddle': ('Puddle', 'puddle-duckling')}
for key, (sheet, still) in PETS.items():
    st = Image.open(f'art_incoming/farmhouse2/pets/{still}.png').convert('RGBA'); st = st.crop(st.getbbox())
    want_h = max(.5, st.height / TP * 1.35) * 16 * K   # the still's height (a bit bigger, the small ones at least half a tile), in 6x px
    im = Image.open(f'art_incoming/pets/{sheet}.png').convert('RGBA'); cw, ch = im.width // 4, im.height // 4
    cells = [[im.crop((c * cw, r * ch, (c + 1) * cw, (r + 1) * ch)) for c in range(4)] for r in range(4)]
    for row in cells:
        for i, c in enumerate(row):   # drop faint stray pixels
            a = np.asarray(c).copy(); a[a[..., 3] < 24] = 0; row[i] = Image.fromarray(a)
    front_h = np.mean([c.getbbox()[3] - c.getbbox()[1] for c in cells[0]])
    s = want_h / front_h
    out = Image.new('RGBA', (CELL * 4, CELL * 4))
    for r in range(4):
        for c in range(4):
            fr = cells[r][c]; fr = fr.crop(fr.getbbox()); fr = fr.resize((max(1, round(fr.width * s)), max(1, round(fr.height * s))), Image.LANCZOS)
            out.paste(fr, (c * CELL + (CELL - fr.width) // 2, r * CELL + CELL - 3 - fr.height), fr)
    out.save(f'src/hd_world/pet_{key}.webp', 'WEBP', quality=90, method=6)
    k = 200 / max(st.size); ic = st.resize((round(st.width * k), round(st.height * k)), Image.LANCZOS); sq = Image.new('RGBA', (220, 220)); sq.paste(ic, ((220 - ic.width) // 2, (220 - ic.height) // 2), ic)
    sq.save(f'src/hd/pet_{key}_i.webp', 'WEBP', quality=90, method=6)
    print(key, round(want_h / K / 16, 2), 'tiles tall')
