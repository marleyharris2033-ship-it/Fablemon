/* ============================================================ Highmoor, the windmill town (Crest 5, Gale)
   On the clifftop above Gale Ledges. Painted with the cliff painter; the west edge drops away into the misty gorge.
   The Weathervane (shop), the clinic, Kestrel Kites (glider flights home), the windpump cottage, and Highmoor Mill,
   where Warden Tamsin Windrow waits on the mill floor. Map: src/highmoor_maps.json (tools/maps/highmoor_gen.py). */
CREST_INFO.gale = ['🌬️ Gale Crest', '#5aa0b8'];
{ const h = CREST_INFO.hearth; delete CREST_INFO.hearth; CREST_INFO.hearth = h; }   // keep Rowan's crest last
ROUTES.highmoor = {
  name: 'Highmoor', w: 44, h: 40, ascii: HM_MAPS.highmoor.rows, crag: true, moor: true, town: true, zones: [], paths: [], ponds: [], bridge: null, open: [], clear: [],
  pickups: [{ id: 'hm1', x: 4, y: 13, item: 'swift_feather', n: 1 }, { id: 'hm2', x: 39, y: 37, gold: 5000 }],
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
  { kind: 'birdwatcher', name: 'Pip, the kite-flyer', at: [30, 27], lines: ["Kitlet hovers on the updrafts just like my kites do. I copied the design. Don't tell it.", "Tamsin once glided from the mill all the way to Beaconreach. Orrin nearly dropped his lamp!", "Snowy owls nest in the windmill sails. They glare at you if you wake them in the day."] },
  { kind: 'forager', name: 'Elspeth, the baker', at: [18, 16], lines: ["Highmoor flour makes the best bread on the coast. The mill never stops turning, that's the secret.", "Tamsin's grandad built the windpump. He still fixes it every spring, whether it's broken or not.", "Wishling seeds glow in the evenings. We put them in jars on the windowsills."] },
  { kind: 'rambler', name: 'Old Windrow', at: [34, 36], lines: ["My granddaughter? She was born with the wind in her hair and has never once combed it out.", "Fifty years I've worked that windpump. Talks to me, it does. Mostly complaining.", "Beat Tamsin and she'll laugh like it's the best day of her life. Lose and she'll laugh just the same."] },
];

/* ---------- doors */
const HM_SHOP = [['tonic', 280], ['mon_treat', 650], ['swift_feather', 900], ['fang_charm', 900], ['heartwood_charm', 1600], ['clinging_burr', 1800], ['gale_sigil', 2000, 5]];
const _hmDoor = hmDoor;
hmDoor = function (sc, id) {
  if (id === 'hm_land') return _hmDoor(sc, id);
  if (id === 'hm_mill') { Sound.play('door'); return travel(sc, 'hmmill', { x: 10, y: 26, dir: 'up' }); }
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
function tamsin(sc) {
  const W = (t, f = 0) => ({ who: 'trainer', name: 'Warden Tamsin', img: trainerPic('tamsin', f), t });
  if (S.crests && S.crests.gale) return Talk.say([W(pick(["Fancy a glide? Kestrel Kites will strap you in. Tell them I sent you!", "The sails haven't stopped turning since our battle. I think the mill enjoyed it as much as I did!", "Keep that Gale Crest pinned tight. Up here it'll blow right off otherwise!"]), 1)]);
  if (!team().some(m => m.hp > 0)) return toast('Your Fablemon are too tired to battle. Rest them first.', 2400);
  Talk.say([W('Oh! A challenger! You climbed Gale Ledges? With the vanes and everything? Brilliant!', 1),
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
    this.boss = this.add.sprite(HM_BOSS.x * T + 8, HM_BOSS.y * T + 15, 'tr_tamsin', 0).setOrigin(.5, 1).setDepth(HM_BOSS.y * T + 15);
    this.shadow(this.boss, 12, 5);
    const sp = S.spawn && S.spawn.scene === 'hmmill' ? S.spawn : { x: 10, y: 26, dir: 'up' };
    this.makePlayer(sp);
    const cam = this.cameras.main;
    cam.setBounds(-T * 2, -T, (HM_W + 4) * T, (HM_H + 2) * T); cam.startFollow(this.player, true, 1, 1); cam.setRoundPixels(true);
    this.applyZoom(); this.scale.on('resize', this.onResize, this); this.events.once('shutdown', () => this.scale.off('resize', this.onResize, this));
    this.setupInput(); Sound.theme('route'); updateHUD(); renderHotbar(); FX.set('sun', true); this.fadeIn();
    if (!S.flags.millInSeen) { S.flags.millInSeen = 1; setTimeout(() => toast('Inside Highmoor Mill. The great gear creaks round overhead, flour dust glitters in the sunbeams, and Tamsin is waiting on the compass floor.', 3600), 600); }
  }
  onResize() { this.applyZoom(); renderHotbar(); }
  passable(x, y) { return HM_WALK.has(x + ',' + y) && !(x === HM_BOSS.x && y === HM_BOSS.y); }
  bossNear(x, y) { return Math.abs(x - HM_BOSS.x) + Math.abs(y - HM_BOSS.y) === 1; }
  talk() { this.face(HM_BOSS.x, HM_BOSS.y); const p = this.p; this.boss.setFrame(DIRS.indexOf(p.x < HM_BOSS.x ? 'left' : p.x > HM_BOSS.x ? 'right' : p.y < HM_BOSS.y ? 'up' : 'down') * 4); p.busy = .4; tamsin(this); }
  actFacing() {
    const p = this.p; if (p.moving || this.paused || p.busy > 0) return;
    const [dx, dy] = DV[p.dir];
    if (p.x + dx === HM_BOSS.x && p.y + dy === HM_BOSS.y) return this.talk();
    if (eatHeld()) p.busy = .4;
  }
  act() { this.talk(); }
  onTap(wx, wy) {
    if (this.paused || this.sleeping || controlMode() !== 'tap') return;
    const x = Math.floor(wx / T), y = Math.floor(wy / T), p = this.p;
    if (this.boss.getBounds().contains(wx, wy) || (x === HM_BOSS.x && y === HM_BOSS.y)) {
      if (this.bossNear(p.x, p.y) && !p.moving) return this.talk();
      const path = this.path((a, b) => this.bossNear(a, b)); if (path) { p.path = path; p.pending = { tr: 1 }; } return;
    }
    if (this.passable(x, y)) { const path = this.path((a, b) => a === x && b === y); if (path) { p.path = path; p.pending = null; } }
  }
  tapGoal() { }
  arrived() { const p = this.p; if (!p.path.length && p.pending) { p.pending = null; this.talk(); } this.arriveHook(p.x, p.y); }
  arriveHook(x, y) { if (y >= HM_H - 1) { Sound.play('door'); travel(this, 'highmoor', { x: 22, y: 11, dir: 'down' }); } }
}

/* ---------- quest, map */
QUESTS.splice(QUESTS.findIndex(q => q.id === 'gale') + 1, 0,
  { id: 'galecrest', name: 'Earn the Gale Crest from Warden Tamsin', hint: 'Highmoor sits at the top of Gale Ledges. Tamsin waits on the floor of Highmoor Mill, the great windmill at the top of the town.', done: () => !!(S.crests && S.crests.gale), reward: { gold: 4000, items: { mon_treat: 3 } } });
QUEST_PLACE.galecrest = 'highmoor';
{ const P = MAP_PLACES.find(q => q.k === 'highmoor'); delete P.soon; Object.assign(P, { route: 1, warden: ['Tamsin', 'gale', 5] }); }
const HMTOWN_SCENES = [class extends Crag { constructor() { super('highmoor'); } }, HmMill];
