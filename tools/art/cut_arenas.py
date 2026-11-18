"""Warden battle arenas (18 Nov 2026).

art_incoming/arenas/<Name>.png (1024 x 1536, top-down) becomes:
  src/arena_<name>.webp    the whole arena, drawn at half size in the game (512 x 768 world px = 32 x 48 tiles)
  src/arenabg_<name>.jpg   a 16:9 crop of the battle floor (960 x 540), the background for classic battles
"""
import os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, '..', '..', 'art_incoming', 'arenas')
OUT = os.path.join(HERE, '..', '..', 'src')
# the middle of each battle floor, in world px (image px / 2); the classic crop is centred on it
FLOOR_Y = {'mabel': 410, 'delphine': 400, 'granger': 390, 'orrin': 365, 'tamsin': 395, 'alder': 400, 'isolde': 405, 'rowan': 405}

for name, fy in FLOOR_Y.items():
    im = Image.open(os.path.join(SRC, name.capitalize() + '.png')).convert('RGB')
    im.save(os.path.join(OUT, f'arena_{name}.webp'), 'WEBP', quality=78, method=6)
    cy = fy * 2 - 40   # a touch above the middle, so the Warden's end shows behind their Fablemon
    top = max(0, min(im.height - 576, cy - 288))
    im.crop((0, top, 1024, top + 576)).resize((960, 540), Image.LANCZOS).save(os.path.join(OUT, f'arenabg_{name}.jpg'), quality=86)
    print(name, os.path.getsize(os.path.join(OUT, f'arena_{name}.webp')) // 1024, 'KB')
