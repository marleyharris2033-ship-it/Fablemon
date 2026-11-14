"""Verdance Energy props and icons (main story, src/verdance.js), cut from the user's sheets in art_incoming/verdance.
Writes src/hd_world/vd.webp + vd.json: a 3x atlas (frames are 3x game pixels; the game shrinks it on load).
Each sheet lists where each drawing sits (rough centre, in sheet pixels) and its name; small stray bits (droplets,
weathervane arms) join the nearest drawing. Running/shut-down pairs and the pipe set share one scale so they match."""
import sys, os, json
import numpy as np
from PIL import Image
from scipy import ndimage
sys.path.insert(0, os.path.dirname(__file__))
import cut_thirds as C
from cut_hd import soft

SRC = 'art_incoming/verdance/'
OUT = 'src/hd_world/'
K = 3   # atlas pixels per game pixel

# sheet: [(name, cx, cy)], then sizes: name -> game-pixel width (a group shares the widest member's scale)
SHEETS = {
    '01_siphon_pump_and_root_heart': [('vd_siphon', 390, 240), ('vd_siphon_off', 1140, 240), ('vd_root', 380, 730), ('vd_root_on', 1140, 730)],
    '02_mining_drill': [('vd_drill', 370, 500), ('vd_drill_off', 1130, 500)],
    '03_siphon_tower': [('vd_tower', 320, 620), ('vd_tower_off', 880, 640)],
    '04_offshore_rig': [('vd_rig', 430, 440), ('vd_rig_off', 1320, 440)],
    '05_community_office': [('vd_office', 470, 400), ('vd_office_x', 1430, 390)],
    '06_supply_and_survey': [('vd_kiosk', 310, 250), ('vd_barge', 1080, 240), ('vd_buoy', 410, 750), ('vd_stake', 1080, 760)],
    '07_billboards': [('vd_board', 440, 470), ('vd_board_x', 1330, 470)],
    '08_pipes_and_clipboard': [('vd_pipe_v', 790, 270), ('vd_pipe', 290, 280), ('vd_pipe_bend', 1260, 300), ('vd_pipe_valve', 290, 750), ('vd_memo', 1320, 790), ('vd_pipe_grass', 850, 810)],
    '09_slicks_and_collar': [('vd_slick1', 380, 270), ('vd_slick2', 1150, 270), ('vd_slick3', 380, 770), ('vd_collar', 1150, 750)],
    '10_inventory_icons': [('i_vgrow', 260, 260), ('i_files', 760, 250), ('i_letter', 1270, 270), ('i_heart', 250, 760), ('i_contract', 760, 770), ('i_logo', 1270, 770)],
    '11_verdance_emblem': [('vd_logo', 627, 627)],
}
GROUPS = [  # (members, game-pixel width of the widest)
    (['vd_siphon', 'vd_siphon_off'], 40), (['vd_root', 'vd_root_on'], 46), (['vd_drill', 'vd_drill_off'], 42), (['vd_tower', 'vd_tower_off'], 34),
    (['vd_rig', 'vd_rig_off'], 58), (['vd_office', 'vd_office_x'], 66), (['vd_kiosk'], 40), (['vd_barge'], 60), (['vd_buoy'], 22), (['vd_stake'], 12),
    (['vd_board', 'vd_board_x'], 54), (['vd_pipe', 'vd_pipe_v', 'vd_pipe_bend', 'vd_pipe_valve', 'vd_pipe_grass'], 21), (['vd_memo'], 12),
    (['vd_slick1', 'vd_slick2', 'vd_slick3'], 36), (['vd_collar'], 64),
    (['i_vgrow', 'i_files', 'i_letter', 'i_heart', 'i_contract', 'i_logo'], 32), (['vd_logo'], 48),
]


def cut_sheet(name, spots):
    a, m = C.load(SRC + name + '.png')
    lab, n = ndimage.label(ndimage.binary_dilation(m, iterations=6)); lab = lab * m
    size = ndimage.sum(m, lab, range(1, n + 1)); cen = ndimage.center_of_mass(m, lab, range(1, n + 1))
    owner = {}
    for i in range(n):   # each piece belongs to the nearest named spot
        if size[i] < 40: continue
        cy, cx = cen[i]; owner[i + 1] = min(range(len(spots)), key=lambda j: (spots[j][1] - cx) ** 2 + (spots[j][2] - cy) ** 2)
    out = {}
    for j, (nm, _, _) in enumerate(spots):
        mm = np.isin(lab, [l for l, o in owner.items() if o == j]); ys, xs = np.where(mm)
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        out[nm] = {'mask': mm[y0:y1, x0:x1], 'rgb': a[y0:y1, x0:x1]}
    return out


def main():
    raw = {}
    for nm, spots in SHEETS.items(): raw.update(cut_sheet(nm, spots))
    ims = {}
    for members, w in GROUPS:
        k = w * K / max(raw[m]['mask'].shape[1] for m in members)
        for m in members: ims[m] = soft(raw[m], k)
    W = 1024; x = y = rowh = 0; pos = {}
    for n, im in sorted(ims.items(), key=lambda kv: -kv[1].height):
        if x + im.width > W: x = 0; y += rowh + 2; rowh = 0
        pos[n] = (x, y); x += im.width + 2; rowh = max(rowh, im.height)
    atlas = Image.new('RGBA', (W, y + rowh)); frames = {}
    for n, im in ims.items():
        px, py = pos[n]; atlas.paste(im, (px, py), im); frames[n] = {'frame': {'x': px, 'y': py, 'w': im.width, 'h': im.height}}
    atlas.save(OUT + 'vd.webp', 'WEBP', quality=86, method=6); json.dump({'frames': frames}, open(OUT + 'vd.json', 'w'))
    print('vd atlas', atlas.size, {n: (im.width // K, im.height // K) for n, im in ims.items()})


if __name__ == '__main__':
    main()
