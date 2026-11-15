/* ============================================================ The new starters (the user's Starter Collection, 15 Nov 2026)
   Twirligig (Leaf/Gale), Wickid (Ember/Glow) and Splashkin (Tide/Wild) are the three Fablemon in the Hearthroot's roots now.
   Each line copies the old starter line it replaces (stats, moves, signature move, evolution levels, role), then
   gets a second type on every stage (the user asked for dual types) and a few attacks of that type, which take
   the place of its old off-type Stone attacks.
   The old starters (Hedglet, Cindimple, Rillip) are now rare finds in the Meadow Trail's long grass.
   Saves that already chose an old starter keep it. Art cut by tools/art/cut_starters.py (rows follow the push below). */
const STARTER_SWAP = {
  hedglet: ['samarrow', 'Twirligig', 'A playful seed spirit that hangs one-handed beneath a spinning sycamore seed. Its copper scarf streams behind it as it drifts over the hedgerows.'],
  briamble: ['samaslice', 'Rotorbough', 'Now light-footed enough to ride the seed, Rotorbough crouches over the hub and banks between branches by shifting its weight.'],
  hedgerholt: ['samarazor', 'Sicklewing', 'Armoured in seed husks, Sicklewing rides a four-bladed propeller and carries twin sycamore sickles. Its autumn-coloured mane folds back as it dives.'],
  cindimple: ['wickid', 'Wickid', 'A sly imp that hides its grin behind a beeswax cape. The golden flame on its braided tail tends to give away its hiding place.'],
  kilnook: ['wickveil', 'Wickveil', 'Wickveil opens its wax cloak like lantern shutters. The golden lining catches the light from its tail, making the little imp loom large at dusk.'],
  hearthrusk: ['solwick', 'Solwick', 'A living beacon crowned with amber reflectors. Solwick plants both feet and turns its wax mantle towards its tail flame, focusing the light through its great chest lens.'],
  rillip: ['rillcurl', 'Splashkin', 'A cheeky turquoise river drake with webbed feet and two blue stripes. Its tail rises into a foamy wave, and it loves to tumble downstream inside the curl.'],
  weirlet: ['riptwake', 'Washguard', 'Washguard braces its forefeet against the riverbed and draws its tail around one shoulder. The hollow breaker shields it until it lunges through the open curl.'],
  merewheel: ['maelstromaw', 'Torrentusk', 'An estuary guardian with a broad fanged muzzle and whitewater cheek fins. A whirlpool coils through its tail, ready to break forwards in one sweep.'],
};
const NEW_ID = Object.fromEntries(Object.entries(STARTER_SWAP).map(([o, [n]]) => [o, n]));
for (const [old, [id, name, desc]] of Object.entries(STARTER_SWAP)) {
  const s = JSON.parse(JSON.stringify(SPECIES[old]));
  s.name = name; s.desc = desc; if (s.evo) s.evo[0] = NEW_ID[s.evo[0]] || s.evo[0];
  SPECIES[id] = s;
  if (LEARN[old]) LEARN[id] = LEARN[old].map(r => [...r]);
  if (SIGNATURE[old]) SIGNATURE[id] = [...SIGNATURE[old]];
  if (MON_STAGE[old] !== undefined) MON_STAGE[id] = MON_STAGE[old];
  if (LINE_ROLE[old]) LINE_ROLE[id] = LINE_ROLE[old];
}
MON_ORDER.push('samarrow', 'samaslice', 'samarazor', 'wickid', 'wickveil', 'solwick', 'rillcurl', 'riptwake', 'maelstromaw');
STARTERS.splice(0, STARTERS.length, 'samarrow', 'wickid', 'rillcurl');
// the old three, now wild on the Meadow Trail (rare)
for (const [sp, d, n] of [['hedglet', 4, 2], ['cindimple', 4, 2], ['rillip', 4, 3]]) { ROUTES.route1.enc.day.push([sp, d]); ROUTES.route1.enc.night.push([sp, n]); EXTRA_HABITAT[sp] = 'Meadow Trail long grass (rare)'; }

// second types (all three stages) and attacks to go with them. LEARN rows are [level, move]; `swap` replaces a move.
const STARTER_TYPE2 = {
  samarrow: ['Gale', { add: [[7, 'swiftwing'], [24, 'flitaway']], swap: { rockslide: 'galeforce' }, last: [[50, 'skydive']] }],
  wickid: ['Glow', { add: [[7, 'glint']], swap: { rockroll: 'shiningstrike', rockslide: 'lumenpulse', slateslam: 'prismbeam', landslide: 'starfall' } }],
  rillcurl: ['Wild', { add: [[7, 'quickhop'], [32, 'pounce']], last: [[52, 'wildrush']] }],
};
for (const [first, [t2, M]] of Object.entries(STARTER_TYPE2)) {
  let id = first, i = 0;
  while (id && SPECIES[id]) {
    SPECIES[id].type2 = t2;
    let L = LEARN[id].map(([l, m]) => [l, (M.swap && M.swap[m]) || m]).concat(M.add || []);
    if (!SPECIES[id].evo) L = L.concat(M.last || []);
    const seen = new Set(); LEARN[id] = L.filter(([, m]) => !seen.has(m) && seen.add(m)).sort((a, b) => a[0] - b[0]);
    id = SPECIES[id].evo && SPECIES[id].evo[0]; i++;
  }
}
