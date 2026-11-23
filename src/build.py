import base64, json, os, sys
import hashlib, io
# Smaller download (18 Nov 2026): PNGs go in as lossless WebP (the exact same pixels; marked ;px=1 so the CSS keeps
# them pixel-sharp) and JPEGs as high-quality WebP. Whichever is smaller wins. Results are cached in .webpcache.
def _shrunk(p, mime):
    raw = open(p, 'rb').read()
    if mime not in ('image/png', 'image/jpeg') or os.environ.get('FABLE_NO_SHRINK'): return mime, raw
    key = hashlib.sha1(raw).hexdigest() + ('L' if mime == 'image/png' else 'Q86')
    cp = os.path.join('.webpcache', key + '.webp')
    if not os.path.exists(cp):
        from PIL import Image
        os.makedirs('.webpcache', exist_ok=True); im = Image.open(io.BytesIO(raw)); b = io.BytesIO()
        if mime == 'image/png':
            im = im.convert('RGBA') if im.mode in ('P', 'LA', 'RGBA') or 'transparency' in im.info else im.convert('RGB')
            im.save(b, 'WEBP', lossless=True, quality=100, method=6, exact=True)
        else:
            im.convert('RGB').save(b, 'WEBP', quality=86, method=6)
        open(cp, 'wb').write(b.getvalue())
    w = open(cp, 'rb').read()
    if len(w) >= len(raw): return mime, raw
    return ('image/webp;px=1' if mime == 'image/png' else 'image/webp'), w
# 23 Nov 2026: with FABLE_ASSETS=<dir> the art goes out as separate files in <dir>/a/ (named by content, so the browser
# can keep them), and the game only holds a short address for each. The page shrinks from ~60 MB to a few, and the
# phone no longer keeps every picture's text in memory. Without it, everything is inlined (the one-file download).
EXT = os.environ.get('FABLE_ASSETS')
EXT_FILES = []
def uri(p, mime):
    m, b = _shrunk(p, mime)
    if not EXT: return f'data:{m};base64,' + base64.b64encode(b).decode()
    ext = {'image/webp;px=1': '.px.webp', 'image/webp': '.webp', 'image/png': '.png', 'image/jpeg': '.jpg'}.get(m, '.bin')
    name = 'a/' + hashlib.sha1(b).hexdigest()[:16] + ext; fp = os.path.join(EXT, name)
    if not os.path.exists(fp): os.makedirs(os.path.dirname(fp), exist_ok=True); open(fp, 'wb').write(b)
    EXT_FILES.append(name); return name
phaser = sys.argv[1]; out = sys.argv[2]
assets = {
  'terrain': uri('terrain.png', 'image/png'), 'objects': uri('objects.png', 'image/png'),
  'objectsJson': json.load(open('objects.json')), 'walk': uri('farmer_walk.png', 'image/png'),
  'tools': uri('farmer_tools.png', 'image/png'), 'icons': uri('icons.png', 'image/png'), 'iconsMap': json.load(open('icons.json')), 'intro': [uri(f'intro/s{i}.jpg', 'image/jpeg') for i in range(1, 13)],
  'town': uri('town.png', 'image/png'), 'townJson': json.load(open('town.json')), 'portraits': uri('portraits.png', 'image/png'), 'houses': uri('houses.png', 'image/png'), 'housesJson': json.load(open('houses.json')), 'monIcons': uri('mon_icons.png', 'image/png'), 'monBattle': uri('mon_battle.png', 'image/png'),
  **{'mon_' + n: uri(f'mon_{n}.png', 'image/png') for n in [n for n in ['hedglet', 'cindimple', 'rillip', 'tusskip', 'whirplet', 'cloverclasp', 'flintuck', 'fuzzwick', 'duskwick', 'mortoad', 'brashlet', 'brooknook', 'briamble', 'kilnook', 'weirlet', 'fleecebolt', 'whirlwyn', 'cloverguard', 'flintburrow', 'staticwing', 'duskcloak', 'rampartoad', 'pyrebrash', 'brookstride', 'muddlebub', 'lotling', 'puffpiper', 'puffpiper_cotton', 'sundrowse', 'tipplecup', 'glimmerjel', 'logloom', 'fenfang', 'mirebellows', 'lotveil', 'reefarer', 'reefarer_cotton', 'yawnox', 'brimbramble', 'stormveil', 'hollowbark', 'marshviper', 'fulgarok', 'craglet', 'cindhop', 'bristlecone', 'clinkit', 'ramruff', 'craglet_2', 'cindhop_2', 'bristlecone_2', 'clinkit_2', 'ramruff_2', 'hedgerholt', 'hearthrusk', 'merewheel', 'plumevix', 'whorlcrest', 'cloverlegion', 'flintcairn', 'moonspark', 'duskwyrm', 'torrentail', 'reefarer_3', 'reefarer_cotton_3', 'mirebellows_3', 'lotveil_3', 'yawnox_3', 'brimbramble_3', 'stormveil_3', 'hollowbark_3', 'cindhop_3', 'bristlecone_3', 'clinkit_3', 'craglet_3', 'nipshade', 'nipshade_2', 'nipshade_3', 'riftshear', 'riftshear_2', 'riftshear_3', 'inkwick', 'inkwick_2', 'inkwick_3', 'kilnback', 'kilnback_2', 'kilnback_3', 'foilfin', 'foilfin_2', 'foilfin_3', 'floecalf', 'floecalf_2', 'kitlet', 'kitlet_2', 'kitlet_3', 'flurrowl', 'flurrowl_2', 'flurrowl_3', 'wishling', 'wishling_2', 'wishling_3', 'heathfoal', 'heathfoal_2', 'cirrovale', 'samarrow', 'samaslice', 'samarazor', 'wickid', 'wickveil', 'solwick', 'rillcurl', 'riptwake', 'maelstromaw'] if not os.path.exists(f'hd/{n}_w.webp')]}, 'bgMeadow': uri('battle_meadow.jpg', 'image/jpeg'), 'bgBog': uri('battle_bog.jpg', 'image/jpeg'), 'bgCrag': uri('battle_crag.jpg', 'image/jpeg'),
  **{'tr_' + n: uri(f'tr_{n}.png', 'image/png') for n in ['rambler', 'ponddipper', 'birdwatcher', 'forager', 'busker', 'allotment', 'delphine', 'reedcutter', 'wispwatcher', 'miner', 'climber', 'granger', 'orrin', 'tamsin', 'vtech', 'vtech2', 'thorne', 'pell', 'dunmore', 'vale', 'gleam', 'brask', 'ash', 'alder', 'isolde', 'tansy', 'pruett', 'dunn', 'stroud', 'ellis', 'hazel', 'oliver', 'ranger', 'ranger2', 'logger', 'logger2', 'herder', 'herder2']}, 'trPortraits': uri('tr_portraits.png', 'image/png'),
  **{'npc_' + n: uri(f'npc_{n}.png', 'image/png') for n in ['bramble', 'marigold', 'willa', 'gideon', 'robin', 'barney', 'hattie', 'stanley', 'rowan', 'poppy', 'finn', 'ivy', 'fenwick', 'monty', 'shipwright']}, 'villPortraits': uri('vill_portraits.png', 'image/png'),
  **{'g_' + n: uri(f'ground_{n}.png', 'image/png') for n in ['cobble1', 'cobble2', 'cobble3', 'slab', 'riverstone', 'peat', 'moss', 'bogwater', 'lily', 'board_h', 'board_v']}, 'bog': uri('bog.png', 'image/png'), 'bogJson': json.load(open('bog.json')), 'bh': uri('brookholt.png', 'image/png'), 'seasonal': uri('seasonal.png', 'image/png'), 'wetland': json.load(open('wetland.json')), 'itemart': json.load(open('itemart.json')), 'winterart': json.load(open('winterart.json')), 'worldmap': uri('worldmap.jpg', 'image/jpeg'),  'gymBh': uri('gym_bh.jpg', 'image/jpeg'), 'gymQd': uri('gym_qd.jpg', 'image/jpeg'), 'qd': uri('quarrydown.png', 'image/png'), 'qdJson': json.load(open('quarrydown.json')), 'cove': uri('cove.png', 'image/png'), 'sea': uri('sea.png', 'image/png'), 'seaJson': json.load(open('sea.json')), 'boatSail': uri('boat_sail.png', 'image/png'), 'bgSea': uri('battle_sea.jpg', 'image/jpeg'), 'br': uri('beaconreach.png', 'image/png'), 'brJson': json.load(open('beaconreach.json')), 'gymBr': uri('gym_br.jpg', 'image/jpeg'), 'bgBeacon': uri('battle_beacon.jpg', 'image/jpeg'), 'hm': uri('highmoor.png', 'image/png'), 'hmJson': json.load(open('highmoor.json')), 'hmMaps': json.load(open('highmoor_maps.json')), 'gymHm': uri('gym_hm.jpg', 'image/jpeg'), 'bgHighmoor': uri('battle_highmoor.jpg', 'image/jpeg'), 'quarrycrops': json.load(open('quarrycrops.json')), 'coastcrops': json.load(open('coastcrops.json')), 'coveJson': json.load(open('cove.json')), 'crag': json.load(open('crag.json')), 'cragMaps': json.load(open('crag_maps.json')), 'seasonalJson': json.load(open('seasonal.json')), 'bhJson': json.load(open('brookholt.json')),
}
# high-detail Fablemon art cut by tools/art/cut_hd.py: hd/<id>_f|_b|_i|_w.webp -> ASSET.hd[id] = {f, b, i, w}
import os, glob
# high-detail town atlases and character sheets cut by tools/art/cut_hd_world.py -> ASSET.hdWorld[name] = {img, frames?}
assets['hdWorld'] = {}
for p in sorted(glob.glob('hd_world/*.webp')):
    n = os.path.basename(p)[:-5]; e = {'img': uri(p, 'image/webp')}
    if os.path.exists(p[:-5] + '.json'): e['frames'] = {k: v['frame'] for k, v in json.load(open(p[:-5] + '.json'))['frames'].items()}
    assets['hdWorld'][n] = e
assets['ground'] = {os.path.basename(p)[:-5]: uri(p, 'image/webp') for p in sorted(glob.glob('ground/*.webp'))}   # painted ground textures (ground.js)
# Warden battle arenas cut by tools/art/cut_arenas.py (Isolde's waits for Gloamhollow)
for n in ['mabel', 'delphine', 'granger', 'orrin', 'tamsin', 'alder', 'rowan']:
    assets['arena_' + n] = uri(f'arena_{n}.webp', 'image/webp'); assets['arenabg_' + n] = uri(f'arenabg_{n}.jpg', 'image/jpeg')
# painted Derby tracks (tools/art/cut_tracks.py)
TRACKS_LIVE = ['meadow', 'bramble', 'mudrun']   # the rest (beach, gale, rootway, lantern, summit) join when their cups do
assets['derbyTracks'] = {k: v for k, v in json.load(open('derby_tracks.json')).items() if k in TRACKS_LIVE}
for n in assets['derbyTracks']: assets['track_' + n] = uri(f'track_{n}.webp', 'image/webp')
# the character creator (tools/art/build_creator.py): its layout and its sheets (shared, then one per outfit)
_cc = json.load(open('creator/cc.json')); assets['cc'] = _cc
assets['ccSheets'] = [[uri(f'creator/{n}.webp', 'image/webp'), uri(f'creator/{n}_mat.png', 'image/png')] for n in _cc['sheets']]
assets['sceneTex'] = json.load(open('scene_tex.json')) if os.path.exists('scene_tex.json') else {}   # lazyart.js
assets['hd'] = {}
for p in sorted(glob.glob('hd/*.webp')):
    sid, kind = os.path.basename(p)[:-5].rsplit('_', 1); assets['hd'].setdefault(sid, {})[kind] = uri(p, 'image/webp')
html = open('template.html').read().replace('__TITLE_LOGO__', uri('title_logo.png', 'image/png')).replace('__TITLE_TALL__', uri('title_tall.jpg', 'image/jpeg')).replace('__TITLE_WIDE__', uri('title_wide.jpg', 'image/jpeg')).replace('__FRAME_BIG__', uri('frame_big.png', 'image/png')).replace('__FRAME_SM__', uri('frame_sm.png', 'image/png')).replace('__PHASER__', phaser).replace('__ASSETS__', json.dumps(assets)).replace('__GAMEJS__', open('villagers.js').read() + '\n' + open('game.js').read() + '\n' + open('hearth.js').read() + '\n' + open('moves.js').read() + '\n' + open('brookholt.js').read() + '\n' + open('social.js').read() + '\n' + open('winter.js').read() + '\n' + open('polish.js').read() + '\n' + open('held.js').read() + '\n' + open('gym.js').read() + '\n' + open('crag.js').read() + '\n' + open('quarry.js').read() + '\n' + open('cove.js').read() + '\n' + open('thirds.js').read() + '\n' + open('tidemons.js').read() + '\n' + open('sea.js').read() + '\n' + open('seamons.js').read() + '\n' + open('beacon.js').read() + '\n' + open('townsfolk.js').read() + '\n' + open('isles.js').read() + '\n' + open('highmoor.js').read() + '\n' + open('hmmons.js').read() + '\n' + open('hmtown.js').read() + '\n' + open('coastcrops.js').read() + '\n' + open('statsplit.js').read() + '\n' + open('derby.js').read() + '\n' + open('hd.js').read() + '\n' + open('fabled.js').read() + '\n' + open('verdance.js').read() + '\n' + open('look.js').read() + '\n' + open('creator.js').read() + '\n' + open('ground.js').read() + '\n' + open('house.js').read() + '\n' + open('pets.js').read() + '\n' + open('animals.js').read() + '\n' + open('requests.js').read() + '\n' + open('rootweave.js').read() + '\n' + open('starters.js').read() + '\n' + open('vdquests.js').read() + '\n' + open('vdscenes.js').read() + '\n' + open('town2.js').read() + '\n' + open('ewmons.js').read() + '\n' + open('elderwood.js').read() + '\n' + open('ewquests.js').read() + '\n' + open('roam.js').read() + '\n' + open('rtbattle.js').read() + '\n' + open('townmap.js').read() + '\n' + open('townquests.js').read() + '\n' + open('arena.js').read() + '\n' + open('post.js').read() + '\n' + open('mounts.js').read() + '\n' + open('lazyart.js').read())
open(out, 'w').write(html); print(out, len(html))
if EXT: json.dump(sorted(set(EXT_FILES)), open(os.path.join(EXT, 'a', 'files.json'), 'w'))
