/* ============================================================ Highmoor, the windmill town (Crest 5, Gale)
   On the clifftop above Gale Ledges. Painted with the cliff painter; the west edge drops away into the misty gorge.
   The Weathervane (shop), the clinic, Kestrel Kites (glider flights home), the windpump cottage, and Highmoor Mill,
   where Warden Tamsin Windrow waits on the mill floor. Map: src/highmoor_maps.json (tools/maps/highmoor_gen.py). */
CREST_INFO.gale = ['🌬️ Gale Crest', '#5aa0b8'];
{ const h = CREST_INFO.hearth; delete CREST_INFO.hearth; CREST_INFO.hearth = h; }   // keep Rowan's crest last
ROUTES.highmoor = {
  name: 'Highmoor', w: 44, h: 40, ascii: HM_MAPS.highmoor.rows, crag: true, moor: true, town: true, zones: [], paths: [], ponds: [], bridge: null, open: [], clear: [],
  pickups: [{ id: 'hm1', x: 4, y: 13, item: 'swift_feather', n: 1 }, { id: 'hm3', x: 40, y: 6, item: 'skyward_charm', n: 3 }, { id: 'hm2', x: 39, y: 37, gold: 5000 }],
  buildings: [
    { id: 'hm_mill', atlas: 'hm', frame: 'hm_windmill', cx: 22, by: 10, door: 0, name: 'Highmoor Mill' },
    { id: 'hm_shop', atlas: 'hm', frame: 'hm_shop', cx: 10, by: 18, door: 0, name: 'The Weathervane' },
    { id: 'hm_clinic', atlas: 'hm', frame: 'hm_clinic', cx: 33, by: 18, door: 0, name: 'Highmoor Clinic' },
    { id: 'hm_kites', atlas: 'hm', frame: 'hm_kite_house', cx: 9, by: 31, door: 1, name: 'Kestrel Kites' },
    { id: 'hm_pump', atlas: 'hm', frame: 'hm_windpump', cx: 33, by: 31, door: 0, name: 'Windpump Cottage' },
  ],
  decor: [['hm', 'hm_small_windmill', 7, 8], ['hm', 'hm_small_windmill', 36, 8], ['hm', 'hm_small_windmill', 39, 26], ['hm', 'hm_hay_cart', 14, 13], ['hm', 'hm_flour_sacks', 26, 12],
    ['hm', 'hm_millstone', 17, 12], ['hm', 'hm_grain_barrel', 28, 12], ['hm', 'hm_banner_pole', 16, 21], ['hm', 'hm_banner_pole', 27, 21], ['hm', 'hm_kite_pole', 5, 26], ['hm', 'hm_kite_pole', 37, 37],
    ['hm', 'hm_wind_chimes', 14, 20], ['hm', 'hm_bench', 17, 28], ['hm', 'hm_bench', 26, 28], ['hm', 'hm_planter', 13, 25], ['hm', 'hm_planter', 30, 25], ['hm', 'hm_birdhouse', 38, 14],
    ['hm', 'hm_windswept_tree', 5, 15], ['hm', 'hm_windswept_tree', 38, 20], ['hm', 'hm_windswept_tree', 6, 37], ['hm', 'hm_windswept_tree', 28, 37], ['hm', 'hm_heather', 4, 30],
    ['hm', 'hm_heather', 15, 36], ['hm', 'hm_heather', 30, 14], ['hm', 'hm_heather', 39, 31], ['hm', 'hm_glider', 4, 21], ['hm', 'hm_wall', 15, 30], ['hm', 'hm_wall', 27, 30], ['hm', 'hm_weathervane', 24, 18]],
  signs: { '23,37': 'Highmoor. Windmills, kites, and the Gale Warden. Mind your hat!', '24,11': "Highmoor Mill. Warden Tamsin Windrow grinds the flour and rides the wind. Challengers welcome on the mill floor!",
    '4,24': 'The cliff edge. Far below, the wind roars through Gale Ledges. Kestrel Kites can fly you home from here (ask inside).' },
  npcs: [], trainers: [],
  exits: [{ r: [20, 39, 23, 39], to: x => ['galeledges', { x: Math.max(18, Math.min(21, x - 2)), y: 1, dir: 'down' }] }],
  spawn: { x: 21, y: 38, dir: 'up' }, enc: { day: [['kitlet', 1]], night: [['kitlet', 1]] },
};
TOWNSFOLK.highmoor = [
  { kind: 'climber', name: 'Gorse, the shepherd', at: [12, 27], lines: ["Heathfoal herds come right up to the walls in winter. Sweet things. Kick like mules.", "Climbed Gale Ledges, did you? With the vanes and all? Tamsin set half of those up herself.", "Watch the sky over the mill. When the kites come down, the weather's turning."] },
  { kind: 'birdwatcher', name: 'Pip, the kite-flyer', at: [30, 27], lines: ["Kitlet hovers on the updrafts just like my kites do. I copied the design. Don't tell it.", "Tamsin once glided from the mill all the way to Beaconreach. Orrin nearly dropped his lamp!", "Snowy owls nest in the windmill sails. They glare at you if you wake them in the day.", "See the Skyward Charms at the Weathervane? Woven from my kite silk round a Kitlet feather. Twice as good as a Root Charm!"] },
  { kind: 'forager', name: 'Elspeth, the baker', at: [18, 16], lines: ["Highmoor flour makes the best bread on the coast. The mill never stops turning, that's the secret.", "Tamsin's grandad built the windpump. He still fixes it every spring, whether it's broken or not.", "Wishling seeds glow in the evenings. We put them in jars on the windowsills."] },
  { kind: 'rambler', name: 'Old Windrow', at: [34, 36], lines: ["My granddaughter? She was born with the wind in her hair and has never once combed it out.", "Fifty years I've worked that windpump. Talks to me, it does. Mostly complaining.", "Beat Tamsin and she'll laugh like it's the best day of her life. Lose and she'll laugh just the same."] },
];

/* ---------- doors */
const HM_SHOP = [['skyward_charm', 300], ['sturdy_charm', 130], ['tonic', 110], ['mon_treat', 250], ['hearth_elixir', 3000], ['swift_feather', 900], ['fang_charm', 900], ['heartwood_charm', 1600], ['clinging_burr', 1800], ['gale_sigil', 2000, 5]];
const _hmDoor = hmDoor;
hmDoor = function (sc, id) {
  if (id === 'hm_land') return _hmDoor(sc, id);
  if (id === 'hm_mill') { Sound.play('door'); return travel(sc, 'hmmill', { x: 10, y: 26, dir: 'up' }); }
  if (id === 'hm_tamsin') return tamsin(sc);
  if (id === 'hm_gate') return toast(millFixed() ? 'The back gate swings open.' : "A gate behind the mill, padlocked. A tag on it reads: 'Mill property. Apprentices only.'", 2800);
  if (id === 'hm_storm') return wcStorm(sc);
  Sound.play('door');
  if (id === 'hm_clinic') return openModal('Highmoor Clinic', '<p>Dried heather hangs from the beams and the kettle is already whistling. "Climbed all the way up? Sit down before the wind blows you off again. Your Fablemon too."</p><div class="row"><button class="btn gold" data-a="heal">Heal my team</button></div>', a => {
    if (a === 'heal') { S.mons.forEach(restMon); refreshTeamBtn(); Sound.play('fill'); toast('Your Fablemon are fully healed and their moves are restored!', 2400); closeModal(); }
  });
  if (id === 'hm_shop') {
    const render = () => `<p>A golden rooster turns on the roof of the Weathervane. Inside: jars of honey, wheels of cheese, and a shelf of charms. "Everything up here's blown in from somewhere," laughs the shopkeeper.</p><div class="mlist">${HM_SHOP.map(([i, p, c]) => shopRow(i, p, c || 0, 1)).join('')}</div>`;
    return openModal('The Weathervane', render(), (a, d) => { if (a === 'buy') buy(d.id, +d.p, +d.n || 1); $('mBody').innerHTML = render(); });
  }
  if (id === 'hm_kites') return openModal('Kestrel Kites', '<p>Kites of every colour hang from the rafters. The kite-maker winks. "Long way down, isn\'t it? Strap into one of my gliders and the sea wind will carry you home. Highmoor\'s always here when you want to climb back up."</p><div class="row" style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn gold" data-a="cove">Glide to Driftwood Cove</button><button class="btn gold" data-a="beacon">Glide to Beaconreach</button><button class="btn" data-a="no">Not today</button></div>', a => {
    closeModal(); if (a !== 'cove' && a !== 'beacon') return;
    Sound.play('gust'); toast('You launch off the cliff edge and soar out over the sea...', 2200);
    setTimeout(() => a === 'cove' ? travel(sc, 'driftwood', { x: 30, y: 16, dir: 'down' }) : travel(sc, 'beaconreach', { x: 21, y: 22, dir: 'down' }), 900);
  });
  if (id === 'hm_pump') return toast('Old Windrow\'s cottage. The windpump on the roof squeaks round and round. A note on the door: "Out mending something. Probably the pump."', 3400);
};

/* ---------- Warden Tamsin Windrow */
TRAINER_TYPES.tamsin = { label: 'Warden', challenge: ['Ride it out!'], lose: ['Ha! Blown clean away!'], after: ['The wind never asks permission.'] };
TRAINER_ROW.tamsin = 13;
// six Gale Fablemon at 55-60, hand-picked moves: old friends from the coast and the mountains, the moor's own Fablemon,
// and her partner Tempestrel as the ace
const TAMSIN_TEAM = [
  ['whorlcrest', 55, ['whorlwind', 'millrace', 'galeforce', 'updraft']],
  ['craglet_3', 56, ['skydive', 'landslide', 'flintedge', 'windslice']],
  ['wishling_3', 57, ['wishwind', 'galeforce', 'prismbeam', 'updraft']],
  ['flurrowl_3', 58, ['whiteout', 'glacierfall', 'galeforce', 'chillmist']],
  ['heathfoal_2', 59, ['heathergallop', 'galeforce', 'stampede', 'brace']],
  ['kitlet_3', 60, ['tempestwing', 'skydive', 'whorlwind', 'updraft']]];
// THE CHALLENGE BEFORE TAMSIN: the mill is jammed. Beat her three apprentices on the mill floor, free the gears, then
// climb Windcrown Peak behind the mill and face what is sending the freak wind down on the sails. Players who already
// hold the Gale Crest skip all of it.
const millFixed = () => !!(S.flags.millGears || (S.crests && S.crests.gale));
const windCalm = () => !!(S.flags.windCalm || (S.crests && S.crests.gale));
function tamsin(sc) {
  const W = (t, f = 0) => ({ who: 'trainer', name: 'Warden Tamsin', img: trainerPic('tamsin', f), t });
  if (!windCalm()) return Talk.say(!millFixed() ? [W("Oh! A challenger! You climbed Gale Ledges? Brilliant! But... look up.", 1),
    W("The sails stopped dead at dawn. No wind I've ever known stops a mill like that. The whole town's flour is stuck in there."),
    W("My three apprentices are inside trying to free the gears. They won't let anyone touch the cranks who can't beat them, mind. Mill rules."),
    W("Go and give them a hand? I'll battle you the moment those sails turn. Promise!", 1)]
    : [W("The gears are free? Then why won't she turn...", 0), W("A wind off Windcrown Peak, pushing the sails backwards? Nothing up there blows like that. Nothing ordinary, anyway."),
    W("The track behind the mill climbs the peak. Be careful up there. Whatever it is, it's angry.", 1)]);
  if (S.crests && S.crests.gale) return Talk.say([W(pick(["Fancy a glide? Kestrel Kites will strap you in. Tell them I sent you!", "The sails haven't stopped turning since our battle. I think the mill enjoyed it as much as I did!", "Keep that Gale Crest pinned tight. Up here it'll blow right off otherwise!"]), 1)]);
  if (!team().some(m => m.hp > 0)) return toast('Your Fablemon are too tired to battle. Rest them first.', 2400);
  Talk.say([W(S.flags.windCalm ? "Listen to her! The sails are turning! You went up Windcrown Peak and calmed that wind, didn't you? Brilliant!" : 'Oh! A challenger! You climbed Gale Ledges? With the vanes and everything? Brilliant!', 1),
    W("Tamsin Windrow. I mill the flour, I fly the gliders, and I'm the Warden of Highmoor. The wind's been my partner since before I could walk."),
    W("Down there, people fight the wind. Up here, we ride it. That's the whole secret."),
    W("So hold on to your hat. Let's see if you can ride it out!", 1)], () => {
    const tm = TAMSIN_TEAM.map(wardenMon);
    Battle.start(tm[0], { label: 'Warden', name: 'Tamsin', team: tm, prize: 9000, boss: true, heals: 2, lose: 'Ha! Blown clean off your feet! Dust off, have a scone, and come back for another go!', onWin: () => {
      S.crests = S.crests || {}; S.crests.gale = 1; giveSigil('gale'); S.trainers = S.trainers || {}; S.trainers.tamsin = 1;
      setTimeout(() => { Sound.play('gotcha'); Talk.say([W('HA! Blown clean away! Oh, that was wonderful!', 1), W("You didn't fight the wind. You rode it. That's all I ever wanted to see."), W('Here: the Gale Crest. Pin it on tight. And come and fly a kite with me sometime!', 1)]); }, 600);
    } });
  });
}

/* ---------- inside Highmoor Mill: the mill floor, one painted picture, 21 x 28 tiles */
const HM_W = 21, HM_H = 28, HM_BOSS = { x: 10, y: 11 };
const HM_WALK = (() => {
  const s = new Set(), r = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) s.add(x + ',' + y); };
  r(7, 8, 13, 9);       // under the great gear
  r(7, 10, 17, 12);     // between the workbench and the flour sacks
  r(2, 13, 18, 15);     // the compass floor, wall to wall
  r(4, 16, 16, 17);
  r(5, 18, 15, 20);
  r(9, 21, 11, 27);     // the stairs up from the door
  return s;
})();
class HmMill extends World {
  constructor() { super('hmmill'); }
  create() {
    this.initWorld(HM_W, HM_H);
    this.add.rectangle(-300, -300, HM_W * T + 600, HM_H * T + 600, 0x0a0806).setOrigin(0).setDepth(-20);
    this.add.image(0, 0, 'gym_hm').setOrigin(0).setScale(.5).setDepth(-10);
    for (const [x, y] of [[5.3, 7.3], [18.5, 7.6], [8.4, 23.4], [5.9, 9.2]]) {
      const g = this.add.circle(x * T, y * T, 14, 0xffd890, .13).setBlendMode(Phaser.BlendModes.ADD).setDepth(9e6 - 10);
      this.tweens.add({ targets: g, alpha: .05, yoyo: true, repeat: -1, duration: 1200 + Math.random() * 700 });
    }
    // sunlight through the windows
    for (const [x, y] of [[4, 4], [16, 4], [18, 10]]) { const g = this.add.ellipse(x * T, y * T + 40, 40, 20, 0xfff2c0, .1).setBlendMode(Phaser.BlendModes.ADD).setDepth(9e6 - 11); this.tweens.add({ targets: g, alpha: .03, yoyo: true, repeat: -1, duration: 2600 }); }
    for (let r = 0; r < 4; r++) { const k = `tamsin_${DIRS[r]}`; if (!this.anims.exists(k)) this.anims.create({ key: k, frames: this.anims.generateFrameNumbers('tr_tamsin', { frames: [r * 4 + 1, r * 4, r * 4 + 3, r * 4] }), frameRate: 6, repeat: -1 }); }
    this.bossHere = windCalm();
    this.boss = this.add.sprite(HM_BOSS.x * T + 8, HM_BOSS.y * T + 15, 'tr_tamsin', 0).setOrigin(.5, 1).setDepth(HM_BOSS.y * T + 15).setVisible(this.bossHere);
    this.shadow(this.boss, 12, 5);
    millSetup(this);
    const sp = S.spawn && S.spawn.scene === 'hmmill' ? S.spawn : { x: 10, y: 26, dir: 'up' };
    this.makePlayer(sp);
    const cam = this.cameras.main;
    cam.setBounds(-T * 2, -T, (HM_W + 4) * T, (HM_H + 2) * T); cam.startFollow(this.player, true, 1, 1); cam.setRoundPixels(true);
    this.applyZoom(); this.scale.on('resize', this.onResize, this); this.events.once('shutdown', () => this.scale.off('resize', this.onResize, this));
    this.setupInput(); Sound.theme('route'); updateHUD(); renderHotbar(); FX.set('sun', true); this.fadeIn();
    if (!this.bossHere && !S.flags.millJamSeen) { S.flags.millJamSeen = 1; setTimeout(() => toast('Inside Highmoor Mill. The great gear hangs still overhead. Three flour-dusted apprentices are arguing over a row of jammed cranks.', 3800), 600); }
    else if (this.bossHere && !S.flags.millInSeen) { S.flags.millInSeen = 1; setTimeout(() => toast('Inside Highmoor Mill. The great gear creaks round overhead, flour dust glitters in the sunbeams, and Tamsin is waiting on the compass floor.', 3600), 600); }
  }
  onResize() { this.applyZoom(); renderHotbar(); }
  passable(x, y) { return HM_WALK.has(x + ',' + y) && !(this.bossHere && x === HM_BOSS.x && y === HM_BOSS.y) && !millAt(this, x, y); }
  bossNear(x, y) { return this.bossHere && Math.abs(x - HM_BOSS.x) + Math.abs(y - HM_BOSS.y) === 1; }
  talk() { this.face(HM_BOSS.x, HM_BOSS.y); const p = this.p; this.boss.setFrame(DIRS.indexOf(p.x < HM_BOSS.x ? 'left' : p.x > HM_BOSS.x ? 'right' : p.y < HM_BOSS.y ? 'up' : 'down') * 4); p.busy = .4; tamsin(this); }
  actFacing() {
    const p = this.p; if (p.moving || this.paused || p.busy > 0) return;
    const [dx, dy] = DV[p.dir];
    if (this.bossHere && p.x + dx === HM_BOSS.x && p.y + dy === HM_BOSS.y) return this.talk();
    const o = millAt(this, p.x + dx, p.y + dy); if (o) return millUse(this, o);
    if (eatHeld()) p.busy = .4;
  }
  act() { if (this.bossHere) this.talk(); }
  onTap(wx, wy) {
    if (this.paused || this.sleeping || controlMode() !== 'tap') return;
    const x = Math.floor(wx / T), y = Math.floor(wy / T), p = this.p;
    const o = millAt(this, x, y);
    if (o) {
      const near = (a, b) => Math.abs(a - o.x) + Math.abs(b - o.y) === 1 && (!o.gear || b === o.y + 1);
      if (near(p.x, p.y) && !p.moving) { this.face(o.x, o.y); return millUse(this, o); }
      const path = this.path(near); if (path) { p.path = path; p.pending = { mill: o }; } return;
    }
    if (this.bossHere && (this.boss.getBounds().contains(wx, wy) || (x === HM_BOSS.x && y === HM_BOSS.y))) {
      if (this.bossNear(p.x, p.y) && !p.moving) return this.talk();
      const path = this.path((a, b) => this.bossNear(a, b)); if (path) { p.path = path; p.pending = { tr: 1 }; } return;
    }
    if (this.passable(x, y)) { const path = this.path((a, b) => a === x && b === y); if (path) { p.path = path; p.pending = null; } }
  }
  tapGoal() { }
  arrived() { const p = this.p; if (!p.path.length && p.pending) { const o = p.pending.mill; p.pending = null; if (o) { this.face(o.x, o.y); millUse(this, o); } else this.talk(); } this.arriveHook(p.x, p.y); }
  arriveHook(x, y) { if (y >= HM_H - 1) { Sound.play('door'); travel(this, 'highmoor', { x: 22, y: 11, dir: 'down' }); } }
}


/* ---------- the jammed mill: three apprentices and a row of four gears on the rail under the great wheel.
   Turn a crank and its gear turns a quarter clockwise; the gears meshed either side are dragged a quarter the other
   way. Every gear's arrow must point up. (Any setting can be solved; from the start it takes 5 turns: 2, 3, 3, 3, 4.) */
TRAINER_TYPES.apprentice = { label: 'Apprentice', challenge: ['Mill rules!'], lose: ['Flattened like flour!'], after: ['Back to the cranks.'] };
const MILL_GEARS = [7, 9, 11, 13], MILL_GEAR_Y = 7, MILL_START = [1, 2, 3, 2];
const MILL_APPS = [
  { id: 'mill_a1', name: 'Dusty', art: 'miner', x: 4, y: 14, dir: 'right', team: [['ramruff_2', 54], ['heathfoal', 55], ['whorlcrest', 55], ['craglet_3', 56]],
    hi: ["Tamsin's flour sacks weigh more than you do. I carry two at once. Let's see if your Fablemon are as strong!"], after: ["You're tougher than a sack of Highmoor wheat. Go on, have a go at the cranks.", "My arms ache from hauling. Battling's a holiday by comparison."] },
  { id: 'mill_a2', name: 'Wynn', art: 'rambler', x: 17, y: 13, dir: 'left', team: [['kitlet_2', 55], ['wishling_2', 55], ['bristlecone_3', 56], ['staticwing', 56]],
    hi: ["I oil the sails. Up the ladder in a gale, every morning. You don't scare me!"], after: ["I've never seen the sails stop. Not once. Not even in the great storm last winter.", "Bran knows the gears best. Listen to him."] },
  { id: 'mill_a3', name: 'Bran', art: 'forager', x: 15, y: 10, dir: 'left', head: 1, team: [['flurrowl_2', 56], ['heathfoal_2', 56], ['whirlwyn', 56], ['kitlet_2', 57], ['wishling_2', 57]],
    hi: ["I'm head apprentice. Nobody touches Tamsin's cranks unless they can beat me. Mill rules!"],
    after: ["Each crank turns its own gear a quarter clockwise. The gears either side get dragged a quarter the other way. Get every arrow pointing up.", "If you get in a tangle, don't panic. Every gear can be put right. Tamsin says patience is half of milling."] },
];
const millBeaten = () => MILL_APPS.every(a => S.trainers && S.trainers[a.id]);
function millAt(sc, x, y) { return (sc.millObjs || []).find(o => o.x === x && o.y === y); }
function millSetup(sc) {
  sc.millObjs = [];
  // the apprentices: route-trainer sprites under new names
  for (const a of MILL_APPS) {
    const key = 'tr_' + a.art, spr = sc.add.sprite(a.x * T + 8, a.y * T + 15, key, DIRS.indexOf(a.dir) * 4).setOrigin(.5, 1).setDepth(a.y * T + 15);
    sc.shadow(spr, 12, 5); sc.millObjs.push({ ...a, spr });
  }
  // the four gears, each a cog with a white arrow
  if (!sc.textures.exists('mill_cog')) {
    const g = sc.make.graphics({ add: false }), R = 15, c = 16;
    g.fillStyle(0x3a2412, 1); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; g.fillRect(c + Math.cos(a) * 12 - 2.5, c + Math.sin(a) * 12 - 2.5, 5, 5); }
    g.fillStyle(0x3a2412, 1).fillCircle(c, c, 12); g.fillStyle(0x9a6a3a, 1).fillCircle(c, c, 11); g.fillStyle(0xb88450, 1).fillCircle(c, c, 8);
    g.fillStyle(0x7a5030, 1); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; g.fillRect(c + Math.cos(a) * 13 - 2, c + Math.sin(a) * 13 - 2, 4, 4); }
    g.fillStyle(0xfff6e0, 1).fillTriangle(c, c - 10, c - 4, c - 4, c + 4, c - 4).fillRect(c - 1.5, c - 5, 3, 8);
    g.fillStyle(0x4a4a52, 1).fillCircle(c, c + 1, 2.5); g.generateTexture('mill_cog', 32, 32); g.destroy(); void R;
  }
  S.millGear = S.millGear || MILL_START.slice();
  const fixed = millFixed();
  MILL_GEARS.forEach((gx, i) => {
    const spr = sc.add.image(gx * T + 8, MILL_GEAR_Y * T + 8, 'mill_cog').setDepth(MILL_GEAR_Y * T + 16).setAngle((fixed ? 0 : S.millGear[i]) * 90);
    const lbl = sc.add.text(gx * T + 8, MILL_GEAR_Y * T + 22, String(i + 1), { fontFamily: 'ui-rounded, Nunito, system-ui, sans-serif', fontStyle: 'bold', fontSize: '7px', color: '#fff2c8', stroke: '#2a1a0e', strokeThickness: 2, resolution: 12 }).setOrigin(.5).setDepth(9e6 - 5);
    sc.millObjs.push({ gear: 1, i, x: gx, y: MILL_GEAR_Y, spr, lbl });
  });
}
function millUse(sc, o) {
  const p = sc.p; p.busy = .35;
  if (!o.gear) {
    o.spr.setFrame(DIRS.indexOf(p.x < o.x ? 'left' : p.x > o.x ? 'right' : p.y < o.y ? 'up' : 'down') * 4);
    const A = (t, f = 0) => ({ who: 'trainer', name: 'Apprentice ' + o.name, img: trainerPic(o.art, f), t });
    if (S.trainers && S.trainers[o.id]) return Talk.say([A(millFixed() ? pick(["The gears are free! Now we just need the wind to behave.", "Thanks for the help. Tamsin will want a battle, mind. She always does."]) : pick(o.after), 1)]);
    if (!team().some(m => m.hp > 0)) return toast('Your Fablemon are too tired to battle. Rest them first.', 2400);
    return Talk.say([A(o.hi[0])], () => {
      const tm = o.team.map(([sp, lv]) => trainerMon(sp, lv));
      Battle.start(tm[0], { label: 'Apprentice', name: o.name, team: tm, prize: Math.max(...o.team.map(([, l]) => l)) * 25, lose: 'Flattened like flour!', onWin: () => {
        S.trainers = S.trainers || {}; S.trainers[o.id] = 1;
        if (millBeaten() && !millFixed()) setTimeout(() => toast('All three apprentices beaten! Now the cranks under the great wheel are yours to turn.', 3200), 700);
      } });
    });
  }
  if (millFixed()) return toast('The four gears sit neatly in line, every arrow pointing up.', 2200);
  if (!millBeaten()) { const b = MILL_APPS.find(a => a.head); return Talk.say([{ who: 'trainer', name: 'Apprentice Bran', img: trainerPic(b.art, 0), t: "Oi! Hands off the cranks! Nobody touches Tamsin's gears till they've beaten all three of us apprentices. Mill rules!" }]); }
  const st = S.millGear, gears = sc.millObjs.filter(q => q.gear);
  const turn = (j, d) => { if (j < 0 || j >= gears.length) return; st[j] = (st[j] + d + 4) % 4; sc.tweens.add({ targets: gears[j].spr, angle: gears[j].spr.angle + d * 90, duration: 320, ease: 'Back.out' }); };
  turn(o.i, 1); turn(o.i - 1, -1); turn(o.i + 1, -1);
  Sound.play('click'); sc.cameras.main.shake(90, .002);
  if (st.every(v => v === 0)) {
    S.flags.millGears = 1; p.busy = 2;
    setTimeout(() => {
      Sound.play('thud'); sc.cameras.main.shake(700, .006);
      const B = (t, f = 1) => ({ who: 'trainer', name: 'Apprentice Bran', img: trainerPic('forager', f), t });
      Talk.say([B('CLUNK! The gears lock into line! The great wheel overhead lurches... strains... and stops dead again.', 0),
        B("It's free! The gears are free! So why won't she turn?", 0),
        B("Listen. Hear that howling? The sails are being shoved BACKWARDS. A wind off the north side, straight down from Windcrown Peak."),
        B("Nothing blows like that up there. Not normally. Here: the key to the back gate. The track behind the mill climbs the peak."),
        B("Tell Tamsin, then go and see what's up there. Wrap up warm!")],
      () => toast('Got the Back Gate Key! The track behind Highmoor Mill now leads up to Windcrown Peak.', 3600));
    }, 450);
  }
}

/* ---------- Highmoor town: Tamsin waits outside the jammed mill, and the back gate to Windcrown Peak */
const HM_TAMSIN_OUT = { x: 20, y: 12 }, HM_GATE = [[28, 1], [29, 1]];
ROUTES.highmoor.exits.push({ r: [28, 0, 29, 0], to: x => ['windcrown', { x: x - 14, y: 44, dir: 'up' }] });
function hmPlaceSetup(sc) {
  const key = sc.scene.key, R = sc.R;
  if (key === 'highmoor') {
    const tk = HM_TAMSIN_OUT.x + ',' + HM_TAMSIN_OUT.y;
    if (!windCalm()) {
      const spr = sc.add.sprite(HM_TAMSIN_OUT.x * T + 8, HM_TAMSIN_OUT.y * T + 15, 'tr_tamsin', DIRS.indexOf('up') * 4).setOrigin(.5, 1).setDepth(HM_TAMSIN_OUT.y * T + 15);
      sc.shadow(spr, 12, 5); R.blocked[HM_TAMSIN_OUT.y * RW + HM_TAMSIN_OUT.x] = 1; ROUTE_SIGNS[tk] = '__door:hm_tamsin'; sc.tamsinOut = spr;
    } else { sc.tamsinOut = null; if (ROUTE_SIGNS[tk] === '__door:hm_tamsin') delete ROUTE_SIGNS[tk]; }
    // the back gate: two posts, and planks across while it's locked
    const g = sc.add.graphics().setDepth(1 * T + 15), x0 = 28 * T, y0 = 1 * T;
    g.fillStyle(0x3a2412, 1).fillRect(x0 - 2, y0 - 10, 4, 26).fillRect(x0 + 2 * T - 2, y0 - 10, 4, 26);
    g.fillStyle(0x8a5a30, 1).fillRect(x0 - 1, y0 - 9, 2, 24).fillRect(x0 + 2 * T - 1, y0 - 9, 2, 24);
    if (!millFixed()) {
      for (const yy of [y0 - 2, y0 + 5, y0 + 12]) { g.fillStyle(0x5a3a1e, 1).fillRect(x0, yy, 2 * T, 4); g.fillStyle(0xb08050, 1).fillRect(x0, yy, 2 * T, 1); }
      g.fillStyle(0xd8b040, 1).fillRect(x0 + T - 3, y0 + 3, 6, 5); g.fillStyle(0x6a5020, 1).fillRect(x0 + T - 1, y0 + 5, 2, 2);
      for (const [x, y] of HM_GATE) { R.blocked[y * RW + x] = 1; ROUTE_SIGNS[x + ',' + (y + 1)] = '__door:hm_gate'; }
    } else for (const [x, y] of HM_GATE) if (ROUTE_SIGNS[x + ',' + (y + 1)] === '__door:hm_gate') delete ROUTE_SIGNS[x + ',' + (y + 1)];
  }
  if (key === 'windcrown') wcSetup(sc);
}

/* ---------- Windcrown Peak: the snowy summit north of Highmoor, and the storm on its crown.
   The cloud dragon (Gale/Frost legendary) roosts in the storm. Until its art is in the game, the storm can still be
   faced: the shape inside bursts out and flies off, and the wind drops. */
const WC_DRAGON = { sp: 'wc_dragon', lv: 60, name: 'the cloud dragon' }, WC_STORM = { x: 15, y: 3 };
const wcDragonReady = sc => !!(SPECIES[WC_DRAGON.sp] && sc.textures.exists('mon_' + WC_DRAGON.sp));
ROUTES.windcrown = { ...MOOR_BASE, name: 'Windcrown Peak', w: 32, h: 46, ascii: HM_MAPS.windcrown.rows, vanes: HM_MAPS.windcrown.vanes, snow: true,
  zones: [0, 1, 2, 3, 4, 5].map(() => [0, 0, 0, 0, 55, 56]).concat([[0, 0, 0, 0, 55, 57], [0, 0, 0, 0, 56, 58], [0, 0, 0, 0, 57, 58]]),
  pickups: [{ id: 'wc1', x: 28, y: 28, gold: 8000 }, { id: 'wc2', x: 28, y: 15, item: 'skyward_charm', n: 3 }, { id: 'wc3', x: 26, y: 3, item: 'hearth_elixir', n: 1 }, { id: 'wc4', x: 3, y: 22, item: 'swift_feather', n: 1 }],
  signs: { ...vaneSigns('windcrown'), '13,44': 'Windcrown Peak. Snow all year round. Lately, a howling wind pours off the summit day and night.', '3,28': '__heal',
    '19,44': 'Turn back if the wind knocks you flat. -- Highmoor Mountain Club' },
  trainers: [
    { id: 'wc_t1', kind: 'climber', name: 'Rhys', x: 16, y: 29, dir: 'down', sight: 3, team: [['craglet_3', 56], ['flurrowl_2', 56], ['heathfoal_2', 57], ['floecalf_2', 57]] },
    { id: 'wc_t2', kind: 'birdwatcher', name: 'Wren', x: 26, y: 16, dir: 'left', sight: 3, team: [['whorlcrest', 57], ['kitlet_3', 57], ['flurrowl_2', 57], ['wishling_3', 58]] },
  ],
  decor: [['hm', 'hm_windswept_tree', 4, 43], ['hm', 'hm_windswept_tree', 27, 41], ['hm', 'hm_kite_pole', 12, 40], ['hm', 'hm_windswept_tree', 3, 33], ['hm', 'hm_birdhouse', 24, 29],
    ['hm', 'hm_windswept_tree', 5, 15], ['hm', 'hm_windswept_tree', 27, 22], ['hm', 'hm_banner_pole', 9, 6], ['hm', 'hm_banner_pole', 22, 6]],
  goal: { area: [4, 1, 27, 10], flag: 'wcTop', msg: 'The summit of Windcrown Peak. A storm cloud sits right on top of the mountain, spinning like a millwheel.' },
  exits: [{ r: [14, 45, 17, 45], to: x => ['highmoor', { x: Math.max(28, Math.min(29, x + 14)), y: 1, dir: 'down' }] }],
  spawn: { x: 15, y: 44, dir: 'up' },
  enc: { day: [['flurrowl', 14], ['kitlet_2', 12], ['craglet_2', 10], ['floecalf', 10], ['whorlcrest', 8], ['wishling_2', 8], ['staticwing', 8], ['whirlwyn', 8], ['heathfoal', 6], ['flurrowl_2', 4]],
    night: [['flurrowl', 18], ['wishling_2', 12], ['staticwing', 10], ['duskcloak', 8], ['floecalf', 8], ['kitlet_2', 6], ['flurrowl_2', 6], ['duskwyrm', 2]] } };
EXTRA_HABITAT.flurrowl = 'Windcrown Peak (common), Heatherstep Cliffs and Gale Ledges (rare, mostly at night)';
function wcSetup(sc) {
  const R = sc.R, { x, y } = WC_STORM, k = x + ',' + y, ready = wcDragonReady(sc), st = S.flags;
  const dragonHere = ready && !st.wcCaught && st.wcDay !== S.day, stormHere = !windCalm() || dragonHere;
  if (!stormHere) { if (ROUTE_SIGNS[k] === '__door:hm_storm') delete ROUTE_SIGNS[k]; return; }
  R.blocked[y * RW + x] = 1; ROUTE_SIGNS[k] = '__door:hm_storm';
  // the storm: grey cloud puffs spinning round the summit, with a pale whirl in the middle
  const cx = x * T + 8, cy = y * T + 4, cloud = sc.add.container(cx, cy).setDepth(9e6 - 28);
  for (let i = 0; i < 14; i++) {
    const a = i / 14 * Math.PI * 2, r = 22 + (i % 3) * 7;
    cloud.add(sc.add.circle(Math.cos(a) * r, Math.sin(a) * r * .55, 9 + (i % 4) * 2, i % 2 ? 0x8a94a8 : 0xb8c2d4, windCalm() ? .35 : .78));
  }
  sc.tweens.add({ targets: cloud, angle: 360, duration: windCalm() ? 9000 : 3600, repeat: -1 });
  const whirl = sc.add.circle(cx, cy, 16, 0xe8f2ff, .35).setBlendMode(Phaser.BlendModes.ADD).setDepth(9e6 - 27);
  sc.tweens.add({ targets: whirl, scale: 1.4, alpha: .1, yoyo: true, repeat: -1, duration: 900 });
  sc.wcCloud = cloud; sc.wcWhirl = whirl;
  if (dragonHere) {
    sc.wcDragon = sc.add.sprite(cx, y * T + 16, 'mon_' + WC_DRAGON.sp, 0).setOrigin(.5, 1).setScale(1.5).setDepth(y * T + 15);
    if (sc.anims.exists(WC_DRAGON.sp + '_down')) sc.wcDragon.play(WC_DRAGON.sp + '_down');
    sc.tweens.add({ targets: sc.wcDragon, y: sc.wcDragon.y - 3, yoyo: true, repeat: -1, duration: 1300, ease: 'Sine.inOut' });
  }
  // after the dragon battle: caught, knocked out (back tomorrow) or fled (still there, still blowing)
  sc.time.addEvent({ delay: 200, loop: true, callback: () => {
    if (!sc.wcFight) return;
    if (Battle.active) { sc.wcSeen = 1; return; }
    if (!sc.wcSeen || sc.paused) return;
    const m = sc.wcFight; sc.wcFight = null; sc.wcSeen = 0;
    const caught = S.mons.some(q => q.sp === WC_DRAGON.sp), name = SPECIES[WC_DRAGON.sp].name;
    if (!caught && m.hp > 0) return toast(`${name} is still circling the summit. The wind howls on.`, 2600);
    if (caught) st.wcCaught = 1; else st.wcDay = S.day;
    wcCalm(sc, caught ? `The storm melts away. ${name} has joined your team! Far below, Highmoor's sails begin to turn.` : `${name} soars off into the clouds. The storm melts away behind it, and far below, Highmoor's sails begin to turn. It may roost here again tomorrow.`);
  } });
}
function wcCalm(sc, msg) {
  const first = !S.flags.windCalm; S.flags.windCalm = 1;
  delete ROUTE_SIGNS[WC_STORM.x + ',' + WC_STORM.y]; sc.R.blocked[WC_STORM.y * RW + WC_STORM.x] = 0;
  for (const o of [sc.wcCloud, sc.wcWhirl, sc.wcDragon]) if (o) sc.tweens.add({ targets: o, alpha: 0, scale: 1.6, duration: 1400, onComplete: () => o.destroy() });
  sc.wcCloud = sc.wcWhirl = sc.wcDragon = null;
  toast(msg, 4200);
  if (first) setTimeout(() => toast('The wind has dropped! Head back down to Highmoor: Tamsin will be waiting on the mill floor.', 3600), 4400);
}
function wcStorm(sc) {
  if (!team().some(m => m.hp > 0)) return toast('Your Fablemon are too tired to face the storm. Rest them first.', 2600);
  const lead = team().find(m => m.hp > 0), sys = t => ({ name: monName(lead), img: monPic(lead.sp), t });
  if (wcDragonReady(sc) && sc.wcDragon) {
    const sp = WC_DRAGON.sp, nm = SPECIES[sp].name, img = monPic(sp), L = t => ({ name: '???', img, t });
    S.seen[sp] = 1;
    return Talk.say(windCalm() ? [L('The clouds on the summit stir. A long, pale shape uncoils from them...'), L(`${nm} has come back to its roost! It lowers its head and watches you.`)]
      : [L('The storm cloud spins faster and faster. The snow whips sideways.'), L('Two pale eyes open in the heart of the cloud...'), L(`With a roar like a gale through a canyon, ${nm} bursts out of the storm!`)], () => {
      const m = wildMon(sp, WC_DRAGON.lv); m.iv = { hp: 9, atk: 9, def: 9, eatk: 9, edef: 9, spd: 9 }; m.hp = monStat(m, 'hp');
      sc.wcFight = m; sc.wcSeen = 0; sc.cameras.main.shake(400, .008); Battle.start(m);
    });
  }
  if (windCalm()) return;
  // no dragon art yet: the shape in the storm escapes, and the wind drops
  Talk.say([sys('The storm cloud spins faster and faster. Snow whips sideways, and the wind nearly knocks you flat.'), sys('Something enormous moves inside the cloud. Two pale eyes open... and look straight at you.'),
    sys('Your Fablemon stand their ground. The eyes narrow. Then, with a roar like a gale through a canyon, a vast pale shape bursts out of the top of the cloud and soars away over the mountains.')],
  () => { sc.cameras.main.shake(600, .01); Sound.play('gust'); wcCalm(sc, 'The storm unravels into wisps. Far below, the sails of Highmoor Mill creak... and begin to turn.'); });
}

/* ---------- quest, map */
QUESTS.splice(QUESTS.findIndex(q => q.id === 'gale') + 1, 0,
  { id: 'millwind', name: 'Get the sails of Highmoor Mill turning again', hint: "The mill is jammed. Beat Tamsin's three apprentices inside and free the gears, then find out what's blowing down off Windcrown Peak, up the track behind the mill.", done: windCalm, reward: { gold: 3000, items: { skyward_charm: 3 } } },
  { id: 'galecrest', name: 'Earn the Gale Crest from Warden Tamsin', hint: 'Once the sails turn again, Tamsin waits on the floor of Highmoor Mill, the great windmill at the top of the town.', done: () => !!(S.crests && S.crests.gale), reward: { gold: 4000, items: { mon_treat: 3 } } });
QUEST_PLACE.galecrest = 'highmoor';
{ const P = MAP_PLACES.find(q => q.k === 'highmoor'); delete P.soon; Object.assign(P, { route: 1, warden: ['Tamsin', 'gale', 5] });
  MAP_PLACES.splice(MAP_PLACES.indexOf(P) + 1, 0, { k: 'windcrown', name: 'Windcrown Peak', al: 't', x: .46, y: .085, route: 1, notes: () => [windCalm() ? '✔ The wind is calm again' : '🌨️ A storm sits on the summit'] }); }
QUEST_PLACE.millwind = () => millFixed() ? 'windcrown' : 'highmoor';
const HMTOWN_SCENES = [class extends Crag { constructor() { super('highmoor'); } }, HmMill, class extends Crag { constructor() { super('windcrown'); } }];
