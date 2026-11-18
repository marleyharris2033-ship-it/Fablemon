/* ============================================================ Elderwood: "The Felling" (Act 4, part 1)
   Quarrydown's east road (opened by Alder's letter, after the Gale Crest) leads north into the old forest:
     fernwalk   Fernwalk         the haul road, logging trucks, a Verdance checkpoint and the old deer path round it
     eldglade   The Elder Glade  deep misty forest; the haul road scars it; clear-cut zones of grey stumps
     elderwood  Elderwood        the forest town: Warden Alder's Lodge, the inn, the store, the mill, the paddock
     ewcamp     Greenline Timber Camp   the sawmill, the log pond and the Harvester's shed
     eldest     The Eldest Tree  the oldest elder, the Harvester's last target
   Elder trees grew from the Rootweave. Their wood, rootwood, is the only timber that survives near the root, so
   Verdance needs it to line the Taproot bore. Plan: claude/elderwood-plan.md (the claude.ai project).
   Art is stand-in (other towns' buildings, the meadow trees) until the user's Elderwood art arrives. The long grass
   uses existing species; the user is making Elderwood's own Fablemon. */
const ew = () => (S.ew = S.ew || { herds: {}, seeds: 0, planted: 0 });
const ewOpen = () => !!(S.flags && S.flags.ewOpen);

/* ---------- Quarrydown's east road */
for (const y of [11, 12]) QD_MAP[y] = QD_MAP[y].slice(0, 46) + ',,';
ROUTES.quarrydown.exits.push({ r: [47, 11, 47, 12], to: () => ['fernwalk', { x: 19, y: 61, dir: 'up' }] });
ROUTES.quarrydown.gate = { area: [46, 11, 47, 12], sign: [45, 13], ok: ewOpen, openMsg: 'The barrier on the east road has been lifted. The way to Elderwood is open!',
  get text() { return "The east road to Elderwood. A barrier and a sign: 'ROAD CLOSED. Greenline Timber haulage only.'"; } };

/* ---------- the forest: more trees, stumps where it's been clear-felled, things that block a path until earned */
const EW_KEYS = ['fernwalk', 'eldglade', 'elderwood', 'ewcamp', 'eldest'];
const _ewBuild = buildRoute;
buildRoute = function () {
  const R = _ewBuild();
  if (!RC.ew) return R;
  const N = RW * RH, inR = (x, y, r) => x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3];
  const keep = new Uint8Array(N);   // never fill: paths, grass, water, people, signs, pickups, decor
  for (let i = 0; i < N; i++) if (R.dirtish[i] || R.waterish[i] || R.grass[i] >= 0 || R.blocked[i]) keep[i] = 1;
  const mark = (x, y, r) => { for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const a = x + dx, b = y + dy; if (a >= 0 && b >= 0 && a < RW && b < RH) keep[b * RW + a] = 1; } };
  for (const t of ROUTE_TRAINERS) mark(t.x, t.y, 1);
  for (const k of Object.keys(ROUTE_SIGNS)) { const [x, y] = k.split(',').map(Number); mark(x, y, 1); }
  for (const p of PICKUPS) mark(p.x, p.y, 1);
  for (const n of RC.npcs || []) mark(n.x, n.y, 1);
  for (const [, , x, y, w] of RC.ewdecor || []) for (let k = 0; k < (w || 1); k++) mark(x + k, y, 0);
  const near = (x, y) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const a = x + dx, b = y + dy; if (a >= 0 && b >= 0 && a < RW && b < RH && (R.dirtish[b * RW + a] || R.grass[b * RW + a] >= 0)) return true; } return false; };
  const cut = (RC.clearcut || []).filter(c => !c.ok || !c.ok());
  // drop the meadow's own scattered trees inside the clear-cut, then fill
  R.deco = R.deco.filter(d => { if (d.tall && cut.some(c => inR(d.x, d.y, c.r))) { R.blocked[d.y * RW + d.x] = 0; return false; } return true; });
  for (let y = 2; y < RH - 2; y++) for (let x = 2; x < RW - 2; x++) {
    const i = y * RW + x; if (keep[i] || R.blocked[i]) continue;
    const h = hash(x * 31 + 7, y * 17 + 3), c = cut.find(c => inR(x, y, c.r));
    if (c) { if (h < .2) { R.blocked[i] = 1; R.deco.push({ x, y, f: h < .15 ? 'stump' : 'rock_flat' }); } continue; }
    if ((RC.clear || []).some(r => inR(x, y, r))) continue;
    if (!near(x, y) && h < (RC.forest || 0)) { R.blocked[i] = 1; R.deco.push({ x, y, f: h < RC.forest * .55 ? 'tree_oak' : 'tree_pine', tall: true }); }
    else if (h > .96) R.deco.push({ x, y, f: 'wildflowers', flat: true });
  }
  for (const [a, bb, c, d] of RC.walls || []) for (let y = bb; y <= d; y++) for (let x = a; x <= c; x++) { const i = y * RW + x; if (R.blocked[i] && !R.waterish[i]) continue; R.blocked[i] = 1; R.grass[i] = -1; if (!R.waterish[i] && (x + y) % 2 === 0) R.deco.push({ x, y, f: hash(x, y) < .5 ? 'tree_pine' : 'tree_oak', tall: true }); }
  for (const b of RC.blocks || []) if (!b.ok()) { const [a, bb, c, d] = b.area; for (let y = bb; y <= d; y++) for (let x = a; x <= c; x++) { const i = y * RW + x; R.blocked[i] = 1; R.grass[i] = -1; R.deco.push({ x, y, f: b.f || 'bush_round', gate: 1 }); } }
  for (const [, , x, y, w] of RC.ewdecor || []) for (let k = 0; k < (w || 1); k++) { R.blocked[y * RW + x + k] = 1; R.grass[y * RW + x + k] = -1; }
  // story actors: snapped to the nearest open tile; people and things you can talk to block their tile
  R.actors = [];
  if (RC.actors) {
    if (ROUTE_SIGNS === RC.signs) ROUTE_SIGNS = { ...ROUTE_SIGNS };
    for (const a of RC.actors()) {
      let best = null, bd = 1e9;
      for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const x = a.x + dx, y = a.y + dy; if (x < 2 || y < 2 || x >= RW - 2 || y >= RH - 2) continue; const i = y * RW + x; if (R.blocked[i] || ROUTE_SIGNS[x + ',' + y]) continue; const d = dx * dx + dy * dy; if (d < bd) { bd = d; best = [x, y]; } }
      if (!best) continue; a.x = best[0]; a.y = best[1]; R.actors.push(a);
      if (a.walk) continue;   // things you walk onto (hoofprints)
      const i = a.y * RW + a.x; R.blocked[i] = 1; R.grass[i] = -1; ROUTE_SIGNS[a.x + ',' + a.y] = '__door:' + a.id;
    }
  }
  return R;
};
// decor from any atlas (stand-ins until Elderwood's own art), drawn like the town's buildings
const _ewDeco = Route.prototype.create;
Route.prototype.create = function () {
  _ewDeco.call(this);
  if (!RC.ew) return;
  for (const [at, f, x, y, w] of RC.ewdecor || []) { const im = this.add.image(x * T + (w || 1) * 8, y * T + 16, at, f).setOrigin(.5, 1).setDepth(y * T + 15); this.tall.push(im); }
  this.ewSpr = {};
  for (const a of this.R.actors || []) {
    const X = a.x * T + 8, Y = a.y * T + 16; let im;
    if (a.print) { im = this.add.graphics().setDepth(Y - 14); im.fillStyle(0x3a2814, .75); im.fillEllipse(X - 3, Y - 9, 3, 5); im.fillEllipse(X + 3, Y - 6, 3, 5); this.tweens.add({ targets: im, alpha: .45, duration: 900, yoyo: true, repeat: -1 }); }
    else if (a.mon) { im = hdSpr(this.add.sprite(X, Y, 'mon_' + a.mon, 0).setOrigin(.5, 1).setDepth(Y - 1), a.mon); if (a.scale) im.setScale(im.scaleX * a.scale, im.scaleY * a.scale); this.tweens.add({ targets: im, y: Y - 2, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.inOut' }); }
    else if (a.lamp) { im = this.add.image(X, Y, 'objects', 'lantern_post').setOrigin(.5, 1).setDepth(Y - 1); if (a.lit) { const gl = this.add.circle(X, Y - 20, 14, 0xffd070, .35).setDepth(9e6 - 28); this.tweens.add({ targets: gl, alpha: .18, duration: 800, yoyo: true, repeat: -1 }); } else im.setTint(0x6a6a7a); }
    else if (a.img) { im = this.add.image(X, Y, a.img[0], a.img[1]).setOrigin(.5, 1).setDepth(Y - 1); if (a.scale) im.setScale(a.scale); if (a.glow) { const gl = this.add.circle(X, Y - 6, 7, 0xb8ffb0, .35).setDepth(Y); this.tweens.add({ targets: gl, alpha: .1, scale: 1.4, duration: 900, yoyo: true, repeat: -1 }); } }
    else if (a.tex) { im = this.add.sprite(X, Y - 1, a.tex, DIRS.indexOf(a.dir || 'down') * 4).setOrigin(.5, 1).setDepth(Y - 1); this.shadow(im, 12, 5); }
    if (im) { this.ewSpr[a.id] = im; if (!a.print) this.tall.push(im); }
  }
  if (RC.onEnter) RC.onEnter(this);
  if (RC.tint) this.add.rectangle(0, 0, RW * T, RH * T, RC.tint[0], RC.tint[1]).setOrigin(0).setDepth(9e6 - 31);
};

/* ---------- wild Fablemon: existing woodland species until Elderwood's own arrive */
const ewEnc = (day, night) => ({ day: day.filter(([s]) => SPECIES[s]), night: night.filter(([s]) => SPECIES[s]) });
const FERN_ENC = ewEnc([['sprigfawn', 16], ['pebblouse', 14], ['tappit', 14], ['hollowcub', 12], ['simmerkit', 10], ['ramruff', 6], ['hollowbark', 6], ['heathfoal', 4]],
  [['snarlwisp', 20], ['hollowcub', 14], ['pebblouse', 10], ['duskcloak', 6], ['inkwick', 6]]);
const GLADE_ENC = ewEnc([['sprigfawn', 12], ['stumpstag', 6], ['tappit', 12], ['drummajor', 3], ['hollowcub', 10], ['tanglebruin', 5], ['pebblouse', 10], ['cobblerollie', 6], ['simmerkit', 8], ['ramruff_2', 4], ['hollowbark', 4]],
  [['snarlwisp', 16], ['murkhowl', 6], ['hollowcub', 10], ['tanglebruin', 5], ['cobblerollie', 8], ['hollowbark_3', 4], ['inkwick', 6]]);
const NO_ENC = { day: [['ramruff', 1]], night: [['ramruff', 1]] };

// trainer kinds for the forest (their own art since 17 Nov)
Object.assign(TRAINER_TYPES, {
  ranger: { label: 'Ranger', challenge: ["You're a long way from the farms. The forest tests everyone who walks it.", "Stay on the trail! ...After our battle."], lose: ['The forest likes you, I think.'], after: ['Mind the trucks on the road.'] },
  logger: { label: 'Logger', challenge: ["Mind yourself, this is a work road. Fancy a quick battle on my break?", "Greenline pays by the log. I'm on a break, so let's battle."], lose: ["Ha! You've a strong arm for a farmer."], after: ["It's honest work. Mostly."] },
  herder: { label: 'Herder', challenge: ["The herds have scattered. I'm in no mood, but let's battle anyway."], lose: ['Fair enough.'], after: ['If you see a stag with silver antlers, tell Alder.'] },
});
// the women of each trade have their own look
Object.assign(TRAINER_TYPES, { ranger2: { ...TRAINER_TYPES.ranger }, logger2: { ...TRAINER_TYPES.logger }, herder2: { ...TRAINER_TYPES.herder } });

const EW_BASE = { ew: true, paths: [], ponds: [], bridge: null, open: [], clear: [], pickups: [], signs: {}, trainers: [], zones: [], props: [] };
Object.assign(ROUTES, {
  fernwalk: { ...EW_BASE, name: 'Fernwalk', w: 40, h: 64, forest: .34, tint: [0x1e3a1a, .10],
    paths: [[17, 0, 21, 64], [4, 40, 17, 42], [4, 14, 6, 42], [4, 14, 17, 16]],
    ponds: [[34, 32, 2.6, 34]],
    open: [[17, 0, 21, 3], [17, 60, 21, 63]],
    zones: [[24, 46, 30, 57, 59, 61], [8, 46, 14, 58, 59, 61], [24, 30, 30, 40, 60, 62], [8, 20, 14, 36, 60, 62], [24, 4, 30, 20, 61, 62], [8, 4, 14, 11, 61, 62]],
    pickups: [{ id: 'fw1', x: 2, y: 28, item: 'tonic', n: 3 }, { id: 'fw2', x: 29, y: 2, gold: 6000 }, { id: 'fw3', x: 10, y: 60, item: 'mon_treat', n: 2 }],
    signs: { '16,58': 'Fernwalk. Elderwood lies north, through the ferns. Mind the timber trucks!', '22,44': "A tree with a ribbon tied round it, and a note: 'THIS TREE IS 600 YEARS OLD. LEAVE IT BE.'" },
    trainers: [
      { id: 'fw_t1', kind: 'ranger', name: 'Moss', x: 16, y: 52, dir: 'right', sight: 4, team: [['sprigfawn', 60], ['tappit', 60], ['hollowcub', 61]] },
      { id: 'fw_t2', kind: 'logger', name: 'Dougie', x: 22, y: 47, dir: 'left', sight: 4, team: [['pebblouse', 60], ['simmerkit', 61], ['ramruff', 61]] },
      { id: 'fw_t3', kind: 'herder2', name: 'Elspeth', x: 16, y: 9, dir: 'right', sight: 4, team: [['sprigfawn', 61], ['hollowcub', 62], ['stumpstag', 62]] },
      { id: 'fw_t4', kind: 'logger', name: 'Big Ned', x: 22, y: 5, dir: 'left', sight: 4, team: [['cobblerollie', 62], ['simmerkit', 62], ['tanglebruin', 63]] },
    ],
    gate: { area: [17, 26, 21, 28], sign: [16, 29], ok: () => !!ew().campShut, openMsg: 'The checkpoint has been abandoned. The haul road is open.',
      get text() { return "A Verdance checkpoint across the road. 'GREENLINE TIMBER. NO PUBLIC ACCESS. HAULAGE ONLY.' A guard hut, a barrier, and a tech watching the road."; } },
    walls: [[0, 26, 3, 28], [7, 26, 16, 28], [22, 26, 39, 28]],   // the checkpoint line: the road and the old deer path are the only ways through
    blocks: [{ area: [4, 26, 6, 28], ok: () => !!ew().deer, f: 'bush_wide' }],
    up: x => ['eldglade', { x: Math.max(26, Math.min(30, x + 9)), y: 46, dir: 'up' }],
    down: x => ['quarrydown', { x: 45, y: 12, dir: 'left' }],
    spawn: { x: 19, y: 61, dir: 'up' }, enc: FERN_ENC },

  eldglade: { ...EW_BASE, name: 'The Elder Glade', w: 56, h: 48, forest: .42, murk: true,
    paths: [[26, 30, 30, 48], [26, 30, 56, 33], [27, 0, 29, 30], [0, 18, 27, 20]],
    ponds: [[10, 31, 2.6, 2], [44, 9, 3, 2]],
    open: [[26, 44, 30, 47], [27, 0, 29, 3], [0, 18, 3, 20], [52, 30, 55, 33]],
    zones: [[4, 4, 24, 15, 62, 64], [4, 23, 24, 42, 62, 65], [31, 4, 52, 16, 63, 65], [6, 43, 22, 46, 62, 64]],
    clearcut: [{ r: [32, 19, 54, 29], ok: () => ew().regrow >= 1 }, { r: [32, 35, 54, 45], ok: () => ew().regrow >= 2 }],
    pickups: [{ id: 'eg1', x: 50, y: 6, item: 'tonic', n: 4 }, { id: 'eg2', x: 5, y: 45, gold: 7000 }, { id: 'eg3', x: 20, y: 6, item: 'mon_treat', n: 3 }],
    signs: { '25,45': 'The Elder Glade. The oldest wood in the valley. Elderwood is north; the Eldest Tree, west.', '31,29': "Fresh tyre ruts and a stencilled post: 'GREENLINE TIMBER. HAUL ROAD. CAMP EAST.'" },
    trainers: [
      { id: 'eg_t1', kind: 'ranger2', name: 'Rowanne', x: 25, y: 38, dir: 'right', sight: 4, team: [['stumpstag', 63], ['tappit', 63], ['snarlwisp', 64]] },
      { id: 'eg_t2', kind: 'herder', name: 'Corrie', x: 26, y: 12, dir: 'right', sight: 4, team: [['tanglebruin', 63], ['stumpstag', 64], ['drummajor', 64]] },
      { id: 'eg_t3', kind: 'forager', name: 'Bramwell', x: 14, y: 21, dir: 'up', sight: 3, team: [['simmerkit', 63], ['hollowcub', 64], ['murkhowl', 64]] },
      { id: 'eg_t4', kind: 'logger2', name: 'Kerr', x: 40, y: 34, dir: 'up', sight: 3, team: [['cobblerollie', 64], ['pebblouse', 64], ['tanglebruin', 65]] },
    ],
    down: x => ['fernwalk', { x: Math.max(17, Math.min(21, x - 9)), y: 1, dir: 'down' }],
    up: x => ['elderwood', { x: 47, y: 69, dir: 'up' }],
    left: y => ['eldest', { x: 30, y: 15, dir: 'left' }],
    right: y => ['ewcamp', { x: 1, y: 15, dir: 'right' }],
    spawn: { x: 28, y: 46, dir: 'up' }, enc: GLADE_ENC },

  // Elderwood (18 Nov): the forest's capital, twice the size of Smallroot. A grand avenue runs from the south gate
  // through the market square to the Warden's Lodge; the river runs down the east side, and the old footbridge
  // (the story's first repair) crosses to the herd paddock, the Town Hall and Ellis's workshop.
  elderwood: { ...EW_BASE, name: 'Elderwood', w: 100, h: 72, town: true, forest: .34,
    paths: [[46, 11, 49, 71], [8, 11, 66, 13], [8, 24, 66, 26], [9, 11, 11, 26], [8, 45, 69, 48], [8, 60, 66, 62], [9, 24, 11, 62], [34, 36, 58, 55],
      [75, 45, 95, 48], [84, 26, 86, 62], [75, 60, 95, 62]],
    ponds: [-2, 3, 8, 13, 18, 23, 28, 33, 38, 43, 48, 53, 58, 63, 68, 73].map(y => [73, y, 2.4, 3.4]),
    get bridge() { return ewRepaired('ew_bridge') ? { x0: 70, x1: 76, y0: 45, y1: 48 } : null; },
    open: [[45, 67, 50, 71]], clear: [[3, 3, 69, 68], [76, 3, 96, 68]],
    buildings: [
      { id: 'ew_lodge', atlas: 'bh', frame: 'bh_lockhouse', cx: 47, by: 10, door: 0, name: "Warden's Lodge" },
      { id: 'ew_inn', atlas: 'hm', frame: 'hm_clinic', cx: 39, by: 35, door: 0, name: 'The Antler Inn' },
      { id: 'ew_store', atlas: 'hm', frame: 'hm_shop', cx: 55, by: 35, door: 0, name: 'Forest Stores' },
      { id: 'ew_mill', atlas: 'bh', frame: 'bh_mill', old: 'bh_mill_old', cx: 64, by: 44, door: 0, name: 'Old Town Mill', repair: true, done: () => ewRepaired('ew_mill') },
      { id: 'ew_mayor', atlas: 'town', frame: 'hall', cx: 91, by: 44, door: 0, name: 'Town Hall' },
      { id: 'ew_carver', atlas: 'cove', frame: 'cv_hut', cx: 80, by: 59, door: 0, name: "Ellis's Workshop" },
      // the rest of the capital: homes and trades
      { id: 'ew_h1', atlas: 'town', frame: 'homeA', cx: 17, by: 23, door: 0, name: 'Timber house' },
      { id: 'ew_h2', atlas: 'cove', frame: 'cv_cottage', cx: 27, by: 23, door: 0, name: "Woodcutter's cottage" },
      { id: 'ew_h3', atlas: 'bh', frame: 'bh_cottage', cx: 37, by: 23, door: 0, name: 'Old forest cottage' },
      { id: 'ew_joinery', atlas: 'town', frame: 'carpenter', cx: 57, by: 23, door: 0, name: 'The Joinery' },
      { id: 'ew_h4', atlas: 'town', frame: 'homeC', cx: 19, by: 44, door: 0, name: 'Long house' },
      { id: 'ew_h5', atlas: 'cove', frame: 'cv_house', cx: 29, by: 44, door: 0, name: 'Mossy house' },
      { id: 'ew_smith', atlas: 'town', frame: 'smith', cx: 38, by: 59, door: 0, name: 'Elderwood Smithy' },
      { id: 'ew_bake', atlas: 'qd', frame: 'qd_shop', cx: 55, by: 59, door: 0, name: 'The Bakehouse' },
      { id: 'ew_h6', atlas: 'br', frame: 'br_cottage', cx: 18, by: 59, door: 0, name: "Gardener's house" },
      { id: 'ew_h7', atlas: 'town', frame: 'homeB', cx: 28, by: 59, door: 0, name: 'Brick house' },
      { id: 'ew_h8', atlas: 'cove', frame: 'cv_cottage', cx: 91, by: 59, door: 0, name: 'Riverside house' },
      { id: 'ew_h9', atlas: 'qd', frame: 'qd_cottage', cx: 79, by: 44, door: 0, name: "Ferryman's house" },
      { id: 'ew_h10', atlas: 'hm', frame: 'hm_kite_house', cx: 16, by: 10, door: 0, name: 'Tall house' },
      { id: 'ew_h11', atlas: 'town', frame: 'homeA', cx: 26, by: 10, door: 0, name: 'Hunters\' lodge' },
      { id: 'ew_h12', atlas: 'br', frame: 'br_cottage', cx: 36, by: 10, door: 0, name: 'Stone cottage' },
      { id: 'ew_h13', atlas: 'town', frame: 'tavern', cx: 58, by: 10, door: 0, name: 'The Old Oak' },
    ],
    props: [['bh_board', 40, 41, 3, 'bh']],
    ewdecor: [['town', 'fountain', 45, 52, 4], ['town', 'stall', 36, 40, 3], ['town', 'stall', 36, 51, 3], ['town', 'stall', 55, 40, 3], ['town', 'stall', 55, 51, 3], ['town', 'stall', 36, 46, 3], ['town', 'stall', 55, 46, 3], ['town', 'lamp', 35, 37, 1], ['town', 'lamp', 57, 37, 1], ['town', 'lamp', 35, 54, 1], ['town', 'lamp', 57, 54, 1], ['town', 'lamp', 45, 16, 1], ['town', 'lamp', 50, 16, 1], ['town', 'lamp', 45, 21, 1], ['town', 'lamp', 50, 21, 1], ['town', 'lamp', 45, 30, 1], ['town', 'lamp', 50, 30, 1], ['town', 'lamp', 45, 65, 1], ['town', 'lamp', 50, 65, 1], ['town', 'lamp', 12, 23, 1], ['town', 'lamp', 66, 23, 1], ['town', 'lamp', 12, 44, 1], ['town', 'lamp', 66, 63, 1], ['town', 'lamp', 13, 63, 1], ['town', 'lamp', 76, 49, 1], ['town', 'lamp', 95, 49, 1], ['town', 'lamp', 12, 14, 1], ['town', 'lamp', 30, 14, 1], ['town', 'lamp', 66, 14, 1], ['hm', 'hm_bench', 41, 38, 2], ['hm', 'hm_bench', 51, 38, 2], ['hm', 'hm_bench', 41, 53, 2], ['hm', 'hm_bench', 51, 53, 2], ['town', 'flowerbed', 38, 44, 3], ['town', 'flowerbed', 54, 44, 3], ['town', 'planter', 38, 49, 3], ['town', 'planter', 54, 49, 3], ['objects', 'tree_pine', 20, 28, 1], ['objects', 'tree_apple', 23, 28, 1], ['objects', 'tree_oak', 25, 28, 1], ['objects', 'tree_apple', 27, 28, 1], ['objects', 'tree_oak', 30, 28, 1], ['objects', 'tree_oak', 15, 29, 1], ['objects', 'tree_oak', 17, 29, 1], ['objects', 'tree_oak', 19, 30, 1], ['objects', 'tree_oak', 21, 30, 1], ['objects', 'tree_oak', 23, 30, 1], ['objects', 'tree_apple', 25, 30, 1], ['objects', 'tree_oak', 27, 30, 1], ['objects', 'tree_pine', 29, 30, 1], ['objects', 'tree_oak', 14, 31, 1], ['objects', 'tree_oak', 17, 31, 1], ['objects', 'tree_oak', 19, 32, 1], ['objects', 'tree_oak', 23, 32, 1], ['objects', 'tree_pine', 25, 32, 1], ['objects', 'tree_oak', 27, 32, 1], ['objects', 'tree_oak', 29, 32, 1], ['objects', 'tree_pine', 14, 33, 1], ['objects', 'tree_oak', 21, 33, 1], ['objects', 'tree_pine', 16, 34, 1], ['objects', 'tree_pine', 19, 34, 1], ['objects', 'tree_apple', 24, 34, 1], ['objects', 'tree_oak', 28, 34, 1], ['objects', 'tree_apple', 30, 34, 1], ['objects', 'tree_oak', 26, 35, 1], ['objects', 'tree_pine', 14, 36, 1], ['objects', 'tree_oak', 18, 36, 1], ['objects', 'tree_oak', 22, 37, 1], ['objects', 'tree_pine', 26, 37, 1], ['objects', 'tree_oak', 15, 38, 1], ['objects', 'tree_oak', 17, 38, 1], ['objects', 'tree_pine', 21, 39, 1], ['objects', 'tree_oak', 23, 39, 1], ['objects', 'tree_oak', 29, 39, 1], ['objects', 'tree_pine', 64, 28, 1], ['objects', 'tree_pine', 66, 28, 1], ['objects', 'tree_oak', 68, 28, 1], ['objects', 'tree_pine', 61, 29, 1], ['objects', 'tree_oak', 64, 30, 1], ['objects', 'tree_oak', 67, 30, 1], ['objects', 'tree_pine', 63, 32, 1], ['objects', 'tree_oak', 61, 33, 1], ['objects', 'tree_apple', 65, 33, 1], ['objects', 'tree_pine', 68, 33, 1], ['objects', 'tree_apple', 64, 35, 1], ['objects', 'tree_oak', 61, 36, 1], ['objects', 'tree_oak', 68, 36, 1], ['objects', 'tree_pine', 17, 15, 1], ['objects', 'tree_apple', 20, 15, 1], ['objects', 'tree_oak', 24, 15, 1], ['objects', 'tree_pine', 28, 15, 1], ['objects', 'tree_apple', 30, 15, 1], ['objects', 'tree_pine', 34, 15, 1], ['objects', 'tree_oak', 36, 15, 1], ['objects', 'tree_apple', 39, 15, 1], ['objects', 'tree_apple', 15, 16, 1], ['objects', 'tree_pine', 22, 16, 1], ['objects', 'tree_oak', 26, 16, 1], ['objects', 'tree_oak', 19, 17, 1], ['objects', 'tree_oak', 28, 17, 1], ['objects', 'tree_oak', 32, 17, 1], ['objects', 'tree_apple', 34, 17, 1], ['objects', 'tree_apple', 39, 17, 1], ['objects', 'tree_pine', 15, 18, 1], ['objects', 'tree_oak', 24, 18, 1], ['objects', 'tree_pine', 26, 18, 1], ['objects', 'tree_oak', 30, 18, 1], ['objects', 'tree_apple', 36, 18, 1], ['objects', 'tree_oak', 18, 19, 1], ['objects', 'tree_oak', 22, 19, 1], ['objects', 'tree_pine', 33, 19, 1], ['objects', 'tree_pine', 14, 20, 1], ['objects', 'tree_pine', 24, 20, 1], ['objects', 'tree_pine', 27, 20, 1], ['objects', 'tree_apple', 30, 20, 1], ['objects', 'tree_pine', 39, 20, 1], ['objects', 'tree_apple', 53, 15, 1], ['objects', 'tree_oak', 55, 15, 1], ['objects', 'tree_pine', 57, 15, 1], ['objects', 'tree_pine', 67, 15, 1], ['objects', 'tree_apple', 63, 16, 1], ['objects', 'tree_pine', 65, 16, 1], ['objects', 'tree_oak', 55, 17, 1], ['objects', 'tree_apple', 58, 17, 1], ['objects', 'tree_apple', 60, 17, 1], ['objects', 'tree_pine', 53, 18, 1], ['objects', 'tree_oak', 62, 18, 1], ['objects', 'tree_pine', 64, 18, 1], ['objects', 'tree_oak', 66, 18, 1], ['objects', 'tree_pine', 55, 19, 1], ['objects', 'tree_pine', 57, 19, 1], ['objects', 'tree_oak', 59, 19, 1], ['objects', 'tree_pine', 68, 19, 1], ['objects', 'tree_apple', 61, 20, 1], ['objects', 'tree_oak', 63, 20, 1], ['objects', 'tree_oak', 65, 20, 1], ['objects', 'tree_pine', 16, 64, 1], ['objects', 'tree_oak', 20, 64, 1], ['objects', 'tree_oak', 27, 64, 1], ['objects', 'tree_pine', 31, 64, 1], ['objects', 'tree_pine', 34, 64, 1], ['objects', 'tree_pine', 37, 64, 1], ['objects', 'tree_oak', 42, 64, 1], ['objects', 'tree_oak', 14, 65, 1], ['objects', 'tree_pine', 22, 65, 1], ['objects', 'tree_apple', 24, 65, 1], ['objects', 'tree_apple', 39, 65, 1], ['objects', 'tree_pine', 16, 66, 1], ['objects', 'tree_apple', 18, 66, 1], ['objects', 'tree_oak', 20, 66, 1], ['objects', 'tree_pine', 29, 66, 1], ['objects', 'tree_oak', 31, 66, 1], ['objects', 'tree_oak', 33, 66, 1], ['objects', 'tree_pine', 42, 66, 1], ['objects', 'tree_oak', 37, 67, 1], ['objects', 'tree_pine', 39, 67, 1], ['objects', 'tree_oak', 53, 64, 1], ['objects', 'tree_oak', 55, 64, 1], ['objects', 'tree_apple', 58, 64, 1], ['objects', 'tree_oak', 60, 64, 1], ['objects', 'tree_pine', 62, 64, 1], ['objects', 'tree_oak', 66, 64, 1], ['objects', 'tree_pine', 68, 64, 1], ['objects', 'tree_oak', 64, 65, 1], ['objects', 'tree_oak', 54, 66, 1], ['objects', 'tree_oak', 56, 66, 1], ['objects', 'tree_apple', 60, 66, 1], ['objects', 'tree_oak', 62, 66, 1], ['objects', 'tree_pine', 67, 66, 1], ['objects', 'tree_apple', 81, 4, 1], ['objects', 'tree_pine', 79, 5, 1], ['objects', 'tree_apple', 81, 6, 1], ['objects', 'tree_apple', 79, 7, 1], ['objects', 'tree_pine', 77, 8, 1], ['objects', 'tree_oak', 79, 10, 1], ['objects', 'tree_oak', 95, 4, 1], ['objects', 'tree_oak', 91, 5, 1], ['objects', 'tree_apple', 93, 6, 1], ['objects', 'tree_pine', 91, 9, 1], ['objects', 'tree_oak', 93, 9, 1], ['objects', 'tree_pine', 90, 11, 1], ['objects', 'tree_oak', 95, 11, 1], ['objects', 'fence_h', 77, 33, 2], ['objects', 'fence_h', 79, 33, 2], ['objects', 'fence_h', 81, 33, 2], ['objects', 'fence_h', 87, 33, 2], ['objects', 'fence_h', 89, 33, 2], ['objects', 'fence_h', 91, 33, 2], ['objects', 'fence_h', 93, 33, 2], ['bog', 'log', 61, 40, 2], ['bog', 'log', 63, 40, 2], ['bog', 'log', 65, 40, 2], ['bog', 'log', 60, 27, 2], ['bog', 'log', 62, 27, 2], ['hm', 'hm_hay_cart', 80, 28, 2], ['hm', 'hm_hay_cart', 92, 16, 2], ['hm', 'hm_planter', 30, 26, 2], ['hm', 'hm_planter', 62, 26, 2]],
    signs: { '44,68': "Elderwood, capital of the forest. Please walk softly: the trees are older than the town.", '41,40': '__door:ew_board',
      '83,41': "The herd paddock. When the great herds are home, they rest here.", '45,11': "The Warden's Lodge. Warden Alder keeps the forest and its herds." },
    gate: { area: [68, 45, 69, 48], sign: [67, 49], ok: () => ewRepaired('ew_bridge'), openMsg: 'The new footbridge is open. The paddock and the far bank of town are reachable again!',
      get text() { return "The old footbridge across the river lies broken in the water. A notice: 'Repairs to be funded by the town. See the board in the market square.'"; } },
    trainers: [],
    down: x => ['eldglade', { x: 28, y: 1, dir: 'down' }],
    spawn: { x: 47, y: 69, dir: 'up' }, enc: NO_ENC },

  ewcamp: { ...EW_BASE, name: 'Greenline Timber Camp', w: 40, h: 32, quiet: true, forest: .2, tint: [0x3a3020, .08],
    paths: [[0, 14, 40, 17], [8, 5, 33, 27]],
    ponds: [[33, 25, 4.5, 3.2]],
    open: [[0, 13, 3, 18]], clear: [[6, 3, 38, 29]],
    clearcut: [{ r: [2, 2, 37, 29], ok: () => false }],
    ewdecor: [['qd', 'qd_crane', 32, 11], ['cove', 'cv_shipyard', 16, 12], ['bh', 'bh_halt', 12, 25], ['qd', 'qd_rope_spool', 24, 11], ['bog', 'log', 22, 20], ['bog', 'log', 23, 20], ['bog', 'log', 24, 20], ['bog', 'log', 22, 21], ['bog', 'log', 23, 21], ['qd', 'qd_crates', 9, 6], ['qd', 'qd_barrier', 4, 13]],
    signs: { '3,19': "GREENLINE TIMBER — ELDERWOOD CAMP. Hard hats. Hi-vis. No visitors. 'Growing the future, one log at a time.'" },
    trainers: [],
    left: y => ['eldglade', { x: 54, y: Math.max(30, Math.min(33, y + 16)), dir: 'left' }],
    spawn: { x: 1, y: 15, dir: 'right' }, enc: NO_ENC },

  eldest: { ...EW_BASE, name: 'The Eldest Tree', w: 32, h: 30, quiet: true, forest: .5, murk: true,
    paths: [[10, 14, 32, 16], [8, 8, 22, 24]],
    open: [[28, 13, 31, 17]], clear: [[6, 4, 24, 26]],
    ewdecor: [['town', 'hearth4', 15, 9]],
    signs: { '12,18': "Carvings run round the roots: herds, owls, a great stag, and a tree with a light inside it." },
    trainers: [],
    right: y => ['eldglade', { x: 1, y: 19, dir: 'right' }],
    spawn: { x: 30, y: 15, dir: 'left' }, enc: NO_ENC },
});

/* ---------- the town's repairs (stage 2 adds what they unlock) */
const EW_PROJECTS = {
  ew_bridge: { name: 'Paddock footbridge', need: { wood: 120, fiber: 60 }, gold: 6000, blurb: 'A new footbridge over the river to the herd paddock, the Town Hall and the far bank of town.' },
  ew_mill: { name: 'Old Town Mill', need: { wood: 200, stone: 120 }, gold: 9000, blurb: 'Get the town mill sawing again, so Elderwood folk can work for themselves instead of for Greenline.' },
};
const ewRepaired = id => !!(ew().done || {})[id];
function ewBoard() {
  const W = ew(); W.done = W.done || {};
  const rows = Object.entries(EW_PROJECTS).map(([id, p]) => {
    const done = W.done[id], can = !done && S.gold >= p.gold && Object.entries(p.need).every(([k, n]) => inv.count(k) >= n);
    return `<div class="proj"><b>${done ? '✔ ' : ''}${p.name}</b><br><small>${p.blurb}</small><br><span class="st">${p.gold}g · ${Object.entries(p.need).map(([k, n]) => `${n} ${ITEMS[k].name}`).join(', ')}</span>${done ? '' : `<div class="row"><button class="btn gold" data-a="${id}" ${can ? '' : 'disabled'}>Fund it</button></div>`}</div>`;
  }).join('');
  openModal('Elderwood notice board', `<p class="hint">Mayor Pruett's list of town repairs. "Every bit of this used to be paid for by the mill."</p><div class="mlist">${rows}</div>`, a => {
    const p = EW_PROJECTS[a]; if (!p || W.done[a]) return;
    S.gold -= p.gold; for (const [k, n] of Object.entries(p.need)) inv.remove(k, n);
    W.done[a] = S.day; updateHUD(); renderHotbar(); Sound.play('levelup'); closeModal();
    toast(`You funded the ${p.name}! It'll be ready tomorrow morning... no, the town's so grateful they've started already. It's done!`, 3600);
    const sc = game.scene.getScenes(true).find(s => s.scene.key === 'elderwood'); if (sc) travel(sc, 'elderwood', { x: sc.p.x, y: sc.p.y, dir: sc.p.dir });
  });
}

/* ---------- doors and people */
function ewDoor(sc, id) {
  if (ewDoorHook && ewDoorHook(sc, id)) return;
  if (id === 'ew_board') return ewBoard();
  const B = (ROUTES.elderwood.buildings || []).find(b => b.id === id);
  const shut = {
    ew_lodge: "Warden Alder's Lodge. Through the window: a big man by the fire, staring at a map of the forest covered in red crosses.",
    ew_inn: 'The Antler Inn. Warm light and the smell of stew. "Back later, love, we\'re run off our feet with Greenline crews."',
    ew_store: 'Forest Stores. "Closed for stocktaking." Most of the shelves are empty.',
    ew_mill: ewRepaired('ew_mill') ? 'The Old Town Mill. Saws whine, and local folk are back at work.' : 'The Old Town Mill. Cold and quiet since Greenline came. A sign: "CLOSED. SEE NOTICE BOARD."',
    ew_mayor: "Mayor Pruett's house. The curtains are drawn.",
    ew_carver: "Ellis's Workshop. Carved birds hang in the window. A note: 'Out gathering offcuts.'",
    ew_joinery: 'The Joinery. Half-built chairs and a smell of sawdust. "Greenline buys all our timber now. Not much left to make."',
    ew_smith: 'Elderwood Smithy. The forge is banked low. Axe heads hang in a row.',
    ew_bake: 'The Bakehouse. Acorn bread and elderberry buns. "Fresh at dawn, gone by nine!"',
    ew_h1: 'A tall timber house. Someone is practising the fiddle inside.', ew_h2: "A woodcutter's cottage. An axe leans by the door, unused.",
    ew_h3: 'An old forest cottage, half grown over with ivy.', ew_h4: 'A long house. Children are arguing over a board game.',
    ew_h5: 'A mossy house. A cat watches you from the windowsill.', ew_h6: "The gardener's house. Seedlings line every sill.",
    ew_h7: 'A brick house. Nobody answers.', ew_h8: 'A riverside house. Fishing rods are drying on the porch.',
    ew_h9: "The ferryman's house. With the bridge out, he's been rowing folk across all week.",
    ew_h10: 'A tall, narrow house. Wind chimes made of acorn caps tinkle by the door.', ew_h11: "The hunters' lodge. Antlers over the door, shed ones, collected from the forest floor.",
    ew_h12: 'A stone cottage. Someone inside is singing an old forest song.', ew_h13: 'The Old Oak, a quiet pub for the old loggers. "Locals only, love. Try the Antler."',
  };
  return toast(shut[id] || (B ? B.name : ''), 3600);
}
const _ewArrive = Route.prototype.arriveHook;
Route.prototype.arriveHook = function (x, y) {
  if (RC.ew && this.R.actors) { const a = this.R.actors.find(a => a.walk && a.x === x && a.y === y); if (a && a.onStep) { a.onStep(this, a); } }
  if (RC.ew && RC.onWalk) RC.onWalk(this, x, y);
  return _ewArrive.call(this, x, y);
};
const ewRefresh = sc => { const p = sc.p; sc.time.delayedCall(250, () => travel(sc, sc.scene.key, { x: p.x, y: p.y, dir: p.dir })); };
const _ewBh = bhDoor;
bhDoor = function (sc, id) { return id && id.startsWith('ew_') ? ewDoor(sc, id) : _ewBh(sc, id); };
let ewDoorHook = null;   // ewquests.js handles the story's doors and people first

/* ---------- Verdance in the forest: techs on the deer path and round the camp (they leave when the camp shuts) */
Object.assign(VD_REGION, { fernwalk: 'camp', eldglade: 'camp', ewcamp: 'camp' });
Object.assign(VD_PLACES, {
  fernwalk: [{ k: 'tech', id: 'vd_fw1', kind: 'vtech', name: 'Hart', at: [5, 30], team: vdTeam(['pebblouse', 61], ['hollowcub', 62]) },
    { k: 'tech', id: 'vd_fw2', kind: 'vtech2', name: 'Pim', at: [11, 15], team: vdTeam(['sprigfawn', 62], ['simmerkit', 62]) },
    { k: 'stake', at: [23, 24] }, { k: 'stake', at: [15, 34] }],
  eldglade: [{ k: 'tech', id: 'vd_eg1', kind: 'vtech', name: 'Greaves', at: [42, 31], team: vdTeam(['cobblerollie', 63], ['stumpstag', 64]) },
    { k: 'board', at: [33, 28], text: "<b>GREENLINE TIMBER</b><br><i>a Verdance company</i><br><br>Sustainable forestry for a greener tomorrow. Every tree felled is a tree replanted.*<br><small>*in principle</small>" },
    { k: 'stake', at: [38, 22] }, { k: 'stake', at: [46, 40] }],
  ewcamp: [{ k: 'tech', id: 'vd_cp1', kind: 'vtech', name: 'Norris', at: [8, 15], team: vdTeam(['cobblerollie', 63], ['tanglebruin', 64], ['pebblouse', 64]) },
    { k: 'tech', id: 'vd_cp2', kind: 'vtech2', name: 'Lacey', at: [20, 8], team: vdTeam(['simmerkit', 64], ['tappit', 64]) },
    { k: 'tech', id: 'vd_cp3', kind: 'vtech', name: 'Fitch', at: [28, 22], team: vdTeam(['stumpstag', 64], ['cobblerollie', 65], ['tanglebruin', 65]) }],
});

/* ---------- scenes */
var EXTRA_SCENES = (typeof EXTRA_SCENES !== 'undefined' ? EXTRA_SCENES : []).concat(EW_KEYS.map(k => { const C = class extends Route { constructor() { super(k); } }; C.KEY = k; return C; }));

/* ---------- saves made inside the old, smaller Elderwood (before 18 Nov) may put you inside a tree or a house now:
   step out to the south gate */
const _ewSafeCreate = Route.prototype.create;
Route.prototype.create = function () {
  _ewSafeCreate.call(this);
  try {
    if (this.scene.key !== 'elderwood' || !this.p || this.passable(this.p.x, this.p.y)) return;
    const sp = RC.spawn; this.p.x = sp.x; this.p.y = sp.y; this.p.dir = sp.dir;
    if (this.player) this.player.setPosition(sp.x * T + 8, sp.y * T + 15).setDepth(sp.y * T + 15);
    if (this.refreshFollower) this.refreshFollower();
  } catch (e) { console.warn('ew spawn', e); }
};
