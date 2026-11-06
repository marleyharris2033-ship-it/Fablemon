/* ============================================================ Quarrydown
   A working quarry town past the Cragside landslide: a clinic, Stone & Supply, the station, two repairs
   (the Stone Cottage and the Old Crane), and Warden Granger's Quarry Pit. The town is drawn like the
   Cragside maps, from text; buildings and props come from the 'qd' atlas (tools/art/cut_quarry.py).
   No villager sprites yet: the clinic nurse and the shopkeeper only speak through their windows. */
const QD_MAP = [
  "#######################,,#######################",
  "#######################,,#######################",
  "######################.,,.######################",
  "######################.,,.######################",
  "######################.,,.######################",
  "######################.,,.######################",
  "####...................,,...................####",
  "###....................,,....................###",
  "##.....................,,.....................##",
  "##.....................,,.....................##",
  "##.....................,,.....................##",
  "##,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,##",
  "##,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,##",
  "##.....................,,.....................##",
  "##.....................,,.....................##",
  "##.....................,,.....................##",
  "##..o...............o..,,.....................##",
  "##.....................,,..................O..##",
  "##.....................,,..o..................##",
  "##.....................,,.....................##",
  "##.....................,,.....................##",
  "##.....................,,.....................##",
  "##,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,##",
  "##,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,##",
  "##.....................,,.....................##",
  "##.....................,,.....................##",
  "##............O........,,...............O.....##",
  "##...O.................,,.....O...............##",
  "##.....................,,.....................##",
  "##.....................,,.....................##",
  "##.......o.............,,..................o..##",
  "##...............o.....,,..........o..........##",
  "###....................,,....................###",
  "####.................#.,,.#.................####",
  "######################.,,.######################",
  "######################.,,.######################"
];
const QD_PROJECTS = {
  qd_cottage: { name: 'Stone Cottage', need: { stone: 120, wood: 60 }, gold: 2500, blurb: "The old quarrymaster's cottage. Ivy has had it to itself for years." },
  qd_crane: { name: 'Old Crane', need: { wood: 150, stone: 80, fiber: 40 }, gold: 3500, blurb: 'The great timber crane that lifted every block out of the quarry. New rope, new beams.' },
};
const qdState = () => (S.qd = S.qd || { done: {}, pending: {} });
const qdDone = id => !!qdState().done[id];
const qdRepairs = () => Object.keys(qdState().done).length;
const pitOpen = () => qdRepairs() >= 2 || !!(S.crests && S.crests.stone);
CREST_INFO.stone = ['⛰️ Stone Crest', '#8a7458'];
{ const h = CREST_INFO.hearth; delete CREST_INFO.hearth; CREST_INFO.hearth = h; }   // keep Rowan's crest last

ROUTES.quarrydown = {
  name: 'Quarrydown', w: 48, h: 36, town: true, quiet: false, crag: true, ascii: QD_MAP, zones: [], paths: [], ponds: [], bridge: null, open: [], clear: [],
  pickups: [{ id: 'qd1', x: 44, y: 29, item: 'sturdy_charm', n: 5 }, { id: 'qd2', x: 3, y: 14, gold: 2500 }],
  buildings: [
    { id: 'qd_clinic', atlas: 'qd', frame: 'qd_clinic', cx: 6, by: 10, door: 0, name: 'Quarrydown Clinic' },
    { id: 'qd_shop', atlas: 'qd', frame: 'qd_shop', cx: 15, by: 10, door: 0, name: 'Stone & Supply' },
    { id: 'qd_crane', atlas: 'qd', frame: 'qd_crane', old: 'qd_crane_old', cx: 36, by: 10, door: -3, name: 'Old Crane', repair: true, done: () => qdDone('qd_crane') },
    { id: 'qd_station', atlas: 'qd', frame: 'qd_station', cx: 12, by: 21, door: 0, name: 'Quarrydown Station' },
    { id: 'qd_cottage', atlas: 'qd', frame: 'qd_cottage', old: 'qd_cottage_old', cx: 35, by: 21, door: 1, name: 'Stone Cottage', repair: true, done: () => qdDone('qd_cottage') },
  ],
  props: [['bh_board', 26, 10, 3, 'bh']],
  qdprops: [
    ['qd_stone_lantern', 22, 6], ['qd_stone_lantern', 25, 6], ['qd_barrier', 24, 3, () => !pitOpen()],
    ['qd_crates', 2, 9], ['qd_slate_rack', 20, 9], ['qd_mason_bench', 21, 7], ['qd_winch', 30, 9], ['qd_blocks', 42, 9], ['qd_rubble', 44, 10],
    ['qd_wheelbarrow', 4, 20], ['qd_ore_cart', 19, 20], ['qd_rope_spool', 27, 20], ['qd_tool_rack', 29, 19], ['qd_barrel_hat', 41, 20], ['qd_column', 44, 19],
    ['qd_crates', 6, 25], ['qd_ore_boulder', 20, 27], ['qd_sandstone', 12, 30], ['qd_rock_heap', 27, 30], ['qd_blocks', 32, 25], ['qd_slate_spikes', 37, 28], ['qd_pick_sign', 26, 32],
  ],
  signs: { '22,31': "Quarrydown. Hard hats on past this point. The Quarry Pit is at the top of the town.", '27,10': '__qdboard', '26,13': "Warden Granger's Quarry Pit: straight up the avenue. Challengers welcome once the town's on its feet." },
  npcs: [{ kind: 'granger', x: 23, y: 3, dir: 'down', door: 'qd_pit', hideIf: () => pitOpen() }],
  trainers: [],
  exits: [{ r: [22, 35, 25, 35], to: x => ['crag2', { x: Math.max(18, Math.min(20, x - 4)), y: 1, dir: 'down' }] }, { r: [23, 0, 24, 0], to: () => ['qdpit', { x: 10, y: 26, dir: 'up' }] }],
  spawn: { x: 23, y: 33, dir: 'up' }, enc: { day: [['craglet', 1]], night: [['craglet', 1]] },
};
// the landslide on Cragside Heights is cleared, and the road north leads here
Object.assign(ROUTES.crag2.gate, { ok: () => true });
ROUTES.crag2.exits.push({ r: [18, 0, 20, 0], to: x => ['quarrydown', { x: x + 4 > 24 ? 24 : 23, y: 34, dir: 'up' }] });
ROUTES.crag2.signs['21,2'] = 'North: Quarrydown, the quarry town. The road crews cleared the landslide at last.';

/* ---------- the notice board */
function qdBoard() {
  const render = () => {
    const B = qdState();
    const rows = Object.entries(QD_PROJECTS).map(([id, p]) => {
      if (B.done[id]) return `<div class="proj"><b>${p.name}</b><span class="st">✔ Restored</span></div>`;
      if (B.pending[id]) return `<div class="proj"><b>${p.name}</b><span class="st">⚒ Work starts tonight</span></div>`;
      let ok = S.gold >= p.gold;
      const needs = Object.entries(p.need).map(([k, n]) => { const have = inv.count(k); if (have < n) ok = false; return `<span class="need ${have < n ? 'no' : ''}"><img src="${iconFor(k)}">${Math.min(have, n)}/${n}</span>`; }).join('');
      return `<div class="proj"><b>${p.name}</b><br><small>${p.blurb}</small><div style="display:flex;align-items:center;justify-content:space-between;gap:6px;margin-top:4px;flex-wrap:wrap"><div>${needs} <span class="need ${S.gold < p.gold ? 'no' : ''}">🪙 ${p.gold.toLocaleString()}g</span></div><button class="btn ${ok ? 'gold' : ''} sm" data-a="fund" data-id="${id}" ${ok ? '' : 'disabled'}>Fund</button></div></div>`;
    }).join('');
    return `<p>Quarrydown's repair list, pinned up by the foreman. Warden Granger won't open the Quarry Pit to challengers until both are done: <b>${qdRepairs()}/2</b>.</p><div class="mlist">${rows}</div><p class="hint">Stone & Supply sells stone, wood and fiber if you're short.</p>`;
  };
  openModal('Quarrydown notice board', render(), (a, d) => {
    if (a !== 'fund') return;
    const p = QD_PROJECTS[d.id];
    if (S.gold < p.gold || Object.entries(p.need).some(([k, n]) => inv.count(k) < n)) return Sound.play('error');
    for (const [k, n] of Object.entries(p.need)) inv.remove(k, n);
    S.gold -= p.gold; qdState().pending[d.id] = 1; updateHUD(); renderHotbar(); Sound.play('coin');
    toast(`Funded: ${p.name}. Granger's crew start work tonight!`, 2600);
    $('mBody').innerHTML = render();
  });
}

/* ---------- doors */
const QD_SHOP = [['stone', 150, 0, 10], ['wood', 200, 0, 10], ['fiber', 100, 0, 10], ['root_charm', 45], ['sturdy_charm', 130], ['ironbark_charm', 900]];
function qdDoor(sc, id) {
  if (id === 'qd_pit') return granger(sc);
  const b = ROUTES.quarrydown.buildings.find(q => q.id === id);
  if (b.repair && !qdDone(id)) return toast(`${b.name}: ${id === 'qd_crane' ? 'roped off and rotten' : 'boarded up'}. Its repair can be funded at the notice board.`, 2600);
  Sound.play('door');
  if (id === 'qd_clinic') return openModal('Quarrydown Clinic', '<p>A nurse in a dusty apron waves you in. "Quarry folk come in bruised every day. Your Fablemon are easy by comparison."</p><div class="row"><button class="btn gold" data-a="heal">Heal my team</button></div>', a => {
    if (a === 'heal') { S.mons.forEach(restMon); refreshTeamBtn(); Sound.play('fill'); toast('Your Fablemon are fully healed and their moves are restored!', 2400); closeModal(); }
  });
  if (id === 'qd_shop') {
    const render = () => `<p>The mason behind the counter dusts off his hands. "Stone, timber, rope: whatever you're building, we've got it by the bundle."</p><div class="mlist">${QD_SHOP.map(([i, p, c, n]) => shopRow(i, p, c || 0, n || 1)).join('')}</div>`;
    return openModal('Stone & Supply', render(), (a, d) => { if (a === 'buy') buy(d.id, +d.p, +d.n || 1); $('mBody').innerHTML = render(); });
  }
  if (id === 'qd_station') return qdStation(sc);
  if (id === 'qd_cottage') return toast('The Stone Cottage is warm and lived-in again. Lavender by the gate, smoke from the chimney.', 2600);
  if (id === 'qd_crane') return toast('The Old Crane creaks round and sets a block down as gently as an egg. The whole quarry cheers.', 2600);
}
function qdStation(sc) {
  if (!S.town.done.station) return openModal('Quarrydown Station', '<p>The platform is swept and the clock is right, but no trains are running. A notice reads: <i>"Service will resume when Smallroot Station reopens."</i></p>');
  const been = S.visited || {};
  openModal('Quarrydown Station', `<p>The little train is waiting at the platform.</p><div class="row" style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn gold" data-a="town">Ride to Smallroot</button>${been.brookholt ? '<button class="btn gold" data-a="bh">Ride to Brookholt</button>' : ''}<button class="btn" data-a="no">Not now</button></div>`, a => {
    closeModal(); if (a === 'town') travel(sc, 'town', { x: 63, y: 25, dir: 'down' }); if (a === 'bh') travel(sc, 'brookholt', { x: 6, y: 24, dir: 'down' });
  });
}

/* ---------- Warden Granger */
TRAINER_TYPES.granger = { label: 'Warden', challenge: ["Let's see what you're made of."], lose: ['Well struck.'], after: ["Stone doesn't hurry. Neither do I."] };
TRAINER_ROW.granger = 11;
// a Stone team with Rambastion's horns for cover against Tide and Leaf challengers; Flintcairn is his ace
const GRANGER_TEAM = [['clinkit_2', 32], ['cindhop_2', 33], ['craglet_2', 34], ['flintburrow', 34], ['ramruff_2', 35], ['flintcairn', 36]];
function granger(sc) {
  const G = (t, f = 0) => ({ who: 'trainer', name: 'Warden Granger', img: trainerPic('granger', f), t });
  if (S.crests && S.crests.stone) return Talk.say([G(pick(["Stone doesn't hurry. Neither do I. Come back any time.", "The crane's working, the cottage is lived in. Town's in good shape. So's your team.", "Keep that Crest polished. It's cut from the same rock as the quarry."]), 1)]);
  if (!S.crests || !S.crests.brook) return Talk.say([G("You'll want Delphine's Brook Crest before you come knocking here. Brookholt, down past the fen.")]);
  if (qdRepairs() < 2) return Talk.say([G("Granger. I run the quarry. And the Pit, when there's someone worth fighting in it."),
    G(`A Warden looks after a town before anything else. Ours has two jobs on the notice board: the Stone Cottage and the Old Crane. You've seen to ${qdRepairs()}.`),
    G("Get them done, and I'll take the barrier down myself.", 1)]);
  if (!team().some(m => m.hp > 0)) return toast('Your Fablemon are too tired to battle. Rest them first.', 2400);
  Talk.say([G("Crane's turning. Cottage is warm. You kept your word."), G("You don't break rock by hitting it hard. You hit it right. Show me you know the difference.")], () => {
    const tm = GRANGER_TEAM.map(wardenMon);
    Battle.start(tm[0], { label: 'Warden', name: 'Granger', team: tm, prize: 4500, boss: true, heals: 2, lose: "Rock's patient. Come back when you've found the crack.", onWin: () => {
      S.crests = S.crests || {}; S.crests.stone = 1; giveSigil('stone'); S.trainers = S.trainers || {}; S.trainers.granger = 1;
      setTimeout(() => { Sound.play('gotcha'); Talk.say([G("Ha! That's the cleanest break I've seen in years.", 1), G("Here: the Stone Crest. Cut from the first block this quarry ever gave up.", 1), G("Monty down in Smallroot will want to hear about this. He's been itching to run his Quarry Cup.", 1)], () => toast('You earned the Stone Crest!', 3000)); }, 400);
    } });
  });
}

/* ---------- the Quarry Pit (Granger's arena): one painted picture, 21 x 28 tiles */
const PIT_W = 21, PIT_H = 28, PIT_BOSS = { x: 10, y: 3 }, PIT_EXIT = { scene: 'quarrydown', x: 23, y: 2, dir: 'down' };
const PIT_WALK = (() => {
  const s = new Set(), r = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) s.add(x + ',' + y); };
  r(4, 5, 6, 5); r(14, 5, 15, 5); r(9, 4, 11, 5);    // the sides of the dais, and the steps up to Granger
  r(4, 6, 16, 10);                                    // the battle floor
  r(9, 11, 11, 23);                                   // the path between the working pits
  r(8, 24, 12, 27);                                   // the steps in
  return s;
})();
class QdPit extends World {
  constructor() { super('qdpit'); }
  create() {
    this.initWorld(PIT_W, PIT_H);
    this.add.rectangle(-300, -300, PIT_W * T + 600, PIT_H * T + 600, 0x0c0a08).setOrigin(0).setDepth(-20);
    this.add.image(0, 0, 'gym_qd').setOrigin(0).setScale(.5).setDepth(-10);
    for (const [x, y] of [[7.4, 2.5], [13.4, 2.5], [2, 10.5], [18.8, 10.5], [7.2, 22.5], [13.8, 22.5], [1.6, 17.5]]) {
      const g = this.add.circle(x * T, y * T, 14, 0xffc870, .13).setBlendMode(Phaser.BlendModes.ADD).setDepth(9e6 - 10);
      this.tweens.add({ targets: g, alpha: .05, yoyo: true, repeat: -1, duration: 1200 + Math.random() * 700 });
    }
    for (let r = 0; r < 4; r++) { const k = `granger_${DIRS[r]}`; if (!this.anims.exists(k)) this.anims.create({ key: k, frames: this.anims.generateFrameNumbers('tr_granger', { frames: [r * 4 + 1, r * 4, r * 4 + 3, r * 4] }), frameRate: 6, repeat: -1 }); }
    this.boss = this.add.sprite(PIT_BOSS.x * T + 8, PIT_BOSS.y * T + 15, 'tr_granger', 0).setOrigin(.5, 1).setDepth(PIT_BOSS.y * T + 15);
    this.shadow(this.boss, 12, 5);
    const sp = S.spawn && S.spawn.scene === 'qdpit' ? S.spawn : { x: 10, y: 26, dir: 'up' };
    this.makePlayer(sp);
    const cam = this.cameras.main;
    cam.setBounds(-T * 2, -T, (PIT_W + 4) * T, (PIT_H + 2) * T); cam.startFollow(this.player, true, 1, 1); cam.setRoundPixels(true);
    this.applyZoom(); this.scale.on('resize', this.onResize, this); this.events.once('shutdown', () => this.scale.off('resize', this.onResize, this));
    this.setupInput(); Sound.theme('route'); updateHUD(); renderHotbar(); FX.set(S.weather, true); this.fadeIn();
    if (!S.flags.pitSeen) { S.flags.pitSeen = 1; setTimeout(() => toast('The Quarry Pit. Granger waits on the platform at the top.', 3000), 600); }
  }
  onResize() { this.applyZoom(); renderHotbar(); }
  passable(x, y) { return PIT_WALK.has(x + ',' + y) && !(x === PIT_BOSS.x && y === PIT_BOSS.y); }
  bossNear(x, y) { return x === PIT_BOSS.x && y === PIT_BOSS.y + 1; }   // challenge him from the top of his steps
  talk() { this.face(PIT_BOSS.x, PIT_BOSS.y); this.boss.setFrame(0); this.p.busy = .4; granger(this); }
  actFacing() {
    const p = this.p; if (p.moving || this.paused || p.busy > 0) return;
    const [dx, dy] = DV[p.dir];
    if (p.x + dx === PIT_BOSS.x && p.y + dy === PIT_BOSS.y) return this.talk();
    if (eatHeld()) p.busy = .4;
  }
  act() { this.talk(); }
  onTap(wx, wy) {
    if (this.paused || this.sleeping || controlMode() !== 'tap') return;
    const x = Math.floor(wx / T), y = Math.floor(wy / T), p = this.p;
    if (this.boss.getBounds().contains(wx, wy) || (x === PIT_BOSS.x && y === PIT_BOSS.y)) {
      if (this.bossNear(p.x, p.y) && !p.moving) return this.talk();
      const path = this.path((a, b) => this.bossNear(a, b)); if (path) { p.path = path; p.pending = { tr: 1 }; } return;
    }
    if (this.passable(x, y)) { const path = this.path((a, b) => a === x && b === y); if (path) { p.path = path; p.pending = null; } }
  }
  tapGoal() { }
  arrived() { const p = this.p; if (!p.path.length && p.pending) { p.pending = null; this.talk(); } this.arriveHook(p.x, p.y); }
  arriveHook(x, y) { if (y >= PIT_H - 1) { Sound.play('door'); travel(this, PIT_EXIT.scene, { x: PIT_EXIT.x, y: PIT_EXIT.y, dir: PIT_EXIT.dir }); } }
}
const QD_SCENES = [class extends Crag { constructor() { super('quarrydown'); } }, QdPit];
