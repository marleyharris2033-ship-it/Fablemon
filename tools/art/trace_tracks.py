"""Derby tracks (18 Nov 2026): find the road in each painted track (art_incoming/derby_tracks/<key>.png).
Flood-fill from a seed on the road over a smoothed copy, tidy the mask, skeletonise it, and write
/tmp/trk_<key>.png (mask + skeleton) and /tmp/trk_<key>.npz for the next step."""
import sys, warnings, numpy as np
warnings.filterwarnings('ignore')
from PIL import Image
from skimage import color, filters, morphology, segmentation, measure
SRC = '/home/claude/fablemon/art_incoming/derby_tracks/'
SEEDS = {  # a point on the road (image px) and a colour tolerance
    'meadow': ((400, 820), 14), 'bramble': ((200, 700), 22), 'mudrun': ((400, 925), 14), 'gale': ((1000, 885), 16),
    'beach': ((400, 950), 10), 'rootway': ((400, 880), 24), 'lantern': ((400, 905), 18), 'summit': ((400, 862), 16),
}
def trace(key, tol=None):
    (sx, sy), t = SEEDS[key]; t = tol or t
    im = np.asarray(Image.open(SRC + key + '.png').convert('RGB')).astype(float) / 255
    sm = np.stack([filters.median(im[..., c], morphology.disk(5)) for c in range(3)], -1) if False else filters.gaussian(im, 4, channel_axis=-1)
    lab = color.rgb2lab(sm)
    seed = lab[sy, sx]
    d = np.sqrt(((lab - seed) ** 2).sum(-1))
    m = segmentation.flood(d, (sy, sx), tolerance=t)
    m = morphology.binary_closing(m, morphology.disk(6)); m = morphology.remove_small_holes(m, 4000); m = morphology.binary_opening(m, morphology.disk(5))
    lab_ = measure.label(m); m = lab_ == lab_[sy, sx]
    sk = morphology.skeletonize(m)
    dist = __import__('scipy.ndimage', fromlist=['x']).distance_transform_edt(m)
    np.savez_compressed(f'/tmp/trk_{key}.npz', m=m, sk=sk, dist=dist)
    o = (np.asarray(Image.open(SRC + key + '.png').convert('RGB')) * .5).astype(np.uint8)
    o[m] = (o[m] * .5 + np.array([60, 120, 255]) * .5).astype(np.uint8); o[morphology.binary_dilation(sk, morphology.disk(2))] = [255, 40, 40]
    Image.fromarray(o).save(f'/tmp/trk_{key}.png')
    print(key, 'road px', int(m.sum()), 'median half-width', round(float(np.median(dist[sk])), 1))
for k in (sys.argv[1:] or SEEDS): trace(k)
