/* ============================================================ The farmhouse
   The new interior (tools/art/cut_farmhouse.py): a painted room for each house size, and furniture you craft and
   place yourself. S.furn = [{ id, x, y, items? }]: x, y is the footprint's top-left tile. The house starts with the
   patchwork bed; everything else is made at the crafting bench (Bedroom & living, Kitchen & dining, Workshop &
   touches). Rugs lie flat: you walk on them and can stand other furniture on them.
   Some furniture does something: beds for sleeping, the acorn chest stores things, the cookstove cooks, the
   workbench crafts, the bookcase holds the Fablemon journal, the field-journal desk has tomorrow's weather (the old
   TV's job), and the lantern glows. Loaded last. */
const FURN = {
  f_bed: { name: 'Patchwork Bed', w: 2, h: 2, use: 'sleep', desc: 'A wooden bed with a hand-stitched quilt. Sleep in it to end the day.' },
  f_bedside: { name: 'Bedside Cabinet', w: 1, h: 1, desc: 'A little two-drawer cabinet.' },
  f_armchair: { name: 'Sage Armchair', w: 1, h: 1, desc: 'A soft green armchair with a cushion.' },
  f_rug: { name: 'Braided Rug', w: 3, h: 2, flat: true, desc: 'A big oval rug in red and cream. Furniture can stand on it.' },
  f_chest: { name: 'Acorn Chest', w: 2, h: 1, use: 'chest', desc: 'A storage chest with an acorn clasp. Holds 18 stacks.' },
  f_stool: { name: 'Flower Stool', w: 1, h: 1, desc: 'A small stool with an embroidered seat.' },
  f_table: { name: 'Trestle Table', w: 2, h: 1, desc: 'A sturdy farmhouse table.' },
  f_chair: { name: 'Ladderback Chair', w: 1, h: 1, desc: 'A tall wooden chair with a green seat.' },
  f_stove: { name: 'Stone Cookstove', w: 1, h: 1, use: 'cook', desc: 'An iron range set in stone. Cook on it, just like a cooking pot.' },
  f_sink: { name: 'Farmhouse Sink', w: 1, h: 1, desc: 'A deep white sink in a wooden cabinet.' },
  f_dresser: { name: 'Crockery Dresser', w: 2, h: 1, desc: 'Plates, jars and a trailing plant.' },
  f_bench: { name: 'Oak Bench', w: 2, h: 1, desc: 'A simple oak bench.' },
  f_workbench: { name: "Carpenter's Workbench", w: 2, h: 1, use: 'craft', desc: 'Craft at it without going outside.' },
  f_bookcase: { name: 'Bookcase', w: 2, h: 1, use: 'journal', desc: 'Full of books. Your Fablemon journal lives here too.' },
  f_desk: { name: 'Field-Journal Desk', w: 2, h: 1, use: 'weather', desc: "A writing desk with an almanac: it has tomorrow's weather." },
  f_fern: { name: 'Potted Fern', w: 1, h: 1, desc: 'A fern in a painted pot.' },
  f_basket: { name: 'Cushioned Fablemon Basket', w: 1, h: 1, desc: 'A cosy woven bed for a small Fablemon.' },
  f_lamp: { name: 'Brass Standing Lantern', w: 1, h: 1, glow: true, desc: 'A tall brass lantern that lights the room.' },
};
// game materials only (wood, stone, fibre): the suggested cloth, iron, clay, copper and glass don't exist yet
const FURN_RECIPES = { f_bed: { wood: 18, fiber: 12 }, f_bedside: { wood: 8, stone: 3 }, f_armchair: { wood: 12, fiber: 13 }, f_rug: { fiber: 16 }, f_chest: { wood: 16, stone: 6 },
  f_stool: { wood: 4, fiber: 2 }, f_table: { wood: 16 }, f_chair: { wood: 6, fiber: 2 }, f_stove: { stone: 40 }, f_sink: { wood: 10, stone: 12 }, f_dresser: { wood: 22, stone: 6 },
  f_bench: { wood: 10 }, f_workbench: { wood: 20, stone: 12 }, f_bookcase: { wood: 18, fiber: 3 }, f_desk: { wood: 14, stone: 6, fiber: 2 }, f_fern: { stone: 3, fiber: 4 },
  f_basket: { fiber: 12 }, f_lamp: { stone: 12, wood: 2 } };
for (const [id, F] of Object.entries(FURN)) { ITEMS[id] = { name: F.name, stack: 99, furn: true, sell: 1, desc: F.desc + ' Place it in your farmhouse.' }; RECIPES.push({ out: id, n: 1, need: FURN_RECIPES[id] }); }
CRAFT_TABS.push(['Bedroom & living', ['f_bed', 'f_bedside', 'f_armchair', 'f_rug', 'f_chest', 'f_stool']],
  ['Kitchen & dining', ['f_table', 'f_chair', 'f_stove', 'f_sink', 'f_dresser', 'f_bench']],
  ['Workshop & touches', ['f_workbench', 'f_bookcase', 'f_desk', 'f_fern', 'f_basket', 'f_lamp']]);

// art: the rooms and the furniture atlas load with the other high-detail art
const _hfLoad = hdWorldLoad;
hdWorldLoad = function (loader, snow) {
  _hfLoad(loader, snow);
  for (let n = 0; n < 4; n++) if (HDW['room_' + n]) loader.image('room_' + n, HDW['room_' + n].img);
  if (HDW.furn) loader.atlas('furn', HDW.furn.img, { frames: Object.fromEntries(Object.entries(HDW.furn.frames).map(([k, f]) => [k, { frame: f }])) });
};
const _hfSwap = hdWorldSwap;
hdWorldSwap = function (sc) {
  _hfSwap(sc);
  for (const k of ['room_0', 'room_1', 'room_2', 'room_3', 'furn']) { const t = sc.textures.exists(k) && sc.textures.get(k); if (t && !t._shrunk) { hdShrinkTexture(t, 6); t._shrunk = 1; } }
};
const _hfItems = hdItems;
hdItems = async function () {
  await _hfItems();
  const E = HDW.furn; if (!E) return;
  const img = await loadImg(E.img);
  for (const [n, r] of Object.entries(E.frames)) {
    if (!n.startsWith('i_')) continue;
    const c = document.createElement('canvas'); c.width = r.w; c.height = r.h; c.getContext('2d').drawImage(img, r.x, r.y, r.w, r.h, 0, 0, r.w, r.h); c._hdk = 3;
    const u = c.toDataURL(); ICONS[n.slice(2)] = u; ICON_CANVAS[n.slice(2)] = c; HD_SMOOTH.add(u);
  }
};

// what's in the house: old saves and new games start with the bed against the wall
function furnList() {
  if (!S.furn) S.furn = [{ id: 'f_bed', x: 0, y: 2 }];
  return S.furn;
}
const furnTiles = f => { const F = FURN[f.id], out = []; for (let y = 0; y < F.h; y++) for (let x = 0; x < F.w; x++) out.push([f.x + x, f.y + y]); return out; };
function furnAt(x, y, flat) {   // the furniture on a tile: the solid piece first, then a rug
  const L = furnList(); let rug = null;
  for (const f of L) if (furnTiles(f).some(([a, b]) => a === x && b === y)) { if (!FURN[f.id].flat) return f; rug = rug || f; }
  return flat === false ? null : rug;
}
function furnFits(id, x, y, skip) {
  const F = FURN[id];
  for (let b = y; b < y + F.h; b++) for (let a = x; a < x + F.w; a++) {
    if (a < 0 || b < 2 || a >= HW || b >= HH) return false;
    if (a === HDX() && b >= HH - 2) return false;   // keep the way to the door clear
    for (const f of furnList()) if (f !== skip && !!FURN[f.id].flat === !!F.flat && furnTiles(f).some(([p, q]) => p === a && q === b)) return false;
    const pl = scene && scene.p; if (pl && !F.flat && pl.x === a && pl.y === b) return false;
  }
  return true;
}

/* ---------- the room */
House.prototype.create = function () {
  [HW, HH] = HOUSE_ROOM[S.house || 0];
  HOUSE_BLOCK = new Set();
  this.initWorld(HW, HH);
  houseTextures(this);
  this.add.rectangle(-200, -200, HW * T + 400, HH * T + 400, 0x120d0a).setOrigin(0).setDepth(-10);
  const rk = 'room_' + (S.house || 0);
  if (this.textures.exists(rk)) this.add.image(0, 0, rk).setOrigin(0).setDepth(-5);
  else { for (let y = 0; y < HH; y++) for (let x = 0; x < HW; x++) this.add.image(x * T, y * T, y < 2 ? 'h_wall' : 'h_floor').setOrigin(0).setDepth(-5); }
  // a smaller house's furniture can end up outside the room after a move: it goes back in the backpack
  S.furn = furnList().filter(f => { if (furnTiles(f).every(([a, b]) => a >= 0 && b >= 2 && a < HW && b < HH)) return true; inv.add(f.id, 1); return false; });
  if (!S.furn.some(f => f.id === 'f_bed') && !inv.count('f_bed')) S.furn.push({ id: 'f_bed', x: 0, y: 2 });   // never without a bed
  this.furnSpr = []; this.drawFurn();
  this.tvGlow = this.add.rectangle(0, 0, 1, 1).setVisible(false);   // the weather report now comes from the desk and the bed
  this.ghost = this.add.image(0, 0, 'furn', 'f_bed').setOrigin(.5, 1).setAlpha(.55).setDepth(9e6 - 5).setVisible(false);
  this.time.addEvent({ delay: 90, loop: true, callback: () => this.updateGhost() });

  let sp = S.spawn && S.spawn.scene === 'house' ? S.spawn : { x: HDX(), y: HH - 2, dir: 'up' };
  if (!this.passable(sp.x, sp.y)) {   // woke up where a piece of furniture now stands: start beside the bed
    const bed = S.furn.find(f => f.id === 'f_bed'), from = bed ? { x: bed.x + 2, y: bed.y + 1 } : { x: HDX(), y: HH - 2 };
    let best = null, bd = 1e9; for (let y = 2; y < HH; y++) for (let x = 0; x < HW; x++) if (this.passable(x, y)) { const d = Math.abs(x - from.x) + Math.abs(y - from.y); if (d < bd) { bd = d; best = { x, y }; } }
    sp = { ...sp, ...(best || { x: HDX(), y: HH - 2 }) };
  }
  this.makePlayer(sp);
  const cam = this.cameras.main; this.applyZoom(); this.frameHook(); cam.setRoundPixels(true);
  this.scale.on('resize', this.onResize, this); this.events.once('shutdown', () => this.scale.off('resize', this.onResize, this));
  this.setupInput();
  Sound.theme('field');
  updateHUD(); renderHotbar(); FX.set(S.weather, true); this.fadeIn();
  if (S.morning) { const m = S.morning; S.morning = null; setTimeout(() => toast(m, 3600), 500); }
};
House.prototype.drawFurn = function () {
  for (const s of this.furnSpr) s.destroy(); this.furnSpr = []; HOUSE_BLOCK = new Set();
  for (const f of furnList()) {
    const F = FURN[f.id], cx = (f.x + F.w / 2) * T, by = (f.y + F.h) * T;
    if (F.flat) { this.furnSpr.push(this.add.image(cx, (f.y + F.h / 2) * T, 'furn', f.id).setOrigin(.5).setDepth(-4)); continue; }
    const im = this.add.image(cx, by - 1, 'furn', f.id).setOrigin(.5, 1).setDepth(by - 1); this.furnSpr.push(im);
    for (const [a, b] of furnTiles(f)) HOUSE_BLOCK.add(a + ',' + b);
    if (F.glow) { const g = this.add.circle(cx, by - im.displayHeight + 3, 11, 0xffd27a, .2).setBlendMode(Phaser.BlendModes.ADD).setDepth(9e6 - 10); this.furnSpr.push(g); this.tweens.add({ targets: g, alpha: .14, yoyo: true, repeat: -1, duration: 1400, ease: 'Sine.inOut' }); }
  }
};
House.prototype.passable = function (x, y) { return x >= 0 && y >= 2 && x < HW && y < HH && !HOUSE_BLOCK.has(x + ',' + y); };

/* ---------- placing: hold a piece of furniture and use it on the floor */
const heldFurn = () => { const h = held(); return h && FURN[h.id] ? h.id : null; };
// where a piece would go if used on tile (x, y): that tile is its bottom-left, or its bottom-right if that fits better
House.prototype.placeSpot = function (id, x, y) {
  const F = FURN[id];
  for (const dx of [0, -(F.w - 1)]) { const a = x + dx, b = y - (F.h - 1); if (furnFits(id, a, b)) return { x: a, y: b }; }
  return null;
};
House.prototype.updateGhost = function () {
  const id = heldFurn(), p = this.p; if (!id || !p || this.paused) return this.ghost.setVisible(false);
  const [dx, dy] = DV[p.dir], tx = this.ghostAt ? this.ghostAt.x : p.x + dx, ty = this.ghostAt ? this.ghostAt.y : p.y + dy, F = FURN[id];
  const s = this.placeSpot(id, tx, ty) || { x: tx, y: ty - (F.h - 1) };
  this.ghost.setFrame(id).setOrigin(.5, F.flat ? .5 : 1).setPosition((s.x + F.w / 2) * T, F.flat ? (s.y + F.h / 2) * T : (s.y + F.h) * T - 1).setVisible(true)
    .setTint(this.placeSpot(id, tx, ty) ? 0xffffff : 0xff7a7a);
};
House.prototype.placeFurn = function (id, x, y) {
  const s = this.placeSpot(id, x, y); if (!s) { Sound.play('error'); return toast("It won't fit there.", 1400); }
  if (!inv.remove(id, 1)) return;
  const f = { id, x: s.x, y: s.y }; if (id === 'f_chest') f.items = Array(18).fill(null);
  furnList().push(f); Sound.play('plant'); this.drawFurn(); renderHotbar(); this.ghostAt = null;
};
House.prototype.pickUp = function (f) {
  if (f.items && f.items.some(Boolean)) return toast('Empty the chest first.', 1800);
  if (inv.add(f.id, 1)) return toast('Your backpack is full.', 1600);
  S.furn = furnList().filter(q => q !== f); Sound.play('pop'); this.drawFurn(); renderHotbar();
};

/* ---------- using furniture */
House.prototype.thingAt = function (x, y) {
  if (x === HDX() && y === HH - 1) return 'door';
  return furnAt(x, y) ? 'furn' : null;
};
House.prototype.useFurn = function (f) {
  const F = FURN[f.id], name = F.name;
  if (F.use === 'sleep') return this.askSleep(f);
  const verbs = { chest: 'Open', cook: 'Cook', craft: 'Craft', journal: 'Read the journal', weather: "Tomorrow's weather" };
  const go = () => { if (F.use === 'chest') openChest(f); if (F.use === 'cook') openCooking(); if (F.use === 'craft') openCraft(); if (F.use === 'journal') openJournal(); if (F.use === 'weather') this.watchTV(); };
  if (F.use && !this.furnMenu) return go();
  openModal(name, `<p>${F.desc}</p><div class="row" style="display:flex;gap:6px;flex-wrap:wrap">${F.use ? `<button class="btn gold" data-a="use">${verbs[F.use]}</button>` : ''}<button class="btn" data-a="pick">Pick up</button></div>`, a => {
    closeModal(); if (a === 'use') go(); if (a === 'pick') this.pickUp(f);
  });
};
House.prototype.act = function (t) {
  if (t.tx !== undefined) this.face(t.tx, t.ty);
  if (t.what === 'place') return this.placeFurn(t.id, t.x, t.y);
  if (t.what === 'furn' && t.f) return this.useFurn(t.f);
};
House.prototype.actFacing = function () {
  const p = this.p; if (p.moving || this.paused) return;
  const [dx, dy] = DV[p.dir], x = p.x + dx, y = p.y + dy, id = heldFurn();
  if (id) return this.placeFurn(id, x, y);
  const f = furnAt(x, y, false) || furnAt(p.x, p.y) || furnAt(x, y);
  if (f) { this.furnMenu = !FURN[f.id].use || FURN[f.id].use !== 'sleep'; this.useFurn(f); this.furnMenu = false; }
};
House.prototype.onTap = function (wx, wy) {
  if (this.paused || this.sleeping || controlMode() !== 'tap') return;
  const x = Math.floor(wx / T), y = Math.floor(wy / T), p = this.p, id = heldFurn();
  if (x === HDX() && y === HH - 1) { const path = this.path((a, b) => a === HDX() && b === HH - 1); if (path) { p.path = path; p.pending = null; } return; }
  if (id) {   // carry it there and put it down
    const s = this.placeSpot(id, x, y); this.ghostAt = { x, y };
    if (!s) { Sound.play('error'); return toast("It won't fit there.", 1400); }
    const F = FURN[id], foot = []; for (let b = s.y; b < s.y + F.h; b++) for (let a = s.x; a < s.x + F.w; a++) foot.push(a + ',' + b);
    const adj = (a, b) => !foot.includes(a + ',' + b) && foot.some(k => { const [c, d] = k.split(',').map(Number); return Math.abs(c - a) + Math.abs(d - b) === 1; });
    if (adj(p.x, p.y)) return this.act({ what: 'place', id, x, y, tx: x, ty: y });
    const path = this.path(adj); if (path) { p.path = path; p.pending = { what: 'place', id, x, y, tx: x, ty: y }; } return;
  }
  const f = furnAt(x, y, false) || (Math.abs(p.x - x) + Math.abs(p.y - y) <= 1 ? furnAt(x, y) : null);
  if (f) {
    const tiles = furnTiles(f).map(([a, b]) => a + ',' + b), adj = (a, b) => (FURN[f.id].flat ? true : !tiles.includes(a + ',' + b)) && tiles.some(k => { const [c, d] = k.split(',').map(Number); return Math.abs(c - a) + Math.abs(d - b) <= 1; });
    const t = { what: 'furn', f, tx: x, ty: y };
    this.furnMenu = FURN[f.id].use !== 'sleep';
    if (adj(p.x, p.y)) { this.act(t); this.furnMenu = false; return; }
    const path = this.path(adj); if (path) { p.path = path; p.pending = t; } return;
  }
  if (this.passable(x, y)) { const path = this.path((a, b) => a === x && b === y); if (path) { p.path = path; p.pending = null; } }
};
// the bed: sleep, nap, see tomorrow's weather, or move it
const _hfSleep = House.prototype.askSleep;
House.prototype.askSleep = function (f) {
  _hfSleep.call(this);
  const w = WX[S.tomorrow], body = $('mBody'); if (!body) return;
  body.insertAdjacentHTML('beforeend', `<p class="hint" style="margin-top:8px">Tomorrow: ${w.icon} ${w.name}</p>${f ? '<button class="btn" id="bedPick" style="margin-top:4px">Pick up the bed</button>' : ''}`);
  const b = $('bedPick'); if (b) b.onclick = () => { closeModal(); this.pickUp(f); };
};
