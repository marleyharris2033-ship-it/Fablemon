/* ============================================================ The Warden Gauntlet (25 Nov 2026)
   Every Warden in a row, in their own arenas, as 2-vs-1 action battles: you and a partner against each Warden's
   best three. Unlocked by the Hearth Crest; Rowan offers it in the Warden's Hall.
   - Solo for now: your partner's Fablemon fight on their own with the Auto battle brain. Later, a friend's phone
     drives the partner instead (claude/multiplayer-plan.md).
   - Both sides fight with copies, so nothing in the save changes: no experience, no items used, no fainting carried
     home. Only S.gauntlet (records) and the rewards are written.
   - The Wardens take less damage (st.duo.foeTake) and recharge faster, pick between you, and their big area moves
     come down on both of you.
   - No full heal between fights: each side picks one rest-stop boon (heal, revive or a boost for the next fight).
   - The run ends when both of you are out of Fablemon. */
const GAUNT_ORDER = ['Mabel', 'Delphine', 'Granger', 'Orrin', 'Tamsin', 'Alder', 'Isolde', 'Rowan'];
const GAUNT_SIZE = 3;   // each Warden brings their last three (their aces); each side brings up to three
const GAUNT_LINES = {
  Mabel: "Two of you this time? Good. I've been gardening for forty years, dears. I can handle a pair of weeds.",
  Delphine: 'Two keepers against one lock-keeper. The tide has never minded the odds.',
  Granger: "Two hammers on one rock. Let's see if either of you finds the crack.",
  Orrin: 'TWO challengers in one storm? Ha! The sky is going to love this!',
  Tamsin: "A tailwind and a crosswind! Hold onto your hats, both of you!",
  Alder: 'A herd of two. The forest has seen packs before. It is still standing.',
  Isolde: 'Two lanterns in the dark. Let us see whose light holds.',
  Rowan: "Every Warden in the valley, one after another. You've earned this. Show me everything.",
};
let GAUNT = null;   // the run: { lv, mine, partner, stage, beaten, t0, boost }

function gauntTeamOf(name) {
  const src = { Mabel: [['flintuck', 13], ['cloverclasp', 14], ['hedglet', 14], ['mortoad', 15]],
    Delphine: typeof DELPHINE_TEAM !== 'undefined' ? DELPHINE_TEAM : [], Granger: typeof GRANGER_TEAM !== 'undefined' ? GRANGER_TEAM : [],
    Orrin: typeof ORRIN_TEAM !== 'undefined' ? ORRIN_TEAM : [], Tamsin: typeof TAMSIN_TEAM !== 'undefined' ? TAMSIN_TEAM : [],
    Alder: typeof ALDER_TEAM !== 'undefined' ? ALDER_TEAM : [], Isolde: typeof ISOLDE_TEAM !== 'undefined' ? ISOLDE_TEAM : [],
    Rowan: typeof ROWAN_TEAM !== 'undefined' ? ROWAN_TEAM : [] }[name] || [];
  return src.filter(([sp]) => SPECIES[sp]).slice(-GAUNT_SIZE);
}
// a Warden's Fablemon at the run's level: grown into the form it would have reached by then
function gauntWardenMon([sp, lv0, moves], lv) {
  let s = sp;
  for (let n = 0; n < 4; n++) { const e = SPECIES[s].evo; if (Array.isArray(e) && SPECIES[e[0]] && typeof e[1] === 'number' && lv >= e[1]) s = e[0]; else break; }
  const m = trainerMon(s, lv);
  if (moves && s === sp) { const mv = moves.filter(id => MOVES[id]); if (mv.length) m.moves = mv; }
  if (typeof ghSig === 'function') ghSig(m);
  m.hp = monStat(m, 'hp'); return m;
}
// a copy of one of yours for the run: the save's Fablemon is never touched
function gauntCopy(m, lv, i) {
  const c = JSON.parse(JSON.stringify(m)); c.uid = 'gnt' + i; c.loc = 'gauntlet'; c.out = false; c.status = null; c.slp = 0;
  if (lv) { c.lv = lv; c.xp = lv ** 3; }
  c.hp = monStat(c, 'hp'); return c;
}
const gauntAlive = t => t.some(m => m.hp > 0);

// ---------- Rowan's offer
function gauntletOffer() {
  if (!(S.crests && S.crests.hearth)) return;
  const R = (t, f = 0) => ({ who: 'rowan', name: VILL.rowan.name, img: VPIC['rowan' + f], t });
  Talk.say([R("The Hearth Crest suits you. Smallroot is in good hands."),
    R("Now, if you want a real test... the Wardens have agreed to something. All eight of us, one after another, in our own arenas."),
    R("Bring a partner. You'll need one.", 1)], gauntletSetup);
}
function gauntletSetup() {
  const g = S.gauntlet || {}, all = S.mons.slice().sort((a, b) => (a.loc === 'team' ? 0 : 1) - (b.loc === 'team' ? 0 : 1) || b.lv - a.lv);
  if (all.length < 2) return toast('You need at least two Fablemon for the Gauntlet: one for you, one for your partner.', 2600);
  const pick = {};   // uid -> 'me' | 'pt'
  all.filter(m => m.loc === 'team').slice(0, GAUNT_SIZE).forEach(m => pick[m.uid] = 'me');
  all.filter(m => !pick[m.uid]).slice(0, GAUNT_SIZE).forEach(m => pick[m.uid] = 'pt');
  let lvMode = 'own';
  const n = w => Object.values(pick).filter(v => v === w).length;
  const rec = g.best ? `<p style="font-size:12px;opacity:.8">Best run: <b>${g.best} of 8</b> Wardens${g.clears ? ` · cleared ${g.clears}× · fastest ${gauntTime(g.fastest)}` : ''}${g.medal ? ' · 🏅 Gauntlet Medal' : ''}</p>` : '';
  const draw = () => {
    const rows = all.map(m => { const w = pick[m.uid]; return `<button class="btn" data-a="t" data-u="${m.uid}" style="display:flex;align-items:center;gap:6px;width:100%;margin:3px 0;padding:3px 6px;text-align:left;${w === 'me' ? 'background:#cfe8c0;border-color:#3a7a2a' : w === 'pt' ? 'background:#cfe0f4;border-color:#2a5a9a' : ''}"><img src="${monPicOf(m)}" style="width:30px;height:30px;image-rendering:pixelated">${monName(m)} <small style="opacity:.75">Lv ${m.lv}</small><b style="margin-left:auto;font-size:12px">${w === 'me' ? 'You' : w === 'pt' ? 'Partner' : ''}</b></button>`; }).join('');
    const lvb = (k, t) => `<button class="btn ${lvMode === k ? 'gold' : ''}" data-a="lv" data-k="${k}" style="flex:1;padding:4px 2px;font-size:12px">${t}</button>`;
    openModal('The Warden Gauntlet', `<p>All eight Wardens in a row, each with their best three. You and your partner fight together; your partner's Fablemon fight on their own. No items: between fights, you each get one rest-stop pick. It ends when you're both out of Fablemon.</p>${rec}
      <p style="margin:6px 0 3px"><b>Levels</b></p><div class="row" style="gap:4px">${lvb('own', 'Your own')}${lvb('50', 'Everyone 50')}${lvb('75', 'Everyone 75')}</div>
      <p style="margin:8px 0 3px"><b>Teams</b> <small>(tap to switch: You → Partner → out · up to ${GAUNT_SIZE} each)</small> You ${n('me')}/${GAUNT_SIZE} · Partner ${n('pt')}/${GAUNT_SIZE}</p>
      <div style="max-height:38vh;overflow:auto">${rows}</div>
      <div class="row"><button class="btn" data-a="no">Not now</button><button class="btn gold" data-a="go" ${n('me') && n('pt') ? '' : 'disabled'}>Start the Gauntlet</button></div>`, (a, d) => {
      if (a === 'no') return closeModal();
      if (a === 'lv') { lvMode = d.k; return draw(); }
      if (a === 't') { const u = isNaN(+d.u) ? d.u : +d.u, w = pick[u], nx = !w ? 'me' : w === 'me' ? 'pt' : null;
        if (nx && n(nx) >= GAUNT_SIZE) { if (nx === 'me' && n('pt') < GAUNT_SIZE) pick[u] = 'pt'; else delete pick[u]; } else if (nx) pick[u] = nx; else delete pick[u];
        return draw(); }
      if (a === 'go' && n('me') && n('pt')) { closeModal(); gauntletStart(all.filter(m => pick[m.uid] === 'me'), all.filter(m => pick[m.uid] === 'pt'), lvMode); }
    });
  };
  draw();
}
const gauntTime = ms => { if (!ms) return '—'; const s = Math.round(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

// ---------- the run
function gauntletStart(mine, partner, lvMode) {
  const fixed = lvMode === 'own' ? 0 : +lvMode;
  let i = 0; const cp = m => gauntCopy(m, fixed, i++);
  const me = mine.map(cp), pt = partner.map(cp);
  const lv = fixed || Math.max(20, ...me.map(m => m.lv), ...pt.map(m => m.lv));
  const p = scene.p; S.arenaRet = { scene: scene.scene.key, x: p.x, y: p.y, dir: p.dir };
  GAUNT = { lv, mine: me, partner: pt, stage: 0, beaten: 0, t0: Date.now(), boost: null };
  gauntletStage();
}
function gauntletStage() {
  const G = GAUNT, name = GAUNT_ORDER[G.stage], A = ARENAS[name];
  const tm = gauntTeamOf(name).map(e => gauntWardenMon(e, G.lv));
  if (!A || !ASSET['arena_' + A.k] || !tm.length) { G.stage++; return G.stage < GAUNT_ORDER.length ? gauntletStage() : gauntletFinish(true); }   // (an arena that hasn't been drawn yet is skipped)
  const T = { label: 'Warden', name, team: tm, prize: 0, boss: true, smart: true, heals: 1,
    intro: [`Gauntlet: Warden ${G.stage + 1} of ${GAUNT_ORDER.length}`, `${name}: "${GAUNT_LINES[name] || 'Here we go!'}"`, `Warden ${name} sent out ${SPECIES[tm[0].sp].name}!`] };
  for (const m of [...G.mine, ...G.partner]) { m.status = null; m.slp = 0; }
  ARENA_GO = { foe: tm[0], T, A, win: null, gauntlet: 1,
    rt: { myTeam: G.mine, allyTeam: G.partner, allyName: 'Partner', noItems: true, boost: G.boost, duo: { foeTake: .55, foeCd: .8 }, onEnd: gauntletAfter } };
  G.boost = null;
  if (scene && scene.scene.key !== 'arena') { scene.paused = true; Sound.play('encounter'); const fl = $('flash'); fl.style.opacity = .9; setTimeout(() => fl.style.opacity = 0, 140); }
  setTimeout(() => travel(scene, 'arena', { x: 16, y: 40, dir: 'up' }), 260);
}
function gauntletAfter(out) {
  const G = GAUNT; if (!G) return;
  if (out !== 'win') return setTimeout(() => gauntletFinish(false), 700);
  G.beaten++; G.stage++;
  Sound.victory && Sound.victory();
  if (G.stage >= GAUNT_ORDER.length) return setTimeout(() => gauntletFinish(true), 900);
  setTimeout(gauntletRest, 900);
}
// the rest stop: one pick for you, one for your partner
function gauntletRest() {
  const G = GAUNT, next = GAUNT_ORDER[G.stage];
  const down = t => t.filter(m => m.hp <= 0), hurt = t => t.reduce((a, m) => a + m.hp / monStat(m, 'hp'), 0) / t.length;
  const heal = t => t.forEach(m => { if (m.hp > 0) { m.hp = Math.min(monStat(m, 'hp'), m.hp + Math.ceil(monStat(m, 'hp') / 2)); m.status = null; } });
  const revive = t => { const m = down(t)[0]; if (m) { m.hp = monStat(m, 'hp'); m.status = null; } return m; };
  const boost = { atk: 1, eatk: 1, spd: 1 };
  // the partner chooses for itself
  let ptSays;
  if (down(G.partner).length && (!gauntAlive(G.partner) || hurt(G.partner) < .6)) { const m = revive(G.partner); ptSays = `revived ${monName(m)}`; }
  else if (hurt(G.partner) < .75) { heal(G.partner); ptSays = 'patched up the team'; }
  else { ptSays = 'is psyched up for the next fight'; G.boost = { ally: boost }; }
  const bar = t => t.map(m => `<span style="display:inline-flex;flex-direction:column;align-items:center;margin:0 3px;${m.hp <= 0 ? 'opacity:.35' : ''}"><img src="${monPicOf(m)}" style="width:30px;height:30px;image-rendering:pixelated"><i style="display:block;width:30px;height:4px;background:#3a2e26;border-radius:2px"><i style="display:block;height:100%;width:${Math.max(0, 100 * m.hp / monStat(m, 'hp'))}%;background:#4caf50;border-radius:2px"></i></i></span>`).join('');
  openModal(`Rest stop · ${G.beaten} of ${GAUNT_ORDER.length} beaten`, `<p>Next: <b>Warden ${next}</b>.</p>
    <p style="margin:4px 0"><b>You</b> ${bar(G.mine)}</p><p style="margin:4px 0"><b>Partner</b> ${bar(G.partner)} <small>(${ptSays})</small></p>
    <p style="margin:8px 0 4px">Pick one:</p>
    <button class="btn" data-a="heal" style="width:100%;margin:3px 0">💚 Heal: every Fablemon on your team gets back half its HP</button>
    <button class="btn" data-a="rev" style="width:100%;margin:3px 0" ${down(G.mine).length ? '' : 'disabled'}>✨ Revive: ${down(G.mine).length ? `${monName(down(G.mine)[0])} comes back at full HP` : 'nobody has fainted'}</button>
    <button class="btn" data-a="buff" style="width:100%;margin:3px 0">🔥 Boost: your lead starts the next fight with Atk, EAtk and Spd raised</button>
    <div class="row"><button class="btn" data-a="quit" style="font-size:12px">Leave the Gauntlet</button></div>`, a => {
    if (a === 'quit') { closeModal(); return gauntletFinish(false); }
    if (a === 'heal') heal(G.mine); else if (a === 'rev') { if (!down(G.mine).length) return; revive(G.mine); } else if (a === 'buff') G.boost = Object.assign(G.boost || {}, { me: boost }); else return;
    closeModal(); gauntletStage();
  });
}
function gauntletFinish(clear) {
  const G = GAUNT; if (!G) return; GAUNT = null;
  const g = S.gauntlet = S.gauntlet || {}, ms = Date.now() - G.t0;
  const newBest = G.beaten > (g.best || 0); g.best = Math.max(g.best || 0, G.beaten); g.runs = (g.runs || 0) + 1;
  let gold = G.beaten * 1500, gift = '';
  if (clear) {
    g.clears = (g.clears || 0) + 1; const fast = !g.fastest || ms < g.fastest; if (fast) g.fastest = ms;
    gold += 20000;
    if (!g.medal) { g.medal = 1; const it = ITEMS.hearth_elixir ? 'hearth_elixir' : null; if (it && !inv.add(it, 3)) gift = `3× ${ITEMS[it].name} and the 🏅 Gauntlet Medal`; else gift = 'the 🏅 Gauntlet Medal'; renderHotbar(); }
  }
  S.gold += gold; updateHUD(); if (gold) Sound.play('coin');
  const body = clear
    ? `<p><b>All eight Wardens beaten, back to back!</b> Time: ${gauntTime(ms)}${g.fastest === ms && g.clears > 1 ? ' (a new fastest!)' : ''}.</p><p>You earned <b>${gold.toLocaleString()}g</b>${gift ? ` and ${gift}` : ''}.</p>`
    : `<p>You beat <b>${G.beaten} of ${GAUNT_ORDER.length}</b> Wardens${newBest && G.beaten ? ' (a new best!)' : ''}.</p>${gold ? `<p>You earned <b>${gold.toLocaleString()}g</b>.</p>` : '<p>Rowan says the first Warden is always the hardest. Try again any time.</p>'}`;
  const home = () => { const sc = scene; if (sc && sc.scene.key === 'arena' && sc.g) { sc.g.gauntlet = sc.g.hold = 0; sc.leave(); } };
  openModal(clear ? '🏅 Gauntlet cleared!' : 'The Gauntlet is over', body + '<div class="row"><button class="btn gold" data-a="ok">Head home</button></div>', () => closeModal(), home);
}
