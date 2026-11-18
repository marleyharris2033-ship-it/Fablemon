/* ============================================================ Helping the towns (18 Nov 2026)
   Every Warden wants to see you help their town before they'll battle you (the Ice Whale and the Windcrown
   legendary already worked that way). Only Smallroot needs rebuilding; the other towns have jobs of their own:

   Brookholt   (Delphine)  The Lock-keeper's Ledger: 5 torn pages in Mossmere Bog, Sluice Fen and the town.
                           Wheel Trouble: the miller's wheel jams at night. A Muddlebub family is nesting in it.
                           Lantern Night: 10 lotus roots and 5 bog peat for the canal folk's floating lanterns.
   Quarrydown  (Granger)   The Crane's First Lift: clear 3 rockfalls with a Stone or Spark Fablemon, then ride up.
                           Geode Hunter: 6 sparkling geodes on Cragside Pass, the Heights and in town, for the mosaic.
                           The Stone Cottage Lodger: own 5 different Stone-type Fablemon to show old Hew.
   Driftwood   (Hal's boat) Hal's Lost Tools: 4 tools glinting in the shallows; a Tide Fablemon dives for them.
   Beaconreach (Orrin)     Storm Lanterns: light the 3 harbour lanterns with an Ember or Spark Fablemon.
   Highmoor    (Tamsin)    Runaway Kites: 4 kites blew off in a gale. The wind keeps snatching them away.

   Quests count as done for anyone who already holds that town's Crest (or has the boat), so old saves move on.
   Props on any map: TQ_PROPS[scene] -> [{ id, x, y, img|tex|mon|draw, near, tap }], snapped to a free tile,
   blocking it, tapped like a door ('__door:tq_<id>'). */
const tq = () => (S.tq = S.tq || { pages: {}, rocks: {}, geodes: {}, tools: {}, lamps: {}, kites: {} });
const tqHas = (...types) => team().some(m => m.hp > 0 && types.some(t => hasType(m.sp, t)));
const tqNight = () => S.time >= 1140 || S.time < 360;
const tqCount = o => Object.keys(o || {}).length;
const crestHas = c => !!(S.crests && S.crests[c]);

/* ---------- where things are */
const TQ_PAGES = [['route3', 18, 12], ['route3', 46, 30], ['route4', 14, 26], ['route4', 40, 10], ['brookholt', 6, 26]];
const TQ_ROCKS = [['quarrydown', 6, 30], ['quarrydown', 42, 14], ['crag2', 20, 8]];
const TQ_GEODES = [['crag1', 10, 12, 'amber'], ['crag1', 26, 38, 'jade'], ['crag2', 8, 30, 'rose quartz'], ['crag2', 32, 18, 'smoky quartz'], ['quarrydown', 4, 18, 'blue agate'], ['quarrydown', 44, 24, 'fire opal']];
const TQ_TOOLS = [['driftwood', 6, 22, 'mallet'], ['driftwood', 38, 27, 'plane'], ['dunes', 12, 26, 'caulking iron'], ['dunes', 40, 24, 'brass compass']];
const TQ_LAMPS = [['beaconreach', 22, 31], ['beaconreach', 13, 27], ['beaconreach', 35, 27]];
const TQ_KITES = [   // each kite's hops: it lands at the next one every time the wind takes it
  [['highmoor', 6, 33], ['highmoor', 18, 34], ['highmoor', 4, 24]],
  [['highmoor', 38, 30], ['highmoor', 36, 16], ['highmoor', 40, 9]],
  [['galeledges', 18, 30], ['galeledges', 26, 20], ['galeledges', 12, 14]],
  [['heatherstep', 18, 40], ['heatherstep', 10, 28], ['heatherstep', 24, 22]]];
const TQ_NPCS = {
  brookholt: [{ id: 'miller', tex: 'tr_allotment', name: 'Miller Ada', x: 37, y: 26 }, { id: 'lanternlady', tex: 'tr_ponddipper', name: 'Wynne of the canal', x: 22, y: 17 }],
  quarrydown: [{ id: 'fergus', tex: 'tr_miner', name: 'Crane-man Fergus', x: 31, y: 12 }, { id: 'opal', tex: 'tr_climber', name: 'Opal of Stone & Supply', x: 19, y: 12 }, { id: 'hew', tex: 'tr_rambler', name: 'Old Hew', x: 38, y: 23 }],
  highmoor: [{ id: 'kitty', tex: 'tr_wispwatcher', name: 'Kitty of Kestrel Kites', x: 12, y: 33 }],
};

/* ---------- the quests */
const TQ_Q = {
  brook: [
    { id: 'tq_ledger', get name() { return `Find the Lock-keeper's Ledger (${Math.min(5, tqCount(tq().pages))}/5 pages)`; }, hint: "Delphine's ledger blew apart in a gale. Torn pages lie in Mossmere Bog, Sluice Fen and Brookholt itself: look for flapping paper.", done: () => tqCount(tq().pages) >= 5 || crestHas('brook'), reward: { gold: 800, items: { root_charm: 5 } } },
    { id: 'tq_wheel', name: 'Wheel trouble at the Old Watermill', get hint() { return tq().wheelSeen ? "Something's nesting in the wheel. Go back after dark and look at the wheel." : 'Miller Ada stands by the Old Watermill in Brookholt. Her wheel jams every night.'; }, done: () => !!tq().wheel || crestHas('brook'), reward: { gold: 600 } },
    { id: 'tq_lanterns', name: 'Lantern Night on the canal', hint: 'Wynne, by the canal in Brookholt, needs 10 lotus roots and 5 bog peat for the floating lanterns. Lotus seeds and peat are sold at the Chandlery.', done: () => !!tq().lanterns || crestHas('brook'), reward: { gold: 600, items: { lantern: 2 } } },
  ],
  stone: [
    { id: 'tq_crane', get name() { return `The Crane's First Lift (${Math.min(3, tqCount(tq().rocks))}/3 rockfalls)`; }, get hint() { return tqCount(tq().rocks) < 3 ? 'Crane-man Fergus by the Old Crane needs three rockfalls cleared: two round Quarrydown, one on Cragside Heights. A Stone or Spark Fablemon can shift them.' : 'All clear! Talk to Fergus by the Old Crane for the first lift.'; }, done: () => !!tq().lift || crestHas('stone'), reward: { gold: 1200 } },
    { id: 'tq_geodes', get name() { return `Geode Hunter (${Math.min(6, tqCount(tq().geodes))}/6)`; }, hint: 'Opal outside Stone & Supply wants six geodes for the town mosaic. Look for sparkling rocks on Cragside Pass, Cragside Heights and round Quarrydown.', done: () => !!tq().mosaic || crestHas('stone'), reward: { gold: 1000, items: { ironbark_charm: 1 } } },
    { id: 'tq_lodger', name: 'The Stone Cottage lodger', get hint() { return `Old Hew at the Stone Cottage wants to meet five different Stone-type Fablemon (${tqStoneKinds()}/5 befriended). Then talk to him.`; }, done: () => !!tq().lodger || crestHas('stone'), reward: { gold: 1000, items: { stone_lantern: 2 } } },
  ],
  boat: [
    { id: 'tq_tools', get name() { return `Find Hal's lost tools (${Math.min(4, tqCount(tq().tools))}/4)`; }, hint: "A wave took Hal's tool box. Four tools glint in the shallows of Driftwood Cove and Saltgrass Dunes. A Tide Fablemon can dive for them.", done: () => tqCount(tq().tools) >= 4 || ((typeof cove === 'function') && (cove().stage || 0) > 0) || crestHas('spark'), reward: { gold: 800 } },
  ],
  spark: [
    { id: 'tq_lamps', get name() { return `Light the storm lanterns (${Math.min(3, tqCount(tq().lamps))}/3)`; }, hint: 'Orrin says the three storm lanterns round Beaconreach harbour went out in the gale. An Ember or Spark Fablemon can light them.', done: () => tqCount(tq().lamps) >= 3 || crestHas('spark'), reward: { gold: 1500 } },
  ],
  galecrest: [
    { id: 'tq_kites', get name() { return `Catch the runaway kites (${Math.min(4, tqCount(tq().kites))}/4)`; }, hint: 'Kitty of Kestrel Kites lost four kites in a gale: two round Highmoor, one on Gale Ledges, one on Heatherstep Cliffs. Grab them before the wind takes them again!', done: () => tqCount(tq().kites) >= 4 || crestHas('gale'), reward: { gold: 2000, items: { skyward_charm: 3 } } },
  ],
};
for (const [before, list] of Object.entries(TQ_Q)) { const i = QUESTS.findIndex(q => q.id === before); if (i >= 0) QUESTS.splice(i, 0, ...list); }
const tqStoneKinds = () => new Set(S.mons.filter(m => hasType(m.sp, 'Stone')).map(m => m.sp)).size;
const townHelped = { brook: () => TQ_Q.brook.every(q => q.done()), stone: () => TQ_Q.stone.every(q => q.done()), spark: () => TQ_Q.spark.every(q => q.done()), gale: () => TQ_Q.galecrest.every(q => q.done()) };

/* ---------- the props on each map */
const TQ_PROPS = {};
const addP = (k, p) => (TQ_PROPS[k] = TQ_PROPS[k] || []).push(p);
TQ_PAGES.forEach(([k, x, y], i) => addP(k, { id: 'page' + i, x, y, img: ['vq', 'vq_page'], bob: 1, show: () => !tq().pages[i] && !crestHas('brook'), tap: sc => { tq().pages[i] = S.day; Sound.play('pick'); toast(`A torn ledger page! (${tqCount(tq().pages)}/5)`, 2200); tqDone(sc); } }));
TQ_ROCKS.forEach(([k, x, y], i) => addP(k, { id: 'rock' + i, x, y, img: ['qd', 'qd_rock_heap'], show: () => !tq().rocks[i] && !tq().lift && !crestHas('stone'), tap: sc => {
  if (!tqHas('Stone', 'Spark')) return toast('A rockfall blocks the way. A Stone or Spark Fablemon could shift it.', 2600);
  const m = team().find(m => m.hp > 0 && (hasType(m.sp, 'Stone') || hasType(m.sp, 'Spark')));
  tq().rocks[i] = S.day; Sound.play('hit'); sc.cameras.main.shake(260, .006); toast(`${monName(m)} smashes the rockfall apart! (${tqCount(tq().rocks)}/3)`, 2400); tqDone(sc); } }));
TQ_GEODES.forEach(([k, x, y, kind], i) => addP(k, { id: 'geode' + i, x, y, img: ['objects', 'rock_large'], glint: 0xc0f0ff, show: () => !tq().geodes[i] && !tq().mosaic && !crestHas('stone'), tap: sc => { tq().geodes[i] = kind; Sound.play('gotcha'); toast(`You crack it open: ${kind}! (${tqCount(tq().geodes)}/6)`, 2400); tqDone(sc); } }));
TQ_TOOLS.forEach(([k, x, y, what], i) => addP(k, { id: 'tool' + i, x, y, draw: 'glint', show: () => !tq().tools[i] && !tqQuestDone('tq_tools'), tap: sc => {
  if (!tqHas('Tide')) return toast('Something glints under the water, just out of reach. A Tide Fablemon could dive for it.', 2600);
  tq().tools[i] = what; Sound.play('pick'); toast(`Your Tide Fablemon surfaces with Hal's ${what}! (${tqCount(tq().tools)}/4)`, 2600); tqDone(sc); } }));
TQ_LAMPS.forEach(([k, x, y], i) => addP(k, { id: 'lamp' + i, x, y, img: ['br', 'br_lantern_post'], lit: () => !!tq().lamps[i] || crestHas('spark'), show: () => true, tap: sc => {
  if (tq().lamps[i] || crestHas('spark')) return toast('The storm lantern burns bright and steady.', 1800);
  if (!tqHas('Ember', 'Spark')) return toast('The storm lantern is cold and dark. An Ember or Spark Fablemon could light it.', 2600);
  tq().lamps[i] = S.day; Sound.play('fill'); toast(`The storm lantern flares back to life! (${tqCount(tq().lamps)}/3)`, 2400); tqDone(sc); } }));
TQ_KITES.forEach((hops, i) => hops.forEach(([k, x, y], h) => addP(k, { id: `kite${i}_${h}`, x, y, draw: 'kite', show: () => !tq().kites[i] && !crestHas('gale') && ((tq().kitehop || {})[i] || 0) === h, tap: sc => {
  const H = (tq().kitehop = tq().kitehop || {});
  if (h < hops.length - 1 && Math.random() < .8) { H[i] = h + 1; Sound.play('swish'); const [k2] = hops[h + 1]; toast(k2 === sc.scene.key ? 'A gust snatches the kite away! It lands further off...' : `A gust carries the kite clean off ${RC.name}! It's come down on ${ROUTES[k2].name}.`, 2800); return tqRefresh(sc); }
  tq().kites[i] = S.day; Sound.play('gotcha'); toast(`Got it! (${tqCount(tq().kites)}/4 kites)`, 2200); tqDone(sc); } })));
// the night nest at the watermill
addP('brookholt', { id: 'nest', x: 38, y: 24, mon: 'muddlebub', show: () => !tq().wheel && !crestHas('brook') && tq().wheelSeen && tqNight(), tap: sc => tqNest(sc) });
for (const [k, list] of Object.entries(TQ_NPCS)) for (const n of list) addP(k, { id: n.id, x: n.x, y: n.y, tex: n.tex, person: n.name, show: () => true, tap: sc => tqTalk(sc, n) });
const tqQuestDone = id => { const q = QUESTS.find(q => q.id === id); return q ? q.done() : true; };

/* ---------- putting them on the map: snapped to an open tile that isn't a road */
const _tqBuild = buildRoute;
buildRoute = function () {
  const R = _tqBuild(), key = Object.keys(ROUTES).find(k => ROUTES[k] === RC);
  R.tq = [];
  const list = (TQ_PROPS[key] || []).filter(p => p.show()); if (!list.length) return R;
  // only spots you can walk to from where you arrive (puzzles unsolved), so nothing's ever out of reach
  const reach = new Uint8Array(RW * RH), sp = RC.spawn || { x: RW >> 1, y: RH - 3 }, Q = [[sp.x, sp.y]]; reach[sp.y * RW + sp.x] = 1;
  for (let x = 0; x < RW; x++) for (const y of [0, 1, RH - 2, RH - 1]) if (!R.blocked[y * RW + x]) { reach[y * RW + x] = 1; Q.push([x, y]); }   // every way in, the far ones too
  for (let y = 0; y < RH; y++) for (const x of [0, 1, RW - 2, RW - 1]) if (!R.blocked[y * RW + x]) { reach[y * RW + x] = 1; Q.push([x, y]); }
  while (Q.length) { const [x, y] = Q.pop(); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + a, Y = y + b, j = Y * RW + X; if (X < 0 || Y < 0 || X >= RW || Y >= RH || reach[j] || R.blocked[j]) continue; reach[j] = 1; Q.push([X, Y]); } }
  for (const p of list) {
    let best = null, bd = 1e9;
    for (const rad of [14, 99]) { if (best) break;   // nearby if possible; anywhere you can reach if not, so nothing's ever lost
    for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
      const x = p.x + dx, y = p.y + dy; if (x < 2 || y < 2 || x >= RW - 2 || y >= RH - 2) continue;
      const i = y * RW + x; if (!reach[i] || R.blocked[i] || ROUTE_SIGNS[x + ',' + y] || ROUTE_SIGNS[x + ',' + (y - 1)] || R.tq.some(q => q.x === x && q.y === y)) continue;
      let open = 0; for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!R.blocked[(y + b) * RW + x + a]) open++;
      if (open < 3) continue;   // never plug a narrow way
      const d = dx * dx + dy * dy + (R.dirtish && R.dirtish[i] ? 6 : 0) + (R.grass[i] >= 0 ? 3 : 0);
      if (d < bd) { bd = d; best = [x, y]; }
    } }
    if (!best) continue;
    const q = { ...p, x: best[0], y: best[1] }; R.tq.push(q);
    const i = q.y * RW + q.x; R.blocked[i] = 1; R.grass[i] = -1;
    if (ROUTE_SIGNS === RC.signs) ROUTE_SIGNS = { ...ROUTE_SIGNS }; ROUTE_SIGNS[q.x + ',' + q.y] = '__door:tq_' + q.id;
  }
  return R;
};
const tqGlow = (sc, x, y, col, r = 10) => { const g = sc.add.circle(x, y, r, col, .35).setDepth(9e6 - 30).setBlendMode(Phaser.BlendModes ? Phaser.BlendModes.ADD : 1); sc.tweens.add({ targets: g, alpha: .1, scale: 1.3, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' }); return g; };
function tqTex(sc) {
  if (!sc.textures.exists('tq_glint')) { const c = document.createElement('canvas'); c.width = c.height = 16; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.beginPath(); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, r = k % 2 ? 2 : 7; g.lineTo(8 + Math.cos(a) * r, 8 + Math.sin(a) * r); } g.fill(); sc.textures.addCanvas('tq_glint', c); }
  if (!sc.textures.exists('tq_kite')) { const c = document.createElement('canvas'); c.width = 20; c.height = 30; const g = c.getContext('2d');
    g.fillStyle = '#e04a3a'; g.beginPath(); g.moveTo(10, 1); g.lineTo(19, 10); g.lineTo(10, 21); g.lineTo(1, 10); g.closePath(); g.fill(); g.fillStyle = '#ffd24a'; g.beginPath(); g.moveTo(10, 1); g.lineTo(19, 10); g.lineTo(10, 10); g.closePath(); g.fill(); g.beginPath(); g.moveTo(1, 10); g.lineTo(10, 21); g.lineTo(10, 10); g.closePath(); g.fill();
    g.strokeStyle = '#5a3a1e'; g.lineWidth = 1; g.beginPath(); g.moveTo(10, 1); g.lineTo(19, 10); g.lineTo(10, 21); g.lineTo(1, 10); g.closePath(); g.moveTo(10, 1); g.lineTo(10, 21); g.moveTo(1, 10); g.lineTo(19, 10); g.stroke();
    g.strokeStyle = '#fff'; g.beginPath(); g.moveTo(10, 21); g.quadraticCurveTo(6, 25, 10, 29); g.stroke(); g.fillStyle = '#3a8fd0'; g.fillRect(7, 24, 3, 2); g.fillRect(10, 27, 3, 2); sc.textures.addCanvas('tq_kite', c); }
}
const _tqCreate = Route.prototype.create;
Route.prototype.create = function () {
  _tqCreate.call(this);
  if (!this.R || !this.R.tq || !this.R.tq.length) return;
  tqTex(this); this.tqSpr = {};
  for (const p of this.R.tq) {
    const X = p.x * T + 8, Y = p.y * T + 16; let im;
    if (p.img) im = this.add.image(X, Y, p.img[0], p.img[1]).setOrigin(.5, 1);
    else if (p.tex) { im = this.add.sprite(X, Y - 1, p.tex, 0).setOrigin(.5, 1); this.shadow(im, 12, 5); }
    else if (p.mon) { const wid = walkId(this, { sp: p.mon }); monAnims(this, wid); im = hdSpr(this.add.sprite(X, Y, 'mon_' + wid, 0).setOrigin(.5, 1), wid); this.tweens.add({ targets: im, y: Y - 2, duration: 700, yoyo: true, repeat: -1 }); }
    else if (p.draw === 'glint') { im = this.add.image(X, Y - 6, 'tq_glint').setScale(.8); this.tweens.add({ targets: im, angle: 90, alpha: .35, scale: .5, duration: 800, yoyo: true, repeat: -1 }); }
    else if (p.draw === 'kite') { im = this.add.image(X, Y - 4, 'tq_kite').setOrigin(.5, 1); this.tweens.add({ targets: im, angle: { from: -12, to: 12 }, y: Y - 8, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' }); }
    if (!im) continue;
    im.setDepth(Y - 1); this.tqSpr[p.id] = im;
    if (p.bob) this.tweens.add({ targets: im, angle: { from: -6, to: 6 }, duration: 600, yoyo: true, repeat: -1 });
    if (p.glint) tqGlow(this, X, Y - 6, p.glint, 7);
    if (p.lit && p.lit()) tqGlow(this, X, Y - 26, 0xffc860, 13);
  }
};
const tqRefresh = sc => { const p = sc.p; sc.time.delayedCall(350, () => travel(sc, sc.scene.key, { x: p.x, y: p.y, dir: p.dir })); };
function tqDone(sc) { checkQuests(); updateHUD(); tqRefresh(sc); }
const _tqDoor = bhDoor;
bhDoor = function (sc, id) { if (id && id.startsWith('tq_')) { const p = (sc.R.tq || []).find(q => 'tq_' + q.id === id); if (p) p.tap(sc); return; } return _tqDoor(sc, id); };

/* ---------- the people */
const TQ_SAY = (n, t, f = 0) => ({ who: 'trainer', name: n.name, img: trainerPic(n.tex.replace(/^tr_/, ''), f), t });
function tqTalk(sc, n) {
  const T0 = tq(), say = (lines, cb) => Talk.say(lines.map(([t, f]) => TQ_SAY(n, t, f)), cb);
  if (n.id === 'miller') {
    if (T0.wheel) return say([["The wheel turns like a dream now. Thank you, love.", 1]]);
    if (!T0.wheelSeen) { T0.wheelSeen = 1; return say([['Every night that wheel jams solid, and every morning there\'s mud packed in the paddles.', 0], ["I've stayed up twice to catch whoever's doing it and fallen asleep both times. Would you look? After dark, mind.", 0]], () => { checkQuests(); }); }
    return say([[tqNight() ? "It's dark now. Go and have a look at the wheel!" : 'Come back after dark and look at the wheel. Whatever it is only comes out at night.', 0]]);
  }
  if (n.id === 'lanternlady') {
    if (T0.lanterns) return say([["Every year from now on, we'll light one for you.", 1]]);
    if (inv.count('lotus_root') >= 10 && inv.count('bog_peat') >= 5) {
      inv.remove('lotus_root', 10); inv.remove('bog_peat', 5); renderHotbar(); T0.lanterns = S.day;
      return say([['Ten lotus and the peat! The lanterns float on lotus leaves, see, and the peat keeps the little flame in.', 1], ['Watch the canal...', 1]], () => { tqLanternShow(sc); checkQuests(); });
    }
    return say([["Lantern Night's the canal folk's oldest festival. Floating lanterns, all the way down to the lock.", 0], [`But we've nothing to make them with. Could you bring 10 lotus roots and 5 bog peat? You've ${inv.count('lotus_root')} lotus and ${inv.count('bog_peat')} peat.`, 0]]);
  }
  if (n.id === 'fergus') {
    if (T0.lift) return say([['Best view in the valley from up there. Any time you want a ride, just say.', 1]]);
    if (tqCount(T0.rocks) >= 3) return say([["You cleared them all! Then she's ready. Climb in the basket. Hold the rope. Don't look down. Actually, do: that's the point!", 1]], () => tqLift(sc));
    return say([["The crane's sound as a bell. It's me that's not. I haven't lifted a stone since the landslide.", 0], [`Three rockfalls still block the old ways (${tqCount(T0.rocks)}/3 cleared). Shift them for me and I'll take her up again. A Stone or Spark Fablemon could do it.`, 0]]);
  }
  if (n.id === 'opal') {
    if (T0.mosaic) return say([["Look at that mosaic! Six stones from six corners of the crags. It'll be there a hundred years.", 1]]);
    if (tqCount(T0.geodes) >= 6) { T0.mosaic = S.day; return say([['All six! Amber, jade, rose quartz, smoky quartz, blue agate and fire opal. I can set the town mosaic at last.', 1], ["Here, from the shop. An Ironbark Charm: a Fablemon holding it takes physical hits better.", 1]], () => checkQuests()); }
    return say([["Every quarry town has a mosaic in its square. Ours has a hole in the middle of it.", 0], [`I need six geodes. They sparkle, you can't miss them: Cragside Pass, Cragside Heights and round town. You've found ${tqCount(T0.geodes)}.`, 0]]);
  }
  if (n.id === 'hew') {
    if (T0.lodger) return say([["Mortoad and Craglet and the rest. I'll carve every one of yours. Come and see them sometime.", 1]]);
    if (tqStoneKinds() >= 5) { T0.lodger = S.day; return say([['Five! Five different Stone kin, and you know every one by name. That\'s a keeper.', 1], ["I've carved you a pair of stone lanterns. Put them by your door so the stone remembers you.", 1]], () => checkQuests()); }
    return say([["Forty years quarrymaster. Now I just carve. One stone for every Fablemon I've ever met.", 0], [`I've not met many young ones, though. Befriend five different Stone-type Fablemon and come and introduce me? You've ${tqStoneKinds()}.`, 0]]);
  }
  if (n.id === 'kitty') {
    if (tqCount(T0.kites) >= 4) return say([['All four kites back on their poles! Come and fly one any time.', 1]]);
    return say([["The gale last week took four of my best kites clean off their poles!", 0], [`They're out on the moor, Gale Ledges and Heatherstep. Grab them quick: the wind keeps snatching them. ${tqCount(T0.kites)}/4 back.`, 0]]);
  }
}
function tqNest(sc) {
  const T0 = tq(), opts = [{ html: 'Move the family to your farm pond', v: 'farm', cls: 'gold' }, { html: "Leave them be (Ada can fit a guard)", v: 'leave' }];
  Talk.say([{ who: 'trainer', name: 'Muddlebub family', img: monPic('muddlebub', 'front'), t: 'A Muddlebub mother and three little ones have packed a mud nest right in the paddles. They blink up at you.' }], () => {
    openModal('The nest in the wheel', `<p>They'll need a new home if the wheel's to turn. What do you do?</p><div class="row" style="display:flex;flex-direction:column;gap:6px">${opts.map(o => `<button class="btn ${o.cls || ''}" data-a="${o.v}">${o.html}</button>`).join('')}</div>`, a => {
      closeModal(); T0.wheel = S.day;
      if (a === 'farm') { const m = newMon('muddlebub', Math.max(14, Math.min(24, team()[0] ? team()[0].lv : 14))); m.loc = 'ranch'; S.mons.push(m); S.caught.muddlebub = 1; toast('The Muddlebub family settles at your farm. One of them has taken a shine to you: it waits at your ranch!', 3600); }
      else toast('Ada fits a little guard over the paddles and builds the family a mud bank of their own beside the wheel. Everyone\'s happy.', 3400);
      Sound.play('gotcha'); checkQuests(); tqRefresh(sc);
    });
  });
}
function tqLanternShow(sc) {
  if (!sc || sc.scene.key !== 'brookholt') return;
  for (let k = 0; k < 14; k++) sc.time.delayedCall(k * 380, () => {
    const x = (25.5 + (Math.random() - .5) * 2) * T, l = sc.add.circle(x, -10, 3, 0xffd27a, 1).setDepth(9e6 - 5), g = tqGlow(sc, x, -10, 0xffb040, 9);
    sc.tweens.add({ targets: [l, g], y: RH * T + 20, x: x + (Math.random() - .5) * 20, duration: 11000, onComplete: () => { l.destroy(); g.destroy(); } });
  });
  toast('Fourteen little lanterns drift down the canal on lotus leaves. The whole town comes out to watch.', 4200);
}
function tqLift(sc) {
  const T0 = tq(); T0.lift = S.day;
  const f = $('fade'); f.style.opacity = 1;
  setTimeout(() => {
    Talk.say([{ who: 'trainer', name: 'Crane-man Fergus', img: trainerPic('miner', 1), t: 'Up she goes... The whole valley spread out like a map. Smallroot, the Heights, the sea glinting away west.' },
      { who: 'trainer', name: 'Crane-man Fergus', img: trainerPic('miner', 1), t: "See that ledge? Nobody's been on it since the crane stopped. Something's up there. Go on, it's yours." }], () => {
      f.style.opacity = 0; inv.add('sturdy_charm', 5); inv.add('mon_treat', 3); S.gold += 1500; updateHUD(); renderHotbar(); Sound.play('gotcha');
      toast('On the ledge: an old quarry chest with 5 Sturdy Charms, 3 Fablemon Feasts and 1500g!', 3600); checkQuests();
    });
  }, 500);
}
// Fenfang, the rare bog Fablemon, comes out more once Delphine's ledger is back
const _tqWild = rollWild;
rollWild = function (a, b, extra) { if (S.tq && tqCount(S.tq.pages) >= 5 && RC && (RC === ROUTES.route3 || RC === ROUTES.route4) && Math.random() < .06) return wildMon('fenfang', a + Math.floor(Math.random() * (b - a + 1))); return _tqWild(a, b, extra); };

/* ---------- the Wardens (and Hal) want to see the town helped first */
const TQ_GATE = [
  ['delphine', 'brook', 'brook', 'Warden Delphine', 'delphine', ["Before we battle: a Warden looks after a place, not just their Fablemon.", "Brookholt could use a friend. Help the town first."]],
  ['granger', 'stone', 'stone', 'Warden Granger', 'granger', ["A Warden looks after a town before anything else.", "Quarrydown's got jobs that want doing. See to them, then come and find me in the Pit."]],
  ['orrin', 'spark', 'spark', 'Warden Orrin', 'orrin', ["Lightning can wait, sailor. The storm lanterns can't.", "Light them for me, and then we'll make some thunder."]],
  ['tamsin', 'gale', 'galecrest', 'Warden Tamsin', 'tamsin', ["Oh, I'd love to, but Kitty's kites are scattered all over the moor!", "Help her round them up and I'm all yours."]],
];
for (const [fn, crest, qkey, title, pic, lines] of TQ_GATE) {
  const orig = window[fn] || eval(fn);
  const wrapped = function (sc) {
    if (crestHas(crest) || townHelped[crest]()) return orig.apply(this, arguments);
    const aq = activeQuest(); if (aq && /^vd/.test(aq.id)) return orig.apply(this, arguments);   // Verdance's story goes through the Wardens too
    if (fn === 'tamsin' && !S.flags.windCalm) return orig.apply(this, arguments);              // she sends you up Windcrown Peak first
    const left = TQ_Q[qkey].filter(q => !q.done()).map(q => '• ' + q.name.replace(/ \(.*\)$/, ''));
    Talk.say([...lines.map((t, i) => ({ who: 'trainer', name: title, img: trainerPic(pic, i ? 1 : 0), t })), { who: 'trainer', name: title, img: trainerPic(pic, 0), t: 'Still to do: ' + left.join('  ') }]);
  };
  if (fn === 'delphine') delphine = wrapped; else if (fn === 'granger') granger = wrapped; else if (fn === 'orrin') orrin = wrapped; else tamsin = wrapped;
}
const _tqBoat = openBoat;
openBoat = function (sc) {
  if (tqQuestDone('tq_tools')) return _tqBoat.apply(this, arguments);
  Talk.say([HAL("I'd build your boat in a heartbeat, but a rogue wave took my tool box off the slipway last night!", 0),
    HAL(`Mallet, plane, caulking iron and my old brass compass. They're glinting in the shallows somewhere between here and the dunes. ${tqCount(tq().tools)}/4 found.`, 0),
    HAL("I'm no swimmer. A Tide Fablemon could dive for them, though!", 1)]);
};

// saves already past a town: tick its new quests off quietly, without paying their rewards
const _tqCheck = checkQuests;
checkQuests = function () {
  if (S && S.quests && !S.tqMigrated) { S.tqMigrated = 1; for (const list of Object.values(TQ_Q)) for (const q of list) if (q.done()) S.quests[q.id] = 1; }
  return _tqCheck.apply(this, arguments);
};
