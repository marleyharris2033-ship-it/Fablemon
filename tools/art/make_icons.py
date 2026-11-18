"""App icons (18 Nov 2026): art_incoming/app/app_icon.png (the user's square picture) -> docs/icon-180/192/512.png."""
from PIL import Image
im = Image.open('art_incoming/app/app_icon.png').convert('RGB')
s = min(im.size); im = im.crop(((im.width - s) // 2, (im.height - s) // 2, (im.width + s) // 2, (im.height + s) // 2))
for n in (180, 192, 512): im.resize((n, n), Image.LANCZOS).save(f'docs/icon-{n}.png', optimize=True)
print('icons made')
