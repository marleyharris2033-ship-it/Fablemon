/* ============================================================ Requests
   Villagers you've met pin small jobs to the notice board: bring me some of something, within a few days.
   A new one goes up most mornings (up to three at a time). Hand them in from the board for gold and friendship.
   S.requests = { list: [{ who, item, n, gold, due, line }], day, done } */
const REQ_MAX = 3, REQ_FP = 80;
const reqState = () => (S.requests = S.requests || { list: [], day: 0, done: 0 });
const reqCount = id => [id, ...(QUAL[id] || [])].reduce((a, i) => a + inv.count(i), 0);
function reqTake(id, n) { for (const i of [id, ...(QUAL[id] || [])]) { const k = Math.min(n, inv.count(i)); if (k) { inv.remove(i, k); n -= k; } } }
const REQ_LINES = {
  crop: ['for a big pot of stew', 'for the market stall', "for my sister's visit", 'to try a new recipe', 'for a harvest supper'],
  mat: ['to mend my fence', 'for a little shed out back', 'to patch up the roof', 'for a garden bench'],
  animal: ['for some baking', 'for a cake I promised someone', 'for a proper breakfast', 'to make something nice'],
  other: ['for a little project', "because I've run out", 'to cheer someone up', 'for a gift'],
};
// what the player could plausibly get right now
function reqPool() {
  const si = seasonIdx(S.day), out = [];
  const base = ['turnip', 'carrot', 'potato', 'tomato', 'corn', 'pumpkin'];   // crops from further afield only once you've shipped some
  for (const [k, C] of Object.entries(CROPS)) if (C.seasons && C.seasons.includes(si) && ITEMS[C.item] && ITEMS[C.item].sell && (base.includes(k) || (S.shippedKinds || {})[C.item])) out.push([C.item, 'crop']);
  for (const id of ['wood', 'stone', 'fiber']) out.push([id, 'mat']);
  if (typeof LV_KIND !== 'undefined') for (const a of S.animals || []) if (!a.baby) out.push([LV_KIND[a.kind].out, 'animal']);
  for (const id of Object.keys(S.shippedKinds || {})) { const I = ITEMS[id]; if (I && I.sell && I.sell <= 1500 && !I.tool && !I.place && !I.seed && (I.stack || 1) > 1 && !I.qbase) out.push([id, 'other']); }
  const seen = new Set(); return out.filter(([id]) => !seen.has(id) && seen.add(id));
}
function reqNew() {
  const R = reqState(), met = Object.keys((S.town && S.town.met) || {}).filter(id => VILL[id] && !R.list.some(r => r.who === id));
  const pool = reqPool().filter(([id]) => !R.list.some(r => r.item === id));
  if (!met.length || !pool.length) return null;
  const who = pick(met), [item, kind] = pick(pool), I = ITEMS[item];
  const n = kind === 'mat' ? 20 + 5 * Math.floor(Math.random() * 5) : Math.max(1, Math.min(8, Math.round((150 + Math.random() * 350) / I.sell)));
  const gold = Math.round(Math.max(120, I.sell * n * 1.6) / 10) * 10;
  const r = { who, item, n, gold, due: S.day + 3 + Math.floor(Math.random() * 3), line: pick(REQ_LINES[kind]) };
  R.list.push(r); return r;
}
// each morning: drop expired requests and pin up a fresh one
function reqMorning() {
  const R = reqState(); if (R.day === S.day) return 0;
  R.day = S.day; const gone = R.list.filter(r => r.due < S.day).length; R.list = R.list.filter(r => r.due >= S.day);
  let added = 0; if (R.list.length < REQ_MAX && (Math.random() < .75 || !R.list.length) && reqNew()) added++;
  return added;
}
const _reqNightly = nightly;
nightly = function (passedOut) {
  const r = _reqNightly(passedOut);
  if (reqMorning() && S.morning) S.morning += ' · A new request is pinned to the notice board';
  return r;
};
function openRequests() {
  const R = reqState(); if (R.day !== S.day) reqMorning();
  if (!R.list.length && !R.done) reqNew();   // the very first visit always has something
  const render = () => {
    const rows = R.list.map((r, i) => {
      const v = VILL[r.who], I = ITEMS[r.item], have = reqCount(r.item), left = r.due - S.day;
      return `<div class="recipe" style="align-items:flex-start"><img src="${VPIC[r.who + '1'] || VPIC[r.who + '0'] || ''}" style="width:46px;height:46px;object-fit:cover;border-radius:6px"><div class="g"><b>${v.name}</b>
        <small>"Could you bring me ${r.n} ${I.name} ${r.line}?"</small>
        <div style="margin-top:3px"><span class="need ${have < r.n ? 'no' : ''}"><img src="${iconFor(r.item)}">${Math.min(have, r.n)}/${r.n}</span> <small>Reward ${r.gold.toLocaleString()}g and friendship · ${left <= 0 ? '<b style="color:#b03a2e">due today</b>' : `${left} day${left > 1 ? 's' : ''} left`}</small></div></div>
        <button class="btn gold" data-a="give" data-i="${i}" ${have < r.n ? 'disabled' : ''}>Give</button></div>`;
    }).join('');
    return `<p>Little jobs from your neighbours. A new one goes up most mornings.${R.done ? ` You've helped out ${R.done} time${R.done > 1 ? 's' : ''}.` : ''}</p>
      <div class="mlist">${rows || '<p class="hint">Nothing pinned up today. Check back tomorrow, or meet more of Smallroot.</p>'}</div>`;
  };
  openModal('Requests', render(), (a, d) => {
    if (a !== 'give') return;
    const r = R.list[+d.i]; if (!r || reqCount(r.item) < r.n) return Sound.play('error');
    reqTake(r.item, r.n); S.gold += r.gold; addFP(r.who, REQ_FP); R.list.splice(+d.i, 1); R.done = (R.done || 0) + 1;
    updateHUD(); renderHotbar(); Sound.play('coin'); save();
    toast(`${VILL[r.who].name}: "Oh, thank you!" +${r.gold.toLocaleString()}g ♥`, 2600);
    $('mBody').innerHTML = render();
  });
}
const _reqBoard = openBoard;
openBoard = function () {
  _reqBoard();
  const R = reqState(); if (R.day !== S.day) reqMorning();
  keepAdded('reqBtn', () => {
    const n = reqState().list.length;
    $('mBody').insertAdjacentHTML('afterbegin', `<button class="btn gold" id="reqBtn" style="width:100%;margin-bottom:8px">📌 Requests from neighbours${n ? ` (${n})` : ''}</button>`);
    $('reqBtn').onclick = () => openRequests();
  });
};
