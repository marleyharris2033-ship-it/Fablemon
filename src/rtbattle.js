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
  // a timer that can't freeze the game: an error in a battle timer (a fighter gone, the battle over) is logged, not thrown.
  // (Phaser keeps a timer whose callback threw and throws again every frame, which stopped the whole scene.)
  const later = (sc, ms, fn) => sc && sc.time ? sc.time.delayedCall(ms, () => { try { fn(); } catch (e) { console.warn('rtb timer', e); } }) : null;
  // Phaser 4 dropped setTintFill: a solid-colour flash is a tint in FILL mode, put back to normal afterwards
  const fillTint = (o, col) => { if (!o || !o.active) return o; if (o.setTintMode && Phaser.TintModes) o.setTint(col).setTintMode(Phaser.TintModes.FILL); else o.setTintFill(col); return o; };
  const unTint = o => { if (!o || !o.active) return; o.clearTint(); if (o.setTintMode && Phaser.TintModes) o.setTintMode(Phaser.TintModes.MULTIPLY); };
  let st = null;
  const ARENA_KEY = 'rtb';
  // 2-vs-1 (25 Nov, the Warden Gauntlet): a partner Fablemon (st.ally, side 'ally') fights beside yours, and the
  // foe picks between you (st.foe.tgt). The run hands its own teams in (st.myTeam / st.allyTeam), so saves never change.
  const tm = () => (st && st.myTeam) || team();
  const alive = o => !!o && o.m.hp > 0 && !o.out;
  const foesOf = f => f.side === 'foe' ? [st.me, st.ally].filter(alive) : [st.foe];
  const opp = f => f.side !== 'foe' ? st.foe : (alive(f.tgt) ? f.tgt : (foesOf(f)[0] || st.me));
  const fs = () => [st.me, st.foe, st.ally].filter(Boolean);
  const css = document.createElement('style');
  css.textContent = `
#rtb{position:fixed;inset:0;z-index:44;pointer-events:none;display:none;font-family:var(--pix,inherit)}
#rtb.show{display:block}
body.rtb-on #hud,body.rtb-on #hotbar,body.rtb-on #joy,body.rtb-on #actBtn,body.rtb-on #quest,body.rtb-on #topbtns,body.rtb-on #clock,body.rtb-on #energy,body.rtb-on #toast{visibility:hidden}
#rtb .rbox{position:absolute;pointer-events:none;background:rgba(255,250,234,.94);border:3px solid #2c4a2c;border-radius:8px;padding:3px 8px;min-width:150px;font-size:13px;color:#2a2a1a;box-shadow:0 2px 0 rgba(0,0,0,.25)}
#rtb .rbox b{font-size:13px}#rtb .rbox small{opacity:.8;font-family:var(--ui);font-weight:700}
#rtbFoe{left:8px;top:calc(8px + env(safe-area-inset-top))}#rtbMe{right:8px;top:calc(8px + env(safe-area-inset-top))}#rtbAlly{right:8px;top:calc(60px + env(safe-area-inset-top));display:none}#rtb.duo #rtbAlly{display:block}#rtb.duo #rtbTeam{top:calc(118px + env(safe-area-inset-top))}#rtb .rbox .who{font:800 9px var(--ui);color:#7a5a20;letter-spacing:.5px;text-transform:uppercase;display:block;margin-bottom:-1px}
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
#rtbAuto{position:absolute;left:14px;bottom:calc(150px + env(safe-area-inset-bottom));pointer-events:auto;font:800 13px var(--ui);padding:6px 10px;border-radius:18px;border:3px solid #2c4a2c;background:#fffaea;color:#2a2a1a;opacity:.85;touch-action:manipulation}
#rtbAuto.on{background:#ffe27a;border-color:#b8862a;opacity:1;box-shadow:0 0 0 2px #e0a020}
#rtbPick{position:absolute;inset:0;background:rgba(10,16,10,.55);display:none;align-items:center;justify-content:center;pointer-events:auto;z-index:2}
#rtbPick.show{display:flex}#rtbPick .pk{background:#fbf3d9;border:3px solid #5a3a1e;border-radius:12px;padding:12px;width:min(320px,86vw);box-shadow:0 4px 0 rgba(0,0,0,.3)}
#rtbPick h3{margin:0 0 8px;font:800 16px var(--pix,var(--ui));color:#3a2a14;text-align:center}
#rtbPick button{display:flex;align-items:center;gap:8px;width:100%;margin:4px 0;padding:5px 8px;border:2px solid #2c4a2c;border-radius:9px;background:#fffaea;font:700 14px var(--ui);color:#2a2a1a;text-align:left;touch-action:manipulation}
#rtbPick button img{width:36px;height:36px;image-rendering:pixelated}#rtbPick button small{margin-left:auto;font-weight:700;opacity:.75}
#rtbJoy{position:absolute;left:14px;bottom:calc(18px + env(safe-area-inset-bottom));width:120px;height:120px;border-radius:50%;background:rgba(255,250,234,.25);border:3px solid rgba(255,250,234,.6);pointer-events:auto;touch-action:none}
#rtbJoy i{position:absolute;left:35px;top:35px;width:50px;height:50px;border-radius:50%;background:rgba(255,250,234,.85);border:3px solid #2c4a2c}
#rtbMsg{position:absolute;left:50%;top:22%;transform:translateX(-50%);color:#fff;font-weight:800;font-size:18px;text-shadow:0 2px 0 #000,0 0 6px #000;white-space:nowrap;pointer-events:none;transition:opacity .3s}
#rtbHelp{position:absolute;left:50%;top:calc(76px + env(safe-area-inset-top));transform:translateX(-50%);background:rgba(20,30,20,.8);color:#fff;font-size:12px;padding:6px 10px;border-radius:8px;max-width:86vw;text-align:center;pointer-events:none}`;
  document.head.appendChild(css);
  const ui = document.createElement('div'); ui.id = 'rtb';
  ui.innerHTML = `<div class="rbox" id="rtbFoe"></div><div class="rbox" id="rtbMe"></div><div class="rbox" id="rtbAlly"></div><div id="rtbTeam"></div><div id="rtbMsg"></div><div id="rtbHelp"></div>
    <div id="rtbJoy"><i></i></div><div id="rtbPick"><div class="pk"><h3></h3><div class="pl"></div></div></div><div id="rtbSide"><button id="rtbRun" data-a="run">🏃<small>Run</small></button><button id="rtbHeal" data-a="heal"><img class="ic"><small>Heal</small><div class="cd"></div></button><button id="rtbCharm" data-a="charm"><img class="ic"><small>Catch</small><div class="cd"></div></button><button id="rtbDodge" data-a="dodge">💨<small>Dodge</small><div class="cd"></div></button></div><button id="rtbAuto" data-a="auto">🤖 Auto</button><div id="rtbMoves"></div>`;
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
    if (b.dataset.pk !== undefined) { const m = tm()[+b.dataset.pk]; if (st.choosing && m && m.hp > 0) { $r('rtbPick').classList.remove('show'); st.choosing = false; swapIn(m); st.me.iframe = 1.2; } return; }
    if (st.choosing) return;
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
    const spr = hdSpr(sc.add.sprite(x, y, 'mon_' + wid, side !== 'foe' ? 12 : 0).setOrigin(.5, 1), wid);
    const sh = sc.add.ellipse(x, y - 1, Math.max(12, spr.displayWidth * .55), 5, 0x1a1206, .35).setDepth(1);
    return { m, side, wid, spr, sh, x, y, dir: side !== 'foe' ? 'up' : 'down', cd: {}, stg: {}, dodgeT: 0, iframe: 0, stun: 0, protect: 0, dotT: 2, lunge: null, ai: { strafe: Math.random() < .5 ? 1 : -1, t: 0, dodgeT: 0, think: 0 }, r: Math.max(7, spr.displayWidth * .32) };
  }
  function place(f) {
    f.spr.setPosition(Math.round(f.x), Math.round(f.y)); f.spr.setDepth(f.y + 24);   // in a fight they stand clear of the long grass in front, so you can always see them f.sh.setPosition(f.x, f.y - 1);
    if (f.ring) f.ring.setPosition(f.x, f.y - f.spr.displayHeight * .45);
    if (f.aura) f.aura.setPosition(f.x, f.y - 1);
  }
  function face(f, dx, dy, moving) {
    if (!f.spr || !f.spr.active || !f.spr.anims) return;   // (a timer can outlive a fighter that was swapped out)
    const d = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    if (moving) { if (f.dir !== d || !f.spr.anims.isPlaying) { f.dir = d; f.spr.anims.play(`${f.wid}_${d}`, true); } }
    else { f.dir = d; f.spr.anims.stop(); f.spr.setFrame(DIRS.indexOf(d) * 4); }
  }

  // ---------- effects (17 Nov): a little particle kit drawn with plain images and tweens, so it works on any Phaser
  const FXT = {};
  function fxTex(sc) {
    if (FXT.ok && sc.textures.exists('fx_dot')) return;
    const mk = (key, w, h, draw) => { if (sc.textures.exists(key)) return; const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); sc.textures.addCanvas(key, c); };
    mk('fx_dot', 32, 32, (g, w) => { const r = g.createRadialGradient(16, 16, 0, 16, 16, 16); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.35, 'rgba(255,255,255,.75)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, w, w); });
    mk('fx_spark', 24, 24, g => { g.fillStyle = '#fff'; g.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? 3 : 12; g.lineTo(12 + Math.cos(a) * rr, 12 + Math.sin(a) * rr); } g.fill(); });
    mk('fx_shard', 10, 22, g => { g.fillStyle = '#fff'; g.beginPath(); g.moveTo(5, 0); g.lineTo(10, 11); g.lineTo(5, 22); g.lineTo(0, 11); g.fill(); });
    mk('fx_leaf', 16, 10, g => { g.fillStyle = '#fff'; g.beginPath(); g.ellipse(8, 5, 8, 4, 0, 0, Math.PI * 2); g.fill(); g.strokeStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.moveTo(1, 5); g.lineTo(15, 5); g.stroke(); });
    mk('fx_drop', 12, 16, g => { g.fillStyle = '#fff'; g.beginPath(); g.moveTo(6, 0); g.quadraticCurveTo(12, 9, 6, 16); g.quadraticCurveTo(0, 9, 6, 0); g.fill(); });
    mk('fx_rock', 12, 12, g => { g.fillStyle = '#fff'; g.beginPath(); g.moveTo(2, 4); g.lineTo(7, 0); g.lineTo(12, 5); g.lineTo(9, 12); g.lineTo(2, 10); g.fill(); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(6, 6, 5, 5); });
    mk('fx_slash', 48, 48, g => { g.strokeStyle = '#fff'; g.lineCap = 'round'; for (let i = 0; i < 3; i++) { g.lineWidth = 4 - i; g.globalAlpha = 1 - i * .25; g.beginPath(); g.arc(24, 24 + i * 7 - 7, 18, -2.4, -.7); g.stroke(); } });
    mk('fx_ring', 64, 64, g => { g.strokeStyle = '#fff'; g.lineWidth = 4; g.beginPath(); g.arc(32, 32, 28, 0, Math.PI * 2); g.stroke(); });
    mk('fx_smoke', 32, 32, g => { const r = g.createRadialGradient(16, 16, 2, 16, 16, 16); r.addColorStop(0, 'rgba(255,255,255,.9)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.beginPath(); for (const [x, y, rr] of [[12, 16, 10], [20, 14, 9], [16, 20, 9]]) { g.moveTo(x + rr, y); g.arc(x, y, rr, 0, Math.PI * 2); } g.fill(); });
    mk('fx_plus', 12, 12, g => { g.fillStyle = '#fff'; g.fillRect(4, 0, 4, 12); g.fillRect(0, 4, 12, 4); });
    FXT.ok = 1;
  }
  const ADD = () => Phaser.BlendModes ? Phaser.BlendModes.ADD : 1;
  // how each type looks: particle shape, colours, glow, which way bits fall
  const TFX = {
    Ember: { tex: 'fx_dot', tints: [0xffd060, 0xff8a20, 0xff4a10], add: 1, grav: -60, spin: 0, trail: 'fx_dot' },
    Tide: { tex: 'fx_drop', tints: [0x8fd8ff, 0x3a9fe0, 0xffffff], add: 0, grav: 160, spin: 0, trail: 'fx_dot', face: 1 },
    Leaf: { tex: 'fx_leaf', tints: [0x7ac74c, 0x4e9a3a, 0xb8e070], add: 0, grav: 40, spin: 1, trail: 'fx_leaf' },
    Spark: { tex: 'fx_spark', tints: [0xfff27a, 0xffd21e, 0xffffff], add: 1, grav: 0, spin: 1, trail: 'fx_spark', zap: 1 },
    Frost: { tex: 'fx_shard', tints: [0xd8f6ff, 0x8fd8f0, 0xffffff], add: 1, grav: 60, spin: 1, trail: 'fx_shard', face: 1 },
    Stone: { tex: 'fx_rock', tints: [0xa89878, 0x7a6a50, 0xc8b898], add: 0, grav: 260, spin: 1, trail: 'fx_smoke' },
    Gale: { tex: 'fx_ring', sz: .3, tints: [0xd8f0f8, 0xa8d8e8, 0xffffff], add: 1, grav: -20, spin: 0, trail: 'fx_dot', swirl: 1 },
    Shade: { tex: 'fx_smoke', tints: [0x3a2a58, 0x5b4a78, 0x24183a], add: 0, grav: -30, spin: 0, trail: 'fx_smoke' },
    Glow: { tex: 'fx_spark', tints: [0xffe0f4, 0xf0a8d8, 0xfff8c0], add: 1, grav: -30, spin: 1, trail: 'fx_spark' },
    Wild: { tex: 'fx_smoke', tints: [0xd8c8a8, 0xb8a888, 0xffffff], add: 0, grav: -10, spin: 0, trail: 'fx_dot', slash: 1 },
  };
  const tfx = type => TFX[type] || TFX.Wild;
  const pick = a => a[Math.floor(Math.random() * a.length)];
  // a burst of n bits flying out from (x, y)
  function burst(x, y, type, n = 10, o = {}) {
    const sc = st && st.sc; if (!sc) return; fxTex(sc);
    const T0 = tfx(type), sp = o.speed || 90, life = o.life || 480, sz = (o.size || 1) * (o.tex ? 1 : T0.sz || 1);
    for (let i = 0; i < n; i++) {
      const a = o.dir != null ? o.dir + (Math.random() - .5) * (o.cone || 1.4) : Math.random() * Math.PI * 2, v = sp * (.45 + Math.random() * .75);
      const im = sc.add.image(x, y, o.tex || T0.tex).setDepth(9e5 + 2).setTint(pick(o.tints || T0.tints)).setScale(sz * (.45 + Math.random() * .5));
      if (T0.add && !o.flat) im.setBlendMode(ADD());
      if (T0.face) im.setRotation(a + Math.PI / 2);
      const dx = Math.cos(a) * v * life / 1000, dy = Math.sin(a) * v * life / 1000 + (o.grav ?? T0.grav) * (life / 1000) ** 2 * .5;
      sc.tweens.add({ targets: im, x: x + dx, y: y + dy, alpha: 0, scale: im.scale * (o.grow || .4), angle: T0.spin ? (Math.random() - .5) * 540 : im.angle, duration: life * (.7 + Math.random() * .5), ease: 'Quad.out', onComplete: () => im.destroy() });
    }
  }
  function flashRing(x, y, col, r = 18, ms = 260) {
    const sc = st && st.sc; if (!sc) return; fxTex(sc);
    const im = sc.add.image(x, y, 'fx_ring').setDepth(9e5 + 1).setTint(col).setBlendMode(ADD()).setScale(r / 64);
    sc.tweens.add({ targets: im, scale: r * 2.6 / 64, alpha: 0, duration: ms, ease: 'Quad.out', onComplete: () => im.destroy() });
  }
  function glowAt(x, y, col, r = 26, ms = 200) {
    const sc = st && st.sc; if (!sc) return; fxTex(sc);
    const im = sc.add.image(x, y, 'fx_dot').setDepth(9e5 + 1).setTint(col).setBlendMode(ADD()).setScale(r / 16);
    sc.tweens.add({ targets: im, scale: r * 1.6 / 16, alpha: 0, duration: ms, onComplete: () => im.destroy() });
  }
  // a quick ghost of a fighter where it was (dodges and lunges)
  function ghost(f, col = 0xffffff, a = .5) {
    const sc = st && st.sc; if (!sc || !f.spr.active) return;
    const g = sc.add.sprite(f.spr.x, f.spr.y, f.spr.texture.key, f.spr.frame.name).setOrigin(.5, 1).setScale(f.spr.scaleX, f.spr.scaleY).setDepth(f.spr.depth - .5).setAlpha(a); fillTint(g, col);
    sc.tweens.add({ targets: g, alpha: 0, duration: 260, onComplete: () => g.destroy() });
  }
  // a zigzag of lightning between two points
  function zap(x0, y0, x1, y1, col = 0xfff27a) {
    const sc = st && st.sc; if (!sc) return;
    const g = sc.add.graphics().setDepth(9e5 + 2).setBlendMode(ADD()), n = 7;
    const draw = (w, c, a) => { g.lineStyle(w, c, a); g.beginPath(); g.moveTo(x0, y0); for (let i = 1; i < n; i++) { const t = i / n; g.lineTo(x0 + (x1 - x0) * t + (Math.random() - .5) * 12, y0 + (y1 - y0) * t + (Math.random() - .5) * 12); } g.lineTo(x1, y1); g.strokePath(); };
    draw(4, col, .5); draw(1.5, 0xffffff, 1);
    sc.tweens.add({ targets: g, alpha: 0, duration: 180, onComplete: () => g.destroy() });
  }
  const mid = f => f.y - f.spr.displayHeight * .45, f2 = f => f.y - 2;
  // a moment's freeze on big hits, so they land
  function hitStop(ms) { if (st) st.hold = Math.max(st.hold || 0, ms / 1000); }

  const STATUS_FX = { brn: 'Ember', psn: 'Shade', par: 'Spark', slp: 'Glow', frz: 'Frost' };
  // ---------- how each move looks (18 Nov): a style from its name, and the signature moves their own
  const SIG = { grovecharge: 'grove', hollowhost: 'ghosts', twinmaw: 'bite', drumroll: 'nova', bouldermortar: 'mortar', geyserdam: 'geyser' };
  const STYLE_RX = [
    ['nova', /halo|radiance|corona|belfry|peal|overload|bellow|eclipse|drum|wishwind/],
    ['erupt', /spout|geyser|root|grasp|snare|pitfall|landslide|rockslide|quake|grimroot|trap|gulp/],
    ['rain', /fall|drop|storm|hail|blizzard|starfall|cairn|mortar|squall|barrage/],
    ['beam', /beam|ray|pulse|bolt|lash|jet|lance|shock|glint|lumen/],
    ['wave', /wave|flood|undertow|gust|force|draft|breath|whiteout|drift|whorl|wind|sandblast|heat|mist/],
    ['bite', /nip|maw|fang|bite|pincer|gulp|sip/],
    ['slash', /claw|edge|slice|talon|flick|leaf|thorn|shard|scythe/],
    ['dash', /dash|rush|charge|stampede|gallop|dive|hop|pounce|march|wing|skydive|crash|lance/],
    ['spin', /roll|whirl|spin|tail/],
    ['punch', /fist|kick|punch|slam|bash|knock|butt|tackle|jab|crush|breaker|stand|march/],
  ];
  const STYLE_CACHE = {};
  function moveStyle(id) {
    if (STYLE_CACHE[id]) return STYLE_CACHE[id];
    const M = MOVES[id], key = (id + ' ' + (M.name || '')).toLowerCase(), phys = moveCat(id) === 'p' && !M.ranged;
    let s0 = SIG[id];
    if (!s0) for (const [k, rx] of STYLE_RX) if (rx.test(key)) { if (phys && ['beam', 'wave'].includes(k)) continue; if (!phys && ['bite', 'slash', 'dash', 'spin', 'punch'].includes(k)) continue; s0 = k; break; }
    return (STYLE_CACHE[id] = s0 || (phys ? 'punch' : 'orb'));
  }
  const tcol = type => Phaser.Display.Color.HexStringToColor(TYPES[type] || '#ffffff').color;
  // a streak that charges for a moment, then fires along a line at where you were
  function beam(f, tgt, id) {
    const sc = st.sc, M = MOVES[id], col = tcol(M.type), sx = f.x, sy = mid(f), tx = tgt.x, ty = mid(tgt);
    glowAt(sx, sy, col, 16, 260); burst(sx, sy, M.type, 6, { speed: -40, life: 260, size: .6 });
    later(sc, 240, () => {
      if (!st || st.over || f.m.hp <= 0) return;
      const a = Math.atan2(ty - sy, tx - sx), L = 200, ex = sx + Math.cos(a) * L, ey = sy + Math.sin(a) * L, g = sc.add.graphics().setDepth(9e5 + 2).setBlendMode(ADD());
      g.lineStyle(9, col, .45); g.lineBetween(sx, sy, ex, ey); g.lineStyle(3.5, 0xffffff, .95); g.lineBetween(sx, sy, ex, ey);
      sc.tweens.add({ targets: g, alpha: 0, duration: 260, onComplete: () => g.destroy() }); Sound.play('pop');
      // does the line pass through you now?
      const px = tgt.x - sx, py = mid(tgt) - sy, along = px * Math.cos(a) + py * Math.sin(a), off = Math.abs(-px * Math.sin(a) + py * Math.cos(a));
      if (along > 0 && along < L && off < tgt.r + 6) hit(f, tgt, id, true); else if (f.side === 'me') floatTxt(tgt, 'Miss', '#ddd');
    });
  }
  // rings that roll out from the attacker and hit anything close
  function nova(f, tgt, id, n, wide) {
    const sc = st.sc, M = MOVES[id], col = tcol(M.type), R = 100;
    for (let k = 0; k < n; k++) later(sc, k * 280, () => {
      if (!st || st.over || f.m.hp <= 0) return;
      const r = sc.add.image(f.x, mid(f), 'fx_ring').setDepth(9e5 + 1).setTint(col).setBlendMode(ADD()).setScale(.15); glowAt(f.x, mid(f), col, 18, 200);
      sc.tweens.add({ targets: r, scale: R * 2 / 64, alpha: 0, duration: 420, ease: 'Quad.out', onComplete: () => r.destroy() }); Sound.play('pop');
      for (const t of wide || [tgt]) { const d = Math.hypot(t.x - f.x, t.y - f.y);
        later(sc, Math.min(400, d / R * 420), () => { if (st && !st.over && Math.hypot(t.x - f.x, t.y - f.y) <= R + t.r) hit(f, t, id, k === 0); }); }
    });
  }
  // shadows on the ground where you're standing, then it all comes down
  function rain(f, tgt, id, n, lob) {
    const sc = st.sc, M = MOVES[id], T0 = tfx(M.type), drops = Math.max(3, n), cx = tgt.x, cy = tgt.y; let hits = 0;
    for (let k = 0; k < drops; k++) {
      const lx = cx + (k ? (Math.random() - .5) * 44 : 0), ly = cy + (k ? (Math.random() - .5) * 30 : 0), dl = k * 120;
      const sh = sc.add.ellipse(lx, ly - 1, 6, 3, 0x000000, .35).setDepth(3); sc.tweens.add({ targets: sh, scaleX: 3.4, scaleY: 3.4, duration: 520, delay: dl });
      const rock = sc.add.image(lob ? f.x : lx, lob ? mid(f) : ly - 150, T0.tex === 'fx_ring' || T0.tex === 'fx_smoke' ? 'fx_dot' : T0.tex).setDepth(9e5).setTint(pick(T0.tints)).setScale(lob ? 1.5 : 1.1).setAlpha(0);
      if (T0.add) rock.setBlendMode(ADD()); if (T0.face) rock.setRotation(Math.PI);
      const pr = { t: 0 };
      sc.tweens.add({ targets: pr, t: 1, delay: dl, duration: 560, ease: lob ? 'Linear' : 'Quad.in', onStart: () => rock.setAlpha(1),
        onUpdate: () => { if (lob) rock.setPosition(f.x + (lx - f.x) * pr.t, mid(f) + (ly - mid(f)) * pr.t - Math.sin(pr.t * Math.PI) * 70); else rock.setPosition(lx, ly - 150 * (1 - pr.t)); if (T0.spin) rock.angle += 12; },
        onComplete: () => { rock.destroy(); sh.destroy(); if (!st || st.over) return;
          burst(lx, ly - 4, M.type, 8, { speed: 70, life: 380, size: .9 }); flashRing(lx, ly - 2, tcol(M.type), 9, 220); if (lob || k === 0) sc.cameras.main.shake(70, .002);
          if (hits < n && Math.hypot(tgt.x - lx, tgt.y - ly) < tgt.r + 13) { hit(f, tgt, id, hits === 0); hits++; } } });
    }
  }
  // a warning ring under you, then it bursts up from the ground
  function erupt(f, tgt, id, big) {
    const sc = st.sc, M = MOVES[id], col = tcol(M.type), x = tgt.x, y = tgt.y;
    const warn = sc.add.image(x, y - 2, 'fx_ring').setDepth(3).setTint(col).setScale(.55, .3).setAlpha(.9);
    sc.tweens.add({ targets: warn, alpha: .35, duration: 150, yoyo: true, repeat: 2 });
    burst(x, y - 2, M.type, 4, { speed: 20, life: 500, dir: -Math.PI / 2, cone: 1, size: .5 });
    later(sc, 620, () => {
      warn.destroy(); if (!st || st.over || f.m.hp <= 0) return;
      const col2 = sc.add.image(x, y, 'fx_dot').setOrigin(.5, 1).setDepth(9e5 + 1).setTint(col).setBlendMode(ADD()).setScale(.9, .1);
      sc.tweens.add({ targets: col2, scaleY: big ? 6 : 3.4, duration: 160, ease: 'Quad.out', onComplete: () => sc.tweens.add({ targets: col2, alpha: 0, scaleX: .4, duration: 380, onComplete: () => col2.destroy() }) });
      burst(x, y - (big ? 30 : 14), M.type, big ? 22 : 12, { speed: big ? 120 : 80, dir: -Math.PI / 2, cone: 1.6, life: big ? 800 : 520, size: big ? 1.2 : 1 });
      sc.cameras.main.shake(big ? 200 : 100, big ? .006 : .003); Sound.play('hit');
      if (Math.hypot(tgt.x - x, tgt.y - y) < tgt.r + 14) hit(f, tgt, id, true); else if (f.side === 'me') floatTxt(tgt, 'Dodged!', '#bfe8ff');
    });
  }
  // Hollow Host: ghostly bears rush the target
  function ghosts(f, tgt, id) {
    const sc = st.sc; let landed = 0;
    for (let k = 0; k < 3; k++) later(sc, k * 150, () => {
      if (!st || st.over || !f.spr.active) return;
      const g = sc.add.sprite(f.x + (k - 1) * 14, f.y, f.spr.texture.key, f.spr.frame.name).setOrigin(.5, 1).setScale(f.spr.scaleX * .8, f.spr.scaleY * .8).setDepth(9e5).setAlpha(.6).setBlendMode(ADD()); g.setTint(0xb090ff);
      sc.tweens.add({ targets: g, x: tgt.x + (k - 1) * 8, y: tgt.y, duration: 380, ease: 'Quad.in', onComplete: () => { g.destroy(); if (!st || st.over) return; burst(tgt.x, mid(tgt), 'Shade', 10, { speed: 90 }); if (!landed && Math.hypot(tgt.x - g.x, tgt.y - g.y) < tgt.r + 16) { landed = 1; hit(f, tgt, id, true); } } });
    });
  }
  // ---------- doing moves
  function useMove(f, id) {
    const sc = st.sc, M = MOVES[id], tgt = opp(f);
    if (!M || f.stun > 0 || f.lunge || (f.cd[id] || 0) > 0) return false;
    f.cd[id] = cdOf(id) * (f.m.status === 'par' ? 1.4 : 1) * (st.duo && f.side === 'foe' ? st.duo.foeCd : 1);
    const dx = tgt.x - f.x, dy = tgt.y - f.y; face(f, dx, dy, false);
    if (f.side === 'me') say(M.name, 700);
    if (M.protect) { f.protect = 1.4; ring(f, 0x9fd8ff); Sound.play('pop'); fxTex(sc);
      const bub = sc.add.image(f.x, mid(f), 'fx_ring').setDepth(9e5 + 1).setTint(0x9fd8ff).setBlendMode(ADD()).setScale((f.r + 12) / 32).setAlpha(.9);
      sc.tweens.add({ targets: bub, alpha: .35, duration: 180, yoyo: true, repeat: 3, onUpdate: () => bub.setPosition(f.x, mid(f)), onComplete: () => bub.destroy() }); return true; }
    if (M.heal && !M.pow) { healF(f, monStat(f.m, 'hp') * M.heal); return true; }
    if (M.rest) { f.m.hp = monStat(f.m, 'hp'); f.m.status = 'slp'; f.stun = 3; Sound.play('fill'); floatTxt(f, 'Zzz', '#9ab8ff'); refresh(); return true; }
    if (M.haze) { for (const o of fs()) o.stg = {}; Sound.play('swish'); say('Every stat change blown away!'); refresh(); return true; }
    if (M.cure) { f.m.status = null; Sound.play('fill'); refresh(); return true; }
    if (M.critUp) { f.critUp = Math.min(2, (f.critUp || 0) + M.critUp); ring(f, 0xffd060); Sound.play('pop'); return true; }
    if (M.weather || M.hazard) { buff(f, f, ['self', moveCat(id) === 'e' ? 'eatk' : 'atk', 1]); return true; }
    const selfOnly = (M.stat || M.stats) && (M.stats || [M.stat]).every(s => s[0] === 'self') && !M.pow;
    if (selfOnly) { for (const s of M.stats || [M.stat]) buff(f, f, s); return true; }
    if (!M.pow) { bolt(f, tgt, id, { slow: true }); return true; }   // status and stat-lowering moves fly at the target
    const n = M.hits ? M.hits[0] + Math.floor(Math.random() * (M.hits[1] - M.hits[0] + 1)) : 1;
    const sty = moveStyle(id), wide = st.duo && f.side === 'foe' ? foesOf(f) : null;   // a Warden's big moves come down on both of you
    if (wide && wide.length > 1 && ['nova', 'rain', 'mortar', 'erupt', 'geyser'].includes(sty)) say(`${MOVES[id].name}! Spread out!`, 900);
    if (sty === 'beam') { beam(f, tgt, id); return true; }
    if (sty === 'nova') { nova(f, tgt, id, n, wide); return true; }
    if (sty === 'rain' || sty === 'mortar') { for (const t of wide || [tgt]) rain(f, t, id, n, sty === 'mortar'); return true; }
    if (sty === 'erupt' || sty === 'geyser') { for (const t of wide || [tgt]) erupt(f, t, id, sty === 'geyser'); return true; }
    if (sty === 'ghosts') { ghosts(f, tgt, id); return true; }
    if (moveCat(id) === 'p' && !M.ranged) { lunge(f, tgt, id, n, sty); return true; }
    for (let k = 0; k < n; k++) later(sc, k * 110, () => st && bolt(f, tgt, id, { spread: n > 1 ? (Math.random() - .5) * .25 : 0, wave: sty === 'wave' }));
    return true;
  }
  function lunge(f, tgt, id, n, sty) {
    const far = sty === 'dash' || sty === 'grove', sc = st.sc, dx = tgt.x - f.x, dy = tgt.y - f.y, d = Math.hypot(dx, dy) || 1, reach = Math.min(far ? 84 : 48, Math.max(0, d - tgt.r - 2));
    if (sty === 'spin') { const r = sc.add.image(f.x, mid(f), 'fx_ring').setDepth(9e5 + 1).setTint(tcol(MOVES[id].type)).setBlendMode(ADD()).setScale((f.r + 8) / 32, (f.r + 8) / 64); sc.tweens.add({ targets: r, angle: 720, alpha: 0, duration: 380, onUpdate: () => r.setPosition(f.x, mid(f)), onComplete: () => r.destroy() }); }
    if (sty === 'grove') for (let k = 0; k < 6; k++) later(sc, k * 40, () => st && burst(f.x, mid(f), 'Leaf', 5, { speed: 70, life: 600, size: 1.1 }));
    const ux = dx / d, uy = dy / d, lt = far ? .24 : .18; f.lunge = { t: lt, vx: ux * reach / lt, vy: uy * reach / lt };
    Sound.play('swish'); face(f, dx, dy, true);
    burst(f.x, f.y - 2, 'Wild', 5, { tex: 'fx_smoke', tints: [0xd8c8a8, 0xc8b890], speed: 40, life: 380, dir: Math.atan2(-uy, -ux), cone: 1.6, size: .8, flat: 1 });
    for (const t of [40, 90, 140]) later(sc, t, () => st && f.spr.active && ghost(f, Phaser.Display.Color.HexStringToColor(TYPES[MOVES[id].type] || '#fff').color, .35));
    later(sc, 190, () => {
      if (!st) return; f.lunge = null; face(f, dx, dy, false);
      for (let k = 0; k < n; k++) later(sc, k * 120, () => { if (!st) return; const dd = Math.hypot(tgt.x - f.x, tgt.y - f.y); if (dd <= tgt.r + f.r + 8) hit(f, tgt, id, k === 0); else if (k === 0 && f.side === 'me') floatTxt(tgt, 'Miss', '#ddd'); });
    });
  }
  function bolt(f, tgt, id, o = {}) {
    const sc = st.sc, M = MOVES[id], col = Phaser.Display.Color.HexStringToColor(TYPES[M.type] || '#ffffff').color;
    const sx = f.x, sy = f.y - f.spr.displayHeight * .45, tx = tgt.x, ty = tgt.y - tgt.spr.displayHeight * .45;
    let a = Math.atan2(ty - sy, tx - sx) + (o.spread || 0);
    fxTex(sc); const T0 = tfx(M.type), sp = o.slow ? 110 : 175;
    const g = sc.add.image(sx, sy, T0.face || T0.tex === 'fx_leaf' || T0.tex === 'fx_rock' ? T0.tex : 'fx_dot').setDepth(9e5).setTint(pick(T0.tints)).setScale(o.slow ? .7 : 1.1);
    if (g.texture.key === 'fx_dot') g.setTint(0xffffff).setScale(o.slow ? .35 : .5);
    const glow = sc.add.image(sx, sy, 'fx_dot').setDepth(9e5 - 1).setTint(col).setBlendMode(ADD()).setScale(o.slow ? .8 : 1.2).setAlpha(.85);
    if (!o.slow) { flashRing(sx, sy, col, 8, 200); burst(sx, sy, M.type, 4, { speed: 50, life: 260, dir: a, cone: .9, size: .7 }); }
    if (o.wave) { g.setTexture('fx_slash').setTint(pick(T0.tints)).setBlendMode(ADD()).setScale(.5).setRotation(a + Math.PI / 2); glow.setScale(1.6); }
    st.bolts.push({ f, tgt, id, x: sx, y: sy, vx: Math.cos(a) * (o.wave ? 150 : sp), vy: Math.sin(a) * (o.wave ? 150 : sp), life: 1.6, g, glow, col, type: M.type, tr: 0, slow: !!o.slow, wide: o.wave ? 16 : 5, wave: !!o.wave }); Sound.play('pop');
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
    let { dmg, e, crit } = damage(att, def, id); if (st.duo && def.side === 'foe') dmg = Math.max(1, Math.round(dmg * st.duo.foeTake));
    const dealt = Math.min(dmg, def.m.hp);
    def.m.hp = Math.max(0, def.m.hp - dmg); Sound.play('hit');
    fillTint(def.spr, 0xffffff); later(sc, 70, () => unTint(def.spr));
    { const T0 = tfx(M.type), hx = def.x, hy = mid(def), big = e > 1 || crit > 1, ang = Math.atan2(def.y - att.y, def.x - att.x);   // the impact, by type
      burst(hx, hy, M.type, big ? 16 : 10, { speed: big ? 130 : 95, dir: ang, cone: 2.2, size: big ? 1.25 : 1 });
      flashRing(hx, hy, Phaser.Display.Color.HexStringToColor(TYPES[M.type] || '#fff').color, big ? 16 : 11, big ? 320 : 240); glowAt(hx, hy, 0xffffff, big ? 22 : 14, 140);
      if (T0.zap) { zap(hx, hy - 40, hx, hy); zap(hx - 14, hy - 6, hx + 14, hy + 4); }
      const sty = moveStyle(id);
      if (sty === 'bite') for (const sgn of [-1, 1]) { const j = sc.add.image(hx, hy + sgn * 12, 'fx_slash').setDepth(9e5 + 3).setTint(0xffffff).setBlendMode(ADD()).setScale(.7, .5 * sgn).setRotation(ang); sc.tweens.add({ targets: j, y: hy + sgn * 2, alpha: 0, duration: 200, ease: 'Quad.in', onComplete: () => j.destroy() }); }
      else if (sty === 'punch' || sty === 'grove') { const st0 = sc.add.image(hx, hy, 'fx_spark').setDepth(9e5 + 3).setTint(0xffffff).setBlendMode(ADD()).setScale(.4); sc.tweens.add({ targets: st0, scale: sty === 'grove' ? 2.6 : 1.6, alpha: 0, angle: 45, duration: 220, onComplete: () => st0.destroy() }); flashRing(hx, f2(def), 0xffffff, 10, 260); if (sty === 'grove') burst(hx, hy, 'Leaf', 18, { speed: 140, size: 1.2 }); }
      else if (T0.slash || sty === 'slash' || (moveCat(id) === 'p' && !M.ranged)) { const sl = sc.add.image(hx, hy, 'fx_slash').setDepth(9e5 + 3).setRotation(ang).setScale(.5).setTint(T0.slash ? 0xffffff : pick(T0.tints)).setBlendMode(ADD()); sc.tweens.add({ targets: sl, scale: 1.05, alpha: 0, duration: 220, ease: 'Quad.out', onComplete: () => sl.destroy() }); }
      if (T0.swirl) for (let k = 0; k < 2; k++) { const r = sc.add.image(hx, hy, 'fx_ring').setDepth(9e5 + 2).setTint(0xe8f8ff).setBlendMode(ADD()).setScale(.2, .12); sc.tweens.add({ targets: r, scaleX: .7, scaleY: .4, alpha: 0, angle: 200, y: hy - 14 - k * 8, delay: k * 80, duration: 360, onComplete: () => r.destroy() }); }
      if (big) { hitStop(crit > 1 ? 90 : 60); sc.cameras.main.shake(crit > 1 ? 160 : 110, crit > 1 ? .006 : .0035); } else if (dmg >= monStat(def.m, 'hp') * .2) sc.cameras.main.shake(80, .002); }
    const d = Math.hypot(def.x - att.x, def.y - att.y) || 1; def.kx = (def.x - att.x) / d * 120; def.ky = (def.y - att.y) / d * 120;
    floatTxt(def, (crit > 1 ? '✦' : '') + dmg, e > 1 ? '#ffe066' : e < 1 ? '#bbbbbb' : '#ffffff', e > 1 ? 16 : 13);
    if (first && e > 1) say("It's super effective!", 900); else if (first && e < 1 && e > 0) say("It's not very effective...", 900); else if (e === 0) say("It doesn't affect it...", 900);
    if (crit > 1) floatTxt(def, 'Critical!', '#ffd060', 11);
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
    f.m.status = s; if (s === 'slp') f.stun = 2.6; floatTxt(f, STATUS[s][0], STATUS[s][1]); refresh(); burst(f.x, mid(f), STATUS_FX[s] || 'Shade', 10, { speed: 60, size: .8 });
  }
  function buff(by, f, [who, k, n]) {
    f.stg[k] = Math.max(-6, Math.min(6, (f.stg[k] || 0) + n));
    floatTxt(f, `${{ atk: 'Atk', def: 'Def', eatk: 'EAtk', edef: 'EDef', spd: 'Spd' }[k] || k} ${n > 0 ? '▲' : '▼'}`, n > 0 ? '#9ff0a8' : '#ffb0a0');
    ring(f, n > 0 ? 0x9ff0a8 : 0xff9080); Sound.play(n > 0 ? 'pop' : 'pick'); refresh();
    burst(f.x, n > 0 ? f.y : mid(f) - 6, n > 0 ? 'Glow' : 'Shade', 9, { tints: n > 0 ? [0x9ff0a8, 0xe8ffe8, 0xfff8a0] : [0xff9080, 0x8a4a5a], speed: 30, dir: n > 0 ? -Math.PI / 2 : Math.PI / 2, cone: 1.2, life: 650, grav: n > 0 ? -60 : 60, size: .8 });
  }
  function healF(f, amt, quiet) { const h = Math.min(monStat(f.m, 'hp') - f.m.hp, Math.floor(amt)); if (h <= 0) return; f.m.hp += h; floatTxt(f, '+' + h, '#9ff0a8'); burst(f.x, f.y - 4, 'Leaf', 8, { tex: 'fx_plus', tints: [0x9ff0a8, 0xe8ffe8, 0x6fd88a], speed: 26, dir: -Math.PI / 2, cone: 1.6, life: 700, grav: -50, size: .9 }); glowAt(f.x, mid(f), 0x9ff0a8, 20, 400); if (!quiet) Sound.play('fill'); refresh(); }
  function ring(f, col) { const sc = st.sc, r = sc.add.circle(f.x, f.y - f.spr.displayHeight * .45, f.r + 6).setStrokeStyle(2, col, 1).setDepth(9e5); sc.tweens.add({ targets: r, scale: 1.8, alpha: 0, duration: 420, onComplete: () => r.destroy() }); }
  function floatTxt(f, t, col, size = 12) {
    const sc = st && st.sc; if (!sc || !f || !f.spr || !f.spr.active) return;
    const x = f.x + (Math.random() - .5) * 8, y = f.y - f.spr.displayHeight - 2;
    const tx = sc.add.text(x, y, t, { fontFamily: 'monospace', fontSize: size + 'px', fontStyle: 'bold', color: col, stroke: '#000', strokeThickness: 3 }).setOrigin(.5, 1).setDepth(9e5 + 5).setResolution(3);
    tx.setScale(.4); sc.tweens.add({ targets: tx, scale: size >= 15 ? 1.35 : 1.1, duration: 110, ease: 'Back.out', onComplete: () => sc.tweens.add({ targets: tx, scale: 1, duration: 90 }) });
    sc.tweens.add({ targets: tx, y: y - 16, alpha: 0, delay: 380, duration: 520, onComplete: () => tx.destroy() });
  }

  // ---------- the player's buttons
  function useMoveBtn(i) { if (!st || st.over || st.meOut) return; const id = st.me.m.moves[i]; if (id && !useMove(st.me, id) && (st.me.cd[id] || 0) > 0) Sound.play('error'); }
  function charmId() { const p = (S.rtSlots || {}).charm; if (p && inv.count(p) > 0) return p; return RT_CHARMS.find(c => inv.count(c) > 0) || null; }
  function healId() { const p = (S.rtSlots || {}).heal; if (p && ITEMS[p] && inv.count(p) > 0) return p; const me = st && st.me && st.me.m; if (me && me.status && inv.count('tonic') > 0) return 'tonic'; return ['mon_treat', 'berry_crumble', 'honey', 'berry', 'hearth_elixir'].find(c => ITEMS[c] && inv.count(c) > 0) || null; }
  function act(a) {
    if (!st || st.over) return;
    const me = st.me;
    if (st.noItems && (a === 'heal' || a === 'charm')) return say('No items in the Gauntlet: the rest stops are your healing.');
    if (a === 'dodge') {
      if (st.meOut || me.dodgeT > 0 || me.stun > 0) return;
      let dx = inp.jx || ((inp.keys.d || inp.keys.arrowright ? 1 : 0) - (inp.keys.a || inp.keys.arrowleft ? 1 : 0)), dy = inp.jy || ((inp.keys.s || inp.keys.arrowdown ? 1 : 0) - (inp.keys.w || inp.keys.arrowup ? 1 : 0));
      if (!dx && !dy) { const fx = st.foe.x - me.x, fy = st.foe.y - me.y, d = Math.hypot(fx, fy) || 1; dx = -fy / d; dy = fx / d; }   // no direction held: sidestep
      const d = Math.hypot(dx, dy) || 1; me.lunge = { t: .16, vx: dx / d * 260, vy: dy / d * 260 }; me.iframe = .35; me.dodgeT = 1.2; me.spr.setAlpha(.6); for (const t of [0, 50, 100, 150]) later(st.sc, t, () => st && ghost(me, 0xbfe8ff, .45)); burst(me.x, me.y - 2, 'Wild', 4, { tex: 'fx_smoke', speed: 30, life: 300, size: .6, flat: 1 });
      later(st.sc, 170, () => { if (st) { me.lunge = null; me.spr.setAlpha(1); } }); Sound.play('swish'); return;
    }
    if (a === 'auto') { opts.rtAuto = !opts.rtAuto; saveOpts(); autoUi(); say(opts.rtAuto ? 'Auto battle on: your Fablemon fights by itself.' : 'Auto battle off: you’re in control.', 1300); return; }
    if (a === 'charm' && st.T) return say("You can't catch someone else's Fablemon!");
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
    if (a === 'run' && st.T) return say("You can't run from a trainer battle!");
    if (a === 'run') {
      const d = Math.hypot(st.foe.x - me.x, st.foe.y - me.y);
      st.runs = (st.runs || 0) + 1;
      if (d > 90 || Math.random() < .45 + .15 * st.runs) { Sound.play('swish'); say('You got away safely!'); return end('ran'); }
      say("Couldn't get away! Get further from it first."); return;
    }
  }
  function switchTo(i) {
    if (!st || st.over || st.meOut) return; const m = tm()[i]; if (!m || m.hp <= 0 || m === st.me.m || (st.swT || 0) > 0) return;
    swapIn(m); st.swT = 3;
  }
  function choose(me) {
    st.choosing = true; me.spr.setTint(0x777777).setAlpha(.5); inp.jx = inp.jy = 0;
    for (const b of st.bolts.slice()) kill(b);
    const P = $r('rtbPick'); P.querySelector('h3').textContent = `${monName(me.m)} fainted! Who's next?`;
    P.querySelector('.pl').innerHTML = tm().map((m, i) => m.hp > 0 ? `<button data-pk="${i}"><img src="${monPicOf(m)}">${monName(m)} <small>Lv ${m.lv} · ${m.hp}/${monStat(m, 'hp')}</small></button>` : '').join('');
    P.classList.add('show');
  }   // (18 Nov: you always pick who goes next, even on Auto)
  function autoUi() { const b = $r('rtbAuto'); if (b) b.classList.toggle('on', !!opts.rtAuto); }
  function nextFoe(m) {   // the trainer sends out their next Fablemon from where they stand
    st.switching = true; for (const b of st.bolts.slice()) kill(b);
    const sc = st.sc, old = st.foe;
    later(sc, 900, () => {
      if (!st || st.over) return;
      if (old.ring) old.ring.destroy(); old.sh.destroy(); old.spr.destroy();
      st.foeMon = m; S.seen[m.sp] = 1;
      st.foe = fighter(sc, m, 'foe', st.home.x, st.home.y); place(st.foe); face(st.foe, st.me.x - st.foe.x, st.me.y - st.foe.y, false); st.foe.iframe = .8;
      say(`${st.T.label} ${st.T.name} sent out ${SPECIES[m.sp].name}!`, 1400); Sound.play('pop');
      buildMoves(); refresh(); st.switching = false; st.ready = .9;
    });
  }
  function swapIn(m) {
    const sc = st.sc, old = st.me, x = old.x, y = old.y;
    old.spr.destroy(); old.sh.destroy();
    st.me = fighter(sc, m, 'me', x, y); st.me.iframe = .8; st.used.add(m.uid); place(st.me); buildMoves(); refresh();
    say(`Go, ${monName(m)}!`, 900); Sound.play('pop');
  }
  function swapAlly(m) {   // the partner sends out its next Fablemon where the last one stood
    const sc = st.sc, old = st.ally, x = old.x, y = old.y;
    old.spr.destroy(); old.sh.destroy();
    st.ally = fighter(sc, m, 'ally', x, y); st.ally.iframe = 1; place(st.ally); refresh();
    say(`${st.allyName || 'Partner'} sent out ${monName(m)}!`, 1000); Sound.play('pop');
  }
  function bowOut(f, line) {   // a side with nobody left steps off the field; the other fights on
    f.out = true; f.spr.setVisible(false); f.sh.setVisible(false); if (f.aura) f.aura.setVisible(false);
    if (st.foe.tgt === f) st.foe.tgt = null; say(line, 1600); refresh();
  }
  function throwCharm(cid) {
    const sc = st.sc, me = st.me, foe = st.foe, img = sc.add.image(me.x, me.y - 16, 'objects', 'stone').setDepth(9e5);
    const icon = iconFor(cid); if (icon && !sc.textures.exists('rt_' + cid)) { const im = new Image(); im.onload = () => { if (!sc.textures.exists('rt_' + cid)) sc.textures.addImage('rt_' + cid, im); if (img.active) img.setTexture('rt_' + cid).setDisplaySize(12, 12); }; im.src = icon; } else if (sc.textures.exists('rt_' + cid)) img.setTexture('rt_' + cid).setDisplaySize(12, 12);
    say(`You threw a ${ITEMS[cid].name}!`, 900);
    const x0 = img.x, y0 = img.y, pr = { t: 0 };   // the charm curves after the wild one, so it only misses if it dodges
    sc.tweens.add({ targets: pr, t: 1, duration: 380, ease: 'Quad.out', onUpdate: () => { if (!img.active || !st) return; img.setPosition(x0 + (st.foe.x - x0) * pr.t, y0 + (st.foe.y - 12 - y0) * pr.t - Math.sin(pr.t * Math.PI) * 18); }, onComplete: () => {
      if (!st) return img.destroy();
      if (foe.iframe > 0 || Math.hypot(img.x - foe.x, img.y - (foe.y - 12)) > 40) { say('It missed!'); return img.destroy(); }
      // the classic catch odds
      const Mx = monStat(foe.m, 'hp'), rate = (foe.m.alpha ? .6 : 1) * (SPECIES[foe.m.sp].rate || 120) * (cid === 'sturdy_charm' ? 1.5 : cid === 'skyward_charm' ? 2 : 1) * (foe.m.status === 'slp' ? 2 : foe.m.status ? 1.5 : 1) * (typeof blessed === 'function' && blessed('wild') ? 1.15 : 1);
      const a2 = Math.max(1, ((3 * Mx - 2 * foe.m.hp) * rate) / (3 * Mx)), b2 = a2 >= 255 ? 65536 : 1048560 / Math.sqrt(Math.sqrt(16711680 / a2));
      let shakes = 0; while (shakes < 4 && Math.random() * 65536 < b2) shakes++;
      foe.spr.setVisible(false); foe.sh.setVisible(false); foe.stun = 9; st.catching = 1; Sound.play('pop');
      let k = 0; const wob = () => {
        if (!st) return;
        if (k < Math.min(3, shakes)) { k++; Sound.play('wobble'); burst(img.x, img.y - 4, 'Glow', 3, { speed: 30, life: 380, size: .5 }); sc.tweens.add({ targets: img, angle: { from: -20, to: 20 }, duration: 160, yoyo: true, onComplete: () => later(sc, 300, wob) }); return; }
        if (shakes >= 4) { burst(img.x, img.y, 'Glow', 18, { speed: 110, life: 800, size: 1.1, tints: [0xfff27a, 0xffe0f4, 0x9ff0a8, 0x8fd8ff] }); flashRing(img.x, img.y, 0xfff27a, 16, 420); Sound.play('gotcha'); img.destroy(); return later(st.sc, 450, () => end('caught')); }
        img.destroy(); foe.spr.setVisible(true); foe.sh.setVisible(true); foe.stun = .6; foe.iframe = .6; st.catching = 0; Sound.play('error');
        say(['Oh no! It broke free!', 'Aww! It almost chose you!', 'So close! It wriggled out!', 'Argh! Nearly had it!'][Math.min(3, shakes)], 1300);
      }; later(sc, 350, wob);
    } });
  }

  // ---------- the foe's mind
  // the brain: the wild one or the trainer's Fablemon, and yours too on Auto (opts.rtAuto, 18 Nov)
  function think(dt, f = st.foe, me = opp(st.foe), auto = false) {
    const M0 = f.m.moves.map(id => MOVES[id]).filter(Boolean), skill = auto ? .7 : st.dodgeSkill, aggr = auto ? .95 : st.aggr;
    if (f.stun > 0 || f.lunge || st.catching) return [0, 0];
    if (!auto && st.T && st.T.boss && (st.T.heals ?? 2) > 0 && f.m.hp > 0 && f.m.hp < monStat(f.m, 'hp') * .3 && !(st.fhT > 0)) {   // a Warden patches their Fablemon up, like in a classic battle
      st.T.heals = (st.T.heals ?? 2) - 1; st.fhT = 6; healF(f, Math.ceil(monStat(f.m, 'hp') / 2)); say(`${st.T.name} used a potion on ${SPECIES[f.m.sp].name}!`, 1300); return [0, 0];
    }
    const dx = me.x - f.x, dy = me.y - f.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
    const physical = monStat(f.m, 'atk') >= monStat(f.m, 'eatk');
    // shy ones bolt for the edge when they're losing
    if (!auto && st.mood === 'shy' && f.m.hp < monStat(f.m, 'hp') * .3) {
      const ex = f.x < st.W / 2 ? -1 : 1; if (f.x <= st.B.x0 + 2 || f.x >= st.B.x1 - 2) { say(`The wild ${SPECIES[f.m.sp].name} ran away!`, 1500); end('fled'); return [0, 0]; }
      return [ex, -uy * .3];
    }
    // dodge bolts coming at it
    f.ai.dodgeT -= dt;
    if (f.ai.dodgeT <= 0) for (const b of st.bolts) if (b.tgt === f && !b.seen) {
      const rx = f.x - b.x, ry = f.y - 10 - b.y, along = (rx * b.vx + ry * b.vy) / Math.hypot(b.vx, b.vy);
      if (along > 0 && along < 70) { b.seen = 1; if (Math.random() < skill) { const s = Math.random() < .5 ? 1 : -1; f.lunge = { t: .15, vx: -b.vy / 175 * 230 * s, vy: b.vx / 175 * 230 * s }; f.iframe = .2; f.ai.dodgeT = 1.4; later(st.sc, 160, () => st && (f.lunge = null)); return [0, 0]; } }
    }
    // pick a move
    f.ai.think -= dt;
    if (f.ai.think <= 0) {
      f.ai.think = .25 + Math.random() * .35;
      const ready = f.m.moves.filter(id => MOVES[id] && !(f.cd[id] > 0));
      if (ready.length) {
        const score = id => { const M = MOVES[id]; if (!M.pow) return (Math.random() < .18 ? 60 : 0); const close = moveCat(id) === 'p' && !M.ranged; if (close && d > 46) return 0; if (!close && d > 190) return 0; return M.pow * effOn(M.type, me.m.sp) * stabOf(M.type, f.m.sp) * (M.hits ? (M.hits[0] + M.hits[1]) / 2 : 1) * (.7 + Math.random() * .6); };
        const best = ready.map(id => [id, score(id)]).sort((a, b) => b[1] - a[1])[0];
        if (best && best[1] > 0 && Math.random() < aggr) useMove(f, best[0]);
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
        if (o === st.keep) continue;   // the trainer you're fighting stays
        if (/^(mon_|tr_|npc_|ppl_|ew_)/.test(o.texture.key)) { st.hidden.push(o); o.setVisible(false); }
      }
      for (const r of sc.roam || []) if (r.glint && r.glint.visible) { st.hidden.push(r.glint); r.glint.setVisible(false); }
      if (sc.follower && sc.follower.visible && sc.follower !== st.keep) { st.hidden.push(sc.follower); sc.follower.setVisible(false); }
    } else for (const o of st.hidden || []) if (o.active) o.setVisible(true);
    if (sc.syncShadows) sc.syncShadows();
  }
  function stageUp(sc, at) {
    st.sc = sc; const cam = sc.cameras.main, zoom = cam.zoom, cw = cam.width / zoom, ch = cam.height / zoom;
    const pl = sc.player; let px = pl ? pl.x : at.x, py = pl ? pl.y : at.y;
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
    clearStage(sc, true); if (pl) { st.plWas = { x: pl.x, y: pl.y, d: pl.depth }; pl.setDepth(pl.y + 1); const tr = st.keep || at, u = dxy(pl, tr);   // trainers: you step back a few paces so there's room; wild ones: just a step
      let bx = pl.x - dxy(at, pl)[0] * 12, by = pl.y - dxy(at, pl)[1] * 12;
      if (st.T) for (const dd of [92, 76, 60, 44, 28, 12]) { const tx = pl.x + u[0] * dd, ty = pl.y + u[1] * dd; if (!solid(tx, ty) && tx > st.B.x0 && tx < st.B.x1 && ty > st.B.y0 && ty < st.B.y1) { bx = tx; by = ty; break; } }
      if (!solid(bx, by)) { sc.tweens.add({ targets: pl, x: bx, y: by, duration: st.T ? 320 : 200 }); if (st.T) { px = bx; py = by; } }
      if (st.T && st.keep) {   // their Fablemon comes out in front of them: past any counter or dais, onto open ground
        let d0 = 14; while (d0 < 90 && solid(tr.x + u[0] * d0, tr.y + u[1] * d0 + 2)) d0 += 4;   // (u points from the trainer to you)
        d0 = Math.min(d0 + 8, Math.max(14, Math.hypot(tr.x - bx, tr.y - by) - 30));
        at = { x: tr.x + u[0] * d0, y: tr.y + u[1] * d0 + 2 };
      }
    }
    // the wild one where it stood; yours hops out beside you, towards it
    const into = (x, y) => [Math.max(st.B.x0, Math.min(st.B.x1, x)), Math.max(st.B.y0, Math.min(st.B.y1, y))];
    let [fx, fy] = into(at.x, at.y);
    const dx = fx - px, dy = fy - py, d = Math.hypot(dx, dy) || 1;
    let [mx, my] = into(px + dx / d * 14, py + dy / d * 14); if (solid(mx, my)) [mx, my] = into(px, py);
    st.home = { x: fx, y: fy };
    if (st.foeMon.alpha) { st.dodgeSkill = Math.min(.6, st.dodgeSkill + .1); st.aggr = Math.min(.95, st.aggr + .15); }
    st.me = fighter(sc, st.first, 'me', px, py); st.foe = fighter(sc, st.foeMon, 'foe', fx, fy);
    place(st.me); place(st.foe); face(st.me, dx, dy, false); face(st.foe, -dx, -dy, false);
    if (st.allyFirst) {   // your partner's Fablemon comes out a few steps to the side
      let ax = px, ay = py;
      for (const s0 of [1, -1]) { const [tx, ty] = into(px - dy / d * 34 * s0, py + dx / d * 34 * s0); if (!solid(tx, ty)) { ax = tx; ay = ty; break; } }
      st.ally = fighter(sc, st.allyFirst, 'ally', ax, ay); place(st.ally); face(st.ally, fx - ax, fy - ay, false);
      st.ally.spr.setScale(st.ally.spr.scaleX * .3, st.ally.spr.scaleY * .3); sc.tweens.add({ targets: st.ally.spr, scaleX: st.ally.spr.scaleX / .3, scaleY: st.ally.spr.scaleY / .3, duration: 260, delay: 120, ease: 'Back.out' });
      st.foe.tgt = st.me;
    }
    if (st.me.m.hp <= 0 && st.ally) { st.meOut = true; bowOut(st.me, `You're out of Fablemon! ${st.allyName || 'Your partner'} fights on!`); }
    if (st.boost) { if (st.boost.me) Object.assign(st.me.stg, st.boost.me); if (st.boost.ally && st.ally) Object.assign(st.ally.stg, st.boost.ally); for (const f of [st.me, st.ally]) if (f && Object.keys(f.stg).length) ring(f, 0xffd060); }
    const M0 = st.me, F0 = st.foe; sc.tweens.add({ targets: M0, x: mx, y: my, duration: 260, ease: 'Quad.out', onUpdate: () => { if (M0.spr.active) place(M0); } });
    st.me.spr.setScale(st.me.spr.scaleX * .3, st.me.spr.scaleY * .3); sc.tweens.add({ targets: st.me.spr, scaleX: st.me.spr.scaleX / .3, scaleY: st.me.spr.scaleY / .3, duration: 260, ease: 'Back.out' });
    // and the wild one backs off a few steps to give you room
    let bx2 = fx, by2 = fy; if (!st.T) for (let n = 0; n < 40; n++) { const tx = bx2 + dx / d * 1.6, ty = by2 + dy / d * 1.6; if (tx < st.B.x0 || tx > st.B.x1 || ty < st.B.y0 || ty > st.B.y1 || solid(tx, ty)) break; bx2 = tx; by2 = ty; }
    sc.tweens.add({ targets: F0, x: bx2, y: by2, duration: 420, delay: 150, ease: 'Quad.out', onUpdate: () => { if (F0.spr.active) place(F0); } });
    if (st.foeMon.alpha) {   // an Alpha: half as big again, with a fiery glow at its feet
      st.foe.spr.setScale(st.foe.spr.scaleX * 1.4, st.foe.spr.scaleY * 1.4); st.foe.r *= 1.4; st.foe.sh.setScale(1.4);
      const au = sc.add.ellipse(st.foe.x, st.foe.y - 1, st.foe.spr.displayWidth * .95, 10, 0xff8a20, .5).setDepth(2).setBlendMode(ADD()); st.foe.aura = au;
      sc.tweens.add({ targets: au, alpha: .2, scaleX: 1.25, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.inOut' }); sc.cameras.main.shake(260, .005);
    }
    if (st.foeMon.fab) { st.foe.ring = sc.add.star(st.foe.x, st.foe.y, 4, 2, 6, 0xfff6c8).setDepth(9e5 + 1); sc.tweens.add({ targets: st.foe.ring, angle: 180, alpha: .3, duration: 900, yoyo: true, repeat: -1 }); }
    buildMoves(); refresh();
    if (st.T) { const lines = st.T.intro && st.T.intro.length ? st.T.intro.slice() : [`${st.T.label} ${st.T.name} wants to battle!`, `${st.T.label} ${st.T.name} sent out ${SPECIES[st.foeMon.sp].name}!`]; let k = 0; const nx = () => { if (!st || st.over || k >= lines.length) return; say(lines[k++], 1500); setTimeout(nx, 1500); }; nx(); }
    else if (st.foeMon.alpha) say(`🔥 An Alpha ${SPECIES[st.foeMon.sp].name}! 🔥`, 1800);
    else say(st.foeMon.fab ? `✦ A Fabled ${SPECIES[st.foeMon.sp].name}! ✦` : `A wild ${SPECIES[st.foeMon.sp].name}!`, 1600);
    if (!S.flags.rtHelp || S.flags.rtHelp < 3) { S.flags.rtHelp = (S.flags.rtHelp || 0) + 1; const h = $r('rtbHelp'); h.style.display = ''; h.textContent = 'Steer with the stick. Tap a move when it has recharged: they aim themselves. Dodge to dash out of the way.' + (st.T ? '' : ' Weaken it, then tap Catch.'); setTimeout(() => h.style.display = 'none', 6000); }
    st.ready = st.T ? 1.8 : 1;   // a moment before the wild one acts
    st.upd = (time, delta) => { try { tick(time, delta); st && (st.errs = 0); } catch (e) { console.warn('rtb tick', e); if (st && (st.errs = (st.errs || 0) + 1) > 20) { st.errs = 0; say('Something went wrong in the battle: it was called off.', 1800); end('ran'); } } };
    sc.events.on('update', st.upd);
  }
  function dxy(a, b) { const dx = a.x - b.x, dy = a.y - b.y, d = Math.hypot(dx, dy) || 1; return [dx / d, dy / d]; }
  function stageDown(done) {
    const sc = done.sc; if (!sc || !sc.sys || !sc.sys.isActive()) return;
    sc.events.off('update', done.upd);
    sc.tweens.killTweensOf([done.me, done.foe, done.ally].filter(Boolean));
    for (const f of [done.me, done.foe, done.ally]) if (f) { if (f.ring) f.ring.destroy(); if (f.aura) f.aura.destroy(); f.sh.destroy(); f.spr.destroy(); }
    const was = st; st = done; clearStage(sc, false); st = was;
    if (done.plWas && sc.player && sc.player.active) sc.player.setPosition(done.plWas.x, done.plWas.y).setDepth(done.plWas.d);
    const cam = sc.cameras.main, fol = done.camWas && done.camWas.follow;
    if (fol && fol.active) { cam.startFollow(fol, true, .12, .12); later(sc, 700, () => { if (cam._follow === fol) cam.setLerp(done.camWas.lx, done.camWas.ly); }); }
  }
  function tick(time, delta) {
      if (!st || !st.me || st.choosing || st.switching) return; const sc = st.sc; st.fhT = (st.fhT || 0) - Math.min(.05, delta / 1000);
      const dt = Math.min(.05, delta / 1000), me = st.me, foe = st.foe;
      if (st.over) return;
      if (st.hold > 0) { st.hold -= dt; return; }   // hit-stop: a big hit freezes everything for a beat
      for (const f of fs()) if (!f.out && f.m.status && f.m.hp > 0 && (f.ambT = (f.ambT || 0) - dt) <= 0) {   // burns smoulder, poison bubbles, paralysis crackles, sleep drifts
        const s0 = f.m.status; f.ambT = s0 === 'slp' ? .7 : .28;
        if (s0 === 'slp') floatTxt(f, 'z', '#cfe0ff', 10);
        else burst(f.x + (Math.random() - .5) * f.r * 1.4, f.y - Math.random() * f.spr.displayHeight * .7, STATUS_FX[s0] || 'Shade', s0 === 'par' ? 2 : 1, { speed: 18, dir: -Math.PI / 2, cone: .8, life: 520, size: .55, tints: s0 === 'psn' ? [0xb070e0, 0x8a40c0] : undefined });
        if (s0 === 'par' && Math.random() < .25) zap(f.x - 8, mid(f) - 6, f.x + 8, mid(f) + 4);
      }
      st.ready -= dt;
      for (const f of fs()) {
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
      if (!st.catching && me.stun <= 0 && !st.meOut) {
        mx = inp.jx || ((inp.keys.d || inp.keys.arrowright ? 1 : 0) - (inp.keys.a || inp.keys.arrowleft ? 1 : 0));
        my = inp.jy || ((inp.keys.s || inp.keys.arrowdown ? 1 : 0) - (inp.keys.w || inp.keys.arrowup ? 1 : 0));
      }
      if (opts.rtAuto && !st.meOut && !mx && !my && !st.catching && me.stun <= 0 && st.ready <= 0) [mx, my] = think(dt, me, foe, true);   // Auto: your Fablemon fights on its own; touching the stick takes over
      if (st.over) return;
      if (!st.meOut) move(me, mx, my, dt, true);
      // your partner: always the Auto brain
      const ally = st.ally;
      if (alive(ally)) { const [ax, ay] = st.ready > 0 || ally.stun > 0 ? [0, 0] : think(dt, ally, foe, true); if (st.over) return; move(ally, ax, ay, dt, true); }
      // who the foe goes after: whoever's weaker or nearer, changing its mind every few seconds
      if (st.duo) { const live = foesOf(foe); foe.ai.tg = (foe.ai.tg || 0) - dt;
        if (live.length && (!live.includes(foe.tgt) || foe.ai.tg <= 0)) { foe.ai.tg = 2.5 + Math.random() * 3.5;
          const sc0 = o => o.m.hp / monStat(o.m, 'hp') * 60 + Math.hypot(o.x - foe.x, o.y - foe.y) / 4 + Math.random() * 35, was = foe.tgt;
          foe.tgt = live.slice().sort((a, b) => sc0(a) - sc0(b))[0];
          if (was && foe.tgt !== was && foe.tgt.spr.active) floatTxt(foe.tgt, '!', '#ff6a4a', 15); } }
      // the wild one
      const [fx, fy] = st.ready > 0 ? [0, 0] : think(dt, foe, opp(foe)); if (st.over) return;
      move(foe, fx, fy, dt, false);
      // bolts
      for (const b of st.bolts.slice()) {
        b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; b.g.setPosition(b.x, b.y); b.glow.setPosition(b.x, b.y);
        { const T0 = tfx(b.type); if (b.wave) b.g.setScale(Math.min(1.3, b.g.scaleX + dt * .9)); else if (T0.face) b.g.setRotation(Math.atan2(b.vy, b.vx) + Math.PI / 2); else if (T0.spin) b.g.angle += 600 * dt; b.glow.setScale((b.slow ? .8 : 1.2) * (.9 + Math.sin(time / 50) * .12));
          if ((b.tr -= dt) <= 0) { b.tr = T0.zap ? .02 : .035; const im = sc.add.image(b.x + (Math.random() - .5) * 4, b.y + (Math.random() - .5) * 4, T0.trail).setDepth(9e5 - 2).setTint(pick(T0.tints)).setScale(T0.trail === 'fx_smoke' ? .5 : .35).setAlpha(.8); if (T0.add) im.setBlendMode(ADD());
            sc.tweens.add({ targets: im, alpha: 0, scale: im.scale * (T0.trail === 'fx_smoke' ? 1.8 : .3), y: im.y + T0.grav * .12, duration: 320, onComplete: () => im.destroy() }); }
          if (T0.zap && Math.random() < dt * 14) zap(b.x, b.y, b.x - b.vx * .08 + (Math.random() - .5) * 10, b.y - b.vy * .08 + (Math.random() - .5) * 10); }
        const t = b.tgt;
        if (Math.hypot(b.x - t.x, b.y - (t.y - t.spr.displayHeight * .45)) < t.r + (b.wide || 5) && t.m.hp > 0 && !t.out && st[t.side] === t) { hit(b.f, t, b.id, true); kill(b, true); continue; }
        if (b.life <= 0 || b.x < st.B.x0 - 30 || b.y < st.B.y0 - 30 || b.x > st.B.x1 + 30 || b.y > st.B.y1 + 30) kill(b);
      }
      // faints
      if (foe.m.hp <= 0) {
        foe.spr.setTint(0x777777); sc.tweens.add({ targets: foe.spr, alpha: 0, y: foe.spr.y + 6, duration: 500 }); Sound.play('faint'); burst(foe.x, mid(foe), 'Wild', 12, { tex: 'fx_smoke', tints: [0xe8e0d0, 0xc8c0b0], speed: 50, life: 700, grav: -40, size: 1.2, flat: 1 }); burst(foe.x, mid(foe), 'Glow', 8, { speed: 70, life: 600, size: .7 }); hitStop(120);
        if (st.T) { st.beaten.push(foe.m); const next = st.T.team.find(m => m.hp > 0); if (next) return nextFoe(next); }
        return end('win');
      }
      if (ally && !ally.out && ally.m.hp <= 0) {
        Sound.play('faint'); burst(ally.x, mid(ally), 'Wild', 10, { tex: 'fx_smoke', tints: [0xe8e0d0, 0xc8c0b0], speed: 45, life: 650, grav: -40, size: 1.1, flat: 1 }); ally.m.status = null;
        const next = st.allyTeam.find(m => m.hp > 0);
        if (next) swapAlly(next); else { if (st.meOut) return end('lose'); bowOut(ally, `${st.allyName || 'Your partner'} is out of Fablemon! It's up to you!`); }
      }
      if (!st.meOut && me.m.hp <= 0) {
        Sound.play('faint'); burst(me.x, mid(me), 'Wild', 10, { tex: 'fx_smoke', tints: [0xe8e0d0, 0xc8c0b0], speed: 45, life: 650, grav: -40, size: 1.1, flat: 1 }); me.m.status = null; const next = tm().find(m => m.hp > 0);
        if (!next) { if (!alive(st.ally)) return end('lose'); st.meOut = true; return bowOut(me, `You're out of Fablemon! ${st.allyName || 'Your partner'} fights on!`); }
        say(`${monName(me.m)} fainted!`, 1200);
        if (tm().filter(m => m.hp > 0).length > 1) return choose(me);   // pause and pick who goes next
        swapIn(next);
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
    } else if (!f.lunge) { const o = opp(f); face(f, o.x - f.x, o.y - f.y, false); }
    f.x = Math.max(st.B.x0, Math.min(st.B.x1, f.x)); f.y = Math.max(st.B.y0, Math.min(st.B.y1, f.y));
    if (solid(f.x, f.y) && !solid(ox, oy)) { if (!solid(f.x, oy)) f.y = oy; else if (!solid(ox, f.y)) f.x = ox; else { f.x = ox; f.y = oy; } if (f.lunge) f.lunge.t = 0; }
    place(f);
  }
  function kill(b, pop) {
    if (pop) { const p = st.sc.add.circle(b.x, b.y, 6, b.col, .7).setDepth(9e5); st.sc.tweens.add({ targets: p, scale: 2.4, alpha: 0, duration: 260, onComplete: () => p.destroy() }); }
    else { const T0 = tfx(b.type); burst(b.x, b.y, b.type, 5, { speed: 40, life: 300, size: .6 }); if (T0.zap) zap(b.x, b.y, b.x + 6, b.y + 6); }
    b.g.destroy(); b.glow.destroy(); st.bolts = st.bolts.filter(q => q !== b);
  }

  // ---------- the panels
  function hpBox(f, el) {
    const m = f.m, mx = monStat(m, 'hp'), pc = Math.max(0, m.hp) / mx;
    const chips = (m.status ? `<span class="rchip" style="background:${STATUS[m.status][1]}">${STATUS[m.status][0]}</span>` : '') + Object.entries(f.stg).filter(([, n]) => n).map(([k, n]) => `<span class="rchip" style="background:${n > 0 ? '#3a8a4a' : '#9a4a3a'}">${{ atk: 'Atk', def: 'Def', eatk: 'EAtk', edef: 'EDef', spd: 'Spd' }[k]}${n > 0 ? '▲' : '▼'}</span>`).join('');
    el.innerHTML = `${f.side === 'ally' ? `<span class="who">${st.allyName || 'Partner'}</span>` : ''}<b>${f.side === 'foe' && S.caught[m.sp] ? '<span style="color:#c0392b">♥</span> ' : ''}${monName(m)}</b> <small>Lv ${m.lv}</small>${chips}<div class="rhp"><i style="width:${100 * pc}%;background:${pc > .5 ? '#4caf50' : pc > .2 ? '#e0a020' : '#d0402a'}"></i></div>${f.side !== 'foe' ? `<small>${Math.max(0, Math.ceil(m.hp))}/${mx}</small>` : ''}`;
  }
  function refresh() {
    if (!st || !st.me) return;
    hpBox(st.foe, $r('rtbFoe')); hpBox(st.me, $r('rtbMe')); if (st.ally) hpBox(st.ally, $r('rtbAlly'));
    $r('rtbTeam').innerHTML = tm().map((m, i) => `<button data-sw="${i}" class="${m === st.me.m ? 'on' : ''} ${m.hp <= 0 ? 'ko' : ''}"><img src="${monPicOf(m)}"><i style="width:${Math.max(0, 100 * m.hp / monStat(m, 'hp'))}%"></i></button>`).join('');
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
  function start(sc, foe, at, T, keep, o = {}) {
    const mine = o.myTeam || team(), first = mine.find(m => m.hp > 0) || (o.allyTeam && o.allyTeam.some(m => m.hp > 0) ? mine[0] : null); if (!first) return;   // (in 2-vs-1 your partner can carry on alone)
    // every walk sheet the fight could need, fetched first (they load when needed since 23 Nov)
    const need = [foe, ...mine, ...(o.allyTeam || []), ...((T && T.team) || [])].map(m => m && walkSp(m.sp)).filter(n => n && ASSET['mon_' + n] && !sc.textures.exists('mon_' + n));
    if (need.length && !start.waited) { sc.paused = true; start.waited = 1; monFetchAll(sc, need).then(() => { start.waited = 0; start(sc, foe, at, T, keep, o); }); return; }
    start.waited = 0;
    sc.paused = true; S.seen[foe.sp] = 1;
    Sound.play('encounter'); const fl = $('flash'); fl.style.opacity = .9; setTimeout(() => fl.style.opacity = 0, 140);
    st = { from: sc, foeMon: foe, first, used: new Set([first.uid]), bolts: [], over: false, T: T || null, keep: keep || null, beaten: [], mood: T ? 'calm' : typeof roamMood === 'function' ? roamMood(foe) : 'calm', runs: 0, charmT: 0, healT: 0, swT: 0,
      dodgeSkill: Math.min(.5, .12 + foe.lv / 260 + (T && T.boss ? .08 : 0)), aggr: .55 + Math.min(.3, foe.lv / 250), foeSpeed: .92, prevTheme: Sound.currentTheme,
      myTeam: o.myTeam || null, allyTeam: o.allyTeam || null, allyFirst: o.allyTeam ? o.allyTeam.find(m => m.hp > 0) : null, allyName: o.allyName || '', duo: o.duo || null, noItems: !!o.noItems, onEnd: o.onEnd || null, boost: o.boost || null };
    if (st.duo) { st.dodgeSkill = Math.min(.6, st.dodgeSkill + .08); st.aggr = Math.min(.97, st.aggr + .12); st.foeSpeed = 1; }
    Sound.hushRain(true); Sound.theme('battle'); autoUi();
    document.body.classList.add('rtb-on'); ui.classList.add('show'); $r('rtbPick').classList.remove('show'); $r('rtbCharm').style.display = T || o.noItems ? 'none' : ''; $r('rtbHeal').style.display = o.noItems ? 'none' : ''; $r('rtbRun').style.display = o.onEnd ? 'none' : ''; $r('rtbRun').style.opacity = T ? .45 : 1; ui.classList.toggle('duo', !!(o.allyTeam && o.allyTeam.some(m => m.hp > 0)));
    const here = at || (sc.player ? { x: sc.player.x, y: sc.player.y - 40 } : { x: 0, y: 0 });
    setTimeout(() => { if (st && !st.me) { try { stageUp(sc, here); } catch (e) { console.warn('rtb', e); const d = st; st = null; ui.classList.remove('show'); document.body.classList.remove('rtb-on'); if (d) stageDown(d); sc.paused = false; Battle.start(foe, T ? Object.assign({}, T, { classic: true }) : undefined); } } }, 120);
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
      if (done.onEnd) { Sound.hushRain(false); Sound.theme(done.prevTheme || 'field'); if (done.from) done.from.paused = false; return done.onEnd(out); }
      if (out === 'ran' || out === 'fled') { Sound.hushRain(false); Sound.theme(done.prevTheme || 'field'); for (const m of S.mons) { m.status = null; m.slp = 0; } if (done.from) { done.from.paused = false; if (done.from.p) done.from.p.busy = .4; if (done.from.refreshFollower) done.from.refreshFollower(); } return; }
      Battle.resolveRT(foe, out, [...done.used], done.T, done.beaten);
    }, out === 'win' ? 650 : 250);
  }
  return { start, get active() { return !!st; }, get st() { return st; } };
})();

