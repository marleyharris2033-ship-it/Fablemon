/* ============================================================ Villagers
   People move into Smallroot as their buildings are restored. Each one has a
   schedule, chat, gifts and hearts, and most run a service. */
const VILL = {
  willa: { name: 'Nurse Willa', row: 0, home: 'clinic', open: [480, 1200], likes: ['honey', 'berry', 'tomato_salad'], gift: ['mon_treat', 2],
    hello: "Oh, hello! I'm Willa. I've set up the clinic again, so bring your Fablemon to me whenever they're feeling poorly. Free of charge, of course.",
    lines: ["A good night's rest does wonders. For people and Fablemon alike.", "If your team comes back from the trail in a sorry state, just pop in.", "I grow my own herbs out back. Smallroot soil is wonderful for them.", "Poisoned? Burned? Don't worry, I've seen worse."] },
  gideon: { name: 'Gideon', row: 1, home: 'smith', open: [540, 1020], likes: ['corn_chowder', 'veg_soup', 'stone'], gift: ['root_charm', 10],
    hello: "Name's Gideon. Smith. That forge hasn't been lit in twenty years, but she's roaring now. Bring me your tools and some gold and I'll make them sing.",
    lines: ["Good steel's like a good friend. Takes heat to show what it's made of.", "That pickaxe of yours could do with some work, I'd wager.", "I'll make you charms that hold tighter than anything Marigold sells.", "Hmph. Don't stand too close to the forge."] },
  robin: { name: 'Robin', row: 2, home: 'carpenter', open: [540, 1020], likes: ['wood', 'pumpkin_pie', 'jacket_potato'], gift: ['wood', 100],
    hello: "Hiya! I'm Robin. Carpenter, joiner, general fixer of wonky things. Now I'm set up, anything you build round here will cost you a fair bit less.",
    lines: ["Measure twice, cut once! That's what my old gaffer used to say.", "Whatever you're building on that farm, I can save you some timber.", "Need wood in a hurry? I've stacks of it out back.", "I'm thinking of building a bandstand in the square one day."] },
  barney: { name: 'Old Barney', row: 3, home: 'tavern', open: [720, 1440], likes: ['pumpkin_pie', 'corn', 'honey'], gift: ['mon_treat', 1],
    hello: "Welcome to the Sleepy Acorn, friend! Barney's the name. Pull up a stool. I've got hot food, cold drinks, and more gossip than you can shake a stick at.",
    lines: ["Did you hear? Marigold's been ordering seeds from the city again.", "Bramble used to sing in here, you know. Terrible voice. Lovely man.", "Try the pie. Everyone tries the pie.", "Evenings are when this place comes alive."] },
  hattie: { name: 'Hattie', row: 4, home: 'ranch', open: [420, 960], likes: ['carrot', 'turnip', 'potato'], gift: ['feed', 20],
    hello: "Morning! Hattie. I run the ranch. I've been raising Fablemon since I was knee-high to a Tusskip. If you've got a trough, I've got feed.",
    lines: ["A well-fed Fablemon works with a song in its heart.", "Pet your Fablemon every day. They notice, you know.", "Some day I'd love to raise proper farm animals here again.", "Cloverclasp love a bit of clover. Who knew?"] },
  stanley: { name: 'Stanley', row: 5, home: 'station', open: [420, 1140], likes: ['jacket_potato', 'roast_turnip', 'honey'], gift: ['root_charm', 5],
    hello: "Good day. Stanley, stationmaster. The line's been dead for years, but the station is restored and I keep her ready. Trains will run again. Mark my words.",
    lines: ["The 9:15 to Brookholt. Oh, I do miss that sound.", "A station is the heart of a town. Well, after the Hearthroot.", "I polish this clock every morning, trains or no trains.", "When the line reopens, you'll be first aboard."] },
  rowan: { name: 'Warden Rowan', row: 6, home: 'hall', open: [540, 1080], likes: ['mon_treat', 'corn_chowder', 'honey'], gift: ['mon_treat', 3],
    hello: "So you're the one who woke the Hearthroot. I'm Rowan. I was Warden of Smallroot once, before the town emptied. Now the Hall stands again, so do I.",
    lines: ["A Warden protects the bond between a place and its Fablemon.", "Mabel was my teacher. Did she go easy on you? She doesn't go easy on anyone.", "Train hard. The wilds beyond Brookholt don't forgive carelessness.", "The Hearthroot hums when you're nearby. Have you noticed?"] },
  poppy: { name: 'Poppy', row: 7, home: 'homeA', open: [480, 1140], likes: ['berry', 'tomato', 'glazed_carrots'], gift: ['honey', 3],
    hello: "Hello there! I'm Poppy, and that little whirlwind is my son Finn. We've just moved into the old cottage. Smallroot feels like home already!",
    lines: ["Finn hasn't stopped talking about Fablemon since we arrived.", "I'm planting roses by the door. Fingers crossed!", "It's so peaceful here after the city.", "Thank you for fixing up our cottage. It means the world."] },
  finn: { name: 'Finn', row: 8, home: 'homeA', open: [540, 1080], likes: ['berry', 'berry_crumble', 'honey'], gift: ['root_charm', 3],
    hello: "Whoa! Are you a real Fablemon keeper? I'm Finn! When I grow up I'm gonna be a Warden and have like a HUNDRED Fablemon!",
    lines: ["Can I see your Fablemon? Please please please?", "I saw a Duskwick last night! Mum says I was dreaming.", "I'm practising my battling. Hyah! Hyah!", "Do Fablemon like sweets? I bet they like sweets."] },
  ivy: { name: 'Ivy', row: 9, home: 'homeB', open: [600, 1260], likes: ['wildflowers', 'tomato_salad', 'pumpkin'], gift: ['wildflowers', 5],
    hello: "Oh! Hi. Sorry, I was sketching. I'm Ivy. I moved here to paint the countryside, and honestly the Fablemon round here are the best models.",
    lines: ["The light in the square at sunset is just perfect.", "I'm painting the Hearthroot. It keeps changing on me!", "Hold still... no, never mind, you moved.", "A Whirplet sat on my easel this morning. Best day ever."] },
  fenwick: { name: 'Captain Fenwick', row: 10, home: 'homeC', open: [480, 1080], likes: ['corn_chowder', 'pumpkin_pie', 'veg_soup'], gift: ['root_charm', 8],
    hello: "Captain Fenwick, retired explorer, at your service! I've seen jungles, deserts and the frozen north, and I've chosen to settle here. Says a lot about Smallroot, eh?",
    lines: ["Did I ever tell you about the time I met a Frost Fablemon? Remind me later.", "Keep your boots dry and your charms handy, that's my motto.", "There are Fablemon out there nobody has ever recorded. Imagine!", "This monocle has seen things. Terrible things. And wonderful ones."] },
};
const VILL_IDS = Object.keys(VILL);
const villHere = id => !!S.town.done[VILL[id].home];
const villOpen = id => { const [a, b] = VILL[id].open; return S.time >= a && S.time < b; };
const VPIC = {};
function loadVillPics() {
  return loadImg(ASSET.villPortraits).then(img => {
    for (const [id, v] of Object.entries(VILL)) for (const f of [0, 1]) {
      const c = document.createElement('canvas'); c.width = c.height = 80; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
      g.fillStyle = '#cfe3b2'; g.fillRect(0, 0, 80, 80); g.drawImage(img, f * 64, v.row * 64, 64, 64, 0, 0, 80, 80);
      VPIC[id + f] = c.toDataURL();
    }
  });
}
/* friendship points: 250 per heart, 10 hearts; tw.hearts mirrors the heart count (the Hearthroot counts it) */
const FP_HEART = 250;
function fpOf(id) { const tw = S.town; tw.fp = tw.fp || {}; if (tw.fp[id] == null) tw.fp[id] = (tw.hearts[id] || 0) * FP_HEART; return tw.fp[id]; }
function addFP(id, n) { const v = Math.max(0, Math.min(10 * FP_HEART, fpOf(id) + n)); S.town.fp[id] = v; S.town.hearts[id] = Math.floor(v / FP_HEART); return v; }
const heartsOf = id => Math.floor(fpOf(id) / FP_HEART);
const heartStr = id => { const h = heartsOf(id); return h ? '♥'.repeat(h) : ''; };
const giftable = s => { const it = s && ITEMS[s.id]; return it && !it.tool && it.place !== 'obj' && it.place !== 'fence' && it.place !== 'gate' && (it.sell || it.eat || it.heal); };

function villChat(id, after, door) {
  const v = VILL[id], tw = S.town, first = !tw.met[id];
  const L = (t, f = 1) => ({ who: id, name: v.name, img: VPIC[id + f], hearts: heartStr(id), t });
  if (!tw.talked[id]) { tw.talked[id] = 1; addFP(id, 20); }
  tw.met[id] = 1;
  if (!first && !door) { const ev = nextHeartEvent(id); if (ev) return playHeartEvent(id, ev, after); }
  const lines = first ? [L(v.hello, 0)] : isBirthday(id) ? [L("It's my birthday today! Everyone's been so kind.", 0)] : [L(pick(v.lines), Math.random() < .5 ? 0 : 1)];
  const h = held();
  if (!door && !first && giftable(h)) {
    const a1 = after;
    if (!canGift(id)) { if ((tw.giftDay || {})[id] !== S.day && h) lines.push(L("You've spoiled me enough this week! Save that for someone else.", 1)); }
    else after = () => openModal(`Give a gift?`, `<p>Give <b>${ITEMS[h.id].name}</b> to ${v.name}?${isBirthday(id) ? ' 🎂 It\'s their birthday!' : ` <small>(${giftsLeft(id)} gift${giftsLeft(id) > 1 ? 's' : ''} left this week)</small>`}</p><div class="row" style="display:flex;gap:6px"><button class="btn gold" data-a="yes">Give it</button><button class="btn" data-a="no">Not now</button></div>`, a => {
      closeModal();
      if (a !== 'yes') return a1 && a1();
      giveGift(id, h.id, a1);
    });
  }
  Talk.say(lines, after);
}

/* ---------- services
   Shops grow with your Crests. A row the player can't buy yet shows which Crest unlocks it. */
const crestCount = () => Object.keys(S.crests || {}).length;
const ORD = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
const lockedRow = (id, crest, label) => `<div class="shoprow" style="opacity:.55"><img src="${iconFor(id)}" style="filter:grayscale(1)"><div class="g"><b>${label || ITEMS[id].name}</b><small>🔒 After your ${ORD[crest]} Crest</small></div></div>`;
const shopRow = (id, p0, crest = 0, n = 1, p = friendPrice(p0)) => crestCount() < crest ? lockedRow(id, crest, n > 1 ? `${ITEMS[id].name} ×${n}` : '') : `<div class="shoprow"><img src="${iconFor(id)}"><div class="g"><b>${ITEMS[id].name}${n > 1 ? ' ×' + n : ''}</b><small>${ITEMS[id].desc}</small></div><button class="btn gold" data-a="buy" data-id="${id}" data-p="${p}" data-n="${n}" ${S.gold < p ? 'disabled' : ''}>${p}g</button></div>`;
function svcClinic() {
  const shop = [['berry', 30, 0], ['honey', 150, 0], ['berry_crumble', 120, 1], ['tonic', 260, 2], ['mon_treat', 300, 3]];
  const render = () => `<p>Willa looks after your whole team for free.</p><div class="row"><button class="btn gold" data-a="heal">Heal my team</button></div>
    <p style="margin-top:10px"><b>Medicine</b></p><div class="mlist">${shop.map(([id, p, c]) => shopRow(id, p, c)).join('')}</div>`;
  openModal('Smallroot Clinic', render(), (a, d) => {
    if (a === 'heal') { S.mons.forEach(restMon); refreshTeamBtn(); Sound.play('fill'); toast('Your Fablemon are fully healed and their moves are restored!', 2400); }
    if (a === 'buy') buy(d.id, +d.p, +d.n || 1);
    $('mBody').innerHTML = render();
  });
}
function buy(id, p, n = 1) {
  if (S.gold < p) return Sound.play('error');
  const left = inv.add(id, n); if (left === n) { Sound.play('error'); return toast('Your backpack is full!'); }
  S.gold -= p; updateHUD(); renderHotbar(); Sound.play('coin');
}
const TOOL_TIERS = ['Basic', 'Copper', 'Iron', 'Gold'];
const TOOL_COST = [null, { gold: 1500, stone: 25 }, { gold: 5000, stone: 60 }, { gold: 15000, stone: 120 }];
const TOOL_CREST = [0, 2, 4, 7];
const toolCost = t => TOOL_COST[t] && (hasPerk('gideon') ? { ...TOOL_COST[t], gold: Math.round(TOOL_COST[t].gold * .8) } : TOOL_COST[t]);   // Crests needed before Gideon can work each tier (he needs better ore)
const TOOL_FX = {
  pickaxe: ['Breaks rocks faster. Mine: {h} hits per stone.', t => ({ h: [4, 3, 2, 1][t] })],
  axe: ['Chops harder: {h} damage per swing.', t => ({ h: t + 1 })],
  hoe: ['Tills {h} tile{s} in a line.', t => ({ h: t + 1, s: t ? 's' : '' })],
  can: ['Holds {c} water and waters {h} tile{s} in a line.', t => ({ c: [40, 60, 90, 130][t], h: t + 1, s: t ? 's' : '' })],
};
const toolTier = id => (S.tools && S.tools[id]) || 0;
const fx = (id, t) => { const [txt, f] = TOOL_FX[id], v = f(t); return txt.replace(/\{(\w)\}/g, (_, k) => v[k]); };
function applyToolNames() { for (const id of Object.keys(TOOL_FX)) { const base = { pickaxe: 'Pickaxe', axe: 'Axe', hoe: 'Hoe', can: 'Watering Can' }[id]; ITEMS[id].name = (toolTier(id) ? TOOL_TIERS[toolTier(id)] + ' ' : '') + base; } }
const canMax = () => [40, 60, 90, 130][toolTier('can')];
function svcSmith() {
  const render = () => {
    const rows = Object.keys(TOOL_FX).map(id => {
      const t = toolTier(id), nx = t + 1, c = toolCost(nx);
      if (!c) return `<div class="shoprow"><img src="${iconFor(id)}"><div class="g"><b>${ITEMS[id].name}</b><small>Fully upgraded. ${fx(id, t)}</small></div></div>`;
      if (crestCount() < TOOL_CREST[nx]) return `<div class="shoprow" style="opacity:.6"><img src="${iconFor(id)}"><div class="g"><b>${ITEMS[id].name} → ${TOOL_TIERS[nx]}</b><small>🔒 After your ${ORD[TOOL_CREST[nx]]} Crest. "${TOOL_TIERS[nx]} ore only comes in from the Wardens' towns," says Gideon.</small></div></div>`;
      const ok = S.gold >= c.gold && inv.count('stone') >= c.stone;
      return `<div class="shoprow"><img src="${iconFor(id)}"><div class="g"><b>${ITEMS[id].name} → ${TOOL_TIERS[nx]}</b><small>${fx(id, nx)}</small><div><span class="need ${S.gold < c.gold ? 'no' : ''}"><img src="${ICONS.coin}">${c.gold.toLocaleString()}g</span><span class="need ${inv.count('stone') < c.stone ? 'no' : ''}"><img src="${iconFor('stone')}">${c.stone}</span></div></div><button class="btn gold" data-a="up" data-id="${id}" ${ok ? '' : 'disabled'}>Upgrade</button></div>`;
    }).join('');
    return `<p>Better tools work faster and take less effort.</p><div class="mlist">${rows}
      <p style="margin-top:8px"><b>Charms</b></p><div class="shoprow"><img src="${iconFor('sturdy_charm')}"><div class="g"><b>${ITEMS.sturdy_charm.name}</b><small>${ITEMS.sturdy_charm.desc}</small></div><button class="btn gold" data-a="charm" ${S.gold < 120 ? 'disabled' : ''}>120g</button></div></div>`;
  };
  openModal("Gideon's Forge", render(), (a, d) => {
    if (a === 'up') {
      const t = toolTier(d.id) + 1, c = toolCost(t); if (!c || crestCount() < TOOL_CREST[t] || S.gold < c.gold || inv.count('stone') < c.stone) return Sound.play('error');
      S.gold -= c.gold; inv.remove('stone', c.stone); S.tools = S.tools || {}; S.tools[d.id] = t; applyToolNames();
      if (d.id === 'can') S.water = canMax();
      Sound.play('levelup'); updateHUD(); renderHotbar(); toast(`Gideon hands you your new ${ITEMS[d.id].name}!`, 2400);
    }
    if (a === 'charm') buy('sturdy_charm', 120);
    $('mBody').innerHTML = render();
  });
}
const carpenterDiscount = () => S.town && S.town.done.carpenter ? .75 : 1;
function svcCarpenter() {
  const render = () => `<p>With Robin in town, every recipe that uses wood needs a quarter less, and your ranch and house upgrades cost 15% less gold.</p>
    <div class="mlist"><div class="shoprow"><img src="${iconFor('wood')}"><div class="g"><b>Bundle of wood ×50</b><small>Seasoned timber, ready to use.</small></div><button class="btn gold" data-a="wood" ${S.gold < friendPrice(300) ? 'disabled' : ''}>${friendPrice(300)}g</button></div>
    <div class="shoprow"><img src="${iconFor('wood')}"><div class="g"><b>Sell wood</b><small>Robin buys timber at 4g each. You have ${inv.count('wood')}.</small></div><button class="btn" data-a="sell" ${inv.count('wood') < 10 ? 'disabled' : ''}>Sell 10</button></div></div>`;
  openModal("Robin's Workshop", render(), a => {
    if (a === 'wood') buy('wood', friendPrice(300), 50);
    if (a === 'sell') { if (inv.remove('wood', 10)) { S.gold += 40; Sound.play('coin'); updateHUD(); renderHotbar(); } }
    $('mBody').innerHTML = render();
  });
}
const TAVERN_MENU = [['roast_turnip', 120], ['veg_soup', 260], ['corn_chowder', 520], ['pumpkin_pie', 900], ['trainers_breakfast', 400, 2], ['fen_chowder', 1400, 4], ['hearth_roast', 2200, 6]];
function svcTavern() {
  if (!S.flags.tavernRecipes) { S.flags.tavernRecipes = 1; toast('Barney taught you 3 new recipes for your Cooking Pot!', 3000); }
  // a new recipe after every second Crest
  const fresh = COOKING.filter(r => r.crest && r.crest <= crestCount() && r.crest > (S.flags.tavernCrest || 0));
  if (fresh.length) { S.flags.tavernCrest = crestCount(); setTimeout(() => { Sound.play('levelup'); toast(`Barney taught you: ${fresh.map(r => ITEMS[r.out].name).join(', ')}!`, 3200); }, 300); }
  const learnt = COOKING.filter(r => r.tavern).map(r => r.crest && r.crest > (S.flags.tavernCrest || 0) ? `<span style="opacity:.55">🔒 ${ITEMS[r.out].name} (${ORD[r.crest]} Crest)</span>` : `<b>${ITEMS[r.out].name}</b>`).join(', ');
  const render = () => `<p>Hot food served all afternoon and evening. Barney's recipes for your Cooking Pot: ${learnt}.</p>
    <div class="mlist">${TAVERN_MENU.map(([id, p, c]) => shopRow(id, p, c || 0)).join('')}</div>`;
  openModal('The Sleepy Acorn', render(), (a, d) => { if (a === 'buy') buy(d.id, +d.p); $('mBody').innerHTML = render(); });
}
function svcRanch() {
  const render = () => `<p>Fablemon Feed works in any Feeding Trough, just like crops.</p>
    <div class="mlist">${shopRow('feed', 150, 0, 10)}${shopRow('premium_feed', 450, 4, 10)}</div>
    <p class="hint">"One day I'll have proper farm animals here again," Hattie says. "You'll be the first to know."</p>`;
  openModal("Hattie's Ranch", render(), (a, d) => { if (a === 'buy') buy(d.id, +d.p, +d.n || 1); $('mBody').innerHTML = render(); });
}
function svcHall() {
  if (!S.crests || !S.crests.root) return Talk.say([{ who: 'rowan', name: VILL.rowan.name, img: VPIC.rowan0, t: "Not yet. Earn Mabel's Root Crest first, down at the end of Brookside Lane. Then come and face me." }]);
  if (!S.crests.hearth && !rowanReady()) {
    const R = (t, f = 0) => ({ who: 'rowan', name: VILL.rowan.name, img: VPIC['rowan' + f], t });
    const cr = otherCrests(), rd = smallrootDone(), all = Object.keys(PROJECTS).length;
    return Talk.say([R(S.crests && S.crests.root ? "Mabel's Crest, eh? A fine start. But I'm the last Warden you'll face, not the second." : "A challenger? Not yet, friend. Not for a long while."),
      R(`Earn the Crests of the other seven Wardens across the valley. You have ${cr} of 7.`),
      R(`And a Warden of Smallroot answers to Smallroot. Bring the whole town back to life: every repair on the notice board. ${rd} of ${all} done.`),
      R("Do both, and I'll be waiting right here with everything I've got.", 1)]);
  }
  if (S.crests.hearth) return Talk.say([{ who: 'rowan', name: VILL.rowan.name, img: VPIC.rowan1, t: "The Hearth Crest suits you. Smallroot is in good hands." }]);
  openModal("Warden's Hall", `<p>This is the last Warden battle. Rowan's Ember Fablemon are around <b>level 68–72</b>. Your team will be fully healed before the battle.</p><div class="row"><button class="btn gold" data-a="go">Challenge Warden Rowan</button><button class="btn" data-a="no">Not yet</button></div>`, a => {
    closeModal(); if (a !== 'go') return;
    S.mons.forEach(restMon);
    const R = (t, f = 0) => ({ who: 'rowan', name: VILL.rowan.name, img: VPIC['rowan' + f], t });
    Talk.say([R("Good. Mabel taught me that a Warden's battle is a conversation. Let's hear what yours has to say."), R("I won't hold back. Show me the bond that woke the Hearthroot!")], () => {
      // placeholder Ember team until the later Ember Fablemon exist
      const team0 = [['kilnook', 68], ['brashlet', 69], ['pyrebrash', 70], ['kilnook', 70], ['pyrebrash', 72]].map(([sp, lv]) => wildMon(sp, lv));
      Battle.start(team0[0], { label: 'Warden', name: 'Rowan', team: team0, prize: 30000, boss: true, smart: true, heals: 2, lose: "Magnificent. The Hearthroot chose well.", onWin: () => {
        S.crests.hearth = 1;
        setTimeout(() => { Sound.play('gotcha'); Talk.say([R('Take this: the Hearth Crest. It means Smallroot trusts you with its heart.', 1), R('Eight Crests. The road to Crownroot Peak and the League is open to you now.', 1)], () => toast('You received the Hearth Crest! 🔥', 3200)); }, 400);
      } });
    });
  });
}
const SERVICE = { clinic: svcClinic, smith: svcSmith, carpenter: svcCarpenter, tavern: svcTavern, ranch: svcRanch, station: svcStation, hall: svcHall };
const BUILD_VILL = { clinic: 'willa', smith: 'gideon', carpenter: 'robin', tavern: 'barney', ranch: 'hattie', station: 'stanley', hall: 'rowan' };

/* where each villager stands while working, and where they stroll */
const SQUARE = [[34, 27], [30, 28], [24, 25], [12, 24], [40, 28], [36, 29], [44, 26], [27, 33], [36, 35], [31, 31], [42, 31], [36, 28], [46, 36], [26, 37]];
const _spot = {};
function workSpot(id) {
  if (_spot[id]) return _spot[id];
  const b = BUILDINGS[VILL[id].home], dx = b.cx + b.door, tw = scene && scene.town;
  const doorsUp = new Set(Object.values(BUILDINGS).map(q => (q.cx + q.door) + ',' + (q.by + 1)));
  for (const [x, y] of [[dx + 1, b.by + 1], [dx - 1, b.by + 1], [dx + 2, b.by + 1], [dx - 2, b.by + 1], [dx + 1, b.by + 2], [dx, b.by + 2]])
    if (tw && !tw.blocked[y * TW + x] && !doorsUp.has(x + ',' + y)) return (_spot[id] = [x, y]);
  return [dx, b.by + 2];
}
function villWander(id) {
  const r = VILL[id].row, b = BUILDINGS[VILL[id].home], tw = scene && scene.town;
  const pts = SQUARE.filter((_, i) => (i + r) % 3 !== 0).filter(([x, y]) => !tw || !tw.blocked[y * TW + x]);
  return pts.concat([[b.cx + b.door, b.by + 2]].filter(([x, y]) => !tw || !tw.blocked[y * TW + x]));
}
