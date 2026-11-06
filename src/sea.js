/* ============================================================ The Glimmer Sea
   Board Hal's finished boat, moored beside the Driftwood Cove pier, and sail north-west to Beaconreach.
   The sea is drawn from text like the beach maps, but here the water is where you can go:
     ~ open sea   0-9 rough water where wild Fablemon swim (zones)   . sand   # dune bank   , jetty
   Props (rocks, reefs, buoys, islets, a wreck) come from the 'sea' atlas and block the tiles under them.
   The player is drawn as the boat (boat_sail.png: rows down, left, right, up; 2 bob frames each).
   Art: tools/art/cut_sea.py. */
const GLIMMER_MAP = [
  "###########...~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "###########...~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "##########....~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "##########....~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "#########....~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "#######.....~~~~~~~~~~~222~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "#####......~~,~~~~~~22222222~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  ".........~~~~,~~~~~22222222222~~~~~~~~~~~~~~~~~~~~~~~~~~",
  ".......~~~~~~,~~~~~22222222222~~~~~~~~~~~~22~~~~~~~~~~~~",
  "~~~~~~~~~~~~~,,,,~~22222222222~~~~~2222222222~~~~~~~~~~~",
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
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~0000000000~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~00~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"
];
const SEA_ENC = {
  day: [['reefarer', 18], ['brookstride', 14], ['mirebellows', 12], ['lotveil', 10], ['whirlwyn', 10], ['stormveil', 9], ['reefarer_cotton', 7], ['nipshade_2', 6], ['marshviper', 4]],
  night: [['stormveil', 18], ['nipshade_2', 14], ['mirebellows', 13], ['reefarer', 12], ['duskcloak', 10], ['marshviper', 8], ['lotveil', 8]],
};
const boatReady = () => ((S.cove || {}).stage || 0) >= 4;
Object.assign(ROUTES, {
  glimmer: { name: 'Glimmer Sea', w: 56, h: 44, ascii: GLIMMER_MAP, crag: true, beach: true, sail: true, quiet: true,
    zones: [[0, 0, 0, 0, 37, 39], [0, 0, 0, 0, 38, 40], [0, 0, 0, 0, 39, 41]],
    paths: [], ponds: [], bridge: null, open: [], clear: [],
    pickups: [{ id: 'gs1', x: 24, y: 35, item: 'tonic', n: 3 }, { id: 'gs2', x: 53, y: 14, gold: 3000 }, { id: 'gs3', x: 12, y: 31, item: 'mon_treat', n: 2 }, { id: 'gs4', x: 30, y: 4, item: 'sturdy_charm', n: 3 }],
    signs: { '16,9': '__door:cv_beacon' },
    trainers: [
      { id: 'gs_t1', kind: 'ponddipper', name: 'Marina', x: 34, y: 28, dir: 'right', sight: 4, team: [['brookstride', 38], ['lotveil', 39]] },
      { id: 'gs_t2', kind: 'birdwatcher', name: 'Skye', x: 8, y: 17, dir: 'right', sight: 4, team: [['whirlwyn', 39], ['reefarer', 39], ['staticwing', 40]] },
      { id: 'gs_t3', kind: 'rambler', name: 'Finn', x: 48, y: 5, dir: 'down', sight: 4, team: [['mirebellows', 40], ['nipshade_2', 40], ['stormveil', 41]] },
    ],
    seaprops: [['buoy_red', 46, 40], ['buoy_teal', 41, 40], ['rock', 30, 37], ['rock_tall', 53, 27], ['reef', 26, 31], ['reef_kelp', 5, 37],
      ['wreck', 48, 21], ['islet', 34, 29], ['island', 8, 18], ['lagoon', 50, 6], ['flotsam', 21, 41], ['flotsam', 37, 3],
      ['buoy_bell', 21, 13], ['rock', 3, 14], ['rock_tall', 27, 2], ['reef', 15, 36], ['buoy_red', 20, 9], ['buoy_teal', 22, 9], ['rock', 52, 34]],
    goal: { area: [14, 8, 21, 12], flag: 'beaconSighted', msg: 'Land ahoy! The lighthouse of Beaconreach rises from the mist.' },
    exits: [{ r: [38, 43, 50, 43], to: () => ['driftwood', { x: 19, y: 6, dir: 'down' }] }],
    spawn: { x: 44, y: 41, dir: 'up' }, enc: SEA_ENC },
});
// tiles a sea prop covers: most of its width, the lower half of its height
function seaFoot(f, x, y, sc) {
  const fr = ASSET.seaJson.frames['sea_' + f].frame, w = Math.max(1, Math.round(fr.w * .8 / T)), h = Math.max(1, Math.round(fr.h * .45 / T)), out = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) out.push([x - Math.floor((w - 1) / 2) + i, y - j]);
  return out;
}
const SEA_FLAT = ['islet', 'island', 'lagoon', 'reef', 'reef_kelp', 'flotsam'];
function seaSetup(sc) {
  for (const [f, x, y] of RC.seaprops || []) sc.add.image(x * T + 8, y * T + 16, 'sea', 'sea_' + f).setOrigin(.5, 1).setDepth(SEA_FLAT.includes(f) ? 2 : y * T + 15);
  for (const s of Object.values(sc.grassSpr || {})) s.destroy();
  sc.grassSpr = {};
  // the boat, with you at the wheel
  for (let r = 0; r < 4; r++) { const k = 'sail_' + DIRS[r]; if (!sc.anims.exists(k)) sc.anims.create({ key: k, frames: sc.anims.generateFrameNumbers('boat_sail', { frames: [r * 2, r * 2 + 1] }), frameRate: 2.5, repeat: -1 }); }
  sc.boatSpr = sc.add.sprite(0, 0, 'boat_sail', 0).setOrigin(.5, 1);
  sc.wake = [];
  if (!S.flags.sailed) { S.flags.sailed = 1; setTimeout(() => toast('The Glimmer Sea! Beaconreach lies to the north-west. Wild Fablemon swim in the choppy water.', 3600), 700); }
  else setTimeout(() => toast('Glimmer Sea', 1800), 600);
}
function seaFrame(sc, dt) {
  const b = sc.boatSpr, p = sc.p; if (!b || !p) return;
  sc.player.setVisible(false); if (sc.fol) sc.fol.spr.setVisible(false);
  const k = 'sail_' + p.dir; if (b.anims.currentAnim?.key !== k) b.play(k);
  b.setPosition(sc.player.x, sc.player.y + 5).setDepth(sc.player.depth);
  // a little wake behind the boat while it moves
  sc.wakeT = (sc.wakeT || 0) + dt;
  if (p.moving && sc.wakeT > .14) {
    sc.wakeT = 0; const [dx, dy] = DV[p.dir];
    const w = sc.add.ellipse(b.x - dx * 14, b.y - 4 - dy * 8, 8, 3, 0xffffff, .55).setDepth(1.6);
    sc.tweens.add({ targets: w, scaleX: 2.2, alpha: 0, duration: 700, onComplete: () => w.destroy() });
  }
}
// the boat moored at the end of the pier, once Hal has finished her
function mooredBoat(sc) {
  if (!boatReady()) return;
  const b = sc.add.image(21 * T + 4, 6 * T + 20, 'boat_sail', 4).setOrigin(.5, 1).setDepth(6 * T + 15);
  sc.tweens.add({ targets: b, y: b.y + 1, yoyo: true, repeat: -1, duration: 1100, ease: 'Sine.inOut' });
}
function sailDoor(sc, id) {
  if (id === 'cv_sail') {
    if (!boatReady()) return toast('Hal is still building your boat.', 2000);
    if (!team().some(m => m.hp > 0)) return toast('Your Fablemon are too tired for a sea crossing. Rest them first.', 2400);
    Sound.play('door'); toast('You climb aboard and cast off!', 1600);
    return travel(sc, 'glimmer', ROUTES.glimmer.spawn);
  }
  if (id === 'cv_beacon') { Sound.play('door'); return toast("A weathered sign on the jetty: BEACONREACH HARBOUR. Moorings closed while the harbour wall is rebuilt. Through the mist you can see the lighthouse beam turning.", 5000); }
}
QUESTS.splice(QUESTS.findIndex(q => q.id === 'boat') + 1, 0,
  { id: 'sail', name: 'Sail the Glimmer Sea', hint: 'Your boat is moored beside the Driftwood Cove pier. Sail north-west across the Glimmer Sea towards Beaconreach.', done: () => !!(S.visited && S.visited.beaconSighted), reward: { gold: 2500, items: { tonic: 3 } } });
Object.assign(EXTRA_HABITAT, { nipshade_2: 'The rough water of the Glimmer Sea' });
const SEA_SCENES = [class extends Crag { constructor() { super('glimmer'); } }];
