/* ============================================================ Farm animals
   Hattie sells hens, ducks, goats, sheep and cows; Robin builds a coop and a barn for them (the front-facing
   art from tools/art/cut_livestock.py). Animals live inside, eat hay from the trough (or graze outside on fine days
   when the little door is open), grow up, and make eggs, milk and wool. Machines turn those into butter, cheese,
   mayonnaise, yarn and cloth, and the incubator hatches eggs. Fablemon farm jobs reach the animals too, and
   every Fablemon gets better at its job the more it works.
   State (all optional, so old saves load as they were):
     S.animals = [{ uid, kind, name, love, age, baby, days, ready, fedDay, petted, brushed }]
     S.coop / S.barn = { cx, by, lv, open, trough, floor: [{ x, y, id }] }
   Loaded after pets.js. */
const LV_KIND = {
  hen: { name: 'Hen', baby: 'chick', bname: 'Chick', home: 'coop', price: 1200, grow: 3, every: 1, out: 'egg', about: 'Lays an egg most mornings. A happy hen sometimes lays a golden one.' },
  duck: { name: 'Duck', baby: 'duckling', bname: 'Duckling', home: 'coop', price: 1400, grow: 4, every: 2, out: 'duck_egg', about: 'Lays a duck egg every other day, and drops a feather when she loves you.' },
  goat: { name: 'Goat', baby: 'kid', bname: 'Kid', home: 'barn', price: 1600, grow: 5, every: 2, out: 'goat_milk', tool: 'milk_pail', about: 'Gives goat milk every other day. Bring a milk pail.' },
  sheep: { name: 'Sheep', baby: 'lamb', bname: 'Lamb', home: 'barn', price: 1800, grow: 5, every: 3, out: 'wool', tool: 'shears', about: 'Grows a fleece every three days. Bring shears.' },
  cow: { name: 'Cow', baby: 'calf', bname: 'Calf', home: 'barn', price: 2400, grow: 5, every: 1, out: 'milk', big: 'large_milk', tool: 'milk_pail', about: 'Gives milk every day. A cow who loves you gives large milk.' },
};
const LV_HOUSE = {
  coop: { name: 'Coop', cap: [4, 8], build: { gold: 2000, cost: { wood: 120, stone: 50 } }, up: { gold: 6000, cost: { wood: 150, stone: 80 } }, foot: [-1, 2, 2], off: [9, 19], troughAt: [[1, 4], [1, 5], [1, 6], [1, 7], [1, 8]] },
  barn: { name: 'Barn', cap: [4, 8], build: { gold: 5000, cost: { wood: 250, stone: 120 } }, up: { gold: 10000, cost: { wood: 300, stone: 150 } }, foot: [-3, 4, 3], off: [7, 14], troughAt: [[9, 3], [10, 3], [11, 3], [12, 3]] },
};
const LV_TROUGH = 5;   // feed the trough holds per animal space
const myAnimals = () => (S.animals = S.animals || []);
const lvHouse = k => S[k] || null;
const lvCap = k => S[k] ? LV_HOUSE[k].cap[(S[k].lv || 1) - 1] : 0;
const lvIn = k => myAnimals().filter(a => LV_KIND[a.kind].home === k);
const lvTroughMax = k => lvCap(k) * LV_TROUGH;
const lvHearts = a => Math.floor((a.love || 0) / 200);
const lvLabel = a => a.baby ? LV_KIND[a.kind].bname : LV_KIND[a.kind].name;
const lvSheet = a => 'an_' + (a.baby ? LV_KIND[a.kind].baby : a.kind);
const lvEntry = k => ({ x: S[k].cx, y: S[k].by + 1 });
const lvGrazeNow = () => !isWet(S.weather) && S.weather !== 'snow' && seasonIdx(S.day) !== 3 && S.time >= 360 && S.time < 1080;
const lvIsOut = k => !!(S[k] && S[k].open && lvGrazeNow());
const nowMin = () => S.day * 1440 + S.time;

/* ---------- items */
const LV_ITEMS = {
  hay: { name: 'Hay', stack: 999, sell: 15, desc: 'Dried grass. Animals eat one a day from their trough.' },
  grain: { name: 'Grain', stack: 999, sell: 10, desc: 'Mixed grain. Hens and ducks eat it from the coop trough, like hay.' },
  egg: { name: 'Egg', stack: 999, sell: 50, desc: 'A fresh white egg. Sells for 50g, or make mayonnaise.' },
  brown_egg: { name: 'Brown Egg', stack: 999, sell: 50, desc: 'A fresh brown egg. Sells for 50g, or make mayonnaise.' },
  duck_egg: { name: 'Duck Egg', stack: 999, sell: 95, desc: 'A big pale-blue egg. Sells for 95g.' },
  golden_egg: { name: 'Golden Egg', stack: 999, sell: 400, desc: 'Laid by a very happy hen. Sells for 400g.' },
  feather: { name: 'Duck Feather', stack: 999, sell: 120, desc: 'A soft, shimmering feather from a duck who loves you.' },
  milk: { name: 'Milk', stack: 999, sell: 125, desc: 'Fresh cow\'s milk. Sells for 125g, or churn it into butter or press it into cheese.' },
  large_milk: { name: 'Large Milk', stack: 999, sell: 190, desc: 'A big jug from a cow who loves you. Makes two butters or two cheeses.' },
  goat_milk: { name: 'Goat Milk', stack: 999, sell: 225, desc: 'Rich goat\'s milk. Sells for 225g, or press it into goat cheese.' },
  wool: { name: 'Wool', stack: 999, sell: 340, desc: 'A soft fleece. Spin it into yarn.' },
  butter: { name: 'Butter', stack: 999, sell: 280, desc: 'Golden churned butter. Sells for 280g.' },
  cheese: { name: 'Cheese', stack: 999, sell: 230, desc: 'A wheel of farmhouse cheese. Sells for 230g.' },
  goat_cheese: { name: 'Goat Cheese', stack: 999, sell: 420, desc: 'Tangy and crumbly. Sells for 420g.' },
  mayonnaise: { name: 'Mayonnaise', stack: 999, sell: 190, desc: 'Thick and creamy. Sells for 190g.' },
  jam: { name: 'Hearthberry Jam', stack: 999, sell: 60, desc: 'A jar of sweet Hearthberry jam.' },
  yarn: { name: 'Yarn', stack: 999, sell: 480, desc: 'Spun wool. Weave two into cloth.' },
  cloth: { name: 'Cloth', stack: 999, sell: 1200, desc: 'Woven farm cloth. Sells for 1,200g.' },
  milk_pail: { name: 'Milk Pail', stack: 1, desc: 'Hold it and use it on a cow or goat that has milk.' },
  shears: { name: 'Shears', stack: 1, desc: 'Hold them and use them on a sheep with a full fleece.' },
  brush: { name: 'Animal Brush', stack: 1, desc: 'Hold it and use it on any animal once a day. They love it.' },
};
// the machines, crafted and placed on the farm like a beehive
const MACH = {
  churn: { name: 'Butter Churn', frame: 'm_churn', icon: 'churn', need: { wood: 20, stone: 10 }, verb: 'Churn', ins: { milk: ['butter', 1, 180], large_milk: ['butter', 2, 180] }, desc: 'Turns milk into butter in 3 hours.' },
  cheese_press: { name: 'Cheese Press', frame: 'm_press', icon: 'press', need: { wood: 25, stone: 20 }, verb: 'Press', ins: { milk: ['cheese', 1, 300], large_milk: ['cheese', 2, 300], goat_milk: ['goat_cheese', 1, 300] }, desc: 'Turns milk into cheese in 5 hours.' },
  mayo_machine: { name: 'Mayonnaise Machine', frame: 'm_mayo', icon: 'mayo', need: { wood: 15, stone: 15 }, verb: 'Whisk', ins: { egg: ['mayonnaise', 1, 180], brown_egg: ['mayonnaise', 1, 180], duck_egg: ['mayonnaise', 2, 180], golden_egg: ['mayonnaise', 3, 180] }, desc: 'Turns eggs into mayonnaise in 3 hours.' },
  preserves_jar: { name: 'Preserves Jar', frame: 'm_jar', icon: 'jar', need: { wood: 10, stone: 10, fiber: 10 }, verb: 'Preserve', ins: {}, desc: 'Turns any crop or berries into preserves overnight. Worth twice the crop, plus a bit.' },
  spinning_wheel: { name: 'Spinning Wheel', frame: 'm_spinner', icon: 'spinner', need: { wood: 30, fiber: 20 }, verb: 'Spin', ins: { wool: ['yarn', 1, 240] }, desc: 'Spins wool into yarn in 4 hours.' },
  weaving_loom: { name: 'Weaving Loom', frame: 'm_loom2', icon: 'loom2', need: { wood: 40, fiber: 30 }, verb: 'Weave', ins: { yarn: ['cloth', 1, 1440, 2] }, desc: 'Weaves two yarn into cloth overnight.' },
  incubator: { name: 'Incubator', frame: 'm_incubator', icon: 'incubator', need: { wood: 20, stone: 20, fiber: 10 }, verb: 'Incubate', ins: { egg: ['@hen', 1, 4320], brown_egg: ['@hen', 1, 4320], duck_egg: ['@duck', 1, 5760] }, desc: 'Hatches an egg in a few days. The baby needs room in your coop.' },
};
for (const [id, it] of Object.entries(LV_ITEMS)) if (!ITEMS[id]) ITEMS[id] = it;
for (const [id, M] of Object.entries(MACH)) {
  ITEMS[id] = { name: M.name, stack: 99, place: 'obj', obj: id, desc: M.desc };
  OBJ_ART[id] = ['lv', M.frame];
  RECIPES.push({ out: id, n: 1, need: M.need });
}
CRAFT_TABS.push(['Animals & machines', Object.keys(MACH)]);
// preserves: berries make jam; every other crop makes its own jar
const PRESERVE_OF = { berry: 'jam' };
for (const C of Object.values(CROPS)) {
  const it = C.item, I = ITEMS[it]; if (!I || PRESERVE_OF[it]) continue;
  const id = 'preserved_' + it; ITEMS[id] = { name: 'Preserved ' + I.name, stack: 999, sell: Math.round((I.sell || 0) * 2 + 40), desc: `A jar of ${I.name.toLowerCase()} put up for the winter.` };
  PRESERVE_OF[it] = id;
}
for (const [it, out] of Object.entries(PRESERVE_OF)) MACH.preserves_jar.ins[it] = [out, 1, 1200];
// the decorative furniture shares names with the working machines; tell them apart
for (const [id, nm] of [['f_churn', 'Parlour Churn'], ['f_loom', 'Parlour Loom'], ['f_spinning', 'Parlour Spinning Wheel']]) { if (typeof FURN !== 'undefined' && FURN[id]) FURN[id].name = nm; if (ITEMS[id]) ITEMS[id].name = nm; }
const machIn = (M, id) => M.ins[id] || M.ins[plainId(id)];

/* ---------- art */
const LV_PIC = {};
const LV_SHEETS = ['cow', 'goat', 'sheep', 'hen', 'duck', 'calf', 'chick', 'lamb', 'kid', 'duckling'];
const _lvLoad = hdWorldLoad;
hdWorldLoad = function (loader, snow) {
  _lvLoad(loader, snow);
  for (const n of LV_SHEETS) if (HDW['an_' + n]) loader.spritesheet('an_' + n, HDW['an_' + n].img, { frameWidth: 192, frameHeight: 192 });
  for (const n of ['int_coop', 'int_barn']) if (HDW[n]) loader.image(n, HDW[n].img);
  if (HDW.lv) loader.atlas('lv', HDW.lv.img, { frames: Object.fromEntries(Object.entries(HDW.lv.frames).map(([k, f]) => [k, { frame: f }])) });
};
const _lvSwap = hdWorldSwap;
hdWorldSwap = function (sc) {
  _lvSwap(sc);
  for (const k of [...LV_SHEETS.map(n => 'an_' + n), 'int_coop', 'int_barn', 'lv']) { const t = sc.textures.exists(k) && sc.textures.get(k); if (t && !t._shrunk) { hdShrinkTexture(t, k === 'lv' ? 3 : 6); t._shrunk = 1; } }
};
const _lvItems = hdItems;
hdItems = async function () {
  await _lvItems();
  const E = HDW.lv; if (!E) return;
  const img = await loadImg(E.img), icon = {};
  for (const [id, M] of Object.entries(MACH)) icon['i_' + M.icon] = id;
  for (const [n, r] of Object.entries(E.frames)) {
    if (!n.startsWith('i_')) continue;
    const id = icon[n] || n.slice(2);
    const c = document.createElement('canvas'); c.width = r.w; c.height = r.h; c.getContext('2d').drawImage(img, r.x, r.y, r.w, r.h, 0, 0, r.w, r.h); c._hdk = 3;
    const u = c.toDataURL(); ICONS[id] = u; ICON_CANVAS[id] = c; HD_SMOOTH.add(u);
  }
  // shop pictures: each animal's front-facing frame, trimmed
  for (const k of Object.keys(LV_KIND)) {
    const E2 = HDW['an_' + k]; if (!E2) continue;
    const im = await loadImg(E2.img), c = document.createElement('canvas'); c.width = c.height = 192; const g = c.getContext('2d'); g.drawImage(im, 0, 0, 192, 192, 0, 0, 192, 192);
    const d = g.getImageData(0, 0, 192, 192).data; let x0 = 192, y0 = 192, x1 = 0, y1 = 0;
    for (let y = 0; y < 192; y++) for (let x = 0; x < 192; x++) if (d[(y * 192 + x) * 4 + 3] > 20) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    const sz = Math.max(x1 - x0, y1 - y0) + 8, o = document.createElement('canvas'); o.width = o.height = sz;
    o.getContext('2d').drawImage(c, x0, y0, x1 - x0 + 1, y1 - y0 + 1, Math.round((sz - (x1 - x0)) / 2), sz - (y1 - y0) - 4, x1 - x0 + 1, y1 - y0 + 1);
    LV_PIC[k] = o.toDataURL();
  }
  for (const out of Object.values(PRESERVE_OF)) if (!ICONS[out]) { ICONS[out] = ICONS.jam; ICON_CANVAS[out] = ICON_CANVAS.jam; }
};

/* ---------- loving an animal */
function lvLove(a, n) { a.love = Math.max(0, Math.min(1000, (a.love || 0) + n)); }
function lvHeartsFx(sc, spr, n = 3) {
  for (let i = 0; i < n; i++) {
    const h = sc.add.text(spr.x + (i - 1) * 5, spr.y - spr.displayHeight * .8, '♥', { fontFamily: 'system-ui', fontSize: '9px', color: '#ff6a8a', stroke: '#5a1a2a', strokeThickness: 2 }).setOrigin(.5).setDepth(9e6 - 6).setResolution(4);
    sc.tweens.add({ targets: h, y: h.y - 12 - i * 3, alpha: 0, duration: 900 + i * 150, delay: i * 120, onComplete: () => h.destroy() });
  }
}
const LV_MOOD = { hen: ['clucks softly', 'fluffs up her feathers', 'pecks your boot'], duck: ['quacks happily', 'waggles her tail', 'nibbles your sleeve'], goat: ['bleats at you', 'nibbles your sleeve', 'headbutts your hand gently'],
  sheep: ['baas contentedly', 'leans against your legs', 'closes its eyes'], cow: ['moos happily', 'nuzzles your hand', 'swishes her tail'] };
const lvHeartRow = a => '♥'.repeat(lvHearts(a)) + '♡'.repeat(5 - lvHearts(a));
// use whatever you're holding on an animal (a sprite in `sc`)
function useAnimal(sc, a, spr) {
  const K = LV_KIND[a.kind], h = held(), id = h && h.id;
  if (id === 'milk_pail' || id === 'shears') {
    if (a.baby) return toast(`${a.name} is still a little ${K.bname.toLowerCase()}.`, 1800);
    if (K.tool !== id) return toast(id === 'shears' ? 'Shears are for sheep.' : 'Milk pails are for cows and goats.', 1800);
    if (!a.ready) return toast(`${a.name} has nothing to give yet. ${K.every > 1 ? `Every ${K.every} days.` : 'Come back tomorrow.'}`, 2000);
    if (inv.add(a.ready, 1)) return toast('Your backpack is full!', 1600);
    sc.floatText(`+1 ${ITEMS[a.ready].name}`, spr.x, spr.y - 20); a.ready = null; lvLove(a, 5); Sound.play('pop'); renderHotbar(); return;
  }
  if (id === 'brush') {
    if (a.brushed === S.day) return toast(`${a.name} is already brushed and shining.`, 1600);
    a.brushed = S.day; lvLove(a, 10); lvHeartsFx(sc, spr, 2); Sound.play('pop'); return toast(`You brush ${a.name}. ${lvHeartRow(a)}`, 1800);
  }
  if (a.petted !== S.day) {
    a.petted = S.day; lvLove(a, 15); lvHeartsFx(sc, spr, 3); Sound.play('pop');
    return toast(`${a.name} ${pick(LV_MOOD[a.kind])}. ${lvHeartRow(a)}`, 2000);
  }
  openAnimalCard(a);
}
function openAnimalCard(a) {
  const K = LV_KIND[a.kind];
  const grow = a.baby ? `<p>A ${K.bname.toLowerCase()}. Grows up in about ${Math.max(1, K.grow - (a.age || 0))} more fed day${K.grow - (a.age || 0) > 1 ? 's' : ''}.</p>` : '';
  const today = [a.petted === S.day ? 'petted ✓' : 'not petted yet', a.brushed === S.day ? 'brushed ✓' : null, a.fedDay === S.day - 1 ? 'ate well last night' : 'hungry last night'].filter(Boolean).join(' · ');
  const make = a.baby ? '' : K.tool ? (a.ready ? `<p><b>${ITEMS[a.ready].name} is ready.</b> Use your ${ITEMS[K.tool].name.toLowerCase()} on ${a.name}.</p>` : `<p>${ITEMS[K.out].name} ${K.every > 1 ? `every ${K.every} days` : 'every day'} when fed.</p>`) : `<p>Lays ${ITEMS[K.out].name.toLowerCase()}s ${K.every > 1 ? `every ${K.every} days` : 'most mornings'} when fed. You'll find them on the floor.</p>`;
  openModal(a.name, `<p style="font-size:20px;color:#e0567a;margin:2px 0">${lvHeartRow(a)}</p><p><small>${K.name}${a.baby ? ' (baby)' : ''} · ${today}</small></p>${grow}${make}
    <div class="row" style="display:flex;gap:6px;align-items:center;margin-top:6px"><input id="lvName" maxlength="12" value="${a.name}" style="font-family:inherit;font-size:15px;padding:6px;border:2px solid var(--green);border-radius:6px;flex:1;min-width:0"><button class="btn gold" data-a="rename">Rename</button></div>`, act => {
    if (act !== 'rename') return; const v = ($('lvName').value || '').trim().slice(0, 12); if (!v) return;
    a.name = v; closeModal(); toast(`Renamed to ${v}.`, 1400);
  });
}

// keep extra rows in a modal whose own render() replaces the body after each click
function keepAdded(probeId, add) {
  const title = $('mTitle').textContent, body = $('mBody'); add();
  const ob = new MutationObserver(() => { if ($('mTitle').textContent !== title || !$('modal').classList.contains('show')) return ob.disconnect(); if (!$(probeId)) add(); });
  ob.observe(body, { childList: true });
}

/* ---------- Hattie sells animals, feed and tools */
const _lvRanch = svcRanch;
svcRanch = SERVICE.ranch = function () {
  _lvRanch();
  if (!$('mBody')) return;
  keepAdded('lvShop', () => {
    const b = $('mBody');
    b.querySelectorAll('.hint').forEach(p => { if (/proper farm animals/.test(p.textContent)) p.textContent = '"Farm animals are back at last," Hattie beams. "Hens, ducks, goats, sheep and cows, all looking for a good farm."'; });
    b.insertAdjacentHTML('afterbegin', `<button class="btn gold" id="lvShop" style="width:100%;margin-bottom:8px">🐄 Farm animals, feed & tools</button>`);
    $('lvShop').onclick = () => openAnimalShop();
  });
};
function openAnimalShop() {
  const row = (k) => {
    const K = LV_KIND[k], home = LV_HOUSE[K.home], have = !!S[K.home], full = have && lvIn(K.home).length >= lvCap(K.home);
    const note = !have ? `<small style="color:#b03a2e">Needs a ${home.name.toLowerCase()}. Robin can build one.</small>` : full ? `<small style="color:#b03a2e">Your ${home.name.toLowerCase()} is full.</small>` : '';
    return `<div class="shoprow"><img src="${LV_PIC[k] || ''}" style="width:52px;height:52px;object-fit:contain"><div class="g"><b>${K.name}</b><small>${K.about} Arrives as a little ${K.bname.toLowerCase()}.</small>${note}</div><button class="btn gold" data-a="animal" data-k="${k}" ${!have || full || S.gold < K.price ? 'disabled' : ''}>${K.price.toLocaleString()}g</button></div>`;
  };
  const render = () => `<p>Your coop has ${lvIn('coop').length}/${lvCap('coop')} and your barn ${lvIn('barn').length}/${lvCap('barn')} animals.</p>
    <div class="mlist">${Object.keys(LV_KIND).map(row).join('')}
    <p style="margin-top:8px"><b>Feed</b> <small>(fill the trough inside, or let them graze on fine days)</small></p>${shopRow('hay', 40)}${shopRow('grain', 30)}
    <p style="margin-top:8px"><b>Tools</b></p>${['milk_pail', 'shears', 'brush'].map(id => inv.count(id) ? `<div class="shoprow"><img src="${iconFor(id)}"><div class="g"><b>${ITEMS[id].name}</b><small>${ITEMS[id].desc}</small></div><small style="color:var(--green);font-weight:700">Owned ✓</small></div>` : shopRow(id, { milk_pail: 500, shears: 800, brush: 300 }[id])).join('')}</div>`;
  openModal("Hattie's Animals", render(), (a, d) => {
    if (a === 'buy') { buy(d.id, +d.p, +d.n || 1); $('mBody').innerHTML = render(); return; }
    if (a === 'animal') nameNewAnimal(d.k, () => { $('mBody') && openAnimalShop(); });
  });
}
function nameNewAnimal(kind, done, free) {
  const K = LV_KIND[kind], dflt = pick({ hen: ['Henrietta', 'Pip', 'Nugget', 'Clucky', 'Marigold'], duck: ['Puddle', 'Dabble', 'Waddle', 'Bramble', 'Nell'], goat: ['Billy', 'Juniper', 'Nibbles', 'Tansy', 'Hazel'], sheep: ['Woolly', 'Clover', 'Nutmeg', 'Daisy', 'Barley'], cow: ['Buttercup', 'Daisy', 'Moomin', 'Clementine', 'Bluebell'] }[kind]);
  openModal(`Name your ${K.bname.toLowerCase()}`, `<p>${free ? 'A little ' + K.bname.toLowerCase() + ' has hatched!' : `Hattie hands you a little ${K.bname.toLowerCase()}. "They'll be waiting in your ${LV_HOUSE[K.home].name.toLowerCase()}."`}</p>
    <div class="row" style="display:flex;gap:6px;align-items:center"><input id="lvNew" maxlength="12" value="${dflt}" style="font-family:inherit;font-size:16px;padding:6px;border:2px solid var(--green);border-radius:6px;flex:1;min-width:0"><button class="btn gold" data-a="ok">${free ? 'Welcome!' : `Buy for ${K.price.toLocaleString()}g`}</button></div>`, a => {
    if (a !== 'ok') return;
    if (lvIn(K.home).length >= lvCap(K.home)) { Sound.play('error'); return toast(`Your ${LV_HOUSE[K.home].name.toLowerCase()} is full.`); }
    if (!free) { if (S.gold < K.price) { Sound.play('error'); return toast("You can't afford that yet."); } S.gold -= K.price; updateHUD(); }
    const name = (($('lvNew') || {}).value || dflt).trim().slice(0, 12) || dflt;
    S.lvNext = (S.lvNext || 0) + 1;
    myAnimals().push({ uid: S.lvNext, kind, name, love: 0, age: 0, baby: true, days: 0, born: S.day });
    Sound.play('levelup'); closeModal(); save();
    toast(`${name} the ${K.bname.toLowerCase()} is in your ${LV_HOUSE[K.home].name.toLowerCase()}!${K.tool && !inv.count(K.tool) && !free ? ` You'll need ${ITEMS[K.tool].name.toLowerCase()} when they're grown.` : ''}`, 3200);
    if (scene && (scene.scene.key === K.home)) scene.scene.restart();
    if (scene && scene.scene.key === 'farm') scene.lvSpawnOut && scene.lvSpawnOut();
    if (done) done();
  });
}

/* ---------- Robin builds the coop and barn */
const _lvCarp = svcCarpenter;
svcCarpenter = SERVICE.carpenter = function () {
  _lvCarp();
  if (!$('mBody')) return;
  keepAdded('lvB_coop', () => {
    const b = $('mBody');
    const rows = ['coop', 'barn'].map(k => {
      const H0 = LV_HOUSE[k], h = S[k], c = !h ? H0.build : h.lv < 2 ? H0.up : null;
      if (!c) return `<div class="shoprow" id="lvB_${k}"><img src="${iconFor('wood')}"><div class="g"><b>Big ${H0.name.toLowerCase()}</b><small>Fully upgraded. Room for ${H0.cap[1]} animals.</small></div></div>`;
      const ok = S.gold >= c.gold && Object.entries(c.cost).every(([i, n]) => stock(i) >= n);
      return `<div class="shoprow"><img src="${iconFor('wood')}"><div class="g"><b>${h ? 'Upgrade to a big ' + H0.name.toLowerCase() : 'Build a ' + H0.name.toLowerCase()}</b><small>${h ? `Room for ${H0.cap[1]} animals and a bigger trough.` : `Houses ${k === 'coop' ? 'hens and ducks' : 'goats, sheep and cows'}. Room for ${H0.cap[0]}.`} ${c.gold.toLocaleString()}g, ${c.cost.wood} wood and ${c.cost.stone} stone.</small></div><button class="btn gold" id="lvB_${k}" ${ok ? '' : 'disabled'}>${h ? 'Upgrade' : 'Build'}</button></div>`;
    }).join('');
    const list = b.querySelector('.mlist'); (list || b).insertAdjacentHTML('beforeend', rows);
    for (const k of ['coop', 'barn']) { const el = $('lvB_' + k); if (el && el.tagName === 'BUTTON') el.onclick = () => S[k] ? upgradeLvHouse(k) : buildLvHouse(k); }
  });
};
function upgradeLvHouse(k) {
  const c = LV_HOUSE[k].up;
  if (S.gold < c.gold || Object.entries(c.cost).some(([i, n]) => stock(i) < n)) return Sound.play('error');
  for (const [i, n] of Object.entries(c.cost)) useStock(i, n);
  S.gold -= c.gold; S[k].lv = 2; updateHUD(); renderHotbar(); Sound.play('levelup'); closeModal(); save();
  toast(`Robin upgrades your ${LV_HOUSE[k].name.toLowerCase()}. Room for ${lvCap(k)} animals now!`, 3000);
  if (scene && scene.scene.key === 'farm') scene.lvDraw();
}
const lvFoot = (k, cx, by) => { const [a, b, r] = LV_HOUSE[k].foot; return [cx + a, by - r, cx + b, by]; };
function buildLvHouse(k) {
  if (!scene || scene.scene.key !== 'farm') return toast(`Go out onto your farm to choose where the ${LV_HOUSE[k].name.toLowerCase()} goes.`, 2400);
  closeModal();
  const H0 = LV_HOUSE[k]; let cur = null;
  scene.buildPreview({
    name: H0.name, desc: `A ${H0.name.toLowerCase()} for your animals.`, at: { cx: DOOR.x + (k === 'coop' ? 9 : -10), by: DOOR.y + 5 },
    areaFor: a => { cur = a; const [x0, y0, x1, y1] = lvFoot(k, a.cx, a.by); return [x0, y0, x1, y1 + 1]; },
    ghostKey: 'lv', ghostFrame: 'b_' + k, ghostAt: a => [a.cx * T + H0.off[0], (a.by + 1) * T],
    cost: H0.build.cost, gold: H0.build.gold,
    ignore: (x, y) => cur && y === cur.by + 1 && !!S.paths[x + ',' + y],   // a path up to the door is fine
    onBuild: at => {
      S[k] = { cx: at.cx, by: at.by, lv: 1, open: false, trough: 0, floor: [] };
      scene.lvDraw(); Sound.play('place'); save();
      toast(`Your ${H0.name.toLowerCase()} is up! Hattie at the ranch sells ${k === 'coop' ? 'hens and ducks' : 'goats, sheep and cows'}.`, 3400);
    },
  });
}

/* ---------- on the farm: the buildings, and animals out grazing */
const _lvRanchSetup = Farm.prototype.setupRanch;
Farm.prototype.setupRanch = function () { _lvRanchSetup.call(this); this.lvImgs = {}; this.lvDraw(); };
Farm.prototype.lvDraw = function () {
  for (const k of ['coop', 'barn']) {
    const h = S[k]; if (!h) continue;
    const [x0, y0, x1, y1] = lvFoot(k, h.cx, h.by); this.clearDebrisIn(x0, y0, x1, y1 + 1);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) farm.blocked[y * W + x] = 1;
    if (this.lvImgs[k]) { this.lvImgs[k].destroy(); this.tall = this.tall.filter(t => t !== this.lvImgs[k]); }
    if (!this.textures.exists('lv')) continue;
    const lv = (h.lv || 1) - 1, img = this.add.image(h.cx * T + LV_HOUSE[k].off[lv], (h.by + 1) * T, 'lv', 'b_' + k + (lv ? '2' : '')).setOrigin(.5, 1).setDepth(h.by * T + 15);
    this.lvImgs[k] = img; this.tall.push(img);
  }
};
const lvDoorAt = (x, y) => ['coop', 'barn'].find(k => S[k] && S[k].cx === x && S[k].by === y) || null;
function enterLvHouse(sc, k) {
  if (sc.sleeping) return;
  sc.sleeping = true; Sound.play('door'); $('fade').style.opacity = 1;
  setTimeout(() => { S.spawn = { scene: k, x: 7, y: 8, dir: 'up' }; sc.scene.start(k); }, 320);
}
function lvHouseMenu(sc, k) {
  const h = S[k], H0 = LV_HOUSE[k], n = lvIn(k).length;
  openModal(`Your ${H0.name.toLowerCase()}`, `<p>${n}/${lvCap(k)} animals · trough ${h.trough || 0}/${lvTroughMax(k)}</p>
    <p><small>${h.open ? 'The little door is open: on fine days (not in winter) your animals graze outside from 6am to 6pm, and grazing feeds them for free.' : 'The little door is shut, so your animals stay in and eat from the trough.'}</small></p>
    <div class="row" style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn gold" data-a="in">Go inside</button><button class="btn" data-a="door">${h.open ? 'Close the little door' : 'Open the little door'}</button></div>`, a => {
    closeModal();
    if (a === 'in') enterLvHouse(sc, k);
    if (a === 'door') { h.open = !h.open; Sound.play('door'); toast(h.open ? (lvGrazeNow() ? 'Out they come!' : 'Door open. They\'ll come out on the next fine day.') : 'Door shut. They\'ll stay in.', 2000); sc.lvSpawnOut(); }
  });
}
const _lvTarget = Farm.prototype.targetAt;
Farm.prototype.targetAt = function (wx, wy) {
  for (const o of this.lvOut || []) if (o.spr.active && o.spr.getBounds().contains(wx, wy)) return { type: 'animal', o, x: o.x, y: o.y };
  for (const k of ['coop', 'barn']) { const im = this.lvImgs && this.lvImgs[k]; if (im && im.getBounds().contains(wx, wy) && Math.floor(wy / T) <= S[k].by) return { type: 'lvb', k, x: S[k].cx, y: S[k].by }; }
  return _lvTarget.call(this, wx, wy);
};
const _lvAct = Farm.prototype.act;
Farm.prototype.act = function (t) {
  if (t.type === 'animal') { if (this.p.busy > 0) { this.p.queued = t; return; } this.face(t.o.x, t.o.y); this.p.busy = .3; t.o.until = this.time.now + 2500; return useAnimal(this, t.o.a, t.o.spr); }
  if (t.type === 'lvb') { if (this.p.busy > 0) { this.p.queued = t; return; } this.face(t.x, t.y); this.p.busy = .3; return lvHouseMenu(this, t.k); }
  return _lvAct.call(this, t);
};
const _lvFacing = Farm.prototype.actFacing;
Farm.prototype.actFacing = function () {
  const p = this.p; if (p.moving || this.paused) return _lvFacing.call(this);
  const [dx, dy] = DV[p.dir], x = p.x + dx, y = p.y + dy;
  const o = (this.lvOut || []).find(q => q.x === x && q.y === y); if (o) return this.act({ type: 'animal', o, x, y });
  const k = lvDoorAt(x, y); if (k) return this.act({ type: 'lvb', k, x, y });
  return _lvFacing.call(this);
};
const _lvBump = Farm.prototype.bump;
Farm.prototype.bump = function (x, y) {
  const k = lvDoorAt(x, y); if (k && this.p.dir === 'up' && !(this.p.busy > 0)) return enterLvHouse(this, k);
  return _lvBump.call(this, x, y);
};
// a step onto the door from the doorstep also counts as going in (the tile itself is solid)
Farm.prototype.lvSpawnOut = function () {
  (this.lvOut || []).forEach(o => o.spr.destroy()); this.lvOut = [];
  for (const k of ['coop', 'barn']) {
    if (!lvIsOut(k)) continue;
    const e = lvEntry(k), free = [];
    for (let y = e.y - 1; y <= e.y + 5; y++) for (let x = e.x - 6; x <= e.x + 6; x++) if (this.lvFree(x, y, e) && !(x === e.x && y === e.y)) free.push({ x, y });
    for (const a of lvIn(k)) {
      if (!free.length || !this.textures.exists(lvSheet(a))) continue;
      const at = free.splice(Math.floor(Math.random() * free.length), 1)[0];
      const spr = this.add.sprite(at.x * T + 8, at.y * T + 16, lvSheet(a), 0).setOrigin(.5, 1).setDepth(at.y * T + 15);
      this.lvOut.push({ a, k, x: at.x, y: at.y, spr, dir: 0, moving: false, until: this.time.now + Math.random() * 3000 });
    }
  }
};
Farm.prototype.lvFree = function (x, y, e) {
  if (Math.abs(x - e.x) > 6 || y < e.y - 1 || y > e.y + 6) return false;
  return this.passable(x, y) && !S.tilled[x + ',' + y] && !(this.p && this.p.x === x && this.p.y === y) && !(this.lvOut || []).some(o => o.x === x && o.y === y);
};
function lvWander(sc, list, free, speed = 420) {
  const now = sc.time.now;
  for (const o of list) {
    if (o.moving) { o.spr.setFrame(o.dir * 4 + (Math.floor(now / 160) % 4)); continue; }
    if (now < o.until) continue;
    const steps = [[0, 1, 0], [-1, 0, 1], [1, 0, 2], [0, -1, 3]].filter(([dx, dy]) => free(o.x + dx, o.y + dy, o));
    if (!steps.length || Math.random() < .4) { o.until = now + 1500 + Math.random() * 3500; o.spr.setFrame(o.dir * 4); continue; }
    const [dx, dy, d] = pick(steps), n = 1 + Math.floor(Math.random() * 2);
    let tx = o.x, ty = o.y; for (let i = 0; i < n && free(tx + dx, ty + dy, o); i++) { tx += dx; ty += dy; }
    o.dir = d; o.moving = true; const dist = Math.abs(tx - o.x) + Math.abs(ty - o.y); o.x = tx; o.y = ty;
    sc.tweens.add({ targets: o.spr, x: tx * T + 8, y: ty * T + 16, duration: dist * speed, onUpdate: () => o.spr.setDepth(o.spr.y - 1),
      onComplete: () => { o.moving = false; o.spr.setFrame(o.dir * 4); o.until = sc.time.now + 1200 + Math.random() * 3000; } });
  }
}
const _lvCreate = Farm.prototype.create;
Farm.prototype.create = function () {
  _lvCreate.call(this);
  this.lvSpawnOut(); this.lvWasOut = { coop: lvIsOut('coop'), barn: lvIsOut('barn') }; this.lvMachR = {};
  this.time.addEvent({ delay: 140, loop: true, callback: () => { if (this.lvOut && this.lvOut.length) lvWander(this, this.lvOut, (x, y, o) => { const e = lvEntry(o.k); return this.lvFree(x, y, e); }); } });
  this.time.addEvent({ delay: 1000, loop: true, callback: () => {
    // animals head in at 6pm (or when the rain starts) and come out in the morning
    const now = { coop: lvIsOut('coop'), barn: lvIsOut('barn') };
    if (now.coop !== this.lvWasOut.coop || now.barn !== this.lvWasOut.barn) { this.lvWasOut = now; this.lvSpawnOut(); }
    // machines that just finished get their sparkle
    for (const [k, o] of Object.entries(S.objs)) if (MACH[o.t]) { const r = !!machReady(o); if (this.lvMachR[k] !== r) { const first = this.lvMachR[k] === undefined; this.lvMachR[k] = r; if (!first) { const [x, y] = k.split(',').map(Number); this.drawObj(x, y); } } }
  } });
};

/* ---------- inside the coop and barn */
class AnimalHouse extends World {
  constructor(key) { super(key); this.kind = key; }
  create() {
    const k = this.kind, h = S[k];
    this.initWorld(15, 10);
    if (!h) { S.spawn = { scene: 'farm', x: DOOR.x, y: DOOR.y + 1, dir: 'down' }; return this.scene.start('farm'); }
    this.add.rectangle(-200, -200, 15 * T + 400, 10 * T + 400, 0x120d0a).setOrigin(0).setDepth(-10);
    if (this.textures.exists('int_' + k)) this.add.image(0, 0, 'int_' + k).setOrigin(0).setDepth(-5);
    const sp = S.spawn && S.spawn.scene === k ? S.spawn : { x: 7, y: 8, dir: 'up' };
    this.makePlayer(sp);
    // the animals, unless they're out grazing
    this.beasts = []; this.eggs = [];
    const out = lvIsOut(k), free = [];
    for (let y = 4; y <= 8; y++) for (let x = 1; x <= 13; x++) if (this.passable(x, y) && !(x === sp.x && y === sp.y) && !(x === 7 && y >= 7)) free.push({ x, y });
    for (const a of lvIn(k)) {
      if (out || !free.length || !this.textures.exists(lvSheet(a))) continue;
      const at = free.splice(Math.floor(Math.random() * free.length), 1)[0];
      const spr = this.add.sprite(at.x * T + 8, at.y * T + 16, lvSheet(a), 0).setOrigin(.5, 1).setDepth(at.y * T + 15);
      this.beasts.push({ a, k, x: at.x, y: at.y, spr, dir: 0, moving: false, until: this.time.now + Math.random() * 2500 });
    }
    this.drawEggs();
    this.time.addEvent({ delay: 140, loop: true, callback: () => lvWander(this, this.beasts, (x, y) => this.free(x, y)) });
    const cam = this.cameras.main; this.applyZoom(); this.frameHook(); cam.setRoundPixels(true);
    this.scale.on('resize', this.onResize, this); this.events.once('shutdown', () => this.scale.off('resize', this.onResize, this));
    this.setupInput();
    Sound.theme('field');
    updateHUD(); renderHotbar(); FX.set(S.weather, true); this.fadeIn();
    setTimeout(() => {
      if (out && lvIn(k).length) toast('Your animals are out grazing. They come back in at 6pm.', 2600);
      else if (!lvIn(k).length) toast(`Your ${LV_HOUSE[k].name.toLowerCase()} is empty. Hattie at the ranch sells ${k === 'coop' ? 'hens and ducks' : 'goats, sheep and cows'}.`, 3000);
      else if (!h.trough && !h.open) toast('The trough is empty. Tap it to put in hay.', 2400);
    }, 450);
  }
  onResize() { this.applyZoom(); this.frameHook(); renderHotbar(); }
  frameHook() {
    const cam = this.cameras.main, vw = cam.width / cam.zoom, vh = cam.height / cam.zoom, rw = 15 * T, rh = 10 * T, px = this.player.x, py = this.player.y - 8;
    const cx = rw <= vw ? rw / 2 : Math.max(vw / 2, Math.min(rw - vw / 2, px)), cy = rh <= vh ? rh / 2 : Math.max(vh / 2, Math.min(rh - vh / 2, py));
    cam.centerOn(Math.round(cx), Math.round(cy));
  }
  walkable(x, y) {
    if (x === 7 && y === 9) return true;
    if (y < 4 || y > 8 || x < 1 || x > 13) return false;
    if (this.kind === 'coop') { if (x === 1) return false; if ((x === 12 || x === 13) && y >= 7) return false; }
    return true;
  }
  passable(x, y) { return this.walkable(x, y); }
  free(x, y) { return this.walkable(x, y) && y <= 8 && !(this.p && this.p.x === x && this.p.y === y) && !this.beasts.some(o => o.x === x && o.y === y); }
  drawEggs() {
    (this.eggSprites || []).forEach(s => s.destroy()); this.eggSprites = [];
    for (const e of S[this.kind].floor || []) if (this.textures.exists('lv')) this.eggSprites.push(this.add.image(e.x * T + 8, e.y * T + 13, 'lv', 'i_' + e.id).setScale(.42).setOrigin(.5, 1).setDepth(e.y * T + 2));
  }
  troughTile(x, y) { return LV_HOUSE[this.kind].troughAt.some(([a, b]) => a === x && b === y); }
  thing(x, y) {
    if (x === 7 && y === 9) return { type: 'door' };
    if (this.troughTile(x, y)) return { type: 'trough' };
    const o = this.beasts.find(q => q.x === x && q.y === y); if (o) return { type: 'beast', o };
    const e = (S[this.kind].floor || []).find(q => q.x === x && q.y === y); if (e) return { type: 'egg', e };
    if (this.kind === 'coop' && (x === 12 || x === 13) && y >= 7) return { type: 'water' };
    return null;
  }
  onTap(wx, wy) {
    if (this.paused || this.sleeping || controlMode() !== 'tap') return;
    const x = Math.floor(wx / T), y = Math.floor(wy / T), p = this.p;
    const o = this.beasts.find(q => Math.abs(q.spr.x - wx) < 11 && wy > q.spr.y - q.spr.displayHeight * .8 && wy < q.spr.y + 2);
    const t = o ? { type: 'beast', o } : this.thing(x, y);
    if (!t || t.type === 'door') { if (this.walkable(x, y)) { const path = this.path((a, b) => a === x && b === y); if (path) { p.path = path; p.pending = null; } } return; }
    const tx = o ? o.x : x, ty = o ? o.y : y;
    const adj = (a, b) => t.type === 'egg' ? (a === tx && b === ty) || Math.abs(a - tx) + Math.abs(b - ty) === 1 : Math.abs(a - tx) + Math.abs(b - ty) === 1;
    if (adj(p.x, p.y)) { this.face(tx, ty); return this.act({ ...t, tx, ty }); }
    const path = this.path(adj); if (path) { p.path = path; p.pending = { ...t, tx, ty }; } else toast("Can't reach that.");
  }
  tapGoal() { }
  act(t) {
    if (t.tx !== undefined && !(t.tx === this.p.x && t.ty === this.p.y)) this.face(t.tx, t.ty);
    if (t.type === 'beast') { if (t.o.moving) return; t.o.until = this.time.now + 2500; return useAnimal(this, t.o.a, t.o.spr); }
    if (t.type === 'trough') return this.openTrough();
    if (t.type === 'egg') return this.pickEgg(t.e);
    if (t.type === 'water') return toast('Fresh water. The animals keep it topped up themselves, somehow.', 1800);
  }
  actFacing() {
    const p = this.p; if (p.moving || this.paused) return;
    const [dx, dy] = DV[p.dir], x = p.x + dx, y = p.y + dy;
    const here = (S[this.kind].floor || []).find(q => q.x === p.x && q.y === p.y); if (here) return this.pickEgg(here);
    const t = this.thing(x, y); if (t && t.type !== 'door') this.act(t);
  }
  pickEgg(e) {
    if (inv.add(e.id, 1)) return toast('Your backpack is full!', 1600);
    const h = S[this.kind]; h.floor = h.floor.filter(q => q !== e);
    this.floatText(`+1 ${ITEMS[e.id].name}`, e.x * T + 8, e.y * T); Sound.play('pop'); renderHotbar(); this.drawEggs();
  }
  openTrough() {
    const k = this.kind, h = S[k], max = lvTroughMax(k), feeds = k === 'coop' ? ['hay', 'grain'] : ['hay'];
    const render = () => `<p>Trough: <b>${h.trough || 0}/${max}</b>. Each animal eats one a night${h.open ? ', unless it grazed outside that day' : ''}.</p>
      <div class="mlist">${feeds.map(id => `<div class="shoprow"><img src="${iconFor(id)}"><div class="g"><b>${ITEMS[id].name}</b><small>You have ${stock(id)}${stockNote(id)}.</small></div><button class="btn gold" data-a="fill" data-id="${id}" ${stock(id) && (h.trough || 0) < max ? '' : 'disabled'}>Fill</button></div>`).join('')}</div>
      ${feeds.every(id => !stock(id)) ? '<p class="hint">Hattie at the ranch sells hay' + (k === 'coop' ? ' and grain' : '') + '.</p>' : ''}`;
    openModal(k === 'coop' ? 'Feed trough' : 'Hay trough', render(), (a, d) => {
      if (a !== 'fill') return;
      const n = Math.min(stock(d.id), max - (h.trough || 0)); if (n <= 0) return;
      useStock(d.id, n); h.trough = (h.trough || 0) + n; renderHotbar(); Sound.play('plant');
      $('mBody').innerHTML = render();
    });
  }
  arriveHook(x, y) {
    if (x === 7 && y === 9) {
      this.sleeping = true; Sound.play('door'); $('fade').style.opacity = 1;
      const e = lvEntry(this.kind);
      setTimeout(() => { S.spawn = { scene: 'farm', x: e.x, y: e.y, dir: 'down' }; this.scene.start('farm'); }, 320);
    }
  }
}
class CoopScene extends AnimalHouse { constructor() { super('coop'); } }
CoopScene.KEY = 'coop';
class BarnScene extends AnimalHouse { constructor() { super('barn'); } }
BarnScene.KEY = 'barn';
var EXTRA_SCENES = (typeof EXTRA_SCENES !== 'undefined' ? EXTRA_SCENES : []).concat([CoopScene, BarnScene]);

/* ---------- machines */
function machReady(o) { return MACH[o.t] && o.out && nowMin() >= o.done; }
const _lvReady = objReady;
objReady = o => _lvReady(o) || !!machReady(o);
const machLeft = o => { const m = Math.max(0, o.done - nowMin()); return m >= 1440 ? `${Math.ceil(m / 1440)} day${m >= 2880 ? 's' : ''}` : m >= 60 ? `${Math.round(m / 60)} hour${m >= 90 ? 's' : ''}` : 'a few minutes'; };
const machOutName = o => o.out.id[0] === '@' ? `a ${LV_KIND[o.out.id.slice(1)].bname.toLowerCase()}` : `${o.out.n > 1 ? o.out.n + ' ' : ''}${ITEMS[o.out.id].name}`;
// a hatched egg: name the baby, if the coop has room
function hatch(o, sc, x, y) {
  const kind = o.out.id.slice(1);
  if (!S.coop || lvIn('coop').length >= lvCap('coop')) return toast(`The egg is ready to hatch, but your coop is full${S.coop ? '' : ' (you need a coop)'}.`, 2400);
  nameNewAnimal(kind, () => { o.out = null; o.boost = 0; sc.drawObj(x, y); }, true);
}
const _lvUseObj = Farm.prototype.useObj;
Farm.prototype.useObj = function (x, y) {
  let k = x + ',' + y; if (S.objs[k] && S.objs[k].part) { k = S.objs[k].part; [x, y] = k.split(',').map(Number); }
  const o = S.objs[k]; if (!o || !MACH[o.t]) return _lvUseObj.call(this, x, y);
  this.face(x, y);
  const M = MACH[o.t], h = held(), tool = h && ITEMS[h.id].tool;
  if (tool === 'axe' || tool === 'pickaxe') {
    if (o.out && !machReady(o)) { Sound.play('error'); return toast(`It's busy. ${machOutName(o)} in about ${machLeft(o)}.`, 2000); }
    if (o.out) return toast('Take out what it made first.', 1600);
    return _lvUseObj.call(this, x, y);
  }
  if (o.out && machReady(o)) {
    if (o.out.id[0] === '@') return hatch(o, this, x, y);
    const left = inv.add(o.out.id, o.out.n); if (left === o.out.n) return toast('Your backpack is full!');
    this.floatText(`+${o.out.n - left} ${ITEMS[o.out.id].name}`, x * T + 8, y * T - 6); Sound.play('pop');
    if (left) o.out.n = left; else { o.out = null; o.boost = 0; }
    renderHotbar(); this.drawObj(x, y); return;
  }
  if (o.out) return toast(`${M.name}: ${machOutName(o)} in about ${machLeft(o)}.`, 2000);
  const start = id => {
    const r = machIn(M, id), need = r[3] || 1;
    if (inv.count(id) < need) { Sound.play('error'); return toast(`That needs ${need} ${ITEMS[id].name}.`, 1800); }
    inv.remove(id, need); o.out = { id: r[0], n: r[1] }; o.done = nowMin() + r[2]; o.boost = 0;
    Sound.play('plant'); renderHotbar(); this.drawObj(x, y); this.lvMachR[k] = false;
    toast(`${M.verb}: ${machOutName(o)} ready in about ${machLeft(o)}.`, 2000);
  };
  if (h && machIn(M, h.id)) return start(h.id);
  // otherwise, choose from what's in your backpack
  const have = Object.keys(M.ins).flatMap(id => [id, ...(QUAL[id] || [])]).filter(id => inv.count(id) >= ((machIn(M, id) || [])[3] || 1));
  const takes = [...new Set(Object.keys(M.ins).map(id => ITEMS[id] ? ITEMS[id].name : id))];
  openModal(M.name, `<p>${M.desc}</p>${have.length ? `<div class="mlist">${have.map(id => { const r = machIn(M, id); return `<div class="shoprow"><img src="${iconFor(id)}"><div class="g"><b>${ITEMS[id].name}${(r[3] || 1) > 1 ? ' ×' + r[3] : ''}</b><small>→ ${r[0][0] === '@' ? 'a ' + LV_KIND[r[0].slice(1)].bname.toLowerCase() : (r[1] > 1 ? r[1] + ' ' : '') + ITEMS[r[0]].name}. You have ${inv.count(id)}.</small></div><button class="btn gold" data-a="go" data-id="${id}">${M.verb}</button></div>`; }).join('')}</div>` : `<p class="hint">It takes: ${takes.slice(0, 8).join(', ')}${takes.length > 8 ? ' and other crops' : ''}. You don't have any yet.</p>`}`, (a, d) => { if (a === 'go') { closeModal(); start(d.id); } });
};

/* ---------- each night: feeding, love, growing up and making things */
const _lvNightly = nightly;
nightly = function (passedOut) {
  const wx0 = S.weather, day0 = S.day, wasWinter = seasonIdx(day0) === 3;
  const r = _lvNightly(passedOut);
  const grazed = k => S[k] && S[k].open && !isWet(wx0) && wx0 !== 'snow' && !wasWinter;
  let hungry = 0, made = 0, grown = [];
  for (const k of ['coop', 'barn']) {
    const h = S[k]; if (!h) continue; h.floor = h.floor || [];
    const free = []; for (let y = 4; y <= 8; y++) for (let x = 2; x <= 13; x++) if (!(k === 'coop' && (x === 12 || x === 13) && y >= 7) && !(x === 7 && y >= 7) && !h.floor.some(e => e.x === x && e.y === y)) free.push({ x, y });
    for (const a of lvIn(k)) {
      const K = LV_KIND[a.kind];
      let fed = grazed(k); if (fed) lvLove(a, 8);
      else if ((h.trough || 0) > 0) { h.trough--; fed = true; }
      if (fed) { a.fedDay = day0; lvLove(a, 5); } else { hungry++; lvLove(a, -30); }
      if (a.petted !== day0) lvLove(a, -5);
      if (!fed) continue;
      if (a.baby) { a.age = (a.age || 0) + 1; if (a.age >= K.grow) { a.baby = false; a.days = 0; grown.push(a.name); } continue; }
      a.days = (a.days || 0) + 1; if (a.days < K.every) continue; a.days = 0;
      let out = K.out;
      if (a.kind === 'hen') out = (a.love || 0) >= 800 && Math.random() < .04 ? 'golden_egg' : Math.random() < .35 ? 'brown_egg' : 'egg';
      if (K.big && (a.love || 0) >= 600 && Math.random() < (a.love - 400) / 800) out = K.big;
      if (K.home === 'coop') {
        if (free.length) { h.floor.push({ ...free.splice(Math.floor(Math.random() * free.length), 1)[0], id: out }); made++; }
        if (a.kind === 'duck' && (a.love || 0) >= 600 && Math.random() < .3 && free.length) h.floor.push({ ...free.splice(Math.floor(Math.random() * free.length), 1)[0], id: 'feather' });
      } else if (!a.ready) { a.ready = out; made++; }
    }
  }
  const bits = [];
  if (made) bits.push('Your animals have something for you');
  if (hungry) bits.push(`${hungry} animal${hungry > 1 ? 's went' : ' went'} hungry. Fill the trough!`);
  if (grown.length) bits.push(`${grown.join(' and ')} ${grown.length > 1 ? 'are' : 'is'} all grown up!`);
  if (bits.length && S.morning) S.morning += ' · ' + bits.join(' · ');
  return r;
};

/* ---------- deeper farm jobs */
JOBS.Gale.desc = 'Picks ripe crops, and collects from beehives, compost bins, fishing huts and finished machines in its area. With your coop or barn door in its area, it gathers the eggs, milk and wool too. Everything goes into a chest in the area, or to your ranch.';
JOBS.Leaf.desc += ' With your coop or barn door in its area, it also fills the trough from hay (or grain) in a chest there.';
JOBS.Spark.desc = 'Charges compost bins, beehives and machines in its area so they finish sooner.';
const lvDoorIn = ([x0, y0, x1, y1]) => ['coop', 'barn'].filter(k => S[k] && S[k].cx >= x0 && S[k].cx <= x1 && S[k].by + 1 >= y0 && S[k].by + 1 <= y1);
const _lvTargets = jobTargets;
jobTargets = function (m, area) {
  const ar = area || jobArea(m.job), type = SPECIES[m.sp].type;
  let out = _lvTargets(m, area);
  if (type === 'Gale') out = out.filter(t => !(t.collect && S.objs[t.collect] && S.objs[t.collect].t === 'incubator'));
  if (type === 'Ember') return out;
  for (const k of lvDoorIn(ar)) {
    const e = lvEntry(k), h = S[k];
    if (type === 'Gale' && ((h.floor || []).length || lvIn(k).some(a => a.ready))) out.push({ x: e.x, y: e.y, lvCollect: k });
    if (type === 'Leaf' && (h.trough || 0) < lvTroughMax(k)) { const cs = chestsIn(ar); if ((k === 'coop' ? ['hay', 'grain'] : ['hay']).some(id => chestCount(cs, id, true))) out.unshift({ x: e.x, y: e.y, lvFeed: k, pri: 0 }); }
  }
  if (type === 'Spark') {
    const [x0, y0, x1, y1] = ar;
    for (const [k, o] of Object.entries(S.objs)) { if (!MACH[o.t] || !o.out || o.boost || machReady(o)) continue; const [x, y] = k.split(',').map(Number); if (x >= x0 && x <= x1 && y >= y0 && y <= y1) out.push({ x, y, machSpark: k }); }
  }
  return out;
};
const jobLv = m => Math.min(5, Math.floor(Math.sqrt((m.jobXP || 0) / 20)));
const jobLvTxt = m => jobLv(m) ? ` ★${jobLv(m)}` : '';
const _lvDoJob = doJob;
doJob = function (m, t) {
  const fs = scene && scene.scene && scene.scene.key === 'farm' ? scene : null;
  let done;
  jobChests = m.job ? chestsIn(jobArea(m.job)) : [];
  if (t.lvCollect) {
    const h = S[t.lvCollect]; if (!h) return;
    const egg = (h.floor || []).shift(), a = !egg && lvIn(t.lvCollect).find(q => q.ready);
    if (egg) { toStore(egg.id, 1); if (fs) fs.floatText(`+1 ${ITEMS[egg.id].name}`, t.x * T + 8, t.y * T - 8); }
    else if (a) { toStore(a.ready, 1); if (fs) fs.floatText(`+1 ${ITEMS[a.ready].name}`, t.x * T + 8, t.y * T - 8); a.ready = null; }
    else return;
    done = true;
  } else if (t.lvFeed) {
    const h = S[t.lvFeed]; if (!h) return; const room = lvTroughMax(t.lvFeed) - (h.trough || 0); if (room <= 0) return;
    let n = 0; for (const id of t.lvFeed === 'coop' ? ['hay', 'grain'] : ['hay']) { const k = Math.min(room - n, 5 - n, chestCount(jobChests, id, true)); if (k > 0) { chestTake(jobChests, id, k, true); n += k; } }
    if (!n) return; h.trough = (h.trough || 0) + n; if (fs) fs.floatText(`🌾 Trough +${n}`, t.x * T + 8, t.y * T - 8); done = true;
  } else if (t.machSpark) {
    const o = S.objs[t.machSpark]; if (!o || !o.out || o.boost) return;
    const now = nowMin(); o.done = now + Math.floor(Math.max(0, o.done - now) / 2); o.boost = 1;
    if (fs) { fs.spark(t.x * T + 8, t.y * T + 4); fs.floatText('⚡ Charged!', t.x * T + 8, t.y * T); } done = true;
  } else if (t.collect && S.objs[t.collect] && MACH[S.objs[t.collect].t]) {
    const o = S.objs[t.collect]; if (!machReady(o) || o.out.id[0] === '@') return;
    toStore(o.out.id, o.out.n); if (fs) { fs.floatText(`+${o.out.n} ${ITEMS[o.out.id].name}`, t.x * T + 8, t.y * T); }
    o.out = null; o.boost = 0; if (fs) fs.drawObj(t.x, t.y); done = true; t.machOut = 1;
  } else done = _lvDoJob(m, t);
  if (!done) return done;
  if (t.lvCollect || t.lvFeed || t.machSpark || t.machOut) { S.workLog = S.workLog || {}; S.workLog[m.uid] = (S.workLog[m.uid] || 0) + 1; }
  const before = jobLv(m); m.jobXP = (m.jobXP || 0) + 1;
  if (jobLv(m) > before && fs) { fs.floatText(`★ Skill ${jobLv(m)}!`, t.x * T + 8, t.y * T - 14); toast(`${monName(m)} is getting better at being a ${jobOf(m).name}! (skill ${jobLv(m)}: works ${jobLv(m) * 6}% faster)`, 3000); }
  return done;
};
const _lvInterval = jobInterval;
jobInterval = function (m) { return _lvInterval(m) * (1 - .06 * jobLv(m)); };
