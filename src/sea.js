/* ============================================================ The Glimmer Sea
   Three sea routes, sailed in Hal's boat (moored beside the Driftwood Cove pier):
     Glimmer Sea (glimmer)          the first stretch, out from the Cove. North and south from here:
     Stormwatch Strait (stormwatch) always stormy; a torrent maze guards Beaconreach's harbour
     Tidewrack Shoals (shoals)      a torrent maze to the hidden Secret Isles
   Maps are drawn from text like the beach maps, but at sea the water is where you can go:
     ~ open sea   0-9 rough water where wild Fablemon swim (zones)   * a rock   . sand   # island interior   , jetty
     > < ^ v  torrents: sail into one and it carries you along until something stops you (no steering!)
   The maze maps were checked with a solver: the harbour/isles can be reached and you can't get stuck.
   Props (rocks, reefs, buoys, islets, a wreck) come from the 'sea' atlas and block the tiles under them.
   The player is drawn as the boat (boat_sail.png: rows down, left, right, up; 2 bob frames each; frame 8 empty).
   Art: tools/art/cut_sea.py. */
const GLIMMER_MAP = [
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~0000000~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~0000000000~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~0000000000000~~~~~~~222~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~0000000000000~~~~22222222~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~00000000000~~~~22222222222~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~00000000000~~~~22222222222~~~~~~~~~~~~22~~~~~~~~~~~~",
  "~~~~~000000000~~~~~22222222222~~~~~2222222222~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~222222222~~~~~2222222222222~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~222222222222222~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~2222222222222222~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~2222222222222222~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~222222222222222~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~11~~~~~~2222222222~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~11111111111~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~1111111111111111~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~11111111111111111~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~111111111111111111~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~11~~~~~111111111111111111~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~111111111111111111111111111~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~111111111111111111111111111~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~11111111111~~~111111111111~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~1111111111111~~~1111111111~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~111111111111111~~~~~~11~~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~111111111111111~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~111111111111111~~~~~~~~~~~~~~~00~~~~0~~~~~~~~~~",
  "~~~~~~~~~111111111111111~~~~~~~~~~~~~~0000000000~~~~~~~~",
  "~~~~~~~~~~1111111111111~~~~~~~~~~~~~0000000000000~~~~~~~",
  "~~~~~~~~~~~11111111111~~~~~~~~~~~~~000000000000000~~~~~~",
  "~~~~~~~~~~~~111111111~~~~~~~~~~~~~00000000000000000~~~~~",
  "~~~~~~~~~~~~~1~~~~~1~~~~~~~~~~~~~~00000000000000000~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~0000000000000000~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~000000000000000~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~000000000000~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*~~~0000000000~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*~~~~~00~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*~~~~~~~~~~~~~~~~~~~~~~"
];
const SHOALS_MAP = [
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~00~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~0000000000~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~000000000000~~~~~~~~~~~~~~~111~~~~~~~~~~~~",
  "~~~~~000000000000000~~~~~~~111111111111~11~~~~~~",
  "~~~~~0000000000000000~~~~~~1111111111111111~~~~~",
  "~~~~~000000000000000~~~~~~11111111111111111~~~~~",
  "~~~~~000000000000000~~~~~111111111111111111~~~~~",
  "~~~~~~~~~0000000000~~~~~~11111111111111111~~~~~~",
  "~~~~~~~~~~000~~~~~~~~~~~~~~~1111111111111~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~11111111111~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~111~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "****~*****************~***************~******^**",
  "*>>>>>>>>>>>>~~~*>>>>>>>>>>>>>>*>>>>>>>>>>>>>^**",
  "*************~*~**************~**************^**",
  "*<<<*~~~<<<<<<*<<<<<<<<<<<*<<<<<<<<<<<<<<<<<<^**",
  "******~********~***********~*****************^**",
  "*>>>>>>>>>>>*>>>>>>>>>>>~~~>>>>>>*>>>>>>>>>>>^**",
  "***********~**************~*****~************^**",
  "*<~~~<<<<<<<<<<<<<*<<<<<<<<<<*<<<<<<<<<<<<<<<^**",
  "***~***************~**********~**************^**",
  "*>>>>>>>~~~>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>^**",
  "*********~***********************************^**",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~222~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~2222222~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~2222222222~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~2222222222~~~~~~,~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~2222222222~~~~~~,~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~2222222~~~~~~~~,~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~22~~~~~~~~~~,~~~.~~~..~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~............~..~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~.....###..##.....~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~....#############....~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~..#..##############....~~~~~~",
  "~~~~~~~~~~~~~~~~~~..#####################..~~~~~",
  "~~~~~~~~~~~~~~~~~...#####################...~~~~",
  "~~~~~.......~~~~~..#####################....~~~~",
  "~~~~..#####..~~~~..#.###################....~~~~",
  "~~~~.#######.~~~~...#####################...~~~~",
  "~~~~.#######.~~~~...#####################...~~~~",
  "~~~~.#######.~~~~~..#####################..~~~~~",
  "~~~~..#####..~~~~~~..#..##############....~~~~~~",
  "~~~~~.......~~~~~~~~....#############....~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~.....###..##.....~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~............~..~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~.~~~..~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"
];
const STORM_MAP = [
  "~~~......###############################......~~",
  "~~~......###############################......~~",
  "~~~~......##########################.###.....~~~",
  "~~~~..........#####################..........~~~",
  "~~~~~~~~.......####################......~~~~~~~",
  "~~~~~~~~~.......#...####..###...........~~~~~~~~",
  "~~~~~~~~~~..........................~~.~~~~~~~~~",
  "~~~~~~~~~~~~~~~....................~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~..~,~...~~~~~~~~~~~~~~~~~~~",
  "**~~~~~~~~~~~~~~~~~~~~~~,~~~~~~~~~~~~~~~~~~~~~**",
  "**~~~~~~~~~~~~~~~~~~~~~~,~~~~~~~~~~~~~~~~~~~~~**",
  "**~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~**",
  "**~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~**",
  "*********************~**************************",
  "*v<<<<<<<<<<<<<<<<<<~~~<<<<<<<<<<<<<<<<<<<<<<<v*",
  "*v***********~***************~****************v*",
  "*v>>>>>>>>>>>>*>>>>>>>>>>>>>~~~>>>>>>>>>>>>>>>v*",
  "*v********~***********~***********~***********v*",
  "*v<<<<<<<~~~<<<<<<<<<*<<<<<<<<<<<*<<<<<<<<<<<<v*",
  "*v**************~********~***********~********v*",
  "*v>>>>>>>>>>>>>>>*>>>>>>>>*>>>>>>>>>~~~>>>>>>>v*",
  "*v**************~*~************~**************v*",
  "*v<<<<<<<<<<<<<<~~~<<<<<<<<<<<*<<<<<<<<<<<<<<<v*",
  "*v******~**************~***************~******v*",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~00~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~0000000000~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~000000000000~~~",
  "~~~~~~~~~~~00~~~~~~~~~~~~~~~~~~~~000000000000~~~",
  "~~~~~~~0000000000~~~~~~~~~~~~~~~000000000000~~~~",
  "~~~~~~000000000000~~~~~~~~~~~~~~~000000000~~~~~~",
  "~~~~~~0000000000000~~~~~~~~~~~~~~~~~~~000~~~~~~~",
  "~~~~~000000000000000~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~00000000000000000~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~0000000000000000~~~~~~~~~~~11~~~~~~~~~~~~~~~",
  "~~~~0000000000000000~~~~~~~~~~1111111111~~~~~~~~",
  "~~~~~000000000000000~~~~~~~~1111111111111~~~~~~~",
  "~~~~~~~~000000000~~~~~~~~~11111111111111111~~~~~",
  "~~~~~~~~~~~~~~0~~~~~~~~~~~111111111111111111~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~111111111111111111~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~111111111111111111~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~11111111111111111~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~1111111111111~~~~~~~",
  "~~~~~~~~~~~~~~~~11~~~~~~~~~~~~1111111111~~~~~~~~",
  "~~~~~~~~~~~~~~11111111111~~~~~~11~~~~~1~~~~~~~~~",
  "~~~~~~~~~~~~1111111111111~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~111111111111111~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~1111111111111111~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~1111111111111111~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~11111111111111~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~1111111111~~~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~11~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"
];
const SEA_ENC = {
  day: [['reefarer', 18], ['brookstride', 14], ['mirebellows', 12], ['lotveil', 10], ['whirlwyn', 10], ['stormveil', 9], ['reefarer_cotton', 7], ['nipshade_2', 6], ['marshviper', 4]],
  night: [['stormveil', 18], ['nipshade_2', 14], ['mirebellows', 13], ['reefarer', 12], ['duskcloak', 10], ['marshviper', 8], ['lotveil', 8]],
};
const SHOAL_ENC = {
  day: [['reefarer', 16], ['nipshade_2', 12], ['lotveil', 12], ['brookstride', 12], ['reefarer_cotton', 10], ['mirebellows', 10], ['whirlwyn', 8], ['marshviper', 8]],
  night: [['nipshade_2', 18], ['mirebellows', 12], ['duskcloak', 12], ['stormveil', 10], ['lotveil', 10], ['reefarer', 10], ['marshviper', 8]],
};
const STORM_ENC = {
  day: [['stormveil', 18], ['staticwing', 14], ['mirebellows', 12], ['fleecebolt', 10], ['reefarer', 10], ['nipshade_2', 10], ['whirlwyn', 8], ['marshviper', 6]],
  night: [['stormveil', 20], ['staticwing', 14], ['duskcloak', 12], ['nipshade_2', 12], ['mirebellows', 10], ['marshviper', 8], ['fleecebolt', 6]],
};
const boatReady = () => ((S.cove || {}).stage || 0) >= 4;
const clampN = (v, a, b) => Math.max(a, Math.min(b, v));
const SEA_BASE = { crag: true, beach: true, sail: true, quiet: true, paths: [], ponds: [], bridge: null, open: [], clear: [] };
Object.assign(ROUTES, {
  glimmer: { ...SEA_BASE, name: 'Glimmer Sea', w: 56, h: 44, ascii: GLIMMER_MAP,
    zones: [[0, 0, 0, 0, 37, 39], [0, 0, 0, 0, 38, 40], [0, 0, 0, 0, 39, 41]],
    pickups: [{ id: 'gs1', x: 24, y: 35, item: 'tonic', n: 3 }, { id: 'gs2', x: 53, y: 14, gold: 3000 }, { id: 'gs3', x: 12, y: 31, item: 'mon_treat', n: 2 }, { id: 'gs4', x: 30, y: 4, item: 'sturdy_charm', n: 3 }],
    signs: {},
    trainers: [
      { id: 'gs_t1', kind: 'ponddipper', name: 'Marina', x: 34, y: 28, dir: 'right', sight: 4, team: [['brookstride', 38], ['lotveil', 39]] },
      { id: 'gs_t2', kind: 'birdwatcher', name: 'Skye', x: 8, y: 17, dir: 'right', sight: 4, team: [['whirlwyn', 39], ['reefarer', 39], ['staticwing', 40]] },
      { id: 'gs_t3', kind: 'rambler', name: 'Finn', x: 48, y: 5, dir: 'down', sight: 4, team: [['mirebellows', 40], ['nipshade_2', 40], ['stormveil', 41]] },
    ],
    seaprops: [['buoy_red', 46, 40], ['buoy_teal', 41, 40], ['rock', 30, 37], ['rock_tall', 53, 27], ['reef', 26, 31], ['reef_kelp', 5, 37],
      ['wreck', 48, 21], ['islet', 34, 29], ['island', 8, 18], ['lagoon', 50, 6], ['flotsam', 21, 41], ['flotsam', 37, 3],
      ['buoy_bell', 21, 13], ['rock', 3, 14], ['rock_tall', 27, 2], ['reef', 15, 36], ['rock', 52, 34], ['buoy_bell', 31, 41]],
    exits: [
      { r: [0, 0, 55, 0], to: x => ['stormwatch', { x: clampN(Math.round(x * 47 / 55), 3, 44), y: 54, dir: 'up' }] },
      { r: [0, 43, 32, 43], to: x => ['shoals', { x: clampN(x, 2, 30), y: 1, dir: 'down' }] },
      { r: [34, 43, 55, 43], to: () => ['driftwood', { x: 19, y: 6, dir: 'down' }] },
    ],
    spawn: { x: 44, y: 41, dir: 'up' }, enc: SEA_ENC },
  shoals: { ...SEA_BASE, name: 'Tidewrack Shoals', w: 48, h: 52, ascii: SHOALS_MAP,
    zones: [[0, 0, 0, 0, 39, 41], [0, 0, 0, 0, 40, 42], [0, 0, 0, 0, 41, 43]],
    pickups: [{ id: 'ts1', x: 12, y: 28, item: 'heartwood_charm', n: 1 }, { id: 'ts2', x: 44, y: 30, gold: 6000 }, { id: 'ts3', x: 6, y: 38, item: 'swift_feather', n: 1 }, { id: 'ts4', x: 44, y: 2, item: 'mon_treat', n: 3 }],
    signs: { '24,31': '__door:cv_isles' },
    trainers: [
      { id: 'ts_t1', kind: 'ponddipper', name: 'Pearl', x: 20, y: 9, dir: 'right', sight: 4, team: [['lotveil', 41], ['reefarer_cotton', 41], ['nipshade_2', 42]] },
      { id: 'ts_t2', kind: 'rambler', name: 'Morgan', x: 38, y: 4, dir: 'left', sight: 5, team: [['mirebellows', 42], ['brookstride', 42], ['marshviper', 43]] },
    ],
    seaprops: [['islet', 20, 10], ['island', 38, 5], ['wreck', 41, 12], ['reef', 6, 11], ['buoy_bell', 24, 13], ['rock_tall', 3, 3], ['flotsam', 30, 2],
      ['islet', 40, 29], ['reef_kelp', 17, 29], ['flotsam', 33, 28]],
    goal: { area: [0, 26, 47, 51], flag: 'islesFound', msg: "You've found the Secret Isles! White sand and still blue water, hidden behind the shoals." },
    exits: [{ r: [0, 0, 47, 0], to: x => ['glimmer', { x: clampN(x, 1, 31), y: 42, dir: 'up' }] }],
    spawn: { x: 12, y: 1, dir: 'down' }, enc: SHOAL_ENC },
  stormwatch: { ...SEA_BASE, name: 'Stormwatch Strait', storm: true, w: 48, h: 56, ascii: STORM_MAP,
    zones: [[0, 0, 0, 0, 40, 42], [0, 0, 0, 0, 41, 43]],
    pickups: [{ id: 'sw1', x: 44, y: 30, item: 'tonic', n: 5 }, { id: 'sw2', x: 4, y: 44, gold: 4000 }, { id: 'sw3', x: 40, y: 11, item: 'fang_charm', n: 1 }],
    signs: { '24,10': '__door:cv_beacon' },
    trainers: [
      { id: 'sw_t1', kind: 'birdwatcher', name: 'Gale', x: 12, y: 41, dir: 'right', sight: 4, team: [['staticwing', 41], ['whirlwyn', 42], ['stormveil', 42]] },
      { id: 'sw_t2', kind: 'rambler', name: 'Rook', x: 36, y: 46, dir: 'left', sight: 4, team: [['fleecebolt', 42], ['nipshade_2', 42], ['mirebellows', 43]] },
    ],
    seaprops: [['islet', 12, 42], ['island', 36, 47], ['wreck', 8, 29], ['buoy_red', 21, 25], ['buoy_teal', 25, 25], ['buoy_bell', 40, 26], ['rock_tall', 43, 52], ['reef', 5, 50], ['rock', 28, 36], ['flotsam', 20, 31]],
    goal: { area: [2, 9, 45, 12], flag: 'beaconSighted', msg: 'Land ahoy! You made it through the storm. The lighthouse of Beaconreach looms overhead.' },
    exits: [{ r: [0, 55, 47, 55], to: x => ['glimmer', { x: clampN(Math.round(x * 55 / 47), 1, 54), y: 1, dir: 'down' }] }],
    spawn: { x: 24, y: 54, dir: 'up' }, enc: STORM_ENC },
});
// tiles a sea prop covers: most of its width, the lower half of its height
function seaFoot(f, x, y) {
  const fr = ASSET.seaJson.frames['sea_' + f].frame, w = Math.max(1, Math.round(fr.w * .8 / T)), h = Math.max(1, Math.round(fr.h * .45 / T)), out = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) out.push([x - Math.floor((w - 1) / 2) + i, y - j]);
  return out;
}
const SEA_FLAT = ['islet', 'island', 'lagoon', 'reef', 'reef_kelp', 'flotsam'];
const CURRENT = { '>': 'right', '<': 'left', '^': 'up', 'v': 'down' };
const stormHere = () => !!(scene && scene.scene && ROUTES[scene.scene.key] && ROUTES[scene.scene.key].storm);
function seaSetup(sc) {
  const R = sc.R, K = (x, y) => R.kind[y * RW + x];
  for (const [f, x, y] of RC.seaprops || []) sc.add.image(x * T + 8, y * T + 16, 'sea', 'sea_' + f).setOrigin(.5, 1).setDepth(SEA_FLAT.includes(f) ? 2 : y * T + 15);
  for (const s of Object.values(sc.grassSpr || {})) s.destroy();
  sc.grassSpr = {};
  // reef rocks and the streaks of foam that show which way each torrent runs
  if (!sc.textures.exists('sea_streak')) { const g = sc.make.graphics({ add: false }); g.fillStyle(0xffffff, 1).fillRect(4, 0, 6, 2); g.fillStyle(0xffffff, .5).fillRect(0, 0, 4, 2); g.generateTexture('sea_streak', 10, 2); g.destroy(); }
  sc.streaks = [];
  for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) {
    const k = K(x, y);
    if (k === '*') sc.add.image(x * T + 8, y * T + 15, 'sea', 'sea_rock').setOrigin(.5, 1).setScale(.82).setFlipX(hash(x, y) > .5).setDepth(y * T + 14);
    const d = CURRENT[k];
    if (d) for (let n = 0; n < 2; n++) {
      const s = sc.add.image(0, 0, 'sea_streak').setDepth(1.7).setAngle({ right: 0, left: 180, down: 90, up: -90 }[d]);
      sc.streaks.push({ s, x: x * T + 8, y: y * T + 4 + n * 8 + (d === 'up' || d === 'down' ? -4 + n * 0 : 0), ox: d === 'up' || d === 'down' ? -3 + n * 6 : 0, v: DV[d], ph: hash(x * 7 + n, y * 3) * 16 });
    }
  }
  if (sc.scene.key === 'shoals') whaleSetup(sc);
  // the boat, with you at the wheel
  for (let r = 0; r < 4; r++) { const k = 'sail_' + DIRS[r]; if (!sc.anims.exists(k)) sc.anims.create({ key: k, frames: sc.anims.generateFrameNumbers('boat_sail', { frames: [r * 2, r * 2 + 1] }), frameRate: 2.5, repeat: -1 }); }
  sc.boatSpr = sc.add.sprite(0, 0, 'boat_sail', 0).setOrigin(.5, 1);
  const f0 = sc.fastAt; sc.fastAt = (x, y) => !!sc.forceDir || (f0 ? f0.call(sc, x, y) : false);
  sc.forceDir = null;
  if (RC.storm) { FX.set('storm', false); updateHUD(); }
  const first = { glimmer: 'sailed', stormwatch: 'stormSeen', shoals: 'shoalsSeen' }[sc.scene.key];
  const intro = { glimmer: 'The Glimmer Sea! Stormwatch Strait and Beaconreach lie to the north. Wild Fablemon swim in the choppy water.',
    stormwatch: 'Stormwatch Strait. Rain lashes the deck and the torrents run wild. Beaconreach is somewhere beyond them.',
    shoals: 'Tidewrack Shoals. The torrents here have wrecked many boats. Pick your way carefully!' }[sc.scene.key];
  if (!S.flags[first]) { S.flags[first] = 1; setTimeout(() => toast(intro, 3800), 700); }
  else setTimeout(() => toast(RC.name, 1800), 600);
}
function seaFrame(sc, dt) {
  const b = sc.boatSpr, p = sc.p; if (!b || !p) return;
  sc.player.setVisible(false); if (sc.fol) sc.fol.spr.setVisible(false);
  const k = 'sail_' + p.dir; if (b.anims.currentAnim?.key !== k) b.play(k);
  b.setPosition(sc.player.x, sc.player.y + 5).setDepth(sc.player.depth);
  // torrent foam drifts the way the water runs
  const t = sc.time.now / 1000;
  const v = sc.cameras.main.worldView;
  for (const s of sc.streaks) { if (s.x < v.x - 16 || s.x > v.right + 16 || s.y < v.y - 16 || s.y > v.bottom + 16) continue; const f = ((t * 26 + s.ph) % 16) / 16; s.s.setPosition(s.x + s.ox + s.v[0] * (f * 16 - 8), s.y + s.v[1] * (f * 16 - 8)).setAlpha(Math.sin(f * Math.PI) * .85); }
  // a little wake behind the boat while it moves
  sc.wakeT = (sc.wakeT || 0) + dt;
  if (p.moving && sc.wakeT > .14) {
    sc.wakeT = 0; const [dx, dy] = DV[p.dir];
    const w = sc.add.ellipse(b.x - dx * 14, b.y - 4 - dy * 8, 8, 3, 0xffffff, .55).setDepth(1.6);
    sc.tweens.add({ targets: w, scaleX: 2.2, alpha: 0, duration: 700, onComplete: () => w.destroy() });
  }
}
// sailing onto a torrent: it takes the wheel until something stops you
function seaArrive(sc, x, y) {
  const d = CURRENT[sc.R.kind[y * RW + x]];
  const was = sc.forceDir; sc.forceDir = d || null;
  if (d) { sc.p.path = []; sc.p.pending = null; if (!was) Sound.play('water'); }
}
// the empty boat moored beside the pier, once Hal has finished her
function mooredBoat(sc) {
  if (!boatReady()) return;
  const b = sc.add.image(21 * T + 4, 6 * T + 20, 'boat_sail', 8).setOrigin(.5, 1).setDepth(6 * T + 15);
  sc.tweens.add({ targets: b, y: b.y + 1, yoyo: true, repeat: -1, duration: 1100, ease: 'Sine.inOut' });
}
function sailDoor(sc, id) {
  if (id === 'cv_sail') {
    if (!boatReady()) return toast('Hal is still building your boat.', 2000);
    if (!team().some(m => m.hp > 0)) return toast('Your Fablemon are too tired for a sea crossing. Rest them first.', 2400);
    Sound.play('door'); toast('You climb aboard and cast off!', 1600);
    return travel(sc, 'glimmer', ROUTES.glimmer.spawn);
  }
  if (id === 'cv_beacon') { Sound.play('door'); toast('You tie up at the Beaconreach jetty and climb ashore.', 1800); return travel(sc, 'beaconreach', ROUTES.beaconreach.spawn); }
  if (id === 'cv_whale') return whaleFight(sc);
  if (id === 'cv_isles') { Sound.play('door'); return toast("A bleached driftwood sign: THE SECRET ISLES. Whoever put it here didn't want visitors. The sand beyond is untouched...", 4500); }
}
QUESTS.splice(QUESTS.findIndex(q => q.id === 'boat') + 1, 0,
  { id: 'sail', name: 'Sail to Beaconreach', hint: "Your boat is moored beside the Driftwood Cove pier. Sail north across the Glimmer Sea, then find a way through the torrents of Stormwatch Strait to Beaconreach's harbour.", done: () => !!(S.visited && S.visited.beaconSighted), reward: { gold: 2500, items: { tonic: 3 } } },
  { id: 'isles', name: 'Find the Secret Isles', hint: 'Sailors at the Cove whisper about islands hidden behind the torrents south of the Glimmer Sea.', done: () => !!(S.visited && S.visited.islesFound), reward: { gold: 3000, items: { mon_treat: 3 } } });
Object.assign(EXTRA_HABITAT, { nipshade_2: 'The rough water of the Glimmer Sea, Tidewrack Shoals and Stormwatch Strait' });
/* ---------- the ice whale (Orrin's request): a two-phase boss in the lagoon at the Secret Isles */
const WHALE_AT = { x: 34, y: 30 };
function whaleSetup(sc) {
  const k = WHALE_AT.x + ',' + WHALE_AT.y, on = (S.flags.whaleAsked || (S.crests && S.crests.spark)) && !S.flags.whaleBeaten;
  if (!on) { if (ROUTE_SIGNS[k] === '__door:cv_whale') delete ROUTE_SIGNS[k]; return; }
  ROUTE_SIGNS[k] = '__door:cv_whale'; sc.R.blocked[WHALE_AT.y * RW + WHALE_AT.x] = 1;
  monAnims(sc, 'floecalf_2');
  const w = sc.whale = sc.add.sprite(WHALE_AT.x * T + 8, WHALE_AT.y * T + 18, 'mon_floecalf_2', 4).setOrigin(.5, 1).setScale(1.6).setDepth(WHALE_AT.y * T + 15);
  w.play('floecalf_2_left');
  sc.tweens.add({ targets: w, y: w.y + 3, yoyo: true, repeat: -1, duration: 1500, ease: 'Sine.inOut' });
  const ring = sc.add.ellipse(w.x, w.y - 2, 70, 16, 0xe8f8ff, .35).setDepth(1.8);
  sc.tweens.add({ targets: ring, scaleX: 1.3, scaleY: 1.3, alpha: .08, yoyo: true, repeat: -1, duration: 1500 });
  sc.whaleRing = ring;
}
function whaleFight(sc) {
  if (!team().some(m => m.hp > 0)) return toast('Your Fablemon are too tired to face the whale. Rest them first.', 2400);
  const N = t => ({ name: '???', img: monPic('floecalf_2'), t });
  S.seen.floecalf_2 = 1;
  Talk.say([N('The water in the lagoon turns to slush. Frost creeps across your deck...'), N('A mountain of ice rises from the deep. Two cold yellow eyes fix on your boat!')], () => {
    const mk = () => { const m = wildMon('floecalf_2', 47); m.iv = { hp: 9, atk: 9, def: 9, spd: 9 }; m.moves = ['icebergbreach', 'rimewave', 'millrace', 'chillmist'].filter(id => MOVES[id]); m.hp = monStat(m, 'hp'); return m; };
    const team2 = [mk(), mk()];
    sc.cameras.main.shake(400, .008);
    Battle.start(team2[0], { label: 'the', name: 'Ice Whale', team: team2, prize: 3000, heals: 0,
      intro: ['The Ice Whale attacks!', "It's Rimeback, the berg-backed whale terrorising Orrin's boats!"],
      phase2: ['The Ice Whale crashes back up through the lagoon!', 'It isn\'t finished yet. Its iceberg back cracks and glows with fury!'],
      onWin: () => {
        S.flags.whaleBeaten = 1; delete ROUTE_SIGNS[WHALE_AT.x + ',' + WHALE_AT.y]; sc.R.blocked[WHALE_AT.y * RW + WHALE_AT.x] = 0;
        setTimeout(() => {
          if (sc.whale) sc.tweens.add({ targets: [sc.whale, sc.whaleRing], alpha: 0, y: '+=10', duration: 1200, onComplete: () => { sc.whale && sc.whale.destroy(); sc.whaleRing && sc.whaleRing.destroy(); } });
          toast('The Ice Whale sinks beneath the lagoon and swims off into the deep. The seas are safe again! Go and tell Orrin.', 4000);
        }, 700);
      } });
  });
}
const SEA_SCENES = ['glimmer', 'shoals', 'stormwatch'].map(k => class extends Crag { constructor() { super(k); } });
