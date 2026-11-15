"""Ground textures (art_incoming/ground, the user's seamless 1024px squares) -> src/ground/<name>.webp at 512px.
Each covers 8x8 tiles; ground.js shrinks them to its working scale. 512 keeps them light in the bundle."""
from PIL import Image
NAMES = {'Meadow-Grass': 'grass', 'Packed-Dirt': 'dirt', 'Pond-Water': 'water', 'Shallow-Water': 'shallow', 'Village-Cobblestones': 'cobble',
         'Stone-Slabs': 'slab', 'River-Stones': 'river', 'Tilled-Soil': 'soil', 'Beach-Sand': 'sand', 'Rocky-Ground': 'rock', 'Snow': 'snow',
         'Bog-Moss': 'moss', 'Peat': 'peat', 'Wooden-Boardwalk': 'board', 'Moorland-Heather': 'heather'}
for src, n in NAMES.items():
    im = Image.open(f'art_incoming/ground/{src}.png').convert('RGB').resize((512, 512), Image.LANCZOS)
    im.save(f'src/ground/{n}.webp', 'WEBP', quality=90, method=6); print(n)
