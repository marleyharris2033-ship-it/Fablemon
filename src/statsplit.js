/* ============================================================ Physical and Elemental stats
   Every Fablemon has two kinds of attack and defence:
     Attack / Defence                     used by physical moves (tackles, bites, claws, kicks, slams...)
     Elemental Attack / Elemental Defence used by elemental moves (beams, breath, bolts, waves, spells...)
   Every move has a category (MOVE_CAT: 'p' physical, 'e' elemental; moves not listed are physical).
   Each species' four stats are in SPLIT below: [Attack, Defence, Elemental Attack, Elemental Defence]. They were
   worked out from its old Attack and Defence, the kind of moves it learns, and its types (Stone is tough against
   physical hits, Glow and Spark against elemental ones), then can be tuned by hand here.
   Each of the five battle stats has its own stat stages: Harden raises only Defence, Geode Ward only Elemental
   Defence. Held charms (Fang, Ironbark) and food buffs help both kinds. Potential is rolled separately for all six stats.
   This file loads last, after every Fablemon and move is defined. It also holds the new Frost and Glow moves,
   second-type attacks for dual types that lacked them, catch-up XP and the move tutor in Brookholt. */

/* ---------- new moves */
Object.assign(MOVES, {
  // Frost
  hailstone: { name: 'Hailstone', type: 'Frost', pow: 75, acc: 100 },
  frostbreath: { name: 'Frost Breath', type: 'Frost', pow: 65, acc: 100, boost: ['foe', 'spd', -1, 30] },
  snowdrift: { name: 'Snowdrift', type: 'Frost', pow: 90, acc: 95 },
  blizzard: { name: 'Blizzard', type: 'Frost', pow: 110, acc: 85 },
  hoarfrost: { name: 'Hoarfrost', type: 'Frost', stats: [['self', 'def', 1], ['self', 'spd', 1]] },
  // Glow
  sunbeam: { name: 'Sunbeam', type: 'Glow', pow: 70, acc: 100 },
  shiningstrike: { name: 'Shining Strike', type: 'Glow', pow: 75, acc: 100 },
  haloburst: { name: 'Halo Burst', type: 'Glow', pow: 85, acc: 100, boost: ['foe', 'atk', -1, 20] },
  starfall: { name: 'Starfall', type: 'Glow', pow: 100, acc: 90 },
  gleamrest: { name: 'Gleam Rest', type: 'Glow', heal: .5 },
  // for the move tutor
  // elemental boosting moves, a counterpart to Harden, Fortify, Stoke the Fire, Overgrow and the rest
  bloomward: { name: 'Bloom Ward', type: 'Leaf', stat: ['self', 'edef', 1] },
  sungather: { name: 'Sun Gather', type: 'Leaf', stats: [['self', 'eatk', 1], ['self', 'edef', 1]] },
  kindle: { name: 'Kindle', type: 'Ember', stat: ['self', 'eatk', 2] },
  heathaze: { name: 'Heat Haze', type: 'Ember', stat: ['self', 'edef', 1] },
  moontide: { name: 'Moon Tide', type: 'Tide', stats: [['self', 'eatk', 1], ['self', 'spd', 1]] },
  mistveil: { name: 'Mist Veil', type: 'Tide', stat: ['self', 'edef', 1] },
  geodeward: { name: 'Geode Ward', type: 'Stone', stat: ['self', 'edef', 1] },
  crystalshell: { name: 'Crystal Shell', type: 'Stone', stat: ['self', 'edef', 2] },
  staticfocus: { name: 'Static Focus', type: 'Spark', stats: [['self', 'eatk', 1], ['self', 'spd', 1]] },
  nightfocus: { name: 'Night Focus', type: 'Shade', stats: [['self', 'eatk', 2], ['self', 'edef', -1]] },
  radiantaura: { name: 'Radiant Aura', type: 'Glow', stats: [['self', 'eatk', 1], ['self', 'edef', 1]] },
  prismward: { name: 'Prism Ward', type: 'Glow', stat: ['self', 'edef', 2] },
  windchant: { name: 'Wind Chant', type: 'Gale', stats: [['self', 'eatk', 1], ['self', 'spd', 1]] },
  icemirror: { name: 'Ice Mirror', type: 'Frost', stats: [['self', 'eatk', 1], ['self', 'edef', 1]] },
  heatwave: { name: 'Heatwave', type: 'Ember', pow: 85, acc: 95, st: ['brn', 10] },
  sandblast: { name: 'Sandblast', type: 'Stone', pow: 80, acc: 95 },
});
const MOVE_CAT = Object.fromEntries(('emberpuff weirwave gust staticbuzz nightdrop wildfire bogbubble mirejet wispshock smoulder boilspout soakup windslice galeforce eclipse ' +
  'sapsip rootdrain bloomburst haunt dreamsip mirebellow lilyhex dewslumber nectartrap stormlash scaldspout geodestorm glint lumenpulse prismbeam radiance lanterngrove ' +
  'millflood whorlwind moonbolt lurelight petalhex deepdew crownstorm grimroots belfrypeal rimewave whiteout wishwind umbralcorona arclash overload undertow splashjet downdraft ' +
  'frostbreath snowdrift blizzard sunbeam haloburst heatwave sandblast crescentsquall').split(' ').map(k => [k, 'e']));
const moveCat = id => MOVE_CAT[id] || 'p';

/* ---------- each Fablemon's own physical and elemental stats: [Attack, Defence, Elemental Attack, Elemental Defence] */
const SPLIT = {
  hedglet: [51, 60, 39, 60],
  cindimple: [63, 52, 57, 48],
  rillip: [44, 42, 46, 48],
  tusskip: [60, 44, 40, 36],
  whirplet: [48, 38, 42, 42],
  cloverclasp: [41, 60, 39, 60],
  flintuck: [67, 83, 43, 57],
  fuzzwick: [53, 31, 57, 38],
  duskwick: [44, 45, 66, 55],
  mortoad: [75, 92, 49, 64],
  brashlet: [78, 47, 62, 45],
  brooknook: [49, 41, 43, 47],
  briamble: [73, 86, 57, 86],
  kilnook: [90, 72, 82, 68],
  weirlet: [62, 59, 64, 67],
  fleecebolt: [91, 64, 59, 52],
  whirlwyn: [73, 55, 63, 61],
  cloverguard: [62, 88, 58, 88],
  flintburrow: [94, 116, 62, 80],
  staticwing: [77, 47, 83, 57],
  duskcloak: [65, 63, 95, 77],
  rampartoad: [109, 142, 71, 98],
  pyrebrash: [122, 72, 98, 68],
  brookstride: [76, 56, 68, 64],
  muddlebub: [45, 60, 55, 68],
  lotling: [39, 49, 49, 55],
  puffpiper: [49, 42, 59, 46],
  sundrowse: [47, 66, 37, 66],
  tipplecup: [69, 48, 59, 48],
  glimmerjel: [59, 38, 65, 46],
  logloom: [65, 63, 55, 77],
  puffpiper_cotton: [40, 49, 48, 51],
  fenfang: [70, 46, 66, 54],
  mirebellows: [56, 87, 68, 77],
  lotveil: [49, 60, 67, 64],
  reefarer: [66, 47, 74, 53],
  reefarer_cotton: [52, 70, 56, 74],
  yawnox: [58, 89, 54, 75],
  brimbramble: [84, 55, 76, 61],
  stormveil: [73, 48, 87, 56],
  hollowbark: [80, 86, 64, 94],
  marshviper: [104, 66, 104, 78],
  fulgarok: [138, 125, 92, 115],
  craglet: [75, 68, 49, 48],
  cindhop: [77, 55, 51, 45],
  bristlecone: [55, 60, 57, 64],
  clinkit: [46, 73, 42, 75],
  ramruff: [90, 64, 58, 52],
  craglet_2: [99, 79, 73, 69],
  cindhop_2: [106, 71, 70, 57],
  bristlecone_2: [77, 84, 79, 88],
  clinkit_2: [64, 103, 60, 105],
  ramruff_2: [133, 99, 87, 81],
  hedgerholt: [99, 115, 85, 115],
  hearthrusk: [135, 101, 103, 81],
  merewheel: [83, 83, 93, 93],
  plumevix: [111, 70, 73, 62],
  whorlcrest: [88, 66, 84, 74],
  cloverlegion: [84, 110, 72, 110],
  flintcairn: [111, 139, 73, 97],
  moonspark: [93, 54, 107, 74],
  duskwyrm: [87, 78, 121, 90],
  torrentail: [96, 68, 80, 76],
  reefarer_3: [87, 60, 97, 68],
  reefarer_cotton_3: [66, 94, 78, 98],
  mirebellows_3: [77, 110, 91, 98],
  lotveil_3: [67, 74, 93, 78],
  yawnox_3: [81, 113, 71, 95],
  brimbramble_3: [115, 68, 93, 76],
  stormveil_3: [95, 61, 113, 71],
  hollowbark_3: [98, 106, 90, 118],
  cindhop_3: [133, 84, 87, 68],
  bristlecone_3: [95, 105, 97, 111],
  clinkit_3: [83, 133, 81, 135],
  craglet_3: [124, 94, 88, 82],
  nipshade: [76, 66, 56, 78],
  nipshade_2: [105, 96, 75, 112],
  nipshade_3: [130, 116, 90, 136],
  riftshear: [76, 44, 68, 52],
  riftshear_2: [99, 57, 93, 67],
  riftshear_3: [126, 72, 118, 84],
  inkwick: [58, 46, 78, 62],
  inkwick_2: [76, 61, 103, 83],
  inkwick_3: [94, 78, 130, 106],
  kilnback: [54, 81, 70, 83],
  kilnback_2: [79, 106, 101, 110],
  kilnback_3: [103, 136, 121, 140],
  foilfin: [76, 43, 72, 49],
  foilfin_2: [99, 55, 93, 61],
  foilfin_3: [128, 72, 120, 80],
  floecalf: [62, 66, 58, 74],
  floecalf_2: [110, 106, 98, 118],
  kitlet: [65, 42, 75, 46],
  kitlet_2: [87, 55, 101, 61],
  kitlet_3: [118, 70, 126, 78],
  flurrowl: [59, 65, 65, 71],
  flurrowl_2: [77, 92, 83, 100],
  flurrowl_3: [102, 107, 114, 117],
  wishling: [53, 44, 71, 56],
  wishling_2: [73, 63, 99, 81],
  wishling_3: [94, 79, 130, 101],
  heathfoal: [85, 57, 75, 55],
  heathfoal_2: [128, 88, 108, 84],
};
for (const [sp, [a, d, ea, ed]] of Object.entries(SPLIT)) if (SPECIES[sp]) Object.assign(SPECIES[sp].base, { atk: a, def: d, eatk: ea, edef: ed });
for (const s of Object.values(SPECIES)) { if (s.base.eatk == null) s.base.eatk = s.base.atk; if (s.base.edef == null) s.base.edef = s.base.def; }

/* ---------- new moves in learnsets, and a same-type attack for dual types that had none */
const addLearn = (ids, list) => { for (const id of ids) if (LEARN[id]) { for (const e of list) if (!LEARN[id].some(([, m]) => m === e[1])) LEARN[id].push(e); LEARN[id].sort((a, b) => a[0] - b[0]); } };
const lineOf = first => { const out = []; let s = first; while (s && SPECIES[s]) { out.push(s); s = SPECIES[s].evo && SPECIES[s].evo[0]; } return out; };
const after = (first, n) => lineOf(first).slice(n);   // a line from its nth stage on
// Frost
addLearn(lineOf('floecalf'), [[30, 'hailstone'], [38, 'frostbreath'], [44, 'snowdrift'], [52, 'hoarfrost'], [58, 'blizzard']]);
addLearn(lineOf('flurrowl'), [[44, 'frostbreath'], [48, 'hailstone'], [56, 'snowdrift'], [60, 'hoarfrost'], [66, 'blizzard']]);
addLearn(['riftshear_3', 'foilfin_3'], [[56, 'frostbreath']]);
// Glow
addLearn(lineOf('fuzzwick'), [[34, 'sunbeam'], [42, 'haloburst'], [50, 'starfall']]);
addLearn(lineOf('clinkit'), [[30, 'shiningstrike'], [40, 'sunbeam'], [50, 'starfall'], [54, 'gleamrest']]);
addLearn(lineOf('inkwick'), [[40, 'sunbeam'], [48, 'haloburst'], [56, 'gleamrest']]);
addLearn(lineOf('wishling'), [[44, 'sunbeam'], [50, 'shiningstrike'], [58, 'haloburst'], [62, 'gleamrest'], [66, 'starfall']]);
// dual types missing (or weak in) their second type
addLearn(after('whirplet', 2), [[38, 'millrace'], [44, 'mirebellow']]);           // Whorlcrest: Tide
addLearn(after('sundrowse', 2), [[40, 'rockslide'], [46, 'landslide']]);           // Slumberdew: Stone
addLearn(after('logloom', 2), [[40, 'rootdrain'], [46, 'hedgecrash']]);            // Grimbark: Leaf
addLearn(after('duskwick', 2), [[42, 'windslice'], [50, 'galeforce']]);            // Duskwyrm: Gale
addLearn(after('tipplecup', 2), [[40, 'gloomgrip'], [46, 'phantomclaw']]);         // Pitchfiend: Shade
addLearn(after('puffpiper_cotton', 2), [[40, 'rootdrain'], [44, 'galeforce'], [48, 'petalhex']]);   // Deepfarer (Leaf/Gale)
addLearn(after('puffpiper', 2), [[44, 'galeforce']]);                              // Deepfarer (Tide/Gale)
addLearn(after('glimmerjel', 2), [[40, 'millrace'], [48, 'mirebellow']]);          // Stormcrown: Tide
addLearn(after('cindimple', 2), [[40, 'rockslide'], [46, 'landslide']]);           // Hearthrusk: Stone
addLearn(after('muddlebub', 2), [[42, 'landslide']]);                              // Mirelure: Stone
addLearn(after('tusskip', 2), [[40, 'bonfirekick'], [46, 'furnacefist']]);         // Plumevix: Ember
addLearn(after('bristlecone', 2), [[46, 'galeforce']]);                            // Pinewarden: Gale

// elemental boosting moves, given to Fablemon whose stats lean elemental (elemental attackers and elemental tanks)
addLearn(lineOf('lotling'), [[14, 'bloomward'], [30, 'sungather']]);
addLearn(lineOf('logloom'), [[20, 'bloomward']]);
addLearn(lineOf('puffpiper_cotton'), [[16, 'bloomward'], [32, 'sungather']]);
addLearn(lineOf('bristlecone'), [[24, 'bloomward'], [38, 'sungather']]);
addLearn(lineOf('kilnback'), [[30, 'heathaze'], [46, 'kindle']]);
addLearn(lineOf('cindimple'), [[20, 'heathaze'], [38, 'kindle']]);
addLearn(lineOf('rillip'), [[12, 'mistveil'], [28, 'moontide']]);
addLearn(lineOf('lotling'), [[22, 'moontide']]);
addLearn(lineOf('puffpiper'), [[22, 'moontide']]);
addLearn(lineOf('glimmerjel'), [[20, 'moontide'], [30, 'staticfocus']]);
addLearn(lineOf('muddlebub'), [[24, 'moontide'], [34, 'crystalshell']]);
addLearn(lineOf('whirplet'), [[20, 'mistveil'], [28, 'windchant']]);
addLearn(lineOf('brooknook'), [[16, 'mistveil']]);
addLearn(lineOf('floecalf'), [[34, 'mistveil'], [42, 'icemirror']]);
addLearn(lineOf('nipshade'), [[34, 'mistveil'], [44, 'crystalshell']]);
addLearn(lineOf('fenfang'), [[24, 'mistveil'], [34, 'nightfocus']]);
addLearn(lineOf('clinkit'), [[18, 'geodeward'], [36, 'crystalshell'], [44, 'radiantaura'], [52, 'prismward']]);
addLearn(lineOf('flintuck'), [[22, 'geodeward']]);
addLearn(lineOf('mortoad'), [[24, 'geodeward']]);
addLearn(lineOf('sundrowse'), [[22, 'geodeward'], [36, 'crystalshell']]);
addLearn(lineOf('craglet'), [[28, 'geodeward']]);
addLearn(lineOf('fuzzwick'), [[20, 'staticfocus'], [40, 'radiantaura']]);
addLearn(lineOf('riftshear'), [[40, 'staticfocus']]);
addLearn(lineOf('duskwick'), [[24, 'nightfocus'], [40, 'windchant']]);
addLearn(lineOf('inkwick'), [[38, 'nightfocus'], [44, 'radiantaura'], [52, 'prismward']]);
addLearn(lineOf('wishling'), [[40, 'windchant'], [48, 'radiantaura'], [56, 'prismward']]);
addLearn(lineOf('kitlet'), [[42, 'windchant']]);
addLearn(lineOf('flurrowl'), [[46, 'icemirror']]);

/* ---------- catch-up XP: a Fablemon 10 or more levels below the next Warden's ace learns 1.5x as fast */
const WARDEN_ORDER = ['root', 'brook', 'stone', 'spark', 'gale', 'hearth'];
const nextAce = () => { const k = WARDEN_ORDER.find(c => !(S.crests || {})[c]); return k ? WARDEN_ACE[k] : 100; };
const catchUp = m => m.lv <= nextAce() - 10 ? 1.5 : 1;

/* ---------- the move tutor: Old Wenna moves into the Lock Cottage in Brookholt once it's repaired */
const TUTOR = [
  ['Leaf', 'hedgecrash', 'rootdrain'], ['Ember', 'furnacefist', 'heatwave'], ['Tide', 'millrace', 'mirebellow'], ['Stone', 'rockslide', 'sandblast'],
  ['Gale', 'downdraft', 'galeforce'], ['Spark', 'boltwing', 'arclash'], ['Shade', 'gloomgrip', 'eclipse'], ['Glow', 'shiningstrike', 'prismbeam'],
  ['Frost', 'hailstone', 'frostbreath'], ['Wild', 'stampede', 'gallop']];
const TUTOR_PRICE = 2500;
function openTutor(sc) {
  let mon = null, typ = null;
  const render = () => {
    if (!mon) return `<p>A cheery old woman with a knitting basket of feathers and pebbles. "Wenna's the name. Moved in the day they fixed the roof. I teach Fablemon moves of <i>other</i> types, so nothing can wall them. ${TUTOR_PRICE}g a lesson. Who's learning?"</p>
      <div class="mlist">${team().map((m, i) => `<button class="btn" data-a="mon" data-i="${i}" style="display:block;width:100%;margin:4px 0;text-align:left"><img src="${monPicOf(m)}" style="width:28px;vertical-align:middle;image-rendering:pixelated"> ${monName(m)} <small>Lv ${m.lv} · ${typesOf(m.sp).join('/')}</small></button>`).join('')}</div>`;
    if (!typ) return `<p>What kind of move should <b>${monName(mon)}</b> learn? Each type has one physical and one elemental move.</p><div style="display:flex;gap:6px;flex-wrap:wrap">${TUTOR.map(([t]) => `<button class="btn sm" data-a="typ" data-t="${t}" style="background:${TYPES[t]};color:#fff">${t}</button>`).join('')}</div><div class="row" style="margin-top:8px"><button class="btn sm" data-a="back">Back</button></div>`;
    const [, p, e] = TUTOR.find(x => x[0] === typ);
    return `<p><b>${monName(mon)}</b> can learn one of these for <b>${TUTOR_PRICE}g</b> (you have ${S.gold}g). Physical moves use its Attack (${monStat(mon, 'atk')}), elemental moves its Elemental Attack (${monStat(mon, 'eatk')}).</p>${[p, e].map(id => moveCard(id, mon, mon.moves.includes(id) ? ' <small>(knows it)</small>' : '') + `<div class="row" style="margin:4px 0 10px"><button class="btn gold sm" data-a="teach" data-id="${id}" ${mon.moves.includes(id) || S.gold < TUTOR_PRICE ? 'disabled' : ''}>Teach ${MOVES[id].name}</button></div>`).join('')}<div class="row"><button class="btn sm" data-a="back">Back</button></div>`;
  };
  openModal("Wenna's Lessons", render(), async (a, d) => {
    if (a === 'mon') { mon = team()[+d.i]; typ = null; }
    else if (a === 'typ') typ = d.t;
    else if (a === 'back') { if (typ) typ = null; else mon = null; }
    else if (a === 'teach') {
      if (S.gold < TUTOR_PRICE || mon.moves.includes(d.id)) return;
      if (mon.moves.length >= 4) {
        const out = await new Promise(res => openModal('Forget a move?', `<p>${monName(mon)} already knows 4 moves. Which should it forget to learn <b>${MOVES[d.id].name}</b>?</p>${mon.moves.map((m, i) => `<button class="btn" data-a="f" data-i="${i}" style="display:block;width:100%;margin:4px 0">${MOVES[m].name} <small>${MOVES[m].type} · ${moveTag(m)}</small></button>`).join('')}<button class="btn sm" data-a="f" data-i="-1">Never mind</button>`, (x, dd) => res(+dd.i)));
        if (out < 0) return openTutor(sc);
        mon.moves.splice(out, 1, d.id);
      } else mon.moves.push(d.id);
      S.gold -= TUTOR_PRICE; updateHUD(); Sound.play('levelup'); toast(`${monName(mon)} learned ${MOVES[d.id].name}!`, 2200);
      return openTutor(sc);
    }
    $('mBody').innerHTML = render();
  });
}
const _bhDoor = bhDoor;
bhDoor = function (sc, id) {
  if (id === 'bh_cottage' && bhDone('bh_cottage')) { Sound.play('door'); return openTutor(sc); }
  return _bhDoor(sc, id);
};
