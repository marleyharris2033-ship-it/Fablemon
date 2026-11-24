/* ============================================================ The Rootway (24 Nov 2026)
   Old travel gates grown from the roots of the mother tree, one in each town and one on your farm. Each sleeps until
   you touch its rune; once two or more are awake, any awake shrine takes you to any other. Your farm's wakes by itself,
   so the first shrine you wake already takes you home. None of them stir until you've reached Beaconreach: until then
   the train is how you get about.

   Also the loader for the user's sheet of 24 Nov (tools/art/cut_xart.py): atlas 'xa', 3x, shown at a third. It holds
   the shrines, the farm stable and its props (mounts.js), and Elderwood's trees, Eldest Tree and Harvester
   (elderwood.js, ewquests.js). */

const _xaLoad = hdWorldLoad;
hdWorldLoad = function (loader, snow) { _xaLoad(loader, snow); if (HDW.xa && !game.textures.exists('xa')) loader.image('xa', HDW.xa.img); };
const _xaSwap = hdWorldSwap;
hdWorldSwap = function (sc) {
  _xaSwap(sc);
  const t = sc.textures.exists('xa') && sc.textures.get('xa');
  if (t && !t._shrunk) { for (const [k, f] of Object.entries(HDW.xa.frames)) t.add(k, 0, f.x, f.y, f.w, f.h); hdShrinkTexture(t, 3); t._shrunk = 1; }
};
const xaHas = f => !!(HDW.xa && HDW.xa.frames && HDW.xa.frames[f]);
const xaReady = (sc, f) => xaHas(f) && sc.textures.exists('xa') && sc.textures.get('xa')._shrunk && sc.textures.get('xa').has(f);
// one picture from the atlas as an image URL, for menus
const XA_PICS = {};
function xaPic(f, cb) {
  if (XA_PICS[f] !== undefined) return XA_PICS[f];
  XA_PICS[f] = ''; if (!xaHas(f)) return '';
  const im = new Image(); im.onload = () => {
    const F = HDW.xa.frames[f], c = document.createElement('canvas'); c.width = F.w; c.height = F.h;
    c.getContext('2d').drawImage(im, F.x, F.y, F.w, F.h, 0, 0, F.w, F.h); XA_PICS[f] = c.toDataURL(); cb && cb(XA_PICS[f]);
  };
  im.src = HDW.xa.img; return '';
}

/* ---------- the shrines: where each stands (its two back tiles; you arrive on the tile below the left one) */
const ROOTWAY = {
  farm: { name: 'Your farm', x: 48, y: 14 },
  town: { name: 'Smallroot', x: 51, y: 29 },
  brookholt: { name: 'Brookholt', x: 4, y: 15 },
  quarrydown: { name: 'Quarrydown', x: 19, y: 32 },
  driftwood: { name: 'Driftwood Cove', x: 39, y: 16 },
  beaconreach: { name: 'Beaconreach', x: 18, y: 29 },
  highmoor: { name: 'Highmoor', x: 19, y: 36 },
  elderwood: { name: 'Elderwood', x: 50, y: 67 },
  gloamhollow: { name: 'Gloamhollow', x: 18, y: 26 },
};
const ROOTWAY_ORDER = Object.keys(ROOTWAY);
function rwS() { S.rootway = S.rootway || { awake: { farm: 1 }, at: {} }; S.rootway.at = S.rootway.at || {}; return S.rootway; }
// the roots only stir once you've reached Beaconreach; until then the train is how you get about
const rwOpen = () => !!(S.visited && S.visited.beaconreach);
const rwAwake = k => rwOpen() && !!rwS().awake[k];

// the tiles each kind of place keeps its walls in
function rwBlock(sc, x, y, v) {
  const W = sc.mw, i = y * W + x;
  if (typeof Farm !== 'undefined' && sc instanceof Farm) farm.blocked[i] = v;
  else if (sc.town && sc.town.blocked) sc.town.blocked[i] = v;
  else if (sc.R && sc.R.blocked) sc.R.blocked[i] = v;
}
// its spot, nudged if something of yours already stands there (and remembered, so it never wanders)
function rwSpot(sc, key) {
  const R = rwS(), D = ROOTWAY[key]; if (R.at[key]) return R.at[key];
  const ok = (x, y) => sc.passable(x, y) && sc.passable(x + 1, y) && sc.passable(x, y + 1) && !(sc.p && ((sc.p.x === x || sc.p.x === x + 1) && sc.p.y === y));
  for (let r = 0; r < 6; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
    const x = D.x + dx, y = D.y + dy; if (ok(x, y)) return R.at[key] = { x, y };
  }
  return null;
}
function rwPlace(sc) {
  const key = sc.scene.key, D = ROOTWAY[key]; sc.rwAt = null; if (!D) return;
  const at = rwSpot(sc, key); if (!at) return;
  sc.rwAt = at; rwBlock(sc, at.x, at.y, 1); rwBlock(sc, at.x + 1, at.y, 1);
  rwDraw(sc);
  // the first time in Beaconreach: the roots wake up all over the region
  if (key === 'beaconreach') sc.time.delayedCall(900, () => {
    const R = rwS(); if (!rwOpen() || R.opened || !sc.sys || !sc.sys.isActive()) return;
    R.opened = 1; rwDraw(sc); save();
    sc.cameras.main.flash(380, 220, 255, 150); Sound.play('levelup');
    toast('🌿 Far below Beaconreach, old roots stir. The Rootway shrines can be woken now!', 4200);
  });
}
function rwDraw(sc) {
  const at = sc.rwAt; if (!at) return;
  for (const o of sc.rwObjs || []) o.destroy(); sc.rwObjs = [];
  const awake = rwAwake(sc.scene.key), f = awake ? 'shr_awake' : 'shr_sleep', x = (at.x + 1) * T, y = (at.y + 1) * T + 4;
  const im = xaReady(sc, f) ? sc.add.image(x, y, 'xa', f) : sc.add.ellipse(x, y - 6, 30, 12, awake ? 0x9ad84a : 0x7a6a58);
  im.setOrigin(.5, 1).setDepth(at.y * T + 15); sc.rwObjs.push(im); sc.rwImg = im; if (sc.tall) sc.tall.push(im);
  if (!awake) return;
  // a soft glow, and motes drifting up through the arch
  const glow = sc.add.ellipse(x, y - 7, 34, 10, 0xd8ff6a, .22).setDepth(at.y * T + 15.2).setBlendMode(Phaser.BlendModes.ADD);
  sc.tweens.add({ targets: glow, alpha: .08, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.inOut' }); sc.rwObjs.push(glow);
  for (let i = 0; i < 6; i++) {
    const m = sc.add.circle(x, y, 1.1, 0xeaff9a, 0).setDepth(at.y * T + 15.3).setBlendMode(Phaser.BlendModes.ADD); sc.rwObjs.push(m);
    const go = () => { if (!m.active) return; m.setPosition(x + (Math.random() - .5) * 26, y - 8 - Math.random() * 6).setAlpha(0);
      sc.tweens.add({ targets: m, y: m.y - 18 - Math.random() * 14, alpha: { from: .9, to: 0 }, duration: 1800 + Math.random() * 1400, onComplete: go }); };
    sc.time.delayedCall(i * 450, go);
  }
}
const rwIsShrine = (sc, x, y) => { const a = sc.rwAt; return !!a && y === a.y && (x === a.x || x === a.x + 1); };

/* ---------- touching it */
function rwUse(sc) {
  const key = sc.scene.key, D = ROOTWAY[key]; if (!D || sc.paused || sc.sleeping) return;
  sc.face(sc.rwAt.x, sc.rwAt.y); sc.p.busy = .3;
  if (!rwOpen()) return toast('An old gate of twisted roots. The rune is cold, and nothing answers your touch. Not yet.', 3200);
  if (!rwAwake(key)) return rwWake(sc);
  rwMenu(sc);
}
function rwWake(sc) {
  const key = sc.scene.key, R = rwS(); R.awake[key] = 1;
  Sound.play('levelup'); sc.cameras.main.flash(380, 220, 255, 150);
  rwDraw(sc); save();
  const n = Object.keys(R.awake).length;
  if (!R.told) {
    R.told = 1;
    openModal('The Rootway', `<p>The rune flares green and gold, and the old roots stir. Warmth runs through them, down into the ground and away.</p>
      <p>This is a <b>Rootway shrine</b>, a gate grown from the roots of the mother tree. There's one in every town, and one on your farm.</p>
      <p>Wake a shrine by touching its rune. Once it's awake, any awake shrine can take you there.</p>
      <div class="row" style="justify-content:center"><button class="btn gold" data-a="ok">Got it</button></div>`, () => closeModal());
  } else toast(`🌿 The ${ROOTWAY[key].name} shrine wakes. ${n} of ${ROOTWAY_ORDER.length} shrines are awake.`, 3000);
}
function rwMenu(sc) {
  const here = sc.scene.key, R = rwS();
  const row = k => {
    const D = ROOTWAY[k], on = rwAwake(k), me = k === here, ic = xaPic('shr_icon', () => $('rwList') && rwMenu(sc));
    return `<button class="btn${on && !me ? ' gold' : ''}" data-a="go" data-k="${k}" ${on && !me ? '' : 'disabled'} style="display:flex;align-items:center;gap:8px;width:100%;margin:4px 0;text-align:left;${on ? '' : 'opacity:.55'}">
      ${ic ? `<img src="${ic}" style="width:26px;height:26px;${on ? '' : 'filter:grayscale(1)'}">` : '🌿'}<span style="flex:1">${on ? D.name : '???'}</span><small>${me ? 'You are here' : on ? '' : 'Still asleep'}</small></button>`;
  };
  openModal('Rootway', `<div id="rwList"><p class="hint" style="margin-top:0">Step through to any awake shrine.</p>${ROOTWAY_ORDER.map(row).join('')}</div>`, (a, d) => {
    if (a !== 'go' || !d.k || !rwAwake(d.k) || d.k === here) return;
    closeModal(); const at = R.at[d.k] || ROOTWAY[d.k];
    Sound.play('pop', 0); sc.cameras.main.flash(300, 220, 255, 150);
    travel(sc, d.k, { x: at.x, y: at.y + 1, dir: 'down' });
  });
}

/* ---------- hooks: placed with the player; faced or tapped like a sign */
(function () {
  const WP = World.prototype, mk = WP.makePlayer, cut = WP.cutProp, tap = WP.tapProp, upd = WP.update;
  WP.makePlayer = function (sp) {
    for (const o of this.rwObjs || []) if (o.active) o.destroy(); this.rwObjs = []; this.rwAt = null; this.rwPending = 0;
    mk.call(this, sp);
    try { rwPlace(this); } catch (e) { console.warn('rootway', e); }
  };
  WP.cutProp = function (x, y) { if (rwIsShrine(this, x, y)) { rwUse(this); return true; } return cut.call(this, x, y); };
  WP.tapProp = function (wx, wy) {
    const a = this.rwAt, p = this.p;
    if (a && p && this.rwImg && this.rwImg.getBounds().contains(wx, wy)) {
      const near = (x, y) => y === a.y + 1 && (x === a.x || x === a.x + 1) || (y === a.y && (x === a.x - 1 || x === a.x + 2));
      if (near(p.x, p.y) && !p.moving) { rwUse(this); return true; }
      const path = this.path(near); if (path) { p.path = path; p.pending = null; this.rwPending = 1; }
      return true;
    }
    return tap.call(this, wx, wy);
  };
  WP.update = function (time, dms) {
    upd.call(this, time, dms);
    const p = this.p, a = this.rwAt; if (!this.rwPending || !p || !a) return;
    if (p.moving || p.path.length) return;
    this.rwPending = 0;
    if ((p.y === a.y + 1 && (p.x === a.x || p.x === a.x + 1)) || (p.y === a.y && (p.x === a.x - 1 || p.x === a.x + 2))) rwUse(this);
  };
})();
