/* ============================================================ The Hearthroot, rethought
   Two strands of life, shown as two bars on the tree:
     · Town life: repairs, hearts, Fablemon caught, goods shipped, tasks, and a gift brought to the tree each day.
       On its own it can grow the tree to stage 3 (In leaf).
     · The Rootweave: root-hearts freed from Verdance sites. Full bloom needs 2, Lantern-lit needs all 4.
   Each day the tree wants something (a glowing bubble over it in the square): a gift it loves gives 3 life,
   any other farm good 1. At Budding it sends a root to plant on your farm, which grows with it and blesses the
   soil around it. At every new stage you choose one of two blessings. A save never drops a stage it has reached.
   S.hearth = { max, gifted, giftLife, gifts, want: { day, id }, sap, bless: { stage: id }, grey } */
const RH_NEED = [0, 0, 0, 2, 4];   // root-hearts needed for each stage
const hearth = () => (S.hearth = S.hearth || { giftLife: 0, gifts: 0, bless: {} });
const rootHearts = () => (S.vd && typeof vdFreedCount === 'function' ? vdFreedCount() : 0);
const rootSites = () => (typeof VD_SITES !== 'undefined' ? Object.keys(VD_SITES).length : 4);
const blessed = id => !!(S && S.hearth && Object.values(S.hearth.bless || {}).includes(id));

/* ---------- life: root-hearts are their own strand now; gifts join town life */
const _rwOldLife = lifeParts;
lifeParts = function () {
  const p = _rwOldLife().filter(r => r[1] !== 'Root-hearts freed');
  if (S.hearth && S.hearth.giftLife) p.push(['🎁', 'Gifts to the tree', S.hearth.giftLife, 1]);
  return p;
};
const stageFor = (life, rh) => { let s = 0; LIFE_AT.forEach((v, i) => { if (life >= v && rh >= RH_NEED[i]) s = i; }); return s; };
hearthStage = function () {
  if (!S || !S.town) return 0;
  const h = hearth();
  if (h.max === undefined) {   // an older save: keep whatever stage the old rules had reached
    const old = _rwOldLife().reduce((a, [, , n, w]) => a + n * w, 0); let s = 0; LIFE_AT.forEach((v, i) => { if (old >= v) s = i; }); h.max = s;
  }
  const s = stageFor(hearthLife(), rootHearts()); if (s > h.max) h.max = s;
  return h.max;
};

/* ---------- blessings: one of two at each stage */
const BLESS = {
  bloom: { name: 'Quickening', icon: '🌱', desc: 'Crops near your Hearthroot root are twice as likely to grow an extra day overnight.' },
  dew: { name: 'Morning Dew', icon: '💧', desc: 'Your Hearthroot root waters all the soil around it every morning.' },
  herd: { name: 'Gentle Hands', icon: '🐑', desc: 'Your farm animals grow to love you 50% faster.' },
  kin: { name: 'Open Doors', icon: '🏡', desc: 'Friendship with the villagers grows 25% faster.' },
  work: { name: 'Busy Roots', icon: '⚒', desc: 'Fablemon on farm jobs work 15% faster.' },
  wild: { name: 'Kindred Call', icon: '🌿', desc: 'Wild Fablemon are 15% more willing to come with you.' },
  gold: { name: 'Golden Harvest', icon: '🪙', desc: 'Everything you ship sells for 5% more.' },
  wake: { name: 'Deep Rest', icon: '☀️', desc: 'You wake each morning with 15% more energy than usual.' },
};
const BLESS_AT = { 1: ['bloom', 'dew'], 2: ['herd', 'kin'], 3: ['work', 'wild'], 4: ['gold', 'wake'] };
const blessPending = () => { const st = hearthStage(), b = hearth().bless || {}; for (let s = 1; s <= st; s++) if (!b[s]) return s; return 0; };
// the effects
if (typeof lvLove === 'function') { const _rwLove = lvLove; lvLove = (a, n) => _rwLove(a, n > 0 && blessed('herd') ? Math.round(n * 1.5) : n); }
const _rwFP = addFP; addFP = function (id, n) { return _rwFP(id, n > 0 && blessed('kin') ? Math.round(n * 1.25) : n); };
const _rwInt = jobInterval; jobInterval = function (m) { return _rwInt(m) * (blessed('work') ? .85 : 1); };
const _rwShip = vdShipBonus; vdShipBonus = function (earned) { return _rwShip(earned) + (blessed('gold') && earned ? Math.round(earned * .05) : 0); };

/* ---------- the daily gift */
const GIFT_WANTS = [
  ['turnip', 'carrot', 'potato', 'berry', 'honey', 'egg', 'milk', 'duck_egg'],
  ['tomato', 'corn', 'berry', 'honey', 'butter', 'goat_milk', 'mayonnaise', 'egg'],
  ['pumpkin', 'corn', 'berry', 'cheese', 'wool', 'jam', 'honey', 'milk'],
  ['berry', 'honey', 'cheese', 'yarn', 'mayonnaise', 'butter', 'goat_cheese', 'egg'],
];
const NOT_GIFTS = new Set(['wood', 'stone', 'fiber', 'hay', 'grain', 'feed', 'premium_feed', 'fertiliser']);
const rwGiftable = id => { const I = ITEMS[id]; return !!I && I.sell > 0 && !I.tool && !I.place && !I.seed && !NOT_GIFTS.has(id) && !/charm/.test(id); };
const isCropItem = id => Object.values(CROPS).some(C => C.item === plainId(id));
function hearthWant() {
  const h = hearth(); if (h.want && h.want.day === S.day) return h.want.id;
  const pool = GIFT_WANTS[seasonIdx(S.day)].filter(id => ITEMS[id] && (isCropItem(id) || id === 'berry' || (S.shippedKinds || {})[id] || inv.count(id)));
  const id = pool.length ? pool[(S.day * 7 + 3) % pool.length] : 'berry';
  h.want = { day: S.day, id }; return id;
}
const giftedToday = () => hearth().gifted === S.day;
function rwGiveGift(id) {
  const h = hearth(); if (giftedToday() || !rwGiftable(id) || !inv.count(id)) return Sound.play('error');
  const loved = plainId(id) === hearthWant(), n = loved ? 3 : 1, st0 = hearthStage();
  inv.remove(id, 1); h.gifted = S.day; h.giftLife = (h.giftLife || 0) + n; h.gifts = (h.gifts || 0) + 1;
  renderHotbar(); Sound.play(loved ? 'levelup' : 'pop'); save();
  if (scene && scene.hearthBubble) { scene.hearthBubble.forEach(o => o.destroy()); scene.hearthBubble = null; }
  if (scene && scene.hearth) { for (let i = 0; i < (loved ? 10 : 4); i++) { const c = scene.add.circle(scene.hearth.x + (Math.random() - .5) * 50, scene.hearth.y - 20 - Math.random() * 40, 1.5, loved ? 0xffe27a : 0xbff0a0).setDepth(9e6 - 5); scene.tweens.add({ targets: c, y: c.y - 18, alpha: 0, duration: 900 + Math.random() * 600, onComplete: () => c.destroy() }); } }
  toast(loved ? `The Hearthroot glows warmly. It loved the ${ITEMS[id].name}! (+3 life)` : `The Hearthroot accepts the ${ITEMS[id].name}. (+1 life)`, 2600);
  if (hearthStage() > st0) setTimeout(() => { toast(`The Hearthroot grows! It is ${HEARTH_NAMES[hearthStage()]} now.`, 3000); if (scene && scene.hearth) scene.hearth.setFrame('hearth' + hearthStage()); }, 2700);
}

/* ---------- the tree's panel */
const rwBar = (pct, c1, c2) => `<div style="height:12px;border:2px solid #5e3b20;border-radius:6px;background:#efe3c8;overflow:hidden;margin:3px 0 6px"><i style="display:block;height:100%;width:${Math.max(0, Math.min(100, pct))}%;background:linear-gradient(${c1},${c2})"></i></div>`;
hearthInfoHTML = function (atTree) {
  const st = hearthStage(), life = hearthLife(), rh = rootHearts(), all = rootSites(), h = hearth();
  const nxt = st + 1 < LIFE_AT.length ? st + 1 : null, topTown = LIFE_AT[LIFE_AT.length - 1];
  const unl = s => RECIPES.filter(r => r.stage === s).map(r => ITEMS[r.out].name);
  let need = '<p>The Hearthroot is fully grown.</p>';
  if (nxt !== null) {
    const parts = []; if (life < LIFE_AT[nxt]) parts.push(`${LIFE_AT[nxt]} town life`); if (rh < RH_NEED[nxt]) parts.push(`${RH_NEED[nxt]} root-hearts freed`);
    need = `<p><b>Next: ${HEARTH_NAMES[nxt]}</b>${parts.length ? ' needs ' + parts.join(' and ') : ' is on its way'}. Unlocks: ${unl(nxt).join(', ')}, and a new blessing.</p>`;
  }
  const want = hearthWant(), have = Object.keys(ITEMS).filter(id => rwGiftable(id) && inv.count(id)).sort((a, b) => (plainId(b) === want) - (plainId(a) === want) || ITEMS[b].sell - ITEMS[a].sell).slice(0, 8);
  const gift = !atTree ? `<p>🎁 Today the tree would love: <img src="${iconFor(want)}" style="width:20px;height:20px;vertical-align:middle"> <b>${ITEMS[want].name}</b>${giftedToday() ? ' (you brought a gift today ✓)' : '. Bring it to the Hearthroot in Smallroot.'}</p>`
    : giftedToday() ? `<p>🎁 You've brought the tree a gift today. Come back tomorrow.</p>`
    : `<p>🎁 <b>Today the Hearthroot would love:</b> <img src="${iconFor(want)}" style="width:22px;height:22px;vertical-align:middle"> <b>${ITEMS[want].name}</b> (+3 life). Any other farm good gives +1. One gift a day.</p>
      ${have.length ? `<div style="display:flex;flex-wrap:wrap;gap:4px">${have.map(id => `<button class="btn ${plainId(id) === want ? 'gold' : ''}" data-a="gift" data-id="${id}" style="padding:4px 8px"><img src="${iconFor(id)}" style="width:20px;height:20px;vertical-align:middle"> ${ITEMS[id].name}</button>`).join('')}</div>` : '<p class="hint">You have nothing to give yet: crops, honey, eggs, milk, fish or cooking all count.</p>'}`;
  const pend = blessPending();
  const bl = pend ? `<div class="proj" style="border-left:4px solid #ffd23a"><b>✨ Choose a blessing (${HEARTH_NAMES[pend]})</b><div style="display:flex;flex-direction:column;gap:4px;margin-top:4px">${BLESS_AT[pend].map(id => `<button class="btn gold" data-a="bless" data-s="${pend}" data-id="${id}" style="text-align:left">${BLESS[id].icon} <b>${BLESS[id].name}</b><br><small>${BLESS[id].desc}</small></button>`).join('')}</div><small>This choice is for good.</small></div>` : '';
  const mine = Object.entries(h.bless || {}).map(([s, id]) => `<div class="shoprow"><span style="font-size:20px;width:28px;text-align:center">${BLESS[id].icon}</span><div class="g"><b>${BLESS[id].name}</b><small>${BLESS[id].desc}</small></div></div>`).join('');
  const sap = atTree && st >= 1 && (!h.sap || (!rootSap() && !inv.count('rootsap'))) ? `<div class="proj" style="border-left:4px solid #8fd06a"><b>🌱 A root for your farm</b><br><small>A young root has pushed up between the stones at the tree's foot, glowing faintly. Plant it on your farm: it grows with the Hearthroot and blesses the soil around it.</small><div><button class="btn gold" data-a="sap">Take the root</button></div></div>` : '';
  const rows = lifeParts().map(([ic, label, n, w]) => `<div class="shoprow"><span style="font-size:20px;width:28px;text-align:center">${ic}</span><div class="g"><b>${label}</b><small>${n} × ${w}</small></div><b>${n * w}</b></div>`).join('');
  return `<p><b>Stage ${st + 1} of 5: ${HEARTH_NAMES[st]}</b></p>
    <small><b>🏡 Town life</b> ${life} / ${topTown}</small>${rwBar(100 * life / topTown, '#8fd06a', '#4e9a3a')}
    <small><b>🌳 The Rootweave</b> ${rh} of ${all} root-hearts freed</small>${rwBar(100 * rh / all, '#ffe27a', '#d8a020')}
    <p class="hint">Town life alone can grow the tree to In leaf. Full bloom needs 2 root-hearts freed from Verdance's sites, and Lantern-lit needs all ${all}.</p>
    ${need}${bl}${sap}${gift}
    ${mine ? `<p style="margin-top:8px"><b>Your blessings</b></p><div class="mlist">${mine}</div>` : ''}
    <details style="margin-top:8px"><summary><b>Where town life comes from</b></summary><div class="mlist">${rows}</div></details>`;
};
function openHearthroot(msg) {
  const render = () => `${msg ? `<p><i>${msg}</i></p>` : ''}${hearthInfoHTML(true)}`;
  openModal('The Hearthroot', render(), (a, d) => {
    const h = hearth();
    if (a === 'gift') rwGiveGift(d.id);
    if (a === 'bless') {
      if (h.bless[d.s] || !BLESS_AT[d.s].includes(d.id)) return;
      h.bless[d.s] = d.id; Sound.play('levelup'); save(); toast(`${BLESS[d.id].icon} The Hearthroot blesses you: ${BLESS[d.id].name}.`, 2800);
    }
    if (a === 'sap') {
      if (h.sap && (rootSap() || inv.count('rootsap'))) return; if (inv.add('rootsap', 1)) return toast('Your backpack is full!', 1600);
      h.sap = 1; Sound.play('levelup'); renderHotbar(); save(); toast('You take the glowing root. Plant it somewhere on your farm.', 2800);
    }
    $('mBody').innerHTML = render();
  });
}

/* ---------- the bubble over the tree */
const _rwTown = Town.prototype.create;
Town.prototype.create = function () {
  _rwTown.call(this);
  if (!this.hearth || giftedToday()) return;
  const id = hearthWant(), cv = ICON_CANVAS[id]; if (!cv) return;
  const key = 'ic_' + id; if (!this.textures.exists(key)) this.textures.addCanvas(key, cv);
  const x = this.hearth.x + 30, y = this.hearth.y - this.hearth.displayHeight * .62;
  const bg = this.add.circle(x, y, 11, 0xfffbe8, .94).setStrokeStyle(1.5, 0xd8a020).setDepth(9e6 - 7);
  const tail = this.add.triangle(x - 5, y + 11, 0, 0, 6, 0, 0, 6, 0xfffbe8, .92).setDepth(9e6 - 7);
  const ic = this.add.image(x, y, key).setDisplaySize(16, 16).setDepth(9e6 - 6);
  this.hearthBubble = [bg, tail, ic];
  this.tweens.add({ targets: this.hearthBubble, y: '-=2', yoyo: true, repeat: -1, duration: 900, ease: 'Sine.inOut' });
};

/* ---------- the root on your farm */
ITEMS.rootsap = { name: 'Hearthroot Root', stack: 1, place: 'obj', obj: 'rootsap', desc: 'A living root from the Hearthroot. Plant it on your farm: it grows with the great tree and blesses the soil around it. Pick it up with your axe to move it.' };
OBJ_ART.rootsap = ['cv', 'hearthsap'];
if (typeof GLOWS !== 'undefined') GLOWS.push('rootsap');
const rootReach = () => 1 + hearthStage();   // 2 at Budding (a 5×5 square) up to 5 at Lantern-lit
function rootSap() { for (const [k, o] of Object.entries(S.objs || {})) if (o.t === 'rootsap') { const [x, y] = k.split(',').map(Number); return { x, y, k }; } return null; }
const _rwDraw = Farm.prototype.drawObj;
Farm.prototype.drawObj = function (x, y) {
  _rwDraw.call(this, x, y);
  const o = S.objs[x + ',' + y]; if (!o || o.t !== 'rootsap') return;
  const img = this.objSprites[x + ',' + y] && this.objSprites[x + ',' + y][0]; if (!img) return;
  img.setScale(.85 + .18 * hearthStage());
  if (hearth().grey === S.day) img.setTint(0x9a9a8e);
};
const _rwUse = Farm.prototype.useObj;
Farm.prototype.useObj = function (x, y) {
  const o = S.objs[x + ',' + y], h = held(), tool = h && ITEMS[h.id].tool;
  if (!o || o.t !== 'rootsap' || tool === 'axe' || tool === 'pickaxe') return _rwUse.call(this, x, y);
  this.face(x, y);
  const r = rootReach();
  openModal('Hearthroot Root', `<p><i>${hearth().grey === S.day ? 'The root is grey and still today. It felt last night\'s shipment to Verdance.' : 'The root hums faintly, warm to the touch.'}</i></p>
    <p>It blesses the soil within ${r} tiles: watered crops there sometimes grow an extra day overnight${blessed('bloom') ? ' (twice as often, with Quickening)' : ''}${blessed('dew') ? ', and Morning Dew waters it all each morning' : ''}. It reaches further as the Hearthroot grows.</p>${hearthInfoHTML(false)}`);
};

/* ---------- each night */
const _rwNightly = nightly;
nightly = function (passedOut) {
  const st0 = hearthStage(), sold0 = S.vd ? (S.vd.sold || 0) : 0, sap = rootSap(), r = rootReach(), boost = [];
  if (sap) for (let y = sap.y - r; y <= sap.y + r; y++) for (let x = sap.x - r; x <= sap.x + r; x++) { const t = S.tilled[x + ',' + y]; if (t && t.crop && !t.crop.dead && t.w && !cropRipe(t.crop)) boost.push(t); }
  const res = _rwNightly(passedOut);
  const sold = S.vd && (S.vd.sold || 0) > sold0; if (sold) hearth().grey = S.day;
  let grew = 0;
  if (sap && !sold) {
    const odds = blessed('bloom') ? .4 : .2;
    for (const t of boost) if (t.crop && !t.crop.dead && !cropRipe(t.crop) && Math.random() < odds) { t.crop.g++; grew++; }
    if (blessed('dew')) for (let y = sap.y - r; y <= sap.y + r; y++) for (let x = sap.x - r; x <= sap.x + r; x++) { const t = S.tilled[x + ',' + y]; if (t) t.w = 1; }
  }
  if (blessed('wake') && !passedOut) S.energy = Math.round(S.maxEnergy * 1.15);
  const bits = [];
  if (grew) bits.push(`The Hearthroot root helped ${grew} crop${grew > 1 ? 's' : ''} along`);
  if (sold && sap) bits.push('The Hearthroot root on your farm has gone grey for the day');
  if (hearthStage() > st0 || (blessPending() && S.day % 3 === 0)) bits.push('✨ The Hearthroot has a blessing for you');
  if (bits.length && S.morning) S.morning += ' · ' + bits.join(' · ');
  return res;
};
