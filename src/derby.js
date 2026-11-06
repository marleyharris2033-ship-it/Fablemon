/* ============================================================ The Smallroot Derby
   A racing league at the north of Smallroot, run by Monty Quickstep. You steer your own Fablemon round a
   top-down track; its Speed stat sets its top speed and acceleration, Attack powers the dash, Defence keeps
   it steady when it bumps into things and HP is its stamina for dashing.
   Each cup is three races scored on points; the third is against the cup's champion. Cups only take certain
   evolution stages and have a level cap: a Fablemon over the cap races as if it were at the cap.
   All races start from the Derby arch (BUILDINGS.derby); the later cups in the plan arrive with their Wardens. */

const DERBY_PTS = [10, 6, 3, 1];
const DERBY_LAPS = 3;

// tracks: a closed centre line (tile coords), width in tiles, surfaces, hazards and which types they favour
const DERBY_TRACKS = {
  meadow: {
    name: 'Meadow Loop', w: 46, h: 34, scale: .85, width: 4.6, ground: 'grass', surface: 'dirt',
    pts: [[8, 7], [20, 5], [33, 6], [40, 10], [39, 16], [31, 17], [26, 21], [32, 26], [36, 29], [24, 30], [12, 29], [6, 23], [5, 14]],
    obstacles: 9, kinds: ['stump', 'rock_large', 'crate', 'stump', 'rock_pair'], puddles: 3, boosts: 3, grip: ['Leaf', 'Wild'],
    blurb: 'Grass, logs and hay bales. Leaf and Wild Fablemon keep their footing on the grass.',
  },
  bramble: {
    name: 'Meadow Loop (reversed)', w: 46, h: 34, scale: .9, width: 4, ground: 'grass', surface: 'dirt', reverse: true, hedges: true,
    pts: [[8, 7], [20, 5], [33, 6], [40, 10], [39, 16], [31, 17], [26, 21], [32, 26], [36, 29], [24, 30], [12, 29], [6, 23], [5, 14]],
    obstacles: 12, kinds: ['stump', 'bush_round', 'crate', 'rock_large', 'bush_round'], puddles: 3, boosts: 3, grip: ['Leaf', 'Wild'],
    blurb: 'The Meadow Loop run backwards, narrower, with hedges in the way.',
  },
  mudrun: {
    name: 'Mossmere Mudrun', w: 50, h: 36, scale: 1.15, width: 5, ground: 'moss', surface: 'mud',
    pts: [[7, 8], [18, 5], [30, 8], [42, 5], [45, 13], [38, 18], [44, 25], [40, 31], [27, 30], [20, 24], [13, 31], [5, 26], [9, 17]],
    obstacles: 7, kinds: ['stump', 'rock_large', 'rock_pair'], puddles: 7, boosts: 3, grip: [], mudSlow: .93,
    blurb: 'Thick mud and deep puddles. Tide Fablemon splash straight through.',
  },
};

// rival racers. sk = how well they drive (racing line and reactions), iv = their Speed potential (1-10)
const R_ = (who, sp, lv, sk = .9, iv = 5, held = null) => ({ who, sp, lv, sk, iv, held });
const DERBY_CUPS = [
  { id: 'sprout', name: 'Sprout Cup', icon: '🌱', track: 'meadow', stage: 1, cap: 15, fee: 50,
    unlock: () => true, lockText: '',
    prize: [800, [['swift_feather', 1]]], replay: [200, []],
    races: [
      [R_('Tess', 'tusskip', 11, .86), R_('Alf', 'cloverclasp', 13, .9), R_('Nell', 'flintuck', 14, .9)],
      [R_('Ollie', 'brooknook', 13, .89), R_('Bea', 'whirplet', 12, .88), R_('Tess', 'tusskip', 13, .9)],
      [R_('Finn', 'tusskip', 15, 1, 8), R_('Bea', 'whirplet', 14, .9), R_('Ollie', 'brooknook', 15, .9)],
    ], champ: 'Finn', champLine: "Finn's been practising with his Tusskip every day. He says he's going to win.",
  },
  { id: 'bramble', name: 'Bramble Cup', icon: '🌿', track: 'bramble', stage: 1, cap: 25, fee: 100,
    unlock: () => derbyWon('sprout') && !!(S.crests || {}).root, lockText: 'Win the Sprout Cup and earn the Root Crest.',
    prize: [1500, [['mon_treat', 3]]], replay: [350, []],
    races: [
      [R_('Kit', 'brashlet', 22, .9), R_('Alf', 'tusskip', 24, .9), R_('Nell', 'fuzzwick', 23, .9)],
      [R_('Tess', 'whirplet', 24, .92), R_('Ollie', 'rillip', 24, .92), R_('Kit', 'brashlet', 25, .92)],
      [R_('Hattie', 'cindhop', 25, 1.08, 9), R_('Tess', 'whirplet', 25, .94), R_('Kit', 'brashlet', 25, .94)],
    ], champ: 'Hattie', champLine: "Hattie's brought a Cindhop down from the mountains. Lava hares are quick, mind.",
  },
  { id: 'brook', name: 'Brook Cup', icon: '💧', track: 'mudrun', stage: 2, cap: 35, fee: 200,
    unlock: () => derbyWon('bramble') && !!(S.crests || {}).brook, lockText: 'Win the Bramble Cup and earn the Brook Crest.',
    prize: [3000, [['swift_feather', 1], ['study_leaf', 1]]], replay: [700, []],
    races: [
      [R_('Bea', 'whirlwyn', 32, .91), R_('Alf', 'mirebellows', 34, .92), R_('Nell', 'lotveil', 33, .92)],
      [R_('Ollie', 'brookstride', 34, .93), R_('Kit', 'staticwing', 34, .93), R_('Tess', 'reefarer', 34, .93)],
      [R_('Monty', 'fleecebolt', 35, 1.2, 10, 'swift_feather'), R_('Ollie', 'whirlwyn', 35, .95), R_('Tess', 'staticwing', 35, .95)],
    ], champ: 'Monty', champLine: "And in the final, it's me and Comet. Don't look so surprised. Champions don't retire, they just get slower. Slightly. Oh, and she's wearing her lucky Swift Feather.",
  },
];

const derby = () => (S.derby = S.derby || { won: {}, best: {}, wins: 0, races: 0 });
const derbyWon = id => !!(derby().won[id]);
const MONTY = (t, f = 0) => ({ who: 'monty', name: VILL.monty.name, img: VPIC['monty' + f], hearts: heartStr('monty'), t });
const raceStage = sp => { const s = MON_STAGE[sp] || 1; return s >= 3 ? 3 : s >= 2 ? 2 : 1; };
const STAGE_NAME = ['', 'First stages', 'Second stages', 'Third forms'];
function derbyEligible(m, cup) {
  if (SPECIES[m.sp].legend) return 'Legendary Fablemon can\'t race.';
  if (cup.stage && raceStage(m.sp) !== cup.stage) return `${STAGE_NAME[cup.stage]} only.`;
  return '';
}
// stats as the race sees them: capped level, plus a Swift Feather
function raceStats(m, cap) {
  const mm = { ...m, lv: Math.min(m.lv, cap || 100) };
  return { spd: monStat(mm, 'spd') * (m.held === 'swift_feather' ? 1.1 : 1), atk: monStat(mm, 'atk'), def: monStat(mm, 'def'), hp: monStat(mm, 'hp'), lv: mm.lv };
}
const fmtLap = ms => { const s = ms / 1000; return `${Math.floor(s / 60)}:${(s % 60).toFixed(2).padStart(5, '0')}`; };

/* ---------- the booth: cups, records */
function openDerby() {
  const d = derby();
  const render = () => {
    const cups = DERBY_CUPS.map(c => {
      const open = c.unlock(), won = d.won[c.id];
      return `<div class="shoprow" style="${open ? '' : 'opacity:.55'}"><div style="font-size:30px;width:44px;text-align:center">${c.icon}</div>
        <div class="g"><b>${c.name}</b> ${won ? `<span class="tchip" style="background:#c9a64e">🏆 Won${won > 1 ? ' ×' + won : ''}</span>` : ''}
        <small style="display:block">${STAGE_NAME[c.stage]} · level cap ${c.cap} · ${DERBY_TRACKS[c.track].name}</small>
        <small style="display:block">${open ? `Entry ${c.fee}g · Prize: ${won ? `${c.replay[0]}g` : prizeText(c.prize)}` : '🔒 ' + c.lockText}</small></div>
        ${open ? `<button class="btn gold sm" data-a="cup" data-id="${c.id}">Enter</button>` : ''}</div>`;
    }).join('');
    const recs = Object.entries(DERBY_TRACKS).filter(([k]) => d.best[k]).map(([k, t]) => `<div>⏱️ ${t.name}: <b>${fmtLap(d.best[k].ms)}</b> <small>(${d.best[k].who})</small></div>`).join('');
    return `<p class="hint">Three races a cup. Points: ${DERBY_PTS.join(', ')}. The last race is against the cup's champion. Fablemon over the level cap race as if they were at it.</p>
      <div class="mlist">${cups}</div>
      <p style="margin:10px 0 4px"><b>Lap records</b></p>${recs || '<small>No records yet. Go and set one!</small>'}
      <p style="margin:8px 0 0"><small>More cups will open as Wardens across the valley are found: Quarry, Beacon, Highmoor, Elderwood, Gloam and the Crown Cup.</small></p>
      <div class="row"><button class="btn" data-a="how">How to race</button></div>`;
  };
  openModal('🏁 Smallroot Derby', render(), (a, el) => {
    if (a === 'how') return openModal('🏁 How to race', `<p>Steer with the joystick (or arrow keys / WASD). Tap <b>Dash</b> (or Space) for a burst of speed. Dashing uses stamina, which refills as you run.</p>
      <ul style="margin:0;padding-left:18px"><li><b>Speed</b> sets top speed and acceleration.</li><li><b>Attack</b> makes the dash stronger.</li><li><b>Defence</b> keeps you steady when you hit things.</li><li><b>HP</b> refills stamina faster.</li></ul>
      <p>Stay on the track: grass and mud slow you down. Golden arrows give a boost. Puddles slow everyone except Tide Fablemon.</p><div class="row"><button class="btn" data-a="back">Back</button></div>`, b => { if (b === 'back') openDerby(); });
    if (a === 'cup') { const c = DERBY_CUPS.find(q => q.id === el.id); return pickRacer(c); }
  });
}
const prizeText = ([g, items]) => [g ? `${g.toLocaleString()}g` : '', ...items.map(([id, n]) => `${n > 1 ? n + ' ' : ''}${ITEMS[id].name}`)].filter(Boolean).join(' + ');

function pickRacer(cup) {
  const mons = team();
  const rows = mons.map(m => {
    const why = derbyEligible(m, cup), st = raceStats(m, cup.cap);
    return `<div class="shoprow" style="${why ? 'opacity:.5' : ''}"><img src="${monPic(m.sp)}"><div class="g"><b>${monName(m)}</b> <small>Lv ${m.lv}${m.lv > cup.cap ? ` → races as Lv ${cup.cap}` : ''}</small>
      <small style="display:block">${why || `Speed ${Math.round(st.spd)} · Attack ${st.atk} · Defence ${st.def} · HP ${st.hp}${m.held === 'swift_feather' ? ' · 🪶' : ''}`}</small></div>
      ${why ? '' : `<button class="btn gold sm" data-a="go" data-u="${m.uid}">Race</button>`}</div>`;
  }).join('');
  openModal(`${cup.icon} ${cup.name}`, `<p class="hint">${STAGE_NAME[cup.stage]} only, level cap ${cup.cap}. Entry: <b>${cup.fee}g</b>. ${DERBY_TRACKS[cup.track].blurb}</p>
    <div class="mlist">${rows || '<p>You have no Fablemon on your team.</p>'}</div><div class="row"><button class="btn" data-a="back">Back</button></div>`, (a, el) => {
    if (a === 'back') return openDerby();
    if (a !== 'go') return;
    if (S.gold < cup.fee) { Sound.play('error'); return toast(`You need ${cup.fee}g to enter.`); }
    const m = S.mons.find(x => x.uid === +el.u); if (!m) return;
    S.gold -= cup.fee; updateHUD(); closeModal();
    runCup(cup, m);
  });
}

/* ---------- a cup: three races, points, prizes */
async function runCup(cup, m) {
  const d = derby(), names = {}, pts = {}, me = 'You';
  const sayP = lines => new Promise(r => Talk.say(lines, r));
  if (!d.races) await sayP([MONTY("First time on my track? Right. Joystick to steer, Dash button for a burst. Dashing tires your Fablemon out, so pick your moment.", 0),
    MONTY("Stay on the dirt. Grass is slow, puddles are slower, and if you hit a stump you'll look a right wally. Off you go!", 1)]);
  else await sayP([MONTY(pick([`The ${cup.name}! Three races. Points for every place. Let's see what ${monName(m)}'s made of.`, `${monName(m)}, eh? I've got my stopwatch ready. Don't disappoint it.`, 'Racers to the line! Ha, I love saying that.']), 1)]);
  for (let r = 0; r < 3; r++) {
    const rivals = cup.races[r];
    if (r === 2) await sayP([MONTY(`Final race! ${cup.champLine}`, 1)]);
    const res = await derbyRace(cup, m, rivals, r);
    if (!res) { toast('You left the race. No points this time.'); return finishCup(cup, m, null); }
    res.order.forEach((who, i) => { pts[who] = (pts[who] || 0) + DERBY_PTS[i]; });
    d.races++;
    const table = Object.entries(pts).sort((a, b) => b[1] - a[1]);
    await new Promise(done => openModal(`${cup.icon} Race ${r + 1} of 3`, `<div class="mlist">${res.order.map((w, i) => `<div class="shoprow" style="${w === me ? 'background:#fff3c4' : ''}"><b style="width:34px">${PLACE[i]}</b><img src="${monPic(res.sp[w])}" style="width:36px;height:36px"><div class="g"><b>${w === me ? monName(m) + ' (you)' : w}</b><small>${res.times[w] ? fmtLap(res.times[w]) : ''}</small></div><span>+${DERBY_PTS[i]}</span></div>`).join('')}</div>
      ${res.bestLap ? `<p><small>Your best lap: <b>${fmtLap(res.bestLap)}</b>${res.record ? ' — a new track record! 🎉' : ''}</small></p>` : ''}
      <p style="margin:6px 0 2px"><b>Standings</b></p>${table.map(([w, p], i) => `<div>${i + 1}. ${w === me ? '<b>You</b>' : w} — ${p} pts</div>`).join('')}
      <div class="row"><button class="btn gold" data-a="ok">${r < 2 ? 'Next race' : 'See the results'}</button></div>`, a => { if (a === 'ok') { closeModal(); done(); } }, () => done()));
  }
  const table = Object.entries(pts).sort((a, b) => b[1] - a[1]);
  finishCup(cup, m, table.findIndex(([w]) => w === me));
}
async function finishCup(cup, m, place) {
  const d = derby(), sayP = lines => new Promise(r => Talk.say(lines, r));
  S.time = Math.min(S.time + 60, 25 * 60); updateHUD();
  if (place == null) return;
  addFP('monty', place === 0 ? 30 : 10);
  if (place !== 0) return sayP([MONTY(place === 1 ? `Second overall! Close, so close. Come back and have another go at the ${cup.name}.` : `${PLACE[place]} overall. Every champion started somewhere. Mostly at the back. Go again!`, 0)]);
  const first = !d.won[cup.id]; d.won[cup.id] = (d.won[cup.id] || 0) + 1; d.wins++;
  const got = prize(...(first ? cup.prize : cup.replay));
  Sound.play('levelup');
  const next = DERBY_CUPS[DERBY_CUPS.indexOf(cup) + 1];
  await sayP([MONTY(`${monName(m)} wins the ${cup.name}! ${first ? "That's going in the record book. In pen!" : 'Again! You\'re making the rest of them look like they\'re out for a stroll.'}`, 1),
    MONTY(`Here's your prize: ${got}.`, 1),
    ...(first && next ? [MONTY(next.unlock() ? `The ${next.name} is open to you now. ${STAGE_NAME[next.stage]}, level cap ${next.cap}. Tougher field, mind.` : `Next up is the ${next.name}. ${next.lockText} Then come and find me.`, 0)] : []),
    ...(first && !next ? [MONTY("That's every cup on this track for now. Word is there are Wardens out past the mountains. When folk hear about you, the big cups will come. Mark my words.", 1)] : [])]);
}

/* ---------- the race itself */
const DERBY_IMG = {};
async function derbyImages(sps) {
  const need = { objects: ASSET.objects, terrain: ASSET.terrain, peat: ASSET.g_peat, moss: ASSET.g_moss, bogwater: ASSET.g_bogwater };
  for (const sp of sps) need['mon_' + walkSp(sp)] = ASSET['mon_' + walkSp(sp)];
  await Promise.all(Object.entries(need).filter(([k, v]) => v && !DERBY_IMG[k]).map(async ([k, v]) => { DERBY_IMG[k] = await loadImg(v); }));
}
const OBJ = n => (ASSET.objectsJson.frames || ASSET.objectsJson)[n].frame;

// a seeded random number generator, so a cup's races are laid out the same way every time
function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

function buildTrack(key, seed) {
  const def = DERBY_TRACKS[key], T16 = 16, rand = rng(seed);
  const sc = def.scale || 1;
  let P = def.pts.map(([x, y]) => [x * T16 * sc + 8, y * T16 * sc + 8]); if (def.reverse) P = P.slice().reverse();
  // Catmull-Rom through the points, closed, sampled every ~6px
  const line = [];
  for (let i = 0; i < P.length; i++) {
    const p0 = P[(i - 1 + P.length) % P.length], p1 = P[i], p2 = P[(i + 1) % P.length], p3 = P[(i + 2) % P.length];
    const n = Math.max(4, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / 6));
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      line.push([.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        .5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]);
    }
  }
  const N = line.length, cum = [0];
  for (let i = 1; i <= N; i++) cum.push(cum[i - 1] + Math.hypot(line[i % N][0] - line[i - 1][0], line[i % N][1] - line[i - 1][1]));
  const L = cum[N], half = def.width * T16 / 2;
  const at = s => { s = ((s % L) + L) % L; let i = 0, j = N; while (j - i > 1) { const m = (i + j) >> 1; if (cum[m] <= s) i = m; else j = m; } const a = line[i], b = line[(i + 1) % N], f = (s - cum[i]) / Math.max(1e-6, cum[i + 1] - cum[i]); const x = a[0] + (b[0] - a[0]) * f, y = a[1] + (b[1] - a[1]) * f, dx = b[0] - a[0], dy = b[1] - a[1], dl = Math.hypot(dx, dy) || 1; return { x, y, tx: dx / dl, ty: dy / dl, nx: -dy / dl, ny: dx / dl }; };
  const nearest = (x, y, hint) => {
    let best = 1e18, bi = 0; const span = hint == null ? N : 40;
    for (let k = -span; k <= span; k++) { const i = hint == null ? (k + span) % N : ((hint + k) % N + N) % N; const d = (line[i][0] - x) ** 2 + (line[i][1] - y) ** 2; if (d < best) { best = d; bi = i; } if (hint == null && k + span >= N - 1) break; }
    return { i: bi, d: Math.sqrt(best), s: cum[bi] };
  };
  // hazards, spread along the lap but never right by the start line
  const placed = [], obstacles = [], puddles = [], boosts = [];
  const spot = (minGap, offMax) => {
    for (let tries = 0; tries < 60; tries++) {
      const s = 140 + rand() * (L - 280), o = (rand() * 2 - 1) * offMax, p = at(s), x = p.x + p.nx * o, y = p.y + p.ny * o;
      if (placed.every(q => Math.hypot(q[0] - x, q[1] - y) > minGap)) { placed.push([x, y]); return { x, y, s, o, p }; }
    }
    return null;
  };
  for (let i = 0; i < def.boosts; i++) { const q = spot(50, half * .3); if (q) boosts.push({ x: q.x, y: q.y, ang: Math.atan2(q.p.ty, q.p.tx) }); }
  for (let i = 0; i < def.puddles; i++) { const q = spot(40, half * .55); if (q) puddles.push({ x: q.x, y: q.y, rx: 14 + rand() * 10, ry: 9 + rand() * 6 }); }
  for (let i = 0; i < def.obstacles; i++) { const q = spot(36, half * .7); if (q) { const kind = def.kinds[Math.floor(rand() * def.kinds.length)], f = OBJ(kind); obstacles.push({ x: q.x, y: q.y, kind, r: Math.max(6, Math.min(10, f.w / 2 - 1)) }); } }
  if (def.hedges) for (let s = 90; s < L - 60; s += 70 + rand() * 50) { const p = at(s), side = rand() < .5 ? -1 : 1, x = p.x + p.nx * side * (half - 4), y = p.y + p.ny * side * (half - 4); if (placed.every(q => Math.hypot(q[0] - x, q[1] - y) > 24)) { placed.push([x, y]); obstacles.push({ x, y, kind: 'bush_round', r: 8 }); } }
  // scenery off the track: trees you can bump into, grass and flowers you can't
  const W = Math.round(def.w * T16 * sc), H = Math.round(def.h * T16 * sc), scenery = [], trees = [];
  for (let k = 0; k < 900 && trees.length < 34; k++) {
    const x = 20 + rand() * (W - 40), y = 30 + rand() * (H - 40), n = nearest(x, y);
    if (n.d > half + 34 && trees.every(t => Math.hypot(t.x - x, t.y - y) > 40)) trees.push({ x, y, kind: rand() < .5 ? 'tree_oak' : 'tree_pine', r: 9 });
  }
  for (let k = 0; k < 160; k++) { const x = rand() * W, y = rand() * H; if (nearest(x, y).d > half + 8) scenery.push({ x, y, kind: rand() < .6 ? 'tall_grass' : 'wildflowers' }); }

  return { def, key, line, cum, L, half, at, nearest, obstacles: obstacles.concat(trees), puddles, boosts, scenery, W, H };
}

function drawTrackBG(tr) {
  const c = document.createElement('canvas'); c.width = tr.W; c.height = tr.H; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  const ter = DERBY_IMG.terrain, tile = (sx, sy) => { const t = document.createElement('canvas'); t.width = t.height = 16; t.getContext('2d').drawImage(ter, sx * 16, sy * 16, 16, 16, 0, 0, 16, 16); return g.createPattern(t, 'repeat'); };
  const tex = im => g.createPattern(im, 'repeat');
  // ground
  if (tr.def.ground === 'moss') { g.fillStyle = tex(DERBY_IMG.moss); g.fillRect(0, 0, tr.W, tr.H); }
  else for (let y = 0; y < tr.H; y += 16) for (let x = 0; x < tr.W; x += 16) { const h = hash(x, y); g.drawImage(ter, (h < .6 ? 0 : h < .8 ? 1 : 2) * 16, FILL_ROW * 16, 16, 16, x, y, 16, 16); }
  const path = () => { g.beginPath(); tr.line.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); };
  g.lineJoin = g.lineCap = 'round';
  path(); g.strokeStyle = 'rgba(52,36,20,.55)'; g.lineWidth = tr.half * 2 + 4; g.stroke();
  path(); g.strokeStyle = tr.def.surface === 'mud' ? tex(DERBY_IMG.peat) : tile(3, FILL_ROW); g.lineWidth = tr.half * 2; g.stroke();
  // kerbs: little white posts along both edges
  for (let s = 0; s < tr.L; s += 22) { const p = tr.at(s); for (const sd of [-1, 1]) { g.fillStyle = (Math.floor(s / 22) % 2) ? '#f4ead2' : '#c0402a'; g.fillRect(Math.round(p.x + p.nx * sd * (tr.half + 2)) - 1, Math.round(p.y + p.ny * sd * (tr.half + 2)) - 1, 3, 3); } }
  // puddles
  for (const q of tr.puddles) { g.save(); g.beginPath(); g.ellipse(q.x, q.y, q.rx + 1.5, q.ry + 1.5, 0, 0, 7); g.fillStyle = 'rgba(30,40,30,.5)'; g.fill(); g.beginPath(); g.ellipse(q.x, q.y, q.rx, q.ry, 0, 0, 7); g.fillStyle = DERBY_IMG.bogwater ? tex(DERBY_IMG.bogwater) : '#3a7a8a'; g.fill(); g.fillStyle = 'rgba(160,220,255,.25)'; g.fillRect(q.x - q.rx / 2, q.y - q.ry / 2, q.rx / 2, 2); g.restore(); }
  // start line
  const p0 = tr.at(0); g.save(); g.translate(p0.x, p0.y); g.rotate(Math.atan2(p0.ty, p0.tx));
  for (let i = -Math.ceil(tr.half / 4); i < Math.ceil(tr.half / 4); i++) for (let j = 0; j < 2; j++) { g.fillStyle = (i + j) % 2 ? '#f4ead2' : '#2a1e1a'; g.fillRect(-4 + j * 4, i * 4, 4, 4); }
  g.restore();
  // flat scenery
  const ob = DERBY_IMG.objects;
  for (const s of tr.scenery) { const f = OBJ(s.kind); g.drawImage(ob, f.x, f.y, f.w, f.h, Math.round(s.x - f.w / 2), Math.round(s.y - f.h), f.w, f.h); }
  return c;
}

function racerFrom(m, st, track, i, who, sk) {
  const p = track.at(-24 - Math.floor(i / 2) * 22), side = i % 2 ? 1 : -1;
  const img = DERBY_IMG['mon_' + walkSp(m.sp)], fw = img.width / 4;
  return {
    who, m, sp: m.sp, img, fw, fh: img.height / 4, st, sk, you: who === 'You',
    x: p.x + p.nx * side * track.half * .45, y: p.y + p.ny * side * track.half * .45, vx: 0, vy: 0, dir: 'up',
    vmax: 50 + 2.2 * st.spd, stam: 100, dash: 0, boost: 0, stun: 0, anim: 0,
    prog: -24 - Math.floor(i / 2) * 22, ni: null, lap: 0, lapStart: 0, laps: [], done: 0, lane: 0, laneT: 0,
    types: typesOf(m.sp),
  };
}

function derbyRace(cup, mine, rivals, raceNo) {
  return new Promise(async resolve => {
    const d = derby(), seed = (cup.id.charCodeAt(0) * 977 + raceNo * 131 + d.races * 7) | 0;
    const field = rivals.map(r => ({ r, m: { sp: r.sp, lv: r.lv, iv: { hp: 5, atk: 5, def: 5, spd: r.iv }, held: r.held } }));
    await derbyImages([mine.sp, ...field.map(f => f.m.sp)]);
    const tr = buildTrack(cup.track, seed), bg = drawTrackBG(tr);
    const order = [{ m: mine, who: 'You', sk: 1 }, ...field.map(f => ({ m: f.m, who: f.r.who, sk: f.r.sk }))];
    // you start at the back on the first race, further up after
    const grid = raceNo === 0 ? [3, 0, 1, 2] : [2, 0, 1, 3];
    const R = order.map((o, i) => racerFrom(o.m, raceStats(o.m, cup.cap), tr, grid[i], o.who, o.sk));
    const me = R[0]; window._derbyR = R;

    // ---- the overlay
    const el = document.createElement('div'); el.id = 'derby';
    el.style.cssText = 'position:fixed;inset:0;z-index:40;background:#1f2a1e;touch-action:none;user-select:none;-webkit-user-select:none';
    el.innerHTML = `<canvas id="dcv" style="position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated"></canvas>
      <div class="panel" style="position:absolute;left:10px;top:max(10px,env(safe-area-inset-top));padding:6px 10px;font-weight:700;line-height:1.25;pointer-events:none"><div id="dlap">Lap 1/${DERBY_LAPS}</div><div id="dpos" style="font-size:22px">-</div><div id="dtime" style="font-size:13px;opacity:.8">0:00.00</div></div>
      <canvas id="dmini" width="120" height="90" class="panel" style="position:absolute;right:10px;top:max(10px,env(safe-area-inset-top));width:120px;height:90px;padding:0;pointer-events:none"></canvas>
      <button class="btn sm" id="dquit" style="position:absolute;right:10px;top:calc(max(10px,env(safe-area-inset-top)) + 100px)">✕ Leave</button>
      <div id="dstickz" style="position:absolute;left:0;bottom:0;width:55%;height:55%"></div>
      <div id="dstick" style="position:absolute;width:120px;height:120px;border-radius:50%;background:rgba(251,243,217,.18);border:3px solid rgba(251,243,217,.5);left:24px;bottom:calc(24px + env(safe-area-inset-bottom));pointer-events:none"><div id="dknob" style="position:absolute;left:35px;top:35px;width:50px;height:50px;border-radius:50%;background:rgba(251,243,217,.8);border:3px solid #5e3b20"></div></div>
      <button id="ddash" class="btn gold" style="position:absolute;right:24px;bottom:calc(30px + env(safe-area-inset-bottom));width:96px;height:96px;border-radius:50%;font-size:18px;padding:0">Dash<div style="position:absolute;left:12px;right:12px;bottom:14px;height:8px;background:#5e3b20;border-radius:4px;overflow:hidden"><i id="dstam" style="display:block;height:100%;width:100%;background:#7ec85a"></i></div></button>
      <div id="dbig" style="position:absolute;left:0;right:0;top:32%;text-align:center;font-size:64px;font-weight:900;color:#fbf3d9;text-shadow:0 4px 0 #2a1e1a,0 0 12px #000;pointer-events:none"></div>`;
    document.body.appendChild(el);
    const cv = el.querySelector('#dcv'), g = cv.getContext('2d'), mini = el.querySelector('#dmini').getContext('2d');
    const $d = id => el.querySelector('#' + id);
    let vw = 0, vh = 0, dpr = 1, zoom = 2;
    const fit = () => { dpr = Math.min(2, devicePixelRatio || 1); vw = innerWidth; vh = innerHeight; cv.width = Math.round(vw * dpr); cv.height = Math.round(vh * dpr); zoom = Math.max(1.6, Math.min(3, Math.min(vw, vh) / 205)); };
    fit(); addEventListener('resize', fit);
    const prevTheme = Sound.currentTheme; Sound.theme('battle');

    // ---- controls
    const inp = { x: 0, y: 0, dash: false }, keys = {};
    let stickId = null, sx0 = 0, sy0 = 0;
    const stick = $d('dstick'), knob = $d('dknob');
    $d('dstickz').addEventListener('pointerdown', e => { stickId = e.pointerId; sx0 = e.clientX; sy0 = e.clientY; stick.style.left = (sx0 - 60) + 'px'; stick.style.bottom = 'auto'; stick.style.top = (sy0 - 60) + 'px'; e.preventDefault(); });
    const move = e => { if (e.pointerId !== stickId) return; let dx = e.clientX - sx0, dy = e.clientY - sy0; const l = Math.hypot(dx, dy), mx = 48; if (l > mx) { dx *= mx / l; dy *= mx / l; } inp.x = dx / mx; inp.y = dy / mx; knob.style.left = (35 + dx) + 'px'; knob.style.top = (35 + dy) + 'px'; };
    const up = e => { if (e.pointerId !== stickId) return; stickId = null; inp.x = inp.y = 0; knob.style.left = knob.style.top = '35px'; };
    addEventListener('pointermove', move); addEventListener('pointerup', up); addEventListener('pointercancel', up);
    $d('ddash').addEventListener('pointerdown', e => { e.preventDefault(); inp.dash = true; });
    const kd = e => { keys[e.key.toLowerCase()] = 1; if (e.key === ' ' || e.key === 'Shift') inp.dash = true; if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) e.preventDefault(); };
    const ku = e => { keys[e.key.toLowerCase()] = 0; };
    addEventListener('keydown', kd, true); addEventListener('keyup', ku, true);
    let quit = false; $d('dquit').addEventListener('click', () => { quit = true; });

    // ---- the simulation
    const T0 = performance.now(); let tPrev = T0, clock = -3.2, finished = [], bestLap = 0, over = false, overT = 0, lastCount = 4;
    const grip = r => tr.def.grip.some(t => r.types.includes(t));
    const tide = r => r.types.includes('Tide');
    const inPuddle = r => tr.puddles.some(q => ((r.x - q.x) / q.rx) ** 2 + ((r.y - q.y) / q.ry) ** 2 < 1);
    function surface(r) {
      const n = tr.nearest(r.x, r.y, r.ni); r.ni = n.i;
      let k = n.d <= tr.half ? 1 : n.d <= tr.half + 6 ? .85 : (grip(r) ? .8 : .58);
      if (tr.def.surface === 'mud' && n.d <= tr.half && !tide(r)) k *= tr.def.mudSlow || .9;
      if (tr.def.ground === 'moss' && n.d > tr.half && tide(r)) k = Math.max(k, .72);
      if (inPuddle(r)) k = tide(r) ? Math.max(k, 1.04) : k * .5;
      return { k, n };
    }
    function aiInput(r, dt = 1 / 60) {
      const look = 34 + r.vmax * .35, s = (r.prog % tr.L + tr.L) % tr.L;
      r.laneT -= dt;
      if (r.laneT <= 0) {   // pick the clearest lane a little way ahead
        r.laneT = .25 + Math.random() * .2;
        const lanes = [-.4, -.2, 0, .2, .4], ahead = [.4, .8, 1.2, 1.7].map(a => tr.at(s + look * a));
        let best = r.lane, bs = -1e9;
        for (const ln of lanes) {
          let sc = -Math.abs(ln - r.lane) * 8 - Math.abs(ln) * 6;
          for (const p of ahead) { const x = p.x + p.nx * ln * tr.half * 1.6, y = p.y + p.ny * ln * tr.half * 1.6; for (const o of tr.obstacles) { const dd = Math.hypot(o.x - x, o.y - y); if (dd < o.r + 14) sc -= 60 - dd; } if (!tide(r)) for (const q of tr.puddles) if (((x - q.x) / (q.rx + 6)) ** 2 + ((y - q.y) / (q.ry + 6)) ** 2 < 1) sc -= 30; for (const b of tr.boosts) if (Math.hypot(b.x - x, b.y - y) < 14) sc += 20; }
          if (sc > bs) { bs = sc; best = ln; }
        }
        r.lane = best;
      }
      const p = tr.at(s + look * .6), tx = p.x + p.nx * r.lane * tr.half * 1.6, ty = p.y + p.ny * r.lane * tr.half * 1.6;
      let dx = tx - r.x, dy = ty - r.y; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
      let sx = 0, sy = 0; const fwd = tr.at(s + 12), fx = fwd.tx, fy = fwd.ty;
      for (const o of tr.obstacles) {   // swerve round anything right in front
        const ox = o.x - r.x, oy = o.y - r.y, od = Math.hypot(ox, oy), reach = o.r + 26;
        if (od > reach || od < .01 || ox * dx + oy * dy < 0) continue;
        const cross = dx * oy - dy * ox, away = cross > 0 ? -1 : 1, w = (reach - od) / reach * 1.8 * Math.min(1, r.sk + .1);
        sx += -dy * away * w; sy += dx * away * w;
      }
      dx += sx; dy += sy;
      { const l2 = Math.hypot(dx, dy) || 1; dx /= l2; dy /= l2; }
      if (dx * fx + dy * fy < .35) { dx = dx * .5 + fx * .5; dy = dy * .5 + fy * .5; const l3 = Math.hypot(dx, dy) || 1; dx /= l3; dy /= l3; }   // never swerve backwards
      const wob = Math.max(0, 1 - r.sk) * 1.4; dx += (Math.random() - .5) * wob; dy += (Math.random() - .5) * wob;
      const curve = Math.abs(tr.at(s + look).tx * tr.at(s).ty - tr.at(s + look).ty * tr.at(s).tx);
      const dashNow = r.stam > 70 && curve < .2 && Math.random() < .02 * r.sk;
      r.chk = (r.chk || 0) + dt;
      if (r.chk > .8) { if (r.prog - (r.lastProg ?? -1e9) < r.vmax * .15) { r.unstick = .45; r.lane = [-.45, 0, .45].filter(l => l !== r.lane)[Math.floor(Math.random() * 2)]; r.laneT = 1.2; } r.lastProg = r.prog; r.chk = 0; }
      if (r.unstick > 0) {   // back off whatever it ran into, then try another lane
        r.unstick -= dt; r.unsticks = (r.unsticks || 0) + dt; const o = tr.obstacles.reduce((b, q) => Math.hypot(q.x - r.x, q.y - r.y) < Math.hypot(b.x - r.x, b.y - r.y) ? q : b, tr.obstacles[0]);
        const ax = r.x - o.x, ay = r.y - o.y, al = Math.hypot(ax, ay) || 1, c = tr.at(s + 20);
        return { x: ax / al * .7 + (c.x - r.x) / (Math.hypot(c.x - r.x, c.y - r.y) || 1) * .5, y: ay / al * .7 + (c.y - r.y) / (Math.hypot(c.x - r.x, c.y - r.y) || 1) * .5, dash: false, throttle: .8 };
      }
      return { x: dx, y: dy, dash: dashNow, throttle: Math.min(1.04, .82 + r.sk * .18) };
    }
    function step(dt) {
      clock += dt;
      const running = clock >= 0 && !over;
      for (const r of R) {
        let u = { x: 0, y: 0, dash: false, throttle: 1 };
        if (r.you && window.DERBY_AUTOPILOT && running) u = aiInput(r, dt);   // for testing
        else if (r.you) { let kx = (keys.arrowright || keys.d ? 1 : 0) - (keys.arrowleft || keys.a ? 1 : 0), ky = (keys.arrowdown || keys.s ? 1 : 0) - (keys.arrowup || keys.w ? 1 : 0); if (kx || ky) { const l = Math.hypot(kx, ky); u.x = kx / l; u.y = ky / l; } else { u.x = inp.x; u.y = inp.y; } u.dash = inp.dash; inp.dash = false; }
        else if (running && !r.done) u = aiInput(r, dt);
        if (r.done) { u = aiInput(r, dt); u.throttle = .45; u.dash = false; }
        if (!running && !r.done) { u.x = u.y = 0; u.dash = false; }
        const { k, n } = surface(r);
        if (u.dash && r.stam >= 35 && r.dash <= 0 && running) { r.stam -= 35; r.dash = .7; if (r.you) Sound.play('swish'); }
        r.stam = Math.min(100, r.stam + dt * (6 + r.st.hp / 12));
        let mult = k * (r.dash > 0 ? 1.35 + Math.min(.25, r.st.atk / 500) : 1) * (r.boost > 0 ? 1.45 : 1) * (u.throttle || 1);
        if (r.stun > 0) { r.stun -= dt; mult *= .35; }
        r.dash -= dt; r.boost -= dt;
        const ax = u.x * r.vmax * mult, ay = u.y * r.vmax * mult, resp = Math.min(1, dt * (2.2 + r.st.spd / 60));
        r.vx += (ax - r.vx) * resp; r.vy += (ay - r.vy) * resp;
        r.x += r.vx * dt; r.y += r.vy * dt;
        r.x = Math.max(8, Math.min(tr.W - 8, r.x)); r.y = Math.max(12, Math.min(tr.H - 4, r.y));
        // bumps
        for (const o of tr.obstacles) { const dx = r.x - o.x, dy = r.y - o.y, dd = Math.hypot(dx, dy), mn = o.r + 6; if (dd < mn && dd > .01) { r.x = o.x + dx / dd * mn; r.y = o.y + dy / dd * mn; const vn = (r.vx * dx + r.vy * dy) / dd; if (vn < 0) { r.vx -= 1.4 * vn * dx / dd; r.vy -= 1.4 * vn * dy / dd; const hit = Math.min(1, -vn / 80); if (hit > .25 && r.stun <= 0) { r.stun = hit * .7 * 70 / (r.st.def + 50); if (r.you) Sound.play('thud'); } } } }
        for (const b of tr.boosts) if (Math.hypot(b.x - r.x, b.y - r.y) < 12 && r.boost < .6) { r.boost = 1; if (r.you) Sound.play('pop'); }
        // progress along the lap
        const nn = tr.nearest(r.x, r.y, r.ni); r.ni = nn.i;
        let ds = nn.s - ((r.prog % tr.L) + tr.L) % tr.L; if (ds > tr.L / 2) ds -= tr.L; if (ds < -tr.L / 2) ds += tr.L;
        r.prog += ds;
        if (running && !r.done) {
          const lap = Math.floor(r.prog / tr.L);
          if (lap > r.lap && lap >= 1) { const t = clock * 1000; r.laps.push(t - r.lapStart); r.lapStart = t; r.lap = lap; if (r.you && lap < DERBY_LAPS) { $d('dbig').textContent = lap === DERBY_LAPS - 1 ? 'Final lap!' : `Lap ${lap + 1}`; Sound.play('pop'); setTimeout(() => { if ($d('dbig')) $d('dbig').textContent = ''; }, 1100); } }
          if (r.prog >= tr.L * DERBY_LAPS) { r.done = clock * 1000; finished.push(r); if (r.you) { over = true; overT = 0; $d('dbig').textContent = PLACE[finished.length - 1] + '!'; Sound.play(finished.length === 1 ? 'levelup' : 'pop'); } }
        }
        const sp = Math.hypot(r.vx, r.vy); r.anim += dt * sp / 9;
        if (sp > 8) r.dir = Math.abs(r.vx) > Math.abs(r.vy) ? (r.vx > 0 ? 'right' : 'left') : (r.vy > 0 ? 'down' : 'up');
      }
      // racers nudge each other; the heavier Defence pushes harder
      for (let i = 0; i < R.length; i++) for (let j = i + 1; j < R.length; j++) {
        const a = R[i], b = R[j], dx = b.x - a.x, dy = b.y - a.y, dd = Math.hypot(dx, dy); if (dd > 12 || dd < .01) continue;
        const push = (12 - dd) / 2, wa = b.st.def / (a.st.def + b.st.def);
        a.x -= dx / dd * push * 2 * wa; a.y -= dy / dd * push * 2 * wa; b.x += dx / dd * push * 2 * (1 - wa); b.y += dy / dd * push * 2 * (1 - wa);
      }
      if (over) overT += dt;
    }

    function draw() {
      const W = cv.width, H = cv.height, z = zoom * dpr;
      g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#1f2a1e'; g.fillRect(0, 0, W, H); g.imageSmoothingEnabled = false;
      const cx = Math.max(W / z / 2, Math.min(tr.W - W / z / 2, me.x)), cy = Math.max(H / z / 2, Math.min(tr.H - H / z / 2, me.y));
      g.setTransform(z, 0, 0, z, Math.round(W / 2 - cx * z), Math.round(H / 2 - cy * z));
      g.drawImage(bg, 0, 0);
      const t = performance.now() / 1000;
      for (const b of tr.boosts) { g.save(); g.translate(b.x, b.y); g.rotate(b.ang); for (let k = 0; k < 3; k++) { g.fillStyle = `rgba(255,${200 + 40 * Math.sin(t * 6 - k)},60,${.65 + .35 * Math.sin(t * 6 - k)})`; g.beginPath(); g.moveTo(-8 + k * 5, -6); g.lineTo(-3 + k * 5, 0); g.lineTo(-8 + k * 5, 6); g.lineTo(-6 + k * 5, 6); g.lineTo(-1 + k * 5, 0); g.lineTo(-6 + k * 5, -6); g.fill(); } g.restore(); }
      const ob = DERBY_IMG.objects, things = [...tr.obstacles.map(o => ({ y: o.y, o })), ...R.map(r => ({ y: r.y, r }))].sort((a, b) => a.y - b.y);
      for (const q of things) {
        if (q.o) { const f = OBJ(q.o.kind); g.drawImage(ob, f.x, f.y, f.w, f.h, Math.round(q.o.x - f.w / 2), Math.round(q.o.y + 4 - f.h), f.w, f.h); continue; }
        const r = q.r, row = DIRS.indexOf(r.dir), moving = Math.hypot(r.vx, r.vy) > 8, col = moving ? [1, 0, 3, 0][Math.floor(r.anim) % 4] : 0;
        g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(r.x, r.y + 1, r.fw * .28, 3, 0, 0, 7); g.fill();
        if (r.dash > 0 || r.boost > 0) { g.fillStyle = r.boost > 0 ? 'rgba(255,210,80,.5)' : 'rgba(255,255,255,.45)'; for (let k = 1; k <= 3; k++) g.fillRect(Math.round(r.x - r.vx * .02 * k) - 1, Math.round(r.y - r.vy * .02 * k) - 2, 2, 2); }
        if (r.stun > 0 && Math.floor(t * 20) % 2) g.globalAlpha = .5;
        g.drawImage(r.img, col * r.fw, row * r.fh, r.fw, r.fh, Math.round(r.x - r.fw / 2), Math.round(r.y + 2 - r.fh), r.fw, r.fh);
        g.globalAlpha = 1;
        // name tags
        g.font = 'bold 6px system-ui, sans-serif'; g.textAlign = 'center';
        const label = r.you ? '▼' : r.who, ly = Math.round(r.y - r.fh - 1);
        g.fillStyle = '#2a1e1a'; g.fillText(label, r.x + .5, ly + .5); g.fillStyle = r.you ? '#ffe35a' : '#fbf3d9'; g.fillText(label, r.x, ly);
      }
      // minimap
      mini.setTransform(1, 0, 0, 1, 0, 0); mini.clearRect(0, 0, 120, 90); const ms = Math.min(110 / tr.W, 80 / tr.H), ox = (120 - tr.W * ms) / 2, oy = (90 - tr.H * ms) / 2;
      mini.strokeStyle = '#a8865a'; mini.lineWidth = 4; mini.lineJoin = 'round'; mini.beginPath(); tr.line.forEach(([x, y], i) => i ? mini.lineTo(ox + x * ms, oy + y * ms) : mini.moveTo(ox + x * ms, oy + y * ms)); mini.closePath(); mini.stroke();
      for (const r of R) { mini.fillStyle = r.you ? '#ffe35a' : '#d0405a'; mini.beginPath(); mini.arc(ox + r.x * ms, oy + r.y * ms, r.you ? 3.5 : 2.5, 0, 7); mini.fill(); }
    }
    const rank = () => [...finished, ...R.filter(r => !r.done).sort((a, b) => b.prog - a.prog)];
    function hud() {
      $d('dlap').textContent = `Lap ${Math.min(DERBY_LAPS, Math.max(1, me.lap + 1))}/${DERBY_LAPS}`;
      $d('dpos').textContent = `${PLACE[rank().indexOf(me)]} of ${R.length}`;
      $d('dtime').textContent = fmtLap(Math.max(0, clock * 1000));
      $d('dstam').style.width = me.stam + '%'; $d('dstam').style.background = me.stam >= 35 ? '#7ec85a' : '#c0602a';
      if (clock < 0) { const c = Math.ceil(-clock); if (c !== lastCount && c <= 3) { lastCount = c; $d('dbig').textContent = c; Sound.play('click'); } }
      else if (lastCount > 0) { lastCount = 0; $d('dbig').textContent = 'GO!'; Sound.play('levelup'); setTimeout(() => { if ($d('dbig') && $d('dbig').textContent === 'GO!') $d('dbig').textContent = ''; }, 800); }
    }
    function end(result) {
      removeEventListener('pointermove', move); removeEventListener('pointerup', up); removeEventListener('pointercancel', up);
      removeEventListener('keydown', kd, true); removeEventListener('keyup', ku, true); removeEventListener('resize', fit);
      el.remove(); Sound.theme(prevTheme || 'field'); if (scene) scene.paused = false;
      S.time = Math.min(S.time + 20, 25 * 60); updateHUD();
      resolve(result);
    }
    function results() {
      // anyone still running gets a finishing time from how far they had left to go
      const now = clock * 1000;
      for (const r of R.filter(q => !q.done).sort((a, b) => b.prog - a.prog)) { const left = tr.L * DERBY_LAPS - r.prog, v = Math.max(20, r.vmax * .8); r.done = now + left / v * 1000; finished.push(r); }
      finished.sort((a, b) => a.done - b.done);
      const times = {}, sp = {}; for (const r of R) { times[r.who] = r.done; sp[r.who] = r.sp; }
      bestLap = me.laps.length ? Math.min(...me.laps) : 0;
      let record = false;
      if (bestLap) { const b = d.best[tr.key]; if (!b || bestLap < b.ms) { d.best[tr.key] = { ms: Math.round(bestLap), who: monName(mine) }; record = true; } }
      return { order: finished.map(r => r.who), times, sp, bestLap, record };
    }
    function frame(now) {
      if (!document.body.contains(el)) return;
      let dt = Math.min(.05, (now - tPrev) / 1000) * (window.DERBY_FAST || 1); tPrev = now;   // DERBY_FAST: test speed-up
      if (scene) scene.paused = true;
      if (quit) return end(null);
      // fixed small steps keep collisions steady on slow phones
      while (dt > 0) { const h = Math.min(1 / 60, dt); step(h); dt -= h; }
      draw(); hud();
      if (over && overT > 1.6) return end(results());
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });
}
