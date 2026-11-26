/* ============================================================ Farm village (26 Nov 2026)
   The user's friend wanted to grow a little town on the farm.
   1. Farm branches: once you've reached a town, Robin can build a branch of its store on your farm. A branch sells
      that town's seeds and farm supplies (charms, sigils and Fablemon items stay in the towns). Branches are big
      buildings placed like the barn, and can be moved in move mode.
   2. Village crafts: cottages, a fountain, harbour and marsh props and seasonal pieces, reusing art from the towns.
   All the art is in one small atlas, 'fv' (tools/art/cut_fv.py), loaded only on the farm. */

// the nearest spot (from a starting point) where an area is clear, so the preview opens somewhere it fits
function vClearSpot(start, areaFor) {
  const free = (x, y) => { const k = x + ',' + y, i = y * W + x; return x >= 3 && y >= 3 && x <= W - 4 && y <= H - 4 && !S.tilled[k] && !S.fences[k] && !S.paths[k] && !S.objs[k] && !farm.waterish[i] && !farm.dirtish[i] && !farm.blocked[i]; };
  for (let r = 0; r <= 14; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
    const a = { cx: start.cx + dx, by: start.by + dy }, [x0, y0, x1, y1] = areaFor(a); let ok = true;
    for (let y = y0; y <= y1 && ok; y++) for (let x = x0; x <= x1 && ok; x++) ok = free(x, y);
    if (ok) return a;
  }
  return start;
}
/* ---------- 1. the farm branches */
const isSeed = i => ITEMS[i] && (ITEMS[i].seed || /_seeds?$/.test(i));
const BRANCH = {
  bh: { town: 'Brookholt', shop: 'Fenroot Seeds', frame: 'br_bh', gold: 2000, cost: { wood: 80, stone: 40 }, open: () => !!(S.visited || {}).brookholt,
    keeper: 'Bog seeds and peat, sent up the canal every morning. Peat makes any tilled soil waterlogged for bog crops.',
    stock: () => BH_SHOP.filter(([i]) => isSeed(i) || i === 'bog_peat') },
  qd: { town: 'Quarrydown', shop: 'Stone & Supply', frame: 'br_qd', gold: 2500, cost: { wood: 100, stone: 80 }, open: () => !!(S.visited || {}).quarrydown,
    keeper: 'Quarry seeds and building bundles, brought over on the morning cart.',
    stock: () => QD_SHOP.filter(([i]) => isSeed(i) || ['stone', 'wood', 'fiber'].includes(i)) },
  br: { town: 'Beaconreach', shop: 'Beaconreach Chandlery', frame: 'br_br', gold: 3000, cost: { wood: 120, stone: 60 }, open: () => !!(S.visited || {}).beaconreach,
    keeper: 'Coast seeds, kept dry in oilcloth.',
    stock: () => BR_SHOP.filter(([i]) => isSeed(i)) },
  hm: { town: 'Highmoor', shop: 'The Weathervane', frame: 'br_hm', gold: 3500, cost: { wood: 120, stone: 80 }, open: () => !!(S.visited || {}).highmoor,
    keeper: 'Moorland seeds, flown down by Kestrel Kites.',
    stock: () => HM_SHOP.filter(([i]) => isSeed(i)) },
  ew: { town: 'Elderwood', shop: 'Forest Stores', frame: 'br_ew', gold: 4000, cost: { wood: 150, stone: 100 }, open: () => typeof ewRepaired === 'function' && ewRepaired('ew_mill'),
    lockTxt: 'Once the Elderwood mill is running again.',
    keeper: 'Elder seeds and salt licks from Oliver\'s shelves.',
    stock: () => EW_SHOP.filter(([i]) => isSeed(i) || i === 'salt_lick') },
  gh: { town: 'Gloamhollow', shop: 'Hollow Stores', frame: 'br_gh', gold: 5000, cost: { wood: 150, stone: 120 }, open: () => !!(S.visited || {}).gloamhollow,
    keeper: 'Lanterns for your farm, and the Noonbell seed once the town has found it.',
    stock: () => {
      const G = S.gh || {}, bloom = typeof GH_BLOOM_KEYS !== 'undefined' && Object.keys(G.blooms || {}).length >= GH_BLOOM_KEYS.length;
      return [...(bloom && ITEMS.noonbell_seed ? [['noonbell_seed', Math.max(300, (ITEMS.noonbell_seed.sell || 50) * 6)]] : []), ['lantern', 400], ['stone_lantern', 650], ['hearth_lantern', 1400]].filter(([i]) => ITEMS[i]);
    } },
};
const BR_D = 3;   // rows deep (the doorstep row below is kept clear when building)
const branches = () => (S.branches = S.branches || {});
const brW = k => { const f = HDW.fv && HDW.fv.frames['br_' + k] || HDW.fv && HDW.fv.frames[BRANCH[k].frame]; return f ? Math.ceil(f.w / 3 / T) : 6; };
const brFoot = (k, cx, by) => [cx, by - BR_D + 1, cx + brW(k) - 1, by];
const brDoor = k => { const b = branches()[k]; return { x: b.cx + Math.floor(brW(k) / 2), y: b.by }; };
const brAt = (x, y) => Object.keys(branches()).find(k => { const [x0, y0, x1, y1] = brFoot(k, branches()[k].cx, branches()[k].by); return x >= x0 && x <= x1 && y >= y0 && y <= y1; }) || null;

function openBranch(k) {
  const B = BRANCH[k];
  const render = () => `<p class="hint">${B.keeper} Same prices as in ${B.town}.</p><div class="mlist">${B.stock().map(([i, p, c, n]) => shopRow(i, p, c || 0, n || 1)).join('') || '<p>Nothing on the shelves yet.</p>'}</div>`;
  openModal(`${B.shop} (farm branch)`, render(), (a, d) => { if (a === 'buy') buy(d.id, +d.p, +d.n || 1); $('mBody').innerHTML = render(); });
}
function buildBranch(k) {
  if (!scene || scene.scene.key !== 'farm') return toast('Go out onto your farm to choose where the branch goes.', 2400);
  closeModal();
  const B = BRANCH[k], w = brW(k); let cur = null;
  scene.buildPreview({
    name: `${B.shop} branch`, desc: `A branch of ${B.town}'s store.`, at: vClearSpot({ cx: DOOR.x - Math.floor(w / 2), by: DOOR.y + 9 }, a => { const f = brFoot(k, a.cx, a.by); return [f[0], f[1], f[2], f[3] + 1]; }),
    areaFor: a => { cur = a; const [x0, y0, x1, y1] = brFoot(k, a.cx, a.by); return [x0, y0, x1, y1 + 1]; },
    ghostKey: 'fv', ghostFrame: B.frame, ghostAt: a => [a.cx * T + w * 8, (a.by + 1) * T],
    cost: B.cost, gold: B.gold,
    ignore: (x, y) => cur && y === cur.by + 1 && !!S.paths[x + ',' + y],
    onBuild: at => {
      branches()[k] = { cx: at.cx, by: at.by, day: S.day };
      scene.brDraw(); Sound.play('place'); save();
      toast(`Robin's crew puts up your ${B.shop} branch. ${B.town}'s seeds, right on your farm!`, 3400);
    },
  });
}

// Robin's Workshop: a "Farm branches" list under the coop and barn
const _brCarp = svcCarpenter;
svcCarpenter = SERVICE.carpenter = function () {
  _brCarp();
  if (!$('mBody')) return;
  keepAdded('brList', () => {
    const b = $('mBody');
    const rows = Object.entries(BRANCH).map(([k, B]) => {
      const have = branches()[k], ok = S.gold >= B.gold && Object.entries(B.cost).every(([i, n]) => stock(i) >= n);
      const icon = `<img src="${iconFor('br_' + k)}">`;
      if (have) return `<div class="shoprow">${icon}<div class="g"><b>${B.shop} branch</b><small>Built on your farm. Use move mode to move it.</small></div></div>`;
      if (!B.open()) return `<div class="shoprow" style="opacity:.55">${icon}<div class="g"><b>🔒 ${B.town} store branch</b><small>${B.lockTxt || `Reach ${B.town} first.`}</small></div></div>`;
      const needs = Object.entries(B.cost).map(([i, n]) => `<span class="need ${stock(i) < n ? 'no' : ''}"><img src="${iconFor(i)}">${itemNm(i)} ${Math.min(stock(i), n)}/${n}</span>`).join('') + `<span class="need ${S.gold < B.gold ? 'no' : ''}"><img src="${ICONS.coin}">${B.gold.toLocaleString()}g</span>`;
      return `<div class="shoprow">${icon}<div class="g"><b>${B.shop} branch</b><small>Sells ${B.town}'s ${k === 'gh' ? 'lanterns and rare seed' : 'seeds and farm supplies'} on your farm.</small><div>${needs}</div></div><button class="btn gold" data-br="${k}" ${ok ? '' : 'disabled'}>Build</button></div>`;
    }).join('');
    const list = b.querySelector('.mlist'); (list || b).insertAdjacentHTML('beforeend', `<div id="brList"><p style="margin:10px 0 4px"><b>Farm branches</b> <small>Stores from the towns you've reached, built on your farm.</small></p>${rows}</div>`);
    b.querySelectorAll('[data-br]').forEach(el => el.onclick = () => buildBranch(el.dataset.br));
  });
};

// on the farm
const _brSetup = Farm.prototype.setupRanch;
Farm.prototype.setupRanch = function () { _brSetup.call(this); this.brImgs = {}; this.brDraw(); };
Farm.prototype.brDraw = function () {
  for (const [k, b] of Object.entries(branches())) {
    if (!BRANCH[k]) continue;
    const [x0, y0, x1, y1] = brFoot(k, b.cx, b.by); this.clearDebrisIn(x0, y0, x1, y1);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) farm.blocked[y * W + x] = 1;
    if (this.brImgs[k]) { this.brImgs[k].destroy(); this.tall = this.tall.filter(t => t !== this.brImgs[k]); }
    const img = this.add.image(b.cx * T + brW(k) * 8, (b.by + 1) * T, 'fv', BRANCH[k].frame).setOrigin(.5, 1).setDepth(b.by * T + 15);
    this.brImgs[k] = img; this.tall.push(img);
  }
};
const _brTarget = Farm.prototype.targetAt;
Farm.prototype.targetAt = function (wx, wy) {
  for (const k of Object.keys(branches())) { const im = this.brImgs && this.brImgs[k]; if (im && im.getBounds().contains(wx, wy) && Math.floor(wy / T) <= branches()[k].by) { const d = brDoor(k); return { type: 'branch', k, x: d.x, y: d.y }; } }
  return _brTarget.call(this, wx, wy);
};
const _brAct = Farm.prototype.act;
Farm.prototype.act = function (t) {
  if (t.type === 'branch') { if (this.p.busy > 0) { this.p.queued = t; return; } this.face(t.x, t.y); this.p.busy = .3; return openBranch(t.k); }
  return _brAct.call(this, t);
};
const _brFacing = Farm.prototype.actFacing;
Farm.prototype.actFacing = function () {
  const p = this.p; if (p.moving || this.paused) return _brFacing.call(this);
  const [dx, dy] = DV[p.dir], k = brAt(p.x + dx, p.y + dy); if (k) return this.act({ type: 'branch', k, x: p.x + dx, y: p.y + dy });
  return _brFacing.call(this);
};
// move mode: tap a branch to move it
const _brMove = Farm.prototype.moveDef;
Farm.prototype.moveDef = function (tx, ty, wx, wy) {
  for (const k of Object.keys(branches())) {
    const im = this.brImgs && this.brImgs[k], b = branches()[k];
    if (!(im && im.getBounds().contains(wx, wy)) && brAt(tx, ty) !== k) continue;
    const w = brW(k), [x0, y0, x1, y1] = brFoot(k, b.cx, b.by);
    return { name: `${BRANCH[k].shop} branch`, ghostKey: 'fv', ghostFrame: BRANCH[k].frame, at: { cx: b.cx, by: b.by },
      areaFor: a => brFoot(k, a.cx, a.by), ghostAt: a => [a.cx * T + w * 8, (a.by + 1) * T],
      ignore: (x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1,
      onBuild: a => { b.cx = a.cx; b.by = a.by; save(); S.spawn = { scene: 'farm', x: this.p.x, y: this.p.y, dir: this.p.dir }; this.scene.restart(); setTimeout(() => scene === this && this.moveMode && this.moveMode(), 600); } };
  }
  return _brMove.call(this, tx, ty, wx, wy);
};

// seeds that said "Sold only in <town>" are now sold in that town's farm branch too
for (const it of Object.values(ITEMS)) if (it && typeof it.desc === 'string') it.desc = it.desc.replace(/Sold only in ([A-Z][a-z]+)\./, 'Sold only in $1 (and its farm branch).');

/* ---------- 2. Village crafts */
// id: [name, atlas frame, tiles wide, rows deep, recipe, description]
const VILLAGE = {
  'Village': {
    v_cottage_a: ['Red-roof Cottage', 7, 2, { wood: 150, stone: 80 }, 'A long cottage with a red tile roof, like the ones in Smallroot. Decoration.'],
    v_cottage_b: ['Gabled Cottage', 6, 2, { wood: 120, stone: 100 }, 'A two-storey cottage with a gabled roof. Decoration.'],
    v_cottage_c: ['Row Cottage', 8, 2, { wood: 180, stone: 90 }, 'A row of little cottages under one roof. Decoration.'],
    v_fisher_cottage: ['Fisher\'s Cottage', 5, 2, { wood: 160, fiber: 40 }, 'A cottage on stilts, from Driftwood Cove. Decoration.'],
    v_fountain: ['Town Fountain', 5, 2, { stone: 120 }, 'A stone fountain like the one in Smallroot square.'],
    v_old_well: ['Old Stone Well', 3, 1, { stone: 60, wood: 10 }, 'A roofed well from Gloamhollow. Decoration (it doesn\'t fill your watering can).'],
    v_board: ['Notice Board', 4, 1, { wood: 30 }, 'A village notice board. Decoration.'],
    v_market_cart: ['Market Cart', 3, 1, { wood: 40, fiber: 10 }, 'A little market cart with a striped awning.'],
    v_sunflower_stand: ['Sunflower Stand', 2, 1, { wood: 20, fiber: 10 }, 'A summer stall piled with sunflowers.'],
    v_steps: ['Stone Steps', 4, 1, { stone: 30 }, 'A short flight of stone steps.'],
    v_street_lamp: ['Street Lamp', 1, 1, { stone: 10, wood: 5 }, 'A tall street lamp from Gloamhollow. Glows at night.'],
  },
  'Harbour': {
    v_barrels: ['Barrel Stack', 2, 1, { wood: 20 }, 'Barrels from the Driftwood Cove pier.'],
    v_anchor: ['Old Anchor', 2, 1, { stone: 25 }, 'A ship\'s anchor, for show.'],
    v_net_rack: ['Net Rack', 2, 1, { wood: 10, fiber: 20 }, 'Fishing nets hung out to dry.'],
    v_rope_coil: ['Rope Coil', 2, 1, { fiber: 15 }, 'A coil of thick rope.'],
    v_fish_crates: ['Fish Crates', 2, 1, { wood: 15 }, 'Crates for the day\'s catch.'],
    v_lobster_pots: ['Lobster Pots', 2, 1, { wood: 10, fiber: 10 }, 'A stack of lobster pots.'],
    v_oar_rack: ['Oar Rack', 2, 1, { wood: 15 }, 'Oars stood up to dry.'],
    v_glass_floats: ['Glass Floats', 2, 1, { stone: 10, fiber: 5 }, 'Green glass fishing floats in a net.'],
    v_buoys: ['Buoys', 2, 1, { wood: 8, fiber: 8 }, 'Painted buoys on a post.'],
    v_cove_lantern: ['Cove Lantern', 1, 1, { wood: 5, stone: 5 }, 'A harbour lantern on a post. Glows at night.'],
    v_signpost: ['Marsh Signpost', 1, 1, { wood: 8 }, 'A wooden signpost from the bog.'],
    v_post: ['Marker Post', 1, 1, { wood: 5 }, 'A weathered wooden post.'],
    v_cattails: ['Cattails', 2, 1, { fiber: 8 }, 'A clump of cattails.'],
    v_log: ['Fallen Log', 2, 1, { wood: 12 }, 'A mossy log to sit on.'],
  },
  'Seasonal': {
    v_string_lanterns: ['String Lanterns', 2, 1, { wood: 5, fiber: 10 }, 'Paper lanterns on a string. Glow at night.'],
    v_garden_umbrella: ['Garden Umbrella', 2, 1, { wood: 6, fiber: 12 }, 'A striped umbrella for summer afternoons.'],
    v_sunflowers: ['Sunflowers', 2, 1, { fiber: 6 }, 'Tall sunflowers. They stay out all year.'],
    v_tulips: ['Tulips', 1, 1, { fiber: 4 }, 'A patch of spring tulips that never fade.'],
    v_daffodils: ['Daffodils', 1, 1, { fiber: 4 }, 'A patch of daffodils that never fade.'],
    v_birdbox: ['Birdbox', 1, 1, { wood: 8 }, 'A birdbox on a pole.'],
    v_hay_bales: ['Hay Bales', 2, 1, { hay: 4 }, 'A couple of hay bales.'],
    v_pumpkin_pile: ['Pumpkin Pile', 2, 1, { pumpkin: 3 }, 'A heap of pumpkins for autumn (or any time).'],
    v_firewood: ['Firewood Stack', 1, 1, { wood: 20 }, 'Split logs stacked for winter.'],
  },
};
for (const [tab, list] of Object.entries(VILLAGE)) {
  for (const [id, [name, w, d, need, desc]] of Object.entries(list)) {
    ITEMS[id] = { name, stack: 99, place: 'obj', obj: id, desc: `${desc} ${w > 1 || d > 1 ? `${w}×${d} tiles.` : ''}`.trim() };
    OBJ_ART[id] = ['fv', id, w, d];
    RECIPES.push({ out: id, n: 1, need });
  }
  CRAFT_TABS.push([tab, Object.keys(list)]);
}
Object.assign(CRAFT_ICON, { 'Village': 'v_cottage_b', 'Harbour': 'v_anchor', 'Seasonal': 'v_string_lanterns' });
if (typeof GLOWS !== 'undefined') GLOWS.push('v_street_lamp', 'v_cove_lantern', 'v_string_lanterns');

// placing a deep one (cottages, fountains): choose the spot on the map, like a building
const _vUse = Farm.prototype.useOnTile;
Farm.prototype.useOnTile = function (x, y) {
  const h = held(), it = h && ITEMS[h.id];
  if (it && it.place === 'obj' && objD(it) > 1 && !(S.tilled[x + ',' + y] && S.tilled[x + ',' + y].crop)) {
    this.face(x, y);
    const w = objW(it), d = objD(it), id = h.id, [key, frame] = this.objTex(it.obj);
    return this.buildPreview({ move: true, verb: 'Place', name: it.name, ghostKey: key, ghostFrame: frame, at: vClearSpot({ cx: Math.max(3, Math.min(W - 4 - w, x - Math.floor(w / 2))), by: Math.max(3 + d, y) }, a => [a.cx, a.by - d + 1, a.cx + w - 1, a.by]),
      areaFor: a => [a.cx, a.by - d + 1, a.cx + w - 1, a.by], ghostAt: a => [a.cx * T + w * 8, a.by * T + 16],
      onBuild: a => {
        const slot = inv.slots.findIndex(s => s && s.id === id); if (slot < 0) return;
        const k = a.cx + ',' + a.by; S.objs[k] = { t: it.obj, w, d, day: S.day }; objClaim(a.cx, a.by, w, d);
        inv.removeAt(slot, 1); renderHotbar(); this.drawObj(a.cx, a.by); save();
      } });
  }
  return _vUse.call(this, x, y);
};

/* ---------- art: the fv atlas (loaded with the farm), shrunk to world size, plus bag icons */
if (typeof LAZY_KEYS !== 'undefined') LAZY_KEYS.add('fv');
if (typeof SCENE_TEX !== 'undefined') { SCENE_TEX.farm = SCENE_TEX.farm || []; if (!SCENE_TEX.farm.includes('fv')) SCENE_TEX.farm.push('fv'); }
const _fvLoad = hdWorldLoad;
hdWorldLoad = function (loader, snow) {
  _fvLoad(loader, snow);
  if (HDW.fv) loader.atlas('fv', HDW.fv.img, { frames: Object.fromEntries(Object.entries(HDW.fv.frames).map(([k, f]) => [k, { frame: f }])) });
};
const _fvSwap = hdWorldSwap;
hdWorldSwap = function (sc) {
  _fvSwap(sc);
  const t = sc.textures.exists('fv') && sc.textures.get('fv'); if (t && !t._shrunk) { hdShrinkTexture(t, 3); t._shrunk = 1; }
};
const _fvItems = hdItems;
hdItems = async function () {
  await _fvItems();
  const E = HDW.fv; if (!E) return;
  const img = await loadImg(E.img), S2 = 72;
  const icon = (id, r) => {
    const c = document.createElement('canvas'); c.width = c.height = S2; const k = Math.min((S2 - 4) / r.w, (S2 - 4) / r.h, 1.6);
    c.getContext('2d').drawImage(img, r.x, r.y, r.w, r.h, Math.round((S2 - r.w * k) / 2), Math.round(S2 - 2 - r.h * k), Math.round(r.w * k), Math.round(r.h * k)); c._hdk = 3;
    const u = c.toDataURL(); ICONS[id] = u; ICON_CANVAS[id] = c; HD_SMOOTH.add(u);
  };
  for (const tab of Object.values(VILLAGE)) for (const id of Object.keys(tab)) if (E.frames[id]) icon(id, E.frames[id]);
  for (const [k, B] of Object.entries(BRANCH)) if (E.frames[B.frame]) icon('br_' + k, E.frames[B.frame]);
};
