/* ============================================================ The Hearthroot
   The tree grows with the life of the town: repairs, friendships, Fablemon
   caught, goods shipped and tasks done. Each stage unlocks new things to make. */
const LIFE_AT = [0, 25, 90, 170, 280];
const HEARTH_NAMES = ['Dormant', 'Budding', 'In leaf', 'Full bloom', 'Lantern-lit'];
function lifeParts() {
  const tw = S.town;
  return [
    ['🏠', 'Buildings restored', Object.keys(tw.done).filter(k => PROJECTS[k]).length, 5],
    ['♥', 'Friendship hearts', Object.values(tw.hearts || {}).reduce((a, b) => a + b, 0), 1],
    ['📖', 'Fablemon caught', Object.keys(S.caught || {}).length, 3],
    ['📦', 'Different goods shipped', Object.keys(S.shippedKinds || {}).length, 3],
    ['📜', 'Tasks completed', Object.keys(S.quests || {}).length, 2],
  ];
}
const hearthLife = () => lifeParts().reduce((a, [, , n, w]) => a + n * w, 0);
const buildingsDone = () => Object.keys(S.town.done).filter(k => PROJECTS[k] && k !== 'fountain').length;
const smallrootDone = () => Object.keys(S.town.done).filter(k => PROJECTS[k]).length;
const otherCrests = () => Object.keys(S.crests || {}).filter(k => k !== 'hearth').length;
// Rowan is the eighth and last Warden: he needs the other 7 Crests and every Smallroot repair
const rowanReady = () => otherCrests() >= 7 && smallrootDone() >= Object.keys(PROJECTS).length;

/* ---------- new things to make, unlocked by stage (stage index: 1 = stage 2) */
Object.assign(ITEMS, {
  quality_sprinkler: { name: 'Quality Sprinkler', stack: 99, place: 'obj', obj: 'sprinkler2', base: 'sprinkler', lv: 1, desc: 'Waters every soil tile within 2 tiles of it each morning: a 5×5 square.' },
  golden_sprinkler: { name: 'Golden Sprinkler', stack: 99, place: 'obj', obj: 'sprinkler3', base: 'sprinkler', lv: 2, desc: 'Waters every soil tile within 3 tiles of it each morning: a 7×7 square.' },
  busy_beehive: { name: 'Busy Beehive', stack: 99, place: 'obj', obj: 'beehive2', base: 'beehive', lv: 1, desc: 'A bigger hive. Makes 2 honey every 2 days, or 3 with flowers nearby.' },
  quick_compost: { name: 'Quick Composter', stack: 99, place: 'obj', obj: 'compost2', base: 'compost', lv: 1, desc: 'Put in 10 fiber. Two days later it gives 4 Fertiliser.' },
  deluxe_trough: { name: 'Deluxe Trough', stack: 99, place: 'obj', obj: 'trough2', base: 'trough', lv: 1, desc: "Takes Fablemon Feed only. Fablemon who eat from it work 20% faster the next day, instead of 10%. 2 tiles wide." },
  big_chest: { name: 'Big Chest', stack: 99, place: 'obj', obj: 'chest2', base: 'chest', lv: 1, desc: 'Holds 36 stacks, twice as many as a chest.' },
  fishing_hut: { name: 'Fishing Hut', stack: 99, place: 'obj', obj: 'fishhut', water: 1, desc: 'Place it within 2 tiles of water. Catches a fish every morning, plus one more for each Tide Fablemon whose job area covers it. 2 tiles wide.' },
  birdbath: { name: 'Birdbath', stack: 99, place: 'obj', obj: 'birdbath', desc: 'A stone bowl for the birds. Decoration.' },
  sundial: { name: 'Sundial', stack: 99, place: 'obj', obj: 'sundial', desc: 'Tells the time, on sunny days. Decoration.' },
  bird_house: { name: 'Bird House', stack: 99, place: 'obj', obj: 'birdhouse', desc: 'A little home on a post. Decoration.' },
  stone_lantern: { name: 'Stone Lantern', stack: 99, place: 'obj', obj: 'stonelantern', desc: 'Glows softly at night. Decoration.' },
  garden_fountain: { name: 'Garden Fountain', stack: 99, place: 'obj', obj: 'gfountain', desc: 'A little splashing fountain. Counts as flowers for beehives. 2 tiles wide. Decoration.' },
  topiary: { name: 'Topiary', stack: 99, place: 'obj', obj: 'topiary', desc: 'A neatly clipped hedge ball. Decoration.' },
  hearth_lantern: { name: 'Hearth Lantern', stack: 99, place: 'obj', obj: 'hearthlantern', desc: 'A lantern lit from the Hearthroot. Glows warmly at night. Decoration.' },
  hearth_sapling: { name: 'Hearthroot Sapling', stack: 99, place: 'obj', obj: 'hearthsap', desc: 'A cutting from the great tree. It will never grow big, but it glows. Decoration.' },
  tonic: { name: 'Hearth Tonic', stack: 99, heal: 50, cure: 1, sell: 80, desc: "Willa's herbal tonic. Restores half a Fablemon's HP and cures poison, burns, sleep and paralysis." },
  premium_feed: { name: 'Premium Feed', stack: 999, sell: 15, desc: "Hattie's best mix. Only a Deluxe Trough takes it: Fablemon who eat it work 30% faster the next day." },
  trainers_breakfast: { name: "Trainer's Breakfast", stack: 99, eat: 60, sell: 250, xpBoost: 1, desc: "Barney's recipe. Restores 60 energy, and your Fablemon earn 50% more battle XP for the rest of the day." },
  fen_chowder: { name: 'Fen Chowder', stack: 99, eat: 320, sell: 950, desc: "Barney's recipe. A rich fish stew. Restores 320 energy." },
  hearth_roast: { name: 'Hearthroot Roast', stack: 99, eat: 450, sell: 1400, desc: "Barney's finest. Restores 450 energy." },
  minnow: { name: 'Minnow', stack: 999, sell: 30, desc: 'A tiny silver fish. Sells for 30g.' },
  brook_trout: { name: 'Brook Trout', stack: 999, sell: 90, desc: 'A speckled trout. Sells for 90g. Good for cooking.' },
  silver_perch: { name: 'Silver Perch', stack: 999, sell: 170, desc: 'A rare, shining perch. Sells for 170g.' },
  grilled_trout: { name: 'Grilled Trout', stack: 99, eat: 90, sell: 220, desc: 'Smoky and simple. Restores 90 energy.' },
  fish_pie: { name: 'Fish Pie', stack: 99, eat: 200, sell: 520, desc: 'Fish and potato under a golden crust. Restores 200 energy.' },
});
Object.assign(OBJ_ART, {
  sprinkler2: ['cv', 'sprinkler2'], sprinkler3: ['cv', 'sprinkler3'], beehive2: ['cv', 'beehive2'], compost2: ['cv', 'compost2'], trough2: ['cv', 'trough2', 2],
  chest2: ['cv', 'chest2'], fishhut: ['cv', 'fishhut', 2], birdbath: ['cv', 'birdbath'], sundial: ['cv', 'sundial'], birdhouse: ['cv', 'birdhouse'],
  stonelantern: ['cv', 'stonelantern'], gfountain: ['cv', 'gfountain', 2], topiary: ['cv', 'topiary'], hearthlantern: ['cv', 'hearthlantern'], hearthsap: ['cv', 'hearthsap'],
});
RECIPES.push(
  { out: 'quality_sprinkler', n: 1, need: { stone: 40, wood: 15, honey: 1 }, stage: 1 },
  { out: 'birdbath', n: 1, need: { stone: 15 }, stage: 1 },
  { out: 'sundial', n: 1, need: { stone: 12, wood: 4 }, stage: 1 },
  { out: 'fishing_hut', n: 1, need: { wood: 60, fiber: 30, stone: 10 }, stage: 2 },
  { out: 'busy_beehive', n: 1, need: { wood: 30, fiber: 30, honey: 3 }, stage: 2 },
  { out: 'quick_compost', n: 1, need: { wood: 30, stone: 10, fertiliser: 3 }, stage: 2 },
  { out: 'bird_house', n: 1, need: { wood: 10 }, stage: 2 },
  { out: 'stone_lantern', n: 1, need: { stone: 14 }, stage: 2 },
  { out: 'golden_sprinkler', n: 1, need: { stone: 80, wood: 30, honey: 3 }, stage: 3 },
  { out: 'deluxe_trough', n: 1, need: { wood: 50, stone: 20 }, stage: 3 },
  { out: 'big_chest', n: 1, need: { wood: 80, stone: 20 }, stage: 3 },
  { out: 'garden_fountain', n: 1, need: { stone: 50 }, stage: 3 },
  { out: 'topiary', n: 1, need: { fiber: 20, wood: 5 }, stage: 3 },
  { out: 'hearth_lantern', n: 1, need: { wood: 10, stone: 10, honey: 1 }, stage: 4 },
  { out: 'hearth_sapling', n: 1, need: { wood: 20, fiber: 20, fertiliser: 2 }, stage: 4 },
);
CRAFT_TABS[1][1].push('quality_sprinkler', 'golden_sprinkler', 'busy_beehive', 'quick_compost', 'deluxe_trough', 'big_chest', 'fishing_hut');
CRAFT_TABS[3][1].push('birdbath', 'sundial', 'bird_house', 'topiary', 'garden_fountain', 'hearth_sapling');
CRAFT_TABS[4][1].push('stone_lantern', 'hearth_lantern');
COOKING.push({ out: 'grilled_trout', need: { brook_trout: 1 } }, { out: 'fish_pie', need: { brook_trout: 1, minnow: 2, potato: 1 } },
  { out: 'trainers_breakfast', need: { potato: 1, honey: 1, berry: 2 }, tavern: 1, crest: 2 }, { out: 'fen_chowder', need: { brook_trout: 1, silver_perch: 1, potato: 2 }, tavern: 1, crest: 4 }, { out: 'hearth_roast', need: { pumpkin: 1, corn: 2, honey: 2 }, tavern: 1, crest: 6 });
const recipeLocked = r => (r.stage && hearthStage() < r.stage) || (r.crest && Object.keys(S.crests || {}).length < r.crest);
const GLOWS = ['lantern', 'stonelantern', 'hearthlantern', 'hearthsap'];

/* ---------- Training Ring: Fablemon living at the ranch train overnight (after your 2nd Crest) */
Object.assign(ITEMS, { training_ring: { name: 'Training Ring', stack: 99, place: 'obj', obj: 'ring', desc: 'A ring of posts and a straw dummy. Each night, every Fablemon living at your ranch (not on your team) gains about a tenth of a level. Only one ring counts. 2 tiles wide.' } });
OBJ_ART.ring = ['cv', 'ring', 2];
RECIPES.push({ out: 'training_ring', n: 1, need: { wood: 60, stone: 30, fiber: 20 }, crest: 2 });
CRAFT_TABS[1][1].push('training_ring');
function ringNight() {
  if (S.ranch !== 2 || !Object.values(S.objs || {}).some(o => o.t === 'ring')) return '';
  const benched = S.mons.filter(m => m.loc === 'ranch'); if (!benched.length) return '';
  let ups = 0;
  for (const m of benched) {
    m.xp += Math.max(1, Math.floor((xpNext(m) - m.lv ** 3) / 10));
    while (m.lv < 100 && m.xp >= xpNext(m)) {
      const oldMax = monStat(m, 'hp'); m.lv++; m.hp += monStat(m, 'hp') - oldMax; ups++;
      for (const [l, id] of LEARN[m.sp] || []) if (l === m.lv && !m.moves.includes(id) && m.moves.length < 4) m.moves.push(id);
      const to = evoOf(m); if (to) { m.sp = to; S.caught[to] = 1; S.seen[to] = 1; const sg = SIGNATURE[to]; if (sg && !m.moves.includes(sg[1])) { if (m.moves.length < 4) m.moves.push(sg[1]); else m.moves[m.moves.length - 1] = sg[1]; } }
    }
  }
  return `${benched.length} Fablemon trained at the ring${ups ? ` (${ups} level${ups > 1 ? 's' : ''} gained)` : ''}`;
}
/* ---------- object behaviour helpers */
const beeDays = o => o.lv ? 2 : 3;
const beeMake = (o, flowers) => (o.lv ? 2 : 1) + (flowers ? 1 : 0);
const compostDays = o => o.lv ? 2 : 3;
const compostOut = o => o.lv ? 4 : 3;
const fedMul = m => m.fedPremium === S.day ? .7 : m.fedDeluxe === S.day ? .8 : m.fedDay === S.day ? .9 : 1;
const nearWater = (x, y, w = 1) => { for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= w + 1; dx++) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < W && Y < H && farm.waterish[Y * W + X]) return true; } return false; };
const FISH_ROLL = () => { const r = Math.random(); return r < .6 ? 'minnow' : r < .9 ? 'brook_trout' : 'silver_perch'; };
function fishNight() {
  for (const [k, o] of Object.entries(S.objs || {})) {
    if (o.t !== 'fishhut') continue;
    const [x, y] = k.split(',').map(Number);
    const helpers = S.mons.filter(m => m.job && m.loc === 'ranch' && hasType(m.sp, 'Tide') && Math.abs(m.job.x - x) <= JOB_R + 1 && Math.abs(m.job.y - y) <= JOB_R).length;
    o.fish = o.fish || {};
    const total = Object.values(o.fish).reduce((a, b) => a + b, 0);
    for (let i = 0; i < 1 + helpers && total + i < 8; i++) { const f = FISH_ROLL(); o.fish[f] = (o.fish[f] || 0) + 1; }
  }
}
function collectFish(sc, o, x, y) {
  const got = [];
  for (const [id, n] of Object.entries(o.fish || {})) { if (!n) continue; const left = inv.add(id, n); if (n - left) got.push(`${n - left} ${ITEMS[id].name}`); o.fish[id] = left; }
  if (!got.length) return toast(Object.values(o.fish || {}).some(Boolean) ? 'Your backpack is full!' : 'The nets are empty. Come back tomorrow morning.', 2200);
  Sound.play('pop'); renderHotbar(); sc.floatText('+' + got.join(', '), x * T + 16, y * T); sc.drawObj(x, y);
}

/* ---------- the Hearthroot panel */
function hearthInfoHTML() {
  const st = hearthStage(), life = hearthLife(), next = LIFE_AT[st + 1];
  const rows = lifeParts().map(([ic, label, n, w]) => `<div class="shoprow"><span style="font-size:20px;width:28px;text-align:center">${ic}</span><div class="g"><b>${label}</b><small>${n} × ${w}</small></div><b>${n * w}</b></div>`).join('');
  const unl = s => RECIPES.filter(r => r.stage === s).map(r => ITEMS[r.out].name);
  const nextTxt = next === undefined ? '<p>The Hearthroot is fully grown.</p>' : `<p><b>Next: stage ${st + 2} (${HEARTH_NAMES[st + 1]})</b> at ${next} life. Unlocks: ${unl(st + 1).join(', ')}.</p>`;
  const pct = next === undefined ? 100 : Math.round(100 * (life - LIFE_AT[st]) / (next - LIFE_AT[st]));
  return `<p><b>Stage ${st + 1} of 5: ${HEARTH_NAMES[st]}</b> · ${life} life</p>
    <div style="height:12px;border:2px solid #5e3b20;border-radius:6px;background:#efe3c8;overflow:hidden;margin:4px 0 8px"><i style="display:block;height:100%;width:${pct}%;background:linear-gradient(#8fd06a,#4e9a3a)"></i></div>
    ${nextTxt}<p class="hint">The Hearthroot grows with the life of the town. Everything below adds to it:</p><div class="mlist">${rows}</div>`;
}

/* ---------- art for the new things (drawn in code, can be swapped for painted art later) */
function makeHearthArt() {
  const P = pixCanvas, C = SAP_CANVAS;
  const spr = (metal, cap) => P(14, 16, R => { R(5, 9, 4, 6, '#5e5e66'); R(3, 13, 8, 2, '#4a4a52'); R(2, 5, 10, 5, metal); R(3, 4, 8, 1, cap); R(6, 1, 2, 4, cap); R(1, 7, 1, 1, '#8fd3ea'); R(12, 7, 1, 1, '#8fd3ea'); R(6, 0, 2, 1, '#8fd3ea'); R(4, 6, 2, 2, '#ffffff88'); });
  C.sprinkler2 = spr('#b8bcc8', '#7a7e8a'); C.sprinkler3 = spr('#e8c050', '#b08a2a');
  C.beehive2 = P(18, 24, R => {
    R(3, 17, 2, 6, '#6b4426'); R(13, 17, 2, 6, '#6b4426'); R(1, 16, 16, 2, '#8f5f34');
    R(2, 2, 14, 3, '#7a5030'); for (let i = 0; i < 3; i++) { R(2, 5 + i * 4, 14, 3, i % 2 ? '#e8b84a' : '#d9a440'); R(2, 8 + i * 4, 14, 1, '#b07a2a'); }
    R(1, 1, 16, 2, '#5e3b20'); R(7, 14, 4, 2, '#3a2a1e'); R(13, 6, 2, 2, '#f2d26a'); R(4, 10, 1, 1, '#2a1e1a');
  });
  C.compost2 = P(16, 18, R => {
    R(1, 4, 14, 13, '#6a6e78'); for (const x of [1, 5, 9, 13]) R(x, 4, 2, 13, '#8a8e98'); R(1, 4, 14, 1, '#4a4e58'); R(1, 16, 14, 1, '#3a3e48');
    R(2, 1, 12, 4, '#4e3a22'); R(3, 0, 4, 2, '#5a8a3a'); R(9, 1, 3, 1, '#6bb24a'); R(1, 9, 14, 1, '#b08a2a');
  });
  C.trough2 = P(32, 15, R => {
    R(2, 10, 2, 5, '#4a4e58'); R(28, 10, 2, 5, '#4a4e58'); R(0, 2, 32, 9, '#8f5f34'); R(0, 2, 32, 2, '#d8a870'); R(2, 4, 28, 3, '#c8a46a');
    for (const [x, y] of [[5, 5], [11, 4], [17, 5], [23, 4], [8, 5], [26, 5]]) R(x, y, 2, 1, '#e8d070'); R(0, 7, 32, 1, '#6a6e78'); R(0, 10, 32, 1, '#6a6e78');
  });
  C.chest2 = P(20, 16, R => {
    R(1, 4, 18, 11, '#8f5f34'); R(1, 1, 18, 4, '#a8703c'); R(1, 4, 18, 1, '#5e3b20'); R(1, 9, 18, 1, '#6b4426');
    R(1, 1, 2, 14, '#6a6e78'); R(17, 1, 2, 14, '#6a6e78'); R(8, 3, 4, 4, '#e8c050'); R(9, 5, 2, 1, '#5e3b20'); R(3, 2, 14, 1, '#c99059');
  });
  C.fishhut = P(32, 30, R => {
    R(3, 24, 2, 6, '#5e3b20'); R(27, 24, 2, 6, '#5e3b20'); R(1, 22, 30, 3, '#a8703c'); R(1, 22, 30, 1, '#c99059');
    R(4, 10, 24, 12, '#8f5f34'); for (let x = 4; x < 28; x += 4) R(x, 10, 1, 12, '#6b4426');
    R(1, 4, 30, 7, '#4e7a9a'); R(3, 2, 26, 3, '#3a6080'); R(6, 0, 20, 3, '#5a8ab0'); R(1, 10, 30, 1, '#2a4a60');
    R(13, 14, 6, 8, '#3a2a1e'); R(6, 13, 5, 4, '#cfe8f0'); R(21, 13, 5, 4, '#cfe8f0');
    R(28, 12, 1, 10, '#c9b48a'); R(26, 16, 4, 1, '#c9b48a'); for (let y = 17; y < 21; y++) R(26 + (y & 1), y, 3, 1, '#d8ccb4');
  });
  C.birdbath = P(14, 18, R => { R(5, 8, 4, 8, '#a0a098'); R(3, 15, 8, 2, '#8a8a82'); R(1, 5, 12, 4, '#b4b4aa'); R(2, 5, 10, 1, '#5aa0d0'); R(1, 8, 12, 1, '#8a8a82'); R(9, 3, 2, 2, '#c0703a'); R(10, 2, 2, 1, '#c0703a'); });
  C.sundial = P(14, 16, R => { R(2, 8, 10, 7, '#a0a098'); R(1, 6, 12, 3, '#c4c4ba'); R(2, 6, 10, 1, '#e0e0d6'); R(6, 2, 2, 5, '#b08a2a'); R(7, 3, 3, 1, '#b08a2a'); R(3, 10, 8, 1, '#8a8a82'); });
  C.birdhouse = P(12, 24, R => { R(5, 10, 2, 13, '#6b4426'); R(2, 4, 8, 7, '#c99462'); R(1, 2, 10, 3, '#a8443a'); R(3, 0, 6, 2, '#c95a48'); R(5, 6, 2, 2, '#2a1e1a'); R(5, 9, 2, 1, '#8f5f34'); });
  C.stonelantern = P(14, 22, R => { R(3, 16, 8, 5, '#8a8a82'); R(5, 12, 4, 5, '#a0a098'); R(2, 6, 10, 6, '#a0a098'); R(4, 7, 6, 4, '#ffd27a'); R(1, 3, 12, 3, '#8a8a82'); R(4, 1, 6, 2, '#b4b4aa'); R(6, 0, 2, 1, '#b4b4aa'); });
  C.gfountain = P(30, 22, R => {
    R(1, 12, 28, 9, '#a0a098'); R(1, 12, 28, 2, '#c4c4ba'); R(3, 14, 24, 3, '#5aa0d0'); R(13, 4, 4, 10, '#b4b4aa'); R(10, 3, 10, 2, '#c4c4ba');
    R(14, 0, 2, 3, '#8fd3ea'); R(11, 5, 1, 4, '#8fd3ea'); R(18, 5, 1, 4, '#8fd3ea'); R(5, 15, 3, 1, '#cfeefa'); R(21, 15, 3, 1, '#cfeefa');
  });
  C.topiary = P(14, 22, R => { R(6, 15, 2, 4, '#6b4426'); R(3, 18, 8, 3, '#a8703c'); R(3, 18, 8, 1, '#c99059'); R(2, 3, 10, 12, '#3f8a4a'); R(1, 5, 12, 8, '#3f8a4a'); R(3, 4, 5, 4, '#5aa64a'); R(9, 10, 2, 2, '#2f6b3a'); });
  C.hearthlantern = P(12, 26, R => { R(5, 10, 2, 15, '#5e3b20'); R(3, 23, 6, 2, '#4a3020'); R(2, 3, 8, 8, '#8f5f34'); R(3, 4, 6, 6, '#ffb84a'); R(4, 5, 4, 4, '#fff0a0'); R(1, 1, 10, 2, '#4e9a3a'); R(4, 0, 4, 1, '#7cc24a'); });
  C.ring = P(32, 22, R => {
    for (const x of [1, 10, 20, 29]) { R(x, 8, 2, 13, '#6b4426'); R(x, 8, 2, 1, '#a8703c'); }
    R(1, 11, 30, 2, '#c9b48a'); R(1, 16, 30, 1, '#a89060');
    R(14, 2, 4, 5, '#e8c070'); R(13, 7, 6, 8, '#d8a850'); R(11, 9, 10, 2, '#d8a850'); R(15, 15, 2, 6, '#6b4426'); R(15, 4, 1, 1, '#2a1e1a'); R(17, 4, 1, 1, '#2a1e1a'); R(14, 9, 4, 1, '#c0304a');
  });
  C.hearthsap = P(18, 24, R => {
    R(8, 12, 3, 10, '#8f5f34'); R(5, 21, 9, 2, '#6b4426'); R(3, 2, 12, 11, '#4e9a3a'); R(1, 5, 16, 6, '#4e9a3a'); R(4, 3, 6, 4, '#6bb24a');
    for (const [x, y] of [[4, 8], [12, 5], [9, 10], [14, 9]]) { R(x, y, 2, 2, '#ffd27a'); }
  });
}
(function fishIcons() {
  const mk = draw => { const c = document.createElement('canvas'); c.width = c.height = 24; const g = c.getContext('2d'); draw(g); return c.toDataURL(); };
  const fish = (body, belly, spot) => mk(g => {
    g.fillStyle = '#2a1e1a'; g.fillRect(3, 9, 15, 8); g.fillRect(17, 7, 5, 12); g.fillRect(5, 7, 9, 2);
    g.fillStyle = body; g.fillRect(4, 10, 13, 6); g.fillRect(18, 8, 3, 10); g.fillRect(6, 8, 7, 2);
    g.fillStyle = belly; g.fillRect(5, 14, 11, 2); g.fillStyle = '#2a1e1a'; g.fillRect(6, 11, 2, 2);
    if (spot) { g.fillStyle = spot; for (const [x, y] of [[10, 11], [13, 12], [11, 13]]) g.fillRect(x, y, 1, 1); }
  });
  ICONS.tonic = mk(g => { g.fillStyle = '#2a1e1a'; g.fillRect(8, 3, 8, 4); g.fillRect(5, 7, 14, 15); g.fillStyle = '#c99462'; g.fillRect(9, 4, 6, 2); g.fillStyle = '#e8f0f0'; g.fillRect(6, 8, 12, 13); g.fillStyle = '#d0443a'; g.fillRect(6, 12, 12, 9); g.fillStyle = '#ffd27a'; g.fillRect(10, 14, 4, 4); g.fillStyle = '#ffffffaa'; g.fillRect(7, 9, 2, 3); });
  ICONS.premium_feed = mk(g => { g.fillStyle = '#2a1e1a'; g.fillRect(5, 5, 14, 17); g.fillStyle = '#e8d090'; g.fillRect(6, 6, 12, 15); g.fillStyle = '#b08a2a'; g.fillRect(6, 6, 12, 3); g.fillStyle = '#c0304a'; for (const [x, y] of [[8, 12], [13, 14], [10, 17], [14, 11]]) g.fillRect(x, y, 2, 2); g.fillStyle = '#ffd25a'; g.fillRect(9, 10, 6, 1); });
  const plateOf = draw => mk(g => { g.fillStyle = '#2a1e1a'; g.fillRect(1, 15, 22, 6); g.fillStyle = '#f3ead8'; g.fillRect(2, 16, 20, 4); draw(g); });
  ICONS.trainers_breakfast = plateOf(g => { g.fillStyle = '#2a1e1a'; g.fillRect(3, 9, 9, 7); g.fillRect(12, 8, 9, 8); g.fillStyle = '#fff8e8'; g.fillRect(4, 10, 7, 5); g.fillStyle = '#f2c14e'; g.fillRect(6, 11, 3, 3); g.fillStyle = '#c99462'; g.fillRect(13, 9, 7, 6); g.fillStyle = '#c0304a'; g.fillRect(15, 10, 2, 2); });
  ICONS.fen_chowder = mk(g => { g.fillStyle = '#2a1e1a'; g.fillRect(3, 10, 18, 10); g.fillRect(5, 20, 14, 2); g.fillStyle = '#e8e0d0'; g.fillRect(4, 11, 16, 8); g.fillStyle = '#e8d8a0'; g.fillRect(5, 11, 14, 3); g.fillStyle = '#a8b8c0'; g.fillRect(8, 11, 4, 2); g.fillStyle = '#4e9a3a'; g.fillRect(14, 11, 2, 1); g.fillStyle = '#ffffffaa'; g.fillRect(9, 5, 1, 4); g.fillRect(13, 4, 1, 4); });
  ICONS.hearth_roast = plateOf(g => { g.fillStyle = '#2a1e1a'; g.fillRect(4, 6, 16, 11); g.fillStyle = '#e88a2a'; g.fillRect(5, 7, 14, 9); g.fillStyle = '#f2c14e'; g.fillRect(6, 8, 4, 2); g.fillRect(14, 12, 3, 2); g.fillStyle = '#4e9a3a'; g.fillRect(11, 4, 2, 3); });
  ICONS.minnow = fish('#a8b8c0', '#e0eaee'); ICONS.brook_trout = fish('#8a9a5a', '#e8c0a0', '#c0304a'); ICONS.silver_perch = fish('#d8e0f0', '#ffffff', '#8aa0d0');
  ICONS.grilled_trout = mk(g => { g.fillStyle = '#2a1e1a'; g.fillRect(1, 15, 22, 6); g.fillStyle = '#f3ead8'; g.fillRect(2, 16, 20, 4); g.fillStyle = '#2a1e1a'; g.fillRect(4, 9, 16, 7); g.fillStyle = '#b07038'; g.fillRect(5, 10, 14, 5); g.fillStyle = '#5e3b20'; for (let x = 7; x < 18; x += 3) g.fillRect(x, 10, 1, 5); g.fillStyle = '#4e9a3a'; g.fillRect(17, 8, 3, 2); });
  ICONS.fish_pie = mk(g => { g.fillStyle = '#2a1e1a'; g.fillRect(1, 15, 22, 6); g.fillStyle = '#f3ead8'; g.fillRect(2, 16, 20, 4); g.fillStyle = '#2a1e1a'; g.fillRect(3, 8, 18, 9); g.fillStyle = '#e8b060'; g.fillRect(4, 9, 16, 7); g.fillStyle = '#c08040'; g.fillRect(6, 11, 4, 2); g.fillRect(13, 12, 4, 2); g.fillStyle = '#a8b8c0'; g.fillRect(10, 7, 4, 3); });
})();
