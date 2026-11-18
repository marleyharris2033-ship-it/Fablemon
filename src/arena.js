/* ============================================================ Warden arenas (18 Nov 2026)
   Every Warden fight now happens in that Warden's own arena: one painted picture each (tools/art/cut_arenas.py,
   art_incoming/arenas), 512 x 768 world px = 32 x 48 tiles. The gyms and gardens stay where they are: you still walk
   up and challenge the Warden there, then the screen fades and the fight happens in the arena. Win or draw breath,
   you come back to where you were standing, and the Warden's Crest speech plays there.
   - Action battles only: the Warden stands on their dais, you stand on the floor below, and RTB runs as usual.
   - Classic battles (action trainers off in Settings, or a two-phase boss) use a crop of the same arena as the
     background (battleBg in game.js).
   - Losing sends you home as always. A save taken mid-fight (S.spawn = arena) sends you back to S.arenaRet.
   - Town2's settle gate is still checked first, so a Warden who turns you away does it at home.
   Shapes are in world px: floor is an ellipse { e: [cx, cy, rx, ry] }, a box { r: [x0, y0, x1, y1] } or a polygon
   { p: [[x, y], ...] }; band is the way down from the dais; at is where the Warden stands. */
const ARENAS = {
  Mabel:    { k: 'mabel', title: "The Warden's Garden", tex: 'tr_allotment', at: [250, 168], floor: { e: [250, 412, 214, 178] }, band: [206, 150, 296, 250] },
  Delphine: { k: 'delphine', title: 'The Great Lock', tex: 'tr_delphine', at: [256, 194], floor: { p: [[118, 222], [396, 222], [474, 604], [48, 604]] }, band: [206, 176, 306, 230] },
  Granger:  { k: 'granger', title: 'The Deep Quarry', tex: 'tr_granger', at: [256, 160], floor: { e: [264, 392, 202, 202] }, band: [212, 140, 302, 210] },
  Orrin:    { k: 'orrin', title: 'The Storm Beacon', tex: 'tr_orrin', at: [256, 166], floor: { e: [258, 366, 222, 200] }, band: [206, 146, 306, 190] },
  Tamsin:   { k: 'tamsin', title: 'The Sky Mill', tex: 'tr_tamsin', at: [256, 214], floor: { r: [52, 238, 466, 560] }, band: [206, 196, 306, 246] },
  Alder:    { k: 'alder', title: 'The Herd Glade', tex: 'tr_alder', at: [258, 190], floor: { e: [262, 402, 212, 208] }, band: [214, 170, 302, 222] },
  Isolde:   { k: 'isolde', title: 'The Lantern Hollow', tex: 'tr_isolde', at: [258, 200], floor: { r: [58, 218, 466, 598] }, band: [206, 180, 306, 226] },
  Rowan:    { k: 'rowan', title: 'The Hearthroot Hall', tex: 'npc_rowan', at: [256, 196], floor: { r: [82, 222, 444, 600] }, band: [206, 178, 306, 230] },
};
const AR_W = 32, AR_H = 48;
let ARENA_GO = null;   // the fight on its way in: { foe, T, A, win }
function arenaIn(A, x, y) {
  const f = A.floor, b = A.band;
  if (x >= b[0] && x <= b[2] && y >= b[1] && y <= b[3]) return true;
  if (f.e) { const [cx, cy, rx, ry] = f.e; return ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1; }
  if (f.r) return x >= f.r[0] && x <= f.r[2] && y >= f.r[1] && y <= f.r[3];
  let inside = false; const P = f.p;   // polygon: even-odd
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) if ((P[i][1] > y) !== (P[j][1] > y) && x < (P[j][0] - P[i][0]) * (y - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0]) inside = !inside;
  return inside;
}
const arenaFor = T => { const A = T && T.label === 'Warden' && ARENAS[T.name]; return A && ASSET['arena_' + A.k] ? A : null; };
const arenaBg = T => { const A = arenaFor(T); return A && ASSET['arenabg_' + A.k]; };
function arenaAction(T) {   // the same test rtTrainer makes for an action battle
  return !T.classic && opts.actionT !== false && !T.phase2 && typeof RTB !== 'undefined' && !RTB.active && scene && scene.p && scene.player && scene.player.active && !scene.sleeping && !(typeof RC !== 'undefined' && RC && RC.sail);
}

const _arBattle = Battle.start;
Battle.start = function (foe, T) {
  const A = arenaFor(T);
  if (!A || !arenaAction(T) || scene.scene.key === 'arena') return _arBattle.call(this, foe, T);
  if (typeof WARDEN_GATE !== 'undefined') { const g = WARDEN_GATE[T.name]; if (g && !(S.crests && S.crests[g[1]]) && settledCount() < g[0]) return _arBattle.call(this, foe, T); }
  const p = scene.p;
  S.arenaRet = { scene: scene.scene.key, x: p.x, y: p.y, dir: p.dir };
  const win = T.onWin; ARENA_GO = { foe, T, A, win: null };
  if (win) T.onWin = () => { ARENA_GO.win = win; };   // the Crest speech waits until you're home
  scene.paused = true; Sound.play('encounter'); const fl = $('flash'); fl.style.opacity = .9; setTimeout(() => fl.style.opacity = 0, 140);
  setTimeout(() => travel(scene, 'arena', { x: 16, y: 40, dir: 'up' }), 260);
};

class ArenaScene extends World {
  constructor() { super('arena'); }
  preload() { const g = ARENA_GO; if (g && !this.textures.exists('arena_' + g.A.k)) this.load.image('arena_' + g.A.k, ASSET['arena_' + g.A.k]); }
  create() {
    this.initWorld(AR_W, AR_H); this.dressed = 1;   // (no seasonal props in here)
    const g = ARENA_GO, cam = this.cameras.main;
    this.add.rectangle(-600, -600, 512 + 1200, 768 + 1200, 0x050505).setOrigin(0).setDepth(-20);
    if (!g) {   // a save from the middle of a fight: back to where it started
      const r = S.arenaRet || { scene: 'house', x: 2, y: 3, dir: 'down' }; delete S.arenaRet;
      this.time.delayedCall(30, () => travel(this, r.scene, { x: r.x, y: r.y, dir: r.dir })); return;
    }
    const A = this.A = g.A; this.g = g;
    this.add.image(0, 0, 'arena_' + A.k).setOrigin(0).setScale(.5).setDepth(-10);
    const tex = this.textures.exists(A.tex) ? A.tex : (this.textures.exists('tr_' + A.k) ? 'tr_' + A.k : 'tr_allotment');
    this.boss = this.add.sprite(A.at[0], A.at[1], tex, 0).setOrigin(.5, 1).setDepth(A.at[1]);
    this.shadow(this.boss, 12, 5);
    this.makePlayer({ x: Math.floor(A.at[0] / T), y: Math.floor((A.at[1] + 150) / T), dir: 'up' });
    cam.setBounds(0, 0, 512, 768); cam.setRoundPixels(true);
    this.arenaZoom(); cam.centerOn(A.at[0], A.at[1] + 80);
    this.scale.on('resize', this.onResize, this); this.events.once('shutdown', () => this.scale.off('resize', this.onResize, this));
    this.setupInput(); updateHUD(); renderHotbar(); this.fadeIn(); FX.ambient(null);
    this.paused = true;
    this.time.delayedCall(450, () => toast(A.title, 1800));
    this.time.delayedCall(900, () => {
      if (!team().some(m => m.hp > 0)) return this.leave();
      this.started = 1; RTB.start(this, g.foe, { x: A.at[0], y: A.at[1] + 40 }, g.T, this.boss);
      if (!RTB.active) { this.started = 0; this.leave(); }
    });
  }
  // a little further out than the towns, so the arena shows round the fight
  arenaZoom() { this.applyZoom(); const cam = this.cameras.main; cam.setZoom(Math.max(cam.zoom * .78, cam.width / 300)); }
  onResize() { this.arenaZoom(); renderHotbar(); }
  passable(x, y) { return !!this.A && arenaIn(this.A, x * T + 8, y * T + 8) && !(Math.floor(this.A.at[0] / T) === x && Math.floor((this.A.at[1] - 4) / T) === y); }
  onTap() { } tapGoal() { } act() { } actFacing() { } arrived() { }
  update(time, dms) {
    super.update(time, dms);
    if (this.started && !this.sleeping && !RTB.active && !Battle.active) this.leave();
  }
  leave() {
    if (this.sleeping || this.gone) return; this.gone = 1;
    const r = S.arenaRet || { scene: 'house', x: 2, y: 3, dir: 'down' }, g = this.g; delete S.arenaRet; ARENA_GO = null;
    travel(this, r.scene, { x: r.x, y: r.y, dir: r.dir });
    if (g && g.win) {   // home again: now the Warden hands over the Crest
      let n = 0; const go = () => { if (scene && scene.scene.key === r.scene && scene.p && !scene.sleeping) { scene.face && scene.boss && scene.face(Math.floor(scene.boss.x / T), Math.floor(scene.boss.y / T)); g.win(); } else if (n++ < 60) setTimeout(go, 100); else g.win(); };
      setTimeout(go, 500);
    }
  }
}
ArenaScene.KEY = 'arena';
var EXTRA_SCENES = (typeof EXTRA_SCENES !== 'undefined' ? EXTRA_SCENES : []).concat([ArenaScene]);
