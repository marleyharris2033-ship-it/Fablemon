/* ============================================================ Moves
   The full move list. Effects the battle engine understands:
   pow, acc (missing = never misses), prio (+ goes first, - goes last), st: [status, chance],
   stat: [who, stat, n] / stats: [[who, stat, n], ...] (status moves), boost: [who, stat, n, chance] (after a hit),
   recoil: n (takes 1/n of damage dealt), drain: share of damage healed, heal: share of max HP healed,
   rest, hits: [min, max], crit (high critical rate), flinch: chance, protect, weather: rain|sun|gloom,
   hazard (thorns on the foe's side), seed (drains 1/8 each turn), haze (clears all stat changes),
   cure (cures your whole team), hex (double power if the target has a status), hexSlp (double power if the target is asleep), desperate (double power
   below 1/3 HP), critUp (raises critical-hit rate), useDef (hits using the user's Defence), fixed: 'lv' (damage equal to the user's level), onlySleep, pivot (switch out after hitting).
   Later Fablemon pick from these, plus a signature move or two of their own. */
Object.assign(MOVES, {
  // ---- Wild
  brace: { name: 'Brace', type: 'Wild', protect: 1, prio: 4 },
  flurry: { name: 'Flurry', type: 'Wild', pow: 18, acc: 95, hits: [2, 5] },
  snackbreak: { name: 'Snack Break', type: 'Wild', heal: .5 },
  pounce: { name: 'Pounce', type: 'Wild', pow: 85, acc: 100, st: ['par', 30] },
  battlecry: { name: 'Battle Cry', type: 'Wild', stats: [['self', 'atk', 1], ['self', 'def', 1]] },
  laststand: { name: 'Last Stand', type: 'Wild', pow: 60, acc: 100, desperate: 1 },
  wildrush: { name: 'Wild Rush', type: 'Wild', pow: 120, acc: 90, recoil: 3 },
  curlnap: { name: 'Curl Up', type: 'Wild', rest: 1 },
  sharpen: { name: 'Sharpen', type: 'Wild', critUp: 2 },
  // ---- Leaf
  sapsip: { name: 'Sap Sip', type: 'Leaf', pow: 50, acc: 100, drain: .25 },
  seedleech: { name: 'Seed Leech', type: 'Leaf', seed: 1, acc: 90 },
  bramblespikes: { name: 'Bramble Spikes', type: 'Leaf', hazard: 'thorns' },
  sunsoak: { name: 'Sun Soak', type: 'Leaf', heal: .5, sunHeal: 1 },
  rootdrain: { name: 'Root Drain', type: 'Leaf', pow: 75, acc: 100, drain: .25 },
  calmingbloom: { name: 'Calming Bloom', type: 'Leaf', cure: 1 },
  overgrow: { name: 'Overgrow', type: 'Leaf', stats: [['self', 'atk', 1], ['self', 'def', 1]] },
  bloomburst: { name: 'Bloom Burst', type: 'Leaf', pow: 120, acc: 90, boost: ['self', 'atk', -2, 100] },
  // ---- Ember
  emberdash: { name: 'Ember Dash', type: 'Ember', pow: 40, acc: 100, prio: 1 },
  scorchmark: { name: 'Scorch Mark', type: 'Ember', acc: 85, st: ['brn', 100] },
  smoulder: { name: 'Smoulder', type: 'Ember', pow: 65, acc: 100, hex: 1 },
  stoke: { name: 'Stoke the Fire', type: 'Ember', stat: ['self', 'atk', 2] },
  sunflare: { name: 'Sunflare', type: 'Ember', weather: 'sun' },
  flarerush: { name: 'Flare Rush', type: 'Ember', pow: 120, acc: 100, recoil: 3, st: ['brn', 10] },
  // ---- Tide
  aquaflick: { name: 'Aqua Flick', type: 'Tide', pow: 40, acc: 100, prio: 1 },
  undertow: { name: 'Undertow', type: 'Tide', pow: 60, acc: 100, boost: ['foe', 'spd', -1, 100] },
  raincall: { name: 'Rain Call', type: 'Tide', weather: 'rain' },
  springsip: { name: 'Spring Sip', type: 'Tide', heal: .5 },
  boilspout: { name: 'Boil Spout', type: 'Tide', pow: 75, acc: 100, st: ['brn', 30] },
  soakup: { name: 'Soak Up', type: 'Tide', pow: 65, acc: 100, drain: .25 },
  tidedance: { name: 'Tide Dance', type: 'Tide', stats: [['self', 'atk', 1], ['self', 'spd', 1]] },
  tidalcrash: { name: 'Tidal Crash', type: 'Tide', pow: 110, acc: 85 },
  // ---- Stone
  pebblebarrage: { name: 'Pebble Barrage', type: 'Stone', pow: 25, acc: 90, hits: [2, 5] },
  scree: { name: 'Scree', type: 'Stone', hazard: 'stones' },
  bulwark: { name: 'Bulwark', type: 'Stone', protect: 1, prio: 4 },
  fortify: { name: 'Fortify', type: 'Stone', stat: ['self', 'def', 2] },
  rockslide: { name: 'Rockslide', type: 'Stone', pow: 75, acc: 90, flinch: 30 },
  flintedge: { name: 'Flint Edge', type: 'Stone', pow: 95, acc: 80, crit: 1 },
  rampartbash: { name: 'Rampart Bash', type: 'Stone', pow: 80, acc: 100, useDef: 1 },
  landslide: { name: 'Landslide', type: 'Stone', pow: 100, acc: 95, boost: ['self', 'spd', -1, 100] },
  // ---- Gale
  swiftwing: { name: 'Swift Wing', type: 'Gale', pow: 40, prio: 1 },
  featherdance: { name: 'Feather Dance', type: 'Gale', stat: ['foe', 'atk', -2] },
  flitaway: { name: 'Flit Away', type: 'Gale', pow: 60, acc: 100, pivot: 1 },
  updraft: { name: 'Updraft', type: 'Gale', stat: ['self', 'spd', 2] },
  windslice: { name: 'Wind Slice', type: 'Gale', pow: 75, acc: 95, flinch: 30 },
  perch: { name: 'Perch', type: 'Gale', heal: .5 },
  cyclone: { name: 'Cyclone', type: 'Gale', haze: 1 },
  skydive: { name: 'Sky Dive', type: 'Gale', pow: 120, acc: 100, recoil: 3 },
  // ---- Spark
  zapjab: { name: 'Zap Jab', type: 'Spark', pow: 40, acc: 100, prio: 1 },
  staticfield: { name: 'Static Field', type: 'Spark', acc: 90, st: ['par', 100] },
  circuithop: { name: 'Circuit Hop', type: 'Spark', pow: 60, acc: 100, pivot: 1 },
  chargeup: { name: 'Charge Up', type: 'Spark', stats: [['self', 'atk', 1], ['self', 'spd', 1]] },
  arclash: { name: 'Arc Lash', type: 'Spark', pow: 75, acc: 100, crit: 1, st: ['par', 10] },
  voltcrash: { name: 'Volt Crash', type: 'Spark', pow: 120, acc: 100, recoil: 3, st: ['par', 10] },
  overload: { name: 'Overload', type: 'Spark', pow: 130, acc: 90, boost: ['self', 'atk', -2, 100] },
  // ---- Shade
  shadestep: { name: 'Shade Step', type: 'Shade', pow: 40, acc: 100, prio: 1 },
  haunt: { name: 'Haunt', type: 'Shade', pow: 60, acc: 100, hex: 1 },
  gloaming: { name: 'Gloaming', type: 'Shade', weather: 'gloom' },
  dusktoll: { name: 'Dusk Toll', type: 'Shade', fixed: 'lv', acc: 100 },
  dreamsip: { name: 'Dream Sip', type: 'Shade', pow: 100, acc: 100, drain: .5, onlySleep: 1 },
  phantomclaw: { name: 'Phantom Claw', type: 'Shade', pow: 90, acc: 95, crit: 1 },
  darkpact: { name: 'Dark Pact', type: 'Shade', stats: [['self', 'atk', 2], ['self', 'def', -1]] },
});
// give the older strong moves a little more character
Object.assign(MOVES.headbutt, { flinch: 20 });
Object.assign(MOVES.gust, {});

/* ---------- learnsets: one tailored list per evolution line, shared by every form in it.
   Each line has a job. Some specialise hard, some are balanced; few cover every type. */
const LINES = {
  // Leaf starter, balanced bruiser: solid attacks, a little bulk, hazards later
  hedglet: [[1, 'tackle'], [1, 'growl'], [5, 'leafflick'], [9, 'bramblecurl'], [11, 'nettlesting'], [13, 'thornvolley'], [17, 'headbutt'], [20, 'brace'], [22, 'hedgecrash'], [26, 'pounce'], [30, 'bramblespikes'], [34, 'rootdrain'], [38, 'overgrow'], [42, 'rockslide'], [48, 'calmingbloom'], [54, 'bloomburst']],
  // Ember starter, slow wallbreaker: builds Attack, then hits very hard
  cindimple: [[1, 'tackle'], [1, 'growl'], [5, 'emberpuff'], [9, 'kilnguard'], [13, 'cinderslam'], [17, 'headbutt'], [20, 'brace'], [22, 'furnacefist'], [26, 'rockroll'], [30, 'stoke'], [34, 'smoulder'], [38, 'scorchmark'], [42, 'slateslam'], [48, 'sunflare'], [54, 'wildfire']],
  // Tide starter, fast rain attacker
  rillip: [[1, 'tackle'], [1, 'tailwhip'], [5, 'splashjet'], [9, 'rainveil'], [13, 'weirwave'], [17, 'aquaflick'], [20, 'brace'], [22, 'millrace'], [26, 'raincall'], [30, 'undertow'], [34, 'sapsip'], [38, 'tidedance'], [44, 'windslice'], [50, 'tidalcrash'], [56, 'springsip']],
  // Wild speedster that fishes for critical hits
  tusskip: [[1, 'tackle'], [1, 'tailwhip'], [4, 'quickhop'], [10, 'headbutt'], [16, 'flurry'], [20, 'brace'], [23, 'sharpen'], [28, 'emberdash'], [32, 'stampede'], [38, 'pounce'], [44, 'bonfirekick'], [50, 'wildrush'], [56, 'laststand']],
  // Gale scout: fast, hits and switches out, weakens attackers
  whirplet: [[1, 'peck'], [1, 'growl'], [5, 'gust'], [11, 'quickhop'], [14, 'hum'], [18, 'swiftwing'], [22, 'flitaway'], [26, 'featherdance'], [30, 'updraft'], [36, 'galeforce'], [42, 'windslice'], [48, 'shadestep'], [54, 'skydive']],
  // Leaf wall: raises Defence, plants seeds and spikes, heals the team
  cloverclasp: [[1, 'tackle'], [1, 'harden'], [5, 'leafflick'], [8, 'nettlesting'], [12, 'thornvolley'], [16, 'mosscloak'], [20, 'brace'], [24, 'seedleech'], [28, 'bramblespikes'], [32, 'sapsip'], [36, 'calmingbloom'], [40, 'rootdrain'], [46, 'curlnap']],
  // Stone hazard-setter and critical-hit striker
  flintuck: [[1, 'tackle'], [1, 'harden'], [5, 'pebbletoss'], [12, 'rockroll'], [18, 'scree'], [22, 'pebblebarrage'], [26, 'sharpen'], [30, 'pounce'], [34, 'slateslam'], [40, 'flintedge'], [46, 'mirejet'], [52, 'landslide']],
  // Spark sweeper: charges up, paralyses, then strikes fast
  fuzzwick: [[1, 'tackle'], [1, 'growl'], [5, 'staticbuzz'], [12, 'sparkdash'], [16, 'gust'], [20, 'zapjab'], [24, 'staticfield'], [28, 'chargeup'], [32, 'boltwing'], [38, 'windslice'], [44, 'arclash'], [50, 'overload']],
  // Shade trickster: sleep, then feed on dreams; gloom and curses
  duskwick: [[1, 'shadownip'], [1, 'moonglare'], [6, 'drowse'], [10, 'nightdrop'], [16, 'gust'], [20, 'haunt'], [24, 'gloaming'], [28, 'staticfield'], [32, 'dreamsip'], [38, 'eclipse'], [44, 'dusktoll'], [50, 'cyclone']],
  // Tide setup sweeper: dances, then strikes first
  brooknook: [[1, 'tackle'], [1, 'tailwhip'], [5, 'splashjet'], [9, 'quickhop'], [13, 'weirwave'], [18, 'aquaflick'], [22, 'tidedance'], [26, 'pounce'], [30, 'mirejet'], [36, 'flitaway'], [42, 'millrace'], [48, 'rockslide']],
  // Stone fortress: piles on Defence and hits with it
  mortoad: [[1, 'tackle'], [1, 'harden'], [5, 'pebbletoss'], [9, 'mosscloak'], [13, 'rockroll'], [17, 'fortify'], [22, 'rampartbash'], [26, 'sundewsnare'], [30, 'slateslam'], [34, 'curlnap'], [40, 'scree'], [46, 'rampartcrush'], [52, 'landslide']],
  // Ember speedster: fast, reckless, all offence
  brashlet: [[1, 'tackle'], [1, 'smokescreen'], [5, 'emberpuff'], [9, 'quickhop'], [13, 'bonfirekick'], [17, 'emberdash'], [22, 'cinderslam'], [26, 'rockroll'], [30, 'stoke'], [34, 'sunflare'], [40, 'flarerush'], [46, 'windslice'], [52, 'wildfire']],
  // Tide anchor: slows foes, sets rain and scree, patches itself up
  muddlebub: [[1, 'tackle'], [1, 'tailwhip'], [5, 'splashjet'], [9, 'mudslick'], [13, 'bogbubble'], [17, 'harden'], [21, 'mirejet'], [25, 'raincall'], [29, 'scree'], [33, 'springsip'], [38, 'soakup'], [44, 'rockslide'], [50, 'tidalcrash']],
  // Tide healer, balanced: keeps the team healthy
  lotling: [[1, 'tackle'], [1, 'growl'], [5, 'splashjet'], [9, 'rainveil'], [13, 'bogbubble'], [17, 'quickhop'], [21, 'springsip'], [25, 'sapsip'], [29, 'calmingbloom'], [33, 'undertow'], [38, 'soakup'], [44, 'staticfield'], [50, 'millrace']],
  // Puffpiper, Reed Form (Tide/Gale): a diver that calls rain and strikes from the water
  puffpiper: [[1, 'peck'], [1, 'growl'], [5, 'splashjet'], [10, 'gust'], [14, 'bogbubble'], [19, 'downdraft'], [23, 'raincall'], [27, 'flitaway'], [32, 'mirejet'], [38, 'windslice'], [44, 'perch'], [50, 'tidalcrash']],
  // Puffpiper, Cotton Form (Leaf/Gale): a disruptor. Sleep, Attack drops, seeds; clears your boosts away
  puffpiper_cotton: [[1, 'peck'], [1, 'growl'], [5, 'gust'], [10, 'hum'], [14, 'leafflick'], [19, 'downdraft'], [23, 'featherdance'], [27, 'sapsip'], [32, 'cyclone'], [36, 'seedleech'], [40, 'perch'], [46, 'windslice']],
  // Fenfang (Tide/Shade): an ambush striker. Strikes first, sharpens its fangs, then crits
  fenfang: [[1, 'shadownip'], [1, 'splashjet'], [6, 'mudslick'], [10, 'bogbubble'], [14, 'shadestep'], [18, 'haunt'], [22, 'aquaflick'], [26, 'mirejet'], [30, 'sharpen'], [34, 'gloomgrip'], [40, 'phantomclaw'], [46, 'boilspout'], [52, 'tidalcrash']],
  // Leaf staller: sleep, seeds, spikes and naps. Barely attacks at all
  sundrowse: [[1, 'tackle'], [1, 'mosscloak'], [5, 'leafflick'], [10, 'sporesnooze'], [15, 'sundewsnare'], [19, 'seedleech'], [24, 'bramblespikes'], [29, 'sunsoak'], [34, 'curlnap'], [40, 'calmingbloom'], [46, 'rootdrain']],
  // Leaf attacker: grows stronger and drains its prey
  tipplecup: [[1, 'leafflick'], [1, 'growl'], [6, 'nettlesting'], [11, 'sundewsnare'], [16, 'pitchergulp'], [20, 'sapsip'], [24, 'overgrow'], [28, 'shadestep'], [33, 'rootdrain'], [38, 'hedgecrash'], [44, 'bloomburst'], [50, 'rockslide']],
  // Spark status-spreader: paralyses everything, then haunts it
  glimmerjel: [[1, 'staticbuzz'], [1, 'growl'], [6, 'marshglow'], [11, 'wispshock'], [15, 'staticfield'], [19, 'haunt'], [24, 'sparkdash'], [30, 'bogbubble'], [36, 'arclash'], [42, 'boltwing'], [48, 'voltcrash']],
  // Shade wall: hides in its log, raises Defence, hits back with it
  logloom: [[1, 'shadownip'], [1, 'harden'], [6, 'moonglare'], [11, 'hollowknock'], [15, 'drowse'], [20, 'gloomgrip'], [24, 'fortify'], [28, 'haunt'], [33, 'curlnap'], [38, 'rampartbash'], [44, 'dusktoll'], [50, 'eclipse']],
};
const LINE_ROLE = { hedglet: 'Balanced bruiser: steady attacks, some bulk, thorns later', cindimple: 'Slow wallbreaker: builds Attack, then hits very hard', rillip: 'Rain attacker: fast, strikes first in the rain', tusskip: 'Critical-hit speedster', whirplet: 'Scout: hits and switches out, weakens attackers', cloverclasp: 'Wall: raises Defence, plants seeds and thorns, heals the team', flintuck: 'Hazard-setter and critical-hit striker', fuzzwick: 'Sweeper: charges up, paralyses, strikes fast', duskwick: 'Trickster: sleep, then feeds on dreams', brooknook: 'Setup sweeper: dances, then strikes first', mortoad: 'Fortress: piles on Defence and hits with it', brashlet: 'Reckless speedster: all offence', muddlebub: 'Anchor: slows foes, sets rain and scree', lotling: 'Healer: keeps the team healthy', puffpiper: 'Rain diver: calls rain and strikes from the water', puffpiper_cotton: 'Disruptor: sleep, Attack drops, clears boosts', sundrowse: 'Staller: sleep, seeds, thorns and naps', tipplecup: 'Attacker: grows stronger and drains its prey', glimmerjel: 'Status-spreader: paralyses, then haunts', logloom: 'Wall: raises Defence and hits back with it', fenfang: 'Ambush striker: strikes first, then lands critical hits' };
/* signature moves: only the evolved form learns these (on evolving, even if it evolves late) */
Object.assign(MOVES, {
  mirebellow: { name: 'Mire Bellow', type: 'Tide', pow: 85, acc: 95, boost: ['foe', 'spd', -1, 100] },
  lilyhex: { name: 'Lily Hex', type: 'Tide', pow: 70, acc: 100, hex: 1 },
  snorkeldive: { name: 'Snorkel Dive', type: 'Tide', pow: 75, acc: 100, pivot: 1 },
  fleecefall: { name: 'Fleecefall', type: 'Gale', pow: 80, acc: 100, useDef: 1 },
  dewslumber: { name: 'Dew Slumber', type: 'Leaf', pow: 85, acc: 90, st: ['slp', 20] },
  nectartrap: { name: 'Nectar Trap', type: 'Leaf', pow: 75, acc: 100, st: ['psn', 30] },
  stormlash: { name: 'Storm Lash', type: 'Spark', pow: 90, acc: 95, st: ['par', 20] },
  hollowgrasp: { name: 'Hollow Grasp', type: 'Shade', pow: 85, acc: 100, useDef: 1 },
  scaldspout: { name: 'Scald Spout', type: 'Tide', pow: 100, acc: 95, st: ['brn', 20] },
});
const SIGNATURE = { mirebellows: [27, 'mirebellow'], lotveil: [25, 'lilyhex'], reefarer: [26, 'snorkeldive'], reefarer_cotton: [26, 'fleecefall'], yawnox: [28, 'dewslumber'], brimbramble: [24, 'nectartrap'], stormveil: [26, 'stormlash'], hollowbark: [27, 'hollowgrasp'], marshviper: [40, 'scaldspout'] };
for (const sp of Object.keys(SPECIES)) {
  const L = LINES[baseOf(sp)]; if (!L) continue;
  LEARN[sp] = L.filter(([, id]) => MOVES[id]);
  if (SIGNATURE[sp]) LEARN[sp] = [...LEARN[sp], SIGNATURE[sp]].sort((a, b) => a[0] - b[0]);
}

/* ---------- swapping moves outside battle: any move a Fablemon has learned up to its level */
function openMoveSwap(m, back) {
  const pool = (LEARN[m.sp] || []).filter(([l]) => l <= m.lv).map(([, id]) => id).filter((id, i, a) => a.indexOf(id) === i);
  const rest = pool.filter(id => !m.moves.includes(id)); pool.length = 0; pool.push(...m.moves, ...rest);
  let pickd = m.moves.slice();
  const render = () => `<p class="hint">Choose up to 4 moves. Every move ${monName(m)} has learned so far is here, so you can build it for the fight ahead. <b>${pickd.length}/4</b> chosen.</p>
    <div class="mlist">${pool.map(id => `<div data-a="tog" data-id="${id}" style="cursor:pointer;${pickd.includes(id) ? 'outline:3px solid var(--gold);border-radius:10px' : 'opacity:.75'}">${moveCard(id, m, pickd.includes(id) ? ' <span class="newtag">IN</span>' : '')}</div>`).join('')}</div>
    <div class="row" style="display:flex;gap:6px;margin-top:8px"><button class="btn gold" data-a="save" ${pickd.length ? '' : 'disabled'}>Save moves</button><button class="btn" data-a="back">Back</button></div>`;
  openModal(`${monName(m)}'s moves`, render(), (a, d) => {
    if (a === 'tog') { if (pickd.includes(d.id)) pickd = pickd.filter(x => x !== d.id); else if (pickd.length < 4) pickd.push(d.id); else return toast('Take a move out first: 4 is the most a Fablemon can hold.', 1800); $('mBody').innerHTML = render(); return; }
    if (a === 'save') { m.moves = pickd.slice(); Sound.play('coin'); toast(`${monName(m)} is ready with its new moves!`, 1600); }
    if (a === 'save' || a === 'back') back ? back() : closeModal();
  });
}
