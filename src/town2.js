/* ============================================================ Bringing Smallroot home (16 Nov 2026)
   The user found they reached the sixth Warden having only rebuilt what an early quest needed, and crops had no
   purpose beyond selling. So:
   1. Crops grow in any season. In their own season they're 20% likelier to grow an extra day overnight, and come
      out better quality a bit more often.
   2. Moving in: once a building is rebuilt, its resident needs a few things from your farm (crops, dishes, and later
      animal produce) before they can settle and open up. Buildings already open in older saves count as settled.
   3. Wardens wait: Delphine needs 2 Smallroot buildings settled, Granger 4, Orrin 6, Tamsin 7 (Rowan: all of them).
   4. Marigold's customer orders: three a week. Filling them raises the store's standing, which adds stock.
   5. Eight new dishes made with crops and animal produce.
   6. A feast at the end of every season: bring dishes to the table for friendship and Hearthroot life.
   7. Morwenna Vale visits the Hearthroot once, the morning after the reveal.
   State: S.town.settled, S.store, S.feast, vd().valeMet */

/* ---------- 1. every crop, every season */
for (const C of Object.values(CROPS)) { if (!C.home) C.home = (C.seasons || [0, 1, 2, 3]).slice(); C.seasons = [0, 1, 2, 3]; }
const inSeason = type => !!(CROPS[type] && CROPS[type].home.includes(seasonIdx(S.day)));
const _t2Quality = rollQuality;
rollQuality = function (tile) {
  let q = _t2Quality(tile);
  if (tile && tile.crop && inSeason(tile.crop.type) && q < 2 && Math.random() < .12) q++;
  return q;
};
const SEASON_WORD = ['spring', 'summer', 'autumn', 'winter'];
for (const it of Object.values(ITEMS)) if (it.seed && CROPS[it.seed] && it.desc && !/Grows best/.test(it.desc)) {
  // every crop grows all year now: drop the old season words from the front, and anything about the season ending
  it.desc = it.desc.replace(/^(Spring|Summer|Autumn|Fall|Winter)( and (spring|summer|autumn|fall|winter))?\. /, '')
    .replace(': it never withers when the season changes', '').replace(' until the season ends', '');
  const h = CROPS[it.seed].home; if (h.length < 4) it.desc += ` Grows all year, best in ${h.map(i => SEASON_WORD[i]).join(' and ')}.`;
}

/* ---------- 2. moving in */
const SETTLE = {
  homeA: { who: ['poppy', 'finn'], need: { turnip: 5, carrot: 5, potato: 3 }, ask: "We've got a roof, but the cupboards are bare! Could you spare a welcome basket? Some turnips, carrots and potatoes would see us through.", thanks: "A proper welcome basket! Finn, look! We're home." },
  carpenter: { who: ['robin'], need: { jacket_potato: 3, roast_turnip: 2 }, ask: "Workshop's up, but my crew downs tools at noon and there's not a crumb in the place. Bring us some lunch and I'll open up.", thanks: "Lunch! You're a lifesaver. Right, lads, back to it. The workshop's open!" },
  smith: { who: ['gideon'], need: { veg_soup: 3, potato: 5 }, ask: "Forge is hot, belly's empty. A smith can't swing a hammer on nothing. Soup, and some potatoes for the week.", thanks: "That'll do me. Now, let's get that anvil singing." },
  homeB: { who: ['ivy'], need: { tomato: 3, berry: 5, pumpkin: 1 }, ask: "I make my own paints, you see. Red from tomatoes, purple from Hearthberries, orange from pumpkin skin. I can't paint a thing without them!", thanks: "Oh, these colours! I'm going to paint the whole square." },
  tavern: { who: ['barney'], need: { veg_soup: 3, pumpkin_pie: 2, corn_chowder: 2 }, ask: "Opening night, and an empty kitchen! I'll not open the Acorn with nothing on the menu. Soup, pie and chowder, and we're in business.", thanks: "Now THAT'S a menu! Doors open tonight, and the first round's on me." },
  clinic: { who: ['willa'], need: { honey: 3, berry_crumble: 2, glazed_carrots: 2 }, ask: "Honey's the best thing for a poorly Fablemon. And I'll need something to feed the ones who stay overnight. Can you help me stock up?", thanks: "Lovely. Now I can look after them properly. The clinic's open!" },
  homeC: { who: ['fenwick'], need: { tomato_salad: 2, corn: 5, pumpkin: 2 }, ask: "A sailor never settles without a full larder! Provisions, if you please: corn, pumpkins and a good salad or two.", thanks: "A larder fit for an admiral! I'll tell you about the time I sailed to the edge of the map..." },
  ranch: { who: ['hattie'], need: { carrot: 10, corn: 10, mon_treat: 3 }, ask: "The stalls are built, but I've nothing to feed anyone! Carrots and corn for the stores, and a few Fablemon Treats to win the little ones over.", thanks: "Bless you, love. The ranch is open, and the feed shop with it!" },
  station: { who: ['stanley'], need: { omelette: 2, tomato_salad: 2, butter: 2 }, ask: "The first train in years arrives tomorrow! Tradition says the stationmaster lays on a picnic for the passengers. Omelettes, salads and good farm butter.", thanks: "A picnic to be proud of! All aboard, everyone. The station is open!" },
  hall: { who: ['rowan'], need: { potato_gratin: 3, pumpkin_custard: 2, cheese: 2 }, ask: "The Warden's Hall has always opened with a feast for the whole town. I won't break that tradition. Gratin, custard and cheese, the old way.", thanks: "A feast fit for the old days. The Hall is open, and I'll be waiting for a challenger." },
};
const settled = () => {
  if (!S.town.settled) { S.town.settled = {}; for (const id of Object.keys(S.town.done || {})) if (S.town.done[id]) S.town.settled[id] = 1; }   // older saves: everything open stays open
  return S.town.settled;
};
const isSettled = id => !SETTLE[id] ? !!S.town.done[id] : !!settled()[id];
const settledCount = () => settled() && Object.keys(PROJECTS).filter(id => S.town.done[id] && isSettled(id)).length;
const waitingIn = () => Object.keys(SETTLE).filter(id => S.town.done[id] && !isSettled(id));
const needText = need => Object.entries(need).map(([id, n]) => `<span class="need ${reqCount(id) < n ? 'no' : ''}"><img src="${iconFor(id)}">${Math.min(reqCount(id), n)}/${n}</span>`).join(' ');
const haveAll = need => Object.entries(need).every(([id, n]) => reqCount(id) >= n);
function settleIn(id) {
  const Z = SETTLE[id]; if (!Z || isSettled(id) || !haveAll(Z.need)) return false;
  for (const [it, n] of Object.entries(Z.need)) reqTake(it, n);
  settled()[id] = S.day; for (const v of Z.who) if (VILL[v]) addFP(v, 100);
  renderHotbar(); Sound.play('levelup'); save();
  const v = VILL[Z.who[0]];
  Talk.say([{ who: Z.who[0], name: v.name, img: VPIC[Z.who[0] + '1'], t: Z.thanks }], () => {
    toast(`🏡 ${PROJECTS[id].name} is open! (${settledCount()} buildings settled in Smallroot)`, 3200);
    if (scene && scene.scene.key === 'town') scene.scene.restart();
  });
  return true;
}
// where each needed item comes from, so nobody is stuck wondering how to get cheese
function itemSource(id) {
  const nm = k => (ITEMS[k] || {}).name || k;
  const r = COOKING.find(c => c.out === id); if (r) return 'Cook: ' + Object.entries(r.need).map(([k, n]) => (n > 1 ? n + ' ' : '') + nm(k)).join(', ');
  if (typeof MACH !== 'undefined') for (const M of Object.values(MACH)) for (const [inp, o] of Object.entries(M.ins || {})) if (o[0] === id) { const K = typeof LV_KIND !== 'undefined' && Object.values(LV_KIND).find(K => K.out === inp || K.big === inp); return `${M.name}, from ${nm(inp)}${K ? ` (a ${K.name})` : ''}`; }
  if (typeof LV_KIND !== 'undefined') for (const K of Object.values(LV_KIND)) if (K.out === id || K.big === id) return `From a ${K.name} (${K.home === 'coop' ? 'Coop' : 'Barn'}, Hattie sells them)`;
  if (CROPS[id]) return "Grow it: seeds at Marigold's store";
  if (id === 'honey') return 'A Beehive on your farm';
  if (id === 'berry') return 'Marigold and Willa sell them, or a Shade Fablemon forages them at night';
  return '';
}
const sourceText = need => { const rows = Object.keys(need).filter(id => reqCount(id) < need[id]).map(id => [id, itemSource(id)]).filter(r => r[1]);
  return rows.length ? `<div class="hint" style="text-align:left;margin:4px 0">${rows.map(([id, t]) => `<b>${ITEMS[id].name}</b>: ${t}`).join('<br>')}</div>` : ''; };
function openSettle(id) {
  const Z = SETTLE[id], v = VILL[Z.who[0]];
  const render = () => `<p><b>${v.name}</b>: "${Z.ask}"</p><div style="display:flex;flex-wrap:wrap;gap:4px;margin:6px 0">${needText(Z.need)}</div>
    <div class="row"><button class="btn gold" data-a="give" ${haveAll(Z.need) ? '' : 'disabled'}>Give everything</button></div>${sourceText(Z.need)}<p class="hint">Dishes are cooked at a Cooking Pot or the stove at home. Quality crops count too.</p>`;
  openModal(`Moving in: ${PROJECTS[id].name}`, render(), a => { if (a === 'give') { closeModal(); settleIn(id); } });
}
const _t2Chat = villChat;
villChat = function (id, after, door) {
  const home = VILL[id] && VILL[id].home, Z = home && SETTLE[home];
  if (Z && S.town.done[home] && !isSettled(home) && S.town.met[id]) {
    return Talk.say([{ who: id, name: VILL[id].name, img: VPIC[id + '0'], t: Z.ask }], () => openSettle(home));
  }
  return _t2Chat(id, after, door);
};
const _t2Enter = Town.prototype.enter;
Town.prototype.enter = function (id) {
  if (SETTLE[id] && S.town.done[id] && !isSettled(id)) { Sound.play('door'); return openSettle(id); }
  return _t2Enter.call(this, id);
};

/* ---------- 3. the Wardens want to see Smallroot growing */
const WARDEN_GATE = { Delphine: [2, 'brook', 'delphine'], Granger: [4, 'stone', 'granger'], Orrin: [6, 'spark', 'orrin'], Tamsin: [7, 'gale', 'tamsin'] };
const _t2Battle = Battle.start;
Battle.start = function (m, o) {
  const g = o && o.label === 'Warden' && WARDEN_GATE[o.name];
  if (g && !(S.crests && S.crests[g[1]]) && settledCount() < g[0]) {
    const W0 = (t, f = 0) => ({ who: 'trainer', name: 'Warden ' + o.name, img: trainerPic(g[2], f), t });
    return Talk.say([W0("Hold on. Before I hand over a Crest, there's something every Warden has to ask."),
      W0(`Rowan's rule: a Warden looks after the whole valley, not just their own patch. And word is Smallroot's still half empty. ${settledCount()} building${settledCount() === 1 ? '' : 's'} with folk living in them, last I heard.`, 1),
      W0(`Help settle ${g[0]} in Smallroot, and come back. I'll be right here.`)], () => toast(`Settle ${g[0]} buildings in Smallroot first (${settledCount()}/${g[0]}). The notice board shows who's moving in.`, 3400));
  }
  return _t2Battle.call(this, m, o);
};
for (const [quest, name] of [['brook', 'Delphine'], ['stone', 'Granger'], ['spark', 'Orrin'], ['galecrest', 'Tamsin']]) {
  const [n, crest] = WARDEN_GATE[name], i = QUESTS.findIndex(q => q.id === quest); if (i < 0) continue;
  QUESTS.splice(i, 0, { id: 'settle_' + n, get name() { return `Settle ${n} buildings in Smallroot (${Math.min(n, settledCount())}/${n})`; },
    hint: `Warden ${name} wants to see Smallroot growing first. Fund repairs on the notice board, then bring each new resident what they need to move in.`,
    done: () => settledCount() >= n || !!(S.crests && S.crests[crest]), get reward() { return S.crests && S.crests[crest] && settledCount() < n ? {} : { gold: n * 150 }; } });
  QUEST_PLACE['settle_' + n] = 'town';
}

/* ---------- 5. new dishes (cooked with a pot and 1 wood, like the rest) */
const NEW_DISHES = {
  potato_gratin: { name: 'Potato Gratin', eat: 220, sell: 620, need: { potato: 2, cheese: 1, milk: 1 }, desc: 'Layers of potato baked in cream and cheese.', icon: 'jacket_potato' },
  pumpkin_custard: { name: 'Pumpkin Custard', eat: 200, sell: 560, need: { pumpkin: 1, egg: 2, milk: 1 }, desc: 'Silky, spiced and golden.', icon: 'pumpkin_pie' },
  cream_chowder: { name: 'Creamy Chowder', eat: 210, sell: 600, need: { corn: 2, milk: 1, butter: 1 }, desc: 'Sweetcorn chowder, rich with butter and milk.', icon: 'corn_chowder' },
  omelette: { name: 'Cheese Omelette', eat: 160, sell: 420, need: { egg: 2, cheese: 1, tomato: 1 }, desc: 'Fluffy eggs folded round cheese and tomato.', icon: 'roast_turnip' },
  butter_carrots: { name: 'Butter-Glazed Carrots', eat: 140, sell: 470, need: { carrot: 3, butter: 1 }, desc: 'Sweet carrots glossy with farm butter.', icon: 'glazed_carrots' },
  jam_tart: { name: 'Jam Tart', eat: 150, sell: 450, need: { jam: 1, butter: 1, egg: 1 }, desc: 'Buttery pastry with a Hearthberry jam middle.', icon: 'berry_crumble' },
  farm_breakfast: { name: 'Farmhouse Breakfast', eat: 260, sell: 560, need: { egg: 2, potato: 1, tomato: 1, milk: 1 }, desc: 'Eggs, potatoes, tomatoes and a glass of milk. The best start to a day.', icon: 'hearty_stew' },
  egg_salad: { name: 'Egg Salad', eat: 150, sell: 480, need: { egg: 2, mayonnaise: 1, tomato: 1 }, desc: 'Chopped egg and tomato in homemade mayonnaise.', icon: 'tomato_salad' },
};
for (const [id, D] of Object.entries(NEW_DISHES)) {
  ITEMS[id] = { name: D.name, stack: 99, eat: D.eat, sell: D.sell, desc: `${D.desc} Restores ${D.eat} energy.` };
  COOKING.push({ out: id, need: D.need });
}
const _t2Items = hdItems;
hdItems = async function () { await _t2Items(); for (const [id, D] of Object.entries(NEW_DISHES)) if (!ICONS[id] || ICONS[id] === ICONS.wood) { ICONS[id] = ICONS[D.icon]; ICON_CANVAS[id] = ICON_CANVAS[D.icon]; } };
if (typeof TASTE !== 'undefined') for (const [v, id] of [['barney', 'potato_gratin'], ['willa', 'pumpkin_custard'], ['gideon', 'cream_chowder'], ['hattie', 'omelette'], ['robin', 'farm_breakfast'], ['poppy', 'jam_tart'], ['finn', 'jam_tart'], ['ivy', 'butter_carrots'], ['stanley', 'egg_salad'], ['fenwick', 'farm_breakfast']])
  if (TASTE[v]) (TASTE[v].love = TASTE[v].love || []).push(id);

/* ---------- 4. Marigold's customer orders */
const STORE_LV = [[3, 'Marigold now stocks hay and grain.'], [8, 'Marigold now stocks fertiliser.'], [15, 'Marigold now stocks seeds from all over the valley.']];
const STORE_EXTRA = [[[{ id: 'hay', price: 40 }, { id: 'grain', price: 30 }]], [[{ id: 'fertiliser', price: 120 }]],
  [[...[['watercress_seeds', 40], ['wildrice_seeds', 80], ['cranberry_seeds', 90], ['lotus_seeds', 120], ['cragberry_seeds', 60], ['quarrypepper_seeds', 80], ['flintcorn_seeds', 110], ['geodemelon_seeds', 160], ['samphire_seeds', 50], ['lanterngourd_seeds', 150], ['moorwheat_seeds', 100], ['moorberry_seeds', 140]].map(([id, price]) => ({ id, price }))]]];
const store = () => (S.store = S.store || { orders: [], week: -1, done: 0 });
const storeLv = () => STORE_LV.filter(([n]) => store().done >= n).length;
const CUSTOMERS = ['Mrs Pennywhistle', 'Young Tom', 'The Hendersons', 'Old Mr Ashby', 'Daisy from the mill', 'A hungry traveller', 'The school cook', 'Mr and Mrs Fairweather'];
function storePool() {
  const out = [];
  for (const id of ['turnip', 'carrot', 'potato', 'tomato', 'corn', 'pumpkin', 'berry']) out.push([id, 'crop']);
  for (const id of Object.keys(S.shippedKinds || {})) if (ITEMS[id] && ITEMS[id].sell && !ITEMS[id].tool && !ITEMS[id].place && !ITEMS[id].seed && ITEMS[id].sell <= 700) out.push([id, 'other']);
  for (const r of COOKING) if (ITEMS[r.out] && ITEMS[r.out].eat && Object.keys(r.need).every(n => !['cheese', 'milk', 'butter', 'egg', 'mayonnaise', 'jam'].includes(n) || (S.animals || []).length)) out.push([r.out, 'dish']);
  if (typeof LV_KIND !== 'undefined') for (const a of S.animals || []) if (!a.baby) out.push([LV_KIND[a.kind].out, 'produce']);
  const seen = new Set(); return out.filter(([id]) => ITEMS[id] && !seen.has(id) && seen.add(id));
}
function storeWeek() {
  const st = store(), wk = Math.floor((S.day - 1) / 7); if (st.week === wk) return;
  st.week = wk; st.orders = [];
  const pool = storePool(), who = CUSTOMERS.slice();
  for (let i = 0; i < 3 && pool.length; i++) {
    const items = {}, k = Math.random() < .4 ? 2 : 1;
    for (let j = 0; j < k && pool.length; j++) { const [id, kind] = pool.splice(Math.floor(Math.random() * pool.length), 1)[0]; items[id] = kind === 'crop' ? 3 + Math.floor(Math.random() * 4) : kind === 'dish' ? (Math.random() < .3 ? 2 : 1) : 1 + Math.floor(Math.random() * 3); }
    const value = Object.entries(items).reduce((a, [id, n]) => a + (ITEMS[id].sell || 10) * n, 0);
    st.orders.push({ who: who.splice(Math.floor(Math.random() * who.length), 1)[0], items, gold: Math.round(value * 1.3 / 10) * 10 + 50, done: 0 });
  }
}
function openOrders() {
  storeWeek(); const st = store();
  const lvTxt = () => { const nx = STORE_LV.find(([n]) => st.done < n); return `Store standing: <b>${'★'.repeat(storeLv())}${'☆'.repeat(STORE_LV.length - storeLv())}</b> · ${st.done} order${st.done === 1 ? '' : 's'} filled${nx ? ` · next at ${nx[0]}: ${nx[1].replace('Marigold now stocks', 'stocks')}` : ''}`; };
  const render = () => `<p class="hint">Customers leave their shopping lists with Marigold. New lists every Monday.</p><p>${lvTxt()}</p><div class="mlist">${st.orders.map((o, i) => `<div class="proj"${o.done ? ' style="opacity:.55"' : ''}><b>${o.who}</b> ${o.done ? '✔ Filled' : `<span class="st">${o.gold}g</span>`}<div style="display:flex;flex-wrap:wrap;gap:4px;margin:4px 0">${needText(o.items)}</div>${o.done ? '' : `<button class="btn gold" data-a="fill" data-i="${i}" ${haveAll(o.items) ? '' : 'disabled'}>Fill order</button>`}</div>`).join('') || '<p>No orders this week.</p>'}</div>`;
  openModal('Customer orders', render(), (a, d) => {
    if (a !== 'fill') return; const o = st.orders[+d.i]; if (!o || o.done || !haveAll(o.items)) return;
    const lv0 = storeLv();
    for (const [id, n] of Object.entries(o.items)) reqTake(id, n);
    o.done = 1; st.done++; S.gold += o.gold; if (S.town.met.marigold && VILL.marigold) addFP('marigold', 40);
    updateHUD(); renderHotbar(); Sound.play('coin'); save();
    toast(`${o.who} is delighted! +${o.gold}g`, 2400);
    if (storeLv() > lv0) setTimeout(() => { Sound.play('levelup'); toast(`⭐ Store standing up! ${STORE_LV[storeLv() - 1][1]}`, 3600); }, 1200);
    $('mBody').innerHTML = render();
  });
}
const _t2Shop = openShop;
openShop = function () {
  for (let l = 0; l < storeLv(); l++) for (const e of STORE_EXTRA[l][0]) if (ITEMS[e.id] && !SHOP.some(x => x.id === e.id)) SHOP.push(e);
  _t2Shop();
  storeWeek();
  keepAdded('ordBtn', () => {
    const n = store().orders.filter(o => !o.done).length;
    $('mBody').insertAdjacentHTML('afterbegin', `<button class="btn gold" id="ordBtn" style="width:100%;margin-bottom:8px">📋 Customer orders${n ? ` (${n})` : ''}</button>`);
    $('ordBtn').onclick = () => openOrders();
  });
};

/* ---------- 6. the season's feast */
const feast = () => { const key = Math.floor((S.day - 1) / 28); if (!S.feast || S.feast.key !== key) S.feast = { key, dishes: {}, n: 0 }; return S.feast; };
const isDish = id => COOKING.some(r => r.out === id) && ITEMS[id] && ITEMS[id].eat && id !== 'mon_treat';
function openFeast() {
  const F = feast(), sd = seasonDay(), left = 28 - sd.dom;
  const mine = Object.keys(ITEMS).filter(id => isDish(id) && reqCount(id) > 0);
  const render = () => `<p>At the end of every season, all of Smallroot shares a feast round the Hearthroot. Everyone brings a dish.</p>
    <p><b>The ${sd.season} Feast</b>: ${left ? `in ${left} day${left > 1 ? 's' : ''}` : 'tonight!'} · ${F.n} dish${F.n === 1 ? '' : 'es'} on the table (${Object.keys(F.dishes).length} different)</p>
    <p class="hint">Every dish makes the whole town a little fonder of you. Different dishes count for more. The Hearthroot loves a feast too.</p>
    <div class="mlist">${mine.length ? mine.map(id => `<div class="shoprow"><img src="${iconFor(id)}"><div class="g"><b>${ITEMS[id].name}</b><small>You have ${reqCount(id)}${F.dishes[id] ? ` · ${F.dishes[id]} on the table` : ''}</small></div><button class="btn gold" data-a="bring" data-id="${id}">Bring 1</button></div>`).join('') : '<p class="hint">You have no dishes yet. Cook something at a Cooking Pot!</p>'}</div>`;
  openModal('The season\'s feast', render(), (a, d) => {
    if (a !== 'bring' || !reqCount(d.id)) return;
    reqTake(d.id, 1); F.dishes[d.id] = (F.dishes[d.id] || 0) + 1; F.n++; Sound.play('pop'); renderHotbar(); save();
    $('mBody').innerHTML = render();
  });
}
const _t2Board = openBoard;
openBoard = function () {
  _t2Board();
  keepAdded('feastBtn', () => {
    const w = waitingIn();
    $('mBody').insertAdjacentHTML('afterbegin', `${w.length ? `<div class="proj" id="settleBox" style="border-left:4px solid #e0a040"><b>🏡 Moving in</b>${w.map(id => `<div style="margin-top:4px"><b>${PROJECTS[id].name}</b> <small>(${SETTLE[id].who.map(v => VILL[v].name).join(' and ')})</small><div style="display:flex;flex-wrap:wrap;gap:4px;margin:3px 0">${needText(SETTLE[id].need)}</div><button class="btn sm gold" data-settle="${id}">${haveAll(SETTLE[id].need) ? 'Help them settle in' : 'See what they need'}</button></div>`).join('')}</div>` : ''}
      <button class="btn gold" id="feastBtn" style="width:100%;margin-bottom:8px">🍲 The ${seasonDay().season} Feast (${feast().n} dish${feast().n === 1 ? '' : 'es'})</button>`);
    $('feastBtn').onclick = () => openFeast();
    document.querySelectorAll('[data-settle]').forEach(b => b.onclick = () => openSettle(b.dataset.settle));
  });
};
// growing in season, and the feast itself, happen overnight
const _t2Nightly = nightly;
nightly = function (passedOut) {
  const boost = Object.values(S.tilled || {}).filter(t => t.crop && !t.crop.dead && t.w && inSeason(t.crop.type) && !cropRipe(t.crop));
  const F = S.feast, endOfSeason = seasonDay().dom === 28;
  const r = _t2Nightly(passedOut);
  for (const t of boost) if (t.crop && !t.crop.dead && !cropRipe(t.crop) && Math.random() < .2) t.crop.g++;
  if (endOfSeason && F && F.n) {
    const kinds = Object.keys(F.dishes).length, fp = Math.min(150, F.n * 5 + kinds * 15);
    for (const v of Object.keys(S.town.met || {})) if (VILL[v]) addFP(v, fp);
    const life = Math.min(10, Math.ceil(F.n / 2)); if (S.hearth) S.hearth.giftLife = (S.hearth.giftLife || 0) + life;
    if (S.morning) S.morning += ` · 🍲 Last night's feast was a joy: ${F.n} dish${F.n === 1 ? '' : 'es'}, ${kinds} kind${kinds === 1 ? '' : 's'}. The whole town is fonder of you, and the Hearthroot glows (+${life} life)`;
    S.feast = null;
  } else if (endOfSeason && S.morning && Object.keys(S.town.met || {}).length > 2) S.morning += ' · The feast table stood bare last night. Bring dishes next season!';
  return r;
};

/* ---------- 7. Morwenna Vale at the Hearthroot, the morning after the reveal */
const _t2Town = Town.prototype.create;
Town.prototype.create = function () {
  _t2Town.call(this);
  if (!S.vd || !vdReveal() || vd().valeMet || S.day <= vd().reveal || S.time >= 12 * 60 || !this.hearth || !this.textures.exists('tr_vale')) return;
  const hx = Math.round(this.hearth.x / T) + 3, hy = Math.floor(this.hearth.y / T) + 1;
  const v = this.add.sprite(hx * T + 8, hy * T + 15, 'tr_vale', 0).setOrigin(.5, 1).setDepth(hy * T + 15).setAlpha(0);
  this.shadow && this.shadow(v, 12, 5);
  this.tweens.add({ targets: v, alpha: 1, duration: 800 });
  const ev = this.time.addEvent({ delay: 250, loop: true, callback: () => {
    const p = this.p; if (!p || this.paused || Talk.open || Math.abs(p.x - hx) + Math.abs(p.y - hy) > 3) return;
    ev.remove(); vd().valeMet = S.day;
    v.setFrame(DIRS.indexOf(p.x < hx ? 'left' : p.x > hx ? 'right' : p.y < hy ? 'up' : 'down') * 4);
    const V = (t, f = 0) => ({ who: 'trainer', name: 'Morwenna Vale', img: trainerPic('vale', f), t });
    csMoment(this, async () => {
      await csPan(this, (p.x + hx) / 2 * T + 8, hy * T, 700);
      await csSay([V("So you're the one. Yes... you have her eyes. Your grandmother had that same stubborn look, the day she turned us down. The first time.", 0),
        V("Morwenna Vale. I look after acquisitions for Verdance. Land, mostly. Sometimes people.", 0),
        V("You've cost my company a great deal. I don't mind, really. Everything costs something. I just like to know who's paying.", 1),
        V("Your little tree is looking well. It would be such a shame if anything happened to it.", 1),
        V("Do give my regards to Elder Bramble. He'll remember me.", 0)]);
      this.tweens.add({ targets: v, alpha: 0, duration: 900 });
      await csWait(900); v.destroy();
      await csSay([vdSys("You blink, and she's gone. All that's left is a faint smell of something expensive, and a cold feeling in the pit of your stomach.")]);
    });
  } });
};
const _t2Bramble = brambleLines;
brambleLines = function () {
  if (S.vd && vd().valeMet && !vd().valeTold && S.town.met.bramble) {
    vd().valeTold = S.day;
    const B = (t, f = 1) => ({ who: 'bramble', t, f });
    return [B("Vale? Here? In the square?", 3), B("...I remember her. Twenty years ago she came to your gran's door with a briefcase and that same smile. Your gran sent her packing.", 2),
      B("The next spring, the Hearthroot didn't bud. I always wondered if that was a coincidence.", 2), B("Be careful, {name}. That woman doesn't make threats. She makes promises.", 1)];
  }
  return _t2Bramble();
};
