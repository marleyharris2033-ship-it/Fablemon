/* ============================================================ Painted ground
   The user's seamless painted textures (tools/art/cut_ground.py -> ASSET.ground) replace the old pixel terrain.
   The ground is painted into a few big canvases at GK times game resolution: every texture is laid in world
   space so it never repeats per tile, and where two kinds of ground meet the edge is an uneven, noisy line with a
   soft shadow, not a row of square tiles. Grass sits on top, so it overhangs paths; land overhangs water with a
   wet bank. Water gets a slow shimmer.

   Two ways in:
   - groundFromLayer(scene, layer, pal): for the farm and the meadow routes. The old tilemap layer stays (hidden)
     as the source of truth; its corner autotiles are read back into corner kinds, and every putTileAt repaints the
     tiles around it (hoeing, watering, laying paths).
   - groundFromCells(scene, w, h, cellKind, pal): for maps that know their ground per tile (Smallroot). */
let GP_UNDER = false;   // set while an ascii map's own ground draws: it then leaves the base to the painted ground
const GK = 3, GTS = T * GK;   // px per game px, tile size in px
// how many tiles one texture spans before it repeats: smaller for stones so they sit at a believable size
const GPERIOD = { crag_gravel: 5, quarry_flags: 4, quarry_dust: 7, quarry_dust_grass: 7, mud: 7, sawdust: 6, forest_moss: 5, crag_rock: 6, cobble: 4, river: 4, slab: 4.5, board: 4, soil: 4, grass: 6, heather: 6, moss: 5, rock: 6, sand: 8, snow: 8, dirt: 6, peat: 6, water: 8, shallow: 6 };
const GROUND = { src: {}, ready: false, cache: {} };

async function groundPrepare() {
  if (GROUND.ready || !ASSET.ground) return;
  for (const [n, u] of Object.entries(ASSET.ground)) {
    if (n === 'encounter_grass') continue;   // the long-grass patch is a sprite, not a ground
    const P = (GPERIOD[n] || 6) * GTS, im = await loadImg(u), c = document.createElement('canvas'); c.width = c.height = P;
    const g = c.getContext('2d', { willReadFrequently: true }); g.imageSmoothingQuality = 'high'; g.drawImage(im, 0, 0, P, P);
    GROUND.src[n] = { d: g.getImageData(0, 0, P, P).data, P };
  }
  GROUND.ready = true;
}
const _groundBoot = bootGame;
bootGame = async function () { try { await groundPrepare(); } catch (e) { console.warn('ground', e); } GROUND.cache = {}; return _groundBoot(); };

// a texture for this season: name, or name@tweak (a colour change applied to the base texture)
const GTWEAK = {
  soilwet: (r, g, b) => [r * .68, g * .64, b * .66],
  soildry: (r, g, b) => { const l = (r + g + b) / 3; return [(r * .8 + l * .2) * 1.18, (g * .8 + l * .2) * 1.14, (b * .8 + l * .2) * 1.08]; },
  bog: (r, g, b) => { const l = (r + g + b) / 3; return [l * .35 + 30, l * .5 + 40, l * .32 + 22]; },
  soft: (r, g, b) => [r * .84 + 8, g * .8 + 6, b * .74 + 2],   // the quarry dust, a little less glaring
  dull: (r, g, b) => { const l = (r + g + b) / 3; return [(r * .55 + l * .45) * .78, (g * .55 + l * .45) * .8, (b * .55 + l * .45) * .7]; },
  ice: (r, g, b) => { const l = (r + g + b) / 3; return [l * .55 + 110, l * .6 + 120, l * .5 + 140]; },
};
function gtex(name) {
  const season = seasonIdx(S.day), key = name + ':' + season; if (GROUND.cache[key]) return GROUND.cache[key];
  let [base, tw] = name.split('@');
  if (season === 3 && (base === 'grass' || base === 'heather' || base === 'moss')) base = 'snow';   // winter: snow lies on the grass
  if (season === 3 && (base === 'water' || base === 'shallow') && !tw) tw = 'ice';   // and the ponds freeze
  const S0 = GROUND.src[base] || GROUND.src.grass, out = new Uint8ClampedArray(S0.d);
  const recol = (!tw || tw === 'dull') && season && !(season === 3 && tw === 'ice') && ['grass', 'dirt', 'water', 'shallow', 'heather', 'moss'].includes(base);
  const f = tw && GTWEAK[tw];
  if (f || recol) for (let i = 0; i < out.length; i += 4) {
    let [r, g, b] = f ? f(out[i], out[i + 1], out[i + 2]) : [out[i], out[i + 1], out[i + 2]];
    if (recol) [r, g, b] = recolor(season, 'terrain', r, g, b);
    out[i] = r; out[i + 1] = g; out[i + 2] = b;
  }
  out.P = S0.P; return (GROUND.cache[key] = out);
}

// palettes: kind -> texture, and how kinds stack (higher pri on top)
const GROUND_KINDS = {
  water: { pri: 0, bank: true }, shallow: { pri: 0, bank: true },
  dirt: { pri: 1 }, sand: { pri: 1 }, peat: { pri: 1 }, rock: { pri: 1 },
  cobble: { pri: 2 }, slab: { pri: 2 }, river: { pri: 2 }, board: { pri: 2, hard: true },
  soil: { pri: 4, hard: true, fam: 'soil' }, soilwet: { pri: 4.1, hard: true, fam: 'soil' },
  floor: { pri: 1 }, path: { pri: 2 }, mudk: { pri: 2.5 }, wild: { pri: 3, tuft: true },   // regional maps (17 Nov): their own floor, path and long-grass ground
  grass: { pri: 3, tuft: true }, heather: { pri: 3, tuft: true }, moss: { pri: 3, tuft: true }, snow: { pri: 3 },
};
const GPAL_MEADOW = { grass: 'grass', dirt: 'dirt', water: 'water', cobble: 'cobble', sand: 'sand', shallow: 'shallow', soil: 'soil@soildry', soilwet: 'soil@soilwet' };
const GPAL_BOG = { ...GPAL_MEADOW, grass: 'moss@dull', dirt: 'peat', water: 'water@bog', cobble: 'board' };

// smooth value noise in [-.5, .5]
const gh2 = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
function gnoise(x, y, seed) {
  const xi = Math.floor(x), yi = Math.floor(y), u = x - xi, v = y - yi, su = u * u * (3 - 2 * u), sv = v * v * (3 - 2 * v);
  const a = gh2(xi + seed, yi), b = gh2(xi + 1 + seed, yi), c = gh2(xi + seed, yi + 1), d = gh2(xi + 1 + seed, yi + 1);
  return a + (b - a) * su + (c - a) * sv + (a - b - c + d) * su * sv - .5;
}
const gss = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/* the painter. A layer is a grid of kinds sampled at points: off 0 puts the points on tile corners, .5 on tile
   centres. Each pixel blends the four points around it. layers[0] is the base (always covers); later layers may
   hold null (nothing there) and are laid on top. */
class GroundPainter {
  constructor(sc, w, h, layers, pal) {
    const t0 = performance.now();
    this.sc = sc; this.w = w; this.h = h; this.layers = layers; this.pal = pal;
    this.CT = 32; this.chunks = []; this.dirty = new Set();
    const key = sc.scene.key;
    for (let cy = 0; cy < h; cy += this.CT) for (let cx = 0; cx < w; cx += this.CT) {
      const cw = Math.min(this.CT, w - cx), ch = Math.min(this.CT, h - cy), id = this.chunks.length;
      const c = document.createElement('canvas'); c.width = cw * GTS; c.height = ch * GTS;
      const k = `gnd_${key}_${id}`; if (sc.textures.exists(k)) sc.textures.remove(k);
      const tex = sc.textures.addCanvas(k, c); tex.setFilter(Phaser.Textures.FilterMode.LINEAR);
      const img = sc.add.image(cx * T, cy * T, k).setOrigin(0).setScale(1 / GK).setDepth(-10);
      this.chunks.push({ cx, cy, cw, ch, c, g: c.getContext('2d'), tex, img, key: k, data: null, wat: null });
    }
    sc.events.once('shutdown', () => { for (const ch of this.chunks) { if (sc.textures.exists(ch.key)) sc.textures.remove(ch.key); if (ch.wkey && sc.textures.exists(ch.wkey)) sc.textures.remove(ch.wkey); } });
    for (const ch of this.chunks) { this.paintChunk(ch, 0, 0, ch.cw, ch.ch); ch.tex.refresh(); if (ch.wtex) ch.wtex.refresh(); }
    this.shimmer(); this.ms = Math.round(performance.now() - t0);
  }
  texOf(kind) { return gtex(this.pal[kind] || kind); }
  // repaint tiles x0..x1, y0..y1 (inclusive); the canvases are uploaded at the end of the frame
  repaint(x0, y0, x1, y1) {
    for (const ch of this.chunks) {
      const a = Math.max(x0, ch.cx), b = Math.max(y0, ch.cy), c = Math.min(x1, ch.cx + ch.cw - 1), d = Math.min(y1, ch.cy + ch.ch - 1);
      if (a > c || b > d) continue;
      this.paintChunk(ch, a - ch.cx, b - ch.cy, c - ch.cx + 1, d - ch.cy + 1); this.dirty.add(ch);
    }
    if (!this.flushQ) { this.flushQ = 1; this.sc.time.delayedCall(0, () => { this.flushQ = 0; for (const ch of this.dirty) { ch.tex.refresh(); if (ch.wtex) ch.wtex.refresh(); } this.dirty.clear(); }); }
  }
  paintChunk(ch, tx0, ty0, tx1, ty1) {
    const W = (tx1 - tx0) * GTS, H = (ty1 - ty0) * GTS, img = ch.g.createImageData(W, H), d = img.data;
    const wat = this.hasWater ? new Uint8ClampedArray(W * H * 4) : null; let anyWat = false;
    for (let ty = ty0; ty < ty1; ty++) for (let tx = tx0; tx < tx1; tx++) {
      const wx = ch.cx + tx, wy = ch.cy + ty, ox = (tx - tx0) * GTS, oy = (ty - ty0) * GTS;
      if (this.paintTile(wx, wy, d, W, ox, oy, wat)) anyWat = true;
    }
    ch.g.putImageData(img, tx0 * GTS, ty0 * GTS);
    if (wat && (anyWat || ch.wg)) {
      if (!ch.wg) this.makeWaterChunk(ch);
      ch.wg.putImageData(new ImageData(wat, W, H), tx0 * GTS, ty0 * GTS);
    }
  }
  makeWaterChunk(ch) {
    const c = document.createElement('canvas'); c.width = ch.c.width; c.height = ch.c.height; ch.wc = c; ch.wg = c.getContext('2d');
    ch.wkey = ch.key + '_w'; if (this.sc.textures.exists(ch.wkey)) this.sc.textures.remove(ch.wkey);
    ch.wtex = this.sc.textures.addCanvas(ch.wkey, c); ch.wtex.setFilter(Phaser.Textures.FilterMode.LINEAR);
    ch.wimg = this.sc.add.image(ch.cx * T, ch.cy * T, ch.wkey).setOrigin(0).setScale(1 / GK).setDepth(-9.5).setAlpha(0);
    if (this.shimmering) this.sc.tweens.add({ targets: ch.wimg, alpha: .55, yoyo: true, repeat: -1, duration: 1900, ease: 'Sine.inOut' });
  }
  shimmer() { this.shimmering = 1; for (const ch of this.chunks) if (ch.wimg) this.sc.tweens.add({ targets: ch.wimg, alpha: .55, yoyo: true, repeat: -1, duration: 1900, ease: 'Sine.inOut' }); }
  // the kinds at the points around tile (wx, wy) for one layer: null if out of range of the layer
  paintTile(wx, wy, d, W, ox, oy, wat) {
    const L0 = this.layers[0];
    // fast path: every point that touches this tile, in every layer, agrees
    let uni = null, simple = true;
    for (let li = 0; li < this.layers.length && simple; li++) {
      const L = this.layers[li], a = Math.floor(wx - L.off), b = Math.floor(wy - L.off);
      const n = L.off ? 3 : 2, kk = [];
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) kk.push(L.at(a + i, b + j));
      const k0 = kk[0]; if (!kk.every(k => k === k0)) { simple = false; break; }
      if (li === 0) uni = k0; else if (k0 != null) uni = k0;
    }
    if (simple) {
      const src = this.texOf(uni), P = src.P, pt = P / GTS, sx = ((wx % pt) + pt) % pt * GTS, sy = ((wy % pt) + pt) % pt * GTS;
      for (let r = 0; r < GTS; r++) { const so = ((sy + r) * P + sx) * 4; d.set(src.subarray(so, so + GTS * 4), ((oy + r) * W + ox) * 4); }
      if (wat && GROUND_KINDS[uni] && GROUND_KINDS[uni].bank) { this.waterTile(wx, wy, wat, W, ox, oy, null); return true; }
      return false;
    }
    let anyW = false;
    const vis = wat ? new Float32Array(GTS * GTS) : null;
    // the blend (which textures, how much of each, shading) is worked out once per 2x2 pixels; textures per pixel
    const plan = [];
    for (let by = 0; by < GTS; by += 2) for (let bx = 0; bx < GTS; bx += 2) {
      const gx = wx + (bx + 1) / GTS, gy = wy + (by + 1) / GTS, ops = []; let wv = 0;
      for (let li = 0; li < this.layers.length; li++) {
        const L = this.layers[li], fx = gx - L.off, fy = gy - L.off, i0 = Math.floor(fx), j0 = Math.floor(fy), u0 = fx - i0, v0 = fy - j0;
        const u = u0 * u0 * (3 - 2 * u0), v = v0 * v0 * (3 - 2 * v0);
        const k = [L.at(i0, j0), L.at(i0 + 1, j0), L.at(i0, j0 + 1), L.at(i0 + 1, j0 + 1)], wq = [(1 - u) * (1 - v), u * (1 - v), (1 - u) * v, u * v];
        const ks = []; for (const kk of k) if (kk != null && !ks.includes(kk)) ks.push(kk);
        if (!ks.length) continue;
        ks.sort((p, q) => GROUND_KINDS[p].pri - GROUND_KINDS[q].pri);
        let famCov = 1;
        for (let n = 0; n < ks.length; n++) {
          const kn = ks[n], K = GROUND_KINDS[kn];
          let w = 0, wf = 0; for (let q = 0; q < 4; q++) { if (k[q] === kn) w += wq[q]; if (K.fam && k[q] && GROUND_KINDS[k[q]].fam === K.fam) wf += wq[q]; }
          const prevFam = n > 0 && K.fam && GROUND_KINDS[ks[n - 1]].fam === K.fam;
          let a = 1, shade = 0, dk = 1;
          if (prevFam) a = famCov * gss(.15, .85, w / Math.max(wf, 1e-6));   // a kind of the same family: blended inside the family's edge
          else if (!(li === 0 && n === 0) && (K.fam ? wf : w) < .999) {
            const ww = K.fam ? wf : w, samePri = n > 0 && GROUND_KINDS[ks[n - 1]].pri === K.pri;
            const amp = K.hard ? .12 : K.tuft ? .62 : .42, f = K.hard ? .03 : .045, seed = Math.round(K.pri) * 97 + 13;
            const nz = K.hard ? gnoise(gx * 4, gy * 4, seed) * .6 : gnoise(gx * 1.6, gy * 1.6, seed) * .7 + gnoise(gx * 5.5, gy * 5.5, seed + 5) * .3 + (K.tuft ? gnoise(gx * 14, gy * 14, seed + 9) * .35 : 0);
            const val = ww + nz * amp;
            a = gss(.5 - f, .5 + f, val);
            shade = samePri ? 0 : (gss(.5 - .16, .5, val) - a) * (K.hard ? .3 : .38);
            if (K.fam) famCov = a;
            if (a <= 0 && shade <= 0) continue;
            dk = 1 - (samePri ? 0 : Math.max(0, a - gss(.5 + f, .5 + .1, val)) * (K.tuft ? .18 : .28));
          }
          if (K.fam && !prevFam) famCov = a;
          ops.push(kn, a, shade, dk);
          if (K.bank) wv = Math.max(wv, a); else wv *= 1 - a;
        }
      }
      plan.push(ops, wv);
    }
    for (let py = 0; py < GTS; py++) for (let px = 0; px < GTS; px++) {
      const pi = ((py >> 1) * (GTS >> 1) + (px >> 1)) * 2, ops = plan[pi], wv = plan[pi + 1];
      const gpx = wx * GTS + px, gpy = wy * GTS + py;
      let R = 0, G = 0, B = 0;
      for (let q = 0; q < ops.length; q += 4) {
        const src = this.texOf(ops[q]), P = src.P, to = ((gpy % P) * P + (gpx % P)) * 4, a = ops[q + 1], shade = ops[q + 2], dk = ops[q + 3];
        if (shade > 0 && q) { R *= 1 - shade; G *= 1 - shade; B *= 1 - shade; }
        R = R * (1 - a) + src[to] * dk * a; G = G * (1 - a) + src[to + 1] * dk * a; B = B * (1 - a) + src[to + 2] * dk * a;
      }
      const o = ((oy + py) * W + ox + px) * 4; d[o] = R; d[o + 1] = G; d[o + 2] = B; d[o + 3] = 255;
      if (vis) { vis[py * GTS + px] = wv; if (wv > .02) anyW = true; }
    }
    if (anyW) this.waterTile(wx, wy, wat, W, ox, oy, vis);
    return anyW;
  }
  // the shimmer layer: the same water, shifted, faded in and out over the top
  waterTile(wx, wy, wat, W, ox, oy, vis) {
    const src = this.texOf(this.waterKind || 'water'), P = src.P;
    for (let py = 0; py < GTS; py++) for (let px = 0; px < GTS; px++) {
      const v = vis ? vis[py * GTS + px] : 1; if (v < .02) continue;
      const tx = (wx * GTS + px + (P >> 1)) % P, ty = (wy * GTS + py + Math.floor(P / 3)) % P, so = (ty * P + tx) * 4, o = ((oy + py) * W + ox + px) * 4;
      wat[o] = src[so] * 1.06; wat[o + 1] = src[so + 1] * 1.06; wat[o + 2] = src[so + 2] * 1.04; wat[o + 3] = 255 * v;
    }
  }
}

/* ---------- reading the old autotiles back: corner kinds from the terrain tile indices (see buildRoute/renderTile) */
const GROW_KIND = { 0: 'dirt', 1: 'water', 2: 'water', 3: 'cobble' };
const GFILL_KIND = { 0: 'grass', 1: 'grass', 2: 'grass', 3: 'dirt', 6: 'cobble', 7: 'cobble', 8: 'water', 9: 'water', 10: 'shallow', 11: 'grass' };
const GCORNER_RANK = { grass: 0, dirt: 1, cobble: 2, shallow: 3, water: 4 };
function groundFromLayer(sc, layer, pal, w, h) {
  if (!GROUND.ready) return null;
  const idx = new Int32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const t = layer.getTileAt(x, y); idx[y * w + x] = t ? t.index : FILL_ROW * 16; }
  const V = Array(( w + 1) * (h + 1)).fill('grass'), cell = Array(w * h).fill(null);
  const setV = (x, y, k) => { const i = y * (w + 1) + x; if (GCORNER_RANK[k] > GCORNER_RANK[V[i]]) V[i] = k; };
  const decode = (x, y) => {
    const n = idx[y * w + x], row = n >> 4, col = n & 15;
    if (row === FILL_ROW) {
      if (col === 4 || col === 5) return { cell: col === 5 ? 'soilwet' : 'soil' };
      return { all: GFILL_KIND[col] || 'grass' };
    }
    const k = GROW_KIND[row] || 'dirt'; return { k, bits: col };
  };
  const corners = (x, y) => {   // TL, TR, BR, BL kinds this tile asks for
    const t = decode(x, y);
    if (t.cell) return [null, null, null, null];
    if (t.all) return [t.all, t.all, t.all, t.all];
    return [8, 4, 2, 1].map(b => t.bits & b ? 'grass' : t.k);
  };
  const rebuildV = (x0, y0, x1, y1) => {
    for (let y = y0; y <= y1 + 1; y++) for (let x = x0; x <= x1 + 1; x++) if (x >= 0 && y >= 0 && x <= w && y <= h) V[y * (w + 1) + x] = 'grass';
    for (let y = y0 - 1; y <= y1 + 1; y++) for (let x = x0 - 1; x <= x1 + 1; x++) {
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      const c = corners(x, y), t = decode(x, y); cell[y * w + x] = t.cell || null;
      [[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1]].forEach(([a, b], q) => { if (c[q] && a >= x0 && b >= y0 && a <= x1 + 1 && b <= y1 + 1) setV(a, b, c[q]); });
    }
  };
  rebuildV(0, 0, w - 1, h - 1);
  const clampV = (x, y) => V[Math.max(0, Math.min(h, y)) * (w + 1) + Math.max(0, Math.min(w, x))];
  const layers = [{ off: 0, at: clampV }, { off: .5, at: (x, y) => x < 0 || y < 0 || x >= w || y >= h ? null : cell[y * w + x] }];
  const P = new GroundPainter(sc, w, h, layers, pal);
  P.hasWater = true;
  layer.setVisible(false);
  // keep in step with the hidden layer: only repaint when the kinds really change (not for the water's two frames)
  const put = layer.putTileAt.bind(layer);
  layer.putTileAt = (tile, x, y, ...rest) => {
    const r = put(tile, x, y, ...rest), n = typeof tile === 'number' ? tile : tile.index, i = y * w + x;
    if (x < 0 || y < 0 || x >= w || y >= h) return r;
    const norm = q => (q >> 4) === 2 ? q - 16 : (q === FILL_ROW * 16 + 9 ? FILL_ROW * 16 + 8 : q);
    if (norm(idx[i]) === norm(n)) { idx[i] = n; return r; }
    idx[i] = n; rebuildV(x, y, x, y); P.repaint(x - 1, y - 1, x + 1, y + 1);
    return r;
  };
  return P;
}
function groundFromCells(sc, w, h, cellKind, pal) {
  if (!GROUND.ready) return null;
  const P = new GroundPainter(sc, w, h, [{ off: .5, at: (x, y) => cellKind(Math.max(0, Math.min(w - 1, x)), Math.max(0, Math.min(h - 1, y))) }], pal);
  return P;
}

/* ---------- where it's used */
// Smallroot: grass, with cobbles, slabs and river stones where the town is paved
const _gTownGround = townGround;
townGround = function (sc, town) {
  if (!GROUND.ready) return _gTownGround(sc, town);
  if (sc.textures.exists('townGround')) sc.textures.remove('townGround');
  const KIND = { 1: 'cobble', 2: 'slab', 3: 'river' };
  sc.groundP = groundFromCells(sc, TW, TH, (x, y) => KIND[town.pave[y * TW + x]] || 'grass', { grass: 'grass', cobble: 'cobble', slab: 'slab', river: 'river' });
  const c = document.createElement('canvas'); c.width = c.height = 1; sc.textures.addCanvas('townGround', c);
};
// the farm and the meadow routes: read back from their tile layer
const _gFarmCreate = Farm.prototype.create;
Farm.prototype.create = function () {
  _gFarmCreate.call(this);
  try { this.groundP = groundFromLayer(this, this.ground, GPAL_MEADOW, W, H); } catch (e) { console.warn('ground', e); this.ground.setVisible(true); }
};
const _gRouteCreate = Route.prototype.create;
Route.prototype.create = function () {
  _gRouteCreate.call(this);
  if (!this.ground || RC.ascii) return;
  if (RC.ew && this.R) { try { this.groundP = ewGround(this, this.R); this.ground.setVisible(false); return; } catch (e) { console.warn('ground', e); } }
  try { this.groundP = groundFromLayer(this, this.ground, RC.bog ? GPAL_BOG : GPAL_MEADOW, RW, RH); } catch (e) { console.warn('ground', e); this.ground.setVisible(true); }
};

/* ---------- the ascii maps (16 Nov 2026): crags and Quarrydown, the coast and the sea, Highmoor
   The painted ground goes underneath, and each map's own drawing keeps only what's special to it on top:
   cliff faces, crevasses and bridges, the sea with its depth and foam, gorges, boardwalks and steps. */
const GPAL_CRAG = { floor: 'crag_dirt', path: 'crag_gravel', rock: 'crag_rock', wild: 'crag_dirt_grass' };
const GPAL_MINE = { floor: 'crag_dirt@dull', path: 'crag_gravel@dull', rock: 'crag_rock@dull', wild: 'crag_dirt@dull' };
const GPAL_QUARRY = { floor: 'quarry_dust@soft', path: 'quarry_flags', rock: 'crag_rock', wild: 'quarry_dust_grass@soft' };
const GPAL_BEACH = { sand: 'sand', grass: 'grass', rock: 'rock', dirt: 'sand' };
const GPAL_MOOR = { heather: 'heather', rock: 'rock', dirt: 'dirt', snow: 'snow' };
function asciiKind(mode, k) {
  const zone = k >= '0' && k <= '9';
  if (mode === 'beach') return k === '#' || k === ';' ? 'grass' : zone && !RC.sail ? 'grass' : 'sand';
  if (mode === 'moor') { if (k === '#' || k === 'C') return 'rock'; if (RC.snow) return 'snow'; return k === ',' || k === 'H' ? 'dirt' : 'heather'; }
  return k === '#' ? 'rock' : k === ',' || RAILS.includes(k) ? 'path' : zone ? 'wild' : 'floor';
}
// the crags and Quarrydown use their own textures from the user's second ground pack (17 Nov)
for (const [name, mode] of [['cragGround', 'crag'], ['beachGround', 'beach'], ['moorGround', 'moor']]) {
  const orig = window[name] || eval(name);
  const wrapped = function (sc, R) {
    let P = null;
    if (GROUND.ready) try {
      const pal = mode === 'beach' ? GPAL_BEACH : mode === 'moor' ? GPAL_MOOR : RC.mine ? GPAL_MINE : /quarry|qd/.test(sc.scene.key) ? GPAL_QUARRY : GPAL_CRAG;
      P = groundFromCells(sc, RW, RH, (x, y) => asciiKind(mode, R.kind[y * RW + x]), pal);
    } catch (e) { console.warn('ground', e); P = null; }
    sc.groundP = P; GP_UNDER = !!P;
    try { return orig(sc, R); } finally { GP_UNDER = false; }
  };
  if (name === 'cragGround') cragGround = wrapped; else if (name === 'beachGround') beachGround = wrapped; else moorGround = wrapped;
}

/* ---------- Elderwood (17 Nov): forest floor, forest paths, grassy forest floor under the long grass, mud on
   Greenline's haul road and in the clear-cuts, moss in the town, sawdust and mud in the timber camp */
const GPAL_FOREST = { floor: 'forest_floor', path: 'forest_path', wild: 'forest_floor_grass', mudk: 'mud', water: 'water', shallow: 'shallow' };
const GPAL_EWTOWN = { ...GPAL_FOREST, floor: 'forest_moss', wild: 'forest_floor_grass' };
const GPAL_CAMP = { ...GPAL_FOREST, floor: 'sawdust', path: 'mud', mudk: 'mud' };
function ewGround(sc, R) {
  const key = sc.scene.key, inR = (x, y, r) => x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3];
  const road = key === 'fernwalk' ? [[17, 0, 21, 64]] : key === 'eldglade' ? [[26, 30, 56, 33], [26, 30, 30, 48]] : [];
  const cut = (RC.clearcut || []).filter(c => !c.ok || !c.ok()).map(c => c.r);
  const pal = key === 'elderwood' ? GPAL_EWTOWN : key === 'ewcamp' ? GPAL_CAMP : GPAL_FOREST;
  return groundFromCells(sc, RW, RH, (x, y) => {
    const i = y * RW + x;
    if (R.waterish[i]) return 'water';
    if (R.grass[i] >= 0) return 'wild';
    if (R.dirtish[i]) return road.some(r => inR(x, y, r)) ? 'mudk' : 'path';
    if (key !== 'ewcamp' && cut.some(r => inR(x, y, r))) return 'path';   // the clear-cuts are bare earth
    return 'floor';
  }, pal);
}

/* ---------- the user's long-grass patch (17 Nov), recoloured for each region and season */
const EGRASS_TINT = {
  meadow: null,
  forest: (r, g, b) => [r * .62, g * .78, b * .6],
  crag: (r, g, b) => { const l = (r + g + b) / 3; return [l * .75 + 62, l * .72 + 40, l * .25 + 8]; },
  quarry: (r, g, b) => { const l = (r + g + b) / 3; return [l * .6 + 66, l * .72 + 62, l * .5 + 44]; },
  beach: (r, g, b) => { const l = (r + g + b) / 3; return [l * .7 + 66, l * .82 + 58, l * .42 + 26]; },
  moor: (r, g, b) => { const l = (r + g + b) / 3; return [l * .78 + 70, l * .64 + 42, l * .3 + 14]; },
  snow: (r, g, b) => { const l = (r + g + b) / 3; return [l * .45 + 128, l * .5 + 132, l * .45 + 144]; },
};
const egrassRegion = sc => RC.ew ? 'forest' : RC.moor ? (RC.snow ? 'snow' : 'moor') : RC.beach ? 'beach' : RC.ascii ? (/quarry|qd/.test(sc.scene.key) ? 'quarry' : 'crag') : 'meadow';
let EGRASS_IMG = null;
async function egrassLoad() { if (!EGRASS_IMG && ASSET.ground && ASSET.ground.encounter_grass) EGRASS_IMG = await loadImg(ASSET.ground.encounter_grass); }
const _egBoot = bootGame;
bootGame = async function () { try { await egrassLoad(); } catch (e) { } return _egBoot(); };
function egrassTex(sc, region) {
  const season = seasonIdx(S.day), key = `egrass_${region}_${season}`;
  if (sc.textures.exists(key)) return key;
  const N = EGRASS_IMG.width, c = document.createElement('canvas'); c.width = c.height = N;
  const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(EGRASS_IMG, 0, 0);
  const d = g.getImageData(0, 0, N, N), a = d.data, f = EGRASS_TINT[region];
  for (let i = 0; i < a.length; i += 4) {
    if (!a[i + 3]) continue;
    let [r, gg, b] = f ? f(a[i], a[i + 1], a[i + 2]) : [a[i], a[i + 1], a[i + 2]];
    if (region !== 'snow') [r, gg, b] = recolor(season, 'grass', r, gg, b);
    a[i] = r; a[i + 1] = gg; a[i + 2] = b;
  }
  g.putImageData(d, 0, 0); sc.textures.addCanvas(key, c); return key;
}
const _egRoute = Route.prototype.create;
Route.prototype.create = function () {
  _egRoute.call(this);
  if (!EGRASS_IMG || RC.bog || !this.grassSpr) return;
  try {
    const key = egrassTex(this, egrassRegion(this)), sz = 32 / EGRASS_IMG.width;   // patches overlap their neighbours so the zone reads as one mass, not squares
    for (const sp of Object.values(this.grassSpr)) if (sp && sp.setTexture) { if (sp.tintTopLeft === 0xe8dc98 || sp.tintTopLeft === 0xd8d890) sp.clearTint(); sp.setTexture(key).setFlipX(hash(sp.x, sp.y) > .5); const h = hash(sp.x * 7, sp.y * 3), k = .92 + h * .16; sp.setScale(sz * k, sz * k * .8); sp.x += (h - .5) * 4; sp.y += 3; }   // wide and lowish: rows overlap, and the grass comes up to your waist   // the region's own colour replaces the old crag and dune tints; Verdance's grey stays
  } catch (e) { console.warn('egrass', e); }
};
