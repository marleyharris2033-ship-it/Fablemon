/* ============================================================ Pets
   Hattie at the ranch has six animals looking for a home (tools/art/cut_pets.py). Adopt one and it lives in your
   farmhouse: it pads about, naps in its favourite furniture (a kennel, the cat tree, a basket...) and likes being
   petted once a day. S.pets = { key: { love, day, petted } }. Loaded after house.js. */
const PETS = {
  bramble: { name: 'Bramble', kind: 'terrier', fee: 500, about: 'A scruffy terrier with boundless energy. Loves a kennel of his own.', beds: ['f_kennel', 'f_basket', 'f_windowseat'], sound: 'woof', speed: 1.3 },
  marmalade: { name: 'Marmalade', kind: 'tabby cat', fee: 500, about: 'A fluffy ginger tabby. Sleeps eighteen hours a day, preferably up high.', beds: ['f_cattree', 'f_windowseat', 'f_basket', 'f_sofa'], sound: 'purr', speed: .9 },
  clover: { name: 'Clover', kind: 'lop rabbit', fee: 400, about: 'A soft cream lop. Shy at first, then follows you everywhere.', beds: ['f_basket', 'f_rug'], sound: 'pop', speed: 1 },
  pip: { name: 'Pip', kind: 'ferret', fee: 400, about: 'A curious ferret who has to investigate every corner.', beds: ['f_basket', 'f_kennel'], sound: 'pop', speed: 1.4 },
  hazel: { name: 'Hazel', kind: 'hedgehog', fee: 300, about: 'A tiny, prickly hedgehog with a very big appetite.', beds: ['f_basket', 'f_terrarium'], sound: 'pop', speed: .7 },
  puddle: { name: 'Puddle', kind: 'duckling', fee: 300, about: 'A fluffy duckling who thinks you might be its mum.', beds: ['f_basket', 'f_runner'], sound: 'pop', speed: .9 },
};
const petPic = k => (HD['pet_' + k] || {}).i || '';
const myPets = () => (S.pets = S.pets || {});

// art
const _petLoad = hdWorldLoad;
hdWorldLoad = function (loader, snow) { _petLoad(loader, snow); for (const k of Object.keys(PETS)) if (HDW['pet_' + k]) loader.spritesheet('pet_' + k, HDW['pet_' + k].img, { frameWidth: 144, frameHeight: 144 }); };
const _petSwap = hdWorldSwap;
hdWorldSwap = function (sc) { _petSwap(sc); for (const k of Object.keys(PETS)) { const t = sc.textures.exists('pet_' + k) && sc.textures.get('pet_' + k); if (t && !t._shrunk) { hdShrinkTexture(t, 6); t._shrunk = 1; } } };

/* ---------- adopting, at Hattie's */
const _petRanch = svcRanch;
svcRanch = SERVICE.ranch = function () {
  _petRanch();
  const b = $('mBody'); if (!b) return;
  b.insertAdjacentHTML('beforeend', `<button class="btn gold" id="petAdopt" style="width:100%;margin-top:8px">🐾 Animals looking for a home</button>`);
  $('petAdopt').onclick = () => openAdopt();
};
function openAdopt() {
  const render = () => `<p class="hint">"These little ones came to me when folk left Smallroot," Hattie says. "They need a proper home. A farmhouse would do nicely."</p>
    <div class="mlist">${Object.entries(PETS).map(([k, P]) => `<div class="recipe"><img src="${petPic(k)}" style="width:52px;height:52px;object-fit:contain"><div class="g"><b>${P.name}</b><small><i>The ${P.kind}.</i> ${P.about}</small></div>${myPets()[k] ? '<small style="white-space:nowrap;color:var(--green);font-weight:700">At home ✓</small>' : `<button class="btn gold" data-a="adopt" data-k="${k}">${P.fee}g</button>`}</div>`).join('')}</div>
    <p class="hint">The adoption fee covers their food and a vet check. They'll be waiting in your farmhouse.</p>`;
  openModal('Adopt a pet', render(), (a, d) => {
    if (a !== 'adopt') return;
    const P = PETS[d.k]; if (S.gold < P.fee) { Sound.play('error'); return toast("You can't afford the fee yet.", 1800); }
    S.gold -= P.fee; myPets()[d.k] = { love: 0, day: S.day }; updateHUD(); Sound.play('levelup'); save();
    toast(`${P.name} is coming home with you! You'll find them in your farmhouse.`, 3200);
    $('mBody').innerHTML = render();
  });
}

/* ---------- at home */
const _petHouseCreate = House.prototype.create;
House.prototype.create = function () {
  _petHouseCreate.call(this);
  this.pets = [];
  const free = []; for (let y = 2; y < HH; y++) for (let x = 0; x < HW; x++) if (this.passable(x, y) && !(x === this.p.x && y === this.p.y) && !(x === HDX() && y >= HH - 2)) free.push({ x, y });
  for (const k of Object.keys(myPets())) {
    if (!PETS[k] || !this.textures.exists('pet_' + k) || !free.length) continue;
    const at = free.splice(Math.floor(Math.random() * free.length), 1)[0];
    const spr = this.add.sprite(at.x * T + 8, at.y * T + 15, 'pet_' + k, 0).setOrigin(.5, 1);
    const pet = { k, x: at.x, y: at.y, spr, dir: 0, moving: false, nap: null, until: this.time.now + 600 + Math.random() * 2400 };
    this.pets.push(pet); this.petDepth(pet);
  }
  if (this.pets.length) this.time.addEvent({ delay: 120, loop: true, callback: () => this.petsTick() });
};
House.prototype.petDepth = function (pet) { pet.spr.setDepth(pet.nap ? pet.spr.y + 20 : pet.spr.y); };
House.prototype.petsTick = function () {
  const now = this.time.now, late = S.time >= 21 * 60 || S.time < 6 * 60;
  for (const pet of this.pets) {
    if (pet.moving) { pet.spr.setFrame(pet.dir * 4 + (Math.floor(now / 140) % 4)); continue; }
    if (now < pet.until) continue;
    if (pet.nap) { if (!late || Math.random() < .2) this.petWake(pet); else pet.until = now + 4000; continue; }
    // nap in a favourite piece of furniture, sometimes (always, late at night)
    if (Math.random() < (late ? .9 : .22) && this.petNap(pet)) continue;
    // otherwise wander a few tiles
    const steps = [[0, 1, 0], [-1, 0, 1], [1, 0, 2], [0, -1, 3]].filter(([dx, dy]) => this.petFree(pet.x + dx, pet.y + dy));
    if (!steps.length || Math.random() < .35) { pet.until = now + 1200 + Math.random() * 3000; pet.spr.setFrame(pet.dir * 4); continue; }
    const [dx, dy, d] = pick(steps), n = 1 + Math.floor(Math.random() * 3);
    let tx = pet.x, ty = pet.y; for (let i = 0; i < n && this.petFree(tx + dx, ty + dy); i++) { tx += dx; ty += dy; }
    this.petWalk(pet, tx, ty, d);
  }
};
House.prototype.petFree = function (x, y) { return this.passable(x, y) && !this.pets.some(q => q.x === x && q.y === y) && !(this.p && this.p.x === x && this.p.y === y) && !(x === HDX() && y === HH - 1); };
House.prototype.petWalk = function (pet, tx, ty, d, then) {
  const P = PETS[pet.k], dist = Math.abs(tx - pet.x) + Math.abs(ty - pet.y); pet.dir = d; pet.moving = true; pet.x = tx; pet.y = ty;
  this.tweens.add({ targets: pet.spr, x: tx * T + 8, y: ty * T + 15, duration: Math.max(1, dist) * 360 / P.speed, onUpdate: () => this.petDepth(pet),
    onComplete: () => { pet.moving = false; pet.spr.setFrame(pet.dir * 4); pet.until = this.time.now + 900 + Math.random() * 2500; if (then) then(); } });
};
House.prototype.petNap = function (pet) {
  const L = furnList(), P = PETS[pet.k];
  for (const id of P.beds) {
    const f = L.find(q => q.id === id && !this.pets.some(o => o.nap === q)); if (!f) continue;
    const F = FURN[f.id], tiles = furnTiles(f), next = [];
    for (const [a, b] of tiles) for (const [dx, dy] of [[0, 1], [-1, 0], [1, 0], [0, -1]]) if (this.petFree(a + dx, b + dy) || (a + dx === pet.x && b + dy === pet.y)) next.push([a + dx, b + dy]);
    if (!next.length) continue;
    // walk there in straight runs (a short path), then hop on
    const goal = next.sort((p, q) => Math.abs(p[0] - pet.x) + Math.abs(p[1] - pet.y) - Math.abs(q[0] - pet.x) - Math.abs(q[1] - pet.y))[0];
    const route = this.petPath(pet, goal); if (!route) continue;
    pet.nap = f; pet.moving = true;
    const hop = () => {
      const cx = (f.x + F.w / 2) * T, cy = F.flat ? (f.y + F.h / 2) * T + 6 : (f.y + F.h) * T - (id === 'f_cattree' ? 12 : 3);
      this.tweens.add({ targets: pet.spr, x: cx, y: cy, duration: 320, ease: 'Quad.out', onUpdate: () => this.petDepth(pet), onComplete: () => {
        pet.moving = false; pet.spr.setFrame(0); this.petDepth(pet); pet.until = this.time.now + 9000 + Math.random() * 12000;
        pet.zz = this.add.text(pet.spr.x + 2, pet.spr.y - pet.spr.displayHeight - 2, 'z', { fontFamily: 'ui-rounded, Nunito, system-ui, sans-serif', fontStyle: 'bold', fontSize: '8px', color: '#ffffff', stroke: '#2a1e1a', strokeThickness: 2 }).setDepth(9e6 - 6).setResolution(4);
        this.tweens.add({ targets: pet.zz, y: '-=5', alpha: .2, yoyo: true, repeat: -1, duration: 1200 });
      } });
    };
    const stepAlong = i => { if (i >= route.length) return hop(); const [x, y] = route[i], d = x > pet.x ? 2 : x < pet.x ? 1 : y > pet.y ? 0 : 3; pet.dir = d; pet.x = x; pet.y = y;
      this.tweens.add({ targets: pet.spr, x: x * T + 8, y: y * T + 15, duration: 360 / P.speed, onUpdate: () => { pet.spr.setFrame(pet.dir * 4 + (Math.floor(this.time.now / 140) % 4)); this.petDepth(pet); }, onComplete: () => stepAlong(i + 1) }); };
    stepAlong(0);
    return true;
  }
  return false;
};
House.prototype.petPath = function (pet, goal) {
  const W0 = HW, start = pet.y * W0 + pet.x, prev = new Int32Array(HW * HH).fill(-1); prev[start] = start; const q = [start];
  while (q.length) {
    const cur = q.shift(), cx = cur % W0, cy = (cur / W0) | 0;
    if (cx === goal[0] && cy === goal[1]) { const out = []; let k = cur; while (k !== start) { out.push([k % W0, (k / W0) | 0]); k = prev[k]; } return out.reverse(); }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + dx, ny = cy + dy, ni = ny * W0 + nx; if (nx < 0 || ny < 0 || nx >= HW || ny >= HH || prev[ni] !== -1 || !this.passable(nx, ny)) continue; prev[ni] = cur; q.push(ni); }
  }
  return null;
};
House.prototype.petWake = function (pet) {
  if (pet.zz) { pet.zz.destroy(); pet.zz = null; }
  pet.nap = null;
  const spot = [[0, 0], [0, 1], [-1, 0], [1, 0], [0, -1]].map(([dx, dy]) => [pet.x + dx, pet.y + dy]).find(([x, y]) => this.passable(x, y) && !this.pets.some(q => q !== pet && q.x === x && q.y === y));
  if (spot) { pet.x = spot[0]; pet.y = spot[1]; }
  pet.moving = true;
  this.tweens.add({ targets: pet.spr, x: pet.x * T + 8, y: pet.y * T + 15, duration: 300, onUpdate: () => this.petDepth(pet), onComplete: () => { pet.moving = false; pet.until = this.time.now + 1500; } });
};
// a pet on a tile (or napping on the furniture there)
House.prototype.petAt = function (x, y) { return (this.pets || []).find(p => (p.nap ? furnTiles(p.nap).some(([a, b]) => a === x && b === y) : p.x === x && p.y === y)); };
House.prototype.petPet = function (pet) {
  const P = PETS[pet.k], me = myPets()[pet.k], first = me.petted !== S.day;
  if (pet.moving) return;
  if (!pet.nap) { const p = this.p; pet.dir = p.x > pet.x ? 2 : p.x < pet.x ? 1 : p.y > pet.y ? 0 : 3; pet.spr.setFrame(pet.dir * 4); pet.until = this.time.now + 2500; }
  if (first) { me.petted = S.day; me.love = Math.min(10, (me.love || 0) + 1); }
  Sound.play(P.sound === 'woof' || P.sound === 'purr' ? 'pop' : P.sound);
  for (let i = 0; i < (first ? 3 : 1); i++) {
    const h = this.add.text(pet.spr.x + (i - 1) * 5, pet.spr.y - pet.spr.displayHeight, '♥', { fontFamily: 'system-ui', fontSize: '9px', color: '#ff6a8a', stroke: '#5a1a2a', strokeThickness: 2 }).setOrigin(.5).setDepth(9e6 - 6).setResolution(4);
    this.tweens.add({ targets: h, y: h.y - 12 - i * 3, alpha: 0, duration: 900 + i * 150, delay: i * 120, onComplete: () => h.destroy() });
  }
  const moods = { terrier: ['wags his whole body', 'rolls over for a belly rub', 'licks your hand'], 'tabby cat': ['purrs like a little engine', 'headbutts your hand', 'blinks at you slowly'], 'lop rabbit': ['nose-twitches happily', 'flops onto its side', 'nudges your fingers'],
    ferret: ['does a happy little dance', 'chitters at you', 'climbs your sleeve'], hedgehog: ['uncurls and sniffs you', 'snuffles contentedly', "doesn't prickle at all"], duckling: ['peeps and waddles after you', 'nestles into your palm', 'flaps its tiny wings'] }[P.kind];
  toast(`${P.name} ${pick(moods)}. ${'♥'.repeat(Math.ceil((me.love || 0) / 2)) || '♡'}`, 2000);
};
const _petAct = House.prototype.act;
House.prototype.act = function (t) { if (t.what === 'pet') { if (t.tx !== undefined) this.face(t.tx, t.ty); return this.petPet(t.pet); } return _petAct.call(this, t); };
const _petFacing = House.prototype.actFacing;
House.prototype.actFacing = function () {
  const p = this.p; if (p.moving || this.paused) return;
  if (!heldFurn()) { const [dx, dy] = DV[p.dir], pet = this.petAt(p.x + dx, p.y + dy); if (pet) return this.petPet(pet); }
  return _petFacing.call(this);
};
const _petTap = House.prototype.onTap;
House.prototype.onTap = function (wx, wy) {
  if (this.paused || this.sleeping || controlMode() !== 'tap' || heldFurn()) return _petTap.call(this, wx, wy);
  const pet = (this.pets || []).find(q => Math.abs(q.spr.x - wx) < 9 && wy > q.spr.y - q.spr.displayHeight - 3 && wy < q.spr.y + 3);
  if (!pet) return _petTap.call(this, wx, wy);
  const p = this.p, tx = pet.x, ty = pet.y;
  if (Math.abs(p.x - tx) + Math.abs(p.y - ty) <= 1 || pet.nap) { this.face(tx, ty); return this.petPet(pet); }
  const path = this.path((a, b) => Math.abs(a - tx) + Math.abs(b - ty) === 1); if (path) { p.path = path; p.pending = { what: 'pet', pet, tx, ty }; }
};
// furniture moved or picked up: a pet napping in it wakes
const _petDraw = House.prototype.drawFurn;
House.prototype.drawFurn = function () { _petDraw.call(this); for (const pet of this.pets || []) if (pet.nap && !furnList().includes(pet.nap)) this.petWake(pet); };
