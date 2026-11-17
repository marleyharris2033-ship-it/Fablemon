/* ============================================================ Action battles (17 Nov 2026)
   Real-time battles against wild Fablemon, inspired by Pokémon Reloaded and Legends Z-A (the user asked for them;
   Menu → Settings → "Wild battle style" switches back to Classic). Trainers, Wardens and legendaries stay classic.

   - You steer your lead Fablemon with the joystick (or WASD / arrows). Moves aim at the wild Fablemon on their own.
   - Moves recharge instead of using PP: the stronger the move, the longer the wait.
     Physical moves lunge in and hit up close; elemental moves fire a bolt you can sidestep; moves with no power work
     as they do in classic battles (stat changes, healing, guarding, status).
   - Dodge: a quick dash with a moment of safety. Type matchups, STAB, held items, stat stages, crits and the
     damage formula are the classic ones, so a Fablemon is as strong here as it is in a turn-based battle.
   - Status: Dazed slows you and your recharges, Asleep stuns, Burned and Poisoned hurt over time.
   - Catching: weaken it, then throw a charm. The catch odds are the classic ones.
   - When it ends, the classic battle screen takes over (Battle.resolveRT) for experience, level-ups, new moves,
     evolution, catching and blacking out, so all of that is exactly as before. */
const RTB = (() => {
  let st = null;
  const ARENA_KEY = 'rtb';
  const css = document.createElement('style');
  css.textContent = `
#rtb{position:fixed;inset:0;z-index:44;pointer-events:none;display:none;font-family:var(--pix,inherit)}
#rtb.show{display:block}
body.rtb-on #hud,body.rtb-on #hotbar,body.rtb-on #joy,body.rtb-on #actBtn,body.rtb-on #quest,body.rtb-on #topbtns,body.rtb-on #clock,body.rtb-on #energy,body.rtb-on #toast{visibility:hidden}
#rtb .rbox{position:absolute;pointer-events:none;background:rgba(255,250,234,.94);border:3px solid #2c4a2c;border-radius:8px;padding:3px 8px;min-width:150px;font-size:13px;color:#2a2a1a;box-shadow:0 2px 0 rgba(0,0,0,.25)}
#rtb .rbox b{font-size:13px}#rtb .rbox small{opacity:.8;font-family:var(--ui);font-weight:700}
#rtbFoe{left:8px;top:calc(8px + env(safe-area-inset-top))}#rtbMe{right:8px;top:calc(8px + env(safe-area-inset-top))}
#rtb .rhp{height:7px;background:#3a2e26;border-radius:3px;overflow:hidden;margin-top:3px}#rtb .rhp i{display:block;height:100%;transition:width .2s}
#rtb .rchip{display:inline-block;font-size:10px;color:#fff;border-radius:4px;padding:0 4px;margin-left:3px}
#rtbTeam{position:absolute;right:8px;top:calc(70px + env(safe-area-inset-top));display:flex;flex-direction:column;gap:4px;pointer-events:auto}
#rtbTeam button{width:38px;height:38px;border-radius:8px;border:2px solid #2c4a2c;background:#fffaea;padding:0;position:relative}
#rtbTeam button img{width:34px;height:34px;image-rendering:pixelated}#rtbTeam button.on{border-color:#e0a020;box-shadow:0 0 0 2px #e0a020}
#rtbTeam button.ko{opacity:.35}#rtbTeam button i{position:absolute;left:2px;right:2px;bottom:2px;height:3px;background:#4caf50;border-radius:2px}
#rtbMoves{position:absolute;right:10px;bottom:calc(14px + env(safe-area-inset-bottom));display:grid;grid-template-columns:1fr 1fr;gap:6px;width:min(58vw,250px);pointer-events:auto}
#rtbMoves button{position:relative;overflow:hidden;font-family:inherit;font-weight:800;font-size:12px;line-height:1.1;padding:9px 4px;border-radius:9px;border:3px solid;background:#fffaea;color:#2a2a1a;min-height:46px;touch-action:manipulation}
#rtbMoves button small{display:block;font-size:10px;opacity:.75;font-weight:700}
#rtbMoves button .cd{position:absolute;inset:0;background:rgba(30,30,30,.55);transform-origin:bottom;pointer-events:none}
#rtbMoves button.eff-up small{color:#1f7a2e}#rtbMoves button.eff-dn small{color:#9a4a20}
#rtbSide{position:absolute;right:10px;bottom:calc(132px + env(safe-area-inset-bottom));display:flex;flex-direction:row;align-items:flex-end;gap:6px;pointer-events:auto}
#rtbSide button{width:48px;height:48px;border-radius:50%;border:3px solid #2c4a2c;background:#fffaea;font-size:20px;position:relative;overflow:hidden;padding:0;touch-action:manipulation}
#rtbSide button img.ic{position:absolute;left:50%;top:5px;width:26px;height:26px;margin-left:-13px;image-rendering:pixelated;object-fit:contain}#rtbSide button img.ic[src='']{visibility:hidden}#rtbSide button small{position:absolute;bottom:2px;left:0;right:0;font-size:9px;font-weight:800}
#rtbSide button .cd{position:absolute;inset:0;background:rgba(30,30,30,.55);transform-origin:bottom;pointer-events:none}
#rtbSide #rtbDodge{width:62px;height:62px;background:#e8f4ff}
#rtbJoy{position:absolute;left:14px;bottom:calc(18px + env(safe-area-inset-bottom));width:120px;height:120px;border-radius:50%;background:rgba(255,250,234,.25);border:3px solid rgba(255,250,234,.6);pointer-events:auto;touch-action:none}
#rtbJoy i{position:absolute;left:35px;top:35px;width:50px;height:50px;border-radius:50%;background:rgba(255,250,234,.85);border:3px solid #2c4a2c}
#rtbMsg{position:absolute;left:50%;top:22%;transform:translateX(-50%);color:#fff;font-weight:800;font-size:18px;text-shadow:0 2px 0 #000,0 0 6px #000;white-space:nowrap;pointer-events:none;transition:opacity .3s}
#rtbHelp{position:absolute;left:50%;top:calc(76px + env(safe-area-inset-top));transform:translateX(-50%);background:rgba(20,30,20,.8);color:#fff;font-size:12px;padding:6px 10px;border-radius:8px;max-width:86vw;text-align:center;pointer-events:none}`;
  document.head.appendChild(css);
  const ui = document.createElement('div'); ui.id = 'rtb';
  ui.innerHTML = `<div class="rbox" id="rtbFoe"></div><div class="rbox" id="rtbMe"></div><div id="rtbTeam"></div><div id="rtbMsg"></div><div id="rtbHelp"></div>
    <div id="rtbJoy"><i></i></div><div id="rtbSide"><button id="rtbRun" data-a="run">🏃<small>Run</small></button><button id="rtbHeal" data-a="heal"><img class="ic"><small>Heal</small><div class="cd"></div></button><button id="rtbCharm" data-a="charm"><img class="ic"><small>Catch</small><div class="cd"></div></button><button id="rtbDodge" data-a="dodge">💨<small>Dodge</small><div class="cd"></div></button></div><div id="rtbMoves"></div>`;
  document.body.appendChild(ui);
  const $r = id => document.getElementById(id);

  // ---------- input: our own joystick, the keyboard, and the buttons
  const inp = { jx: 0, jy: 0, jid: null, keys: {} };
  { const J = $r('rtbJoy'), knob = J.querySelector('i');
    const mv = e => { if (e.pointerId !== inp.jid) return; const r = J.getBoundingClientRect(), R = r.width / 2; let x = e.clientX - r.left - R, y = e.clientY - r.top - R; const d = Math.hypot(x, y), lim = R * .7; if (d > lim) { x *= lim / d; y *= lim / d; } inp.jx = x / lim; inp.jy = y / lim; knob.style.transform = `translate(${x}px,${y}px)`; };
    J.addEventListener('pointerdown', e => { inp.jid = e.pointerId; J.setPointerCapture(e.pointerId); mv(e); e.preventDefault(); });
    J.addEventListener('pointermove', mv);
    const end = e => { if (e.pointerId !== inp.jid) return; inp.jid = null; inp.jx = inp.jy = 0; knob.style.transform = ''; };
    J.addEventListener('pointerup', end); J.addEventListener('pointercancel', end); }
  addEventListener('keydown', e => { if (!st) return; inp.keys[e.key.toLowerCase()] = 1;
    const k = e.key.toLowerCase(); if (['1', '2', '3', '4'].includes(k)) useMoveBtn(+k - 1); if (k === ' ' || k === 'shift') act('dodge'); if (k === 'c') act('charm'); if (k === 'h') act('heal'); if (k === 'escape') act('run'); });
  addEventListener('keyup', e => { inp.keys[e.key.toLowerCase()] = 0; });
  ui.addEventListener('pointerdown', e => { const b = e.target.closest('button'); if (!b || !st) return; e.preventDefault();
    if (b.dataset.mv !== undefined) useMoveBtn(+b.dataset.mv); else if (b.dataset.sw !== undefined) switchTo(+b.dataset.sw); else if (b.dataset.a) act(b.dataset.a); });

  // ---------- rules
  const STG = k => k;
  const cdOf = id => { const M = MOVES[id]; if (!M) return 2; if (M.protect) return 6; if (!M.pow) return M.heal || M.rest ? 9 : 4.5; const n = M.hits ? (M.hits[0] + M.hits[1]) / 2 : 1; return Math.max(1.6, Math.min(7, 1.3 + M.pow * n / 30)); };
  const speedOf = f => (75 + Math.min(150, monStat(f.m, 'spd') * STAGE(f.stg.spd || 0)) * .3)   // 17 Nov: nothing crawls early on; fast ones still clearly faster * (f.m.status === 'par' ? .55 : 1);
  const statOf = (f, k) => monStat(f.m, k) * heldStat(f.m, k) * STAGE(f.stg[k] || 0);
  function damage(att, def, id) {
    const M = MOVES[id]; if (M.fixed) return att.m.lv;
    const e = effOn(M.type, def.m.sp), stab = stabOf(M.type, att.m.sp), cat = moveCat(id);
    const crit = Math.random() < [1 / 16, 1 / 8, 1 / 2, 1][Math.min(3, (M.crit ? 1 : 0) + (att.critUp || 0))] ? 1.5 : 1;
    const pw = M.pow * (att.m.held === sigilOf(M.type) ? 1.15 : 1) * (M.hex && def.m.status ? 2 : 1) * (M.desperate && att.m.hp < monStat(att.m, 'hp') / 3 ? 2 : 1);
    const A = statOf(att, M.useDef ? 'def' : cat === 'e' ? 'eatk' : 'atk') * (att.m.status === 'brn' && cat !== 'e' && !M.useDef ? .5 : 1), D = statOf(def, cat === 'e' ? 'edef' : 'def');
    const base = Math.floor(Math.floor((2 * att.m.lv / 5 + 2) * pw * A / D) / 50) + 2;
    return { dmg: Math.max(1, Math.floor(base * stab * e * crit * (.85 + Math.random() * .15))), e, crit };
  }
  const say = (t, ms = 1100) => { const m = $r('rtbMsg'); m.textContent = t; m.style.opacity = 1; clearTimeout(say.t); say.t = setTimeout(() => m.style.opacity = 0, ms); };

  // ---------- the fighters
  function fighter(sc, m, side, x, y) {
    const wid = walkId(sc, m); monAnims(sc, wid);
    const spr = hdSpr(sc.add.sprite(x, y, 'mon_' + wid, side === 'me' ? 12 : 0).setOrigin(.5, 1), wid);
    const sh = sc.add.ellipse(x, y - 1, Math.max(12, spr.displayWidth * .55), 5, 0x1a1206, .35).setDepth(1);
    return { m, side, wid, spr, sh, x, y, dir: side === 'me' ? 'up' : 'down', cd: {}, stg: {}, dodgeT: 0, iframe: 0, stun: 0, protect: 0, dotT: 2, lunge: null, ai: { strafe: Math.random() < .5 ? 1 : -1, t: 0, dodgeT: 0, think: 0 }, r: Math.max(7, spr.displayWidth * .32) };
  }
  function place(f) {
    f.spr.setPosition(Math.round(f.x), Math.round(f.y)); f.spr.setDepth(f.y + 24);   // in a fight they stand clear of the long grass in front, so you can always see them f.sh.setPosition(f.x, f.y - 1);
    if (f.ring) f.ring.setPosition(f.x, f.y - f.spr.displayHeight * .45);
  }
  function face(f, dx, dy, moving) {
    const d = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    if (moving) { if (f.dir !== d || !f.spr.anims.isPlaying) { f.dir = d; f.spr.anims.play(`${f.wid}_${d}`, true); } }
    else { f.dir = d; f.spr.anims.stop(); f.spr.setFrame(DIRS.indexOf(d) * 4); }
  }

  // ---------- doing moves
  function useMove(f, id) {
    const sc = st.sc, M = MOVES[id], tgt = f.side === 'me' ? st.foe : st.me;
    if (!M || f.stun > 0 || f.lunge || (f.cd[id] || 0) > 0) return false;
    f.cd[id] = cdOf(id) * (f.m.status === 'par' ? 1.4 : 1);
    const dx = tgt.x - f.x, dy = tgt.y - f.y; face(f, dx, dy, false);
    if (f.side === 'me') say(M.name, 700);
    if (M.protect) { f.protect = 1.4; ring(f, 0x9fd8ff); Sound.play('pop'); return true; }
    if (M.heal && !M.pow) { healF(f, monStat(f.m, 'hp') * M.heal); return true; }
    if (M.rest) { f.m.hp = monStat(f.m, 'hp'); f.m.status = 'slp'; f.stun = 3; Sound.play('fill'); floatTxt(f, 'Zzz', '#9ab8ff'); refresh(); return true; }
    if (M.haze) { st.me.stg = {}; st.foe.stg = {}; Sound.play('swish'); say('Every stat change blown away!'); refresh(); return true; }
    if (M.cure) { f.m.status = null; Sound.play('fill'); refresh(); return true; }
    if (M.critUp) { f.critUp = Math.min(2, (f.critUp || 0) + M.critUp); ring(f, 0xffd060); Sound.play('pop'); return true; }
    if (M.weather || M.hazard) { buff(f, f, ['self', moveCat(id) === 'e' ? 'eatk' : 'atk', 1]); return true; }
    const selfOnly = (M.stat || M.stats) && (M.stats || [M.stat]).every(s => s[0] === 'self') && !M.pow;
    if (selfOnly) { for (const s of M.stats || [M.stat]) buff(f, f, s); return true; }
    if (!M.pow) { bolt(f, tgt, id, { slow: true }); return true; }   // status and stat-lowering moves fly at the target
    const n = M.hits ? M.hits[0] + Math.floor(Math.random() * (M.hits[1] - M.hits[0] + 1)) : 1;
    if (moveCat(id) === 'p' && !M.ranged) { lunge(f, tgt, id, n); return true; }
    for (let k = 0; k < n; k++) sc.time.delayedCall(k * 110, () => st && bolt(f, tgt, id, { spread: n > 1 ? (Math.random() - .5) * .25 : 0 }));
    return true;
  }
  function lunge(f, tgt, id, n) {
    const sc = st.sc, dx = tgt.x - f.x, dy = tgt.y - f.y, d = Math.hypot(dx, dy) || 1, reach = Math.min(48, Math.max(0, d - tgt.r - 2));
    const ux = dx / d, uy = dy / d; f.lunge = { t: .18, vx: ux * reach / .18, vy: uy * reach / .18 };
    Sound.play('swish'); face(f, dx, dy, true);
    sc.time.delayedCall(190, () => {
      if (!st) return; f.lunge = null; face(f, dx, dy, false);
      for (let k = 0; k < n; k++) sc.time.delayedCall(k * 120, () => { if (!st) return; const dd = Math.hypot(tgt.x - f.x, tgt.y - f.y); if (dd <= tgt.r + f.r + 8) hit(f, tgt, id, k === 0); else if (k === 0 && f.side === 'me') floatTxt(tgt, 'Miss', '#ddd'); });
    });
  }
  function bolt(f, tgt, id, o = {}) {
    const sc = st.sc, M = MOVES[id], col = Phaser.Display.Color.HexStringToColor(TYPES[M.type] || '#ffffff').color;
    const sx = f.x, sy = f.y - f.spr.displayHeight * .45, tx = tgt.x, ty = tgt.y - tgt.spr.displayHeight * .45;
    let a = Math.atan2(ty - sy, tx - sx) + (o.spread || 0);
    const sp = o.slow ? 110 : 175, g = sc.add.circle(sx, sy, o.slow ? 4 : 5, col).setDepth(9e5).setStrokeStyle(2, 0xffffff, .8);
    const glow = sc.add.circle(sx, sy, 9, col, .35).setDepth(9e5 - 1);
    st.bolts.push({ f, tgt, id, x: sx, y: sy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1.6, g, glow, col }); Sound.play('pop');
  }
  function hit(att, def, id, first) {
    const M = MOVES[id], sc = st.sc;
    if (def.m.hp <= 0) return;
    if (def.iframe > 0) { floatTxt(def, 'Dodged!', '#bfe8ff'); return; }
    if (def.protect > 0) { floatTxt(def, 'Blocked', '#9fd8ff'); Sound.play('pick'); return; }
    if (!M.pow) {
      if (M.st && !M.pow) inflict(def, M.st[0], true);
      for (const s of M.stats || (M.stat ? [M.stat] : [])) buff(att, s[0] === 'self' ? att : def, s);
      if (M.seed) { def.seed = att; floatTxt(def, 'Seeded', '#7ac74c'); }
      return;
    }
    const { dmg, e, crit } = damage(att, def, id), dealt = Math.min(dmg, def.m.hp);
    def.m.hp = Math.max(0, def.m.hp - dmg); Sound.play('hit');
    def.spr.setTintFill(0xffffff); sc.time.delayedCall(70, () => def.spr && def.spr.clearTint());
    const d = Math.hypot(def.x - att.x, def.y - att.y) || 1; def.kx = (def.x - att.x) / d * 120; def.ky = (def.y - att.y) / d * 120;
    floatTxt(def, (crit > 1 ? '✦' : '') + dmg, e > 1 ? '#ffe066' : e < 1 ? '#bbbbbb' : '#ffffff', e > 1 ? 16 : 13);
    if (first && e > 1) say("It's super effective!", 900); else if (first && e < 1 && e > 0) say("It's not very effective...", 900); else if (e === 0) say("It doesn't affect it...", 900);
    if (crit > 1) sc.cameras.main.shake(120, .004);
    if (M.drain && att.m.hp > 0) healF(att, dealt * M.drain, true);
    if (M.recoil) { att.m.hp = Math.max(0, att.m.hp - Math.max(1, Math.floor(dealt / M.recoil))); floatTxt(att, 'Recoil', '#ffb0a0'); }
    if (def.m.hp > 0) {
      if (M.st && Math.random() * 100 < M.st[1]) inflict(def, M.st[0]);
      if (M.flinch && Math.random() * 100 < M.flinch) def.stun = Math.max(def.stun, .45);
    }
    if (M.boost && Math.random() * 100 < M.boost[3]) buff(att, M.boost[0] === 'self' ? att : def, M.boost);
    refresh();
  }
  function inflict(f, s, loud) {
    if (f.m.status || f.m.hp <= 0) { if (loud) floatTxt(f, 'No effect', '#ddd'); return; }
    if (IMMUNE[s] && hasType(f.m.sp, IMMUNE[s])) { if (loud) floatTxt(f, 'Immune', '#ddd'); return; }
    f.m.status = s; if (s === 'slp') f.stun = 2.6; floatTxt(f, STATUS[s][0], STATUS[s][1]); refresh();
  }
  function buff(by, f, [who, k, n]) {
    f.stg[k] = Math.max(-6, Math.min(6, (f.stg[k] || 0) + n));
    floatTxt(f, `${{ atk: 'Atk', def: 'Def', eatk: 'EAtk', edef: 'EDef', spd: 'Spd' }[k] || k} ${n > 0 ? '▲' : '▼'}`, n > 0 ? '#9ff0a8' : '#ffb0a0');
    ring(f, n > 0 ? 0x9ff0a8 : 0xff9080); Sound.play(n > 0 ? 'pop' : 'pick'); refresh();
  }
  function healF(f, amt, quiet) { const h = Math.min(monStat(f.m, 'hp') - f.m.hp, Math.floor(amt)); if (h <= 0) return; f.m.hp += h; floatTxt(f, '+' + h, '#9ff0a8'); if (!quiet) Sound.play('fill'); refresh(); }
  function ring(f, col) { const sc = st.sc, r = sc.add.circle(f.x, f.y - f.spr.displayHeight * .45, f.r + 6).setStrokeStyle(2, col, 1).setDepth(9e5); sc.tweens.add({ targets: r, scale: 1.8, alpha: 0, duration: 420, onComplete: () => r.destroy() }); }
  function floatTxt(f, t, col, size = 12) {
    const sc = st.sc, x = f.x + (Math.random() - .5) * 8, y = f.y - f.spr.displayHeight - 2;
    const tx = sc.add.text(x, y, t, { fontFamily: 'monospace', fontSize: size + 'px', fontStyle: 'bold', color: col, stroke: '#000', strokeThickness: 3 }).setOrigin(.5, 1).setDepth(9e5 + 5).setResolution(3);
    sc.tweens.add({ targets: tx, y: y - 14, alpha: 0, delay: 350, duration: 500, onComplete: () => tx.destroy() });
  }

  // ---------- the player's buttons
  function useMoveBtn(i) { if (!st || st.over) return; const id = st.me.m.moves[i]; if (id && !useMove(st.me, id) && (st.me.cd[id] || 0) > 0) Sound.play('error'); }
  function charmId() { const p = (S.rtSlots || {}).charm; if (p && inv.count(p) > 0) return p; return RT_CHARMS.find(c => inv.count(c) > 0) || null; }
  function healId() { const p = (S.rtSlots || {}).heal; if (p && ITEMS[p] && inv.count(p) > 0) return p; const me = st && st.me && st.me.m; if (me && me.status && inv.count('tonic') > 0) return 'tonic'; return ['mon_treat', 'berry_crumble', 'honey', 'berry', 'hearth_elixir'].find(c => ITEMS[c] && inv.count(c) > 0) || null; }
  function act(a) {
    if (!st || st.over) return;
    const me = st.me;
    if (a === 'dodge') {
      if (me.dodgeT > 0 || me.stun > 0) return;
      let dx = inp.jx || ((inp.keys.d || inp.keys.arrowright ? 1 : 0) - (inp.keys.a || inp.keys.arrowleft ? 1 : 0)), dy = inp.jy || ((inp.keys.s || inp.keys.arrowdown ? 1 : 0) - (inp.keys.w || inp.keys.arrowup ? 1 : 0));
      if (!dx && !dy) { const fx = st.foe.x - me.x, fy = st.foe.y - me.y, d = Math.hypot(fx, fy) || 1; dx = -fy / d; dy = fx / d; }   // no direction held: sidestep
      const d = Math.hypot(dx, dy) || 1; me.lunge = { t: .16, vx: dx / d * 260, vy: dy / d * 260 }; me.iframe = .35; me.dodgeT = 1.2; me.spr.setAlpha(.6);
      st.sc.time.delayedCall(170, () => { if (st) { me.lunge = null; me.spr.setAlpha(1); } }); Sound.play('swish'); return;
    }
    if (a === 'charm') {
      const c = charmId(); if (!c) return say('You have no charms!');
      if ((st.charmT || 0) > 0) return;
      inv.remove(c, 1); renderHotbar(); st.charmT = 3; throwCharm(c); return;
    }
    if (a === 'heal') {
      const h = healId(); if (!h) return say('Nothing to heal with!');
      if ((st.healT || 0) > 0) return; if (me.m.hp >= monStat(me.m, 'hp') && !(me.m.status && ITEMS[h].cure)) return say(`${monName(me.m)} is already healthy.`);
      inv.remove(h, 1); renderHotbar(); st.healT = 10;
      if (ITEMS[h].cure && me.m.status) { me.m.status = null; me.stun = 0; refresh(); }
      if (ITEMS[h].heal) healF(me, healAmt(h, me.m)); say(`${monName(me.m)} ${ITEMS[h].heal ? 'ate' : 'drank'} the ${ITEMS[h].name}!`); return;
    }
    if (a === 'run') {
      const d = Math.hypot(st.foe.x - me.x, st.foe.y - me.y);
      st.runs = (st.runs || 0) + 1;
      if (d > 90 || Math.random() < .45 + .15 * st.runs) { Sound.play('swish'); say('You got away safely!'); return end('ran'); }
      say("Couldn't get away! Get further from it first."); return;
    }
  }
  function switchTo(i) {
    if (!st || st.over) return; const m = team()[i]; if (!m || m.hp <= 0 || m === st.me.m || (st.swT || 0) > 0) return;
    swapIn(m); st.swT = 3;
  }
  function swapIn(m) {
    const sc = st.sc, old = st.me, x = old.x, y = old.y;
    old.spr.destroy(); old.sh.destroy();
    st.me = fighter(sc, m, 'me', x, y); st.me.iframe = .8; st.used.add(m.uid); place(st.me); buildMoves(); refresh();
    say(`Go, ${monName(m)}!`, 900); Sound.play('pop');
  }
  function throwCharm(cid) {
    const sc = st.sc, me = st.me, foe = st.foe, img = sc.add.image(me.x, me.y - 16, 'objects', 'stone').setDepth(9e5);
    const icon = iconFor(cid); if (icon && !sc.textures.exists('rt_' + cid)) { const im = new Image(); im.onload = () => { if (!sc.textures.exists('rt_' + cid)) sc.textures.addImage('rt_' + cid, im); if (img.active) img.setTexture('rt_' + cid).setDisplaySize(12, 12); }; im.src = icon; } else if (sc.textures.exists('rt_' + cid)) img.setTexture('rt_' + cid).setDisplaySize(12, 12);
    say(`You threw a ${ITEMS[cid].name}!`, 900);
    sc.tweens.add({ targets: img, x: foe.x, y: foe.y - 12, duration: 380, ease: 'Quad.out', onComplete: () => {
      if (!st) return img.destroy();
      if (foe.iframe > 0 || Math.hypot(img.x - foe.x, img.y - 12 - (foe.y - 12)) > 40) { say('It missed!'); return img.destroy(); }
      // the classic catch odds
      const Mx = monStat(foe.m, 'hp'), rate = (SPECIES[foe.m.sp].rate || 120) * (cid === 'sturdy_charm' ? 1.5 : cid === 'skyward_charm' ? 2 : 1) * (foe.m.status === 'slp' ? 2 : foe.m.status ? 1.5 : 1) * (typeof blessed === 'function' && blessed('wild') ? 1.15 : 1);
      const a2 = Math.max(1, ((3 * Mx - 2 * foe.m.hp) * rate) / (3 * Mx)), b2 = a2 >= 255 ? 65536 : 1048560 / Math.sqrt(Math.sqrt(16711680 / a2));
      let shakes = 0; while (shakes < 4 && Math.random() * 65536 < b2) shakes++;
      foe.spr.setVisible(false); foe.sh.setVisible(false); foe.stun = 9; st.catching = 1; Sound.play('pop');
      let k = 0; const wob = () => {
        if (!st) return;
        if (k < Math.min(3, shakes)) { k++; Sound.play('wobble'); sc.tweens.add({ targets: img, angle: { from: -20, to: 20 }, duration: 160, yoyo: true, onComplete: () => sc.time.delayedCall(300, wob) }); return; }
        if (shakes >= 4) { img.destroy(); st.catching = 0; return end('caught'); }
        img.destroy(); foe.spr.setVisible(true); foe.sh.setVisible(true); foe.stun = .6; foe.iframe = .6; st.catching = 0; Sound.play('error');
        say(['Oh no! It broke free!', 'Aww! It almost chose you!', 'So close! It wriggled out!', 'Argh! Nearly had it!'][Math.min(3, shakes)], 1300);
      }; sc.time.delayedCall(350, wob);
    } });
  }

  // ---------- the foe's mind
  function think(dt) {
    const f = st.foe, me = st.me, M0 = f.m.moves.map(id => MOVES[id]).filter(Boolean);
    if (f.stun > 0 || f.lunge || st.catching) return [0, 0];
    const dx = me.x - f.x, dy = me.y - f.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
    const physical = monStat(f.m, 'atk') >= monStat(f.m, 'eatk');
    // shy ones bolt for the edge when they're losing
    if (st.mood === 'shy' && f.m.hp < monStat(f.m, 'hp') * .3) {
      const ex = f.x < st.W / 2 ? -1 : 1; if (f.x <= st.B.x0 + 2 || f.x >= st.B.x1 - 2) { say(`The wild ${SPECIES[f.m.sp].name} ran away!`, 1500); end('fled'); return [0, 0]; }
      return [ex, -uy * .3];
    }
    // dodge bolts coming at it
    f.ai.dodgeT -= dt;
    if (f.ai.dodgeT <= 0) for (const b of st.bolts) if (b.f === me && !b.seen) {
      const rx = f.x - b.x, ry = f.y - 10 - b.y, along = (rx * b.vx + ry * b.vy) / Math.hypot(b.vx, b.vy);
      if (along > 0 && along < 70) { b.seen = 1; if (Math.random() < st.dodgeSkill) { const s = Math.random() < .5 ? 1 : -1; f.lunge = { t: .15, vx: -b.vy / 175 * 230 * s, vy: b.vx / 175 * 230 * s }; f.iframe = .2; f.ai.dodgeT = 1.4; st.sc.time.delayedCall(160, () => st && (f.lunge = null)); return [0, 0]; } }
    }
    // pick a move
    f.ai.think -= dt;
    if (f.ai.think <= 0) {
      f.ai.think = .25 + Math.random() * .35;
      const ready = f.m.moves.filter(id => MOVES[id] && !(f.cd[id] > 0));
      if (ready.length) {
        const score = id => { const M = MOVES[id]; if (!M.pow) return (Math.random() < .18 ? 60 : 0); const close = moveCat(id) === 'p' && !M.ranged; if (close && d > 46) return 0; if (!close && d > 190) return 0; return M.pow * effOn(M.type, me.m.sp) * stabOf(M.type, f.m.sp) * (M.hits ? (M.hits[0] + M.hits[1]) / 2 : 1) * (.7 + Math.random() * .6); };
        const best = ready.map(id => [id, score(id)]).sort((a, b) => b[1] - a[1])[0];
        if (best && best[1] > 0 && Math.random() < st.aggr) useMove(f, best[0]);
      }
    }
    // keep its distance: physical ones close in, elemental ones hang back and circle
    const want = physical ? 22 : 85;
    f.ai.t -= dt; if (f.ai.t <= 0) { f.ai.t = 1 + Math.random() * 1.5; if (Math.random() < .4) f.ai.strafe *= -1; }
    let mx = 0, my = 0;
    if (d > want + 18) { mx = ux; my = uy; } else if (d < want - 18) { mx = -ux; my = -uy; }
    mx += -uy * f.ai.strafe * .7; my += ux * f.ai.strafe * .7;
    return [mx, my];
  }

  // ---------- the battleground: wherever you are (17 Nov). Everyone else steps out of sight for the fight.
  const tileAt = px => Math.floor(px / T);
  function solid(x, y) {   // world px; trees, rocks, water, cliffs and buildings are in the way
    const sc = st.sc, tx = tileAt(x), ty = tileAt(y - 3);
    if (sc.R && sc.R.blocked) return tx < 0 || ty < 0 || tx >= RW || ty >= RH || !!sc.R.blocked[ty * RW + tx];
    return sc.passable ? !sc.passable(tx, ty) : false;
  }
  function clearStage(sc, hide) {
    if (hide) {
      st.hidden = [];
      for (const o of sc.children.list) {
        if (o === sc.player || !o.visible || o.type !== 'Sprite' || !o.texture) continue;
        if (/^(mon_|tr_|npc_|ppl_|ew_)/.test(o.texture.key)) { st.hidden.push(o); o.setVisible(false); }
      }
      for (const r of sc.roam || []) if (r.glint && r.glint.visible) { st.hidden.push(r.glint); r.glint.setVisible(false); }
      if (sc.follower && sc.follower.visible) { st.hidden.push(sc.follower); sc.follower.setVisible(false); }
    } else for (const o of st.hidden || []) if (o.active) o.setVisible(true);
    if (sc.syncShadows) sc.syncShadows();
  }
  function stageUp(sc, at) {
    st.sc = sc; const cam = sc.cameras.main, zoom = cam.zoom, cw = cam.width / zoom, ch = cam.height / zoom;
    const pl = sc.player, px = pl ? pl.x : at.x, py = pl ? pl.y : at.y;
    // the view: centred between you and it, kept on the map
    const bx = cam._bounds || { x: 0, y: 0, width: 1e5, height: 1e5 };
    let cx = (px + at.x) / 2, cy = (py + at.y) / 2 - 10;
    const L = Math.max(bx.x, Math.min(bx.x + bx.width - cw, cx - cw / 2)), Tp = Math.max(bx.y, Math.min(bx.y + bx.height - ch, cy - ch / 2));
    st.camWas = { follow: cam._follow, lx: cam.lerp.x, ly: cam.lerp.y };
    cam.stopFollow(); cam.pan(L + cw / 2, Tp + ch / 2, 350, 'Sine.easeInOut');
    const k = (typeof DPR === 'function' ? DPR() : 1) / zoom;   // CSS px -> world px
    st.B = { x0: L + 12, x1: L + cw - 12, y0: Tp + (76 + 24) * k, y1: Tp + ch - (196 + 8) * k };
    if (st.B.y1 - st.B.y0 < 100) st.B.y1 = st.B.y0 + 100;
    st.W = st.B.x1 + st.B.x0; st.H = st.B.y1 + st.B.y0;   // (the middle, for the shy ones' escape)
    clearStage(sc, true); if (pl) { st.plWas = { x: pl.x, y: pl.y, d: pl.depth }; pl.setDepth(pl.y + 1); const bx = pl.x - dxy(at, pl)[0] * 12, by = pl.y - dxy(at, pl)[1] * 12; if (!solid(bx, by)) sc.tweens.add({ targets: pl, x: bx, y: by, duration: 200 }); }   // you step back to let your Fablemon out
    // the wild one where it stood; yours hops out beside you, towards it
    const into = (x, y) => [Math.max(st.B.x0, Math.min(st.B.x1, x)), Math.max(st.B.y0, Math.min(st.B.y1, y))];
    let [fx, fy] = into(at.x, at.y);
    const dx = fx - px, dy = fy - py, d = Math.hypot(dx, dy) || 1;
    let [mx, my] = into(px + dx / d * 14, py + dy / d * 14); if (solid(mx, my)) [mx, my] = into(px, py);
    st.me = fighter(sc, st.first, 'me', px, py); st.foe = fighter(sc, st.foeMon, 'foe', fx, fy);
    place(st.me); place(st.foe); face(st.me, dx, dy, false); face(st.foe, -dx, -dy, false);
    const M0 = st.me, F0 = st.foe; sc.tweens.add({ targets: M0, x: mx, y: my, duration: 260, ease: 'Quad.out', onUpdate: () => { if (M0.spr.active) place(M0); } });
    st.me.spr.setScale(st.me.spr.scaleX * .3, st.me.spr.scaleY * .3); sc.tweens.add({ targets: st.me.spr, scaleX: st.me.spr.scaleX / .3, scaleY: st.me.spr.scaleY / .3, duration: 260, ease: 'Back.out' });
    // and the wild one backs off a few steps to give you room
    let bx2 = fx, by2 = fy; for (let n = 0; n < 40; n++) { const tx = bx2 + dx / d * 1.6, ty = by2 + dy / d * 1.6; if (tx < st.B.x0 || tx > st.B.x1 || ty < st.B.y0 || ty > st.B.y1 || solid(tx, ty)) break; bx2 = tx; by2 = ty; }
    sc.tweens.add({ targets: F0, x: bx2, y: by2, duration: 420, delay: 150, ease: 'Quad.out', onUpdate: () => { if (F0.spr.active) place(F0); } });
    if (st.foeMon.fab) { st.foe.ring = sc.add.star(st.foe.x, st.foe.y, 4, 2, 6, 0xfff6c8).setDepth(9e5 + 1); sc.tweens.add({ targets: st.foe.ring, angle: 180, alpha: .3, duration: 900, yoyo: true, repeat: -1 }); }
    buildMoves(); refresh();
    say(st.foeMon.fab ? `✦ A Fabled ${SPECIES[st.foeMon.sp].name}! ✦` : `A wild ${SPECIES[st.foeMon.sp].name}!`, 1600);
    if (!S.flags.rtHelp || S.flags.rtHelp < 3) { S.flags.rtHelp = (S.flags.rtHelp || 0) + 1; const h = $r('rtbHelp'); h.style.display = ''; h.textContent = 'Steer with the stick. Tap a move when it has recharged: they aim themselves. Dodge to dash out of the way. Weaken it, then tap Catch.'; setTimeout(() => h.style.display = 'none', 6000); }
    st.ready = 1;   // a moment before the wild one acts
    st.upd = (time, delta) => tick(time, delta); sc.events.on('update', st.upd);
  }
  function dxy(a, b) { const dx = a.x - b.x, dy = a.y - b.y, d = Math.hypot(dx, dy) || 1; return [dx / d, dy / d]; }
  function stageDown(done) {
    const sc = done.sc; if (!sc || !sc.sys || !sc.sys.isActive()) return;
    sc.events.off('update', done.upd);
    sc.tweens.killTweensOf([done.me, done.foe].filter(Boolean));
    for (const f of [done.me, done.foe]) if (f) { if (f.ring) f.ring.destroy(); f.sh.destroy(); f.spr.destroy(); }
    const was = st; st = done; clearStage(sc, false); st = was;
    if (done.plWas && sc.player && sc.player.active) sc.player.setPosition(done.plWas.x, done.plWas.y).setDepth(done.plWas.d);
    const cam = sc.cameras.main, fol = done.camWas && done.camWas.follow;
    if (fol && fol.active) { cam.startFollow(fol, true, .12, .12); sc.time.delayedCall(700, () => { if (cam._follow === fol) cam.setLerp(done.camWas.lx, done.camWas.ly); }); }
  }
  function tick(time, delta) {
      if (!st || !st.me) return; const sc = st.sc;
      const dt = Math.min(.05, delta / 1000), me = st.me, foe = st.foe;
      if (st.over) return;
      st.ready -= dt;
      for (const f of [me, foe]) {
        for (const k in f.cd) if (f.cd[k] > 0) f.cd[k] -= dt;
        f.dodgeT -= dt; f.iframe -= dt; f.protect -= dt;
        if (f.stun > 0) { f.stun -= dt; if (f.stun <= 0 && f.m.status === 'slp') { f.m.status = null; floatTxt(f, 'Woke up!', '#fff'); refresh(); } }
        // burns, poison and seeds hurt over time
        f.dotT -= dt;
        if (f.dotT <= 0) { f.dotT = 2; const mx = monStat(f.m, 'hp');
          if (f.m.status === 'brn' || f.m.status === 'psn') { const d = Math.max(1, Math.floor(mx / (f.m.status === 'brn' ? 16 : 10))); f.m.hp = Math.max(0, f.m.hp - d); floatTxt(f, '-' + d, STATUS[f.m.status][1]); refresh(); }
          if (f.seed && f.seed.m.hp > 0) { const d = Math.max(1, Math.floor(mx / 16)); f.m.hp = Math.max(0, f.m.hp - d); healF(f.seed, d, true); refresh(); } }
        if (f.kx || f.ky) { f.x += f.kx * dt; f.y += f.ky * dt; f.kx *= .82; f.ky *= .82; if (Math.abs(f.kx) + Math.abs(f.ky) < 4) f.kx = f.ky = 0; }
      }
      st.charmT -= dt; st.healT -= dt; st.swT -= dt;
      // you
      let mx = 0, my = 0;
      if (!st.catching && me.stun <= 0) {
        mx = inp.jx || ((inp.keys.d || inp.keys.arrowright ? 1 : 0) - (inp.keys.a || inp.keys.arrowleft ? 1 : 0));
        my = inp.jy || ((inp.keys.s || inp.keys.arrowdown ? 1 : 0) - (inp.keys.w || inp.keys.arrowup ? 1 : 0));
      }
      move(me, mx, my, dt, true);
      // the wild one
      const [fx, fy] = st.ready > 0 ? [0, 0] : think(dt); if (st.over) return;
      move(foe, fx, fy, dt, false);
      // bolts
      for (const b of st.bolts.slice()) {
        b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; b.g.setPosition(b.x, b.y); b.glow.setPosition(b.x, b.y);
        const t = b.tgt;
        if (Math.hypot(b.x - t.x, b.y - (t.y - t.spr.displayHeight * .45)) < t.r + 5 && t.m.hp > 0 && st[t.side] === t) { hit(b.f, t, b.id, true); kill(b, true); continue; }
        if (b.life <= 0 || b.x < st.B.x0 - 30 || b.y < st.B.y0 - 30 || b.x > st.B.x1 + 30 || b.y > st.B.y1 + 30) kill(b);
      }
      // faints
      if (foe.m.hp <= 0) { foe.spr.setTint(0x777777); sc.tweens.add({ targets: foe.spr, alpha: 0, y: foe.spr.y + 6, duration: 500 }); Sound.play('faint'); return end('win'); }
      if (me.m.hp <= 0) {
        Sound.play('faint'); me.m.status = null; const next = team().find(m => m.hp > 0);
        if (!next) return end('lose');
        say(`${monName(me.m)} fainted!`, 1200); swapIn(next);
      }
      if ((st.uiT = (st.uiT || 0) - dt) <= 0) { st.uiT = .08; cdUi(); }
  }
  function move(f, mx, my, dt, isMe) {
    const ox = f.x, oy = f.y;
    if (f.lunge) { f.lunge.t -= dt; f.x += f.lunge.vx * dt; f.y += f.lunge.vy * dt; }
    else if (f.stun <= 0 && (mx || my)) {
      const l = Math.hypot(mx, my); if (l > 1) { mx /= l; my /= l; }
      const v = speedOf(f) * (isMe ? 1 : st.foeSpeed); f.x += mx * v * dt; f.y += my * v * dt;
      if (isMe) face(f, mx, my, l > .2); else face(f, mx, my, true);
    } else if (!f.lunge) { const o = f.side === 'me' ? st.foe : st.me; face(f, o.x - f.x, o.y - f.y, false); }
    f.x = Math.max(st.B.x0, Math.min(st.B.x1, f.x)); f.y = Math.max(st.B.y0, Math.min(st.B.y1, f.y));
    if (solid(f.x, f.y) && !solid(ox, oy)) { if (!solid(f.x, oy)) f.y = oy; else if (!solid(ox, f.y)) f.x = ox; else { f.x = ox; f.y = oy; } if (f.lunge) f.lunge.t = 0; }
    place(f);
  }
  function kill(b, burst) {
    if (burst) { const p = st.sc.add.circle(b.x, b.y, 6, b.col, .7).setDepth(9e5); st.sc.tweens.add({ targets: p, scale: 2.4, alpha: 0, duration: 260, onComplete: () => p.destroy() }); }
    b.g.destroy(); b.glow.destroy(); st.bolts = st.bolts.filter(q => q !== b);
  }

  // ---------- the panels
  function hpBox(f, el) {
    const m = f.m, mx = monStat(m, 'hp'), pc = Math.max(0, m.hp) / mx;
    const chips = (m.status ? `<span class="rchip" style="background:${STATUS[m.status][1]}">${STATUS[m.status][0]}</span>` : '') + Object.entries(f.stg).filter(([, n]) => n).map(([k, n]) => `<span class="rchip" style="background:${n > 0 ? '#3a8a4a' : '#9a4a3a'}">${{ atk: 'Atk', def: 'Def', eatk: 'EAtk', edef: 'EDef', spd: 'Spd' }[k]}${n > 0 ? '▲' : '▼'}</span>`).join('');
    el.innerHTML = `<b>${f.side === 'foe' && S.caught[m.sp] ? '<span style="color:#c0392b">♥</span> ' : ''}${monName(m)}</b> <small>Lv ${m.lv}</small>${chips}<div class="rhp"><i style="width:${100 * pc}%;background:${pc > .5 ? '#4caf50' : pc > .2 ? '#e0a020' : '#d0402a'}"></i></div>${f.side === 'me' ? `<small>${Math.max(0, Math.ceil(m.hp))}/${mx}</small>` : ''}`;
  }
  function refresh() {
    if (!st || !st.me) return;
    hpBox(st.foe, $r('rtbFoe')); hpBox(st.me, $r('rtbMe'));
    $r('rtbTeam').innerHTML = team().map((m, i) => `<button data-sw="${i}" class="${m === st.me.m ? 'on' : ''} ${m.hp <= 0 ? 'ko' : ''}"><img src="${monPicOf(m)}"><i style="width:${Math.max(0, 100 * m.hp / monStat(m, 'hp'))}%"></i></button>`).join('');
    const c = charmId(), h = healId();
    $r('rtbCharm').querySelector('small').textContent = c ? `${inv.count(c)} left` : 'None';
    $r('rtbHeal').querySelector('small').textContent = h ? `${inv.count(h)} left` : 'None';
    const ci = $r('rtbCharm').querySelector('.ic'), hi = $r('rtbHeal').querySelector('.ic');   // the actual item on each button, so you know what it'll use
    ci.src = iconFor(c || 'root_charm'); ci.style.opacity = c ? 1 : .35; hi.src = iconFor(h || 'mon_treat'); hi.style.opacity = h ? 1 : .35;
  }
  function buildMoves() {
    $r('rtbMoves').innerHTML = st.me.m.moves.map((id, i) => { const M = MOVES[id], e = M.pow ? effOn(M.type, st.foe.m.sp) : 1;
      return `<button data-mv="${i}" style="border-color:${TYPES[M.type]}" class="${e > 1 ? 'eff-up' : e < 1 ? 'eff-dn' : ''}">${M.name}<small>${M.type}${M.pow ? (moveCat(id) === 'p' && !M.ranged ? ' · close' : ' · ranged') : ' · effect'}${e > 1 ? ' · strong!' : e === 0 ? ' · no effect' : e < 1 ? ' · weak' : ''}</small><div class="cd"></div></button>`; }).join('');
  }
  function cdUi() {
    const bs = $r('rtbMoves').children; st.me.m.moves.forEach((id, i) => { const b = bs[i]; if (!b) return; const left = Math.max(0, st.me.cd[id] || 0), tot = cdOf(id) * (st.me.m.status === 'par' ? 1.4 : 1); b.querySelector('.cd').style.transform = `scaleY(${left > 0 ? left / tot : 0})`; });
    $r('rtbDodge').querySelector('.cd').style.transform = `scaleY(${Math.max(0, st.me.dodgeT) / 1.2})`;
    $r('rtbCharm').querySelector('.cd').style.transform = `scaleY(${Math.max(0, st.charmT || 0) / 3})`;
    $r('rtbHeal').querySelector('.cd').style.transform = `scaleY(${Math.max(0, st.healT || 0) / 10})`;
  }

  // ---------- start and end
  function start(sc, foe, at) {
    const first = team().find(m => m.hp > 0); if (!first) return;
    sc.paused = true; S.seen[foe.sp] = 1;
    Sound.play('encounter'); const fl = $('flash'); fl.style.opacity = .9; setTimeout(() => fl.style.opacity = 0, 140);
    st = { from: sc, foeMon: foe, first, used: new Set([first.uid]), bolts: [], over: false, mood: typeof roamMood === 'function' ? roamMood(foe) : 'calm', runs: 0, charmT: 0, healT: 0, swT: 0,
      dodgeSkill: Math.min(.45, .12 + foe.lv / 260), aggr: .55 + Math.min(.3, foe.lv / 250), foeSpeed: .92, prevTheme: Sound.currentTheme };
    Sound.hushRain(true); Sound.theme('battle');
    document.body.classList.add('rtb-on'); ui.classList.add('show');
    const here = at || (sc.player ? { x: sc.player.x, y: sc.player.y - 40 } : { x: 0, y: 0 });
    setTimeout(() => { if (st && !st.me) { try { stageUp(sc, here); } catch (e) { console.warn('rtb', e); const d = st; st = null; ui.classList.remove('show'); document.body.classList.remove('rtb-on'); if (d) stageDown(d); sc.paused = false; Battle.start(foe); } } }, 120);
  }
  function end(out) {
    if (!st || st.over) return; st.over = true;
    const done = st, foe = done.foeMon;
    setTimeout(() => {
      ui.classList.remove('show'); document.body.classList.remove('rtb-on');
      for (const b of done.bolts) { b.g.destroy(); b.glow.destroy(); }
      stageDown(done);
      st = null; inp.jx = inp.jy = 0; inp.keys = {};
      for (const m of S.mons) { if (m.status === 'slp') m.status = null; }
      if (out === 'ran' || out === 'fled') { Sound.hushRain(false); Sound.theme(done.prevTheme || 'field'); for (const m of S.mons) { m.status = null; m.slp = 0; } if (done.from) { done.from.paused = false; if (done.from.p) done.from.p.busy = .4; if (done.from.refreshFollower) done.from.refreshFollower(); } return; }
      Battle.resolveRT(foe, out, [...done.used]);
    }, out === 'win' ? 650 : 250);
  }
  return { start, get active() { return !!st; }, get st() { return st; } };
})();

