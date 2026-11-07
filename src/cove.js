/* ============================================================ Saltgrass Dunes and Driftwood Cove
   After the Stone Crest, Elder Bramble tells you a way has opened west of the farm. Saltgrass Dunes is a sandy
   route along the sea; Driftwood Cove at the end of it is a little fishing village where Hal, the shipwright
   (Warden Granger's twin brother), builds you a boat in four stages. The Glimmer Sea comes next.
   Both maps are drawn from text like the Cragside maps, with a beach painter: ~ sea, . sand, , boardwalk,
   # dune bank, digits dune grass. Art: the 'cove' atlas (tools/art/cut_cove.py). */
const DUNES_MAP = [
  "####################################################",
  "##############..###########.........################",
  "#########..............................#####........",
  "..######............................................",
  "....................................................",
  "........................111.111...........0000000...",
  "...2222222..............1111111...........0000000o..",
  "...2.22222.....o........1111111......O....000.00....",
  "....222222...............11111............0000000...",
  "...22222.2...............111111...........0000000...",
  "...2222222...........o..............................",
  ".................................,,,,,,,,...........",
  "................................,,,,,,,,,,,.........",
  ".........,,,,,,,,,..........o..,,........,,,........",
  ".......,,,,,,,,,,,,...........,,...........,,,,,,,,,",
  ",,,,,,,,,.........,,,.......,,,....0000000..,,,,,,,,",
  ",,,,,,,............,,,..,,,,,,.....0000000..........",
  "............11111.11.,,,,,,,.......0.00000..........",
  "............111.1111..,,...........0000000..........",
  "....o.......11111111......2222.2...0000.00....o.....",
  "........O...11111111.........222....................",
  "............111111.1......222.22.o..................",
  "......................~~.......................~~~~~",
  "..................~~~~~~~~~~...............~~~~~~~~~",
  ".............~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~......~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"
];
const COVE_MAP = [
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~PPPPP~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~PPPPP~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~P~~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~P~~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~P~~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~P~~~~~~~~~~~~~~.......#~~",
  "~~~~~~~~~~.........,,..~~~~~~............###",
  "~~~~~~~............,,,,,,,,,,............###",
  "~~~~~~~............,,,,,,,,,,............###",
  "~~~~~~.....................,,............###",
  "~~~~~~.....................,,...............",
  "~~~~~~.....................,,...............",
  "~~~~~~.....................,,,,,,,,,,,,,,,,,",
  "~~~~~~.....................,,,,,,,,,,,,,,,,,",
  "~~~~~.......................................",
  "~~~~~.......................................",
  "~~~~~....................................###",
  "~~~~~....................................###",
  "~~~~~....................................###",
  "~~~~~....................................###",
  "~~~~~~...................................###",
  "~~~~~~...................................###",
  "~~~~~~...................................###",
  "~~~~~~...................................###",
  "~~~~~~...................................###",
  "~~~~~~...................................###",
  "~~~~~~...................................###",
  "############################################",
  "############################################",
  "############################################"
];
const DUNE_ENC = { day: [['whirlwyn', 18], ['brookstride', 16], ['fleecebolt', 14], ['staticwing', 10], ['cloverguard', 9], ['flintburrow', 8], ['cindhop_2', 5]],
  night: [['duskcloak', 22], ['staticwing', 18], ['brookstride', 16], ['whirlwyn', 10], ['flintburrow', 8]] };
const westOpen = () => !!S.flags.westOpen;
const cove = () => (S.cove = S.cove || { stage: 0, pending: 0 });
const BOAT_STAGES = [
  { name: 'Keel and frame', need: { wood: 150 }, gold: 2000, blurb: "First the backbone: a good oak keel and the ribs that hold her shape." },
  { name: 'Hull planking', need: { wood: 250, stone: 50 }, gold: 3500, blurb: 'Plank by plank, steamed and bent and pinned. Stone for the ballast in her belly.' },
  { name: 'Mast and sail', need: { wood: 120, fiber: 150 }, gold: 5000, blurb: 'A tall straight mast, rigging, and a good canvas sail. Fiber for the rope and the cloth.' },
  { name: 'Fitting out', need: { wood: 80, stone: 60, fiber: 80 }, gold: 6000, blurb: 'Paint, a lantern, oars, a proper rudder, and a flag to fly. Then she\'s ready for the sea.' },
];

Object.assign(ROUTES, {
  dunes: { name: 'Saltgrass Dunes', w: 52, h: 32, ascii: DUNES_MAP, crag: true, beach: true,
    zones: [[0, 0, 0, 0, 31, 33], [0, 0, 0, 0, 32, 34], [0, 0, 0, 0, 33, 35]],
    paths: [], ponds: [], bridge: null, open: [], clear: [],
    pickups: [{ id: 'sd1', x: 2, y: 4, gold: 2000 }, { id: 'sd2', x: 47, y: 21, item: 'tonic', n: 3 }, { id: 'sd3', x: 17, y: 9, item: 'sturdy_charm', n: 4 }],
    signs: { '49,12': 'Saltgrass Dunes. Follow the boardwalk west to Driftwood Cove.', '3,13': 'West: Driftwood Cove. Mind the tide.', '30,10': '__heal' },
    trainers: [
      { id: 'sd_t1', kind: 'birdwatcher', name: 'Wren', x: 38, y: 13, dir: 'left', sight: 3, team: [['whirlwyn', 33], ['staticwing', 34]] },
      { id: 'sd_t2', kind: 'ponddipper', name: 'Coral', x: 23, y: 20, dir: 'up', sight: 3, team: [['brookstride', 34], ['mirebellows', 35]] },
      { id: 'sd_t3', kind: 'rambler', name: 'Sandy', x: 11, y: 11, dir: 'down', sight: 3, team: [['fleecebolt', 35], ['cindhop_2', 35], ['whirlwyn', 36]] },
    ],
    cvprops: [['cv_pot_round', 44, 21], ['cv_net_pile', 20, 22], ['cv_anchor_rope', 7, 22], ['cv_buoys', 31, 22], ['cv_rope_coil', 40, 16]],
    exits: [{ r: [51, 14, 51, 15], to: y => ['farm', { x: 1, y: 30, dir: 'left' }] }, { r: [0, 15, 0, 16], to: y => ['driftwood', { x: 42, y: 14, dir: 'left' }] }],
    spawn: { x: 50, y: 14, dir: 'left' }, enc: DUNE_ENC },
  driftwood: { name: 'Driftwood Cove', w: 44, h: 32, ascii: COVE_MAP, crag: true, beach: true, town: true,
    zones: [], paths: [], ponds: [], bridge: null, open: [], clear: [],
    pickups: [{ id: 'cv1', x: 21, y: 3, item: 'mon_treat', n: 3 }],
    buildings: [
      { id: 'cv_shipyard', atlas: 'cove', frame: 'cv_shipyard', cx: 14, by: 23, door: 0, name: "Hal's Shipyard" },
      { id: 'cv_house', atlas: 'cove', frame: 'cv_house', cx: 34, by: 12, door: 0, name: 'Cottage' },
      { id: 'cv_cottage', atlas: 'cove', frame: 'cv_cottage', cx: 11, by: 13, door: 0, name: 'Cottage' },
      { id: 'cv_hut', atlas: 'cove', frame: 'cv_hut', cx: 35, by: 25, door: 1, name: 'Fish hut' },
    ],
    signs: { '40,13': 'Driftwood Cove. Fresh fish, fair winds, and the finest boats on the coast (says Hal).', '30,19': '__heal', '20,5': '__door:cv_sail', '20,6': '__door:cv_sail' },
    npcs: [{ kind: 'hal', tex: 'npc_shipwright', x: 22, y: 20, dir: 'down', door: 'cv_hal' }],
    trainers: [],
    cvprops: [['cv_lantern', 17, 9], ['cv_anchor', 24, 11], ['cv_rope_spool', 25, 9], ['cv_glass_floats', 15, 9],
      ['cv_net_frame', 7, 16], ['cv_pot_box', 8, 18], ['cv_pot_round', 9, 15], ['cv_fish_crate', 31, 16], ['cv_barrels', 38, 18], ['cv_oar_rack', 29, 25],
      ['cv_oars', 20, 25], ['cv_rope_coil', 27, 20], ['cv_net_pile', 39, 25], ['cv_buoys', 41, 22], ['cv_lantern', 26, 13], ['cv_lantern', 36, 16]],
    exits: [{ r: [43, 12, 43, 17], to: y => ['dunes', { x: 1, y: 15, dir: 'right' }] }],
    spawn: { x: 41, y: 14, dir: 'left' }, enc: DUNE_ENC },
});

/* ---------- the boat on its cradle, beside the shipyard */
const BOAT_AT = { cx: 26, by: 23 }, BOAT_TILES = [[24, 22], [25, 22], [26, 22], [27, 22], [28, 22], [24, 23], [25, 23], [26, 23], [27, 23], [28, 23]];

/* ---------- the beach painter: sand, sea with foam, boardwalks and grassy dune banks */
function beachGround(sc, R) {
  cragArt(sc);
  const key = 'beachGround_' + sc.scene.key; if (sc.textures.exists(key)) sc.textures.remove(key);
  const c = document.createElement('canvas'); c.width = RW * T; c.height = RH * T;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  const K = (x, y) => (x < 0 || y < 0 || x >= RW || y >= RH) ? '~' : R.kind[y * RW + x];
  const sea = (x, y) => { const k = K(x, y); return k === '~' || k === 'P' || (RC.sail && ((k >= '0' && k <= '9') || '<>^v*'.includes(k))); }, bank = (x, y) => K(x, y) === '#';
  const ter = sc.textures.get('terrain').getSourceImage();
  // how far each sea tile is from land (0 on land, up to 5 out at sea)
  const D = new Float32Array(RW * RH).fill(5), q = [];
  for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) if (!sea(x, y)) { D[y * RW + x] = 0; q.push([x, y]); }
  for (let h = 0; h < q.length; h++) { const [x, y] = q[h], d = D[y * RW + x] + 1; if (d > 5) continue; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= RW || ny >= RH || D[ny * RW + nx] <= d) continue; D[ny * RW + nx] = d; q.push([nx, ny]); } }
  const rgh = (x, y) => { const k = K(x, y); return k >= '0' && k <= '9' ? 1 : 0; };
  const cur = (x, y) => '<>^v'.includes(K(x, y)) ? 1 : 0;
  const dist = (x, y) => (x < 0 || y < 0 || x >= RW || y >= RH) ? 5 : D[y * RW + x];
  const px = (x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };
  for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) {
    const k = K(x, y), X = x * T, Y = y * T;
    if (sea(x, y)) {
      // deeper water further from land: distance is blended smoothly between tile centres
      for (let v = 0; v < T; v++) for (let u = 0; u < T; u++) {
        const fx = x + (u + .5) / T - .5, fy = y + (v + .5) / T - .5, x0 = Math.floor(fx), y0 = Math.floor(fy), ax = fx - x0, ay = fy - y0;
        const d = (dist(x0, y0) * (1 - ax) + dist(x0 + 1, y0) * ax) * (1 - ay) + (dist(x0, y0 + 1) * (1 - ax) + dist(x0 + 1, y0 + 1) * ax) * ay;
        const t = Math.min(1, Math.max(0, (d - .6) / 3.6)), n = hash(X + u, Y + v), w = Math.sin((X + u) * .35 + (Y + v) * .9) > .82 && n < .5;
        const rf = RC.sail ? (rgh(x0, y0) * (1 - ax) + rgh(x0 + 1, y0) * ax) * (1 - ay) + (rgh(x0, y0 + 1) * (1 - ax) + rgh(x0 + 1, y0 + 1) * ax) * ay : 0;   // rough water, blended softly
        const cf = RC.sail ? (cur(x0, y0) * (1 - ax) + cur(x0 + 1, y0) * ax) * (1 - ay) + (cur(x0, y0 + 1) * (1 - ax) + cur(x0 + 1, y0 + 1) * ax) * ay : 0;   // torrents: paler, faster water
        let r = 104 - 66 * t - 16 * rf + 34 * cf, gg = 186 - 78 * t - 22 * rf + 40 * cf, b = 200 - 46 * t - 14 * rf + 26 * cf;
        if (RC.storm) { r = r * .6 + 22; gg = gg * .66 + 24; b = b * .76 + 26; }   // grey, heavy storm water
        px(X + u, Y + v, `rgb(${Math.round(r + (w ? 40 : n < .1 ? -8 : 0))},${Math.round(gg + (w ? 40 : n < .1 ? -8 : 0))},${Math.round(b + (w ? 30 : 0))})`);
      }
      if (k >= '0' && k <= '9') {   // rough water: darker, with little breaking crests
        for (let n = 0; n < 2; n++) {
          const cx = X + 1 + Math.floor(hash(x * 3 + n, y * 5 + 2) * 10), cy = Y + 2 + n * 7 + Math.floor(hash(y + n, x) * 5);
          g.fillStyle = 'rgba(30,70,120,.35)'; g.fillRect(cx, cy + 1, 5, 1);
          g.fillStyle = 'rgba(235,250,255,.75)'; g.fillRect(cx + 1, cy, 3, 1);
        }
      }
      if ('<>^v'.includes(k)) {   // a pale chevron pointing the way the torrent runs
        const rot = { '>': (a, b) => [a, b], '<': (a, b) => [15 - a, b], 'v': (a, b) => [b, a], '^': (a, b) => [b, 15 - a] }[k];
        g.fillStyle = 'rgba(225,248,255,.5)';
        for (const o of [-3, 3]) for (const [a, b] of [[6, 4], [7, 5], [8, 6], [9, 7], [8, 8], [7, 9], [6, 10]]) { const [u, v] = rot(a + o, b); g.fillRect(X + u, Y + v, 1, 1); }
      }
      continue;
    }
    if (k === '#' || k === ';') {   // grassy dune bank (#), or plain walkable grass (;)
      const h = hash(x, y); g.drawImage(ter, (h < .6 ? 0 : h < .8 ? 1 : 2) * 16, FILL_ROW * 16, 16, 16, X, Y, T, T);
      g.fillStyle = k === ';' ? 'rgba(60,80,70,.22)' : 'rgba(214,190,120,.28)'; g.fillRect(X, Y, T, T);
      continue;
    }
    // sand, damp near the water
    const wet = sea(x + 1, y) || sea(x - 1, y) || sea(x, y + 1) || sea(x, y - 1);
    for (let v = 0; v < T; v++) for (let u = 0; u < T; u++) {
      const n = hash(X + u * 7, Y + v * 3);
      const b = wet ? [214, 186, 128] : [236, 212, 156];
      const d = n < .08 ? -26 : n < .2 ? -12 : n > .96 ? 14 : 0;
      px(X + u, Y + v, `rgb(${b[0] + d},${b[1] + d},${b[2] + d})`);
    }
    if (k === ',') {   // boardwalk planks
      g.fillStyle = '#b07a48'; g.fillRect(X, Y, T, T);
      for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? '#9a6a3e' : '#bf8a54'; g.fillRect(X, Y + i * 4, T, 3); g.fillStyle = '#6e4a2a'; g.fillRect(X, Y + i * 4 + 3, T, 1); }
      g.fillStyle = 'rgba(255,240,200,.18)'; g.fillRect(X, Y, T, 1);
    }
    if (k >= '0' && k <= '9') { g.fillStyle = 'rgba(150,170,90,.35)'; g.fillRect(X, Y, T, T); }
  }
  // foam where the sea meets land, and a bank edge on the dunes
  for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) {
    const X = x * T, Y = y * T;
    if (sea(x, y)) {
      g.fillStyle = 'rgba(255,255,255,.75)';
      if (!sea(x, y - 1)) for (let u = 0; u < T; u++) if (hash(X + u, Y) < .7) g.fillRect(X + u, Y, 1, 2 + (hash(u, Y) < .3));
      if (!sea(x, y + 1)) for (let u = 0; u < T; u++) if (hash(X + u, Y + 9) < .7) g.fillRect(X + u, Y + T - 2, 1, 2);
      if (!sea(x - 1, y)) for (let v = 0; v < T; v++) if (hash(X, Y + v) < .7) g.fillRect(X, Y + v, 2, 1);
      if (!sea(x + 1, y)) for (let v = 0; v < T; v++) if (hash(X + 5, Y + v) < .7) g.fillRect(X + T - 2, Y + v, 2, 1);
    }
    if (bank(x, y) && !bank(x, y + 1) && !sea(x, y + 1)) { g.fillStyle = 'rgba(120,96,50,.55)'; g.fillRect(X, Y + T - 3, T, 3); }
  }
  sc.textures.addCanvas(key, c);
  sc.add.image(0, 0, key).setOrigin(0).setDepth(0);
}
// glints that drift across the water
function beachSparkle(sc, R) {
  const spots = []; for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) if (R.kind[y * RW + x] === '~' && hash(x * 3, y * 5) < .09) spots.push([x, y]);
  for (const [x, y] of spots.slice(0, 70)) {
    const s = sc.add.rectangle(x * T + 4 + hash(x, y) * 8, y * T + 6, 4, 1, 0xffffff, .0).setDepth(1);
    sc.tweens.add({ targets: s, alpha: .8, x: s.x + 6, yoyo: true, repeat: -1, delay: hash(y, x) * 3000, duration: 900 + hash(x, x) * 900, ease: 'Sine.inOut' });
  }
}
function coveSetup(sc) {
  if (!RC.storm) beachSparkle(sc, sc.R);
  else { FX.set('storm', false); updateHUD(); }   // it never stops raining out here
  if (RC.brprops) beaconSetup(sc);
  if (RC.sail) seaSetup(sc);
  for (const [f, x, y] of RC.cvprops || []) sc.add.image(x * T + 8, y * T + 16, 'cove', f).setOrigin(.5, 1).setDepth(y * T + 15);
  for (const s of Object.values(sc.grassSpr || {})) s.setTint(0xd8d890);   // dune grass
  if (sc.scene.key === 'driftwood') {
    sc.add.image(16 * T, 1 * T - 4, 'cove', 'cv_pier').setOrigin(0).setDepth(2);
    // a run of extra walkway (cut from the pier's own planks) carries it down onto the sand
    for (let k = 0; k < 2; k++) sc.add.image(16 * T, 1 * T - 4 + 20 + k * 16, 'cove', 'cv_pier').setOrigin(0).setCrop(35, 66, 42, 39).setDepth(1.9);
    sc.boatImg = null; drawBoat(sc); mooredBoat(sc);
    if (!S.flags.coveSeen) { S.flags.coveSeen = 1; setTimeout(() => toast('Driftwood Cove. Someone is whistling over at the shipyard.', 3000), 700); }
  }
  if (sc.scene.key === 'dunes' && !S.flags.dunesSeen) { S.flags.dunesSeen = 1; setTimeout(() => toast('Saltgrass Dunes. Wild Fablemon hide in the dune grass.', 3000), 700); }
}
function drawBoat(sc) {
  const st = boatReady() ? 0 : cove().stage;   // once she's finished she's moored at the pier
  if (sc.boatImg) sc.boatImg.destroy();
  sc.boatImg = st ? sc.add.image(BOAT_AT.cx * T + 8, BOAT_AT.by * T + 16, 'cove', 'cv_boat' + st).setOrigin(.5, 1).setDepth(BOAT_AT.by * T + 15) : null;
  if (sc.boatImg) { sc.boatImg.noShadow = 1; sc.tall.push(sc.boatImg); }
}

/* ---------- Hal, the shipwright */
const HAL = (t, f = 0) => ({ who: 'hal', name: 'Hal the Shipwright', img: VPIC['hal' + f], t });
function hal(sc) {
  const C = cove(), say = (lines, done) => Talk.say(lines, done);
  if (!S.flags.halMet) {
    S.flags.halMet = 1;
    return say([HAL("Ahoy there! A new face in the cove! I'm Hal. Shipwright, net-mender, and the best whistler on this whole stretch of coast.", 1),
      HAL("Wait, that's a Stone Crest on your bag. You've been up to Quarrydown? You've met my brother!", 1),
      HAL("We're twins, believe it or not. He got the serious face, I got the good looks. Ha! Did he smile at you? He does, you know. Once a year."),
      HAL("Now, you didn't walk all the way out here for the sea air. You want to get out there, don't you? Across the Glimmer Sea, to Beaconreach and the lighthouse.", 0),
      HAL("No ferry's run since the old boats rotted. But I've a cradle, a slipway, and two good hands. Bring me the timber and the coin, and I'll build you a boat.", 1)], () => openBoat(sc));
  }
  if (C.pending) return say([HAL(pick(["Work's under way! Come back in the morning and you'll see the difference.", "I'll be at her all night with a lantern. Best time for it, the sea's quiet.", "Steady on, I'm working as fast as these old hands go! Tomorrow morning."]), 1)]);
  if (C.stage >= BOAT_STAGES.length) return say([HAL(pick(["She's the finest boat I've ever built. Don't tell the others.", "She's moored by the pier, ready when you are. Just step aboard!", "The Glimmer Sea's out there waiting. I'm charting the reefs so you don't run aground on your first trip."]), 1)]);
  openBoat(sc);
}
function openBoat(sc) {
  const C = cove(), render = () => {
    const rows = BOAT_STAGES.map((s, i) => {
      if (i < C.stage) return `<div class="proj"><b>${i + 1}. ${s.name}</b><span class="st">✔ Done</span></div>`;
      if (i === C.stage && C.pending) return `<div class="proj"><b>${i + 1}. ${s.name}</b><span class="st">⚒ Hal's working on it tonight</span></div>`;
      if (i > C.stage) return `<div class="proj" style="opacity:.55"><b>${i + 1}. ${s.name}</b><span class="st">Later</span></div>`;
      let ok = S.gold >= s.gold;
      const needs = Object.entries(s.need).map(([k, n]) => { const have = inv.count(k); if (have < n) ok = false; return `<span class="need ${have < n ? 'no' : ''}"><img src="${iconFor(k)}">${Math.min(have, n)}/${n}</span>`; }).join('');
      return `<div class="proj" style="border-color:#c9a64e;background:#fff6dc"><b>${i + 1}. ${s.name}</b><br><small>${s.blurb}</small><div style="display:flex;align-items:center;justify-content:space-between;gap:6px;margin-top:4px;flex-wrap:wrap"><div>${needs} <span class="need ${S.gold < s.gold ? 'no' : ''}">🪙 ${s.gold.toLocaleString()}g</span></div><button class="btn ${ok ? 'gold' : ''} sm" data-a="fund" ${ok ? '' : 'disabled'}>Build</button></div></div>`;
    }).join('');
    return `<p>"Four jobs and she's seaworthy," Hal says, tapping a pencil on his plans. "One at a time, mind. I work through the night, and you'll see each one done the next morning."</p><div class="mlist">${rows}</div><p class="hint">Short on timber or rope? Quarrydown's Stone & Supply sells wood, stone and fiber by the bundle.</p>`;
  };
  openModal("⛵ Hal's boat", render(), a => {
    if (a !== 'fund' || C.pending || C.stage >= BOAT_STAGES.length) return;
    const s = BOAT_STAGES[C.stage];
    if (S.gold < s.gold || Object.entries(s.need).some(([k, n]) => inv.count(k) < n)) return Sound.play('error');
    for (const [k, n] of Object.entries(s.need)) inv.remove(k, n);
    S.gold -= s.gold; C.pending = 1; updateHUD(); renderHotbar(); Sound.play('coin');
    closeModal();
    Talk.say([HAL(pick(["Lovely! I'll start tonight. Nothing like the smell of fresh-cut timber, is there?", "That's the stuff! She'll look a whole lot more like a boat in the morning.", "Right, sleeves up! Tell my brother I'm working harder than him."]), 1)]);
  });
}
// overnight: the next stage of the boat is finished
function coveOvernight() {
  const C = S.cove; if (!C || !C.pending) return;
  C.pending = 0; C.stage = Math.min(BOAT_STAGES.length, C.stage + 1);
  S.flags.boatNews = C.stage;
}
function coveDoor(sc, id) {
  if (id === 'cv_sail' || id === 'cv_beacon' || id === 'cv_whale') return sailDoor(sc, id);
  if (id === 'cv_hal') { sc.face && sc.face(22, 20); return hal(sc); }
  if (id === 'cv_shipyard') return cove().stage >= BOAT_STAGES.length ? toast("Hal's shipyard. Sawdust, tar and a very happy shipwright.", 2400) : hal(sc);
  if (id === 'cv_hut') return toast('The fish hut is shut. A chalk board reads: "Gone fishing. Obviously."', 2600);
  toast(pick(['Nobody answers. Through the window you can see a cat asleep on a pile of nets.', 'A note on the door says: "Down at the pier. Knock loudly. Or shout. Or don\'t."']), 2600);
}

/* ---------- Elder Bramble: the way west */
const westNews = () => !!(S.crests && S.crests.stone) && !S.flags.westOpen;
function westLines(B) {
  if (!westNews()) return null;
  S.flags.westOpen = 1;
  return [
    B("{name}! Three Crests! The whole of Smallroot's talking about you and Warden Granger.", 0),
    B("And I've news of my own. Old Fenwick came by this morning: the storm last week brought down the dead trees at the west edge of your farm.", 2),
    B("There's a way through now, out past the hedges to the old dunes. I haven't walked that path since I was a lad.", 3),
    B("There used to be a fishing village at the end of it. Driftwood Cove. If anyone's still there, they might know how to get out across the water.", 0),
    B("Go and have a look, will you? And tell me what you find!", 2),
  ];
}

const COVE_SCENES = [class extends Crag { constructor() { super('dunes'); } }, class extends Crag { constructor() { super('driftwood'); } }];
