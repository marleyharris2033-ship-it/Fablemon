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
      if (roamRare(m.sp, tag && RC[tag]) && this.roam.some(q => roamRare(q.m.sp, tag && RC[tag]))) m = rollWild(a, b, tag && RC[tag]);   // one rare one out at a time keeps them special
      if (roamRare(m.sp, tag && RC[tag]) && this.roam.some(q => roamRare(q.m.sp, tag && RC[tag]))) continue;
      const wid = walkId(this, m); if (!this.textures.exists('mon_' + wid)) continue;
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
    const nx = r.x + dx, ny = r.y + dy; if (!this.roamFree(nx, ny) || this.R.grass[ny * RW + nx] !== r.zone && Math.random() < .85) return false;
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
      <small>${opts.action === false ? 'Wild battles are turn-based, picking moves from a menu.' : 'Wild battles are real-time: steer your Fablemon, fire moves when they recharge and dodge. Trainers and Wardens stay classic.'}</small></div>`;
};
const _roamSet = handleSetting;
handleSetting = function (a, d, el) {
  if (a === 'roam') { opts.roam = d.v === 'on'; saveOpts(); toast(opts.roam ? 'Wild Fablemon roam the grass.' : 'Wild Fablemon hide in the grass.', 1600); }
  if (a === 'action') { opts.action = d.v === 'on'; saveOpts(); toast(opts.action ? 'Action battles for wild Fablemon.' : 'Classic battles for wild Fablemon.', 1600); }
  return _roamSet(a, d, el);
};
