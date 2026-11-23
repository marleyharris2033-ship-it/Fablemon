/* ============================================================ Roaming wild Fablemon (17 Nov 2026)
   Wild Fablemon are out in the long grass where you can see them, instead of jumping out at random. They come from
   the same encounter tables (day and night, levels by zone, Fabled odds, Verdance's grey grass), wander their own
   patch of grass, and behave in character: shy ones back away when you come close, bold ones come for you, the
   rest graze and wander. Touch one (or let it touch you) and the battle starts: an action battle (rtbattle.js) or
   the classic one, by the "Battle style" setting.
   Menu → Settings → "Wild Fablemon": Roaming (default) or Hidden (the old random encounters). Sea routes keep
   random encounters on the water. */
const roamOn = () => opts.roam !== false;
// personality: some species are shy, some bold; the night hunters are bold after dark
const ROAM_BOLD = new Set(['snarlwisp', 'murkhowl', 'gloamfang', 'tanglebruin', 'ursylvane', 'stumpstag', 'ramruff', 'ramruff_2', 'craglet_2', 'flintuck', 'duskwick', 'inkwick', 'hollowcub']);
// a rare species: under 8% of this route's table right now
function roamRare(sp, extra) {
  const night = S.time >= 1140 || S.time < 360, tab = [...(RC ? RC.enc : ENCOUNTERS)[night ? 'night' : 'day'], ...(extra || [])];
  const tot = tab.reduce((a, [, w]) => a + w, 0), w = tab.filter(([s]) => s === sp).reduce((a, [, w]) => a + w, 0);
  return tot > 0 && w / tot < .08;
}
const ROAM_SHY = new Set(['sprigfawn', 'tappit', 'heathfoal', 'simmerkit', 'pebblouse']);
function roamMood(m) {
  if (m.fab) return 'shy';   // Fabled ones are skittish: you have to sneak up on them
  if (ROAM_BOLD.has(m.sp)) return 'bold';
  if (ROAM_SHY.has(m.sp)) return 'shy';
  const S0 = SPECIES[m.sp]; return (S0.base.atk || 0) > (S0.base.def || 0) * 1.3 && m.lv >= 12 ? 'bold' : 'calm';   // early Fablemon mostly just graze
}

const _roamCreate = Route.prototype.create;
Route.prototype.create = function () {
  _roamCreate.call(this);
  this.roam = [];
  this.roamOn = !!(roamOn() && !RC.sail && this.R && GRASS_ZONES && GRASS_ZONES.length && RC.enc);
  if (!this.roamOn) return;
  const tiles = []; for (let i = 0; i < RW * RH; i++) if (this.R.grass[i] >= 0 && !this.R.blocked[i]) tiles.push(i);
  if (tiles.length < 6) { this.roamOn = false; return; }
  this.roamTiles = tiles; this.roamMax = Math.max(4, Math.min(16, Math.round(tiles.length / 13)));   // 18 Nov: busier grass
  for (let k = 0; k < this.roamMax; k++) this.roamSpawn(true);
};
Object.assign(Route.prototype, {
  roamFree(x, y) { const i = y * RW + x; return x >= 0 && y >= 0 && x < RW && y < RH && this.R.grass[i] >= 0 && !this.R.blocked[i] && !this.roam.some(r => r.x === x && r.y === y) && !(this.p && this.p.x === x && this.p.y === y); },
  roamSpawn(quiet) {
    if (!team().some(m => m.hp > 0)) return;
    for (let tries = 0; tries < 20; tries++) {
      const i = this.roamTiles[Math.floor(Math.random() * this.roamTiles.length)], x = i % RW, y = (i / RW) | 0;
      if (!this.roamFree(x, y) || (this.p && Math.abs(this.p.x - x) + Math.abs(this.p.y - y) < 6)) continue;
      const z = this.R.grass[i], [, , , , a, b, tag] = GRASS_ZONES[z]; let m = rollWild(a, b, tag && RC[tag]);
      if (roamRare(m.sp, tag && RC[tag]) && this.roam.some(q => !q.alpha && roamRare(q.m.sp, tag && RC[tag]))) m = rollWild(a, b, tag && RC[tag]);   // one rare one out at a time keeps them special
      if (roamRare(m.sp, tag && RC[tag]) && this.roam.some(q => !q.alpha && roamRare(q.m.sp, tag && RC[tag]))) continue;
      const wid = walkId(this, m); if (!monReady(this, wid.replace(/^F/, ''))) continue;
      monAnims(this, wid);
      const spr = hdSpr(this.add.sprite(x * T + 8, y * T + 15, 'mon_' + wid, 0).setOrigin(.5, 1), wid);
      const r = { m, wid, spr, x, y, zone: z, mood: roamMood(m), dir: 'down', t: 1 + Math.random() * 2, moving: false, alert: 0 };
      this.shadow(spr, Math.round(spr.displayWidth * .5), 4);
      if (m.fab) { r.glint = this.add.star(spr.x, spr.y - spr.displayHeight * .7, 4, 1.5, 4, 0xfff6c8).setDepth(9e6 - 50); this.tweens.add({ targets: r.glint, alpha: .2, angle: 90, duration: 700, yoyo: true, repeat: -1 }); }
      if (!quiet) { spr.setAlpha(0); this.tweens.add({ targets: spr, alpha: 1, duration: 600 }); }
      this.roamDraw(r); this.roam.push(r); return r;
    }
  },
  roamDraw(r) {
    r.spr.setDepth(r.spr.y + 1.2); if (r.spr.shadowImg) r.spr.shadowImg.setPosition(r.spr.x, r.spr.y - 1);
    if (r.glint) r.glint.setPosition(r.spr.x, r.spr.y - r.spr.displayHeight * .75);
  },
  roamRemove(r) { this.roam = this.roam.filter(q => q !== r); if (r.glint) r.glint.destroy(); if (r.spr.shadowImg) r.spr.shadowImg.destroy(); r.spr.destroy(); },
  roamStep(r, dx, dy) {
    const nx = r.x + dx, ny = r.y + dy; if (this.p && this.time.now < (this.roamSettle || 0) && Math.abs(nx - this.p.x) + Math.abs(ny - this.p.y) <= 1) return false;   // right after a fight, they keep their distance
    if (!this.roamFree(nx, ny) || this.R.grass[ny * RW + nx] !== r.zone && Math.random() < .85) return false;
    r.x = nx; r.y = ny; r.dir = dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up'; r.moving = true;
    r.spr.anims.play(`${r.wid}_${r.dir}`, true);
    const dur = r.mood === 'bold' && r.alert ? 260 : 420;
    this.tweens.add({ targets: r.spr, x: nx * T + 8, y: ny * T + 15, duration: dur, onUpdate: () => { if (r.spr.active) this.roamDraw(r); }, onComplete: () => { if (!r.spr.active) return; r.moving = false; r.spr.anims.stop(); r.spr.setFrame(DIRS.indexOf(r.dir) * 4); } });
    return true;
  },
  roamThink(r) {
    const p = this.p, dx = p.x - r.x, dy = p.y - r.y, d = Math.abs(dx) + Math.abs(dy);
    const sx = Math.sign(dx), sy = Math.sign(dy), tryDirs = l => { for (const [a, b] of l) if ((a || b) && this.roamStep(r, a, b)) return true; return false; };
    if (r.mood === 'bold' && d <= 5 && this.time.now > (this.roamSettle || 0)) {   // bold ones leave you be for a bit after a battle
      if (!r.alert) { r.alert = 1; this.roamBang(r); r.t = .5; return; }
      return tryDirs(Math.abs(dx) > Math.abs(dy) ? [[sx, 0], [0, sy]] : [[0, sy], [sx, 0]]);
    }
    if (r.mood === 'shy' && d <= 3) { r.alert = 1; return tryDirs(Math.abs(dx) > Math.abs(dy) ? [[-sx, 0], [0, -sy || 1], [0, sy ? -sy : -1]] : [[0, -sy], [-sx || 1, 0], [sx ? -sx : -1, 0]]); }
    r.alert = 0;
    if (Math.random() < .6) { const ds = [[1, 0], [-1, 0], [0, 1], [0, -1]]; tryDirs([ds[Math.floor(Math.random() * 4)], ds[Math.floor(Math.random() * 4)]]); }
    else { r.dir = DIRS[Math.floor(Math.random() * 4)]; r.spr.setFrame(DIRS.indexOf(r.dir) * 4); }
  },
  roamBang(r) {
    const t = this.add.text(r.spr.x, r.spr.y - r.spr.displayHeight - 2, '!', { fontFamily: 'monospace', fontSize: '12px', color: '#fff', stroke: '#b03020', strokeThickness: 3 }).setOrigin(.5, 1).setDepth(9e6 - 20);
    this.tweens.add({ targets: t, y: t.y - 6, alpha: 0, delay: 500, duration: 400, onComplete: () => t.destroy() }); Sound.play('pop');
  },
  roamEngage(r) {
    if (this.paused || Battle.active || (typeof RTB !== 'undefined' && RTB.active)) return;
    this.p.path = []; this.p.pending = null; const at = { x: r.spr.x, y: r.spr.y }; this.roamRemove(r);
    this.roamNext = this.time.now + 9000 + Math.random() * 9000;
    if (opts.action !== false && typeof RTB !== 'undefined') RTB.start(this, r.m, at); else Battle.start(r.m);
  },
});
// the roamers think each frame; touching one starts the battle
const _roamFrame = Route.prototype.frameHook;
Route.prototype.frameHook = function (dt) {
  const out = _roamFrame ? _roamFrame.call(this, dt) : undefined;
  if (!this.roamOn) return out;
  if (this.paused || this.sleeping || !this.p || Battle.active || (typeof RTB !== 'undefined' && RTB.active)) { this.roamCalm = this.time.now + 2500; this.roamSettle = this.time.now + 9000; this.roamBusy = 1; for (const r of this.roam || []) r.alert = 0; return out; }   // a breather after every battle
  const sec = dt || .016;   // frameHook gets seconds
  if (this.roamBusy) {   // the fight's over: anything close by scatters from the commotion
    this.roamBusy = 0;
    for (const r of this.roam.slice()) if (Math.abs(r.x - this.p.x) + Math.abs(r.y - this.p.y) <= 3) { r.moving = true; this.tweens.add({ targets: r.spr, alpha: 0, duration: 400, onComplete: () => this.roamRemove(r) }); }
  }
  if (this.time.now < (this.roamCalm || 0)) return out;
  for (const r of this.roam.slice()) {
    if (Math.abs(r.x - this.p.x) + Math.abs(r.y - this.p.y) <= (r.moving ? 0 : 1) && Math.abs(r.spr.x - (this.p.x * T + 8)) + Math.abs(r.spr.y - (this.p.y * T + 15)) < 20) {
      if (team().some(m => m.hp > 0)) { this.roamEngage(r); return out; }
    }
    if (r.moving) continue;
    if (!r.born) r.born = this.time.now;
    if (this.time.now - r.born > 45000 + (r.x * 7919 + r.y * 104729) % 30000 && !r.alert && Math.abs(r.x - this.p.x) + Math.abs(r.y - this.p.y) > 7) {   // it wanders off; another turns up
      r.moving = true; this.tweens.add({ targets: r.spr, alpha: 0, duration: 700, onComplete: () => this.roamRemove(r) }); continue;
    }
    r.t -= sec * (r.alert ? 2.2 : 1); if (r.t > 0) continue;
    r.t = r.mood === 'bold' && r.alert ? .35 : .8 + Math.random() * 1.6;
    this.roamThink(r);
  }
  if (this.roam.length < this.roamMax && this.time.now > (this.roamNext || 0)) { this.roamSpawn(false); this.roamNext = this.time.now + 2000 + Math.random() * 3000; }
  return out;
};
// no random jump-outs while the Fablemon are out where you can see them (the sea routes keep theirs)
const _roamOdds = vdEncOdds;
vdEncOdds = function (sc) { return sc && sc.roamOn ? 0 : _roamOdds(sc); };

/* ---------- the setting */
const _roamCtl = controlsHTML;
controlsHTML = function () {
  const seg = (a, cur, list) => `<div class="seg">${list.map(([v, l]) => `<button class="${String(cur) === String(v) ? 'on' : ''}" data-a="${a}" data-v="${v}">${l}</button>`).join('')}</div>`;
  return _roamCtl() + `<div class="setc"><b>Wild Fablemon</b>${seg('roam', opts.roam === false ? 'off' : 'on', [['on', '👀 Roaming'], ['off', '🌾 Hidden in grass']])}
      <small>${opts.roam === false ? 'Wild Fablemon jump out at random from the long grass, like before.' : 'Wild Fablemon wander the long grass where you can see them. Walk into one to battle it.'}</small></div>
    <div class="setc"><b>Wild battle style</b>${seg('action', opts.action === false ? 'off' : 'on', [['on', '⚡ Action'], ['off', '🎴 Classic']])}
      <small>${opts.action === false ? 'Wild battles are turn-based, picking moves from a menu.' : 'Wild battles are real-time: steer your Fablemon, fire moves when they recharge and dodge.'}</small></div>
    <div class="setc"><b>Trainer battle style</b>${seg('actionT', opts.actionT === false ? 'off' : 'on', [['on', '⚡ Action'], ['off', '🎴 Classic']])}
      <small>${opts.actionT === false ? 'Trainers and Wardens battle turn by turn.' : 'Trainers and Wardens battle in real time too, right where you meet them.'}</small></div>
    <div class="setc"><b>Auto battle (action battles)</b>${seg('rtAuto', opts.rtAuto ? 'on' : 'off', [['off', '🕹️ I steer'], ['on', '🤖 Auto']])}
      <small>${opts.rtAuto ? 'Your Fablemon moves, attacks and dodges by itself; you still pick who goes next if one faints. Touch the stick to take over; you can still catch, heal and run.' : 'You steer and pick the moves. There is also an 🤖 Auto button in every action battle.'}</small></div>`;
};
const _roamSet = handleSetting;
handleSetting = function (a, d, el) {
  if (a === 'roam') { opts.roam = d.v === 'on'; saveOpts(); toast(opts.roam ? 'Wild Fablemon roam the grass.' : 'Wild Fablemon hide in the grass.', 1600); }
  if (a === 'actionT') { opts.actionT = d.v === 'on'; saveOpts(); toast(opts.actionT ? 'Action battles for trainers.' : 'Classic battles for trainers.', 1600); }
  if (a === 'rtAuto') { opts.rtAuto = d.v === 'on'; saveOpts(); toast(opts.rtAuto ? 'Auto battle on.' : 'Auto battle off.', 1600); }
  if (a === 'action') { opts.action = d.v === 'on'; saveOpts(); toast(opts.action ? 'Action battles for wild Fablemon.' : 'Classic battles for wild Fablemon.', 1600); }
  return _roamSet(a, d, el);
};

/* ---------- Alphas (18 Nov): once a week a big, tough Alpha roams one land route you've been to, all week until
   it's beaten. A Monday-morning notice (and a letter) says where, the map marks it, it never wanders off, and beating it pays double experience,
   gold and a rare item. Catching one is harder, but it keeps its strong potential. */
const ALPHA_GIFTS = ['study_leaf', 'lucky_acorn', 'hearth_elixir', 'skyward_charm'];
function alphaRoutes() {
  return Object.keys(ROUTES).filter(k => { const R = ROUTES[k]; return R && !R.sail && (R.zones || []).length && R.enc && (S.visited || {})[k]; });
}
const alphaWeek = (d = S.day) => Math.floor((d - 1) / 7);
function alphaRoll() {
  const ks = alphaRoutes(); if (!ks.length) { S.alpha = { day: S.day, week: alphaWeek(), none: 1 }; return; }
  const k = ks[Math.floor(Math.random() * ks.length)], R = ROUTES[k], tab = R.enc.day || [];
  // prefer the less common ones: weight by 1/w so an Alpha is usually something worth seeing
  const tot = tab.reduce((a, [, w]) => a + 1 / w, 0); let r = Math.random() * tot, sp = tab[0] && tab[0][0];
  for (const [s, w] of tab) if ((r -= 1 / w) < 0) { sp = s; break; }
  const top = Math.max(...R.zones.map(z => z[5] || 5));
  S.alpha = { day: S.day, week: alphaWeek(), route: k, sp, lv: Math.min(100, top + 5), done: false };
}
function alphaToday() { if (!S.alpha || S.alpha.week !== alphaWeek() || (S.alpha.none && S.alpha.day !== S.day)) alphaRoll(); return S.alpha.none || S.alpha.done ? null : S.alpha; }
const alphaPlace = k => { const P = (typeof MAP_PLACES !== 'undefined' ? MAP_PLACES : []).find(p => p.k === k); return (P && P.name) || (ROUTES[k] && ROUTES[k].name) || k; };
// the morning notice
const _alphaNight = nightly;
nightly = function (passedOut) {
  const out = _alphaNight.apply(this, arguments);
  try {
    const was = S.alpha && S.alpha.week === alphaWeek() && !S.alpha.none; const A = alphaToday();
    if (A && !was) {   // a new week, a new Alpha
      setTimeout(() => toast(`📣 An Alpha ${SPECIES[A.sp].name} has been seen on ${alphaPlace(A.route)}! It's on your map this week.`, 4200), 3500);
      if (typeof postSend === 'function') postSend('alpha_' + alphaWeek(), { from: 'Smallroot Wildlife Watch', subj: 'Alpha sighting', body: n => `WEEKLY SIGHTINGS\n\nAn Alpha ${SPECIES[A.sp].name} has been seen roaming ${alphaPlace(A.route)}. It's bigger and much tougher than the rest (about level ${A.lv}), and it won't wander off.\n\nIt'll be there all week, until someone beats it. Beat it for double experience and gold, and something rare. Catch it and it keeps its strength.\n\nKeepers, take care.` });
    }
  } catch (e) { console.warn('alpha', e); }
  return out;
};
// it's out there, bigger than the rest, with a glow at its feet
const _alphaCreate = Route.prototype.create;
Route.prototype.create = function () {
  _alphaCreate.call(this);
  try {
    const A = this.roamOn && alphaToday(); if (!A || A.route !== this.scene.key) return;
    for (let tries = 0; tries < 40; tries++) {
      const i = this.roamTiles[Math.floor(Math.random() * this.roamTiles.length)], x = i % RW, y = (i / RW) | 0;
      if (!this.roamFree(x, y) || (this.p && Math.abs(this.p.x - x) + Math.abs(this.p.y - y) < 8)) continue;
      const m = wildMon(A.sp, A.lv); for (const k in m.iv) m.iv[k] = Math.max(m.iv[k], 6 + Math.floor(Math.random() * 3)); m.hp = monStat(m, 'hp'); m.alpha = 1;
      const wid = walkId(this, m); if (!monReady(this, wid.replace(/^F/, ''))) return;
      monAnims(this, wid);
      const spr = hdSpr(this.add.sprite(x * T + 8, y * T + 15, 'mon_' + wid, 0).setOrigin(.5, 1), wid); spr.setScale(spr.scaleX * 1.4, spr.scaleY * 1.4);
      const r = { m, wid, spr, x, y, zone: this.R.grass[i], mood: 'bold', dir: 'down', t: 1, moving: false, alert: 0, alpha: 1 };
      this.shadow(spr, Math.round(spr.displayWidth * .5), 5);
      r.glint = this.add.ellipse(spr.x, spr.y - 1, spr.displayWidth * .9, 9, 0xff8a20, .55).setDepth(2).setBlendMode(Phaser.BlendModes ? Phaser.BlendModes.ADD : 1);
      this.tweens.add({ targets: r.glint, alpha: .2, scaleX: 1.25, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      this.roamDraw(r); this.roam.push(r); this.roamAlpha = r; return;
    }
  } catch (e) { console.warn('alpha', e); }
};
// its glow sits at its feet, not over its head
const _alphaDraw = Route.prototype.roamDraw;
Route.prototype.roamDraw = function (r) { _alphaDraw.call(this, r); if (r.alpha && r.glint) r.glint.setPosition(r.spr.x, r.spr.y - 1); };
// Alphas don't wander off, and they don't count as the route's one rare
const _alphaFrame = Route.prototype.frameHook;
Route.prototype.frameHook = function (dt) {
  if (this.roamAlpha) this.roamAlpha.born = this.time.now;
  const out = _alphaFrame.call(this, dt);
  if (this.alphaFight && !Battle.active && !(typeof RTB !== 'undefined' && RTB.active)) { if (this.alphaFight.hp <= 0 && S.alpha) S.alpha.done = true; this.alphaFight = null; }   // classic battles
  return out;
};
const _alphaEngage = Route.prototype.roamEngage;
Route.prototype.roamEngage = function (r) { if (r.alpha) { this.alphaFight = r.m; this.roamAlpha = null; } return _alphaEngage.call(this, r); };
// the map shows where it is
const _alphaMap = openMap;
openMap = function () {
  _alphaMap.apply(this, arguments);
  try { const A = alphaToday(); if (!A) return; const i = MAP_PLACES.findIndex(P => P.k === A.route), b = document.querySelector(`.wpin[data-i="${i}"]`);
    if (b) b.insertAdjacentHTML('beforeend', '<i class="walpha">🔥</i>');
    const info = $('wmapInfo'); if (info) info.insertAdjacentHTML('afterbegin', `🔥 <b>Alpha ${SPECIES[A.sp].name}</b> (Lv ${A.lv}) on ${alphaPlace(A.route)} today. `); } catch (e) { }
};
const _alphaNotes = placeNotes;
placeNotes = function (P) { const l = _alphaNotes(P), A = alphaToday(); if (A && A.route === P.k) l.unshift(`🔥 An Alpha ${SPECIES[A.sp].name} (Lv ${A.lv}) roams here today`); return l; };
