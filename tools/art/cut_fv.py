"""Farm village atlas (26 Nov 2026): src/hd_world/fv.webp + fv.json

The farm branches of the town stores and the Village crafts reuse art that's already in the game. Rather than make the
farm load whole town sheets (big, and the iPhone has little memory to spare), the pictures it needs are copied into
one small 3x atlas here. Brookholt is still small pixel art, so its shop is enlarged 3x with sharp pixels.

Each entry: name -> (source sheet, frame, game-pixel width to show it at, or None to keep its size).
Run: python3 tools/art/cut_fv.py   (then src/build.py picks fv up with the other hd_world sheets)
"""
import json, os
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), '..', '..', 'src')
HDW = os.path.join(ROOT, 'hd_world')

PICK = {
    # the farm branches: about 5-6 tiles wide, smaller than the town shops they copy
    'br_bh': ('brookholt1x', 'bh_shop', None),
    'br_qd': ('quarrydown', 'qd_shop', 96),
    'br_br': ('beaconreach', 'br_shop', 88),
    'br_hm': ('highmoor', 'hm_shop', 96),
    'br_ew': ('ewb', 'ewb_store', 96),
    'br_gh': ('gh', 'gh_store', 84),
    # Village crafts
    'v_cottage_a': ('town', 'homeA', 104), 'v_cottage_b': ('town', 'homeB', 88), 'v_cottage_c': ('town', 'homeC', 120),
    'v_fisher_cottage': ('cove', 'cv_cottage', 80),
    'v_fountain': ('town', 'fountain', None), 'v_board': ('town', 'board', None), 'v_steps': ('town', 'steps', None),
    'v_signpost': ('bog', 'signpost', None), 'v_post': ('bog', 'post', None), 'v_cattails': ('bog', 'cattail', None), 'v_log': ('bog', 'log', None),
    'v_barrels': ('cove', 'cv_barrels', None), 'v_anchor': ('cove', 'cv_anchor', None), 'v_net_rack': ('cove', 'cv_net_frame', None),
    'v_rope_coil': ('cove', 'cv_rope_coil', None), 'v_fish_crates': ('cove', 'cv_fish_crate', None), 'v_cove_lantern': ('cove', 'cv_lantern', None),
    'v_oar_rack': ('cove', 'cv_oar_rack', None), 'v_lobster_pots': ('cove', 'cv_pot_box', None), 'v_glass_floats': ('cove', 'cv_glass_floats', None), 'v_buoys': ('cove', 'cv_buoys', None),
    'v_sunflower_stand': ('seasonal', 's_stand', None), 'v_hay_bales': ('seasonal', 's_hay', None), 'v_string_lanterns': ('seasonal', 's_lanterns', None),
    'v_birdbox': ('seasonal', 'p_birdbox', None), 'v_sunflowers': ('seasonal', 's_sunflower', None), 'v_pumpkin_pile': ('seasonal', 'a_pumpkins', None),
    'v_firewood': ('seasonal', 'w_firewood', None), 'v_garden_umbrella': ('seasonal', 's_umbrella', None), 'v_tulips': ('seasonal', 'p_tulips', None), 'v_daffodils': ('seasonal', 'p_daffs', None),
    'v_street_lamp': ('gh', 'gh_streetlamp_lit', None), 'v_market_cart': ('gh', 'gh_cart', None), 'v_old_well': ('gh', 'gh_well', None),
}
# 26 Nov: the farm's own pieces of the Smallroot sheet (the ranch and the placeable street pieces), copied exactly
# (no trimming, so they sit where they always have), so the farm no longer loads the whole 16 MB town sheet
for f in ['ranch', 'bench', 'flowerbed', 'hedge', 'lamp', 'planter', 'stall', 'wall_end', 'wall_h']: PICK['tw_' + f] = ('town', f, None)
EXACT = lambda name: name.startswith('tw_')


def frames_of(name):
    d = json.load(open(os.path.join(HDW, name + '.json')))
    return {k: v.get('frame', v) for k, v in d['frames'].items()}


def source(sheet, frame):
    if sheet == 'brookholt1x':   # small pixel art: enlarge 3x, sharp
        f = json.load(open(os.path.join(ROOT, 'brookholt.json')))['frames'][frame]['frame']
        im = Image.open(os.path.join(ROOT, 'brookholt.png')).convert('RGBA').crop((f['x'], f['y'], f['x'] + f['w'], f['y'] + f['h']))
        return im.resize((im.width * 3, im.height * 3), Image.NEAREST)
    f = frames_of(sheet)[frame]
    return Image.open(os.path.join(HDW, sheet + '.webp')).convert('RGBA').crop((f['x'], f['y'], f['x'] + f['w'], f['y'] + f['h']))


def main():
    pics = {}
    for name, (sheet, frame, width) in PICK.items():
        im = source(sheet, frame)
        if EXACT(name): pics[name] = im; continue
        bb = im.getbbox()
        if bb: im = im.crop(bb)
        if width and abs(im.width - width * 3) > 2:
            k = width * 3 / im.width
            im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
        # whole game pixels, so the picture lines up with the tiles
        W, H = -(-im.width // 3) * 3, -(-im.height // 3) * 3
        if (W, H) != im.size:
            c = Image.new('RGBA', (W, H)); c.alpha_composite(im, ((W - im.width) // 2, H - im.height)); im = c
        pics[name] = im
    # shelf packing, tallest first
    order = sorted(pics, key=lambda n: -pics[n].height)
    SW, x, y, row, out = 2048, 0, 0, 0, {}
    for n in order:
        im = pics[n]
        if x + im.width > SW: x, y, row = 0, y + row + 3, 0
        out[n] = (x, y, im.width, im.height); x += im.width + 3; row = max(row, im.height)
    sheet = Image.new('RGBA', (SW, y + row))
    for n, (x, y, w, h) in out.items(): sheet.alpha_composite(pics[n], (x, y))
    sheet.save(os.path.join(HDW, 'fv.webp'), 'WEBP', quality=90, method=6)
    json.dump({'frames': {n: {'frame': {'x': x, 'y': y, 'w': w, 'h': h}} for n, (x, y, w, h) in out.items()}}, open(os.path.join(HDW, 'fv.json'), 'w'))
    print('fv', sheet.size, len(out), 'frames', os.path.getsize(os.path.join(HDW, 'fv.webp')) // 1024, 'KB')
    for n, (x, y, w, h) in out.items(): print(f'  {n}: {w // 3}x{h // 3} game px = {-(-w // 48)} tiles wide')


if __name__ == '__main__':
    main()
