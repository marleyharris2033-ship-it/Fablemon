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
  signs: { '23,29': 'Beaconreach. The light that never goes out. Mind the rocks, mind the weather, mind the Warden.', '12,13': "Beaconreach Lighthouse. Warden Orrin Brightwell keeps the lamp. Challengers welcome inside!" },
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
  orrinOutside(sc);
  if (!S.flags.beaconSeen) { S.flags.beaconSeen = 1; setTimeout(() => toast('Beaconreach. Rain hammers the slate roofs, and high above, the great lamp turns.', 3400), 700); }
}

/* ---------- the ice whale quest: Orrin wanders the headland by his lighthouse until it's done */
const whaleReported = () => !!S.flags.whaleReported || !!(S.crests && S.crests.spark);
const ORRIN_ROAM = [6, 10, 18, 12];   // x0, y0, x1, y1: the grass and lane in front of the lighthouse
function orrinOutside(sc) {
  if (whaleReported() || (S.crests && S.crests.spark)) return;
  const R = sc.R, spot = { x: 13, y: 11 };
  for (let r = 0; r < 4; r++) { const k = `orrin_${DIRS[r]}`; if (!sc.anims.exists(k)) sc.anims.create({ key: k, frames: sc.anims.generateFrameNumbers('tr_orrin', { frames: [r * 4 + 1, r * 4, r * 4 + 3, r * 4] }), frameRate: 6, repeat: -1 }); }
  const spr = sc.add.sprite(spot.x * T + 8, spot.y * T + 15, 'tr_orrin', 0).setOrigin(.5, 1).setDepth(spot.y * T + 15);
  sc.shadow(spr, 12, 5);
  const o = sc.orrinNpc = { x: spot.x, y: spot.y, spr };
  const place = () => { R.blocked[o.y * RW + o.x] = 1; ROUTE_SIGNS[o.x + ',' + o.y] = '__door:br_orrin'; };
  const lift = () => { R.blocked[o.y * RW + o.x] = 0; delete ROUTE_SIGNS[o.x + ',' + o.y]; };
  place();
  if (!S.flags.whaleAsked) { const mark = sc.add.text(0, 0, '!', { fontFamily: 'ui-rounded, Nunito, system-ui, sans-serif', fontStyle: 'bold', fontSize: '15px', color: '#ffe35a', stroke: '#2a1e1a', strokeThickness: 3, resolution: 12 }).setOrigin(.5, 1).setDepth(9e6); o.mark = mark; }
  sc.time.addEvent({ delay: 1900, loop: true, callback: () => {
    if (sc.paused || o.talking || o.busy || o.gone || !spr.active) return;
    if (Math.random() < .35) return;
    const [dx, dy] = pick([[1, 0], [-1, 0], [0, 1], [0, -1]]), nx = o.x + dx, ny = o.y + dy, p = sc.p;
    const dir = dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up';
    if (nx < ORRIN_ROAM[0] || ny < ORRIN_ROAM[1] || nx > ORRIN_ROAM[2] || ny > ORRIN_ROAM[3] || R.blocked[ny * RW + nx] || (p && ((p.x === nx && p.y === ny) || (p.x === o.x && p.y === o.y)))) { spr.setFrame(DIRS.indexOf(dir) * 4); return; }
    lift(); o.x = nx; o.y = ny; place(); o.busy = 1; spr.play(`orrin_${dir}`);
    sc.tweens.add({ targets: spr, x: nx * T + 8, y: ny * T + 15, duration: 420, onUpdate: () => spr.setDepth(spr.y), onComplete: () => { o.busy = 0; if (!spr.active) return; spr.stop(); spr.setFrame(DIRS.indexOf(dir) * 4); } });
  } });
  sc.events.on('update', () => { if (o.mark && spr.active) o.mark.setPosition(spr.x, spr.y - 32 + Math.round(Math.sin(sc.time.now / 200))); });
}
function orrinTalk(sc) {
  const o = sc.orrinNpc; if (!o) return;
  const p = sc.p; o.spr.setFrame(DIRS.indexOf(p.x < o.x ? 'left' : p.x > o.x ? 'right' : p.y < o.y ? 'up' : 'down') * 4);
  const O = (t, f = 0) => ({ who: 'trainer', name: 'Orrin', img: trainerPic('orrin', f), t });
  o.talking = 1; const done = () => { o.talking = 0; };
  if (!S.flags.whaleAsked) {
    S.flags.whaleAsked = 1; if (o.mark) { o.mark.destroy(); o.mark = null; }
    return Talk.say([O("Whoa! A boat, through the strait, in THIS? Ha! Now that's a sailor!", 1),
      O("Orrin Brightwell. I keep the lamp up there. Every night, every storm. And I'm the Warden here, if you're after a Crest."),
      O("But I've got a problem first, and maybe you're the one to fix it. Something's been smashing up the fishing boats. Three this month."),
      O("A whale. A white one, big as a church, made of ice. It's made its den in the lagoon at the Secret Isles, past the Tidewrack Shoals."),
      O("Nobody's getting hurt on my water. Not while I keep this light. Go and drive it off, and I'll open the lighthouse and give you the fight of your life!", 1)], done);
  }
  if (!S.flags.whaleBeaten) return Talk.say([O(pick(["The whale's in the lagoon at the Secret Isles. South of the Glimmer Sea, through the Tidewrack Shoals. Watch the torrents!", "Another boat came in with its hull cracked like an egg this morning. That whale's getting bolder.", "Bring warm Fablemon. Ember ones. That thing breathes frost."]), 0)], done);
  S.flags.whaleReported = 1;
  return Talk.say([O("You did it?! The whole harbour's talking! The boats went out this morning and came back without a scratch!", 1),
    O("I owe you, sailor. And I keep my word. The lighthouse is open. Meet me inside, and bring your best.", 1)], () => {
    o.gone = 1; sc.tweens.killTweensOf(o.spr); o.spr.stop(); done(); sc.tweens.add({ targets: o.spr, alpha: 0, duration: 700, onComplete: () => { sc.R.blocked[o.y * RW + o.x] = 0; delete ROUTE_SIGNS[o.x + ',' + o.y]; o.spr.destroy(); sc.orrinNpc = null; } });
    toast('Orrin heads into the lighthouse.', 2000);
  });
}

/* ---------- doors */
const BR_SHOP = [['tonic', 260], ['mon_treat', 600], ['sturdy_charm', 130], ['swift_feather', 900], ['heartwood_charm', 1600], ['spark_sigil', 2000, 4]];
function beaconDoor(sc, id) {
  if (id === 'br_orrin') return orrinTalk(sc);
  if (id === 'br_lighthouse') {
    if (!whaleReported()) return toast(S.flags.whaleAsked ? "The lighthouse door is bolted. Orrin won't open up until that whale's been dealt with." : "The lighthouse door is bolted. The keeper must be out somewhere on the headland.", 3000);
    Sound.play('door'); return travel(sc, 'brlight', { x: 10, y: 26, dir: 'up' });
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

/* ---------- inside the lighthouse (Orrin's battle room): one painted picture, 21 x 28 tiles */
const LG_W = 21, LG_H = 28, LG_BOSS = { x: 10, y: 9 };
const LG_WALK = (() => {
  const s = new Set(), r = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) s.add(x + ',' + y); };
  r(3, 9, 15, 10);      // the floor in front of the winch
  r(6, 11, 14, 20);     // the compass floor between the workshop and the chart desk
  r(7, 21, 14, 23);
  r(8, 24, 12, 27);     // the steps in
  return s;
})();
class BrLight extends World {
  constructor() { super('brlight'); }
  create() {
    this.initWorld(LG_W, LG_H);
    this.add.rectangle(-300, -300, LG_W * T + 600, LG_H * T + 600, 0x0a0808).setOrigin(0).setDepth(-20);
    this.add.image(0, 0, 'gym_br').setOrigin(0).setScale(.5).setDepth(-10);
    for (const [x, y] of [[8.7, 3.3], [12.2, 3.3], [18.2, 4.5], [4.3, 13.5], [17.2, 14.7], [7.4, 22.8], [13.5, 22.8]]) {
      const g = this.add.circle(x * T, y * T, 14, 0xffc870, .14).setBlendMode(Phaser.BlendModes.ADD).setDepth(9e6 - 10);
      this.tweens.add({ targets: g, alpha: .05, yoyo: true, repeat: -1, duration: 1200 + Math.random() * 700 });
    }
    for (let r = 0; r < 4; r++) { const k = `orrin_${DIRS[r]}`; if (!this.anims.exists(k)) this.anims.create({ key: k, frames: this.anims.generateFrameNumbers('tr_orrin', { frames: [r * 4 + 1, r * 4, r * 4 + 3, r * 4] }), frameRate: 6, repeat: -1 }); }
    this.boss = this.add.sprite(LG_BOSS.x * T + 8, LG_BOSS.y * T + 15, 'tr_orrin', 0).setOrigin(.5, 1).setDepth(LG_BOSS.y * T + 15);
    this.shadow(this.boss, 12, 5);
    const sp = S.spawn && S.spawn.scene === 'brlight' ? S.spawn : { x: 10, y: 26, dir: 'up' };
    this.makePlayer(sp);
    const cam = this.cameras.main;
    cam.setBounds(-T * 2, -T, (LG_W + 4) * T, (LG_H + 2) * T); cam.startFollow(this.player, true, 1, 1); cam.setRoundPixels(true);
    this.applyZoom(); this.scale.on('resize', this.onResize, this); this.events.once('shutdown', () => this.scale.off('resize', this.onResize, this));
    this.setupInput(); Sound.theme('route'); updateHUD(); renderHotbar(); FX.set('storm', true); this.fadeIn();
    if (!S.flags.lightInSeen) { S.flags.lightInSeen = 1; setTimeout(() => toast("Inside the lighthouse. Rain rattles the windows, the great winch ticks, and Orrin is waiting on the compass floor.", 3400), 600); }
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
  arriveHook(x, y) { if (y >= LG_H - 1) { Sound.play('door'); travel(this, 'beaconreach', { x: LIGHT_AT.cx, y: LIGHT_AT.by + 1, dir: 'down' }); } }
}
QUESTS.splice(QUESTS.findIndex(q => q.id === 'sail') + 1, 0,
  { id: 'whale', get name() { return S.flags.whaleAsked ? 'Drive off the ice whale for Orrin' : 'Find Orrin, the lighthouse keeper, at Beaconreach'; }, get hint() { return S.flags.whaleBeaten ? 'Tell Orrin the whale is gone. He wanders the headland by his lighthouse.' : S.flags.whaleAsked ? "The whale lurks in the lagoon at the Secret Isles, past the torrents of Tidewrack Shoals (south of the Glimmer Sea)." : "Find the lighthouse keeper on the headland at Beaconreach."; }, done: () => !!S.flags.whaleReported, reward: { gold: 2000, items: { tonic: 3 } } },
  { id: 'spark', name: 'Earn the Spark Crest from Warden Orrin', hint: "Tie up at the Beaconreach jetty, then head into the lighthouse at the top of the town. Orrin waits inside.", done: () => !!(S.crests && S.crests.spark), reward: { gold: 3000, items: { mon_treat: 3 } } });
const BEACON_SCENES = [class extends Crag { constructor() { super('beaconreach'); } }, BrLight];
