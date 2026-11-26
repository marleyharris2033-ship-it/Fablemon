/* ============================================================ Live trading (26 Nov 2026)
   The user wanted trading like RuneScape: both players open one trade window, each puts in what they're offering
   (up to 6 Fablemon and some gold), you can tap their Fablemon to look them over, then both accept. Like RuneScape
   there are two screens: the offer screen, then a "Are you sure?" screen listing both sides. Any change to either
   offer clears both accepts. The old trade-by-code counter is still there for friends who aren't linked.

   Messages (over LinkNet):
     {t:'tr.req'} → {t:'tr.yes'} or {t:'tr.no'}    asking to trade; on yes both windows open
     {t:'tr.off', rev, mons:[packed], gold}          my offer changed (rev counts up with every change)
     {t:'tr.acc', st, mine, theirs}                  I accept screen st (1 or 2) for these two offer revs
     {t:'tr.x'}                                      I closed the window: the trade's off
   The trade happens on each phone when it has accepted screen 2 itself and seen the friend accept screen 2 for the
   same two offers. Each phone removes what it gave and adds what it got. */
const TRADE_MAX = 6;
let TRADE = null;   // { mine: {uids:[], gold, rev}, theirs: {mons:[], gold, rev}, acc: {me, them}, stage, view, asked }

// every screen of the window goes through trModal, so moving between screens doesn't count as closing the window
// (openModal runs the old screen's close callback when a new one opens); closing it for real calls the trade off
let trInner = 0;
function trModal(title, html, onClick) {
  trInner = 1; try { openModal(title, html, onClick, () => { if (trInner || !TRADE) return; LinkNet.send({ t: 'tr.x' }); TRADE = null; }); } finally { trInner = 0; }
}
const trPeer = () => (LinkNet.peer && LinkNet.peer.n) || 'Your friend';
const trEsc = t => String(t || '').replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
const trMine = () => TRADE.mine.uids.map(u => S.mons.find(m => m.uid === u)).filter(Boolean);
function trSendOffer() {
  const T = TRADE; T.mine.rev++; T.acc = { me: 0, them: 0 }; T.stage = 1;
  LinkNet.send({ t: 'tr.off', rev: T.mine.rev, mons: trMine().map(linkPack), gold: T.mine.gold });
}

// ---------- starting a trade
function linkTradeAsk() {
  if (!LinkNet.on) return linkTrade();   // not linked: the code counter
  if (TRADE) return trDraw();
  TRADE = { asked: 1 }; LinkNet.send({ t: 'tr.req' });
  openModal('🔁 Trade', `<p>⏳ Asking ${trEsc(trPeer())} to trade…</p><div class="row"><button class="btn" data-a="x">Never mind</button></div>`, () => { LinkNet.send({ t: 'tr.x' }); TRADE = null; closeModal(); }, () => { if (TRADE && TRADE.asked) { LinkNet.send({ t: 'tr.x' }); TRADE = null; } });
}
function trAsked() {
  if (TRADE || (typeof RTB !== 'undefined' && RTB.active)) return LinkNet.send({ t: 'tr.no' });
  Sound.play('pop');
  openModal('🔁 Trade request', `<p><b>${trEsc(trPeer())}</b> would like to trade with you.</p><div class="row"><button class="btn" data-a="no">Not now</button><button class="btn gold" data-a="yes">Trade</button></div>`, a => {
    if (a !== 'yes') { LinkNet.send({ t: 'tr.no' }); return closeModal(); }
    LinkNet.send({ t: 'tr.yes' }); trOpen();
  });
}
function trOpen() {
  TRADE = { mine: { uids: [], gold: 0, rev: 0 }, theirs: { mons: [], gold: 0, rev: 0 }, acc: { me: 0, them: 0 }, stage: 1, view: null };
  trDraw();
}
function trEnd(msg) { if (!TRADE) return; TRADE = null; closeModal(); if (msg) toast(msg, 2800); }

// ---------- the window
function trMonTile(m, i, side) {
  return `<button class="btn" data-a="${side}" data-i="${i}" style="width:31%;margin:1%;padding:3px 2px;display:inline-flex;flex-direction:column;align-items:center;line-height:1.1;font-size:11px;vertical-align:top">
    <img src="${monPicOf(m)}" style="width:38px;height:38px;image-rendering:pixelated">${m.fab ? '✨' : ''}${trEsc(monName(m))}<small>Lv ${m.lv}</small></button>`;
}
function trSide(title, mons, gold, side, acc) {
  const tiles = mons.map((m, i) => trMonTile(m, i, side)).join('');
  return `<div style="border:2px solid ${acc ? '#3a7a2a' : '#c9a86a'};border-radius:8px;padding:4px 4px 6px;margin:4px 0;background:${acc ? '#e4f3da' : '#fffaf0'}">
    <div style="display:flex;justify-content:space-between;align-items:center;font-size:13px;padding:0 4px"><b>${title}</b><span>${acc ? '✅ Accepted' : ''}</span></div>
    <div style="min-height:52px">${tiles || `<p style="font-size:12px;opacity:.6;margin:10px 4px">${side === 'me' ? 'Nothing yet. Add a Fablemon or some gold.' : 'Nothing offered yet.'}</p>`}</div>
    ${gold ? `<p style="margin:2px 6px;font-size:13px"><img src="${ICONS.coin}" style="width:16px;vertical-align:-3px"> <b>${gold.toLocaleString()}g</b></p>` : ''}</div>`;
}
function trDraw() {
  const T = TRADE; if (!T || !T.mine) return;
  if (T.view) return trInspect(T.view);
  const n = trEsc(trPeer()), mine = trMine(), theirs = T.theirs.mons, empty = !mine.length && !theirs.length && !T.mine.gold && !T.theirs.gold;
  if (T.stage === 2) {
    const list = (ms, g) => ms.map(m => `• ${m.fab ? '✨' : ''}${trEsc(monName(m))} <small>(${monName(m) !== SPECIES[m.sp].name ? SPECIES[m.sp].name + ', ' : ''}Lv ${m.lv})</small>`).concat(g ? [`• ${g.toLocaleString()}g`] : []).join('<br>') || '<i>Nothing</i>';
    return trModal('🔁 Are you sure?', `<p style="font-size:13px;margin:2px 0">Check the trade one last time.</p>
      <div style="border:2px solid #c9a86a;border-radius:8px;padding:6px;margin:4px 0;background:#fffaf0"><b>You give ${n}:</b><br>${list(mine, T.mine.gold)}</div>
      <div style="border:2px solid #c9a86a;border-radius:8px;padding:6px;margin:4px 0;background:#fffaf0"><b>${n} gives you:</b><br>${list(theirs, T.theirs.gold)}</div>
      <p style="font-size:13px;text-align:center;margin:6px 0">${T.acc.me === 2 ? `⏳ Waiting for ${n} to accept…` : T.acc.them === 2 ? `✅ ${n} has accepted.` : ''}</p>
      <div class="row"><button class="btn" data-a="decline">Decline</button><button class="btn gold" data-a="acc2" ${T.acc.me === 2 ? 'disabled' : ''}>Accept</button></div>`, a => {
      if (a === 'decline') { LinkNet.send({ t: 'tr.x' }); return trEnd('You declined the trade.'); }
      if (a === 'acc2') { T.acc.me = 2; LinkNet.send({ t: 'tr.acc', st: 2, mine: T.mine.rev, theirs: T.theirs.rev }); trTryFinish(); trDraw(); }
    });
  }
  trModal(`🔁 Trading with ${n}`, `${trSide(`${n} offers`, theirs, T.theirs.gold, 'them', T.acc.them >= 1)}
    <p style="font-size:11px;text-align:center;margin:0;opacity:.7">Tap their Fablemon to look them over.</p>
    ${trSide('You offer', mine, T.mine.gold, 'me', T.acc.me >= 1)}
    <div style="display:flex;gap:4px"><button class="btn" data-a="add" style="flex:1" ${mine.length >= TRADE_MAX ? 'disabled' : ''}>➕ Fablemon</button><button class="btn" data-a="gold" style="flex:1"><img src="${ICONS.coin}" style="width:16px;vertical-align:-3px"> Gold</button></div>
    <p style="font-size:13px;text-align:center;margin:6px 0">${T.acc.me && T.acc.them ? '' : T.acc.me ? `⏳ Waiting for ${n} to accept…` : T.acc.them ? `✅ ${n} has accepted. Your turn.` : 'Tap your Fablemon to take them back out.'}</p>
    <div class="row"><button class="btn" data-a="decline">Decline</button><button class="btn gold" data-a="acc1" ${T.acc.me || empty ? 'disabled' : ''}>Accept</button></div>`, (a, d) => {
    if (a === 'decline') { LinkNet.send({ t: 'tr.x' }); return trEnd('You declined the trade.'); }
    if (a === 'them') { T.view = { side: 'them', i: +d.i }; return trDraw(); }
    if (a === 'me') { T.mine.uids.splice(+d.i, 1); trSendOffer(); return trDraw(); }
    if (a === 'add') return trPick();
    if (a === 'gold') return trGold();
    if (a === 'acc1') { T.acc.me = 1; LinkNet.send({ t: 'tr.acc', st: 1, mine: T.mine.rev, theirs: T.theirs.rev }); trNext(); trDraw(); }
  });
}
// looking over one of their Fablemon (or yours)
function trInspect(v) {
  const T = TRADE, m = v.side === 'them' ? T.theirs.mons[v.i] : trMine()[v.i];
  if (!m) { T.view = null; return trDraw(); }
  const sp = SPECIES[m.sp], st = k => monStat(m, k), iv = m.iv || {};
  const row = (k, l) => `<tr><td>${l}</td><td style="text-align:right"><b>${st(k)}</b></td><td style="text-align:right;opacity:.65">IV ${iv[k] ?? '?'}</td></tr>`;
  const mv = (m.moves || []).filter(id => MOVES[id]).map(id => `<span class="tchip" style="background:${TYPES[MOVES[id].type] || '#888'}">${MOVES[id].name}</span>`).join(' ');
  trModal(`${m.fab ? '✨ ' : ''}${trEsc(monName(m))}`, `<div style="text-align:center"><img src="${monPicOf(m, 'front')}" style="width:128px;height:128px;image-rendering:pixelated"></div>
    <p style="text-align:center;margin:2px 0">${sp.name} · Lv ${m.lv} ${typeChip(m.sp)}${m.fab ? '<br><small>✨ Fabled colouring</small>' : ''}</p>
    <table style="width:100%;font-size:13px;margin:4px 0">${row('hp', 'HP')}${row('atk', 'Attack')}${row('def', 'Defence')}${row('spd', 'Speed')}</table>
    <p style="margin:4px 0;font-size:13px"><b>Moves:</b> ${mv || '—'}</p>
    ${m.held && ITEMS[m.held] ? `<p style="margin:4px 0;font-size:13px"><b>Holding:</b> <img src="${iconFor(m.held)}" style="width:18px;vertical-align:-4px"> ${ITEMS[m.held].name}</p>` : ''}
    ${m.ot ? `<p style="margin:4px 0;font-size:12px;opacity:.7">First trainer: ${trEsc(m.ot)}</p>` : ''}
    <div class="row"><button class="btn gold" data-a="back">Back to the trade</button></div>`, () => { T.view = null; trDraw(); }, () => { if (TRADE && !TRADE.view) return; if (TRADE) { LinkNet.send({ t: 'tr.x' }); TRADE = null; } });
}
function trPick() {
  const T = TRADE, all = S.mons.filter(m => !T.mine.uids.includes(m.uid)).sort((a, b) => (a.loc === 'team' ? 0 : 1) - (b.loc === 'team' ? 0 : 1) || b.lv - a.lv);
  trModal('Add a Fablemon', `<div style="max-height:52vh;overflow:auto">${all.map(m => linkRow(m, m.loc === 'team' ? 'Team' : '')).join('') || '<p>No one else to add.</p>'}</div><div class="row"><button class="btn" data-a="back">Back</button></div>`, (a, d) => {
    if (a === 't') {
      const m = S.mons.find(x => x.uid === linkUid(d.u)); if (!m) return;
      const left = S.mons.filter(x => x.loc === 'team' && !T.mine.uids.includes(x.uid) && x !== m);
      if (m.loc === 'team' && !left.length) return toast('You need to keep at least one Fablemon in your team.', 2600);
      if (T.mine.uids.length < TRADE_MAX) { T.mine.uids.push(m.uid); trSendOffer(); }
    }
    trDraw();
  });
}
function trGold() {
  const T = TRADE;
  trModal('Offer gold', `<p>You have <b>${S.gold.toLocaleString()}g</b>.</p><input id="trG" type="number" min="0" max="${S.gold}" step="50" value="${T.mine.gold || ''}" placeholder="0" style="width:100%;font-size:20px;padding:6px;box-sizing:border-box">
    <div style="display:flex;gap:4px;margin:6px 0">${[100, 1000, 10000].map(v => `<button class="btn" data-a="plus" data-v="${v}" style="flex:1">+${v.toLocaleString()}</button>`).join('')}</div>
    <div class="row"><button class="btn" data-a="back">Back</button><button class="btn gold" data-a="ok">Offer</button></div>`, (a, d) => {
    const inp = $('trG');
    if (a === 'plus') { inp.value = Math.min(S.gold, (+inp.value || 0) + +d.v); return; }
    if (a === 'ok') { const g = Math.max(0, Math.min(S.gold, Math.floor(+inp.value || 0))); if (g !== T.mine.gold) { T.mine.gold = g; trSendOffer(); } }
    trDraw();
  });
}

// ---------- accepting and finishing
function trNext() { const T = TRADE; if (T && T.stage === 1 && T.acc.me >= 1 && T.acc.them >= 1) { T.stage = 2; T.acc = { me: 0, them: 0 }; } }
function trTryFinish() {
  const T = TRADE; if (!T || T.stage !== 2 || T.acc.me !== 2 || T.acc.them !== 2) return;
  const give = trMine();
  if (give.length !== T.mine.uids.length || T.mine.gold > S.gold) { LinkNet.send({ t: 'tr.x' }); return trEnd('Something in your offer changed, so the trade was called off.'); }
  const got = T.theirs.mons.map(o => linkUnpack(o, trPeer())).filter(Boolean);
  S.mons = S.mons.filter(m => !T.mine.uids.includes(m.uid));
  for (const m of got) { m.loc = team().length < (typeof TEAM_MAX !== 'undefined' ? TEAM_MAX : 6) ? 'team' : 'box'; S.mons.push(m); }
  S.gold += T.theirs.gold - T.mine.gold; if (typeof updateHUD === 'function') updateHUD();
  const n = trPeer(), H = h2h(n); H.tr = (H.tr || 0) + 1;
  TRADE = null; linkFollow(); if (typeof autoSave === 'function') autoSave(); Sound.play('gotcha');
  const pics = got.map(m => `<img src="${monPicOf(m, 'front')}" style="width:${got.length > 2 ? 64 : 96}px;height:${got.length > 2 ? 64 : 96}px;image-rendering:pixelated">`).join('');
  openModal('Trade complete!', `<div style="text-align:center">${pics}</div><p>${got.length ? `${got.map(m => `<b>${trEsc(monName(m))}</b>`).join(', ')} ${got.length > 1 ? 'are' : 'is'} yours now!` : `${trEsc(n)} sent you no Fablemon.`}${T.theirs.gold ? ` You got <b>${T.theirs.gold.toLocaleString()}g</b>.` : ''}${give.length ? ` ${give.map(m => trEsc(monName(m))).join(', ')} ${give.length > 1 ? 'are' : 'is'} off to ${trEsc(n)}.` : ''}</p><div class="row"><button class="btn gold" data-a="ok">Lovely</button></div>`, () => closeModal());
}
LinkNet.listen(m => {
  if (m.t === 'tr.req') return trAsked();
  if (m.t === 'tr.no') { if (TRADE && TRADE.asked) { TRADE = null; closeModal(); toast(`${trPeer()} doesn't want to trade right now.`, 2600); } return; }
  if (m.t === 'tr.yes') { if (TRADE && TRADE.asked) trOpen(); return; }
  if (m.t === 'tr.x') { if (TRADE) trEnd(`${trPeer()} closed the trade.`); return; }
  const T = TRADE; if (!T || !T.mine) return;
  if (m.t === 'tr.off') {
    T.theirs = { mons: (m.mons || []).slice(0, TRADE_MAX).filter(o => o && SPECIES[o.sp]).map(o => ({ ...o, uid: 'f' + Math.random(), hp: 1 })), gold: Math.max(0, Math.floor(+m.gold || 0)), rev: m.rev | 0 };
    T.acc = { me: 0, them: 0 }; T.stage = 1; if (T.view && T.view.side === 'them') T.view = null;
    Sound.play('pop'); return trDraw();
  }
  if (m.t === 'tr.acc') {
    if (m.mine !== T.theirs.rev || m.theirs !== T.mine.rev) return;   // accepted an older offer: ignore
    if (m.st === 1 && T.stage === 1) { T.acc.them = 1; trNext(); }
    else if (m.st === 2 && T.stage === 2) { T.acc.them = 2; trTryFinish(); }
    if (TRADE) trDraw();
  }
  if (m.t === 'bye' && TRADE) trEnd('The link dropped, so the trade was called off.');
});

// the friend card's Trade button and the hall menu open the live window when you're linked
{
  const _fc = friendCard;
  friendCard = function () {
    _fc();
    const b = document.querySelector('#mBody [data-a=trade]'); if (b) { b.textContent = '🔁 Trade'; b.dataset.a = 'livetrade'; b.onclick = e => { e.stopPropagation(); linkCardOpen = false; linkTradeAsk(); }; }
  };
  const _lm = linkMenu;
  linkMenu = function () {
    _lm();
    const b = document.querySelector('#mBody [data-a=trade]');
    if (b && LinkNet.on) b.insertAdjacentHTML('beforebegin', `<button class="btn gold" id="lkLiveTr" style="width:100%;margin:3px 0">🔁 Trade with ${trEsc(trPeer())}</button>`), document.getElementById('lkLiveTr').onclick = e => { e.stopPropagation(); linkTradeAsk(); };
  };
}
