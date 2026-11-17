"""Ground textures (art_incoming/ground, the user's seamless 1024px squares) -> src/ground/<name>.webp at 512px.
Each covers 8x8 tiles; ground.js shrinks them to its working scale. 512 keeps them light in the bundle."""
from PIL import Image
NAMES = {'Meadow-Grass': 'grass', 'Packed-Dirt': 'dirt', 'Pond-Water': 'water', 'Shallow-Water': 'shallow', 'Village-Cobblestones': 'cobble',
         'Stone-Slabs': 'slab', 'River-Stones': 'river', 'Tilled-Soil': 'soil', 'Beach-Sand': 'sand', 'Rocky-Ground': 'rock', 'Snow': 'snow',
         'Bog-Moss': 'moss', 'Peat': 'peat', 'Wooden-Boardwalk': 'board', 'Moorland-Heather': 'heather'}
for src, n in NAMES.items():
    im = Image.open(f'art_incoming/ground/{src}.png').convert('RGB').resize((512, 512), Image.LANCZOS)
    im.save(f'src/ground/{n}.webp', 'WEBP', quality=90, method=6); print(n)

# the second pack (17 Nov 2026): regional grounds, each with a grassy version for the long-grass zones
import glob, os
for p in sorted(glob.glob('art_incoming/ground2/*.png')):
    n = os.path.basename(p)[:-4]
    im = Image.open(p)
    if n == 'encounter_grass':   # the long-grass patch the user drew: kept with its transparency, recoloured per region in ground.js
        im = im.convert('RGBA'); im = im.crop(im.getbbox()).resize((192, 192), Image.LANCZOS)
        im.save('src/ground/encounter_grass.webp', 'WEBP', quality=92, method=6); print(n); continue
    im.convert('RGB').resize((512, 512), Image.LANCZOS).save(f'src/ground/{n}.webp', 'WEBP', quality=90, method=6); print(n)
