"""Road masks by colour: Lab distance to colours sampled at seed points, then tidy and skeletonise.
usage: trace2.py key tol open close x,y x,y ..."""
import sys, warnings, numpy as np
warnings.filterwarnings('ignore')
from PIL import Image
from scipy import ndimage as ndi
from skimage import color, filters, morphology, measure
SRC = '/home/claude/fablemon/art_incoming/derby_tracks/'
def mask(key, tol, op, cl, seeds, blur=3):
    im = np.asarray(Image.open(SRC + key + '.png').convert('RGB')).astype(float) / 255
    lab = color.rgb2lab(filters.gaussian(im, blur, channel_axis=-1))
    refs = np.array([lab[y, x] for x, y in seeds])
    d = np.min([np.sqrt(((lab - r) ** 2).sum(-1)) for r in refs], axis=0)
    m = d < tol
    if op: m = morphology.binary_opening(m, morphology.disk(op))
    if cl: m = morphology.binary_closing(m, morphology.disk(cl))
    m = ndi.binary_fill_holes(m) if False else morphology.remove_small_holes(m, 3000)
    lb = measure.label(m); keep = set(lb[y, x] for x, y in seeds) - {0}
    m = np.isin(lb, list(keep))
    return m
if __name__ == '__main__':
    key, tol, op, cl = sys.argv[1], float(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4])
    seeds = [tuple(map(int, s.split(','))) for s in sys.argv[5:]]
    m = mask(key, tol, op, cl, seeds)
    sk = morphology.skeletonize(m)
    o = (np.asarray(Image.open(SRC + key + '.png').convert('RGB')) * .5).astype(np.uint8)
    o[m] = (o[m] * .5 + np.array([60, 120, 255]) * .5).astype(np.uint8); o[morphology.binary_dilation(sk, morphology.disk(2))] = [255, 40, 40]
    for x, y in seeds: o[y-4:y+4, x-4:x+4] = [255, 255, 0]
    Image.fromarray(o).resize((768, 512)).save(f'/tmp/t2_{key}.png'); np.savez_compressed(f'/tmp/trk_{key}.npz', m=m, sk=sk, dist=ndi.distance_transform_edt(m))
    print(key, int(m.sum()))
