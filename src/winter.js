/* ============================================================ Winter crops and the greenhouse
   Frost Kale, Ember Beet and Snowpea grow in winter. A greenhouse (built through Robin) covers a 3×3 patch of
   soil: anything planted inside grows in any season and never withers when the season turns. */
Object.assign(ITEMS, {
  frostkale_seeds: { name: 'Frost Kale Seeds', stack: 999, seed: 'frostkale', sell: 25, desc: 'Winter. Hardy leaves that shrug off the frost. Ready in 5 days.' },
  emberbeet_seeds: { name: 'Ember Beet Seeds', stack: 999, seed: 'emberbeet', sell: 40, desc: 'Winter. A warm red beet that glows in the cold soil. Ready in 8 days.' },
  snowpea_seeds: { name: 'Snowpea Seeds', stack: 999, seed: 'snowpea', sell: 35, desc: 'Winter. A climbing pea that crops in the snow. Ready in 7 days.' },
  frost_kale: { name: 'Frost Kale', stack: 999, sell: 120, desc: 'Crisp, frosty leaves. Sells for 120g.' },
  ember_beet: { name: 'Ember Beet', stack: 999, sell: 210, desc: 'Warm to the touch, even in the snow. Sells for 210g.' },
  snowpea: { name: 'Snowpeas', stack: 999, sell: 180, desc: 'Sweet, crunchy pods. Sells for 180g.' },
  kale_soup: { name: 'Kale Soup', stack: 99, eat: 90, sell: 320, desc: 'A bright green, warming soup. Restores 90 energy.' },
  roast_beets: { name: 'Roasted Ember Beets', stack: 99, eat: 80, sell: 520, desc: 'Sweet, sticky and still glowing. Restores 80 energy.' },
  snowpea_stirfry: { name: 'Snowpea Stir-fry', stack: 99, eat: 100, sell: 450, desc: 'Quick, crunchy and fresh. Restores 100 energy.' },
  winter_stew: { name: 'Winter Stew', stack: 99, eat: 180, sell: 820, desc: 'Kale, beets and peas in a rich broth. Restores 180 energy.' },
  beet_cider: { name: 'Spiced Beet Cider', stack: 99, eat: 60, sell: 340, desc: 'A hot, spiced winter drink. Restores 60 energy.' },
});
Object.assign(CROPS, { frostkale: cvCrop('frostkale', 5, [3], { item: 'frost_kale' }), emberbeet: cvCrop('emberbeet', 8, [3], { item: 'ember_beet' }), snowpea: cvCrop('snowpea', 7, [3]) });
COOKING.push(
  { out: 'kale_soup', need: { frost_kale: 2 } }, { out: 'roast_beets', need: { ember_beet: 2 } }, { out: 'snowpea_stirfry', need: { snowpea: 2 } },
  { out: 'winter_stew', need: { frost_kale: 1, ember_beet: 1, snowpea: 1, potato: 1 } }, { out: 'beet_cider', need: { ember_beet: 1, honey: 1 } },
);
SHOP.push({ id: 'frostkale_seeds', price: 50 }, { id: 'emberbeet_seeds', price: 80 }, { id: 'snowpea_seeds', price: 70 });
if (ASSET.winterart) for (const [k, v] of Object.entries(ASSET.winterart.crops)) SAP_CANVAS[k] = rgbaCanvas(v);
function applyWinterArt() { for (const A of [ASSET.winterart, ASSET.quarrycrops, ASSET.coastcrops]) if (A) for (const [k, v] of Object.entries(A.icons)) { const c = rgbaCanvas(v); ICONS[k] = c.toDataURL(); ICON_CANVAS[k] = c; } qualityIcons(); if (typeof heldIcons === 'function') heldIcons(); }

/* ---------- greenhouses: each one is the top-left tile of a 3×3 planting patch */
const GH_COST = { gold: 2500, cost: { wood: 120, stone: 60 } };
const greenhouses = () => (S.greenhouses = S.greenhouses || []);
const inGreenhouse = (x, y) => greenhouses().some(g => x >= g.x && x <= g.x + 2 && y >= g.y && y <= g.y + 2);
function drawGreenhouses(sc) {
  if (!ASSET.winterart) return;
  if (!sc.textures.exists('greenhouse')) sc.textures.addCanvas('greenhouse', rgbaCanvas(ASSET.winterart.greenhouse));
  (sc.ghSprites || []).forEach(s => s.destroy()); sc.ghSprites = [];
  for (const g of greenhouses()) sc.ghSprites.push(sc.add.image((g.x + 1.5) * T, (g.y + 3) * T + 2, 'greenhouse').setOrigin(.5, 1).setDepth((g.y + 2) * T + 16));
}
function buildGreenhouse() {
  if (!scene || scene.scene.key !== 'farm') return toast('Go out onto your farm to choose where the greenhouse goes.', 2400);
  closeModal();
  const g0 = greenhouses();
  scene.buildPreview({
    name: 'Greenhouse', desc: 'A 3×3 glass greenhouse.', at: { cx: DOOR.x + 6, by: DOOR.y + 7 },
    areaFor: a => [a.cx - 1, a.by - 2, a.cx + 1, a.by], ghostKey: 'greenhouse', ghostAt: a => [(a.cx + .5) * T, (a.by + 1) * T + 2],
    cost: GH_COST.cost, gold: GH_COST.gold, allowDirt: true,
    ignore: (x, y) => !!S.tilled[x + ',' + y],   // soil (and crops) already there can stay inside
    onBuild: at => {
      const x0 = at.cx - 1, y0 = at.by - 2;
      if (g0.some(g => Math.abs(g.x - x0) < 3 && Math.abs(g.y - y0) < 3)) { S.gold += GH_COST.gold; for (const [k, n] of Object.entries(GH_COST.cost)) inv.add(k, n); updateHUD(); return toast('That overlaps another greenhouse.', 2200); }
      scene.clearDebrisIn(x0, y0, x0 + 2, y0 + 2);
      g0.push({ x: x0, y: y0 }); drawGreenhouses(scene); Sound.play('place');
      toast('Your greenhouse is up! Till the soil inside and plant anything, in any season.', 3200);
    },
  });
}

/* ============================================================ Crop quality
   Harvests can come out Silver (×1.25 price) or Gold (×1.5). Fertilised soil makes good crops much likelier.
   Quality crops still count as the plain crop for recipes, projects and anything else that asks for one. */
const QUAL = {};   // plain crop id -> [silver id, gold id]
for (const c of Object.values(CROPS)) {
  const b = c.item; if (QUAL[b] || !ITEMS[b]) continue;
  QUAL[b] = [b + '_s', b + '_g'];
  [['_s', 'Silver', 1.25, 1], ['_g', 'Gold', 1.5, 2]].forEach(([suf, lab, mul, q]) => {
    const sell = Math.round(ITEMS[b].sell * mul);
    ITEMS[b + suf] = { ...ITEMS[b], name: `${lab} ${ITEMS[b].name}`, sell, qbase: b, q, desc: `${lab}-star quality. Sells for ${sell}g. Counts as ${ITEMS[b].name} in recipes.` };
  });
}
const plainId = id => (ITEMS[id] && ITEMS[id].qbase) || id;
{
  const count0 = Inventory.prototype.count, remove0 = Inventory.prototype.remove;
  Inventory.prototype.count = function (id) { const q = QUAL[id]; return count0.call(this, id) + (q ? count0.call(this, q[0]) + count0.call(this, q[1]) : 0); };
  // plain ones are used up first, then silver, then gold
  Inventory.prototype.remove = function (id, n = 1) {
    const q = QUAL[id]; if (!q) return remove0.call(this, id, n);
    if (this.count(id) < n) return false;
    for (const k of [id, q[0], q[1]]) { const t = Math.min(count0.call(this, k), n); if (t) { remove0.call(this, k, t); n -= t; } }
    return true;
  };
}
// chance of a quality harvest: fertilised soil (any time before harvest) roughly triples it
function rollQuality(tile) { const r = Math.random(), f = tile && tile.fq; return r < (f ? .1 : .03) ? 2 : r < (f ? .4 : .15) ? 1 : 0; }
function qualityIcons() {
  for (const [b, vs] of Object.entries(QUAL)) vs.forEach((v, i) => {
    ICONS[v] = ICONS[b] || ICONS.wood;
    const im = new Image(); im.onload = () => {
      const c = document.createElement('canvas'); c.width = c.height = 24; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(im, 0, 0, 24, 24);
      const col = i ? ['#a8741a', '#f2c14e', '#fff2a8'] : ['#6a7480', '#c8d0d8', '#ffffff'];
      const star = [[3, 0], [2, 1], [3, 1], [4, 1], [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [2, 4], [3, 4], [4, 4], [1, 5], [2, 5], [4, 5], [5, 5]];
      g.fillStyle = '#2a1e1a'; for (const [x, y] of star) g.fillRect(x, 17 + y - 1, 3, 3);
      for (const [x, y] of star) { g.fillStyle = y < 2 ? col[2] : y < 4 ? col[1] : col[0]; g.fillRect(x + 1, 17 + y, 1, 1); }
      ICONS[v] = c.toDataURL(); ICON_CANVAS[v] = c;
    };
    im.src = ICONS[b] || ICONS.wood;
  });
}
