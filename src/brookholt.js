/* ============================================================ Brookholt
   A small canal town past Sluice Fen: a clinic, the Chandlery (bog crops and peat), two repairs,
   the train back to Smallroot, and Warden Delphine's Lock House. Stand-in art from Smallroot for now. */
const CREST_INFO = { root: ['🌿 Root Crest', '#4e9a3a'], brook: ['💧 Brook Crest', '#3a7ab0'], hearth: ['🔥 Hearth Crest', '#c0602a'] };
const BH_PROJECTS = {
  bh_cottage: { name: 'Lock Cottage', need: { wood: 80, fiber: 40 }, gold: 1000, blurb: "The lock-keeper's old cottage, empty for years." },
  bh_mill: { name: 'Old Watermill', need: { wood: 120, stone: 60 }, gold: 1500, blurb: 'Get the wheel turning again. The canal folk would love it.' },
};
const bhState = () => (S.bh = S.bh || { done: {}, pending: {} });
const bhDone = id => !!bhState().done[id];
const bhRepairs = () => Object.keys(bhState().done).length;
// Wardens choose their own moves, like a gym leader would: a Tide team with a little Gale cover for Leaf challengers
// Fenfang is her ace, backed by both Puffpiper forms
const DELPHINE_TEAM = [['lotling', 21, ['undertow', 'staticfield', 'springsip', 'bogbubble']], ['puffpiper_cotton', 22, ['hum', 'featherdance', 'downdraft', 'sapsip']],
  ['muddlebub', 22, ['mirejet', 'raincall', 'scree', 'mudslick']], ['puffpiper', 23, ['mirejet', 'downdraft', 'flitaway', 'bogbubble']],
  ['brookstride', 23, ['weirwave', 'aquaflick', 'tidedance', 'quickhop']], ['fenfang', 25, ['aquaflick', 'haunt', 'mirejet', 'sharpen']]];
const wardenMon = ([sp, lv, moves]) => { const m = trainerMon(sp, lv); if (moves) m.moves = moves.filter(id => MOVES[id]); return m; };

function bhBoard() {
  const render = () => {
    const B = bhState();
    const rows = Object.entries(BH_PROJECTS).map(([id, p]) => {
      if (B.done[id]) return `<div class="proj"><b>${p.name}</b><span class="st">✔ Restored</span></div>`;
      if (B.pending[id]) return `<div class="proj"><b>${p.name}</b><span class="st">⚒ Work starts tonight</span></div>`;
      let ok = S.gold >= p.gold;
      const needs = Object.entries(p.need).map(([k, n]) => { const have = inv.count(k); if (have < n) ok = false; return `<span class="need ${have < n ? 'no' : ''}"><img src="${iconFor(k)}">${Math.min(have, n)}/${n}</span>`; }).join('');
      return `<div class="proj"><b>${p.name}</b><br><small>${p.blurb}</small><div style="display:flex;align-items:center;justify-content:space-between;gap:6px;margin-top:4px;flex-wrap:wrap"><div>${needs}<span class="need ${S.gold < p.gold ? 'no' : ''}"><img src="${ICONS.coin}">${p.gold}g</span></div><button class="btn gold" data-a="fund" data-id="${id}" ${ok ? '' : 'disabled'}>Fund</button></div></div>`;
    }).join('');
    return `<p>Brookholt's repair list. Warden Delphine won't battle anyone until the town has been looked after: <b>${bhRepairs()}/2</b> done.</p><div class="mlist">${rows}</div>`;
  };
  openModal('Brookholt notice board', render(), (a, d) => {
    if (a !== 'fund') return;
    const p = BH_PROJECTS[d.id];
    if (S.gold < p.gold || Object.entries(p.need).some(([k, n]) => inv.count(k) < n)) return Sound.play('error');
    for (const [k, n] of Object.entries(p.need)) inv.remove(k, n);
    S.gold -= p.gold; bhState().pending[d.id] = 1; updateHUD(); renderHotbar(); Sound.play('coin');
    toast(`Funded: ${p.name}. The canal folk start work tonight!`, 2600);
    $('mBody').innerHTML = render();
  });
}

const BH_SHOP = [['watercress_seeds', 40], ['wildrice_seeds', 80], ['cranberry_seeds', 90], ['lotus_seeds', 120], ['bog_peat', 25], ['root_charm', 45], ['sturdy_charm', 130]];
function bhDoor(sc, id) {
  const b = ROUTES.brookholt.buildings.find(q => q.id === id);
  if (b.repair && !bhDone(id)) return toast(`${b.name}: boarded up. Its repair can be funded at the notice board.`, 2600);
  Sound.play('door');
  if (id === 'bh_clinic') return openModal('Brookholt Clinic', `<p>Nurse Ottilie bustles over. "Rough crossing through the fen? Let's have a look at them."</p><div class="row"><button class="btn gold" data-a="heal">Heal my team</button></div>`, a => {
    if (a === 'heal') { S.mons.forEach(restMon); refreshTeamBtn(); Sound.play('fill'); toast('Your Fablemon are fully healed and their moves are restored!', 2400); closeModal(); }
  });
  if (id === 'bh_shop') {
    const render = () => `<p>"Seeds for wet ground, love. Nothing else grows like it out here." Watercress only grows right beside your pond; the rest need waterlogged soil. Spread <b>Bog Peat</b> on tilled soil to waterlog it anywhere on your farm. Waterlogged soil never needs watering, but only bog crops will grow in it.</p><div class="mlist">${BH_SHOP.map(([i, p]) => shopRow(i, p)).join('')}</div>`;
    return openModal('The Chandlery', render(), (a, d) => { if (a === 'buy') buy(d.id, +d.p, +d.n || 1); $('mBody').innerHTML = render(); });
  }
  if (id === 'bh_station') {
    if (!S.town.done.station) return openModal('Brookholt Halt', `<p>The halt is swept and tidy, and the rails run off west towards Smallroot. A faded notice reads: <i>"Service suspended until Smallroot Station reopens."</i></p><p class="hint">Restore Smallroot Station from the notice board in Smallroot, and the trains will run between the two towns.</p>`);
    return openModal('Brookholt Halt', `<p>The little train to Smallroot is waiting at the platform.</p><div class="row" style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn gold" data-a="go">Ride to Smallroot</button>${S.visited && S.visited.quarrydown ? '<button class="btn gold" data-a="qd">Ride to Quarrydown</button>' : ''}<button class="btn" data-a="no">Not now</button></div>`, a => {
      closeModal(); if (a === 'go') travel(sc, 'town', { x: 63, y: 25, dir: 'down' }); if (a === 'qd') travel(sc, 'quarrydown', { x: 12, y: 22, dir: 'down' });
    });
  }
  if (id === 'bh_cottage') return toast('The Lock Cottage is cosy and freshly painted. Someone will move in soon.', 2600);
  if (id === 'bh_mill') return toast('The great wheel creaks round, and the whole canal seems happier for it.', 2600);
  if (id === 'bh_lock') {
    if (!lockHouseOpen()) return delphine(sc);
    Sound.play('door'); return travel(sc, 'bhgym', { x: 10, y: 26, dir: 'up' });
  }
}

function delphine(sc) {
  const D = (t, f = 0) => ({ who: 'trainer', name: 'Warden Delphine', img: trainerPic('delphine', f), t });
  if (S.crests && S.crests.brook) return Talk.say([D(pick(["The canal runs smoother with you around. Keep that Brook Crest bright.", "Every lock needs a keeper. Every keeper needs a team they trust. You have one.", "Mind the fen on your way home!"]), 1)]);
  if (!S.crests || !S.crests.root) return Talk.say([D("A keeper without Mabel's Crest? Go and see her first, at the end of Brookside Lane.")]);
  if (bhRepairs() < 2) return Talk.say([D("You've come through the fen to see me? Good. I'm Delphine, keeper of the locks, and Warden of this stretch of water."),
    D(`But a Warden looks after a place, not just their Fablemon. Brookholt needs a hand: two repairs on the notice board. You've done ${bhRepairs()}.`),
    D('Help the town, and the lock gates are open to you.', 1)]);
  if (!team().some(m => m.hp > 0)) return toast('Your Fablemon are too tired to battle. Rest them first.', 2400);
  Talk.say([D("The mill's turning and the cottage is lived in. You kept your word."), D("Water is patient. It wears down stone, given time. Let's see if your team can hold back the tide!")], () => {
    const tm = DELPHINE_TEAM.map(wardenMon);
    Battle.start(tm[0], { label: 'Warden', name: 'Delphine', team: tm, prize: 3000, boss: true, heals: 2, lose: 'Well, the tide turns for everyone eventually.', onWin: () => {
      S.crests = S.crests || {}; S.crests.brook = 1; giveSigil('tide'); S.trainers = S.trainers || {}; S.trainers.delphine = 1;
      setTimeout(() => { Sound.play('gotcha'); Talk.say([D('Here: the Brook Crest. Every lock-keeper from here to the sea will wave you through.', 1), D("If Smallroot's station is running, the train will have you home in no time.", 1)], () => toast('You received the Brook Crest! 💧', 3600)); }, 400);
    } });
  });
}

/* ---------- the train from Smallroot (after the 2nd Crest) */
function svcStation() {
  const been = S.visited && S.visited.brookholt, qd = S.visited && S.visited.quarrydown, hm = S.visited && S.visited.highmoor;
  openModal('Smallroot Station', `<p style="text-align:center;font-size:22px">🚂</p><p><b>Departures</b></p>
    <div class="proj"><b>Brookholt, via the fen</b><span class="st">${been ? 'On time' : 'Visit Brookholt first'}</span></div>
    <div class="proj"><b>Quarrydown, via the mountain line</b><span class="st">${qd ? 'On time' : 'Visit Quarrydown first'}</span></div>
    <div class="proj"><b>14:40 to the City</b><span class="st">Line closed</span></div>
    ${hm ? `<p style="margin-top:8px">🪁 A Kestrel Kites glider is tethered at the end of the platform. "Highmoor-bound!" calls the pilot. "We ride the updrafts off the hills. Hold on tight."</p><div class="row"><button class="btn gold" data-a="hm">Fly to Highmoor</button></div>` : ''}
    ${been || qd ? `<div class="row" style="display:flex;gap:6px;flex-wrap:wrap">${been ? '<button class="btn gold" data-a="go">Ride to Brookholt</button>' : ''}${qd ? '<button class="btn gold" data-a="qd">Ride to Quarrydown</button>' : ''}</div>` : ''}
    ${!been || !qd ? `<p class="hint">"Walk there once, and I'll know where to take you," Stanley says.</p>` : ''}`, a => {
    if (a === 'go') { closeModal(); travel(scene, 'brookholt', { x: 6, y: 24, dir: 'down' }); }
    if (a === 'qd') { closeModal(); travel(scene, 'quarrydown', { x: 12, y: 22, dir: 'down' }); }
    if (a === 'hm') { closeModal(); Sound.play('gust'); toast('The glider lifts off the platform and climbs the warm air over the hills, north to the windmill cliffs...', 2200); setTimeout(() => travel(scene, 'highmoor', { x: 10, y: 33, dir: 'down' }), 900); }
  });
}

/* ---------- wetland crops */
Object.assign(ITEMS, {
  watercress_seeds: { name: 'Watercress Seeds', stack: 999, seed: 'watercress', sell: 20, desc: 'Spring and summer. Only grows on tilled soil right next to the pond. Ready in 3 days; water it daily.' },
  watercress: { name: 'Watercress', stack: 999, sell: 75, desc: 'Peppery and fresh. Sells for 75g.' },
  wildrice_seeds: { name: 'Wild Rice Seeds', stack: 999, seed: 'wildrice', sell: 40, desc: 'Summer and fall. Needs waterlogged ground: next to water, or on Bog Peat. Ready in 9 days.' },
  wild_rice: { name: 'Wild Rice', stack: 999, sell: 175, desc: 'Long dark grains from the marsh. Sells for 175g.' },
  cranberry_seeds: { name: 'Cranberry Seeds', stack: 999, seed: 'cranberry', sell: 45, desc: 'Fall. Needs waterlogged ground: next to water, or on Bog Peat. Ready in 8 days.' },
  cranberry: { name: 'Cranberries', stack: 999, sell: 210, desc: 'Tart red berries that bob on flooded beds. Sells for 210g.' },
  lotus_seeds: { name: 'Lotus Seeds', stack: 999, seed: 'lotus', sell: 60, desc: 'Summer. Needs waterlogged ground: next to water, or on Bog Peat. Ready in 10 days.' },
  lotus_root: { name: 'Lotus Root', stack: 999, sell: 280, desc: 'Crunchy, with a pretty lace pattern inside. Sells for 280g.' },
  bog_peat: { name: 'Bog Peat', stack: 999, peat: 1, sell: 8, desc: 'Spread it on tilled soil to waterlog it for good. Waterlogged soil never needs watering, but only bog crops will grow in it: wild rice, cranberries and lotus.' },
});
// wetland dishes: three give your Fablemon a boost in battle for the rest of the day (one boost at a time)
const BUFF_TEXT = { atk: 'stronger (+10% Attack)', def: 'tougher (+10% Defence)', spd: 'quicker (+10% Speed)', all: 'ready for anything (+5% to every stat)' };
const buffMul = k => !S.buff || S.buff.day !== S.day ? 1 : S.buff.k === k ? 1.1 : S.buff.k === 'all' ? 1.05 : 1;
Object.assign(ITEMS, {
  watercress_salad: { name: 'Watercress Salad', stack: 99, eat: 50, sell: 190, desc: 'Crisp and peppery. Restores 50 energy.' },
  wildrice_pilaf: { name: 'Wild Rice Pilaf', stack: 99, eat: 160, sell: 430, buff: 'def', desc: 'Nutty marsh rice with carrots. Restores 160 energy, and your Fablemon get +10% Defence in battle for the rest of the day.' },
  cranberry_tart: { name: 'Cranberry Tart', stack: 99, eat: 140, sell: 560, buff: 'spd', desc: 'Sharp, sweet and sticky. Restores 140 energy, and your Fablemon get +10% Speed in battle for the rest of the day.' },
  lotus_stirfry: { name: 'Lotus Stir-fry', stack: 99, eat: 180, sell: 640, buff: 'atk', desc: 'Crunchy lotus root and watercress. Restores 180 energy, and your Fablemon get +10% Attack in battle for the rest of the day.' },
  bog_feast: { name: "Bog-Keeper's Feast", stack: 99, eat: 400, sell: 1600, buff: 'all', desc: 'Every treasure of the wetland on one plate. Restores 400 energy, and your Fablemon get +5% to every stat in battle for the rest of the day.' },
});
COOKING.push({ out: 'watercress_salad', need: { watercress: 2 } }, { out: 'wildrice_pilaf', need: { wild_rice: 1, carrot: 1 } }, { out: 'cranberry_tart', need: { cranberry: 2, honey: 1 } },
  { out: 'lotus_stirfry', need: { lotus_root: 1, watercress: 1 } }, { out: 'bog_feast', need: { wild_rice: 1, lotus_root: 1, cranberry: 1, brook_trout: 1 } });
const cvCrop = (id, days, seasons, extra = {}) => ({ days, item: extra.item || id, seasons, frames: [1, 2, 3, 4].map(n => `cv:${id}${n}`), ...extra });
Object.assign(CROPS, {
  watercress: cvCrop('watercress', 3, [0, 1], { edge: 1 }),
  wildrice: cvCrop('wildrice', 9, [1, 2], { bog: 1, item: 'wild_rice' }),
  cranberry: cvCrop('cranberry', 8, [2], { bog: 1 }),
  lotus: cvCrop('lotus', 10, [1], { bog: 1, item: 'lotus_root' }),
});
// is a farm tile right beside water?
const waterEdge = (x, y) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if ((dx || dy) && X >= 0 && Y >= 0 && X < W && Y < H && farm && farm.waterish[Y * W + X]) return true; } return false; };

// hand-tuned pixel art for the wetland crops and icons (wetland.json: [w, h, base64 RGBA])
function rgbaCanvas([w, h, b64]) { const c = document.createElement('canvas'); c.width = w; c.height = h; const bin = atob(b64), u = new Uint8ClampedArray(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); c.getContext('2d').putImageData(new ImageData(u, w, h), 0, 0); return c; }
function makeBogCropArt() {
  const P = pixCanvas, C = SAP_CANVAS;
  const sprout = (col) => P(10, 8, R => { R(4, 3, 2, 4, '#5e8a3a'); R(2, 2, 3, 2, col); R(5, 1, 3, 2, col); });
  // watercress: low round leaves
  C.watercress1 = sprout('#6bb24a');
  C.watercress2 = P(12, 10, R => { R(5, 4, 2, 5, '#4e8f3a'); for (const [x, y] of [[1, 4], [7, 3], [3, 1], [8, 6]]) R(x, y, 3, 3, '#6bb24a'); });
  C.watercress3 = P(14, 12, R => { R(6, 5, 2, 6, '#4e8f3a'); for (const [x, y] of [[1, 5], [9, 4], [4, 1], [9, 8], [2, 8], [6, 2]]) R(x, y, 4, 3, '#6bb24a'); R(5, 3, 2, 1, '#9ad06a'); });
  C.watercress4 = P(14, 12, R => { R(6, 5, 2, 6, '#4e8f3a'); for (const [x, y] of [[1, 5], [9, 4], [4, 1], [9, 8], [2, 8], [6, 2]]) R(x, y, 4, 3, '#7cc24a'); for (const [x, y] of [[3, 2], [10, 5], [5, 8]]) R(x, y, 1, 1, '#ffffff'); });
  // wild rice: tall grass with dark grain heads
  C.wildrice1 = sprout('#8ab04a');
  C.wildrice2 = P(10, 14, R => { for (const x of [2, 5, 7]) R(x, 3, 1, 10, '#7aa04a'); R(1, 6, 2, 1, '#8ab04a'); });
  C.wildrice3 = P(12, 18, R => { for (const x of [2, 5, 8]) R(x, 3, 1, 14, '#7aa04a'); R(3, 1, 1, 3, '#a8c06a'); R(6, 0, 1, 3, '#a8c06a'); });
  C.wildrice4 = P(12, 20, R => { for (const x of [2, 5, 8]) R(x, 5, 1, 14, '#9a9a4a'); for (const x of [1, 4, 7]) { R(x, 0, 3, 6, '#5a3a2a'); R(x + 1, 1, 1, 4, '#7a5a3a'); } });
  // cranberries: low shrub with red berries
  C.cranberry1 = sprout('#5a8a3a');
  C.cranberry2 = P(12, 10, R => { R(1, 4, 10, 5, '#4e7a3a'); R(3, 2, 6, 3, '#5a8a3a'); });
  C.cranberry3 = P(14, 11, R => { R(1, 4, 12, 6, '#4e7a3a'); R(3, 2, 8, 3, '#5a8a3a'); for (const [x, y] of [[4, 4], [9, 6]]) R(x, y, 2, 2, '#e8b0b0'); });
  C.cranberry4 = P(14, 11, R => { R(1, 4, 12, 6, '#4e7a3a'); R(3, 2, 8, 3, '#5a8a3a'); for (const [x, y] of [[2, 5], [5, 3], [8, 6], [10, 4], [6, 7], [11, 7]]) R(x, y, 2, 2, '#c0203a'); });
  // lotus: pads with a pink flower
  C.lotus1 = P(12, 6, R => { R(2, 2, 8, 3, '#4e9a5a'); R(6, 2, 1, 2, '#2e6a3a'); });
  C.lotus2 = P(14, 8, R => { R(1, 3, 12, 4, '#4e9a5a'); R(7, 3, 1, 2, '#2e6a3a'); R(9, 1, 3, 2, '#5aa86a'); });
  C.lotus3 = P(14, 14, R => { R(1, 8, 12, 5, '#4e9a5a'); R(6, 2, 1, 7, '#4e8a3a'); R(5, 0, 3, 3, '#e8a0c0'); });
  C.lotus4 = P(16, 16, R => { R(1, 10, 14, 5, '#4e9a5a'); R(7, 5, 1, 6, '#4e8a3a'); R(4, 1, 8, 5, '#f0b0d0'); R(6, 0, 4, 2, '#f8d0e0'); R(7, 2, 2, 2, '#f2d24e'); });
  if (ASSET.wetland) for (const [k, v] of Object.entries(ASSET.wetland.crops)) C[k] = rgbaCanvas(v);
}
(function wetlandIcons() {
  const mk = draw => { const c = document.createElement('canvas'); c.width = c.height = 24; const g = c.getContext('2d'); draw(g); return c.toDataURL(); };
  const packet = (col, dot) => mk(g => { g.fillStyle = '#2a1e1a'; g.fillRect(5, 3, 14, 19); g.fillStyle = '#e8dcc0'; g.fillRect(6, 4, 12, 17); g.fillStyle = col; g.fillRect(7, 8, 10, 9); g.fillStyle = dot; g.fillRect(10, 10, 4, 4); g.fillStyle = '#8f5f34'; g.fillRect(6, 4, 12, 2); });
  ICONS.watercress_seeds = packet('#6bb24a', '#ffffff'); ICONS.wildrice_seeds = packet('#9a9a4a', '#5a3a2a'); ICONS.cranberry_seeds = packet('#4e7a3a', '#c0203a'); ICONS.lotus_seeds = packet('#4e9a5a', '#f0b0d0');
  ICONS.watercress = mk(g => { g.fillStyle = '#2a1e1a'; g.fillRect(3, 6, 18, 14); g.fillStyle = '#6bb24a'; for (const [x, y] of [[4, 7], [11, 7], [7, 12], [14, 12], [4, 14]]) g.fillRect(x, y, 6, 5); g.fillStyle = '#4e8f3a'; g.fillRect(11, 15, 2, 5); });
  ICONS.wild_rice = mk(g => { g.fillStyle = '#2a1e1a'; g.fillRect(4, 12, 16, 9); g.fillStyle = '#c99462'; g.fillRect(5, 13, 14, 7); g.fillStyle = '#4a2a1a'; for (let i = 0; i < 9; i++) g.fillRect(6 + (i * 5) % 12, 13 + (i * 3) % 6, 2, 1); g.fillStyle = '#9a9a4a'; g.fillRect(11, 3, 1, 9); g.fillRect(14, 5, 1, 7); });
  ICONS.cranberry = mk(g => { for (const [x, y] of [[5, 9], [11, 6], [13, 13], [7, 14]]) { g.fillStyle = '#2a1e1a'; g.fillRect(x - 1, y - 1, 8, 8); g.fillStyle = '#c0203a'; g.fillRect(x, y, 6, 6); g.fillStyle = '#e86070'; g.fillRect(x + 1, y + 1, 2, 2); } });
  ICONS.lotus_root = mk(g => { g.fillStyle = '#2a1e1a'; g.fillRect(2, 8, 20, 10); g.fillStyle = '#e8d8c0'; g.fillRect(3, 9, 18, 8); g.fillStyle = '#c9b090'; for (const x of [5, 9, 13, 17]) g.fillRect(x, 11, 2, 3); g.fillStyle = '#d8c0a0'; g.fillRect(3, 9, 18, 1); });
  const dish = draw => mk(g => { g.fillStyle = '#2a1e1a'; g.fillRect(1, 15, 22, 6); g.fillStyle = '#f3ead8'; g.fillRect(2, 16, 20, 4); draw(g); });
  ICONS.watercress_salad = mk(g => { g.fillStyle = '#2a1e1a'; g.fillRect(3, 10, 18, 10); g.fillStyle = '#e8e0d0'; g.fillRect(4, 11, 16, 8); g.fillStyle = '#6bb24a'; for (const [x, y] of [[5, 8], [9, 7], [13, 8], [7, 10], [12, 10]]) g.fillRect(x, y, 4, 3); });
  ICONS.wildrice_pilaf = dish(g => { g.fillStyle = '#2a1e1a'; g.fillRect(3, 9, 18, 8); g.fillStyle = '#c99462'; g.fillRect(4, 10, 16, 6); g.fillStyle = '#4a2a1a'; for (let i = 0; i < 10; i++) g.fillRect(5 + (i * 5) % 14, 10 + (i * 3) % 5, 2, 1); g.fillStyle = '#e88a2a'; g.fillRect(9, 11, 2, 2); g.fillRect(15, 13, 2, 2); });
  ICONS.cranberry_tart = dish(g => { g.fillStyle = '#2a1e1a'; g.fillRect(3, 8, 18, 9); g.fillStyle = '#d8a060'; g.fillRect(4, 9, 16, 7); g.fillStyle = '#c0203a'; g.fillRect(5, 9, 14, 4); g.fillStyle = '#e86070'; g.fillRect(7, 10, 2, 1); g.fillRect(13, 10, 2, 1); });
  ICONS.lotus_stirfry = mk(g => { g.fillStyle = '#2a1e1a'; g.fillRect(2, 11, 20, 9); g.fillStyle = '#3a3a3e'; g.fillRect(3, 12, 18, 7); g.fillStyle = '#e8d8c0'; for (const x of [5, 10, 15]) g.fillRect(x, 12, 4, 3); g.fillStyle = '#c9b090'; for (const x of [6, 11, 16]) g.fillRect(x, 13, 1, 1); g.fillStyle = '#6bb24a'; g.fillRect(8, 15, 3, 2); g.fillRect(14, 15, 3, 2); });
  ICONS.bog_feast = dish(g => { g.fillStyle = '#2a1e1a'; g.fillRect(2, 7, 20, 10); g.fillStyle = '#c99462'; g.fillRect(3, 8, 8, 8); g.fillStyle = '#8a9a5a'; g.fillRect(12, 8, 8, 5); g.fillStyle = '#c0203a'; g.fillRect(12, 13, 3, 3); g.fillStyle = '#e8d8c0'; g.fillRect(16, 13, 4, 3); });
  ICONS.bog_peat = mk(g => { g.fillStyle = '#2a1e1a'; g.fillRect(4, 6, 16, 15); g.fillStyle = '#4a3020'; g.fillRect(5, 7, 14, 13); g.fillStyle = '#6a4a30'; for (const [x, y] of [[7, 9], [12, 11], [9, 15], [15, 16]]) g.fillRect(x, y, 3, 2); g.fillStyle = '#5a8a3a'; g.fillRect(6, 7, 4, 2); g.fillRect(14, 8, 3, 1); });
  if (ASSET.wetland) for (const [k2, v] of Object.entries(ASSET.wetland.icons)) ICONS[k2] = rgbaCanvas(v).toDataURL();
})();
