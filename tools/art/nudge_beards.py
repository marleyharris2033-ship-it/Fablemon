"""Seat each beard on the face by landmarks, not by guesswork.
Front: the beard's mouth gap is centred on the face's mouth. Side (facing left): the beard's chin tip sits just under
and in front of the face's chin. Facing right is the left placement mirrored about the head. The beard pieces are
placed for face 1; the other faces' mouths and chins sit a pixel or two differently, so cc.json gets a small offset
per face (beardOff[face][dir]) that the creator adds. Run after build_creator.py (it calls this itself)."""
import json, numpy as np
from PIL import Image
from scipy import ndimage as ndi
J = 'src/creator/cc.json'
c = json.load(open(J)); A = np.asarray(Image.open('src/creator/cc_atlas.webp').convert('RGBA'))
def crop(k):
    x, y, w, h = c['pieces'][k]['f']; return A[y:y + h, x:x + w]
def mouth(f):     # front view: centre of the face, at the darkest row of the lower face's middle
    a = crop(f'head{f}_0'); al = a[..., 3] > 127; v = a[..., :3].max(-1) / 255.; H, W = al.shape; cs = slice(int(W * .38), int(W * .62))
    rows = range(int(H * .72), int(H * .92)); y = min(rows, key=lambda r: v[r, cs][al[r, cs]].mean() if al[r, cs].any() else 9)
    at = c['pieces'][f'head{f}_0']['at']; return at[0] + W / 2, at[1] + y + .5
def chin(f, d):   # side views: the front end of the face's lowest outline row (left end facing left, right end facing right)
    a = crop(f'head{f}_{d}'); al = a[..., 3] > 127; ys = np.nonzero(al.any(1))[0]; y = ys[-1]; xs = np.nonzero(al[y])[0]
    at = c['pieces'][f'head{f}_{d}']['at']; return at[0] + (xs[0] if d == 1 else xs[-1] + 1), at[1] + y
def hole(k):      # the mouth gap in a front beard
    al = crop(k)[..., 3] > 127; h = ndi.binary_fill_holes(al) & ~al; lb, n = ndi.label(h)
    sz = ndi.sum(h, lb, range(1, n + 1)); ys, xs = np.nonzero(lb == int(np.argmax(sz)) + 1); return xs.mean() + .5, ys.mean() + .5
def btip(k, d):   # a side beard's chin tip: front end of its lowest rows
    al = crop(k)[..., 3] > 127; ys = np.nonzero(al.any(1))[0]; xs = np.nonzero(al[ys[-1] - 2:ys[-1] + 1].any(0))[0]
    return (xs[0] if d == 1 else xs[-1] + 1), ys[-1]
mx, my = mouth(0); C = {d: chin(0, d) for d in (1, 2)}
for b in range(c['beards']):
    P = c['pieces'][f'beard{b}_0']; hx, hy = hole(f'beard{b}_0'); P['at'] = [round(mx - hx), round(my - hy)]
    for d, sx in ((1, -1), (2, 1)):   # the beard reaches a pixel past the chin and two below it
        P = c['pieces'][f'beard{b}_{d}']; tx, ty = btip(f'beard{b}_{d}', d); P['at'] = [round(C[d][0] + sx - tx), round(C[d][1] + 2 - ty)]
    print('beard', b, [c['pieces'][f'beard{b}_{d}']['at'] for d in range(3)])
offs = []
for f in range(c['heads']):
    m = mouth(f); o = [[round(m[0] - mx), round(m[1] - my)]]
    for d in (1, 2): ch = chin(f, d); o.append([round(ch[0] - C[d][0]), round(ch[1] - C[d][1])])
    offs.append(o)
c['beardOff'] = offs; print('per-face', offs)
json.dump(c, open(J, 'w'), separators=(',', ':'))
