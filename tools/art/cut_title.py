"""Cut the title screen art (art_incoming/title): the two backgrounds and the logo.
  wide.png -> src/title_wide.jpg   tall.png -> src/title_tall.jpg   logo.png -> src/title_logo.png (magenta keyed out)
Run from the repo root:  python3 tools/art/cut_title.py"""
import sys
from PIL import Image
sys.path.insert(0, 'tools/art')
import cut_thirds as C
A = 'art_incoming/title/'
Image.open(A + 'wide.png').convert('RGB').resize((1152, 768), Image.LANCZOS).save('src/title_wide.jpg', quality=80, optimize=True, progressive=True)
Image.open(A + 'tall.png').convert('RGB').resize((768, 1152), Image.LANCZOS).save('src/title_tall.jpg', quality=80, optimize=True, progressive=True)
a, m = C.load(A + 'logo.png')
o = C.piece(a, m, 0, m.shape[0], 0, m.shape[1], keep=.002)
im = C.shrink(o, 600 / o['mask'].shape[1]); im = im.quantize(colors=200, method=Image.Quantize.FASTOCTREE)   # a small palette PNG: the logo is drawn at the top of the page, before the game loads
im.save('src/title_logo.png', optimize=True); print(im.size)
