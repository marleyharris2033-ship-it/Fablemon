/* ============================================================ Beaconreach
   The stormy lighthouse island at the top of Stormwatch Strait. Tie up at the strait's jetty to come ashore.
   It is always raining here. A clinic, the Beaconreach Chandlery, the harbour office (sail home from here),
   two cottages, and the lighthouse, where Warden Orrin Brightwell waits on the lamp gallery at the top.
   The town is drawn from text with the beach painter (~ sea, . sand, ; grass, , boardwalk);
   buildings and props come from the 'br' atlas (tools/art/cut_beacon.py). */
const BR_MAP = [
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~.~.......~..~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~...................~~~~~~~~~~~~~",
  "~~~~~~~~~~........;;;;;;;;.......~~~~~~~~~~~",
  "~~~~~~~~~.....;;;;;;;;;;;;;;;;....~~~~~~~~~~",
  "~~~~~~~.....;;;;;;;;;;;;;;;;;;;;.....~~~~~~~",
  "~~~~~~~....;;;;;;;;;;;;;;;;;;;;;;.....~~~~~~",
  "~~~~~....;;;;;;;;;;;;;;;;;;;;;;;;;;....~~~~~",
  "~~~~~...;;;;;;;;;;;;;;;;;;;;;;;;;;;;....~~~~",
  "~~~....;;;,;;;;;;;;;;;;;;;;;;;;;;;;;;....~~~",
  "~~~....;;;,;;;;;;;;;;;;;;;;;;;;;;;;;;;...~~~",
  "~~~..;;;;;,;;;;;;;;;;;;;;;;;;;;;;;;;;;;...~~",
  "~~...;;;,,,,,,,,,,,,,,,,,,,,,,,,,,,,,;;...~~",
  "~~....;;,,,,,,,,,,,,,,,,,,,,,,,,,,,,,;....~~",
  "~~...;;;;;;;;;;;;;;;;,,;;;;;;;;;;;;;;;....~~",
  "~~...;;;;;;;;;;;;;;;;,,;;;;;;;;;;;;;;;;...~~",
  "~~...;;;;;;;;;;;;;;;;,,;;;;;;;;;;;;;;;;...~~",
  "~~...;;;;;;;;;;;;;;;;,,;;;;;;;;;;;;;;;;...~~",
  "~~....;;;;;;;;;;;;;;;,,;;;;;;;;;;;;;;;...~~~",
  "~~~...;;;;;;;;;;;;;;;,,;;;;;;;;;;;;;;;...~~~",
  "~~~~..,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,...~~~",
  "~~~~..,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,..~~~~",
  "~~~~~...;;;;;;;;;;;;;,,;;;;;;;;;;;;;....~~~~",
  "~~~~~~...;;;;;;;;....,,...............~~~~~~",
  "~~~~~~....;;;;;;;....,,...............~~~~~~",
  "~~~~~~~~....;;;;;....,,.............~~~~~~~~",
  "~~~~~~~~.......;;....,,............~~~~~~~~~",
  "~~~~~~~~~~~..........,,..........~~~~~~~~~~~",
  "~~~~~~~~~~~~~........,,,,,,,,.~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~....,,,,,,,,~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~,,~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~,,~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~,,~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~,,~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~,,~~~~~~~~~~~~~~~~~~~~~"
];
CREST_INFO.spark = ['⚡ Spark Crest', '#d9b21e'];
{ const h = CREST_INFO.hearth; delete CREST_INFO.hearth; CREST_INFO.hearth = h; }   // keep Rowan's crest last
const LIGHT_AT = { cx: 10, by: 9 };
ROUTES.beaconreach = {
  name: 'Beaconreach', w: 44, h: 36, ascii: BR_MAP, crag: true, beach: true, town: true, storm: true, zones: [], paths: [], ponds: [], bridge: null, open: [], clear: [],
  pickups: [{ id: 'br1', x: 38, y: 11, item: 'mon_treat', n: 3 }, { id: 'br2', x: 4, y: 15, gold: 4000 }],
  buildings: [
    { id: 'br_lighthouse', atlas: 'br', frame: 'br_lighthouse', cx: LIGHT_AT.cx, by: LIGHT_AT.by, door: 0, name: 'Beaconreach Lighthouse' },
    { id: 'br_clinic', atlas: 'br', frame: 'br_clinic', cx: 30, by: 12, door: 0, name: 'Beaconreach Clinic' },
    { id: 'br_shop', atlas: 'br', frame: 'br_shop', cx: 16, by: 19, door: -2, name: 'Beaconreach Chandlery' },
    { id: 'br_cottage', atlas: 'br', frame: 'br_cottage', cx: 8, by: 20, door: 0, name: 'Net-mender\'s Cottage' },
    { id: 'br_lookout', atlas: 'br', frame: 'br_lookout', cx: 34, by: 20, door: 1, name: 'The Lookout' },
    { id: 'br_harbour', atlas: 'br', frame: 'br_harbour', cx: 28, by: 28, door: -1, name: 'Harbour Office' },
  ],
  brprops: [
    ['lens', 15, 10], ['oil_cart', 4, 9], ['lamp_bench', 16, 11], ['lantern_post', 11, 12], ['lantern_post', 20, 12], ['lantern_post', 23, 20],
    ['lantern_post', 20, 27], ['lantern_post', 23, 31], ['windsock', 36, 25], ['signal_flags', 34, 27], ['tide_clock', 24, 27], ['bell_frame', 20, 30],
    ['lifebuoy_post', 20, 33], ['lifebuoy_post', 23, 34], ['telescope', 37, 18], ['oilskin_rack', 20, 18], ['rowboat', 13, 27], ['well', 26, 17],
    ['bench', 18, 15], ['bench', 32, 15], ['dune_grass', 6, 24], ['dune_grass', 38, 8], ['dune_grass', 3, 18], ['dune_grass', 29, 4], ['dune_grass', 9, 27],
    ['planter', 26, 11], ['planter', 12, 17], ['planter', 30, 19],
  ],
  signs: { '23,29': 'Beaconreach. The light that never goes out. Mind the rocks, mind the weather, mind the Warden.', '12,13': "Beaconreach Lighthouse. Warden Orrin Brightwell keeps the lamp. Challengers: climb to the gallery!" },
  npcs: [], trainers: [],
  exits: [{ r: [21, 35, 22, 35], to: () => ['stormwatch', { x: 24, y: 11, dir: 'down' }] }],
  spawn: { x: 21, y: 33, dir: 'up' }, enc: { day: [['stormveil', 1]], night: [['stormveil', 1]] },
};
// at the strait's jetty you can now tie up and go ashore
ROUTES.stormwatch.signs['24,10'] = '__door:cv_beacon';

function beaconSetup(sc) {
  for (const [f, x, y] of RC.brprops || []) {
    const im = sc.add.image(x * T + 8, y * T + 16, 'br', 'br_' + f).setOrigin(.5, 1).setDepth(y * T + 15);
    if (f === 'lantern_post') sc.glow(x * T + 11, y * T - 8);
  }
  // the lamp: a slow sweeping beam and a warm halo
  const lx = LIGHT_AT.cx * T - 24, ly = LIGHT_AT.by * T - 124;
  if (!sc.textures.exists('br_beam')) {
    const c = document.createElement('canvas'); c.width = 320; c.height = 80; const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 320, 0); gr.addColorStop(0, 'rgba(255,230,150,.55)'); gr.addColorStop(1, 'rgba(255,230,150,0)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(0, 36); g.lineTo(320, 0); g.lineTo(320, 80); g.lineTo(0, 44); g.closePath(); g.fill();
    sc.textures.addCanvas('br_beam', c);
  }
  const beam = sc.add.image(lx, ly, 'br_beam').setOrigin(0, .5).setBlendMode(Phaser.BlendModes.ADD).setDepth(9e6 - 25).setAlpha(.8);
  sc.tweens.add({ targets: beam, angle: 360, duration: 9000, repeat: -1 });
  const halo = sc.add.circle(lx, ly, 22, 0xffd88a, .3).setBlendMode(Phaser.BlendModes.ADD).setDepth(9e6 - 25);
  sc.tweens.add({ targets: halo, alpha: .14, scale: 1.2, yoyo: true, repeat: -1, duration: 1300 });
  // your boat, tied up at the end of the pier
  const b = sc.add.image(24 * T, 34 * T + 22, 'boat_sail', 8).setOrigin(.5, 1).setDepth(34 * T + 15);
  sc.tweens.add({ targets: b, y: b.y + 1, yoyo: true, repeat: -1, duration: 1100, ease: 'Sine.inOut' });
  if (!S.flags.beaconSeen) { S.flags.beaconSeen = 1; setTimeout(() => toast('Beaconreach. Rain hammers the slate roofs, and high above, the great lamp turns.', 3400), 700); }
}

/* ---------- doors */
const BR_SHOP = [['tonic', 260], ['mon_treat', 600], ['sturdy_charm', 130], ['swift_feather', 900], ['heartwood_charm', 1600], ['spark_sigil', 2000, 4]];
function beaconDoor(sc, id) {
  if (id === 'br_lighthouse') {
    if (!S.crests || !S.crests.stone) return toast("The lighthouse door is bolted. A note: 'Gone up top. Come back with Granger's Stone Crest and I'll let you up. - O.B.'", 3400);
    Sound.play('door'); return travel(sc, 'brlight', { x: 5, y: 12, dir: 'down' });
  }
  Sound.play('door');
  if (id === 'br_clinic') return openModal('Beaconreach Clinic', '<p>The nurse wrings out her sleeves by the stove. "Through the strait in this? Sit by the fire, all of you. Tea\'s on."</p><div class="row"><button class="btn gold" data-a="heal">Heal my team</button></div>', a => {
    if (a === 'heal') { S.mons.forEach(restMon); refreshTeamBtn(); Sound.play('fill'); toast('Your Fablemon are fully healed and their moves are restored!', 2400); closeModal(); }
  });
  if (id === 'br_shop') {
    const render = () => `<p>Lanterns swing from every beam of the chandlery. "Oilskins, rope, lamp oil and a few charms for the brave," says the shopkeeper. "Orrin buys half my stock himself."</p><div class="mlist">${BR_SHOP.map(([i, p, c]) => shopRow(i, p, c || 0, 1)).join('')}</div>`;
    return openModal('Beaconreach Chandlery', render(), (a, d) => { if (a === 'buy') buy(d.id, +d.p, +d.n || 1); $('mBody').innerHTML = render(); });
  }
  if (id === 'br_harbour') return openModal('Harbour Office', '<p>The harbourmaster taps a chart covered in pencilled torrents. "Your boat\'s tied up at the end of the pier. If you\'d rather not fight the strait twice, I\'ll have the tide boys tow you straight home to Driftwood Cove."</p><div class="row" style="display:flex;gap:6px"><button class="btn gold" data-a="cove">Sail home to Driftwood Cove</button><button class="btn" data-a="no">Not yet</button></div>', a => {
    closeModal(); if (a === 'cove') travel(sc, 'driftwood', { x: 19, y: 6, dir: 'down' });
  });
  if (id === 'br_lookout') return toast('Through the lookout window, an old sailor waves from behind a brass telescope. "Seen a whale out past the shoals! A white one, made of ice!"', 3400);
  if (id === 'br_cottage') return toast("Nets are drying by the stove. A voice calls through the door: \"Orrin? If that's you, the kettle's on. If it's not, the kettle's still on.\"", 3400);
}

/* ---------- Warden Orrin Brightwell */
TRAINER_TYPES.orrin = { label: 'Warden', challenge: ['Let the storm decide!'], lose: ['Ha! What a strike!'], after: ['Thunder is just the sky cheering.'] };
TRAINER_ROW.orrin = 12;
// Spark Fablemon from the old routes and the strait's own sea creatures; Squalljaw is his ace
const ORRIN_TEAM = [['moonspark', 40], ['foilfin_2', 41], ['stormveil_3', 42], ['kilnback_2', 42], ['inkwick_2', 43], ['riftshear_2', 44]];
function orrin(sc) {
  const O = (t, f = 0) => ({ who: 'trainer', name: 'Warden Orrin', img: trainerPic('orrin', f), t });
  if (S.crests && S.crests.spark) return Talk.say([O(pick(["Thunder's just the sky cheering. Come and listen to it with me any time!", "The lamp's lit, the strait's wild, and you're still standing. Perfect night!", "Keep that Spark Crest close. It hums when a storm's coming."]), 1)]);
  if (!team().some(m => m.hp > 0)) return toast('Your Fablemon are too tired to battle. Rest them first.', 2400);
  Talk.say([O('You came through the strait in THIS? Ha! Now that\'s a sailor!', 1),
    O("Orrin Brightwell. I keep the lamp. Every night, every storm, no matter what. Nobody's been lost out there since I took it on, and nobody will be."),
    O("But a Warden's got to know who's crossing his water. Thunder's just the sky cheering, sailor. Let's give it something to cheer about!", 1)], () => {
    const tm = ORRIN_TEAM.map(wardenMon);
    Battle.start(tm[0], { label: 'Warden', name: 'Orrin', team: tm, prize: 5500, boss: true, heals: 2, lose: 'The storm always wins in the end. Dry off and come back swinging!', onWin: () => {
      S.crests = S.crests || {}; S.crests.spark = 1; giveSigil('spark'); S.trainers = S.trainers || {}; S.trainers.orrin = 1;
      setTimeout(() => { Sound.play('gotcha'); Talk.say([O('HA! What a strike! I felt that one in my boots!', 1), O("The storm always passes. But you? You're the kind of lightning that stays."), O('Here: the Spark Crest. It hums when a storm is coming. Wear it out on the water and you\'ll never be caught off guard.', 1)]); }, 600);
    } });
  });
}

/* ---------- the lamp gallery at the top of the lighthouse (Orrin's arena): one painted picture, 30 x 20 tiles */
const LG_W = 30, LG_H = 20, LG_BOSS = { x: 16, y: 13 }, LG_DOOR = { x: 5, y: 11 };
const LG_WALK = (() => { const s = new Set(); for (let y = 12; y <= 19; y++) for (let x = 1; x <= 26 + (y > 15 ? 1 : 0); x++) s.add(x + ',' + y); s.add(LG_DOOR.x + ',' + LG_DOOR.y); return s; })();
class BrLight extends World {
  constructor() { super('brlight'); }
  create() {
    this.initWorld(LG_W, LG_H);
    this.add.rectangle(-300, -300, LG_W * T + 600, LG_H * T + 600, 0x0a0a1a).setOrigin(0).setDepth(-20);
    this.add.image(0, 0, 'gym_br').setOrigin(0).setScale(.5).setDepth(-10);
    const lamp = this.add.circle(6.4 * T, 3.2 * T, 34, 0xffd27a, .22).setBlendMode(Phaser.BlendModes.ADD).setDepth(9e6 - 10);
    this.tweens.add({ targets: lamp, alpha: .1, scale: 1.15, yoyo: true, repeat: -1, duration: 1400 });
    for (let r = 0; r < 4; r++) { const k = `orrin_${DIRS[r]}`; if (!this.anims.exists(k)) this.anims.create({ key: k, frames: this.anims.generateFrameNumbers('tr_orrin', { frames: [r * 4 + 1, r * 4, r * 4 + 3, r * 4] }), frameRate: 6, repeat: -1 }); }
    this.boss = this.add.sprite(LG_BOSS.x * T + 8, LG_BOSS.y * T + 15, 'tr_orrin', 0).setOrigin(.5, 1).setDepth(LG_BOSS.y * T + 15);
    this.shadow(this.boss, 12, 5);
    const sp = S.spawn && S.spawn.scene === 'brlight' ? S.spawn : { x: 5, y: 12, dir: 'down' };
    this.makePlayer(sp);
    const cam = this.cameras.main;
    cam.setBounds(-T * 2, -T, (LG_W + 4) * T, (LG_H + 2) * T); cam.startFollow(this.player, true, 1, 1); cam.setRoundPixels(true);
    this.applyZoom(); this.scale.on('resize', this.onResize, this); this.events.once('shutdown', () => this.scale.off('resize', this.onResize, this));
    this.setupInput(); Sound.theme('route'); updateHUD(); renderHotbar(); FX.set('storm', false); this.fadeIn();
    if (!S.flags.galleryGseen) { S.flags.galleryGseen = 1; setTimeout(() => toast("The lamp gallery. Rain sweeps across the stones, and Orrin is waiting by the railing.", 3200), 600); }
  }
  onResize() { this.applyZoom(); renderHotbar(); }
  passable(x, y) { return LG_WALK.has(x + ',' + y) && !(x === LG_BOSS.x && y === LG_BOSS.y); }
  bossNear(x, y) { return Math.abs(x - LG_BOSS.x) + Math.abs(y - LG_BOSS.y) === 1; }
  talk() { this.face(LG_BOSS.x, LG_BOSS.y); const p = this.p; this.boss.setFrame(DIRS.indexOf(p.x < LG_BOSS.x ? 'left' : p.x > LG_BOSS.x ? 'right' : p.y < LG_BOSS.y ? 'up' : 'down') * 4); p.busy = .4; orrin(this); }
  actFacing() {
    const p = this.p; if (p.moving || this.paused || p.busy > 0) return;
    const [dx, dy] = DV[p.dir];
    if (p.x + dx === LG_BOSS.x && p.y + dy === LG_BOSS.y) return this.talk();
    if (eatHeld()) p.busy = .4;
  }
  act() { this.talk(); }
  onTap(wx, wy) {
    if (this.paused || this.sleeping || controlMode() !== 'tap') return;
    const x = Math.floor(wx / T), y = Math.floor(wy / T), p = this.p;
    if (this.boss.getBounds().contains(wx, wy) || (x === LG_BOSS.x && y === LG_BOSS.y)) {
      if (this.bossNear(p.x, p.y) && !p.moving) return this.talk();
      const path = this.path((a, b) => this.bossNear(a, b)); if (path) { p.path = path; p.pending = { tr: 1 }; } return;
    }
    if (this.passable(x, y)) { const path = this.path((a, b) => a === x && b === y); if (path) { p.path = path; p.pending = null; } }
  }
  tapGoal() { }
  arrived() { const p = this.p; if (!p.path.length && p.pending) { p.pending = null; this.talk(); } this.arriveHook(p.x, p.y); }
  arriveHook(x, y) { if (x === LG_DOOR.x && y === LG_DOOR.y) { Sound.play('door'); travel(this, 'beaconreach', { x: LIGHT_AT.cx, y: LIGHT_AT.by + 1, dir: 'down' }); } }
}
QUESTS.splice(QUESTS.findIndex(q => q.id === 'sail') + 1, 0,
  { id: 'spark', name: 'Earn the Spark Crest from Warden Orrin', hint: "Tie up at the Beaconreach jetty, then climb the lighthouse. Orrin waits on the lamp gallery at the top.", done: () => !!(S.crests && S.crests.spark), reward: { gold: 3000, items: { mon_treat: 3 } } });
const BEACON_SCENES = [class extends Crag { constructor() { super('beaconreach'); } }, BrLight];
