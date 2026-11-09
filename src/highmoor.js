/* ============================================================ The way to Highmoor
   Once Orrin is beaten, Harbourmaster Quill opens Beaconreach's north jetty. From there:
     windward     Windward Sound      a sea route north-east to the foot of the Highmoor cliffs
     heatherstep  Heatherstep Cliffs  the climb begins: heather terraces, wooden steps and the first windy gorges
     galeledges   Gale Ledges         stone pillars standing in a great gorge, joined only by the wind
   THE WIND: swirls of wind (updrafts) rise out of the gorges. Step onto one and, if the gorge lies ahead in the wind's
   direction, the gust lifts you straight across to the first ground on the far side (landing on another swirl carries
   you on). White swirls always blow the same way. Coloured swirls follow the weathervane with the same coloured
   pennant: turn the vane and every swirl of that colour blows the new way.
   Maps come from tools/maps/highmoor_gen.py (src/highmoor_maps.json), which also checks with a solver that every
   puzzle can be solved from any vane setting and that you can always get back down.
   Art: tools/art/cut_highmoor.py (atlas 'hm'). The town of Highmoor itself comes next. */
const HM_MAPS = ASSET.hmMaps;
const WIND_FIXED = { '^': 'N', 'v': 'S', '>': 'E', '<': 'W' };
const WIND_COL = { A: 0x5aa8f0, B: 0xf0705a, C: 0xf2c440, D: 0x8ad06a };
const WIND_NAME = { A: 'blue', B: 'red', C: 'gold', D: 'green' };
const DIR_WORD = { N: 'north', S: 'south', E: 'east', W: 'west' };
const wind = () => (S.wind = S.wind || {});

/* ---------- Beaconreach's north jetty, opened after the Spark Crest */
for (const y of [0, 1, 2]) BR_MAP[y] = BR_MAP[y].slice(0, 20) + ',,' + BR_MAP[y].slice(22);
Object.assign(ROUTES.beaconreach.signs, { '20,0': '__door:br_north', '21,0': '__door:br_north' });
const _beaconDoor = beaconDoor;
beaconDoor = function (sc, id) {
  if (id !== 'br_north') return _beaconDoor(sc, id);
  if (!(S.crests && S.crests.spark)) return toast("The north jetty. A sign reads: 'CLOSED. Gales beyond the point. Only for sailors Warden Orrin has tested.'", 3200);
  if (!team().some(m => m.hp > 0)) return toast('Your Fablemon are too tired for a sea crossing. Rest them first.', 2400);
  Sound.play('door'); toast('You cast off from the north jetty into Windward Sound.', 1800);
  return travel(sc, 'windward', ROUTES.windward.spawn);
};

/* ---------- the routes */
const WINDWARD_ENC = {
  day: [['stormveil', 16], ['foilfin', 14], ['whirlwyn', 12], ['staticwing', 12], ['riftshear', 10], ['reefarer', 10], ['mirebellows', 8], ['kilnback', 6]],
  night: [['inkwick', 18], ['stormveil', 14], ['nipshade_2', 12], ['duskcloak', 10], ['riftshear', 10], ['mirebellows', 8]],
};
const MOOR_ENC = {
  day: [['craglet_2', 16], ['whirlwyn', 14], ['bristlecone_2', 12], ['staticwing', 12], ['ramruff', 10], ['fleecebolt', 10], ['cloverguard', 8], ['flintburrow', 6]],
  night: [['duskcloak', 18], ['staticwing', 14], ['clinkit_2', 12], ['craglet_2', 12], ['ramruff', 8], ['whirlwyn', 8]],
};
const MOOR_BASE = { crag: true, moor: true, quiet: true, paths: [], ponds: [], bridge: null, open: [], clear: [] };
const vaneSigns = k => Object.fromEntries(Object.entries(HM_MAPS[k].vanes).map(([id, v]) => [v.x + ',' + v.y, '__wvane:' + id]));
Object.assign(ROUTES, {
  windward: { ...SEA_BASE, name: 'Windward Sound', w: 44, h: 52, ascii: HM_MAPS.windward.rows, hmsea: true,
    zones: [[0, 0, 0, 0, 45, 47], [0, 0, 0, 0, 46, 48], [0, 0, 0, 0, 46, 48]],
    pickups: [{ id: 'ws1', x: 41, y: 30, gold: 5000 }, { id: 'ws2', x: 3, y: 47, item: 'tonic', n: 4 }, { id: 'ws3', x: 23, y: 21, item: 'mon_treat', n: 3 }],
    signs: { '20,9': '__door:hm_land', '21,9': '__door:hm_land' },
    trainers: [],
    seaprops: [['islet', 36, 44], ['island', 8, 29], ['rock_tall', 26, 41], ['buoy_bell', 20, 15], ['buoy_red', 17, 11], ['buoy_teal', 24, 11], ['reef', 33, 8], ['flotsam', 14, 49], ['reef_kelp', 39, 24], ['rock', 2, 12]],
    decor: [['hm', 'hm_cliff_cottage', 9, 6], ['hm', 'hm_windswept_tree', 30, 4], ['hm', 'hm_small_windmill', 39, 3], ['hm', 'hm_small_windmill', 35, 2], ['hm', 'hm_heather', 25, 5], ['hm', 'hm_heather', 15, 4],
      ['hm', 'hm_kite_pole', 23, 6], ['hm', 'hm_windswept_tree', 2, 3], ['hm', 'hm_heather', 42, 6]],
    goal: { area: [16, 8, 25, 12], flag: 'hmSighted', msg: 'Land ahoy! White windmill sails turn high on the cliffs above. Tie up at the jetty to climb ashore.' },
    exits: [{ r: [0, 51, 43, 51], to: () => ['beaconreach', { x: 20, y: 2, dir: 'down' }] }],
    spawn: { x: 21, y: 49, dir: 'up' }, enc: WINDWARD_ENC },
  heatherstep: { ...MOOR_BASE, name: 'Heatherstep Cliffs', w: 36, h: 60, ascii: HM_MAPS.heatherstep.rows, vanes: HM_MAPS.heatherstep.vanes,
    zones: [[0, 0, 0, 0, 46, 48], [0, 0, 0, 0, 47, 49], [0, 0, 0, 0, 48, 50]],
    pickups: [{ id: 'hc1', x: 32, y: 32, item: 'swift_feather', n: 1 }, { id: 'hc2', x: 31, y: 3, gold: 6000 }, { id: 'hc3', x: 3, y: 19, item: 'tonic', n: 3 }, { id: 'hc4', x: 30, y: 58, item: 'mon_treat', n: 2 }],
    signs: { ...vaneSigns('heatherstep'), '14,57': 'Heatherstep Cliffs. Highmoor is at the top. Climb the steps and ride the wind!',
      '15,47': 'Mind the gorge! Wind rushes up out of it in swirls. Step onto a swirl and the gust will carry you across, the way it blows.',
      '12,34': "A weathervane with a blue pennant. Turn it and every blue swirl of wind blows the way the vane points.",
      '31,19': '__heal', '5,4': "This vane's pennant is red, like the swirls by the summit path and down on the east side." },
    trainers: [],
    decor: [['hm', 'hm_windswept_tree', 4, 52], ['hm', 'hm_windswept_tree', 31, 43], ['hm', 'hm_heather', 13, 54], ['hm', 'hm_heather', 21, 53], ['hm', 'hm_glider', 23, 48], ['hm', 'hm_wall', 11, 48],
      ['hm', 'hm_kite_pole', 20, 33], ['hm', 'hm_windswept_tree', 32, 27], ['hm', 'hm_heather', 15, 20], ['hm', 'hm_bench', 27, 19], ['hm', 'hm_birdhouse', 22, 18], ['hm', 'hm_heather', 31, 13],
      ['hm', 'hm_banner_pole', 20, 2], ['hm', 'hm_wind_chimes', 15, 2], ['hm', 'hm_windswept_tree', 9, 2]],
    exits: [{ r: [15, 59, 20, 59], to: () => ['windward', { x: 21, y: 10, dir: 'down' }] }, { r: [16, 0, 19, 0], to: x => ['galeledges', { x: x + 2, y: 48, dir: 'up' }] }],
    spawn: { x: 17, y: 58, dir: 'up' }, enc: MOOR_ENC },
  galeledges: { ...MOOR_BASE, name: 'Gale Ledges', w: 40, h: 50, ascii: HM_MAPS.galeledges.rows, vanes: HM_MAPS.galeledges.vanes,
    zones: [[0, 0, 0, 0, 48, 50], [0, 0, 0, 0, 48, 50], [0, 0, 0, 0, 48, 50], [0, 0, 0, 0, 48, 50], [0, 0, 0, 0, 49, 51], [0, 0, 0, 0, 50, 52]],
    pickups: [{ id: 'gl1', x: 32, y: 26, item: 'heartwood_charm', n: 1 }, { id: 'gl2', x: 4, y: 14, gold: 7000 }, { id: 'gl3', x: 36, y: 1, item: 'skyward_charm', n: 3 }, { id: 'gl4', x: 22, y: 35, item: 'hearth_elixir', n: 1 }],
    signs: { ...vaneSigns('galeledges'), '15,48': 'Gale Ledges. Stone pillars stand in the gorge like stepping stones. Three weathervanes steer the wind between them.',
      '17,1': 'North: Highmoor, the windmill town. You can hear the sails creaking from here.', '24,4': '__heal' },
    trainers: [],
    decor: [['hm', 'hm_windswept_tree', 3, 48], ['hm', 'hm_heather', 36, 44], ['hm', 'hm_glider', 23, 47],
      ['hm', 'hm_small_windmill', 30, 1], ['hm', 'hm_small_windmill', 8, 1], ['hm', 'hm_heather', 14, 3], ['hm', 'hm_kite_pole', 33, 5], ['hm', 'hm_birdhouse', 9, 36], ['hm', 'hm_millstone', 30, 37]],
    goal: { area: [2, 1, 37, 5], flag: 'galeTop', msg: 'You made it up the cliffs! Windmill sails turn just over the ridge. Highmoor is close.' },
    exits: [{ r: [17, 49, 20, 49], to: x => ['heatherstep', { x: Math.max(16, Math.min(19, x - 2)), y: 1, dir: 'down' }] }, { r: [18, 0, 21, 0], to: x => ['highmoor', { x: Math.max(21, Math.min(22, x + 2)), y: 38, dir: 'up' }] }],
    spawn: { x: 18, y: 48, dir: 'up' }, enc: MOOR_ENC },
});

/* ---------- the cliff painter: heather turf, rock, wooden steps, and gorges that drop away into mist */
function moorGround(sc, R) {
  cragArt(sc);
  const key = 'moorGround_' + sc.scene.key; if (sc.textures.exists(key)) sc.textures.remove(key);
  const c = document.createElement('canvas'); c.width = RW * T; c.height = RH * T;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  const K = (x, y) => (x < 0 || y < 0 || x >= RW || y >= RH) ? '#' : R.kind[y * RW + x];
  const gorge = (x, y) => K(x, y) === 'C', rock = (x, y) => K(x, y) === '#', land = (x, y) => !gorge(x, y) && !rock(x, y);
  const ter = sc.textures.get('terrain').getSourceImage();
  const px = (x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };
  // how far each gorge tile is from its rim, blended smoothly so the drop looks deep in the middle
  const D = new Float32Array(RW * RH).fill(6), q = [];
  for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) if (!gorge(x, y)) { D[y * RW + x] = 0; q.push([x, y]); }
  for (let h = 0; h < q.length; h++) { const [x, y] = q[h], d = D[y * RW + x] + 1; if (d > 6) continue; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= RW || ny >= RH || D[ny * RW + nx] <= d) continue; D[ny * RW + nx] = d; q.push([nx, ny]); } }
  const dist = (x, y) => (x < 0 || y < 0 || x >= RW || y >= RH) ? 0 : D[y * RW + x];
  for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) {
    const k = K(x, y), X = x * T, Y = y * T, h = hash(x, y);
    if (k === 'C') {
      for (let v = 0; v < T; v++) for (let u = 0; u < T; u++) {
        const fx = x + (u + .5) / T - .5, fy = y + (v + .5) / T - .5, x0 = Math.floor(fx), y0 = Math.floor(fy), ax = fx - x0, ay = fy - y0;
        const d = (dist(x0, y0) * (1 - ax) + dist(x0 + 1, y0) * ax) * (1 - ay) + (dist(x0, y0 + 1) * (1 - ax) + dist(x0 + 1, y0 + 1) * ax) * ay;
        const t = Math.min(1, Math.max(0, (d - .2) / 2.6)), n = hash(X + u, Y + v);
        const mist = Math.max(0, Math.sin((Y + v) * .19 + Math.sin((X + u) * .045) * 2.2)) * (1 - t * .5) * 22;   // drifting bands of mist
        const r = 62 - 46 * t + mist, gg = 68 - 48 * t + mist, b = 88 - 54 * t + mist * 1.1, j = n < .07 ? -6 : n > .97 ? 6 : 0;
        px(X + u, Y + v, `rgb(${Math.round(r + j)},${Math.round(gg + j)},${Math.round(b + j)})`);
      }
      continue;
    }
    if (k === '#') { g.drawImage(CRAG_TEX[h < .5 ? 'cobble' : 'cobble_moss2'], (x & 1) * T, (y & 1) * T, T, T, X, Y, T, T); g.fillStyle = 'rgba(46,34,40,.36)'; g.fillRect(X, Y, T, T); continue; }
    if (k === ',') { g.drawImage(CRAG_TEX.dirt_light, (x & 1) * T, (y & 1) * T, T, T, X, Y, T, T); continue; }
    if (k === 'H') {   // wooden steps set into the cliff
      g.fillStyle = '#5a3a22'; g.fillRect(X, Y, T, T);
      for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? '#a8703c' : '#bf8a54'; g.fillRect(X, Y + i * 4, T, 3); g.fillStyle = '#e0b07a'; g.fillRect(X, Y + i * 4, T, 1); }
      g.fillStyle = '#3e2614'; g.fillRect(X, Y, 1, T); g.fillRect(X + T - 1, Y, 1, T);
      continue;
    }
    // heather turf: grass with sprigs of purple and a few pale flowers
    g.drawImage(ter, (h < .6 ? 0 : h < .8 ? 1 : 2) * 16, FILL_ROW * 16, 16, 16, X, Y, T, T);
    g.fillStyle = 'rgba(70,60,90,.16)'; g.fillRect(X, Y, T, T);
    for (let i = 0; i < 4; i++) { const a = hash(x * 9 + i, y * 5 + 3), b = hash(x * 3 + 1, y * 11 + i); if (a < .55) { const hx = X + Math.floor(b * 14), hy = Y + Math.floor(hash(i, x + y * 7) * 14); px(hx, hy, '#b06ac0'); px(hx + 1, hy, '#8a4a9c'); px(hx, hy - 1, '#d08ad8'); } }
    if (h > .9) { px(X + 5, Y + 9, '#f4f0e0'); px(X + 11, Y + 4, '#f4f0e0'); }
  }
  // cliff edges: a rock face wherever ground drops into the gorge below it, a pale lip on the far rims
  for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) {
    const X = x * T, Y = y * T;
    if (!gorge(x, y)) continue;
    if (!gorge(x, y - 1)) {   // the rock face drops away below the edge, two tiles deep where there's room, fading into the dark
      const deep = gorge(x, y + 1) ? 2 : 1, hgt = deep === 2 ? 34 : 21;
      g.drawImage(CRAG_TEX.cliff2, (x & 1) * T, 9, T, 21, X, Y, T, 21);
      if (deep === 2) g.drawImage(CRAG_TEX.cliff2, (x & 1) * T, 12, T, 18, X, Y + 18, T, 16);
      const gr = g.createLinearGradient(0, Y + 6, 0, Y + hgt); gr.addColorStop(0, 'rgba(18,22,36,0)'); gr.addColorStop(1, 'rgba(18,22,36,.92)');
      g.fillStyle = gr; g.fillRect(X, Y + 6, T, hgt - 6);
    }
    g.fillStyle = 'rgba(240,232,210,.55)';
    if (!gorge(x, y + 1)) g.fillRect(X, Y + T - 1, T, 1);
    if (!gorge(x - 1, y)) g.fillRect(X, Y, 1, T);
    if (!gorge(x + 1, y)) g.fillRect(X + T - 1, Y, 1, T);
    g.fillStyle = 'rgba(20,22,36,.35)';
    if (!gorge(x - 1, y)) g.fillRect(X + 1, Y, 2, T);
    if (!gorge(x + 1, y)) g.fillRect(X + T - 3, Y, 2, T);
  }
  // raised rock: cliff faces and shadows, as on the mountain roads
  for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) {
    if (!rock(x, y)) continue;
    if (land(x, y + 1)) { g.drawImage(CRAG_TEX.ledge, (x & 1) * T, 14, T, 18, x * T, y * T - 2, T, 18); g.fillStyle = 'rgba(20,12,6,.35)'; g.fillRect(x * T, y * T + T, T, 2); }
    g.fillStyle = 'rgba(20,12,6,.5)';
    if (land(x - 1, y)) g.fillRect(x * T, y * T, 1, T);
    if (land(x + 1, y)) g.fillRect(x * T + T - 1, y * T, 1, T);
  }
  // the swirls of wind: a pale ring, coloured for the vane that steers it
  for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) {
    const k = K(x, y), id = 'abcd'.includes(k) ? k.toUpperCase() : null; if (!WIND_FIXED[k] && !id) continue;
    const col = id ? '#' + WIND_COL[id].toString(16).padStart(6, '0') : '#f4f8ff';
    const gl = g.createRadialGradient(x * T + 8, y * T + 8, 1, x * T + 8, y * T + 8, 8); gl.addColorStop(0, 'rgba(255,255,255,.45)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gl; g.fillRect(x * T, y * T, T, T);
    for (let a = 0; a < 40; a++) {   // a spiral, like a little whirlwind seen from above
      const th = a / 40 * Math.PI * 3.2, rr = 1.5 + a / 40 * 5.5;
      g.globalAlpha = .55 + a / 90; const u = x * T + 8 + Math.round(Math.cos(th) * rr), v = y * T + 8 + Math.round(Math.sin(th) * rr * .75);
      px(u, v, col); if (a > 20) px(u, v + 1, 'rgba(40,50,70,.5)');
    }
    g.globalAlpha = 1;
  }
  sc.textures.addCanvas(key, c); sc.add.image(0, 0, key).setOrigin(0).setDepth(0);
}

/* ---------- weathervanes and the swirls they steer */
const vaneKey = (sc, id) => sc.scene.key + ':' + id;
function vaneDir(sc, id) { const v = RC.vanes[id], w = wind(), k = vaneKey(sc, id); if (w[k] === undefined) w[k] = v.start; return v.dirs[w[k] % v.dirs.length]; }
function windAt(sc, x, y) {
  if (x < 0 || y < 0 || x >= RW || y >= RH) return null;
  const k = sc.R.kind[y * RW + x];
  return WIND_FIXED[k] || ('abcd'.includes(k) && RC.vanes && RC.vanes[k.toUpperCase()] ? vaneDir(sc, k.toUpperCase()) : null);
}
function moorSetup(sc) {
  for (const [atlas, f, x, y] of RC.decor || []) { const im = sc.add.image(x * T + 8, y * T + 16, atlas, f).setOrigin(.5, 1).setDepth(y * T + 15); if (/tree|windmill|cottage/.test(f)) sc.tall.push(im); }
  for (const [x, y] of RC.block || []) sc.R.blocked[y * RW + x] = 1;
  if (RC.hmsea) return;
  if (!sc.textures.exists('hm_tuft')) {   // long heather: the heather prop, drawn at tuft size
    const fr = sc.textures.getFrame('hm', 'hm_heather'), c = document.createElement('canvas'); c.width = 18; c.height = 13; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    g.drawImage(fr.source.image, fr.cutX, fr.cutY, fr.cutWidth, fr.cutHeight, 0, 0, 18, 13); sc.textures.addCanvas('hm_tuft', c);
  }
  for (const s of Object.values(sc.grassSpr || {})) s.setTexture('hm_tuft').clearTint().setFlipX(hash(s.x, s.y) > .5);
  FX.ambient('leaves');
  // streaks of wind drift the way each swirl blows
  if (!sc.textures.exists('wind_streak')) { const gr = sc.make.graphics({ add: false }); gr.fillStyle(0xffffff, 1).fillRect(6, 0, 8, 2); gr.fillStyle(0xffffff, .5).fillRect(0, 0, 6, 2); gr.generateTexture('wind_streak', 14, 2); gr.destroy(); }
  if (!sc.textures.exists('wind_arrow')) { const gr = sc.make.graphics({ add: false }); gr.fillStyle(0x2a2030, 1).fillTriangle(14, 6, 6, 0, 6, 12).fillRect(0, 4, 8, 4); gr.fillStyle(0xffffff, 1).fillTriangle(12, 6, 7, 2, 7, 10).fillRect(1, 5, 7, 2); gr.generateTexture('wind_arrow', 15, 13); gr.destroy(); }
  sc.windStreaks = [];
  for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) {
    const k = sc.R.kind[y * RW + x]; if (!WIND_FIXED[k] && !'abcd'.includes(k)) continue;
    const glow = sc.add.ellipse(x * T + 8, y * T + 9, 15, 10, WIND_FIXED[k] ? 0xffffff : WIND_COL[k.toUpperCase()], .28).setDepth(1.5).setBlendMode(Phaser.BlendModes.ADD);
    sc.tweens.add({ targets: glow, scale: 1.25, alpha: .1, yoyo: true, repeat: -1, duration: 800 + hash(x, y) * 400 });
    for (let n = 0; n < 3; n++) sc.windStreaks.push({ s: sc.add.image(0, 0, 'wind_streak').setDepth(y * T + 14).setTint(WIND_FIXED[k] ? 0xffffff : WIND_COL[k.toUpperCase()]), x, y, n, ph: hash(x * 7 + n, y * 3) });
  }
  // the vanes, each with a pennant arrow showing which way its swirls blow
  sc.vaneArrows = {};
  for (const [id, v] of Object.entries(RC.vanes || {})) {
    sc.add.image(v.x * T + 8, v.y * T + 16, 'hm', 'hm_weathervane').setOrigin(.5, 1).setDepth(v.y * T + 15);
    const a = sc.add.image(v.x * T + 8, v.y * T - 22, 'wind_arrow').setTint(WIND_COL[id]).setDepth(9e6 - 40);
    sc.tweens.add({ targets: a, y: a.y - 2, yoyo: true, repeat: -1, duration: 700, ease: 'Sine.inOut' });
    sc.vaneArrows[id] = a; a.setAngle({ E: 0, S: 90, W: 180, N: -90 }[vaneDir(sc, id)]);
  }
  const intro = { heatherstep: 'Heatherstep Cliffs. The wind roars up from the gorges. Highmoor is somewhere above.', galeledges: 'Gale Ledges. Stone pillars rise out of a great gorge, and the wind moans between them.' }[sc.scene.key];
  if (RC.town) return;
  if (!S.flags[sc.scene.key + 'Seen']) { S.flags[sc.scene.key + 'Seen'] = 1; setTimeout(() => toast(intro, 3600), 700); }
  else setTimeout(() => toast(RC.name, 1800), 600);
}
function moorFrame(sc, dt) {
  if (!sc.windStreaks) return;
  const t = sc.time.now / 1000, v = sc.cameras.main.worldView;
  for (const w of sc.windStreaks) {
    const cx = w.x * T + 8, cy = w.y * T + 8;
    if (cx < v.x - 24 || cx > v.right + 24 || cy < v.y - 24 || cy > v.bottom + 24) { w.s.setVisible(false); continue; }
    const d = windAt(sc, w.x, w.y), [dx, dy] = CDV[d], f = ((t * .9 + w.ph + w.n / 3) % 1), off = (w.n - 1) * 4;
    w.s.setVisible(true).setAngle({ E: 0, S: 90, W: 180, N: -90 }[d]).setPosition(cx + dx * (f * 22 - 6) + (dy ? off : 0), cy + dy * (f * 22 - 6) + (dx ? off : 0) - 2).setAlpha(Math.sin(f * Math.PI) * .9);
  }
}
// turning a vane
function vaneTurn(sc, id) {
  const v = RC.vanes[id], w = wind(), k = vaneKey(sc, id);
  vaneDir(sc, id); w[k] = (w[k] + 1) % v.dirs.length;
  const d = vaneDir(sc, id); Sound.play('door'); Sound.play('gust');
  const a = sc.vaneArrows[id]; if (a) sc.tweens.add({ targets: a, angle: { E: 0, S: 90, W: 180, N: -90 }[d] + (d === 'W' && a.angle < 0 ? -360 : 0), duration: 300, ease: 'Back.out' });
  toast(`The vane swings round. The ${WIND_NAME[id]} swirls now blow ${DIR_WORD[d]}.`, 2200);
}
// stepping onto a swirl: if the gorge lies ahead in the wind's direction, ride the gust across it
function windArrive(sc, x, y) {
  if (!RC.moor || sc.gliding) return false;
  const d = windAt(sc, x, y); if (!d) return false;
  const [dx, dy] = CDV[d]; let tx = x + dx, ty = y + dy, n = 0;
  while (tx >= 0 && ty >= 0 && tx < RW && ty < RH && sc.R.kind[ty * RW + tx] === 'C') { tx += dx; ty += dy; n++; }
  if (!n) return false;
  if (!sc.passable(tx, ty)) { toast('The gust tugs at you, but there is nowhere to land that way.', 2000); return false; }
  glide(sc, x, y, tx, ty, d); return true;
}
function glide(sc, x0, y0, x1, y1, d) {
  const p = sc.p; p.path = []; p.pending = null; sc.gliding = true; sc.paused = true;
  p.dir = { N: 'up', S: 'down', E: 'right', W: 'left' }[d]; sc.player.stop(); sc.player.setFrame(sc.standF(p.dir));
  if (sc.fol) sc.fol.spr.setVisible(false);
  Sound.play('gust');
  const dist = Math.abs(x1 - x0) + Math.abs(y1 - y0), sx = x0 * T + 8, sy = y0 * T + 8, ex = x1 * T + 8, ey = y1 * T + 8, hgt = 10 + dist * 1.6;
  const shadow = sc.add.ellipse(sx, sy + 6, 12, 5, 0x10141e, .35).setDepth(9e6 - 42);
  const glider = sc.add.image(sx, sy, 'hm', 'hm_glider').setDepth(9e6 - 39).setScale(.7).setAlpha(0);
  const st = { v: 0 };
  sc.tweens.add({ targets: st, v: 1, duration: 350 + dist * 120, ease: 'Sine.inOut',
    onUpdate: () => {
      const v = st.v, up = Math.sin(v * Math.PI);
      p.px = sx + (ex - sx) * v; p.py = sy + (ey - sy) * v; sc.placePlayer();
      sc.player.y -= up * hgt; sc.player.setDepth(9e6 - 40);
      glider.setPosition(sc.player.x, sc.player.y - 24).setAlpha(Math.min(1, up * 3)).setAngle(Math.sin(v * 12) * 4);
      shadow.setPosition(p.px, p.py + 6).setScale(1 - .45 * up).setAlpha(.35 - .15 * up);
      if (Math.random() < .5) { const w = sc.add.image(sc.player.x + (Math.random() - .5) * 20, sc.player.y - 8 + (Math.random() - .5) * 18, 'wind_streak').setDepth(9e6 - 41).setAngle({ E: 0, S: 90, W: 180, N: -90 }[d]).setAlpha(.8); sc.tweens.add({ targets: w, alpha: 0, x: w.x - CDV[d][0] * 14, y: w.y - CDV[d][1] * 14, duration: 380, onComplete: () => w.destroy() }); }
    },
    onComplete: () => {
      p.x = x1; p.y = y1; p.px = ex; p.py = ey; sc.placePlayer(); shadow.destroy(); glider.destroy();
      sc.paused = false; sc.gliding = false; p.busy = .12;
      if (sc.refreshFollower) sc.refreshFollower();
      sc.arriveHook(x1, y1);
    } });
}
// the north jetty's landing in Windward Sound, and the vanes
function hmDoor(sc, id) {
  if (id === 'hm_land') { Sound.play('door'); toast('You tie up at the little jetty under the cliffs and climb ashore.', 1800); return travel(sc, 'heatherstep', ROUTES.heatherstep.spawn); }
}

/* ---------- quest, map */
QUESTS.splice(QUESTS.findIndex(q => q.id === 'spark') + 1, 0,
  { id: 'gale', name: 'Climb to Highmoor', hint: "The Gale Warden lives in Highmoor, the windmill town on the cliffs to the north. Sail from Beaconreach's north jetty across Windward Sound, then ride the wind up Heatherstep Cliffs and Gale Ledges.", done: () => !!(S.visited && S.visited.galeTop), reward: { gold: 4000, items: { skyward_charm: 5 } } });
QUEST_PLACE.gale = () => { const v = S.visited || {}; return v.galeledges ? 'galeledges' : v.heatherstep ? 'heatherstep' : v.windward ? 'windward' : 'beaconreach'; };
{
  const i = MAP_PLACES.findIndex(P => P.k === 'highmoor');
  Object.assign(MAP_PLACES[i], { x: .245, y: .1 });
  MAP_PLACES.splice(i, 0,
    { k: 'windward', name: 'Windward Sound', x: .16, y: .29, route: 1, notes: () => ["⛵ From Beaconreach's north jetty"] },
    { k: 'heatherstep', name: 'Heatherstep Cliffs', al: 'b', x: .29, y: .19, route: 1, notes: () => ['🌬️ Ride the wind across the gorges'] },
    { k: 'galeledges', name: 'Gale Ledges', x: .37, y: .155, route: 1, notes: () => [S.visited && S.visited.galeTop ? '✔ Reached the top' : '🌬️ Weathervane puzzle'] });
}
Object.assign(EXTRA_HABITAT, { inkwick: EXTRA_HABITAT.inkwick || 'Windward Sound at night' });
const HM_SCENES = ['windward', 'heatherstep', 'galeledges'].map(k => class extends Crag { constructor() { super(k); } });
