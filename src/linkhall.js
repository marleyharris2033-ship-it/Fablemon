/* ============================================================ The Link Hall (25 Nov 2026)
   Smallroot's meeting hall for playing with friends (claude/multiplayer-plan.md). It stands on the lawn at the
   top-left of the square (the bench and trees there made way), door onto the street at (21, 21).
   Inside (scene 'linkhall', one painted picture like the Warden arenas: 1024x1536 drawn at half size = 32x48 tiles):
   - Wynn the hall keeper (the Busker's sprite) by the trading counter sets up friendly battles:
     arena (the hall's own circle, or any Warden arena whose Crest you hold), level (your own, or 25/50/75/100),
     team size (1/3/6), how hard the opponent plays, and who you fight: Wynn's mixed team, or a friend's team code.
   - Levels scale your team both ways, with evolutions: a third form at level 50 fights as its second form, a first
     form at 100 fights fully evolved. Moves it couldn't know at that form and level are swapped for ones it could.
   - Everything fights as copies, so nothing in the save changes; only S.link (records) is written.
   - Team codes: "Share my team" makes a code to send a friend; "A friend's team" battles an AI copy of theirs.
   - The scoreboard shows your records. The race corner and live play arrive with the connection (later steps). */
const LINK_DOOR = [21, 21], LINK_LAWN = [17, 16, 25, 21];
// the hall's own battle circle, as an arena (arena.js): Wynn stands at the top of the circle, you below
ARENAS.Link = { k: 'link', title: 'The Link Hall', tex: 'tr_busker', at: [256, 238], floor: { e: [256, 372, 150, 146] }, band: [200, 222, 312, 260] };
ASSET.arena_link = ASSET.linkInt;
const lk = () => (S.link = S.link || { wins: 0, losses: 0, cfg: {} });

// ---------- Smallroot: the building
const _lhBuildTown = buildTown;
buildTown = function () {
  const t = _lhBuildTown(); const [x0, y0, x1, y1] = LINK_LAWN;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) t.blocked[y * TW + x] = 1;
  t.doors[LINK_DOOR.join(',')] = 'link'; return t;
};
const _lhTownCreate = Town.prototype.create;
Town.prototype.create = function () {
  _lhTownCreate.call(this);
  const put = () => {
    if (!this.sys || !this.sys.isActive()) return;
    this.textures.get('link_ext').setFilter(Phaser.Textures.FilterMode.LINEAR);
    const im = this.add.image(LINK_DOOR[0] * T + 8, LINK_DOOR[1] * T + 17, 'link_ext').setOrigin(.5, 1);
    im.setDisplaySize(140, 140 * im.height / im.width).setDepth(LINK_DOOR[1] * T + 15); this.linkImg = im; (this.tall || []).push(im);
  };
  if (this.textures.exists('link_ext')) put(); else { this.load.image('link_ext', ASSET.linkExt); this.load.once('complete', put); this.load.start(); }
};
const _lhTownEnter = Town.prototype.enter;
Town.prototype.enter = function (id) {
  if (id !== 'link') return _lhTownEnter.call(this, id);
  Sound.play('door'); travel(this, 'linkhall', { x: 16, y: 40, dir: 'up' });
};
const _lhTapTarget = Town.prototype.tapTarget;
Town.prototype.tapTarget = function (wx, wy) {
  if (this.linkImg && this.linkImg.getBounds().contains(wx, wy) && !(this.npcs || []).some(n => !n.home && n.spr.getBounds().contains(wx, wy))) return { type: 'door', id: 'link', x: LINK_DOOR[0], y: LINK_DOOR[1] };
  return _lhTapTarget.call(this, wx, wy);
};
if (typeof tmBuildings === 'function') {
  const _lhTmB = tmBuildings;
  tmBuildings = function (key) { const l = _lhTmB(key); if (key === 'town') l.push({ name: 'Link Hall', short: 'Link Hall', x: LINK_DOOR[0] + .5, y: LINK_DOOR[1] - 2.8 }); return l; };
}
if (typeof TOWN_PARENT !== 'undefined') TOWN_PARENT.linkhall = 'town';

// ---------- scaling a Fablemon to a level, with its form
const LINK_PREV = {};
for (const [sp, d] of Object.entries(SPECIES)) if (Array.isArray(d.evo) && typeof d.evo[1] === 'number' && SPECIES[d.evo[0]] && !LINK_PREV[d.evo[0]]) LINK_PREV[d.evo[0]] = [sp, d.evo[1]];
function linkFormAt(sp, lv) {
  let s = sp;
  for (let n = 0; n < 4 && LINK_PREV[s] && lv < LINK_PREV[s][1]; n++) s = LINK_PREV[s][0];   // too young for this form: back a stage
  for (let n = 0; n < 4; n++) { const e = SPECIES[s].evo; if (Array.isArray(e) && typeof e[1] === 'number' && SPECIES[e[0]] && lv >= e[1]) s = e[0]; else break; }
  return s;
}
const linkCanKnow = (sp, lv, id) => (LEARN[sp] || []).some(([l, m]) => m === id && l <= lv) || (typeof SIGNATURE !== 'undefined' && SIGNATURE[sp] && SIGNATURE[sp][1] === id && lv >= SIGNATURE[sp][0]);
// a copy at level lv (0 = as it is): same IVs, held item and nickname; moves kept where that form could know them
function linkScale(m, lv, uid) {
  const c = JSON.parse(JSON.stringify(m)); c.uid = uid; c.loc = 'link'; c.out = false; c.status = null; c.slp = 0;
  if (lv && lv !== c.lv) {
    const sp = linkFormAt(c.sp, lv), down = lv < c.lv || sp !== c.sp;
    c.lv = lv; c.xp = lv ** 3;
    if (down) {
      if (sp !== c.sp && c.fab && typeof fabPic === 'function') { /* (a Fabled one stays Fabled in its other form) */ }
      c.sp = sp; const keep = (m.moves || []).filter(id => MOVES[id] && linkCanKnow(sp, lv, id)), fill = movesAt(sp, lv).filter(id => !keep.includes(id));
      c.moves = [...keep, ...fill].slice(0, 4);
      if (typeof ghSig === 'function' && SIGNATURE[sp] && lv >= SIGNATURE[sp][0]) ghSig(c);
    }
  }
  if (!c.moves || !c.moves.length) c.moves = movesAt(c.sp, c.lv);
  c.hp = monStat(c, 'hp'); return c;
}

// ---------- team codes
function linkTeamCode(mons) {
  const t = mons.map(m => [m.sp, m.lv, m.moves, m.iv, m.held || 0, m.nick || '', m.fab ? 1 : 0]);
  const s = JSON.stringify({ v: 1, n: (S.name || 'A friend').slice(0, 20), t });
  return 'FMT1-' + btoa(unescape(encodeURIComponent(s))).replace(/=+$/, '');
}
function linkReadCode(code) {
  try {
    const raw = String(code || '').trim().replace(/\s+/g, ''); if (!/^FMT1-/.test(raw)) return null;
    const o = JSON.parse(decodeURIComponent(escape(atob(raw.slice(5)))));
    const team = (o.t || []).slice(0, 6).filter(r => SPECIES[r[0]]).map((r, i) => {
      const lv = Math.max(1, Math.min(100, Math.round(+r[1] || 5)));
      const m = { uid: 'lf' + i, sp: r[0], lv, xp: lv ** 3, nick: String(r[5] || '').slice(0, 14), moves: (r[2] || []).filter(id => MOVES[id]).slice(0, 4), iv: r[3] && typeof r[3] === 'object' ? r[3] : rollIV() };
      if (r[4] && ITEMS[r[4]]) m.held = r[4]; if (r[6]) m.fab = 1; if (!m.moves.length) m.moves = movesAt(m.sp, lv); m.hp = monStat(m, 'hp'); return m;
    });
    return team.length ? { name: String(o.n || 'A friend').slice(0, 20), team } : null;
  } catch (e) { return null; }
}

// ---------- the hall
const LH_W = 32, LH_H = 48;
// world px (the picture at half size): the floor, and what stands on it
const LH_FLOOR = [[22, 250, 495, 645], [168, 178, 355, 250], [214, 645, 300, 700]];
const LH_BLOCK = [
  [70, 258, 126, 296], [386, 258, 442, 296], [66, 510, 136, 554], [376, 510, 446, 554],   // benches
  [44, 256, 68, 298], [444, 256, 468, 298], [138, 522, 162, 558], [350, 522, 374, 558],   // potted plants
  [22, 278, 48, 342], [464, 278, 492, 342], [22, 444, 48, 512], [466, 444, 492, 512],    // lamps
  [30, 318, 138, 442], [374, 318, 482, 442],                                             // the two platforms
  [12, 572, 82, 650], [430, 572, 500, 650],                                              // corner planters
];
const LH_KEEPER = [9, 16];   // Wynn's tile, at the end of the trading counter
function lhOpen(x, y) {
  const wx = x * T + 8, wy = y * T + 8;
  if (!LH_FLOOR.some(([a, b, c, d]) => wx >= a && wx <= c && wy >= b && wy <= d)) return false;
  return !LH_BLOCK.some(([a, b, c, d]) => wx >= a && wx <= c && wy >= b && wy <= d);
}
class LinkHallScene extends World {
  constructor() { super('linkhall'); }
  preload() { if (!this.textures.exists('link_int')) this.load.image('link_int', ASSET.linkInt); }
  create() {
    this.initWorld(LH_W, LH_H); this.dressed = 1;
    const cam = this.cameras.main;
    this.add.rectangle(-600, -600, 512 + 1200, 768 + 1200, 0x140c06).setOrigin(0).setDepth(-20);
    this.textures.get('link_int').setFilter(Phaser.Textures.FilterMode.LINEAR);
    this.add.image(0, 0, 'link_int').setOrigin(0).setScale(.5).setDepth(-10);
    const tex = this.textures.exists('tr_busker') ? 'tr_busker' : 'tr_rambler';
    this.keeper = this.add.sprite(LH_KEEPER[0] * T + 8, LH_KEEPER[1] * T + 15, tex, 0).setOrigin(.5, 1).setDepth(LH_KEEPER[1] * T + 15);
    this.shadow(this.keeper, 12, 5);
    this.board();
    const sp = S.spawn && S.spawn.scene === 'linkhall' ? S.spawn : { x: 16, y: 40, dir: 'up' };
    this.makePlayer(sp);
    cam.setBounds(0, 0, 512, 768); cam.startFollow(this.player, true, 1, 1); cam.setRoundPixels(true);
    this.hallZoom(); this.scale.on('resize', this.onResize, this); this.events.once('shutdown', () => this.scale.off('resize', this.onResize, this));
    this.setupInput(); Sound.theme('field'); updateHUD(); renderHotbar(); FX.ambient(null); this.fadeIn();
    if (!lk().met) setTimeout(() => toast('The Link Hall. Wynn by the trading counter sets up battles.', 3200), 600);
  }
  hallZoom() { this.applyZoom(); const cam = this.cameras.main; cam.setZoom(Math.max(cam.zoom * .85, cam.width / 340)); }   // a little further out, so you see the room
  onResize() { this.hallZoom(); renderHotbar(); }
  // the scoreboard's four slates
  board() {
    const L = lk(), g = S.gauntlet || {}, sty = { fontFamily: 'ui-rounded, Nunito, system-ui, sans-serif', fontStyle: 'bold', fontSize: '6px', color: '#f4ecd0', align: 'center', resolution: 12, lineSpacing: -1 };
    const cells = [['BATTLES', `${L.wins} won`], ['LOST', `${L.losses}`], ['GAUNTLET', g.best ? `${g.best} / 8` : '—'], ['FASTEST', g.fastest ? gauntTime(g.fastest) : '—']];
    (this.slates || []).forEach(t => t.destroy());
    this.slates = cells.map(([a, b], i) => this.add.text([191, 234, 277, 321][i], 102, `${a}\n${b}`, sty).setOrigin(.5).setDepth(5));
  }
  passable(x, y) { return x >= 0 && y >= 0 && x < LH_W && y < LH_H && lhOpen(x, y) && !(x === LH_KEEPER[0] && y === LH_KEEPER[1]); }
  thing(x, y) {
    if (x === LH_KEEPER[0] && y === LH_KEEPER[1]) return { type: 'keeper', x, y };
    const wx = x * T + 8, wy = y * T + 8;
    if (wy < 250 && wx < 168) return { type: 'counter', x, y };
    if (wy < 250 && wx > 355) return { type: 'races', x, y };
    if (wy < 178) return { type: 'board', x, y };
    return null;
  }
  onTap(wx, wy) {
    if (this.paused || this.sleeping || controlMode() !== 'tap') return;
    const x = Math.floor(wx / T), y = Math.floor(wy / T), p = this.p;
    const t = this.keeper.getBounds().contains(wx, wy) ? this.thing(...LH_KEEPER) : this.thing(x, y);
    if (t) {
      const adj = (a, b) => Math.abs(a - t.x) + Math.abs(b - t.y) === 1 || (t.type !== 'keeper' && this.thing(a, b - 1) && this.thing(a, b - 1).type === t.type);
      if (adj(p.x, p.y) && !p.moving) { this.face(t.x, Math.min(t.y, p.y - 1)); return this.act(t); }
      const path = this.path(adj); if (path) { p.path = path; p.pending = t; } return;
    }
    if (this.passable(x, y)) { const path = this.path((a, b) => a === x && b === y); if (path) { p.path = path; p.pending = null; } }
  }
  tapGoal() { }
  actFacing() {
    const p = this.p; if (p.moving || this.paused || p.busy > 0) return;
    const [dx, dy] = DV[p.dir], t = this.thing(p.x + dx, p.y + dy); if (t) this.act(t);
  }
  act(t) {
    this.p.busy = .3;
    if (t.type === 'keeper') { this.keeper.setFrame(DIRS.indexOf(this.p.y > LH_KEEPER[1] ? 'down' : this.p.x < LH_KEEPER[0] ? 'left' : 'right') * 4); return linkKeeper(); }
    if (t.type === 'counter') return linkTrade();
    if (t.type === 'races') return linkRaces();
    if (t.type === 'board') return linkRecords();
  }
  arriveHook(x, y) { if (y >= 42) travel(this, 'town', { x: LINK_DOOR[0], y: LINK_DOOR[1] + 1, dir: 'down' }); }
}
LinkHallScene.KEY = 'linkhall';
var EXTRA_SCENES = (typeof EXTRA_SCENES !== 'undefined' ? EXTRA_SCENES : []).concat([LinkHallScene]);

const WYNN = (t, f = 0) => ({ who: 'trainer', name: 'Wynn', img: trainerPic('busker', f), t });
function linkKeeper() {
  const L = lk();
  if (!L.met) { L.met = 1; return Talk.say([WYNN("Welcome to the Link Hall! I'm Wynn. I keep the place tidy and the scoreboard honest.", 1),
    WYNN("Folk come here to battle their friends. Pick an arena, pick a level, and everyone's Fablemon grow or shrink to match. Evolutions and all!"),
    WYNN("Nothing you do in here sticks, mind. Faint, win, lose: you walk out with your team exactly as you brought it.", 1)], linkMenu); }
  linkMenu();
}
function linkMenu() {
  openModal('The Link Hall', `<p>What would you like to do?</p>
    <button class="btn gold" data-a="battle" style="width:100%;margin:3px 0">⚔️ Set up a battle</button>
    <button class="btn" data-a="trade" style="width:100%;margin:3px 0">🔁 Trade by code</button>
    <button class="btn" data-a="race" style="width:100%;margin:3px 0">🏁 Time trials and ghost races</button>
    <button class="btn" data-a="share" style="width:100%;margin:3px 0">📤 Share my team as a code</button>
    <button class="btn" data-a="rec" style="width:100%;margin:3px 0">🏆 Records</button>
    <p style="font-size:12px;opacity:.75;margin-top:6px">Coming soon: playing live with a friend.</p>`, a => {
    if (a === 'trade') return linkTrade();
    if (a === 'race') return linkRaces();
    if (a === 'battle') return linkSetup();
    if (a === 'share') return linkShare();
    if (a === 'rec') return linkRecords();
  });
}
function linkRecords() {
  const L = lk(), g = S.gauntlet || {};
  openModal('Scoreboard', `<p>Link Hall battles: <b>${L.wins}</b> won, <b>${L.losses}</b> lost${L.best ? ` · best streak ${L.best}` : ''}.</p>
    <p>Warden Gauntlet: ${g.best ? `best <b>${g.best} of 8</b>${g.clears ? ` · cleared ${g.clears}× · fastest ${gauntTime(g.fastest)}` : ''}${g.medal ? ' · 🏅' : ''}` : 'not tried yet (ask Rowan once you hold the Hearth Crest)'}.</p>
    <div class="row"><button class="btn" data-a="ok">Close</button></div>`, () => closeModal());
}
function linkShare(pre) {
  const all = S.mons.slice().sort((a, b) => (a.loc === 'team' ? 0 : 1) - (b.loc === 'team' ? 0 : 1) || b.lv - a.lv);
  const pick = new Set(pre || all.filter(m => m.loc === 'team').slice(0, 6).map(m => m.uid));
  const draw = () => {
    const chosen = all.filter(m => pick.has(m.uid)), code = chosen.length ? linkTeamCode(chosen) : '';
    openModal('Share my team', `<p>Pick up to 6, then send the code to a friend (WhatsApp, a message, anything). They paste it at their Link Hall to battle a copy of your team. Nothing leaves your save.</p>
      <div style="max-height:30vh;overflow:auto">${all.map(m => linkRow(m, pick.has(m.uid) ? 'In' : '')).join('')}</div>
      <textarea readonly style="width:100%;height:64px;font-size:11px;margin-top:6px" onclick="this.select()">${code}</textarea>
      <div class="row"><button class="btn" data-a="back">Back</button><button class="btn gold" data-a="copy" ${code ? '' : 'disabled'}>Copy code</button></div>`, (a, d) => {
      if (a === 't') { const u = linkUid(d.u); if (pick.has(u)) pick.delete(u); else if (pick.size < 6) pick.add(u); return draw(); }
      if (a === 'back') return linkMenu();
      if (a === 'copy') { const tx = document.querySelector('#mBody textarea'); tx.select(); (navigator.clipboard ? navigator.clipboard.writeText(code) : Promise.reject()).then(() => toast('Team code copied!'), () => { try { document.execCommand('copy'); toast('Team code copied!'); } catch (e) { toast('Select the code and copy it.'); } }); }
    });
  };
  draw();
}
const linkUid = u => isNaN(+u) ? u : +u;
const linkRow = (m, tag, col) => `<button class="btn" data-a="t" data-u="${m.uid}" style="display:flex;align-items:center;gap:6px;width:100%;margin:3px 0;padding:3px 6px;text-align:left;${tag ? 'background:#cfe8c0;border-color:#3a7a2a' : ''}"><img src="${monPicOf(m)}" style="width:30px;height:30px;image-rendering:pixelated">${monName(m)} <small style="opacity:.75">Lv ${m.lv}</small><b style="margin-left:auto;font-size:12px">${tag}</b></button>`;

// ---------- setting up a battle
const LINK_ARENAS = [['Link', null], ['Mabel', 'root'], ['Delphine', 'brook'], ['Granger', 'stone'], ['Orrin', 'spark'], ['Tamsin', 'gale'], ['Alder', 'wild'], ['Isolde', 'shade'], ['Rowan', 'hearth']];
const LINK_DIFF = { easy: ['Gentle', .08, .45], normal: ['Even', .28, .75], hard: ['Fierce', .55, .95] };
function linkArenas() { return LINK_ARENAS.filter(([n, c]) => (!c || (S.crests && S.crests[c])) && ARENAS[n] && ASSET['arena_' + ARENAS[n].k]); }
function linkSetup() {
  const L = lk(), C = L.cfg = Object.assign({ arena: 'Link', lv: 50, size: 3, diff: 'normal', foe: 'wynn', code: '' }, L.cfg);
  const all = S.mons.slice().sort((a, b) => (a.loc === 'team' ? 0 : 1) - (b.loc === 'team' ? 0 : 1) || b.lv - a.lv);
  if (!all.length) return toast('You need a Fablemon to battle!');
  let pick = (C.team || []).filter(u => all.some(m => m.uid === u));
  if (!pick.length) pick = all.filter(m => m.loc === 'team').map(m => m.uid);
  const chip = (a, k, v, t) => `<button class="btn ${C[k] === v ? 'gold' : ''}" data-a="${a}" data-k="${k}" data-v="${v}" style="flex:1 1 auto;padding:4px 6px;font-size:12px;margin:2px">${t}</button>`;
  const draw = () => {
    pick = pick.slice(0, C.size);
    const friend = C.foe === 'code' ? linkReadCode(C.code) : null;
    const ok = pick.length && (C.foe !== 'code' || friend);
    openModal('Set up a battle', `
      <p style="margin:2px 0"><b>Opponent</b></p><div style="display:flex;flex-wrap:wrap">${chip('o', 'foe', 'wynn', "Wynn's mixed team")}${chip('o', 'foe', 'code', "A friend's team code")}</div>
      ${C.foe === 'code' ? `<textarea data-a="code" placeholder="Paste your friend's FMT1- code here" style="width:100%;height:52px;font-size:11px">${C.code || ''}</textarea><p style="font-size:12px;margin:2px 0">${friend ? `✅ <b>${friend.name}</b>'s team: ${friend.team.map(m => monName(m)).join(', ')}` : C.code ? '❌ That code doesn\'t look right.' : ''}</p>` : ''}
      <p style="margin:6px 0 2px"><b>Arena</b></p><div style="display:flex;flex-wrap:wrap">${linkArenas().map(([n]) => chip('o', 'arena', n, n === 'Link' ? 'Link Hall' : ARENAS[n].title)).join('')}</div>
      <p style="margin:6px 0 2px"><b>Level</b> <small>(everyone grows or shrinks to it, evolutions included)</small></p><div style="display:flex;flex-wrap:wrap">${chip('n', 'lv', 0, 'Your own')}${[25, 50, 75, 100].map(v => chip('n', 'lv', v, 'Lv ' + v)).join('')}</div>
      <p style="margin:6px 0 2px"><b>Team size</b></p><div style="display:flex;flex-wrap:wrap">${[1, 3, 6].map(v => chip('n', 'size', v, v + (v === 1 ? ' Fablemon' : ' each'))).join('')}</div>
      <p style="margin:6px 0 2px"><b>How they play</b></p><div style="display:flex;flex-wrap:wrap">${Object.entries(LINK_DIFF).map(([k, d]) => chip('o', 'diff', k, d[0])).join('')}</div>
      <p style="margin:6px 0 2px"><b>Your team</b> ${pick.length}/${C.size}</p>
      <div style="max-height:26vh;overflow:auto">${all.map(m => { const i = pick.indexOf(m.uid); return linkRow(m, i >= 0 ? `#${i + 1}${C.lv ? ` → ${SPECIES[linkFormAt(m.sp, C.lv)].name} Lv ${C.lv}` : ''}` : ''); }).join('')}</div>
      <div class="row"><button class="btn" data-a="back">Back</button><button class="btn gold" data-a="go" ${ok ? '' : 'disabled'}>Battle!</button></div>`, (a, d, el) => {
      if (a === 'o') { C[d.k] = d.v; return draw(); }
      if (a === 'n') { C[d.k] = +d.v; return draw(); }
      if (a === 'code') { C.code = el.value; clearTimeout(linkSetup.t); linkSetup.t = setTimeout(draw, 500); return; }
      if (a === 't') { const u = linkUid(d.u), i = pick.indexOf(u); if (i >= 0) pick.splice(i, 1); else if (pick.length < C.size) pick.push(u); else { pick.pop(); pick.push(u); } C.team = pick.slice(); return draw(); }
      if (a === 'back') return linkMenu();
      if (a === 'go' && ok) { C.team = pick.slice(); closeModal(); linkBattle(pick.map(u => all.find(m => m.uid === u)), friend); }
    });
    const ta = document.querySelector('#mBody textarea[data-a=code]'); if (ta && C.code === '') ta.focus();
  };
  draw();
}
// Wynn's team: a mix of what the valley's Wardens use, different every time
function linkWynnTeam(n, lv) {
  const pool = [];
  for (const name of GAUNT_ORDER) for (const r of gauntTeamOf(name)) if (SPECIES[r[0]] && !pool.includes(r[0])) pool.push(r[0]);
  for (const s of ['flintuck', 'cloverclasp', 'hedglet', 'mortoad']) if (SPECIES[s] && !pool.includes(s)) pool.push(s);
  const out = [];
  while (out.length < n && pool.length) { const s = pool.splice(Math.floor(Math.random() * pool.length), 1)[0], sp = linkFormAt(s, lv); if (!out.some(m => m.sp === sp)) out.push(trainerMon(sp, lv)); }
  return out;
}
function linkBattle(mine, friend) {
  const C = lk().cfg, A = ARENAS[C.arena] || ARENAS.Link, D = LINK_DIFF[C.diff] || LINK_DIFF.normal;
  const lvMine = C.lv, me = mine.map((m, i) => linkScale(m, lvMine, 'lk' + i));
  const foeLv = C.lv || Math.round(me.reduce((a, m) => a + m.lv, 0) / me.length);
  const foes = friend ? friend.team.slice(0, C.size).map((m, i) => linkScale(m, C.lv, 'lo' + i)) : linkWynnTeam(C.size, foeLv);
  const T = friend ? { label: '', name: friend.name, team: foes, prize: 0, intro: [`Wynn is playing ${friend.name}'s team!`, `${monName(foes[0])} steps into the arena!`] }
    : { label: 'Keeper', name: 'Wynn', team: foes, prize: 0, intro: ['Wynn: "Right then, let\'s see what you\'ve got!"', `Wynn sent out ${SPECIES[foes[0].sp].name}!`] };
  const p = scene.p; S.arenaRet = { scene: scene.scene.key, x: p.x, y: p.y, dir: p.dir };
  ARENA_GO = { foe: foes[0], T, A, win: null, hold: 1, rt: { myTeam: me, noItems: true, skill: [D[1], D[2]], onEnd: out => linkAfter(out, friend) } };
  scene.paused = true; Sound.play('encounter'); const fl = $('flash'); fl.style.opacity = .9; setTimeout(() => fl.style.opacity = 0, 140);
  setTimeout(() => travel(scene, 'arena', { x: 16, y: 40, dir: 'up' }), 260);
}
function linkAfter(out, friend) {
  const L = lk(), won = out === 'win';
  if (won) { L.wins++; L.streak = (L.streak || 0) + 1; L.best = Math.max(L.best || 0, L.streak); Sound.victory && Sound.victory(); } else { L.losses++; L.streak = 0; }
  const who = friend ? `${friend.name}'s team` : 'Wynn';
  const home = () => { const sc = scene; if (sc && sc.scene.key === 'arena' && sc.g) { sc.g.hold = 0; sc.leave(); } };
  setTimeout(() => openModal(won ? 'You won!' : 'You lost!', `<p>${won ? `You beat ${who}!${L.streak > 1 ? ` That's ${L.streak} in a row.` : ''}` : `${who} got the better of you this time.`}</p><p style="font-size:12px;opacity:.75">Your Fablemon are just as you brought them.</p><div class="row"><button class="btn gold" data-a="ok">Back to the hall</button></div>`, () => closeModal(), home), won ? 900 : 600);
}

/* ============================================================ Codes for trades and ghost races (25 Nov 2026)
   Both travel as text (WhatsApp, a message...), so nothing needs a connection.
   - Trades: FMX1-. The sender's Fablemon waits at the counter (S.link.out) until the friend's reply code comes back;
     the friend takes it at once and sends one of theirs (or nothing, for a gift) in the reply. A code can only be
     taken once in a save (S.link.got), and a reply only lands for the offer it answers. Cancelling an offer brings
     the Fablemon back (only safe if the friend hasn't used the code: the game can't know).
   - Ghost races: FMG1-<header>.<path>. The header has the track, its seed, the level cap, the racer and the time;
     the path is the run sampled 8 times a second, as 2-character steps. */
const b64e = o => btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/=+$/, '');
const b64d = s => JSON.parse(decodeURIComponent(escape(atob(s))));
const linkSum = str => { let h = 7; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0; return (h % 46656).toString(36).padStart(3, '0'); };
const linkId = () => Math.random().toString(36).slice(2, 10);
const linkCopyBtn = code => { const tx = document.querySelector('#mBody textarea'); if (tx) tx.select(); (navigator.clipboard ? navigator.clipboard.writeText(code) : Promise.reject()).then(() => toast('Code copied!'), () => { try { document.execCommand('copy'); toast('Code copied!'); } catch (e) { toast('Select the code and copy it.'); } }); };
const linkCodeBox = code => `<textarea readonly style="width:100%;height:70px;font-size:11px;margin-top:6px" onclick="this.select()">${code}</textarea>`;

// ---------- trading
const LINK_SKIP = ['uid', 'loc', 'out', 'status', 'slp', 'pp', 'job', 'hp'];
function linkPack(m) { const o = {}; for (const [k, v] of Object.entries(m)) if (!LINK_SKIP.includes(k)) o[k] = v; return o; }
function linkUnpack(o, from) {
  if (!o || !SPECIES[o.sp]) return null;
  const m = { ...o, uid: S.nextId++, lv: Math.max(1, Math.min(100, Math.round(+o.lv || 5))), bond: 0, ot: String(from || '').slice(0, 20), out: false };
  m.xp = Math.max(m.xp || 0, m.lv ** 3); m.moves = (o.moves || []).filter(id => MOVES[id]).slice(0, 4); if (!m.moves.length) m.moves = movesAt(m.sp, m.lv);
  if (!m.iv || typeof m.iv !== 'object') m.iv = rollIV(); if (m.held && !ITEMS[m.held]) delete m.held;
  m.loc = team().length < (typeof TEAM_MAX !== 'undefined' ? TEAM_MAX : 6) ? 'team' : 'box'; m.hp = monStat(m, 'hp'); return m;
}
function linkTradeCode(k, id, mon) { const body = b64e({ v: 1, k, id, n: (S.name || 'A friend').slice(0, 20), m: mon ? linkPack(mon) : null }); return `FMX1-${linkSum(body)}${body}`; }
function linkReadTrade(code) {
  try { const raw = String(code || '').replace(/\s+/g, ''); if (!/^FMX1-/.test(raw)) return null; const sum = raw.slice(5, 8), body = raw.slice(8);
    if (linkSum(body) !== sum) return { bad: 'That code got cut off or changed on the way. Ask for it again.' };
    const o = b64d(body); return o && (o.k === 'offer' || o.k === 'reply') && o.id ? o : null; } catch (e) { return null; }
}
const linkFollow = () => { if (scene && scene.refreshFollower) try { scene.refreshFollower(); } catch (e) { } if (typeof refreshTeamBtn === 'function') try { refreshTeamBtn(); } catch (e) { } };
function linkTrade() {
  const L = lk(), out = L.out;
  openModal('Trading counter', `<p>Trade with a friend by sending codes to each other: no connection needed.</p>
    ${out ? `<div class="shoprow" style="align-items:center"><img src="${monPicOf(out.m)}" style="width:36px;height:36px;image-rendering:pixelated"><div class="g"><b>${monName(out.m)}</b> is waiting at the counter<small style="display:block">Send your code to your friend, then paste their reply here.</small></div></div>
      <button class="btn" data-a="again" style="width:100%;margin:3px 0">📋 Show my code again</button>` : `<button class="btn gold" data-a="send" style="width:100%;margin:3px 0">📤 Offer one of my Fablemon</button>`}
    <button class="btn ${out ? 'gold' : ''}" data-a="paste" style="width:100%;margin:3px 0">📥 Paste a friend's code</button>
    ${out ? `<button class="btn" data-a="cancel" style="width:100%;margin:3px 0;font-size:12px">Cancel my offer and take ${monName(out.m)} back</button>` : ''}
    <div class="row"><button class="btn" data-a="back">Back</button></div>`, a => {
    if (a === 'back') return linkMenu();
    if (a === 'send') return linkOffer();
    if (a === 'again') return linkShowCode('Your trade offer', `Send this to your friend. When they paste it, they'll send a reply code back for you to paste here.`, linkTradeCode('offer', out.id, out.m), linkTrade);
    if (a === 'paste') return linkPaste();
    if (a === 'cancel') return openModal('Cancel the offer?', `<p>Only do this if your friend <b>hasn't</b> used your code yet. If they have, you'd both end up with ${monName(out.m)}, which isn't fair on anyone.</p><div class="row"><button class="btn" data-a="no">Keep waiting</button><button class="btn gold" data-a="yes">Take ${monName(out.m)} back</button></div>`, b => {
      if (b !== 'yes') return linkTrade(); const m = linkUnpack(out.m, out.m.ot); m.bond = out.m.bond || 0; m.ot = out.m.ot; if (!m.ot) delete m.ot; S.mons.push(m); delete L.out; linkFollow(); toast(`${monName(m)} is back with you.`); linkTrade(); });
  });
}
function linkShowCode(title, text, code, back) {
  openModal(title, `<p>${text}</p>${linkCodeBox(code)}<div class="row"><button class="btn" data-a="back">Done</button><button class="btn gold" data-a="copy">Copy code</button></div>`, a => { if (a === 'copy') return linkCopyBtn(code); back(); });
}
function linkPickOne(title, text, onPick, extra = '') {
  const all = S.mons.slice().sort((a, b) => (a.loc === 'team' ? 0 : 1) - (b.loc === 'team' ? 0 : 1) || b.lv - a.lv);
  openModal(title, `<p>${text}</p><div style="max-height:46vh;overflow:auto">${all.map(m => linkRow(m, m.loc === 'team' ? 'Team' : '')).join('')}</div>${extra}<div class="row"><button class="btn" data-a="back">Back</button></div>`, (a, d) => {
    if (a === 't') { const m = S.mons.find(x => x.uid === linkUid(d.u)); if (m) onPick(m); return; }
    onPick(null, a);
  });
}
const linkCanGive = m => m.loc === 'team' && team().length <= 1 ? `${monName(m)} is the only Fablemon in your team. Put another one in your team first.` : '';
function linkOffer() {
  linkPickOne('Offer a Fablemon', 'Who would you like to trade? They wait safely at the counter until your friend replies.', (m, a) => {
    if (!m) return linkTrade(); const why = linkCanGive(m); if (why) return toast(why, 3000);
    openModal('Offer ' + monName(m) + '?', `<p><b>${monName(m)}</b> (Lv ${m.lv}) will wait at the counter. You'll get a code to send your friend.</p><div class="row"><button class="btn" data-a="no">Back</button><button class="btn gold" data-a="yes">Offer ${monName(m)}</button></div>`, b => {
      if (b !== 'yes') return linkOffer();
      const L = lk(); L.out = { id: linkId(), m: JSON.parse(JSON.stringify(m)) }; S.mons = S.mons.filter(x => x !== m); linkFollow(); if (typeof autoSave === 'function') autoSave();
      linkShowCode('Your trade offer', `Send this to your friend. When they paste it at their Link Hall, they'll get a reply code for you to paste here.`, linkTradeCode('offer', L.out.id, L.out.m), linkTrade);
    });
  });
}
function linkPaste() {
  openModal("Paste a friend's code", `<textarea data-a="code" placeholder="Paste the FMX1- code here" style="width:100%;height:80px;font-size:11px"></textarea><p id="lkMsg" style="font-size:12px;margin:4px 0"></p><div class="row"><button class="btn" data-a="back">Back</button><button class="btn gold" data-a="go">Use code</button></div>`, a => {
    if (a === 'back') return linkTrade(); if (a !== 'go') return;
    const L = lk(), o = linkReadTrade(document.querySelector('#mBody textarea').value), msg = t => { document.getElementById('lkMsg').textContent = t; };
    if (!o) return msg("❌ That isn't a trade code.");
    if (o.bad) return msg('❌ ' + o.bad);
    if (L.out && L.out.id === o.id && o.k === 'offer') return msg("That's your own offer! Send it to your friend instead.");
    L.got = L.got || {};
    if (o.k === 'offer') {
      if (L.got[o.id]) return msg("You've already taken this trade.");
      const theirs = linkUnpack(o.m, o.n); if (!theirs) return msg("❌ Something in that code doesn't look right.");
      S.nextId--;   // (numbered properly when it arrives)
      return linkAccept(o, theirs);
    }
    if (!L.out || L.out.id !== o.id) return msg(L.got[o.id] ? 'That trade is already done.' : "That reply isn't for the offer you're waiting on.");
    const mine = L.out.m; delete L.out; L.got[o.id] = 1;
    const got = o.m ? linkUnpack(o.m, o.n) : null; if (got) S.mons.push(got); linkFollow(); if (typeof autoSave === 'function') autoSave(); Sound.play('gotcha');
    openModal('Trade complete!', got ? `<div style="text-align:center"><img src="${monPicOf(got, 'front')}" style="width:120px;height:120px;image-rendering:pixelated"><p><b>${o.n}</b> sent you <b>${monName(got)}</b> (Lv ${got.lv}) for ${monName(mine)}. Look after them!</p></div>` : `<p><b>${o.n}</b> took ${monName(mine)} as a gift. They said thank you!</p>`,
      () => closeModal()); document.getElementById('mBody').insertAdjacentHTML('beforeend', '<div class="row"><button class="btn gold" data-a="ok">Lovely</button></div>');
  });
}
function linkAccept(o, theirs) {
  const sp = SPECIES[theirs.sp];
  linkPickOne(`${o.n} is offering ${monName(theirs)}`, `<span style="display:flex;align-items:center;gap:8px"><img src="${monPicOf(theirs)}" style="width:48px;height:48px;image-rendering:pixelated"><span><b>${monName(theirs)}</b> · ${sp.type}${sp.type2 ? '/' + sp.type2 : ''} · Lv ${theirs.lv}<br><small>${theirs.moves.map(id => MOVES[id].name).join(', ')}</small></span></span>Pick one of yours to send back:`, (m, a) => {
    if (a === 'gift') return linkDoAccept(o, null);
    if (!m) return linkPaste(); const why = linkCanGive(m); if (why) return toast(why, 3000);
    openModal('Trade?', `<p>Send <b>${monName(m)}</b> (Lv ${m.lv}) and get <b>${monName(theirs)}</b> (Lv ${theirs.lv})?</p><div class="row"><button class="btn" data-a="no">Back</button><button class="btn gold" data-a="yes">Trade</button></div>`, b => b === 'yes' ? linkDoAccept(o, m) : linkAccept(o, theirs));
  }, `<button class="btn" data-a="gift" style="width:100%;margin:6px 0 0;font-size:12px">🎁 Take it as a gift and send nothing back</button>`);
}
function linkDoAccept(o, mine) {
  const L = lk(); L.got = L.got || {}; if (L.got[o.id]) return toast("You've already taken this trade.");
  const got = linkUnpack(o.m, o.n); L.got[o.id] = 1;
  if (mine) S.mons = S.mons.filter(x => x !== mine);
  S.mons.push(got); linkFollow(); if (typeof autoSave === 'function') autoSave(); Sound.play('gotcha');
  const code = linkTradeCode('reply', o.id, mine);
  openModal('Trade complete!', `<div style="text-align:center"><img src="${monPicOf(got, 'front')}" style="width:120px;height:120px;image-rendering:pixelated"><p><b>${monName(got)}</b> is yours!${mine ? ` ${monName(mine)} is off to ${o.n}.` : ''}</p></div>
    <p><b>Now send this reply code back to ${o.n}</b>, so ${mine ? `they get ${monName(mine)}` : 'their trade finishes'}:</p>${linkCodeBox(code)}
    <div class="row"><button class="btn" data-a="back">Done</button><button class="btn gold" data-a="copy">Copy code</button></div>`, a => { if (a === 'copy') return linkCopyBtn(code); closeModal(); });
}

// ---------- time trials and ghost races
const GH_AB = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
function ghostEncode(pts) { let px = 0, py = 0, out = ''; for (const [x, y] of pts) { for (const v of [x - px, y - py]) { const n = Math.max(0, Math.min(4095, v + 2048)); out += GH_AB[n >> 6] + GH_AB[n & 63]; } px = x; py = y; } return out; }
function ghostDecode(str) { const pts = []; let px = 0, py = 0; for (let i = 0; i + 3 < str.length; i += 4) { const v = k => GH_AB.indexOf(str[i + k]) * 64 + GH_AB.indexOf(str[i + k + 1]) - 2048; px += v(0); py += v(2); pts.push([px, py]); } return pts; }
function ghostCode(run) {
  const head = b64e({ v: 1, n: (S.name || 'A friend').slice(0, 20), tk: run.track, sd: run.seed, cap: run.cap, sp: run.sp, nk: run.nick || '', ms: run.ms, c: run.pts.length }), path = ghostEncode(run.pts);
  return `FMG1-${linkSum(head + path)}${head}.${path}`;
}
function ghostRead(code) {
  try { const raw = String(code || '').replace(/\s+/g, ''); if (!/^FMG1-/.test(raw)) return null; const sum = raw.slice(5, 8), rest = raw.slice(8), dot = rest.indexOf('.');
    if (dot < 0 || linkSum(rest.slice(0, dot) + rest.slice(dot + 1)) !== sum) return { bad: 'That code got cut off or changed on the way. Ask for it again.' };
    const h = b64d(rest.slice(0, dot)), pts = ghostDecode(rest.slice(dot + 1));
    if (!DERBY_TRACKS[h.tk] || !SPECIES[h.sp] || pts.length !== h.c || !(h.ms > 0)) return { bad: "That ghost is for a track or Fablemon this game doesn't know." };
    return { who: String(h.n || 'A friend').slice(0, 20), track: h.tk, seed: h.sd | 0, cap: Math.max(1, Math.min(100, h.cap | 0 || 100)), sp: h.sp, nick: h.nk, ms: +h.ms, pts };
  } catch (e) { return null; }
}
const linkTracks = () => [...new Set(DERBY_CUPS.filter(c => { try { return c.unlock(); } catch (e) { return false; } }).map(c => c.track))].filter(k => DERBY_TRACKS[k]);
const LINK_CAPS = [[100, 'Your own'], [25, 'Cap 25'], [50, 'Cap 50'], [75, 'Cap 75']];
function linkRaces() {
  const L = lk(), best = L.trial || {};
  const rows = Object.entries(best).filter(([k]) => DERBY_TRACKS[k]).map(([k, b]) => `<li>${DERBY_TRACKS[k].name}: <b>${fmtLap(b.ms)}</b> <small>(${b.who}${b.cap < 100 ? `, cap ${b.cap}` : ''})</small></li>`).join('');
  openModal('Race corner', `<p>Race a track on your own against the clock, then share your run as a code. Your friend races your ghost, a see-through copy of your run, and can send theirs back.</p>
    <button class="btn gold" data-a="trial" style="width:100%;margin:3px 0">⏱️ Time trial</button>
    <button class="btn" data-a="ghost" style="width:100%;margin:3px 0">👻 Race a friend's ghost</button>
    ${rows ? `<p style="margin:8px 0 2px"><b>Your best times</b></p><ul style="margin:0;padding-left:18px;font-size:13px">${rows}</ul>` : ''}${L.ghostWins ? `<p style="font-size:13px">Ghosts beaten: <b>${L.ghostWins}</b></p>` : ''}
    <div class="row"><button class="btn" data-a="back">Back</button></div>`, a => {
    if (a === 'back') return closeModal();
    if (a === 'trial') return linkTrialSetup();
    if (a === 'ghost') return linkGhostPaste();
  });
}
function linkRacerPick(title, head, onPick, back) {
  const all = S.mons.filter(m => !SPECIES[m.sp].legend).sort((a, b) => (a.loc === 'team' ? 0 : 1) - (b.loc === 'team' ? 0 : 1) || b.lv - a.lv);
  if (!all.length) return toast('You need a Fablemon to race!');
  openModal(title, `${head}<p style="margin:6px 0 2px"><b>Who's racing?</b></p><div style="max-height:34vh;overflow:auto">${all.map(m => linkRow(m, '')).join('')}</div><div class="row"><button class="btn" data-a="back">Back</button></div>`, (a, d) => {
    if (a === 't') { const m = S.mons.find(x => x.uid === linkUid(d.u)); if (m) { closeModal(); onPick(m); } return; }
    if (a === 'back') return back(); onPick(null, a, d);
  });
}
function linkTrialSetup() {
  const L = lk(), C = L.tcfg = Object.assign({ track: linkTracks()[0] || 'meadow', cap: 100 }, L.tcfg);
  if (!linkTracks().includes(C.track)) C.track = linkTracks()[0] || 'meadow';
  const chip = (k, v, t) => `<button class="btn ${C[k] === v ? 'gold' : ''}" data-a="o" data-k="${k}" data-v="${v}" style="flex:1 1 auto;padding:4px 6px;font-size:12px;margin:2px">${t}</button>`;
  linkRacerPick('Time trial', `<p style="margin:2px 0"><b>Track</b> <small>(any whose cup you can enter)</small></p><div style="display:flex;flex-wrap:wrap">${linkTracks().map(k => chip('track', k, DERBY_TRACKS[k].name)).join('')}</div>
    <p style="margin:6px 0 2px"><b>Level cap</b> <small>(anyone over it races as if at the cap)</small></p><div style="display:flex;flex-wrap:wrap">${LINK_CAPS.map(([v, t]) => chip('cap', v, t)).join('')}</div>`,
  (m, a, d) => { if (a === 'o') { C[d.k] = d.k === 'cap' ? +d.v : d.v; return linkTrialSetup(); } if (m) linkRun(m, C.track, C.cap, null); }, linkRaces);
}
function linkGhostPaste() {
  openModal("Race a friend's ghost", `<textarea data-a="code" placeholder="Paste the FMG1- ghost code here" style="width:100%;height:80px;font-size:11px"></textarea><p id="lkMsg" style="font-size:12px;margin:4px 0"></p><div class="row"><button class="btn" data-a="back">Back</button><button class="btn gold" data-a="go">Next</button></div>`, a => {
    if (a === 'back') return linkRaces(); if (a !== 'go') return;
    const g = ghostRead(document.querySelector('#mBody textarea').value), msg = t => { document.getElementById('lkMsg').textContent = t; };
    if (!g) return msg("❌ That isn't a ghost code."); if (g.bad) return msg('❌ ' + g.bad);
    linkRacerPick(`${g.who}'s ghost`, `<p>👻 <b>${g.who}</b> raced <b>${g.nick || SPECIES[g.sp].name}</b> round <b>${DERBY_TRACKS[g.track].name}</b> in <b>${fmtLap(g.ms)}</b>${g.cap < 100 ? `, level cap ${g.cap}` : ''}. Can you beat it?</p>`, m => m && linkRun(m, g.track, g.cap, g), linkGhostPaste);
  });
}
async function linkRun(m, track, cap, ghost) {
  const rec = {}, seed = ghost ? ghost.seed : (Math.random() * 1e9) | 0;
  const res = await derbyRace({ id: 'link', track, cap }, m, [], 1, { trial: 1, seed, rec, ghost: ghost ? { pts: ghost.pts, dt: GHOST_DT, who: ghost.who, sp: ghost.sp, ms: ghost.ms } : null });
  if (!res || !rec.ms) return;   // left early
  const L = lk(), T0 = L.trial = L.trial || {}, ms = rec.ms, b = T0[track], pb = !b || ms < b.ms;
  if (pb) T0[track] = { ms, who: monName(m), cap };
  const run = { track, seed, cap, sp: m.sp, nick: m.nick, ms, pts: rec.pts }, code = ghostCode(run);
  let head;
  if (ghost) { const dd = (ghost.ms - ms) / 1000; if (dd > 0) L.ghostWins = (L.ghostWins || 0) + 1; head = dd > 0 ? `🏆 You beat ${ghost.who}'s ghost by <b>${dd.toFixed(2)}s</b>!` : dd === 0 ? `A dead heat with ${ghost.who}'s ghost!` : `👻 ${ghost.who}'s ghost was <b>${(-dd).toFixed(2)}s</b> faster.`; }
  else head = `⏱️ ${monName(m)} got round ${DERBY_TRACKS[track].name} in <b>${fmtLap(ms)}</b>.`;
  Sound.play(pb || (ghost && ghost.ms > ms) ? 'levelup' : 'pop');
  openModal(ghost ? 'Ghost race' : 'Time trial', `<p>${head}</p><p>Your time: <b>${fmtLap(ms)}</b>${pb ? ' · 🌟 a new best on this track!' : ` · best ${fmtLap(b.ms)}`}</p>
    <p style="margin:6px 0 2px">Share this run so ${ghost ? ghost.who : 'a friend'} can race your ghost:</p>${linkCodeBox(code)}
    <div class="row"><button class="btn" data-a="again">Race again</button><button class="btn" data-a="back">Done</button><button class="btn gold" data-a="copy">Copy code</button></div>`, a => {
    if (a === 'copy') return linkCopyBtn(code);
    if (a === 'again') { closeModal(); return linkRun(m, track, cap, ghost); }
    linkRaces();
  });
}
